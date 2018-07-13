var express = require('express');
var router = express.Router();
var mongoose = require('mongoose');
var Item = require('../models/item');
var Order = require('../models/order');
var _ = require('lodash');
const ams_adapter = require('../adapter/ams_adapter');
const common = require('tdm-common');

_.mapPick = function (objs, keys) {
    return _.map(objs, function (obj) {
        return _.pick(obj, keys)
    })
};

router.post('/order',  function (req, res, next) {
    Item.find(function (err, items) {
        if (err) {
            return next(err);
        }

        var order = {
            orderNumber:42,
            items: items,
        };

        var or = {
            hsmId: "3-1234567",
            items: [
                {
                    dataId: "7B864F08-F89D-4036-93B3-A44B09F4B4C0",
                    amount: 1
                }
            ]
        };

        ams_adapter.createOfferForRequest(or, function(err,offer){

            //TODO Create an order at the marketplace and then save this order locally
            Order.create(order, function(err, order){
                if (err) {
                    return next(err);
                }
                Item.remove({}, function (err) {
                    if(err){
                        console.error("Error on deleting shopping cart items", err);
                    }

                    res.json(_.pick(order, ['_id', 'orderNumber','articles', 'createdAt']));

                });
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