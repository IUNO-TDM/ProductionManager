const express = require('express');
const router = express.Router();
const ams_adapter = require('../adapter/ams_adapter');
const logger = require('../global/logger');
const Validator = require('express-json-validator-middleware').Validator;
const validator = new Validator({allErrors: true});
const validate = validator.validate;
const validation_schema = require('../schema/object_schema');
const encryption = require('../services/encryption_service');
const printerAdapter = require('../adapter/ultimaker_printer_adapter');
const Machine = require('../models/machine');
const Filter = require('../models/filter');
const downloadService = require('../services/download_service');
const objectHash = require('object-hash');

router.get('/', validate({
    query: validation_schema.Object_Query,
    body: validation_schema.Empty
}), function (req, res, next) {
    const getObjects = function (filter) {
        //we always load all objects and then filter here. (filtering at the marketplace is to limited)
        ams_adapter.getObjects(filter.lang, [], [], filter.purchased, (err, objects) => {
            if (err) {
                return next(err);
            }

            const filteredObjects = objects.filter(object => {
                //first check machine type:
                if (filter.machines && filter.machines.length > 0) {
                    let machineFit = false;
                    for (let i = 0; i < filter.machines.length; i++) {
                        if (machineFit) {
                            break;
                        }
                        for (let j = 0; j < object.machines.length; j++) {
                            if (object.machines[j].id === filter.machines[i]) {
                                machineFit = true;
                                break;
                            }
                        }
                    }
                    if (!machineFit) {
                        return false;
                    }
                }
                if (filter.materials && filter.materials.length > 0) {
                    for (let i = 0; i < object.materials.length; i++) {
                        let match = false;
                        for (let j = 0; j < filter.materials.length; j++) {
                            if (object.materials[i].id === filter.materials[j]) {
                                match = true;
                                break;
                            }
                        }
                        if (!match) {
                            return false;
                        }
                    }
                }


                return true;
            });
            res.json(filteredObjects ? filteredObjects : [])

        });
    };


    const filterId = req.query['filter'];

    Filter.findById(filterId, (err, filter) => {
        if (err) {
            logger.fatal("Problems getting filter", err);
            return res.sendStatus(400);
        } else {
            if (!filter) {
                res.status(404).send({message: "Filter not found"})
            } else {
                getObjects(filter);
            }
        }
    });
});

router.get('/:id', validate({
    query: validation_schema.GetObjectWithId_Query,
    body: validation_schema.Empty
}), function (req, res, next) {
    const language = req.query['lang'];
    ams_adapter.getObjectWithId(req.params['id'], language, (err, data) => {
        if (err) {
            next(err);
            return;
        }
        res.send(data)
    })
});

router.get('/:id/binary', validate({
    query: validation_schema.GetBinary_Query,
    body: validation_schema.Empty
}), function (req, res, next) {
    ams_adapter.downloadBinaryForObjectWithId(req.params['id'], (err, data) => {
        if (err) {
            next(err);
            return;
        }
        res.write("ENQUEUED")
    })
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

router.post('/:id/print', validate({
        query: validation_schema.Empty,
        body: validation_schema.PrintObject_Body
    }),
    (req, res, next) => {
        Machine.findById(req.body.machineId, (err, machine) => {
            if (err) {
                res.status(500).send(err);
            } else if (!machine) {
                res.sendStatus(404);
            } else if (!machine.auth_id || !machine.auth_key) {
                res.sendStatus(401);
            } else {
                if (downloadService.getDownloadState(req.params.id).state !== 'ready') {
                    res.status(403).send({message: 'the object is not yet downloaded'});
                } else {
                    const filepath = downloadService.getPath(req.params.id);
                    printerAdapter.uploadPrintjob(machine.hostname, machine.auth_id, machine.auth_key, req.params.id, filepath, (err, data) => {
                        if (err) {
                            res.status(500).send(err);
                        } else {
                            res.status(200).send(data);
                        }
                    })
                }
            }
        })
    });

router.post('/filters', validate({
    query: validation_schema.Empty,
    body: validation_schema.Filter_Body
}), (req, res, next) => {

    buildFullUrlFromRequest = function (req) {
        return req.protocol + '://' + req.get('host') + req.baseUrl + '/';
    };
    var body = req.body;
    const hash = objectHash(body);
    Filter.findById(hash, (err, foundFilter) => {
        if (err) {
            logger.fatal("Cannot find filter: ", err);
            return res.sendStatus(400);
        }
        if (foundFilter) {
            const fullUrl = buildFullUrlFromRequest(req);
            res.set('Location', fullUrl + 'filters/' + foundFilter._id);
            res.status(201);
            res.send('' + foundFilter._id);
        } else {
            body._id = hash;
            Filter.create(body, (err, filter) => {
                if (err) {
                    logger.error("Cannot create filter: ", err);
                    return res.sendStatus(400);
                }

                const fullUrl = buildFullUrlFromRequest(req);
                res.set('Location', fullUrl + 'filters/' + filter._id);
                res.status(201);
                res.send('' + filter._id);
            })
        }
    });

});

router.get('/filters/:id', (req, res, next) => {
    Filter.findById(req.params.id, (err, foundFilter) => {
        if (err) {
            logger.error("Cannot find filter: ", err);
            return res.sendStatus(400);
        }
        if (foundFilter) {
            res.send(foundFilter);
        } else {
            res.sendStatus(404);
        }
    });
});


module.exports = router;