const EventEmitter = require('events').EventEmitter;
const util = require('util');
const logger = require('../global/logger');
const ams_adapter = require('../adapter/ams_adapter');
const fs = require('fs');
const CONFIG = require('../config/config_loader');
const request = require('request');


function DownloadService() {
    this.downloads = {}
}

const downloadService = new DownloadService()
util.inherits(DownloadService, EventEmitter);

/**
 * Removes *.download files (unfinished downloads) from the CONFIG.FILE_DIR directory.
 * This function should only be called in the webserver startup sequence.
 */
DownloadService.prototype.purgeDownloadFiles = function() {
    var files = fs.readdirSync(CONFIG.FILE_DIR);
    for (var i = 0; i < files.length; i += 1) {
        var filePath = CONFIG.FILE_DIR + '/' + files[i]
        if (fs.statSync(filePath).isFile() && filePath.endsWith(".download")) {
            fs.unlinkSync(filePath)
        }
    }
}

DownloadService.prototype.getPath = function (downloadId) {
    if (!/^[0-9a-zA-Z\-]+$/.test(downloadId)) {
        throw "Not a valid objectid"
    }

    let path = CONFIG.FILE_DIR + '/' + downloadId + '.iunoum3'
    return path
}

DownloadService.prototype.getDownloadingPath = function (downloadId) {
    var path = this.getPath(downloadId)
    path += ".download"
    return path
}

DownloadService.prototype.getDownloadState = function (downloadId) {
    let download = downloadService.downloads[downloadId]
    if (download) {
        return {
            id: download.id,
            state: download.state,
            bytesDownloaded: download.bytesDownloaded,
            bytesTotal: download.bytesTotal,
        }
    } else {
        let path = this.getPath(downloadId)
        let downloadingPath = this.getDownloadingPath(downloadId)
        if (fs.existsSync(path)) {
            const stats = fs.statSync(path)
            const fileSizeInBytes = stats.size
            return {
                id: downloadId,
                state: 'ready',
                bytesDownloaded: fileSizeInBytes,
                bytesTotal: fileSizeInBytes,
            }
        } else {
            return {
                id: downloadId,
                state: 'download_required',
                bytesDownloaded: -1,
                bytesTotal: -1,
            }
        }
    }
}

DownloadService.prototype.download = function (options, targetPath) {

}

DownloadService.prototype.downloadObjectBinary = function (objectId, options) {
    let downloadingPath = downloadService.getDownloadingPath(objectId)

    var outStream = fs.createWriteStream(downloadingPath);
    let req = request(options, function (err, r, binary) {
        if (err) {
            logger.crit(err)
        }
        let path = downloadService.getPath(objectId)
        fs.renameSync(downloadingPath, path)
        let state = downloadService.getDownloadState(objectId)
        downloadService.emit('state_change', state)
    })
    req.on('response', data => {
        var key = data.headers['key']
        outStream.write(key)
        console.log("key: " + key)
    })
    req.pipe(outStream)
    downloadService.observeDownloadRequest(objectId, req)
}

DownloadService.prototype.observeDownloadRequest = function (downloadId, req) {
    var download = {
        id: downloadId,
        request: req,
        bytesTotal: -1,
        bytesDownloaded: 0,
        state: 'downloading'
    }
    this.downloads[downloadId] = download
    req.on('response', data => {
        download.bytesTotal = +data.headers['content-length']
        let state = downloadService.getDownloadState(downloadId)
        downloadService.emit('state_change', state)
    })
    req.on('data', chunk => {
        download.bytesDownloaded += chunk.length
        let state = downloadService.getDownloadState(downloadId)
        downloadService.emit('state_change', state)

        // var now = new Date().getTime();
        // while(new Date().getTime() < now + 25){ /* do nothing */ }
        // console.log("data received!")
    })
    req.on('end', chunk => {
        // download.state = 'ready'
        delete this.downloads[downloadId]
        // let state = downloadService.getDownloadState(downloadId)
        // downloadService.emit('state_change', state)
    })
}

DownloadService.prototype.cancelDownload = function (downloadId) {
    download.request.abort()
}

// var self = {};
// self.downloadRequests = []

// self.downloadBinary = function (objectId, callback) {
//     console.log("Hallo!")
//     if (!/^[0-9a-zA-Z\-]+$/.test(objectId)) {
//         callback("Not a valid objectid")
//         return
//     }

//     let path = CONFIG.FILE_DIR + '/' + objectId + '.dat'
//     if (fs.existsSync(path)) {
//         callback("file already exists")
//         return
//     }

//     var dl = downloader.download(url, path)
//     dl.start()

//     self.downloadRequests.push({
//         id: objectId,
//         callback: callback
//     })

//     // console.log("Download handlers:")
//     // console.log(self.downloadRequests)
//     // console.log("------------------")

//     // console.log("GO")
//     ams_adapter.getBinaryForObjectWithId(objectId, (err, binary, key) => {
//         console.log("GO1")
//         if (err) {
//             console.log("GO2")
//             callback(err)
//             console.log("GO3")
//             return
//         } else {
//             console.log("1")
//             // fs.writeFile(path, key, function (err) {
//             //     if (!err) {
//             //         fs.appendFile(path, binary, function (err) {
//             //             console.log("2")
//             //             callback(err)
//             //             console.log("3")
//             //         })
//             //     }
//             // })
//             console.log("4")
//         }
//     })
// }

module.exports = downloadService;