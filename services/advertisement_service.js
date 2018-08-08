var mdns = require('mdns');
const logger = require('../global/logger');
const os = require('os');

const AdvertisementService = function (servicename, port) {
    // var servicetype = new mdns.ServiceType(['http', 'tcp', servicename]);

    var ad = mdns.createAdvertisement(mdns.tcp(servicename), parseInt(port), {name: "IUNO ProductionManager on " + os.hostname()}, (error, service) => {
        if (error) {
            logger.warn("Registration of advertisement wasn't successful: ", error);
        }
    });
    ad.on('error', function (error) {
        logger.warn("Registration of advertisement wasn't successful: ", error)
    });
    ad.start();
};

module.exports = AdvertisementService;