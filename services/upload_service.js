const EventEmitter = require('events').EventEmitter;
const util = require('util');
const logger = require('../global/logger');
const fs = require('fs');
const request = require('request');


function UploadService() {
    this.uploads = {}
}

const uploadService = new UploadService();
util.inherits(UploadService, EventEmitter);

UploadService.prototype.getUploadState = function (uploadId) {
    let upload = uploadService.uploads[uploadId];
    if (upload) {
        return {
            id: upload.id,
            state: 'uploading',
            bytesUploaded: upload.bytesUploaded,
            bytesTotal: upload.bytesTotal,
        }
    } else {
        return {
            id: upload.id,
            state: 'unknown',
            bytesUploaded: -1,
            bytesTotal: -1,
        }
    }
};

UploadService.prototype.uploadObjectBinary = function (objectId, path, options, callback) {
    if (typeof(callback) !== 'function') {

        callback = function () {
            logger.info('Callback not registered');
        }
    }

    let req = request(options, function (err, response, data) {
        if (err) {
            logger.crit(err)
        }
        console.log("uploading done");
        let state = uploadService.getUploadState(objectId);
        state.state = 'ready'; //FIXME: not the correct place to do
        uploadService.emit('state_change', state);
        delete uploadService.uploads[objectId] //FIXME: not the correct place to do

        callback(err)
    });
    let form = req.form();
    const stats = fs.statSync(path);
    const fileSizeInBytes = stats.size;
    const stream = fs.createReadStream(path);
    form.append('file', stream, {
        filename: objectId + '.iunoum3'
    });

    uploadService.observeUploadRequest(objectId, req, fileSizeInBytes)
};

UploadService.prototype.observeUploadRequest = function (uploadId, req, bytesTotal) {
    const upload = {
        id: uploadId,
        request: req,
        bytesTotal: bytesTotal,
        bytesUploaded: 0,
        state: 'uploading'
    };
    this.uploads[uploadId] = upload;
    req.on('drain', () => {
        upload.bytesUploaded = req.req.connection.bytesWritten;
        let state = uploadService.getUploadState(uploadId);
        uploadService.emit('state_change', state)
    });
};

module.exports = uploadService;