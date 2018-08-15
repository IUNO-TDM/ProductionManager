var express = require('express');
var router = express.Router();
var mongoose = require('mongoose');
var LocalObject = require('../models/local_object');
var unzipper = require('unzipper');
const ams_adapter = require('../adapter/ams_adapter');
const fs = require('fs');
const helper = require('../services/helper_service');
const path = require('path');
const CONFIG = require('../config/config_loader');
const logger = require('../global/logger');
const gcode_helper = require('../services/gcode_helper_service');
const ultimaker_printer_adapter = require('../adapter/ultimaker_printer_adapter');
const Machine = require('../models/machine');
const IUNOm3Encryption = require('../services/iuno_m3_encryption');

var _ = require('lodash');
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

router.get('/:id', function (req, res, next) {
    LocalObject.findById(req.params.id, function (err, item) {
        if (err) {
            return next(err);
        }

        res.json(_.pick(item, ['id', 'name', 'description', 'createdAt', 'materials', 'machines']));
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
        const iunoEncryption = new IUNOm3Encryption()
        const filePath = localObject.gcode_filepath

        iunoEncryption.init(filePath).then(() => {
            const components = localObject.machines
            const objectData = {
                components: components,
                description: req.body.description,
                licenseFee: +req.body.licenseFee,
                title: req.body.title,
                backgroundColor: '#FFFFFF',
                encryptedKey: iunoEncryption.getKeyBundleB64()
            }
            ams_adapter.saveObject(objectData, (err, objectId) => {
                if (err) {
                    return res.sendStatus(404);
                }
                localObject.marketplaceObjectId = objectId
                localObject.save((error, savedObject) => {
                    if (error) {
                        return res.sendStatus(404);
                    }
                    logger.info('encrypting file...');

                    const tmpPath = path.resolve(`test/test_files/${objectId}.tmp`);
                    const writeStream = fs.createWriteStream(tmpPath);
                    iunoEncryption.getEncryptionStream().pipe(writeStream);
    
                    writeStream.on('close', () => {
                        logger.info('file encrypted.');

                        logger.info('start uploading...');
                        // ams.uploadFile(objectId, fs.createReadStream(tmpPath), (err) => {
                        //     if (err) {
                        //         return reject(err);
                        //     }
                        //     logger.info('[object_test] retrieving object');
                        //     ams.getObjectWithId(objectId, 'en', (err, printerObject) => {
                        //         if (err) {
                        //             return reject(err);
                        //         }
                        //         logger.info(printerObject);
    
                        //         if (
                        //             printerObject.id === objectId &&
                        //             printerObject.name === objectData.title &&
                        //             printerObject.description === objectData.description &&
                        //             printerObject.lib === objectData.licenseFee &&
                        //             printerObject.backgroundColor === objectData.backgroundColor
                        //         ) {
                        //             fulfill(true);
                        //         }
    
                        //         fulfill(false);
                        //     });
                        // });
                        res.send(objectId)
                    });    
                    // res.send(objectId)
                }) 
            })
        })
    })
})

router.post('/', require('../services/file_upload_handler'), function (req, res, next) {


    if (!req.file || !req.file.path) {
        return res.sendStatus(400);
    }

    var localObj = {
        name: req.body.title,
        createdAt: Date(),
        machines: [
            "adb4c297-45bd-437e-ac90-a33d0f24de7e",
            "adb4c297-45bd-437e-ac90-d25bc3b27968"
        ]
    };

    LocalObject.create(localObj, function (err, locObj) {
        if (err) return next(err);

        var stats = fs.statSync(req.file.path);
        var fileSizeInBytes = stats["size"];
        if (fileSizeInBytes === 0) {
            deleteFile(req.file.path);
            res.status(400);
            res.send("Size of uploaded file is 0 :(");
            return;
        }

        const fullUrl = helper.buildFullUrlFromRequest(req);
        res.set('Location', fullUrl + locObj["id"]);
        res.sendStatus(201);

        var gcode_filepath;
        var image_filepath;
        const filepath_components = path.parse(req.file.path);
        fs.createReadStream(req.file.path).pipe(unzipper.Parse()).on('entry', function (entry) {
            var fileName = entry.path;
            var type = entry.type; // 'Directory' or 'File'
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
            LocalObject.findByIdAndUpdate(locObj._id, locObj, { new: true }, function (err, data) {
                if (err) {
                    logger.fatal("Could not update local object", err);
                } else {
                    gcode_helper.extractMaterials(data.gcode_filepath, function (err, materials) {
                        data.materials = materials;
                        LocalObject.findByIdAndUpdate(data._id, data, { new: true }, function (err, data2) {
                            if (err) {
                                logger.fatal("Could not update local object", err);
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


router.post('/:id/print', function (req, res, next) {
    LocalObject.findById(req.params.id, function (err, object) {
        if (err) {
            return next(err);
        }
        if (!object) {
            return res.status(404), res.send("No local object with this id");
        }

        Machine.findById(req.body, function (err, machine) {
            if (err) {
                return res.next(err);
            }
            if (!machine) {
                return res.status(404), res.send("Machine not found");
            }
            if (!machine.auth_id && !machine.auth_key) {
                return res.status(405), res.send("not authenticated at the machine");
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