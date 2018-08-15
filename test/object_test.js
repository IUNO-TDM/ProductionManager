const Promise = require('promise');
const CONFIG = require('../config/config_loader');
const uuid = require('uuid/v1');
const fs = require('fs');
const path = require('path');
const logger = require('../global/logger');
const self = {};
const IUNOm3Encryption = require('../services/iuno_m3_encryption');


self.TestCreateObject = new Promise(function (fulfill, reject) {
    {

        const ams = require('../adapter/ams_adapter');
        const geoPath = 'test/test_files/UM3_fucktopus.gcode';

        const iunoEncryption = new IUNOm3Encryption();
        iunoEncryption.init(geoPath).then(() => {


            const objectData = {
                components: ["adb4c297-45bd-437e-ac90-a33d0f24de7e", "763c926e-a5f7-4ba0-927d-b4e038ea2735"],
                description: 'Automatically uploaded test object',
                licenseFee: 10000,
                title: `Test ${uuid()}`,
                backgroundColor: '#FFFFFF',
                encryptedKey: iunoEncryption.getKeyBundleB64()
            };


            logger.info('[object_test] saving object');
            ams.saveObject(objectData, (err, objectId) => {
                if (err) {
                    return reject(err);
                }
                logger.info('[object_test] uploading file');

                const tmpPath = path.resolve(`test/test_files/${objectId}.tmp`);
                const writeStream = fs.createWriteStream(tmpPath);
                iunoEncryption.getEncryptionStream().pipe(writeStream);

                writeStream.on('close', () => {
                    ams.uploadFile(objectId, fs.createReadStream(tmpPath), (err) => {
                        if (err) {
                            return reject(err);
                        }
                        logger.info('[object_test] retrieving object');

                        fs.unlink(tmpPath);

                        ams.getObjectWithId(objectId, 'en', (err, printerObject) => {
                            if (err) {
                                return reject(err);
                            }
                            logger.info(printerObject);

                            if (
                                printerObject.id === objectId &&
                                printerObject.name === objectData.title &&
                                printerObject.description === objectData.description &&
                                printerObject.lib === objectData.licenseFee &&
                                printerObject.backgroundColor === objectData.backgroundColor
                            ) {
                                fulfill(true);
                            }

                            fulfill(false);
                        });
                    });
                });
            });
        });

    }
});

module.exports = self;