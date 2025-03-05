const mongoose = require("mongoose");

// Define the schema for cities
const citySchema = new mongoose.Schema({
    id: { type: String, unique: true },
    name: String,
    imageUrl: String,
    imageAltText: String
});

// Export the City model
const City = mongoose.model("City", citySchema);
module.exports = City;
