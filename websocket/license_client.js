/**
 * Created by goergch on 09.03.17.
 */

const logger = require('../global/logger');
const io = require('socket.io-client');
const CONFIG = require('../config/config_loader');
// const orderDB = require('../database/orderDB')
const EventEmitter = require('events').EventEmitter;
const util = require('util');
const authServer = require('../adapter/auth_service_adapter');
const Machine = require('../models/machine');
const Order = require('../models/order');
const orderStateMachine = require('../models/order_state_machine');
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

license_service.registeredHsmIds = [];

license_service.socket = io(CONFIG.HOST_SETTINGS.ADDITIVE_MACHINE_SERVICE
        .PROTOCOL + '://' + CONFIG.HOST_SETTINGS.ADDITIVE_MACHINE_SERVICE.HOST
    + ":" + CONFIG.HOST_SETTINGS.ADDITIVE_MACHINE_SERVICE.PORT + "/licenses", {
    extraHeaders: {}
});

license_service.socket.on('connect', function () {
    logger.debug("[license_client] Connected to AMS");

    for (var i = 0; i < license_service.registeredHsmIds.length; i++) {
        license_service.socket.emit('room', license_service.registeredHsmIds[i]);
        logger.info("Registered for license updates dongleId:" + license_service.registeredHsmIds[i]);
    }
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

    const orderStateMachine = require('../models/order_state_machine');
    if (data) {
        // get order from database
        Order.findOne({'offer.id': data.offerId}, function (error, order) {
            if (!order || error) {
                return
            }
            orderStateMachine.licenseUpdateAvailable(order)
        });
    }
});

license_service.registerHsmId = function (hsmId) {
    if(license_service.registeredHsmIds.indexOf(hsmId) !== -1){
        return;
    }
    if (license_service.socket.connected) {

        logger.info("[license_client] registering updates for hsmId '" + hsmId + "'");
        license_service.socket.emit('room', hsmId);
    }
    license_service.registeredHsmIds.push(hsmId);
};

license_service.getConnectionStatus = function () {
    return this.socket.connected;
};

module.exports = license_service;
