const express = require('express');
const router = express.Router();
const LocalObject = require('../models/local_object');
const unzipper = require('unzipper');
const fs = require('fs');
const helper = require('../services/helper_service');
const CONFIG = require('../config/config_loader');
const logger = require('../global/logger');
const gcode_helper = require('../services/gcode_helper_service');
const ultimaker_printer_adapter = require('../adapter/ultimaker_printer_adapter');
const Machine = require('../models/machine');
const publishStateMachine = require('../models/publish_state_machine');
const path = require('path');

const _ = require('lodash');
_.mapPick = function (objs, keys) {
    return _.map(objs, function (obj) {
        return _.pick(obj, keys)
    })
};


function deleteFile(path) {
    fs.unlink(path, (err) => {
        if (err) {
            logger.warn('[routes/local_objects] could not delete file after update failed');
        }
    });
}


router.get('/', function (req, res, next) {
    LocalObject.find(function (err, products) {
        if (err) {
            return next(err);
        }

        res.json(_.mapPick(products, ['id', 'name', 'description', 'createdAt', 'materials', 'machines']));
    })
});

router.post('/', require('../services/file_upload_handler'), function (req, res, next) {


    if (!req.file || !req.file.path) {
        return res.sendStatus(400);
    }

    const localObj = {
        name: req.body.title,
        createdAt: Date(),
        machines: [
            "adb4c297-45bd-437e-ac90-a33d0f24de7e",
            "adb4c297-45bd-437e-ac90-d25bc3b27968"
        ],
        state: "initial"
    };

    LocalObject.create(localObj, function (err, locObj) {
        if (err) return next(err);

        const stats = fs.statSync(req.file.path);
        const fileSizeInBytes = stats["size"];
        if (fileSizeInBytes === 0) {
            deleteFile(req.file.path);
            res.status(400);
            res.send("Size of uploaded file is 0 :(");
            return;
        }

        const fullUrl = helper.buildFullUrlFromRequest(req);
        res.set('Location', fullUrl + locObj["id"]);
        res.sendStatus(201);

        let gcode_filepath;
        let image_filepath;
        const filepath_components = path.parse(req.file.path);
        fs.createReadStream(req.file.path).pipe(unzipper.Parse()).on('entry', function (entry) {
            let fileName = entry.path;
            let type = entry.type; // 'Directory' or 'File'
            if (type === 'File' && fileName.endsWith('.gcode')) {
                gcode_filepath = CONFIG.FILE_DIR + '/'
                    + filepath_components.name
                    + ".gcode";
                entry.pipe(fs.createWriteStream(gcode_filepath));
            } else if (type === 'File' && fileName.endsWith('.png')) {
                image_filepath = CONFIG.FILE_DIR + '/'
                    + filepath_components.name
                    + ".png";
                entry.pipe(fs.createWriteStream(image_filepath));
            } else {
                entry.autodrain();
            }
        }).on('close', () => {
            deleteFile(req.file.path);
            locObj.gcode_filepath = gcode_filepath;
            locObj.image_filepath = image_filepath;
            LocalObject.findByIdAndUpdate(locObj._id, locObj, {new: true}, function (err, data) {
                    if (err) {
                        logger.fatal("Could not update local object", err);
                    } else {
                        gcode_helper.extractMaterials(data.gcode_filepath, function (err, materials) {
                            data.materials = materials;
                            LocalObject.findByIdAndUpdate(data._id, data, {new: true}, function (err, data2) {
                                if (err) {
                                    logger.fatal("Could not update local object", err);
                                } else {
                                    publishStateMachine.localObjectCreated(data2);
                                }

                            });
                        });
                    }
                }
            )
            ;
        });
    });
});

router.get('/:id', function (req, res, next) {
    LocalObject.findById(req.params.id, function (err, item) {
        if (err) {
            return next(err);
        }

        res.json(_.pick(item, ['id', 'name', 'description', 'createdAt', 'materials', 'machines']));
    })
});

