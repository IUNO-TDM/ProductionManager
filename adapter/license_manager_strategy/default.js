const logger = require('../../global/logger');
const CONFIG = require('../../config/config_loader');
const request = require('request');
const Machine = require('../../models/machine');
const additiveMachineService = require('../ams_adapter')

const self = {
    isUpdating: false
};

function buildOptionsForRequest(method, protocol, host, port, path, qs) {

    return {
        method: method,
        url: protocol + '://' + host + ':' + port + path,
        qs: qs,
        headers: {}
    }
}

self.getMachineForHsmId = function (hsmId, callback) {
    logger.debug("[license_manager_adapter] getMachineForHsmId '"+hsmId+"'.")

    //FIXME! this is ugly! Do it with Machine.findOne
    var selectedMachine = null;
    Machine.find({}, function(err, machines) {
        console.log("Alle Maschinen:")
        console.log(machines)
        machines.forEach(machine => {
            machine.hsmIds.forEach(id => {
                if (id == hsmId) {
                    selectedMachine = machine
                    console.log("HIT!")
                }
                console.log(" - "+id)
            })
        })
        console.log("selectedMachine")
        console.log(selectedMachine)
        callback(selectedMachine, null)
        })
    // Machine.findOne({ hsmIds: hsmId }, function (err, machines) {
    //     console.log(err)
    //     if (machines.length > 0 && !err) {
    //         logger.debug("[license_manager_adapter] getMachineForHsmId '"+hsmId+"' - found "+machines.length+" machines.")
    //         callback(machines[0], err)
    //     } else {
    //         logger.debug("[license_manager_adapter] getMachineForHsmId '"+hsmId+"' - found NONE!")
    //         callback(null, err)
    //     }
    // })
}

self.getContextForHsmId = function (hsmId, callback) {
    if (typeof (callback) !== 'function') {
        return logger.crit('[license_manager_adapter] missing callback');
    }

    if (!hsmId) {
        return logger.crit('[license_manager_adapter] missing function arguments');
    }

    this.getMachineForHsmId(hsmId, function (machine, error) {
        console.log(machine)
        const hostname = machine.hostname
        logger.debug("Machines hostname = '" + hostname + "'")
        const options = buildOptionsForRequest(
            'GET',
            CONFIG.HOST_SETTINGS.LICENSE_MANAGER.PROTOCOL,
            hostname,
            CONFIG.HOST_SETTINGS.LICENSE_MANAGER.PORT,
            '/cmdongles/' + hsmId + '/context',
            {}
        );

        request(options, function (e, r, context) {
            const err = logger.logRequestAndResponse(e, options, r, context);

            callback(err, context);
        });
    })
};

self.updateHsm = function (hsmId, update, callback) {
    if (typeof (callback) !== 'function') {
        return logger.crit('[license_manager_adapter] missing callback');
    }

    if (!hsmId || !update) {
        return logger.crit('[license_manager_adapter] missing function arguments');
    }

    this.getMachineForHsmId(hsmId, function (machine, error) {
        const hostname = machine.hostname
        const options = buildOptionsForRequest(
            'PUT',
            CONFIG.HOST_SETTINGS.LICENSE_MANAGER.PROTOCOL,
            hostname,
            CONFIG.HOST_SETTINGS.LICENSE_MANAGER.PORT,
            '/cmdongles/' + hsmId + '/update',
            {}
        );
        console.log("OPTIONS:" + update.length)
        console.log(options)
        options.headers['content-type'] = 'text/plain';
        options.headers['content-transfer-encoding'] = 'base64';
        options.body = update;

        console.log("EXEC REQUEST")
        request(options, function (e, r, data) {
            console.log("DONE")
            const err = logger.logRequestAndResponse(e, options, r, data);

            callback(err, data);
        });
    })
};

self.getLicenseInformationForProductCodeOnHsm = function (productCode, hsmId, callback) {
    if (typeof (callback) !== 'function') {
        return logger.crit('[license_manager_adapter] missing callback');
    }

    if (!productCode) {
        return logger.crit('[license_manager_adapter] missing function arguments');
    }

    this.getMachineForHsmId(hsmId, function (machine, error) {
        const hostname = machine.hostname
        const options = buildOptionsForRequest(
            'GET',
            CONFIG.HOST_SETTINGS.LICENSE_MANAGER.PROTOCOL,
            hostname,
            CONFIG.HOST_SETTINGS.LICENSE_MANAGER.PORT,
            '/cmdongles/' + hsmId + '/products/' + productCode + '/licensecount',
            {}
        );

        request(options, function (e, r, data) {
            const err = logger.logRequestAndResponse(e, options, r, data);

            callback(err, data);
        });
    })
};

