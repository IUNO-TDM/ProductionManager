var mdns = require('mdns');
const EventEmitter = require('events').EventEmitter;
const util = require('util');
const machine = require('../models/machine');
const ultimakerAdapter = require('../adapter/ultimaker_printer_adapter');
const async = require('async');

const UltimakerPrinterDiscoveryService = function () {

};

const discovery_service = new UltimakerPrinterDiscoveryService();
util.inherits(UltimakerPrinterDiscoveryService, EventEmitter);


discovery_service.browser = mdns.createBrowser(mdns.tcp('_ultimaker'));
discovery_service.browser.on('serviceUp', function (service) {
    discovery_service.emit('serviceUp', service);

    if (service && service.host) {

        async.parallel([
            function (callback) {
                ultimakerAdapter.getSystemGuid(service.host, function (err, data) {
                    callback(err, data);
                })
            },
            function (callback) {
                ultimakerAdapter.getSystemName(service.host, function (err, data) {
                    callback(err, data);
                })
            },
            function (callback) {
                ultimakerAdapter.getSystemVariant(service.host, function (err, data) {
                    callback(err, data);
                })
            }
        ], function (err, results) {
            if(!err){
                var m = {};
                m._id = results[0];
                m.displayname = results[1];
                m.variant = results[2];
                m.hostname = service.host;

                machine.findById(m._id, function(err,mach){
                    if(!mach){
                        machine.create(m);
                    }
                });





            }
        })


    }


});
discovery_service.browser.on('serviceDown', function (service) {
    discovery_service.emit('serviceDown', service);
});
discovery_service.browser.start();


module.exports = discovery_service;
