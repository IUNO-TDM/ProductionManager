/**
 * Created by liefersfl on 01.08.18.
 */

const machina = require('machina');
const logger = require('../global/logger');
const Order = require('../models/order');
const LocalObject = require('../models/local_object');

const IUNOm3Encryption = require('../services/iuno_m3_encryption');
const ams_adapter = require('../adapter/ams_adapter');
const fs = require('fs');
const path = require('path');

const stateMachine = new machina.BehavioralFsm({

    initialize: function (options) {
        // update order's state
        this.on("transition", function (data) {
            logger.info("[publishStateMachine] localObject = '" + data.client.id + "', state from = '" + data.fromState + "' to = '" + data.toState + "'.");
            if (data.fromState) {
                const localObject = data.client;
                localObject.state = data.toState;
                localObject.save((error, savedObject) => {
                    if (error) {

                    }
                })
            }
        });
    },

    namespace: "publish-states",

    initialState: "uninitialized",

    states: {
        uninitialized: {
            // if not initialized, go to order's internal state (the state stored in database)
            "*": function (localObject) {
                logger.info("[orderStateMachine] uninitialized order = '" + localObject.id + "', state = '" + localObject.state + "'.");
                this.deferUntilTransition(localObject);
                this.transition(localObject, localObject.state);
            }
        },

        initial: {
            _onEnter: function (localObject) {
                this.transition(localObject, "notPublished")
            }
        },


        notPublished: {
            publish: function (localObject) {
                this.transition(localObject, "encrypting");
            }
        },

        encrypting: {
            _onEnter: function (localObject) {
                const iunoEncryption = new IUNOm3Encryption();
                const filePath = localObject.gcode_filepath;
                iunoEncryption.init(filePath).then(() => {
                    const tmpPath = path.resolve(`tmp/${localObject.id}.tmp`);

                    if (fs.existsSync(tmpPath)) {
                        logger.info("File for encryption already existed. Deleting...");
                        fs.unlinkSync(tmpPath);
                        logger.info(tmpPath + " deleted!");
                    }
                    localObject.tempEncryptedFilePath = tmpPath;
                    localObject.save();

                    const writeStream = fs.createWriteStream(tmpPath);
                    iunoEncryption.getEncryptionStream().pipe(writeStream);
                    writeStream.on('close', () => {

                        localObject.keyBundleB64 = iunoEncryption.getKeyBundleB64();
                        this.transition(localObject, "encrypted");
                    });
                });
            },
            encryptionProblem: function (localObject) {
                this.transition(localObject, "encryptionError")
            }
        },

        encryptionError: {
            encryptForUpload: function (localObject) {
                this.transition(localObject, "encrypting");
            }
        },

        encrypted: {
            _onEnter: function (localObject) {
                this.transition(localObject, "creatingTdmObject")
            }
        },
        creatingTdmObject: {
            _onEnter: function (localObject) {
                //posting here
                const components = localObject.machines;
                const objectData = {
                    components: components,
                    description: localObject.name,
                    licenseFee: localObject.licenseFee,
                    title: localObject.name,
                    backgroundColor: '#FFFFFF',
                    encryptedKey: localObject.keyBundleB64
                };
                if (fs.existsSync(localObject.image_filepath)) {
                    objectData.image = fs.readFileSync(localObject.image_filepath, 'utf-8')
                }
                ams_adapter.saveObject(objectData, (err, objectId) => {
                    if (err) {
                        this.transition(localObject, "tdmObjectCreateError");
                    } else {
                        localObject.marketplaceObjectId = objectId;
                        localObject.save((error, savedObject) => {
                            this.transition(localObject, "tdmObjectCreated");
                        })
                    }
                });


            }
        },
        tdmObjectCreateError: {
            retryObjectCreate: function (localObject) {
                this.transition(localObject, "creatingTdmObject");
            },
            reset: function (localObject) {
                fs.unlinkSync(localObject.tempEncryptedFilePath);

                localObject.tempEncryptedFilePath = null;
                localObject.keyBundleB64 = null;
                this.transition(localObject, "intial");
            }

        },
        tdmObjectCreated: {
            _onEnter: function (localObject) {
                this.transition(localObject, "uploading");
            }
        },

        uploading: {
            _onEnter: function (localObject) {
                ams_adapter.uploadFile(localObject.marketplaceObjectId, localObject.tempEncryptedFilePath, (err) => {
                    if (err) {
                        logger.warn(err);
                        this.transition(localObject, "uploadError")
                    } else {
                        this.transition(localObject, "uploaded");
                    }
                });
            }
        },
        uploadError: {
            startUpload: function (localObject) {
                this.transition(localObject, "uploading");
            }
        },

        uploaded: {
            _onEnter: function (localObject) {

                fs.unlinkSync(localObject.tempEncryptedFilePath);
                localObject.tempEncryptedFilePath = null;
                localObject.save();
            }
        }
    },

    localObjectCreated: function (localObject) {
        targetState = localObject.state;
        this.handle(localObject, targetState)
    },
    publish: function (localObject) {
        logger.debug("[publishStateMachine] publish called");
        this.handle(localObject, "publish")
    },
    encryptForUpload: function (localObject) {
        logger.debug("[publishStateMachine] encryptForUpload called");
        this.handle(localObject, "encryptForUpload")
    },
    encryptionProblem: function (localObject) {
        logger.debug("[publishStateMachine] encryptionProblem called");
        this.handle(localObject, "encryptionProblem")
    },
    startUpload: function (localObject) {
        logger.debug("[publishStateMachine] startUpload called");
        this.handle(localObject, "startUpload")
    },
    retryObjectCreate: function (localObject) {
        logger.debug("[publishStateMachine] retryObjectCreate called");
        this.handle(localObject, "retryObjectCreate")
    },
    reset: function (localObject) {
        logger.debug("[publishStateMachine] reset called");
        this.handle(localObject, "reset")
    }
});

module.exports = stateMachine;
