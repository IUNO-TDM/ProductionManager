/**
 * Created by goergch on 09.07.2018.
 */
const logger = require('../global/logger');
const request = require('request');
const CONFIG = require('../config/config_loader');
const fs = require('fs');

const self = {};

self.getSystemGuid = function (hostname, callback) {
    const options = buildOptionsForRequest(
        'GET',
        hostname,
        {},
        null,
        '/api/v1/system/guid'
    );

    request(options, function (e, r, data) {
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

    request(options, function (e, r, data) {
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

    request(options, function (e, r, data) {
        const err = logger.logRequestAndResponse(e, options, r, data);
        callback(err, data);
    })
};

self.requestAuthentication = function (hostname, application, user, callback) {
    const options = buildOptionsForRequest(
        'POST',
        hostname,
        {},
        {"application": application, "user": user},
        '/api/v1/auth/request'
    );

    request(options, function (e, r, data) {
        const err = logger.logRequestAndResponse(e, options, r, data);
        callback(err, data);
    })
};

self.checkAuthentication = function (hostname, id, callback) {
    const options = buildOptionsForRequest(
        'GET',
        hostname,
        {},
        null,
        '/api/v1/auth/check/' + id
    );

    request(options, function (e, r, data) {
        const err = logger.logRequestAndResponse(e, options, r, data);
        callback(err, data);
    })
};

self.verifyAuthentication = function (hostname, id, key, callback) {
    const options = buildOptionsForRequest(
        'GET',
        hostname,
        {},
        null,
        '/api/v1/auth/verify'
    );

    options['auth'] = {
        'user': id,
        'pass': key,
        'sendImmediately': false
    };



    request(options, function (e, r, data) {
        const err = logger.logRequestAndResponse(e, options, r, data);
        callback(err, data);
    })
};

self.uploadPrintjob = function (hostname, id, key, jobname, filepath, callback) {
    const options = buildOptionsForRequest(
        'POST',
        '192.168.178.98',
        {},
        null,
        '/api/v1/print_job'
    );

    options['auth'] = {
        'user': id,
        'pass': key,
        'sendImmediately': false
    };

    options.headers = {
        'connection': 'open'
        // 'Cache-Control': 'no-cache',
        // 'Content-Type': 'multipart/form-data',
        // 'content-type': 'multipart/form-data; boundary=----WebKitFormBoundary7MA4YWxkTrZu0gW'
    };
    options.json = false;


    options['formData'] = {
        file: fs.createReadStream(filepath),

        jobname: jobname
    };


request(options, function (e, r, data) {
    const err = logger.logRequestAndResponse(e, options, r, data);
    callback(err, data);
})
}
;

self.getActiveMaterial = function (hostname, extruder, callback) {
    const options = buildOptionsForRequest(
        'GET',
        hostname,
        {},
        null,
        '/api/v1/printer/heads/0/extruders/' + extruder + '/active_material'
    );

    request(options, function (e, r, data) {
        const err = logger.logRequestAndResponse(e, options, r, data);
        callback(err, data);
    })
};

self.getMaterialDetails = function (hostname, materialid, callback) {
    const options = buildOptionsForRequest(
        'GET',
        hostname,
        {},
        null,
        '/api/v1/materials/' + materialid
    );

    request(options, function (e, r, data) {
        const err = logger.logRequestAndResponse(e, options, r, data);
        callback(err, data);
    })
};

self.getPrinterStatus = function (hostname, callback) {
    const options = buildOptionsForRequest(
        'GET',
        hostname,
        {},
        null,
        '/api/v1/printer/status'
    );

    request(options, function (e, r, data) {
        const err = logger.logRequestAndResponse(e, options, r, data);
        callback(err, data);
    })
};

self.getPrintJob = function (hostname, callback) {
    const options = buildOptionsForRequest(
        'GET',
        hostname,
        {},
        null,
        '/api/v1/print_job'
    );

    request(options, function (e, r, data) {
        const err = logger.logRequestAndResponse(e, options, r, data);
        callback(err, data);
    })
};

self.getPrintJobState = function (hostname, callback) {
    const options = buildOptionsForRequest(
        'GET',
        hostname,
        {},
        null,
        '/api/v1/print_job/state'
    );

    request(options, function (e, r, data) {
        const err = logger.logRequestAndResponse(e, options, r, data);
        callback(err, data);
    })
};

self.getPrintJobProgress = function (hostname, callback) {
    const options = buildOptionsForRequest(
        'GET',
        hostname,
        {},
        null,
        '/api/v1/print_job/progress'
    );

    request(options, function (e, r, data) {
        const err = logger.logRequestAndResponse(e, options, r, data);
        callback(err, data);
    })
};

self.getPrintJobTimeElapsed = function (hostname, callback) {
    const options = buildOptionsForRequest(
        'GET',
        hostname,
        {},
        null,
        '/api/v1/print_job/time_elapsed'
    );

    request(options, function (e, r, data) {
        const err = logger.logRequestAndResponse(e, options, r, data);
        callback(err, data);
    })
};

self.getPrintJobTimeTotal = function (hostname, callback) {
    const options = buildOptionsForRequest(
        'GET',
        hostname,
        {},
        null,
        '/api/v1/print_job/time_total'
    );

    request(options, function (e, r, data) {
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
        url: CONFIG.HOST_SETTINGS.ULTIMAKER.PROTOCOL + '://' + host + ':' + CONFIG.HOST_SETTINGS.ULTIMAKER.PORT + path,

        json: true,
        headers: {
            'Content-Type': 'application/json'
        },
        qs: qs,
        body: body
    }
}

module.exports = self;
