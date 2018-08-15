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

self.getAllObjects = function (language, machines, materials, callback) {


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
        '/objects',
        {
            machines: machines,
            materials: materials,
            lang: language,
        }, function (err, options) {
            request(options, function (e, r, jsonData) {
                const err = logger.logRequestAndResponse(e, options, r, jsonData);
                callback(err, jsonData);
            });
        }
    );


};

self.getBinaryForObjectWithId = function (objectId, offerId, callback) {
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
        `/objects/${objectId}/binary`,
        {
            offerId: offerId
        }, function (err, options) {
            request(options, function (e, r, binary) {

                const err = logger.logRequestAndResponse(e, options, r, binary);

                callback(err, binary);
            });
        }
    );

};

self.saveObject = function (objectData, callback) {
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
        '/objects',
        {}, function (err, options) {
            options.body = objectData;

            request(options, function (e, r, jsonData) {
                const err = logger.logRequestAndResponse(e, options, r, jsonData);

                if (err) {
                    return callback(err);
                }
                let objectId = null;

                if (r.headers['location']) {
                    objectId = r.headers['location'].substr(r.headers['location'].lastIndexOf('/') + 1)
                }

                callback(err, objectId);
            });
        }
    );

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

self.uploadFile = function(uuid, fileStream, callback) {

    buildOptionsForRequest(
        'POST',
        CONFIG.HOST_SETTINGS.ADDITIVE_MACHINE_SERVICE.PROTOCOL,
        CONFIG.HOST_SETTINGS.ADDITIVE_MACHINE_SERVICE.HOST,
        CONFIG.HOST_SETTINGS.ADDITIVE_MACHINE_SERVICE.PORT,
        `/objects/${uuid}/binary`,
        {},
        function (err, options) {
            options.formData = {
                file: {
                    value: fileStream,
                    options: {
                        filename: `${uuid}.iunoum3`
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