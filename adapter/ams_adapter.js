/**
 * Created by gorergch on 12.07.18.
 */

const self = {};
const request = require('request');

const logger = require('../global/logger');
const CONFIG = require('../config/config_loader');
const helper = require('../services/helper_service');
const common = require('tdm-common');
const authServer = require('./auth_service_adapter');
const DownloadService = require('../services/download_service')
const fs = require('fs');


function buildOptionsForRequest(method, protocol, host, port, path, qs, callback) {

    authServer.getAccessToken(function (err, token) {

        if (err) {
            logger.crit(err);
        }

        callback(err, {
            method: method,
            url: protocol + '://' + host + ':' + port + path,
            qs: qs,
            json: true,
            headers: {
                'Authorization': 'Bearer ' + (token ? token.accessToken : ''),
                'Content-Type': 'application/json'
            }
        });
    })
}

// self.downloads = []

self.getAllMachines = function (language, callback) {

    if (typeof(callback) !== 'function') {

        callback = function () {
            logger.info('Callback not registered');
        }
    }

    buildOptionsForRequest(
        'GET',
        CONFIG.HOST_SETTINGS.ADDITIVE_MACHINE_SERVICE.PROTOCOL,
        CONFIG.HOST_SETTINGS.ADDITIVE_MACHINE_SERVICE.HOST,
        CONFIG.HOST_SETTINGS.ADDITIVE_MACHINE_SERVICE.PORT,
        '/machines',
        {
            lang: language
        }, function (err, options) {
            request(options, function (e, r, jsonData) {
                const err = logger.logRequestAndResponse(e, options, r, jsonData);

                callback(err, jsonData);
            });
        }
    );


};

self.getAllMaterials = function (language, callback) {

    if (typeof(callback) !== 'function') {

        callback = function () {
            logger.info('Callback not registered');
        }
    }

    buildOptionsForRequest(
        'GET',
        CONFIG.HOST_SETTINGS.ADDITIVE_MACHINE_SERVICE.PROTOCOL,
        CONFIG.HOST_SETTINGS.ADDITIVE_MACHINE_SERVICE.HOST,
        CONFIG.HOST_SETTINGS.ADDITIVE_MACHINE_SERVICE.PORT,
        '/materials',
        {
            lang: language
        }, function (err, options) {
            request(options, function (e, r, jsonData) {
                const err = logger.logRequestAndResponse(e, options, r, jsonData);

                callback(err, jsonData);
            });
        }
    );


};

/**
 * Asynchronously requests object information from marketplace matching one of the filter criteria. Calls the callback function after information was received or an error has occured.
 * @param language target language for information like materials etc.
 * @param machines array of machine identifiers. Objects matching at least one of the machines are returned.
 * @param materials array of material identifiers. Objects matching at least one of the materials are returned.
 * @param purchased boolean value. If true, only purchased objects are returned.
 * @param callback function called after object information is retrived from marketplace. The callback must be of type (error, objects).
 * @returns void
 */
self.getObjects = function (language, machines, materials, purchased, callback) {
    if (typeof(callback) !== 'function') {
        callback = function () {
            logger.info('Callback not registered')
        }
    }

    var queryParams = {}
    queryParams['machines'] = machines
    queryParams['materials'] = materials
    queryParams['purchased'] = purchased
    queryParams['lang'] = language

    buildOptionsForRequest(
        'GET',
        CONFIG.HOST_SETTINGS.ADDITIVE_MACHINE_SERVICE.PROTOCOL,
        CONFIG.HOST_SETTINGS.ADDITIVE_MACHINE_SERVICE.HOST,
        CONFIG.HOST_SETTINGS.ADDITIVE_MACHINE_SERVICE.PORT,
        '/objects', 
        queryParams,
        function (err, options) {
            request(options, function (e, r, jsonData) {
                const err = logger.logRequestAndResponse(e, options, r, jsonData);
                callback(err, jsonData);
            });
        }
    );
};

self.downloadBinaryForObjectWithId = function (objectId, callback) {
    if (typeof(callback) !== 'function') {
        callback = function () {
            logger.info('Callback not registered')
        }
    }

    buildOptionsForRequest(
        'GET',
        CONFIG.HOST_SETTINGS.ADDITIVE_MACHINE_SERVICE.PROTOCOL,
        CONFIG.HOST_SETTINGS.ADDITIVE_MACHINE_SERVICE.HOST,
        CONFIG.HOST_SETTINGS.ADDITIVE_MACHINE_SERVICE.PORT,
        `/objects/${objectId}/binary`,
        {},
        function (err, options) {
            DownloadService.downloadObjectBinary(objectId, options)
            // var outStream = fs.createWriteStream(path);
            // let req = request(options, function (err, r, binary) {
            //     var key = null
            //     if (err) {
            //         logger.crit(err)
            //     }
            //     callback(err, binary, key)
            // })
            // req.on('response', data => {
            //     var key = data.headers['key']
            //     outStream.write(key)
            //     console.log("key: " + key)
            // })
            // req.pipe(outStream)

            // console.log("-------------------")
            // console.log(DownloadService)
            // console.log("-------------------")
            // DownloadService.observeDownloadRequest(objectId, req)
            // req.on('data', chunk => {
            //     // console.log("data received!")
            // })
            // req.on('end', chunk => {
            //     console.log("done!")
            // })
        }
    )
}

