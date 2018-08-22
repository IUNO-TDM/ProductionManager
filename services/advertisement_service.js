var dnssd = require('dnssd');
const logger = require('../global/logger');

const AdvertisementService = function (servicename, port) {

    const ad = new dnssd.Advertisement(dnssd.tcp(servicename), parseInt(port), {name: "IUNO-ProductionManager"});
    ad.on('error', (err) => {
        logger.warn('Error on advertising via MDNS', err);
    });
    ad.start();
    process.on('exit', () => {
        ad.stop();
        setTimeout(() => {
            process.exit()
        }, 2000)
    });
    process.on('SIGINT', () => {
        ad.stop();
        setTimeout(() => {
            process.exit()
        }, 2000)
    });
};

module.exports = AdvertisementService;