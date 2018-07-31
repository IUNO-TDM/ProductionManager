/**
 * Created by goergch on 09.03.17.
 */

const logger = require('../global/logger');
const io = require('socket.io-client');
const CONFIG = require('../config/config_loader');
// const orderDB = require('../database/orderDB');
const licenseManager = require('../adapter/license_manager_adapter');
const additiveMachineService = require('../adapter/ams_adapter');
const EventEmitter = require('events').EventEmitter;
const util = require('util');
const authServer = require('../adapter/auth_service_adapter');
const Machine = require('../models/machine')
const Order = require('../models/order')

const LicenseService = function () {
    const self = this;
    logger.info('[license_client] new instance');

    this.refreshTokenAndReconnect = function () {
        authServer.invalidateToken();
        authServer.getAccessToken(function (err, token) {
            if (err) {
                logger.warn(err);
            }
            if (self.socket) {
                self.socket.io.opts.extraHeaders = {
                    Authorization: 'Bearer ' + (token ? token.accessToken : '')
                };
                self.socket.io.disconnect();
                self.socket.connect();
            }
        });
    };
};

const license_service = new LicenseService();7
util.inherits(LicenseService, EventEmitter);

license_service.socket = io(CONFIG.HOST_SETTINGS.ADDITIVE_MACHINE_SERVICE
        .PROTOCOL + '://' + CONFIG.HOST_SETTINGS.ADDITIVE_MACHINE_SERVICE.HOST
    + ":" + CONFIG.HOST_SETTINGS.ADDITIVE_MACHINE_SERVICE.PORT + "/licenses", {
    extraHeaders: {}
});

license_service.socket.on('connect', function () {
    logger.debug("[license_client] Connected to AMS");

    license_service.registerUpdates();
    license_service.emit('connectionState', true);
});
license_service.socket.on('connect_error', function (error) {
    logger.debug("[license_client] Connection Error: " + error);
    license_service.emit('connectionState', false);
});

license_service.socket.on('disconnect', function () {
    logger.debug("[license_client] Disconnected from AMS");
    license_service.emit('connectionState', false);

});

license_service.socket.on('error', function (error) {
    logger.debug("[license_client] Error: " + error);
    license_service.emit('connectionState', false);

    license_service.refreshTokenAndReconnect();
});

license_service.socket.on('connect_failed', function (error) {
    logger.debug("[license_client] Connection Failed: " + error);
    license_service.emit('connectionState', false);

});

license_service.socket.on('reconnect_error', function (error) {
    logger.debug("[license_client] Re-Connection Error: " + error);
    license_service.emit('connectionState', false);

});

license_service.socket.on('reconnect_attempt', function (number) {
    logger.debug("[license_client] Re-Connection attempt: " + number);
});

license_service.socket.on('updateAvailable', function (data) {
    logger.debug("[license_client] License update available for " + JSON.stringify(data));
    // const orderStateMachine = require('../models/order_state_machine');

    if (data) {
        // get order from database
        Order.findOne({'offer.id': data.offerId}, function(error, order) {
            if (!order || error) {
                return
            }
            order.state = "waitingLicenseAvailable"
            order.save((error, savedOrder) => {
                if (error) {
                    return
                }
            })
            // console.log("------------------------------")
            // console.log(order)
            // console.log("------------------------------")
        })
        return;
        // const order = orderDB.getOrderByOfferId(data.offerId);
        // if (!order) {
        //     return;
        // }
        // orderStateMachine.licenseAvailable(order);

        // updateCMDongle(data.hsmId, function (err) {
        //     if (err) {
        //         orderStateMachine.error(order)
        //     }

        //     orderStateMachine.licenseArrived(order);
        // });

    }
});

license_service.registerUpdates = function () {
    logger.info('[license_client] registerUpdates.');
    Machine.find(function (err, machines) {
        if (err) {
            logger.err('[license_client] Could not register for license updates! Error = '+err+'.');
        } else {
            machines.forEach(machine => {
                if (machine.hsmIds) {
                    machine.hsmIds.forEach(hsmId => {
                        logger.info("[license_client] registering updates for hsmId '"+hsmId+"'")
                        license_service.socket.emit('room', hsmId);
                    })
                }
            })
        }
    })
};

license_service.getConnectionStatus = function () {
    return this.socket.connected;
};

function updateCMDongle(hsmId, callback) {
    if (license_service.isUpdating) {
        logger.warn('[license_service] Update cycle is already running. Retry after 10 seconds');
        return setTimeout(() => {
            updateCMDongle(hsmId, callback);
        }, 10000);
    }

    license_service.isUpdating = true;
    logger.debug('[license_service] Starting update cycle for hsmId: ' + hsmId);

    licenseManager.getContextForHsmId(hsmId, function (err, context) {
        if (err || !context) {
            logger.crit('[license_service] could not get context from license manager');
            license_service.isUpdating = false;
            return callback(err);
        }

        additiveMachineService.getLicenseUpdate(hsmId, context, function (err, update, isOutOfDate) {
            if (err || !context) {
                logger.crit('[license_service] could not get license update from webservice');
                license_service.isUpdating = false;
                return callback(err);
            }

            licenseManager.updateHsm(hsmId, update, function (err, success) {
                if (err || !success) {
                    logger.crit('[license_service] could not update hsm on license manager');

                    additiveMachineService.confirmLicenseUpdate(hsmId, context, function (err) {
                        license_service.isUpdating = false;

                        if (err) {
                            logger.crit('[license_service] could not confirm update on license manager');
                            return callback(err);
                        }

                        logger.warn('[license_service] CM-Dongle context is out of date. Restarting update cycle');
                        return updateCMDongle(hsmId, callback)
                    });
                }
                else {
                    licenseManager.getContextForHsmId(hsmId, function (err, context) {
                        if (err || !context) {
                            logger.crit('[license_service] could not get context from license manager');
                            license_service.isUpdating = false;
                            return callback(err);
                        }

                        additiveMachineService.confirmLicenseUpdate(hsmId, context, function (err) {
                            license_service.isUpdating = false;

                            if (err) {
                                logger.crit('[license_service] could not confirm update on license manager');
                                return callback(err);
                            }

                            // Restart the update process as long the returned context is out of date
                            if (isOutOfDate) {
                                logger.warn('[license_service] CM-Dongle context is out of date. Restarting update cycle');
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


module.exports = license_service;
