/**
 * Created by goergch on 09.07.2018.
 */
const logger = require('../global/logger');
const request = require('request');

const self = {};

self.getSystemGuid = function (hostname, callback) {
    const options = buildOptionsForRequest(
        'GET',
        hostname,
        {},
        null,
        '/api/v1/system/guid'
    );

    request(options, function (e,r,data) {
        const err = logger.logRequestAndResponse(e, options, r, data);
        callback(err, data);
    })
};

self.getSystemVariant = function (hostname, callback) {
    const options = buildOptionsForRequest(
        'GET',
        hostname,
        {},
        null,
        '/api/v1/system/variant'
    );

    request(options, function (e,r,data) {
        const err = logger.logRequestAndResponse(e, options, r, data);
        callback(err, data);
    })
};

self.getSystemName = function (hostname, callback) {
    const options = buildOptionsForRequest(
        'GET',
        hostname,
        {},
        null,
        '/api/v1/system/name'
    );

    request(options, function (e,r,data) {
        const err = logger.logRequestAndResponse(e, options, r, data);
        callback(err, data);
    })
};


function buildOptionsForRequest(method, host, qs, body, path) {

    if (!path) {
        path = '/api/v1/';
    }

    return {
        method: method,
        url: 'http://' + host + ':' + '80' + path,

        json: true,
        headers: {
            'Content-Type': 'application/json'
        },
        qs: qs,
        body: body
    }
}
module.exports = self;