self.saveObject = function (objectData, callback) {
    if (typeof(callback) !== 'function') {
        callback = function () {
            logger.info('Callback not registered')
        }
    }

    buildOptionsForRequest(
        'POST',
        CONFIG.HOST_SETTINGS.ADDITIVE_MACHINE_SERVICE.PROTOCOL,
        CONFIG.HOST_SETTINGS.ADDITIVE_MACHINE_SERVICE.HOST,
        CONFIG.HOST_SETTINGS.ADDITIVE_MACHINE_SERVICE.PORT,
        '/objects',
        {}, function (err, options) {
            options.body = objectData;

            request(options, function (e, r, jsonData) {
                const err = logger.logRequestAndResponse(e, options, r, jsonData)

                if (err) {
                    return callback(err)
                }
                let objectId = null

                if (r.headers['location']) {
                    objectId = r.headers['location'].substr(r.headers['location'].lastIndexOf('/') + 1)
                }
                callback(err, objectId)
            })
        }
    )
}

self.getImageForObject = function (objectid, callback) {
    if (typeof(callback) !== 'function') {

        callback = function () {
            logger.info('Callback not registered');
        }
    }

    buildOptionsForRequest(
        'GET',
        CONFIG.HOST_SETTINGS.ADDITIVE_MACHINE_SERVICE.PROTOCOL,
        CONFIG.HOST_SETTINGS.ADDITIVE_MACHINE_SERVICE.HOST,
        CONFIG.HOST_SETTINGS.ADDITIVE_MACHINE_SERVICE.PORT,
        '/objects/' + objectid + '/image',
        {}, function (err, options) {
            options.encoding = null;

            request(options, function (e, r, data) {
                const err = logger.logRequestAndResponse(e, options, r, data);

                callback(err, {
                    imageBuffer: data,
                    contentType: r ? r.headers['content-type'] : null
                });
            });
        }
    );

};

self.createOfferForRequest = function (offerRequest, callback) {
    if (typeof(callback) !== 'function') {

        callback = function () {
            logger.info('Callback not registered');
        }
    }

    buildOptionsForRequest(
        'POST',
        CONFIG.HOST_SETTINGS.ADDITIVE_MACHINE_SERVICE.PROTOCOL,
        CONFIG.HOST_SETTINGS.ADDITIVE_MACHINE_SERVICE.HOST,
        CONFIG.HOST_SETTINGS.ADDITIVE_MACHINE_SERVICE.PORT,
        '/offers',
        {}, function (err, options) {
            options.body = offerRequest;

            request(options, function (e, r, jsonData) {
                const err = logger.logRequestAndResponse(e, options, r, jsonData);

                if (err) {
                    return callback(err);
                }

                callback(err, jsonData);
            });
        }
    );

};

self.requestLicenseUpdate = function(order, callback) {
    if (typeof(callback) !== 'function') {
        return logger.info('[ADDITIVE_MACHINE_SERVICE_adapter] Callback not registered');
    }

    if (!order) {
        return logger.info('[ADDITIVE_MACHINE_SERVICE_adapter] missing function arguments');
    }

    buildOptionsForRequest(
        'POST',
        CONFIG.HOST_SETTINGS.ADDITIVE_MACHINE_SERVICE.PROTOCOL,
        CONFIG.HOST_SETTINGS.ADDITIVE_MACHINE_SERVICE.HOST,
        CONFIG.HOST_SETTINGS.ADDITIVE_MACHINE_SERVICE.PORT,
        '/offers/' + order.offer.id + '/request_license_update',
        {}, function (err, options) {
            options.body = {
                hsmId: order.hsmId
            };
            request(options, function (e, r, jsonData) {
                const err = logger.logRequestAndResponse(e, options, r, jsonData);
                callback(err);
            });
        }
    );
}

