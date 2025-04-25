const mongoose = require('mongoose');

const apiKeySchema = new mongoose.Schema({
    email: {
        type: String,
        required: true,
        unique: true,
    },
    apiKey: {
        type: String,
        required: true,
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
});

const ApiKey = mongoose.model('ApiKey', apiKeySchema);

module.exports = ApiKey;