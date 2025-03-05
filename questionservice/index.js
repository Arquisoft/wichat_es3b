/* Just for testing reasons */

require("dotenv").config({ path: "./wichat_en3b/.env" });
const mongoose = require("mongoose");
const { fetchAndStoreCities } = require("./wikidata-service");

// Connect to MongoDB and execute the functionality
mongoose.connect(process.env.MONGO_URI).then(async () => {
    console.log("Connected to MongoDB");
    await fetchAndStoreCities();
    mongoose.connection.close();
}).catch(err => console.error("MongoDB connection error:", err));
