/**
 * Created by goergch on 09.03.17.
 */

const logger = require('../global/logger')
const io = require('socket.io-client')
const CONFIG = require('../config/config_loader')
// const orderDB = require('../database/orderDB')
const EventEmitter = require('events').EventEmitter
const util = require('util')
const authServer = require('../adapter/auth_service_adapter')
const Machine = require('../models/machine')
const Order = require('../models/order')
const orderStateMachine = require('../models/order_state_machine')
const ams_adapter = require('../adapter/ams_adapter');

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

const license_service = new LicenseService();
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
    const orderStateMachine = require('../models/order_state_machine')

    if (data) {
        // get order from database
        Order.findOne({'offer.id': data.offerId}, function(error, order) {
            if (!order || error) {
                return
            }
            orderStateMachine.licenseUpdateAvailable(order)
            // order.save((error, savedOrder) => {
            //     if (error) {
            //         return
            //     }
            // })
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

    logger.info('[license_client] querying for license updates of existing orders.');
    Order.find({state: { $ne: 'completed'} }, function(err, orders) {
        if (orders) {
            orders.forEach(order => {
                ams_adapter.requestLicenseUpdate( order, (err) => {
                    //FIXME: Think what to do here
                })            
            })
        }
    })

};

license_service.getConnectionStatus = function () {
    return this.socket.connected;
};

module.exports = license_service;
