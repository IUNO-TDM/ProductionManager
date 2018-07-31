/**
 * Created by beuttlerma on 18.04.17.
 */


const self = {};


// ---- CONFIGURATION EXPORT ----

self.LOG_LEVEL = 'debug';
self.HOST_SETTINGS = {
    ADDITIVE_MACHINE_SERVICE: {
        HOST: 'localhost',
        PORT: 3007,
        PROTOCOL: 'http'
    },
    OAUTH_SERVER: {
        HOST: 'localhost',
        PORT: 3005,
        PROTOCOL: 'http'
    },
    ULTIMAKER: {
        PORT: 80,
        PROTOCOL: 'http'
    },
    PAYMENT_SERVICE: {
        HOST: 'localhost',
        PORT: 8080,
        PROTOCOL: 'http'
    },
};


self.OAUTH_CREDENTIALS = {
    CLIENT_ID: 'adb4c297-5f53-4332-88ff-07398ee44b6e',
    CLIENT_SECRET: 'IsSecret'
};

self.STATISTICS_ENABLED_KEY = "StatisticsEnabled";
self.STATISTICS_ENABLED_DEFAULT = false;


module.exports = self;