router.delete('/:id', function (req, res, next) {
    LocalObject.findById(req.params.id, function (err, item) {
        if (err) {
            return next(err);
        }
        if (!item) {
            return res.sendStatus(404);
        }
        deleteFile(item.image_filepath);
        deleteFile(item.gcode_filepath);
        LocalObject.findByIdAndRemove(req.params.id, function (err, item) {
            if (err) {
                next(err);
            } else {
                res.sendStatus(200);
            }
        });
    })
});

router.patch('/:id', function (req, res, next) {
    LocalObject.findById(req.params.id, (err, localObject) => {
        if (err) {
            return res.status(500).send(err);
        } else if (!localObject) {
            return res.sendStatus(404);
        }
        for (let key in req.body) {
            if (key === 'name') {
                localObject.name = req.body[key]
            }
            else if (key === 'description') {
                localObject.description = req.body[key]
            }
        }
        localObject.save((err) => {
            if (err) {
                res.status(500).send(err);
            } else {

                res.json(_.pick(localObject, ['id', 'name', 'description', 'createdAt', 'materials', 'machines']));
            }
        })

    })
});


router.get('/:id/image', function (req, res, next) {
    LocalObject.findById(req.params.id, function (err, item) {
        if (err) {
            return next(err);
        }

        if (item && item.image_filepath) {
            res.sendFile(item.image_filepath);
        } else {
            res.sendStatus(400);
        }
    })
});

/**
 * Route to publish object on the marketplace. This does just upload the metadata and not the binary.
 * The body of the request must contain a json of following structure:
 * {
 *   title: string
 *   description: string
 *   licenseFee: number
 * }
 * @returns json containing the marketplace object id
 */
router.post('/:id/publish', function (req, res, next) {
    // find the object in the local database
    LocalObject.findById(req.params.id, function (err, localObject) {
        if (err) {
            return next(err);
        }
        if (!localObject) {
            return res.sendStatus(404);
        }
        if (localObject.state !== 'notPublished') {
            return res.status(405).send("The localobject is already in state " + localObject.state);
        }
        localObject.description = req.body.description;
        localObject.licenseFee = +req.body.licenseFee;
        localObject.name = req.body.title;
        localObject.save((err) => {
            if (!err) {
                publishStateMachine.publish(localObject);
                res.sendStatus(201);
            } else {
                res.status(500).send(err);
            }
        });
    })
});

router.post('/:id/publish/retry', function (req, res, next) {
    LocalObject.findById(req.params.id, function (err, localObject) {
        if (err) {
            return next(err);
        }
        if (!localObject) {
            return res.sendStatus(404);
        }
        publishStateMachine.retry(localObject);
        res.send(200);
    })
});
router.post('/:id/publish/reset', function (req, res, next) {
    LocalObject.findById(req.params.id, function (err, localObject) {
        if (err) {
            return next(err);
        }
        if (!localObject) {
            return res.sendStatus(404);
        }
        publishStateMachine.reset(localObject);
        res.send(200);
    })
});


router.post('/:id/print', function (req, res, next) {
    LocalObject.findById(req.params.id, function (err, object) {
        if (err) {
            return next(err);
        }
        if (!object) {
            return res.status(404).send("No local object with this id");
        }

        Machine.findById(req.body.machineId, function (err, machine) {
            if (err) {
                return res.next(err);
            }
            if (!machine) {
                return res.status(404).send("Machine not found");
            }
            if (!machine.auth_id && !machine.auth_key) {
                return res.status(405).send("not authenticated at the machine");
            }
            ultimaker_printer_adapter.uploadPrintjob(machine.hostname, machine.auth_id, machine.auth_key, object.name, object.gcode_filepath, function (err, data) {
                if (err) {
                    return res.status(500).send(data);
                }
                res.status(200);
                res.send(data);
            });

        });
    })

});


module.exports = router;