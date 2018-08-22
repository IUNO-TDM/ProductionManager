const logger = require('../global/logger');

const multer = require('multer');
const uuid = require('uuid/v4');
const fs = require('fs');

const CONFIG = require('../config/config_loader');


if (!fs.existsSync(CONFIG.FILE_DIR)) {
    fs.mkdir(CONFIG.FILE_DIR, (err, bytesWritten, buffer) => {
        if (err) {
            logger.fatal("Error on creating file directory: ", err);
        }
    });
}
if (!fs.existsSync(CONFIG.TMP_DIR)) {
    fs.mkdir(CONFIG.TMP_DIR, (err, bytesWritten, buffer) => {
        if (err) {
            logger.fatal("Error on creating file directory: ", err);
        }
    });
}

const storage = multer.diskStorage({
    destination: function (req, file, callback) {
        callback(null, CONFIG.TMP_DIR)
    },
    filename: function (req, file, callback) {
        callback(null, uuid() + '.ufp');
    }
});


const filter = function (req, file, cb) {

    if (!file) {
        return cb(null, false);
    }
    if (file.fieldname !== 'file') {
        logger.warn('[file_upload_handler] upload attempt with wrong field name');
        return cb(new Error('Wrong field name for technology data upload'), false);
    }

    cb(null, true);
};


const upload = multer({
    storage: storage,
    fileFilter: filter,
    limits: {
        fileSize: 104857600,
        files: 1,
        fields: 8,
        headerPairs: 1
    }
});

module.exports = upload.single('file');