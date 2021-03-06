/**
 * Created by beuttlerma on 18.04.17.
 */


const path = require('path');

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
    LICENSE_MANAGER: {
        PORT: 11432,
        PROTOCOL: 'http'
    }
};


self.OAUTH_CREDENTIALS = {
    CLIENT_ID: 'adb4c297-5f53-4332-88ff-07398ee44b6e',
    CLIENT_SECRET: 'IsSecret'
};

self.STATISTICS_ENABLED_KEY = "StatisticsEnabled";
self.STATISTICS_ENABLED_DEFAULT = false;

self.COMPATIBLE_MACHINES = [
    "adb4c297-45bd-437e-ac90-a33d0f24de7e",
    "adb4c297-45bd-437e-ac90-d25bc3b27968"
];
self.TMP_DIR = path.resolve(__dirname, '../tmp');
self.FILE_DIR = path.resolve(__dirname, '../files');

self.MONGODB = {
    HOST: 'localhost',
    PORT: 27017,
    DATABASE: 'iuno_production_manager'
};

self.PUBLIC_KEY_FILE_FOR_ENCRYPTION = 'resources/ultimaker.pub';

module.exports = self;
