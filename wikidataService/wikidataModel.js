const mongoose = require("mongoose");
const dataSchema = new mongoose.Schema({
    name: String,
    id: String,
    url: String,
    altText: String
});

const Data = mongoose.model('User', dataSchema);

module.exports = Data