const mongoose = require('mongoose');

const MachineSchema = new mongoose.Schema({
    _id: String,
    displayname: String,
    hsmIds: [String],
    hostname: String,
    ipaddress: String,
    variant: String,
    auth_id: String,
    auth_key: String,
    isAuthenticated: Boolean,
    isOnline: Boolean
});
module.exports = mongoose.model('Machine', MachineSchema);