self.getLicenseUpdate = function (hsmId, context, callback) {
    if (typeof(callback) !== 'function') {
        return logger.info('[ADDITIVE_MACHINE_SERVICE_adapter] Callback not registered');
    }

    if (!hsmId || !context) {
        return logger.info('[ADDITIVE_MACHINE_SERVICE_adapter] missing function arguments');
    }

    buildOptionsForRequest(
        'POST',
        CONFIG.HOST_SETTINGS.ADDITIVE_MACHINE_SERVICE.PROTOCOL,
        CONFIG.HOST_SETTINGS.ADDITIVE_MACHINE_SERVICE.HOST,
        CONFIG.HOST_SETTINGS.ADDITIVE_MACHINE_SERVICE.PORT,
        '/cmdongle/' + hsmId + '/update',
        {}, function (err, options) {

            options.body = {
                RAC: context
            };

            request(options, function (e, r, jsonData) {
                const err = logger.logRequestAndResponse(e, options, r, jsonData);

                let rau = null;
                let isOutOfDate = false;
                if (jsonData) {
                    rau = jsonData['RAU'];
                    isOutOfDate = jsonData['isOutOfDate']
                }

                callback(err, rau, isOutOfDate);
            });
        }
    );


};

self.confirmLicenseUpdate = function (hsmId, context, callback) {
    if (typeof(callback) !== 'function') {
        return logger.info('[ADDITIVE_MACHINE_SERVICE_adapter] Callback not registered');
    }

    if (!hsmId || !context) {
        return logger.info('[ADDITIVE_MACHINE_SERVICE_adapter] missing function arguments');
    }

    buildOptionsForRequest(
        'POST',
        CONFIG.HOST_SETTINGS.ADDITIVE_MACHINE_SERVICE.PROTOCOL,
        CONFIG.HOST_SETTINGS.ADDITIVE_MACHINE_SERVICE.HOST,
        CONFIG.HOST_SETTINGS.ADDITIVE_MACHINE_SERVICE.PORT,
        '/cmdongle/' + hsmId + '/update/confirm',
        {}, function (err, options) {

            options.body = {
                RAC: context
            };

            request(options, function (e, r, jsonData) {
                const err = logger.logRequestAndResponse(e, options, r, jsonData);

                let rau = null;
                let isOutOfDate = false;
                if (jsonData) {
                    rau = jsonData['RAU'];
                    isOutOfDate = jsonData['isOutOfDate']
                }

                callback(err, rau, isOutOfDate);
            });
        }
    );

};

self.getUserForId = function (userId, callback) {
    if (typeof(callback) !== 'function') {

        callback = function () {
            logger.info('Callback not registered');
        }
    }

    buildOptionsForRequest(
        'GET',
        CONFIG.HOST_SETTINGS.ADDITIVE_MACHINE_SERVICE.PROTOCOL,
        CONFIG.HOST_SETTINGS.ADDITIVE_MACHINE_SERVICE.HOST,
        CONFIG.HOST_SETTINGS.ADDITIVE_MACHINE_SERVICE.PORT,
        '/users/' + userId,
        {}, function (err, options) {
            request(options, function (e, r, jsonData) {
                const err = logger.logRequestAndResponse(e, options, r, jsonData);

                callback(err, jsonData);
            });
        }
    );

};

self.getImageForUser = function (userId, callback) {
    if (typeof(callback) !== 'function') {

        callback = function () {
            logger.info('Callback not registered');
        }
    }

    buildOptionsForRequest(
        'GET',
        CONFIG.HOST_SETTINGS.ADDITIVE_MACHINE_SERVICE.PROTOCOL,
        CONFIG.HOST_SETTINGS.ADDITIVE_MACHINE_SERVICE.HOST,
        CONFIG.HOST_SETTINGS.ADDITIVE_MACHINE_SERVICE.PORT,
        '/users/' + userId + '/image',
        {}, function (err, options) {
            options.encoding = null;

            request(options, function (e, r, imageBuffer) {
                const err = logger.logRequestAndResponse(e, options, r, imageBuffer);

                callback(err, {
                    imageBuffer: imageBuffer,
                    contentType: r ? r.headers['content-type'] : null
                });
            });
        }
    );

};

self.uploadFile = function(uuid, fileBuffer, callback) {
    const options = buildOptionsForRequest(
        'POST',
        CONFIG.HOST_SETTINGS.ADDITIVE_MACHINE_SERVICE.PROTOCOL,
        CONFIG.HOST_SETTINGS.ADDITIVE_MACHINE_SERVICE.HOST,
        CONFIG.HOST_SETTINGS.ADDITIVE_MACHINE_SERVICE.PORT,
        `/object/${uuid}/binary`,
        {}
    );

    options.formData = {
        file: {
            value: fileBuffer,
            options: {
                filename: `${uuid}.file`
            }
        }
    };

    logger.debug(`[ams_adapter] uploading file for ${uuid}`);

    request(options, function optionalCallback(e, r, body) {
        const err = logger.logRequestAndResponse(e, options, r, body);

        if (err) {
            logger.warn('[ams_adapter] error while uploading file to ams');
        }

        callback(err);
    });
};

module.exports = self;