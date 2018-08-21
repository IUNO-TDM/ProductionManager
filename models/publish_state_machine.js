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

const uploadService = require('../services/upload_service');

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
                    localObject.save((err) => {
                        const writeStream = fs.createWriteStream(tmpPath);
                        iunoEncryption.getEncryptionStream().pipe(writeStream);
                        writeStream.on('close', () => {

                            localObject.keyBundleB64 = iunoEncryption.getKeyBundleB64();
                            this.transition(localObject, "encrypted");
                        });
                    });


                });
            },
            encryptionProblem: function (localObject) {
                this.transition(localObject, "encryptionError")
            }
        },

        encryptionError: {
            reset: function (localObject) {
                this.transition(localObject, "intial");
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
                let components = localObject.machines;
                components = components.concat(localObject.materials);
                const objectData = {
                    components: components,
                    description: localObject.name,
                    licenseFee: localObject.licenseFee,
                    title: localObject.name,
                    backgroundColor: '#FFFFFF',
                    encryptedKey: localObject.keyBundleB64
                };
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
            retry: function (localObject) {
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
                this.transition(localObject, "uploadingImage");
            }
        },
        uploadingImage: {
            _onEnter: function(localObject) {

                if (fs.existsSync(localObject.image_filepath)) {
                    ams_adapter.uploadImage(localObject.marketplaceObjectId, localObject.image_filepath, (err, data) => {
                        if(err){
                            logger.warn("Error while uploading image", err);
                            this.transition(localObject, 'imageUploadError');
                        }else{

                            this.transition(localObject, 'imageUploaded');
                        }
                    });
                }else{
                    this.transition (localObject, 'uploading');
                }
            }
        },
        imageUploaded: {
            _onEnter: function(localObject) {
                this.transition (localObject, 'uploading');
            }
        },

        imageUploadError: {
            retry: function (localObject) {
                this.transition(localObject, "uploadingImage");
            },
            reset: function (localObject) {
                fs.unlinkSync(localObject.tempEncryptedFilePath);

                localObject.tempEncryptedFilePath = null;
                localObject.keyBundleB64 = null;
                this.transition(localObject, "intial");
            }
        },

        uploading: {
            _onEnter: function (localObject) {
                const uploadCallback = function (upload) {
                    if (upload.id === localObject.marketplaceObjectId) {
                        stateMachine.emit('upload_state_change', {
                            localObjectId: localObject.id,
                            state: upload.state,
                            bytesUploaded: upload.bytesUploaded,
                            bytesTotal: upload.bytesTotal,
                        })
                    }
                };
                uploadService.on('state_change', uploadCallback);
                ams_adapter.uploadFile(localObject.marketplaceObjectId, localObject.tempEncryptedFilePath, (err) => {

                    uploadService.removeListener('state_change', uploadCallback);
                    if (err) {
                        logger.warn(err);
                        this.transition(localObject, "uploadError")
                    } else {
                        fs.unlinkSync(localObject.tempEncryptedFilePath);
                        localObject.tempEncryptedFilePath = null;
                        localObject.save((err) => {
                            this.transition(localObject, "uploaded");
                        });
                    }
                });
            }
        },
        uploadError: {
            retry: function (localObject) {
                this.transition(localObject, "uploading");
            },
            reset: function (localObject) {
                fs.unlinkSync(localObject.tempEncryptedFilePath);

                localObject.tempEncryptedFilePath = null;
                localObject.keyBundleB64 = null;
                this.transition(localObject, "intial");
            }
        },

        uploaded: {
            _onEnter: function (localObject) {


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
    reset: function (localObject) {
        logger.debug("[publishStateMachine] reset called");
        this.handle(localObject, "reset")
    },
    retry: function (localObject) {
        logger.debug("[publishStateMachine] retry called");
        this.handle(localObject, "retry")
    }
});

module.exports = stateMachine;
