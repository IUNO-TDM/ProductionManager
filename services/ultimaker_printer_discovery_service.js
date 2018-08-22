const dnssd = require('dnssd');
const EventEmitter = require('events').EventEmitter;
const util = require('util');
const Machine = require('../models/machine');
const ultimakerAdapter = require('../adapter/ultimaker_printer_adapter');
const async = require('async');
const logger = require('../global/logger');
const licenseManager = require('../adapter/license_manager_adapter');
const licenseClient = require('../websocket/license_client');
const UltimakerPrinterDiscoveryService = function () {

};

const discovery_service = new UltimakerPrinterDiscoveryService();
util.inherits(UltimakerPrinterDiscoveryService, EventEmitter);

const updateMachine = function (machine, callback) {
    async.parallel([
        function (cb) {
            ultimakerAdapter.getSystemGuid(machine.hostname, cb)
        },
        function (cb) {
            ultimakerAdapter.getSystemName(machine.hostname, cb)
        },
        function (cb) {
            ultimakerAdapter.getSystemVariant(machine.hostname, cb)
        },
        function (cb) {

            licenseManager.getHsmIds(machine.hostname, (err, hsmId) => {
                cb(null, hsmId);
            })
        },
        function (cb) {
            if (machine.auth_id && machine.auth_key) {
                ultimakerAdapter.verifyAuthentication(machine.hostname, machine.auth_id, machine.auth_key, cb);
            } else {
                cb(null, null)
            }
        }
    ], function (err, results) {
        if (err) {
            machine.isOnline = false;
        } else {
            machine._id = results[0];
            machine.displayname = results[1];
            machine.variant = results[2];
            machine.hsmIds = results[3];
            machine.isAuthenticated = !!(results[4] && results[4].message === "ok");

            machine.isOnline = true;
            if (machine.hsmIds && machine.hsmIds.length > 0) {
                for (let i = 0; i < machine.hsmIds.length; i++) {
                    licenseClient.registerHsmId(machine.hsmIds[i]);
                }
            }
        }

        if (machine._id) {
            Machine.findById(machine._id, (err, foundMachine) => {
                if (err) {
                    callback(err, null);
                }
                else if (foundMachine) {
                    Machine.findByIdAndUpdate(machine._id, machine, {new: true}, (err, updatedMachine) => {
                        callback(err, null);
                    });
                } else {
                    Machine.create(machine, (err, updatedMachine) => {
                        callback(err, null);
                    });
                }
            })
        } else {
            Machine.findOneAndUpdate({hostname: machine.hostname}, machine, {new: true}, (err, updatedMachine) => {
                callback(err, null);
            })
        }
    })
};

async.series(
    [
        //first step, before activating dns discovery is checking state of machines in DB
        (callback) => {
            Machine.find((err, machines) => {
                async.map(machines, updateMachine,
                    (err) => {
                        if (err) {
                            logger.warn("There was a problem with updating machine DB data", err);
                        }
                        callback();
                    });
            });
        },
        (callback) => {
            const updateOnServiceChange = function (service) {
                var m = {};
                m.hostname = service.host;
                updateMachine(m, (err, res) => {
                    if (err) {
                        console.warn("error updating found machine");
                    }
                });
            };
            discovery_service.browser = dnssd.Browser(dnssd.tcp('_ultimaker'));
            discovery_service.browser.on('serviceUp', function (service) {
                discovery_service.emit('serviceUp', service);
                updateOnServiceChange(service);

            });
            discovery_service.browser.on('serviceDown', function (service) {
                discovery_service.emit('serviceDown', service);
                updateOnServiceChange(service);
            });
            discovery_service.browser.start();
            callback();
        }
    ]
);

module.exports = discovery_service;