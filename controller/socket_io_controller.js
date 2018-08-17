/**
 * Created by beuttlerma on 08.02.17.
 */

const Order = require('../models/order');
const LocalObject = require('../models/local_object');
var logger = require('../global/logger');
var orderStateMachine = require('../models/order_state_machine');
var publishStateMachine = require('../models/publish_state_machine');
const downloadService = require('../services/download_service');
const uploadService = require('../services/upload_service');

//
function onOrderNamespaceConnect(socket) {
    logger.info('[socket_io_controller] a user connected: ' + socket.id);

    socket.on('room', function (orderId) {
        logger.info('[socket_io_controller] a user joins order ' + orderId + ' on socket ' + socket.id);
        socket.join(orderId);

        if (orderId == 'allOrders') {
            Order.find(function (error, orders) {
                if (!orders || error) {
                    return
                }
                orders.forEach(order => {
                    var state = order.state;
                    socket.emit("state", {"orderNumber": order.id, "toState": state})
                })
            })
        } else {
            Order.findOne({'id': orderId}, function (error, order) {
                if (!order || error) {
                    return
                }
                var state = order.state;
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
        let order = data.client;
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

// Download Namespace

function onDownloadNamespaceConnect(socket) {
    logger.info('[socket_io_controller/downloadservice] a user connected to namespace: ' + socket.id);

    socket.on('room', function (downloadId) {
        logger.info('[socket_io_controller/downloadservice] a user joined to room: ' + downloadId);
        socket.join(downloadId);
        let state = downloadService.getDownloadState(downloadId);
        socket.emit('state_change', state)
    });

    socket.on('leave', function (downloadId) {
        logger.info('[socket_io_controller/downloadservice] a user leaves room: ' + downloadId);
        socket.leave(downloadId);
    });


    socket.on('disconnect', function () {
        logger.info('[socket_io_controller/downloadservice] a user disconnected: ' + socket.id);
    });
}

function registerDownloadEvents(downloadNamespace) {
    downloadService.on('state_change', download => {
        downloadNamespace.to(download.id).emit('state_change', {
            id: download.id,
            state: download.state,
            bytesDownloaded: download.bytesDownloaded,
            bytesTotal: download.bytesTotal,
        });
    })
}

// Upload Namespace

function onUploadNamespaceConnect(socket) {
    logger.info('[socket_io_controller/uploadservice] a user connected to namespace: ' + socket.id);

    socket.on('room', function (uploadId) {
        logger.info('[socket_io_controller/uploadservice] a user joined to room: ' + uploadId);
        socket.join(uploadId);
        let state = uploadService.getUploadState(uploadId);
        socket.emit('state_change', state)
    });

    socket.on('leave', function (uploadId) {
        logger.info('[socket_io_controller/uploadservice] a user leaves room: ' + uploadId);
        socket.leave(uploadId);
    });


    socket.on('disconnect', function () {
        logger.info('[socket_io_controller/uploadservice] a user disconnected: ' + socket.id);
    });
}

function registerUploadEvents(uploadNamespace) {
    uploadService.on('state_change', upload => {
        uploadNamespace.to(upload.id).emit('state_change', {
            id: upload.id,
            state: upload.state,
            bytesUploaded: upload.bytesUploaded,
            bytesTotal: upload.bytesTotal,
        });
    })
}

function onPublishNamespaceConnect(socket) {
    logger.info('[socket_io_controller] a user connected: ' + socket.id);

    socket.on('room', function (localObjectId) {
        logger.info('[socket_io_controller] a user joins publish for  ' + localObjectId + ' on socket ' + socket.id);
        socket.join(localObjectId);

        if (localObjectId == 'allObjects') {
            LocalObject.find(function (error, objects) {
                if (!objects || error) {
                    return
                }
                objects.forEach(object => {
                    var state = object.state;
                    socket.emit("state", {"localObjectId": object.id, "toState": state})
                })
            })
        } else {
            LocalObject.findById(localObjectId, function (error, object) {
                if (!object || error) {
                    return
                }
                var state = object.state;
                socket.emit("state", {"localObjectId": object.id, "toState": state})
            })
        }
    });

    socket.on('leave', function (orderId) {
        logger.info('[socket_io_controller] a user leaves publish for ' + orderId + ' on socket ' + socket.id);
        socket.leave(orderId);
    });

    socket.on('disconnect', function () {
        logger.info('[socket_io_controller] a user disconnected: ' + socket.id);
    });
}

function registerPublishStateEvents(publishNamespace) {
    publishStateMachine.on("transition", function (data) {
        let object = data.client;
        logger.info("[socket_io_controller] sent statechange " + data.toState + " for LocalObject " + object.id);
        publishNamespace.to(object.id).emit("state", {
            "localObjectId": object.id,
            "fromState": data.fromState,
            "toState": data.toState
        });
        publishNamespace.to('allObjects').emit("state", {
            "localObjectId": object.id,
            "fromState": data.fromState,
            "toState": data.toState
        });
    });
    publishStateMachine.on('upload_state_change', function(data){
        publishNamespace.to(data.localObjectId).emit("uploadState", {
            localObjectId: data.localObjectId,
            state: data.state,
            bytesUploaded: data.bytesUploaded,
            bytesTotal: data.bytesTotal
        });
        publishNamespace.to('allObjects').emit("uploadState", {
            localObjectId: data.localObjectId,
            state: data.state,
            bytesUploaded: data.bytesUploaded,
            bytesTotal: data.bytesTotal
        });
    })
}


module.exports = function (io) {
    logger.info("[socket_io_controller] Installing socket_io_controller.");

    var orderNamespace = io.of('/orders');
    orderNamespace.on('connection', onOrderNamespaceConnect);
    registerOrderStateEvents(orderNamespace);

    var downloadNamespace = io.of('/downloadservice');
    downloadNamespace.on('connection', onDownloadNamespaceConnect);
    registerDownloadEvents(downloadNamespace);

    var uploadNamespace = io.of('/uploadservice');
    uploadNamespace.on('connection', onUploadNamespaceConnect);
    registerUploadEvents(uploadNamespace);

    var publishNamespace = io.of('/publish');
    publishNamespace.on('connection', onPublishNamespaceConnect);
    registerPublishStateEvents(publishNamespace);
};
