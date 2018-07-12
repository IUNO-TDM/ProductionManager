var mongoose = require('mongoose');

var OrderSchema = new mongoose.Schema({
    orderNumber: Number,
    items: [
        {
            objectId: String,
            amount: Number
        }
    ],
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Order', OrderSchema);