/**
 * Created by beuttlerma on 08.02.17.
 */

const Order = require('../models/order')
var logger = require('../global/logger');
var orderStateMachine = require('../models/order_state_machine');
//
function onOrderNamespaceConnect(socket) {
    logger.info('[socket_io_controller] a user connected: ' + socket.id);

    socket.on('room', function (orderId) {
        logger.info('[socket_io_controller] a user joins order ' + orderId + ' on socket ' + socket.id)
        socket.join(orderId)

        if (orderId == 'allOrders') {
            Order.find(function(error, orders) {
                if (!orders || error) {
                    return
                }
                orders.forEach(order => {
                    var state = order.state
                    socket.emit("state", {"orderNumber": order.id, "toState": state})
                })
            })
        } else {
            Order.findOne({'id': orderId}, function(error, order) {
                if (!order || error) {
                    return
                }
                var state = order.state
                socket.emit("state", {"orderNumber": order.id, "toState": state})
            })
        }
    });

    socket.on('leave', function (orderId) {
        logger.info('[socket_io_controller] a user leaves order ' + orderId + ' on socket ' + socket.id);
        socket.leave(orderId);
    });

    socket.on('disconnect', function () {
        logger.info('[socket_io_controller] a user disconnected: ' + socket.id);
    });
}

function registerOrderStateEvents(orderNamespace) {
    orderStateMachine.on("transition", function (data) {
        let order = data.client
        logger.info("[socket_io_controller] sent statechange " + data.toState + " for OrderNumber " + order.id);
        orderNamespace.to(order.id).emit("state", {
            "orderNumber": order.id,
            "fromState": data.fromState,
            "toState": data.toState
        });
        orderNamespace.to('allOrders').emit("state", {
            "orderNumber": order.id,
            "fromState": data.fromState,
            "toState": data.toState
        });
    });
}



module.exports = function (io) {
    logger.info("[socket_io_controller] Installing socket_io_controller.")
    var orderNamespace = io.of('/orders');
    orderNamespace.on('connection', onOrderNamespaceConnect);
    registerOrderStateEvents(orderNamespace);
};
