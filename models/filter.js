const mongoose = require('mongoose');

const FilterSchema = new mongoose.Schema({
    _id: String,
    materials: [String],
    machines: [String],
    lang: String,
    purchased: String

}, {capped: {size: 1024 * 1024, max: 200}});
module.exports = mongoose.model('Filter', FilterSchema);
