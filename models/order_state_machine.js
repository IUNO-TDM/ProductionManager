/**
 * Created by liefersfl on 01.08.18.
 */

const machina = require('machina');
const logger = require('../global/logger');
const TdmObject = require('../models/object');

const stateMachine = new machina.BehavioralFsm({

    initialize: function (options) {
        // update order's state
        this.on("transition", function (data) {
            logger.info("[orderStateMachine] order = '" + data.client.id + "', state from = '" + data.fromState + "' to = '" + data.toState + "'.");
            if (data.fromState) {
                const order = data.client;
                order.state = data.toState;
                order.save((error, savedOrder) => {
                    if (error) {

                    }
                })
            }
        });
    },

    namespace: "order-states",

    initialState: "uninitialized",

    states: {
        uninitialized: {
            // if not initialized, go to order's internal state (the state stored in database)
            "*": function (order) {
                logger.info("[orderStateMachine] uninitialized order = '" + order.id + "', state = '" + order.state + "'.");
                this.deferUntilTransition(order);
                this.transition(order, order.state);
            }
        },

        initial: {
            _onEnter: function (order) {
                this.transition(order, "waitingForPayment")
            }
        },

        waitingForPayment: {
            _onEnter: function (order) {
                this.transition(order, "waitingForLicenseUpdate")
            }
        },

        waitingForLicenseUpdate: {
            licenseUpdateAvailable: "licenseUpdateAvailable"
        },

        licenseUpdateAvailable: {
            _onEnter: function (order) {
                this.transition(order, "updatingLicense")
            }
        },

        updatingLicense: {
            _onEnter: function (order) {
                const hsmId = order.hsmId;
                logger.info("[orderStateMachine] Requesting licenseService to update dongle...");
                const licenseManager = require('../adapter/license_manager_adapter');
                licenseManager.updateCMDongle(hsmId, (error) => {
                    if (!error) { // success
                        this.transition(order, "licenseUpdated")
                    } else {
                        this.transition(order, "licenseUpdateError")
                    }
                })
            }
        },

        licenseUpdateError: {
            licenseUpdateAvailable: "licenseUpdateAvailable",
        },

        licenseUpdated: {
            _onEnter: function (order) {
                // write purchased object information to database if it doesn't
                // exist from a previous order.
                order.items.forEach(item => {
                    TdmObject.findOne({dataId: item.dataId}, function (err, object) {
                        if (!object) {
                            TdmObject.create({
                                dataId: item.dataId
                            }, (err, object) => {
                                //TODO: check error
                            })
                        }
                    })
                });
                this.transition(order, "completed")
            }
        },

        completed: {
            _onEnter: function (order) {
            }
        }

    },

    orderCreated: function (order) {
        targetState = order.state;
        this.handle(order, targetState)
    },

    licenseUpdateAvailable: function (order) {
        logger.debug("[orderStateMachine] licenseUpdateAvailable called");
        this.handle(order, "licenseUpdateAvailable")
    },

    updateLicense: function (order) {
    }
});

module.exports = stateMachine;
