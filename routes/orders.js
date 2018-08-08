var express = require('express');
var router = express.Router();
var mongoose = require('mongoose');
var Order = require('../models/order');
var async = require('async');
var parseString = require('xml2js').parseString;
var _ = require('lodash');
var request = require('request');
const orderStateMachine = require('../models/order_state_machine')

_.mapPick = function (objs, keys) {
    return _.map(objs, function (obj) {
        return _.pick(obj, keys)
    })
};

router.get('/', function (req, res, next) {
    Order.find(function (err, orders) {
        if (err) {
            return next(err);
        }
        res.json(orders)
        // res.json(_.mapPick(products, ['_id', 'orderNumber', 'createdAt']));
    })
});

router.get('/:id', function (req, res, next) {
    Order.findById(req.params.id, function (err, order) {
        if (err) {
            return next(err);
        }

        res.json(_.pick(order, ['_id', 'orderNumber', 'items', 'createdAt']));
    })
});

router.get('/:id/licenseupdate', function (req, res, next) {
    console.log("Licenseopdate of id '"+req.params.id+"'");
    Order.findById(req.params.id, function (err, order) {
        if (order.state == 'licenseUpdateAvailable') {
            orderStateMachine.licenseUpdateAvailable(order)
        }
        // if (err) {
        //     return next(err);
        // }

        // res.json(_.pick(order, ['_id', 'orderNumber', 'items', 'createdAt']));
    })
});


router.delete('/', function (req, res, next) {
    Order.remove({}, function (err) {
        if (err) {
            return next(err);
        } else {
            res.send("success");
        }
    });
});

module.exports = router;