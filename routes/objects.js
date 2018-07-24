var express = require('express');
var router = express.Router();
var ams_adapter = require('../adapter/ams_adapter');
const common = require('tdm-common');

const Validator = require('express-json-validator-middleware').Validator;
const validator = new Validator({allErrors: true});
const validate = validator.validate;
const validation_schema = require('../schema/object_schema');

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
    var od = {}
    od.components = ["adb4c297-45bd-437e-ac90-a33d0f24de7e","763c926e-a5f7-4ba0-927d-b4e038ea2735"];
    od.encryptedBinary = "c2RmZ2hqa2zDtmhnZmRzeWZnaGpraGdmZHh5c2ZnaGprbGhnZmRzeWZnaGprbGpoZ2Zkc3lmZ2hqa2zDtmpoZ2ZkaGprbMO2amhnZmRzdG8=";
    od.description = "dfghjkl";
    od.licenseFee = 10000000;
    od.title = "45rtzu8iokjhbj3";
    od.backgroundColor = "#777777";
    ams_adapter.saveObject(od, function (err, dataId) {


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


// router.post('/', validate({
//     query: validation_schema.Empty,
//     body: validation_schema.SaveObject_Body
// }), function (req, res, next) {
//
//
//     ams_adapter.saveObject(req.body, (err, objectId) => {
//
//         if (err) {
//             if (err.statusCode === 409) {
//                 res.status(409);
//                 return res.send('Already exists');
//             }
//             return next(err);
//         }
//
//         const fullUrl = helper.buildFullUrlFromRequest(req);
//         res.set('Location', fullUrl + '/api/objects/' + objectId);
//         res.status(201);
//         res.send('' + objectId);
//     });
// });

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