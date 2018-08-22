const mongoose = require('mongoose');

const OrderSchema = new mongoose.Schema({
    items: [
        {
            dataId: String,
            amount: Number
        }
    ],
    offer: {
        id: String,
        bip21: String,
    },
    hsmId: String,
    state: String,
    createdAt: {type: Date, default: Date.now}
});

module.exports = mongoose.model('Order', OrderSchema);