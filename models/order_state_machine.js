/**
 * Created by liefersfl on 01.08.18.
 */

const machina = require('machina')
const logger = require('../global/logger')
const Order = require('../models/order')
const TdmObject = require('../models/object')

const stateMachine = new machina.BehavioralFsm({

    initialize: function (options) {
        // update order's state
        this.on("transition", function (data) {
            logger.info("[orderStateMachine] order = '" + data.client.id + "', state from = '" + data.fromState + "' to = '" + data.toState + "'.");
            if (data.fromState) {
                const order = data.client
                order.state = data.toState
                order.save((error, savedOrder) => {
                    if (error) {
                        return
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
                logger.info("[orderStateMachine] uninitialized order = '" + order.id + "', state = '" +  order.state + "'.");
                this.deferUntilTransition(order);
                this.transition(order, order.state);
            }
        },

        initial: {
            _onEnter: function(order) {
                this.transition(order, "waitingForPayment")
            }
        },

        waitingForPayment: {
            _onEnter: function(order) {
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
            _onEnter: function(order) {
                const hsmId = order.hsmId
                logger.info("[orderStateMachine] Requesting licenseService to update dongle...")
                const licenseManager = require('../adapter/license_manager_adapter')
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
                    TdmObject.findOne({ dataId: item.dataId }, function (err, object) {
                        if (!object) {
                            TdmObject.create({
                                dataId: item.dataId
                            }, (err, object) => {
                                //TODO: check error
                            })
                        }
                    })
                })
                this.transition(order, "completed")
            }
        },

        completed: {
            _onEnter: function(order) {
            }
        }

        // orderCreated:
        //     requestOffer
        //     offerReceived -> waitingForPayment
        // waitingForPayment:
        //     -> waitingForLicenseUpdate
        // waitingForLicenseUpdate:
        //     licenseUpdateAvailable -> liceneUpdateAvailable
        // licenseUpdateAvailable:
        //     updateLicense
        //     licenseUpdated -> orderCompleted
        // orderCompleted:


        //     waitingOffer: {
        // offerReceived: "waitingPaymentRequest",
        // onError: function (client) {
        //     this.transition(client, "waitingPaymentRequest");
        // }
    },

    // waitingPaymentRequest: {
    //     paymentRequestReceived: "waitingPayment",
    //     onError: function (client) {
    //         this.transition(client, "error");
    //     }
    // },

    // waitingPayment: {
    //     paymentArrived: "waitingLicenseAvailable",

    //     // licenseAvailable: function (client) {
    //     //     this.deferUntilTransition(client);
    //     //     this.transition(client, 'waitingLicenseAvailable');

    //     // },
    //     // licenseArrived: function (client) {
    //     //     this.deferUntilTransition(client);
    //     //     this.transition(client, 'waitingLicenseAvailable');

    //     // },
    //     onError: function (client) {
    //         this.transition(client, "error");
    //     }
    // },


    //     waitingLicenseAvailable: {
    //         _onEnter: function (order) {
    //             order.licenseTimeout = setInterval(() => {
    //                 offerService.requestLicenseUpdateForOrder(this, order);
    //             }, 10000);
    //         },
    //         licenseAvailable: function (order) {
    //             clearInterval(order.licenseTimeout);
    //             this.transition(order, 'waitingLicense');
    //         },
    //         licenseArrived: function (order) {
    //             clearInterval(order.licenseTimeout);
    //             this.deferUntilTransition(order);
    //             this.transition(order, 'waitingLicense');

    //         },
    //         onError: function (order) {
    //             clearInterval(order.licenseTimeout);
    //             this.transition(order, "error");
    //         }
    //     },
    //     waitingLicense: {
    //         licenseArrived: function (order) {
    //             //TODO: Maybe we should introduce a new state for downloading the encrypted recipe
    //             logger.debug('[order_state_machine] License arrived => Now downloading the encrypted recipe');
    //             jms.getRecipeProgramForId(order.drinkId, order.offerId, (err, program) => {

    //                 if (err) {
    //                     return this.transition(order, "error");
    //                 }

    //                 order.recipe['program'] = program;

    //                 this.transition(order, "enqueueForProduction");
    //             });
    //         },
    //         onError: function (client) {
    //             this.transition(client, "error");
    //         }
    //     },

    //     enqueueForProduction: {
    //         _onEnter: function (client) {
    //             if (production_queue.addOrderToQueue(client)) {
    //                 this.transition(client, "waitForProduction");
    //             } else {
    //                 this.transition(client, "error");
    //             }
    //         },
    //         readyForProduction: function (client) {
    //             this.deferUntilTransition(client, "waitForProduction");
    //         },
    //         onError: function (client) {
    //             this.transition(client, "error");
    //         }

    //     },
    //     waitForProduction: {
    //         readyForProduction: "readyForProduction",
    //         pause: "orderPaused",
    //         onError: function (client) {
    //             this.transition(client, "error");
    //         }
    //     },
    //     readyForProduction: {
    //         _onEnter: function (client) {
    //         },
    //         productionStarted: "inProduction",
    //         productionPaused: "waitForProduction",
    //         onError: function (client) {
    //             this.transition(client, "error");
    //         }
    //     },
    //     inProduction: {
    //         _onEnter: function (client) {

    //         },
    //         productionFinished: "productionFinished",
    //         onError: function (client) {
    //             this.transition(client, "error");
    //         }
    //     },
    //     productionFinished: {
    //         onEnter: function (client) {

    //         },
    //         onError: function (client) {
    //             this.transition(client, "error");
    //         }
    //     },
    //     orderPaused: {
    //         _onEnter: function (client) {
    //             production_queue.removeOrderFromQueue(client);
    //         },
    //         resume: "enqueueForProduction",
    //         onError: function (client) {
    //             this.transition(client, "error");
    //         }
    //     },
    //     error: {
    //         resume: "enqueueForProduction"
    //     }

// },
    // init: function (client) {
    //     this.handle(client, "_init");
    // },

    orderCreated: function (order) {
        targetState = order.state
        this.handle(order, targetState)
    },

    licenseUpdateAvailable: function (order) {
        logger.debug("[orderStateMachine] licenseUpdateAvailable called")
        this.handle(order, "licenseUpdateAvailable")
    },

    updateLicense: function(order) {
    }
    

// offerReceived: function (client) {
//     this.handle(client, "offerReceived");
// },
// paymentRequestReceived: function (client) {
//     this.handle(client, "paymentRequestReceived");
// },
// paymentArrived: function (client) {
//     this.handle(client, "paymentArrived");
// },
    // licenseAvailable: function (client) {
    //     this.handle(client, "licenseAvailable");
    // },
    // licenseArrived: function (client) {
    //     this.handle(client, "licenseArrived");
    // },
    // readyForProduction: function (client) {
    //     this.handle(client, "readyForProduction");
    // },
    // productionStarted: function (client) {
    //     this.handle(client, "productionStarted");
    // },
    // productionFinished: function (client) {
    //     this.handle(client, "productionFinished");
    // },
    // pause: function (client) {
    //     this.handle(client, "pause");
    // },
    // resume: function (client) {
    //     this.handle(client, "resume");
    // },
    // error: function (client) {
    //     this.handle(client, "onError");
    // },
    // productionPaused: function (client) {
    //     this.handle(client, "productionPaused");
    // }
});

module.exports = stateMachine;
