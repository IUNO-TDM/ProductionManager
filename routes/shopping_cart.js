var express = require('express');
var router = express.Router();
var mongoose = require('mongoose');
var Item = require('../models/item');
var Order = require('../models/order');
var _ = require('lodash');
const ams_adapter = require('../adapter/ams_adapter');
const common = require('tdm-common');
const orderStateMachine = require('../models/order_state_machine')



_.mapPick = function (objs, keys) {
    return _.map(objs, function (obj) {
        return _.pick(obj, keys)
    })
};

/**
 * Creates a new order in the database by moving all items from the shopping cart
 * to the order document. Then the marketplace is asked for creating an offer
 * for this order.
 * @returns created order object 
 */
router.post('/order',  function (req, res, next) {
    // check if there is an open order.
    const orderCompletedStates = ["completed", "canceled"]
    Order.find({"state": {"$nin": orderCompletedStates}}, function (err, orders) {
        if (err) {
            return next(err);
        }

        // error: there must not be an open order when creating a new order
        if (orders.length > 0) {
            return next("Error")
        }
    })

    Item.find(function (err, items) {
        if (err) {
            return next(err);
        }

        let orderItems = items.map(item => {
            return {
                "dataId": item.dataId,
                "amount": item.amount
            }
        })

        let offerRequest = {
            hsmId: req.body.hsmId,
            items: orderItems
        };
        console.log("-------------------------")
        console.log(offerRequest)
        console.log("-------------------------")

        ams_adapter.createOfferForRequest(offerRequest, function(err, offer) {
            if (err) {
                console.log(err)
            }

            // offer created, save as order
            let order = {
                items: orderItems,
                offer: {
                    id: offer.id,
                    bip21: offer.bip21
                },
                hsmId: offerRequest.hsmId,
                state: "initial"
            }

            Order.create(order, function(err, order) {
                if (err) {
                    return next(err);
                }
                Item.remove({}, function (err) {
                    if(err) {
                        console.error("Error on deleting shopping cart items", err);
                    }
                    res.json(order)
                });
                orderStateMachine.orderCreated(order)
            })
        });
    });
});

router.get('/items', function (req, res, next) {
    Item.find(function (err, articles) {
        if (err) {
            return next(err);
        }

        res.json(_.mapPick(articles, ['id', 'dataId', 'amount', 'updated']));
    });
});


router.delete('/items', function (req, res, next) {
    Item.remove({}, function (err) {
        if (err) {
            return next(err);
        } else {
            res.send("success");
        }
    });
});


router.post('/items', function (req, res, next) {

    Item.findOne({dataId: req.body.dataId}, function (err, item) {
        if (item) {
            item.amount += 1;
            item.updated = Date.now();
            Item.findOneAndUpdate({dataId: req.body.dataId}, item, {new: true}, function (err, item2) {
                if (err) return next(err);
                res.json(_.pick(item2, ['id', 'dataId', 'amount', 'updated']));
            });
        } else {
            Item.create(req.body, function (err, article) {
                if (err) return next(err);
                res.json(_.pick(article, ['id', 'dataId', 'amount', 'updated']));
            });
        }
    });

    //todo check for article already existing

});

router.get('/items/:id', function (req, res, next) {
    Item.findOne({dataId: req.params.id}, function (err, item) {
        if (err) {
            return next(err);
        }

        res.json(_.pick(item, ['id', 'dataId', 'amount', 'updated']));
    })
});

router.delete('/items/:id', function (req, res, next) {
    Item.findOneAndRemove({dataId: req.params.id}, function (err, item) {
        if (err) {
            return next(err);
        }

        res.json(_.pick(item, ['id', 'dataId', 'amount', 'updated']));
    })
});

router.delete('/items/:id', function (req, res, next) {
    Item.findOneAndRemove({dataId: req.params.id}, function (err, item) {
        if (err) {
            return next(err);
        }

        res.json(_.pick(item, ['id', 'dataId', 'amount', 'updated']));
    })
});

router.put('/items/:id', function (req, res, next) {
    Item.findOneAndUpdate({dataId: req.params.id}, _.pick(req.body, ['dataId']), {new: true}, function (err, item) {
        if (err) {
            return next(err);
        }

        res.json(_.pick(item, ['id', 'dataId', 'amount', 'updated']));
    })
});


module.exports = router;