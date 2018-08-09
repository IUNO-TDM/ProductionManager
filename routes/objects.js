const express = require('express');
const router = express.Router();
const ams_adapter = require('../adapter/ams_adapter');
const common = require('tdm-common');

const Validator = require('express-json-validator-middleware').Validator;
const validator = new Validator({allErrors: true});
const validate = validator.validate;
const validation_schema = require('../schema/object_schema');
const encryption = require('../services/encryption_service');

router.get('/', validate({
    query: validation_schema.Object_Query,
    body: validation_schema.Empty
}), function (req, res, next) {
    const language = req.query['lang'] || 'en';
    const machines = req.query['machines'];
    const materials = req.query['materials'];

    ams_adapter.getAllObjects(language, machines, materials, (err, objects) => {

        if (err) {
            return next(err);
        }

        res.json(objects ? objects : [])

    })
});

router.post('/', function (req, res, next) {

    const gcode = 'BlaFasel'; //TODO: get the real gcode with fs.readFileSync(gcode_path, 'utf8');
    const encryptionResult = encryption.encryptData(gcode);

    var od = {}
    od.components = ["adb4c297-45bd-437e-ac90-a33d0f24de7e", "763c926e-a5f7-4ba0-927d-b4e038ea2735"];
    // od.encryptedBinary = "c2RmZ2hqa2zDtmhnZmRzeWZnaGpraGdmZHh5c2ZnaGprbGhnZmRzeWZnaGprbGpoZ2Zkc3lmZ2hqa2zDtmpoZ2ZkaGprbMO2amhnZmRzdG8=";
    // od.licenseType = 0
    od.description = "dfghjkl";
    od.licenseFee = 1;
    od.title = "Dies ist ein günstiges Teil";
    od.backgroundColor = "#777777";
    od.encryptedKey = encryptionResult.keyBundleB64;

    ams_adapter.saveObject(od, function (err, dataId) {

        ams_adapter.uploadFile(dataId, encryptionResult.encryptedFileBuffer, (err) => {
            if (err) {
                if (err.statusCode >= 500) {
                    return next(err);
                }
                return res.sendStatus(err.statusCode);

                //TODO: Following is example code for create a decryption bundle for the ultimaker
                const productCode = 12345; //TODO: get this from the actual object
                const decryptionBundle = encryption.createDecryptionBundle(
                    encryptionResult.keyBundleB64,
                    productCode,
                    encryptionResult.encryptedFileBuffer);
            }

            return res.sendStatus(201);
        })
    })
});

router.get('/:id/binary', validate({
    query: validation_schema.GetBinary_Query,
    body: validation_schema.Empty
}), function (req, res, next) {

    //TODO we need an offerid at this point
    ams_adapter.getBinaryForObjectWithId(req.params['id'], req.query['offerId'], (err, binary) => {
        if (err) {
            if (err.statusCode >= 500) {
                return next(err);
            }
            return res.sendStatus(err.statusCode);
        }

        res.json(binary);
    });
});


router.get('/:id/image', validate({
    query: validation_schema.Empty,
    body: validation_schema.Empty
}), function (req, res, next) {
    ams_adapter.getImageForObject(req.params['id'], (err, data) => {
        if (err) {
            next(err);
            return;
        }

        if (!data) {
            res.sendStatus(404);
            return;
        }

        res.set('Content-Type', data.contentType);
        res.send(data.imageBuffer);
    });
});


module.exports = router;