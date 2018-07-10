var mongoose = require('mongoose');

var MachineSchema = new mongoose.Schema({
    _id: String,
    displayname: String,
    hostname: String,
    ipaddress: String,
    variant: String,
    auth_id: String,
    auth_key: String
}, { _id: false });

module.exports = mongoose.model('Machine', MachineSchema);