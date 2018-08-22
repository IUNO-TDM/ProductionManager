const EventEmitter = require('events').EventEmitter;
const util = require('util');
const logger = require('../global/logger');
const fs = require('fs');
const CONFIG = require('../config/config_loader');
const request = require('request');


function DownloadService() {
    this.downloads = {}
}

const downloadService = new DownloadService();
util.inherits(DownloadService, EventEmitter);

/**
 * Removes *.download files (unfinished downloads) from the CONFIG.FILE_DIR directory.
 * This function should only be called in the webserver startup sequence.
 */
DownloadService.prototype.purgeDownloadFiles = function () {
    const files = fs.readdirSync(CONFIG.FILE_DIR);
    for (let i = 0; i < files.length; i += 1) {
        const filePath = CONFIG.FILE_DIR + '/' + files[i];
        if (fs.statSync(filePath).isFile() && filePath.endsWith(".download")) {
            fs.unlinkSync(filePath)
        }
    }
};

DownloadService.prototype.getPath = function (downloadId) {
    if (!/^[0-9a-zA-Z\-]+$/.test(downloadId)) {
        throw "Not a valid objectid"
    }

    return CONFIG.FILE_DIR + '/' + downloadId + '.iunoum3'
};

DownloadService.prototype.getDownloadingPath = function (downloadId) {
    return this.getPath(downloadId) + ".download"
};

DownloadService.prototype.getDownloadState = function (downloadId) {
    let download = downloadService.downloads[downloadId];
    if (download) {
        return {
            id: download.id,
            state: download.state,
            bytesDownloaded: download.bytesDownloaded,
            bytesTotal: download.bytesTotal,
        }
    } else {
        let path = this.getPath(downloadId);
        if (fs.existsSync(path)) {
            const stats = fs.statSync(path);
            const fileSizeInBytes = stats.size;
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
};

DownloadService.prototype.downloadObjectBinary = function (objectId, productCode, options) {
    let downloadingPath = downloadService.getDownloadingPath(objectId);

    let outStream = fs.createWriteStream(downloadingPath);
    let req = request(options, function (err, r, binary) {
        if (err) {
            logger.crit(err)
        }
        let path = downloadService.getPath(objectId);
        fs.renameSync(downloadingPath, path);
        let state = downloadService.getDownloadState(objectId);
        downloadService.emit('state_change', state)
    });
    req.on('response', data => {
        const key = data.headers['key'];
        // decode base64 string into buffer
        const encryptedKeyBuffer = Buffer.from(key, 'base64');

        const productCodeBuffer = Buffer.alloc(4);
        productCodeBuffer.writeUInt32LE(productCode, 0);


        outStream.write(productCodeBuffer);
        outStream.write(encryptedKeyBuffer)
        // console.log("key: " + key)
    });
    req.pipe(outStream);
    downloadService.observeDownloadRequest(objectId, req)
};

DownloadService.prototype.observeDownloadRequest = function (downloadId, req) {
    const download = {
        id: downloadId,
        request: req,
        bytesTotal: -1,
        bytesDownloaded: 0,
        state: 'downloading'
    };
    this.downloads[downloadId] = download;
    req.on('response', data => {
        download.bytesTotal = +data.headers['content-length'];
        let state = downloadService.getDownloadState(downloadId);
        downloadService.emit('state_change', state)
    });
    req.on('data', chunk => {
        download.bytesDownloaded += chunk.length;
        let state = downloadService.getDownloadState(downloadId);
        downloadService.emit('state_change', state)
    });
    req.on('end', chunk => {
        delete this.downloads[downloadId]
    })
};

DownloadService.prototype.cancelDownload = function (downloadId) {
    download.request.abort()
};

module.exports = downloadService;