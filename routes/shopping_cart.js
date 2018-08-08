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
                "dataId": item.objectId,
                "amount": item.amount
            }
        })

        let offerRequest = {
            hsmId: req.body.hsmId,
            items: orderItems
        };

        ams_adapter.createOfferForRequest(offerRequest, function(err, offer) {
            if (err) {

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

        res.json(_.mapPick(articles, ['_id', 'objectId', 'amount', 'updated']));
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

    Item.findOne({objectId: req.body.objectId}, function (err, item) {
        if (item) {
            item.amount += 1;
            item.updated = Date.now();
            Item.findByIdAndUpdate(item._id, item, {new: true}, function (err, item2) {
                if (err) return next(err);
                res.json(_.pick(item2, ['_id', 'objectId', 'amount', 'updated']));
            });
        } else {
            Item.create(req.body, function (err, article) {
                if (err) return next(err);
                res.json(_.pick(article, ['_id', 'objectId', 'amount', 'updated']));
            });
        }
    });

    //todo check for article already existing

});

router.get('/items/:id', function (req, res, next) {
    Item.findById(req.params.id, function (err, item) {
        if (err) {
            return next(err);
        }

        res.json(_.pick(item, ['_id', 'objectId', 'amount', 'updated']));
    })
});

router.delete('/items/:id', function (req, res, next) {
    Item.findByIdAndRemove(req.params.id, function (err, item) {
        if (err) {
            return next(err);
        }

        res.json(_.pick(item, ['_id', 'objectId', 'amount', 'updated']));
    })
});

router.delete('/items/:id', function (req, res, next) {
    Item.findByIdAndRemove(req.params.id, function (err, item) {
        if (err) {
            return next(err);
        }

        res.json(_.pick(item, ['_id', 'objectId', 'amount', 'updated']));
    })
});

router.put('/items/:id', function (req, res, next) {
    Item.findByIdAndUpdate(req.params.id, _.pick(req.body, ['_id']), {new: true}, function (err, item) {
        if (err) {
            return next(err);
        }

        res.json(_.pick(item, ['_id', 'objectId', 'amount', 'updated']));
    })
});


module.exports = router;