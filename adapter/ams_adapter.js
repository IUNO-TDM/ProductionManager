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
const DownloadService = require('../services/download_service');
const UploadService = require('../services/upload_service');
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

    var queryParams = {};
    queryParams['machines'] = machines;
    queryParams['materials'] = materials;
    queryParams['purchased'] = purchased;
    queryParams['lang'] = language;

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

    self.getObjectWithId(objectId, 'de', (err, data) => {
        if (err) {
            callback(err, data);
        } else {
            buildOptionsForRequest(
                'GET',
                CONFIG.HOST_SETTINGS.ADDITIVE_MACHINE_SERVICE.PROTOCOL,
                CONFIG.HOST_SETTINGS.ADDITIVE_MACHINE_SERVICE.HOST,
                CONFIG.HOST_SETTINGS.ADDITIVE_MACHINE_SERVICE.PORT,
                `/objects/${objectId}/binary`,
                {},
                function (err, options) {
                    DownloadService.downloadObjectBinary(objectId, data.productCode, options);
                    callback(null, null);
                }
            )
        }
    })
};

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
                const err = logger.logRequestAndResponse(e, options, r, jsonData);

                if (err) {
                    return callback(err)
                }
                let objectId = null;

                if (r.headers['location']) {
                    objectId = r.headers['location'].substr(r.headers['location'].lastIndexOf('/') + 1)
                }
                callback(err, objectId)
            })
        }
    )
};

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

self.requestLicenseUpdate = function (order, callback) {
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
};

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

self.uploadFile = function (objectId, path, callback) {

    buildOptionsForRequest(
        'POST',
        CONFIG.HOST_SETTINGS.ADDITIVE_MACHINE_SERVICE.PROTOCOL,
        CONFIG.HOST_SETTINGS.ADDITIVE_MACHINE_SERVICE.HOST,
        CONFIG.HOST_SETTINGS.ADDITIVE_MACHINE_SERVICE.PORT,
        `/objects/${objectId}/binary`,
        {},
        function (err, options) {
            UploadService.uploadObjectBinary(objectId, path, options, callback)
        }
    );
};

self.uploadImage = function (objectId, path, callback) {
    buildOptionsForRequest(
        'PUT',
        CONFIG.HOST_SETTINGS.ADDITIVE_MACHINE_SERVICE.PROTOCOL,
        CONFIG.HOST_SETTINGS.ADDITIVE_MACHINE_SERVICE.HOST,
        CONFIG.HOST_SETTINGS.ADDITIVE_MACHINE_SERVICE.PORT,
        `/objects/${objectId}/image`,
        {},
        function (err, options) {
            options.json = false;
            delete options.headers['Content-Type'];
            options.encoding = null;
            fs.createReadStream(path).pipe(request.put(options, function (e, r, data) {
                const err = logger.logRequestAndResponse(e, options, r, data);
                callback(err, data);
            }));
        }
    );
};

self.getObjectWithId = function (objectId, language, callback) {


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
        `/objects/${objectId}`,
        {
            lang: language,
        }, function (err, options) {
            request(options, function (e, r, jsonData) {
                const err = logger.logRequestAndResponse(e, options, r, jsonData);
                callback(err, jsonData);
            });
        }
    );


};

module.exports = self;