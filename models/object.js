var mongoose = require('mongoose');

var ObjectSchema = new mongoose.Schema({
    id: String,
    name: String,
    filepath: String,
});
module.exports = mongoose.model('Object', ObjectSchema);
