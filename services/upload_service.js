const EventEmitter = require('events').EventEmitter;
const util = require('util');
const logger = require('../global/logger');
const fs = require('fs');
const CONFIG = require('../config/config_loader');
const request = require('request');


function UploadService() {
    this.uploads = {}
}

const uploadService = new UploadService()
util.inherits(UploadService, EventEmitter);

// DownloadService.prototype.getPath = function (downloadId) {
//     if (!/^[0-9a-zA-Z\-]+$/.test(downloadId)) {
//         throw "Not a valid objectid"
//     }

//     let path = CONFIG.FILE_DIR + '/' + downloadId + '.iunoum3'
//     return path
// }

// DownloadService.prototype.getDownloadingPath = function (downloadId) {
//     var path = this.getPath(downloadId)
//     path += ".download"
//     return path
// }

UploadService.prototype.getUploadState = function (uploadId) {
    let upload = uploadService.uploads[uploadId]
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
//         let path = this.getPath(downloadId)
//         let downloadingPath = this.getDownloadingPath(downloadId)
//         if (fs.existsSync(path)) {
//             const stats = fs.statSync(path)
//             const fileSizeInBytes = stats.size
//             return {
//                 id: downloadId,
//                 state: 'ready',
//                 bytesDownloaded: fileSizeInBytes,
//                 bytesTotal: fileSizeInBytes,
//             }
//         } else {
//             return {
//                 id: downloadId,
//                 state: 'download_required',
//                 bytesDownloaded: -1,
//                 bytesTotal: -1,
//             }
//         }
//     }
}

// DownloadService.prototype.download = function (options, targetPath) {

// }

UploadService.prototype.uploadObjectBinary = function (objectId, path, options) {

    let req = request(options, function (err, response, data) {
        if (err) {
            logger.crit(err)
        }
        console.log("uploading done")
        // let path = downloadService.getPath(objectId)
        // fs.renameSync(downloadingPath, path)        
        let state = uploadService.getUploadState(objectId)
        state.state = 'ready' //FIXME: not the correct place to do
        uploadService.emit('state_change', state)
        delete uploadService.uploads[objectId] //FIXME: not the correct place to do
    })
    var form = req.form()
    const stats = fs.statSync(path)
    const fileSizeInBytes = stats.size
    var stream = fs.createReadStream(path)
    form.append('file', stream, {
        filename: objectId + '.iunoum3'
    })

    // req.on('response', data => {
    //     var key = data.headers['key']
    //     outStream.write(key)
    //     console.log("key: " + key)
    // })
    // req.pipe(outStream)
    uploadService.observeUploadRequest(objectId, req, fileSizeInBytes)
}

UploadService.prototype.observeUploadRequest = function (uploadId, req, bytesTotal) {
    var upload = {
        id: uploadId,
        request: req,
        bytesTotal: bytesTotal,
        bytesUploaded: 0,
        state: 'uploading'
    }
    this.uploads[uploadId] = upload
    req.on('drain', () => {
        upload.bytesUploaded = req.req.connection.bytesWritten
        // console.log(upload)
        let state = uploadService.getUploadState(uploadId)
        uploadService.emit('state_change', state)

        // var now = new Date().getTime();
        // while(new Date().getTime() < now + 25){ /* do nothing */ }
        // console.log("data received!")
    })
    req.on('end', chunk => {
        // delete this.uploads[uploadId]
        // let state = downloadService.getDownloadState(downloadId)
        // downloadService.emit('state_change', state)
    })
}

module.exports = uploadService;