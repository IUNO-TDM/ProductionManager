var mongoose = require('mongoose');

var OrderSchema = new mongoose.Schema({
    items: [
        {
            objectId: String,
            amount: Number
        }
    ],
    offer: {
        id: String,
        bip21: String,
    },
    hsmId: String,
    state: String,
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Order', OrderSchema);