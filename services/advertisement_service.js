var dnssd = require('dnssd');
const logger = require('../global/logger');
const os = require('os');

const AdvertisementService = function (servicename, port) {
    var servicetype = new dnssd.ServiceType(['_' + servicename, '_tcp']);

    const ad = new dnssd.Advertisement(servicetype, parseInt(port), {name: "IUNO-ProductionManager"});
    ad.start();
    process.on('exit',()=>{
        ad.stop();
        setTimeout(()=>{
            process.exit()
        },2000)
    });
    process.on('SIGINT', ()=>{
        ad.stop();
        setTimeout(()=>{
            process.exit()
        },2000)
    });
};

module.exports = AdvertisementService;