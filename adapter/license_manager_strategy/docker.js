const logger = require('../../global/logger');
const Machine = require('../../models/machine');

const self = require('./default');

logger.warn('[license_manager_adapter] RUNNING DOCKER (SIMULATION) MODE. License manager calls will be skipped!');

self.getMachineForHsmId = function (hsmId, callback) {
    Machine.find(function (err, machines) {
        callback(machines[0], null);
    });
};

self.getContextForHsmId = function (hsmId, callback) {
    callback(null, new Buffer('SIMULATION').toString('base64'));
};

self.updateHsm = function (hsmId, update, callback) {
    callback(null, true);
};

self.getLicenseInformationForProductCodeOnHsm = function (productCode, hsmId, callback) {
    callback(null, 9999);
};

self.getLicenses = function (hostname, hsmId, productCode, callback) {
    callback(null, '5');
};

self.updateCMDongle = function (hsmId, callback) {
    callback(null);
};

self.getHsmIds = function (hostname, callback) {
    callback(null, '9-9999999');
};

module.exports = self;