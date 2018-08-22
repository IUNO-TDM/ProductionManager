const mongoose = require('mongoose');

const ItemSchema = new mongoose.Schema({
    dataId: String,
    amount: Number,
    updated: {type: Date, default: Date.now}
});

module.exports = mongoose.model('Item', ItemSchema);