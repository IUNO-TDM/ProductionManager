var mongoose = require('mongoose');

var LocalObjectSchema = new mongoose.Schema({
    name: String,
    gcode_filepath: String,
    image_filepath: String,
    licenseFee: Number,
    description: String,
    createdAt: Date,
    machines: [String],
    materials: [String],
    marketplaceObjectId: String,
    publishState: String,
    tempEncryptedFilePath: String,
    keyBundleB64: String,
    state: String
});
module.exports = mongoose.model('LocalObject', LocalObjectSchema);