self.updateCMDongle = function(hsmId, callback) {
    if (self.isUpdating) {
        logger.warn('[license_manager] Update cycle is already running. Retry after 10 seconds');
        return setTimeout(() => {
            updateCMDongle(hsmId, callback);
        }, 10000);
    }

    self.isUpdating = true;
    logger.debug('[license_manager] Starting update cycle for hsmId: ' + hsmId);

    self.getContextForHsmId(hsmId, function (err, context) {
        if (err || !context) {
            logger.crit('[license_manager] could not get context from license manager');
            self.isUpdating = false;
            return callback(err);
        }

        logger.debug('[license_manager] received context, hsmId = ' + hsmId + "', context = '" + context + "'");

        additiveMachineService.getLicenseUpdate(hsmId, context, function (err, update, isOutOfDate) {
            if (err || !context) {
                logger.crit('[license_manager] could not get license update from webservice');
                self.isUpdating = false;
                return callback(err);
            }

            self.updateHsm(hsmId, update, function (err, success) {
                if (err || !success) {
                    logger.crit('[license_manager] could not update hsm on license manager');
                    logger.crit(err);

                    additiveMachineService.confirmLicenseUpdate(hsmId, context, function (err) {
                        self.isUpdating = false;

                        if (err) {
                            logger.crit('[license_manager] could not confirm update on license manager');
                            return callback(err);
                        }

                        logger.warn('[license_manager] CM-Dongle context is out of date. Restarting update cycle');
                        return updateCMDongle(hsmId, callback)
                    });
                }
                else {
                    self.getContextForHsmId(hsmId, function (err, context) {
                        if (err || !context) {
                            logger.crit('[license_manager] could not get context from license manager');
                            self.isUpdating = false;
                            return callback(err);
                        }

                        additiveMachineService.confirmLicenseUpdate(hsmId, context, function (err) {
                            self.isUpdating = false;

                            if (err) {
                                logger.crit('[license_manager] could not confirm update on license manager');
                                return callback(err);
                            }

                            // Restart the update process as long the returned context is out of date
                            if (isOutOfDate) {
                                logger.warn('[license_manager] CM-Dongle context is out of date. Restarting update cycle');
                                return updateCMDongle(hsmId, callback)
                            }

                            callback(null)
                        });
                    });
                }
            });
        });
    });
}

self.updateMachines = function(callback) {
    Machine.find(function (err, machines) {
        machines.forEach(machine => {
            logger.info("Updating hsmIds of machine '"+machine.displayname+"'.")
            const options = buildOptionsForRequest(
                'GET',
                CONFIG.HOST_SETTINGS.LICENSE_MANAGER.PROTOCOL,
                machine.hostname,
                CONFIG.HOST_SETTINGS.LICENSE_MANAGER.PORT,
                '/cmdongles',
                {}
            );

            options.json = true;

            request(options, function (e, r, data) {
                const err = logger.logRequestAndResponse(e, options, r, data);
                logger.info("- found "+data.length+" hsmIds.")
                machine.hsmIds = data
                machine.save((error, savedMachine) => {
                    if (!error) {
                        logger.info("- machine saved with no error.")
                    } else {
                        //TODO: handle error
                        logger.error("- machine not saved. Error = '"+error+"'.")
                    }
                })
            });
        })
        callback(err, machines)
    })
}

// self.getHsmId = function (callback) {
//     if (typeof(callback) !== 'function') {
//         return logger.crit('[license_manager_adapter] missing callback');
//     }

//     const options = buildOptionsForRequest(
//         'GET',
//         CONFIG.HOST_SETTINGS.LICENSE_MANAGER.PROTOCOL,
//         CONFIG.HOST_SETTINGS.LICENSE_MANAGER.HOST,
//         CONFIG.HOST_SETTINGS.LICENSE_MANAGER.PORT,
//         '/cmdongles',
//         {}
//     );

//     options.json = true;

//     request(options, function (e, r, data) {
//         const err = logger.logRequestAndResponse(e, options, r, data);

//         let hsmId = null;
//         if (data && data.length) {
//             hsmId = data[0];
//         }

//         callback(err, hsmId);
//     });
// };

module.exports = self;
