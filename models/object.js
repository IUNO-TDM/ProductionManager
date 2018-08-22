const mongoose = require('mongoose');

const PurchasedObjectSchema = new mongoose.Schema({
    dataId: String,
    name: String,
    state: String,
    filepath: String,
});
module.exports = mongoose.model('PurchasedObject', PurchasedObjectSchema);
