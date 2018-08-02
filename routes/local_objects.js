var express = require('express');
var router = express.Router();
var mongoose = require('mongoose');
var LocalObject = require('../models/local_object');
var unzipper = require('unzipper');
const fs = require('fs');
const helper = require('../services/helper_service');
const path = require('path');
const CONFIG = require('../config/config_loader');
const logger = require('../global/logger');
const gcode_helper = require('../services/gcode_helper_service');

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

        res.json(_.mapPick(products, ['_id', 'name', 'description', 'createdAt', 'materials', 'machines']));
    })
});

router.get('/:id', function (req, res, next) {
    LocalObject.findById(req.params.id, function (err, item) {
        if (err) {
            return next(err);
        }

        res.json(_.pick(item, ['_id', 'name', 'description', 'createdAt', 'materials', 'machines']));
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

router.delete('/:id', function (req, res, next){
    LocalObject.findById(req.params.id, function (err, item) {
        if (err) {
            return next(err);
        }
        if(!item){
            return res.sendStatus(404);
        }
        deleteFile(item.image_filepath);
        deleteFile(item.gcode_filepath);
        LocalObject.findByIdAndRemove(req.params.id, function (err,item){
           if(err){
               next(err);
           } else{
               res.sendStatus(200);
           }
        });
    })
});


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
        const fullUrl = helper.buildFullUrlFromRequest(req);
        res.set('Location', fullUrl + locObj["_id"]);
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
            LocalObject.findByIdAndUpdate(locObj._id, locObj, {new: true}, function (err, data) {
                    if (err) {
                        logger.fatal("Could not update local object", err);
                    } else {
                        gcode_helper.extractMaterials(data.gcode_filepath, function (err, materials) {
                            data.materials = materials;
                            LocalObject.findByIdAndUpdate(data._id, data, {new: true}, function (err, data2) {
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

module.exports = router;