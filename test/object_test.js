const Promise = require('promise');
const CONFIG = require('../config/config_loader');
const uuid = require('uuid/v1');
const fs = require('fs');
const path = require('path');
const logger = require('../global/logger');
const self = {};


self.TestCreateObject = new Promise(function (fulfill, reject) {
    {

        const ams = require('../adapter/ams_adapter');
        const encryptionService = require('../services/encryption_service');
        const geoPath = 'test/test_files/model.gcode';

        logger.info('[object_test] reading gcode file into memory');
        const gcode = fs.readFileSync(path.resolve(geoPath), 'utf8');

        logger.info('[object_test] encrypting file');
        const encryptedData = encryptionService.encryptGCode(gcode);

        const objectData = {
            components: ["adb4c297-45bd-437e-ac90-a33d0f24de7e", "763c926e-a5f7-4ba0-927d-b4e038ea2735"],
            description: 'Automatically uploaded test object',
            licenseFee: 10000,
            title: `Test ${uuid()}`,
            backgroundColor: '#FFFFFF',
            encryptedKey: encryptedData.keyBundleB64
        };


        logger.info('[object_test] saving object');
        ams.saveObject(objectData, (err, objectId) => {
            if (err) {
                return reject(err);
            }
            logger.info('[object_test] uploading file');
            ams.uploadFile(objectId, encryptedData.fileBundle, (err) => {
                if (err) {
                    return reject(err);
                }
                logger.info('[object_test] retrieving object');
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

    }
});

module.exports = self;