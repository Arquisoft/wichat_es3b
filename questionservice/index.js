/* Just for testing reasons */

require("dotenv").config({ path: "./wichat_en3b/.env" });

const mongoose = require("mongoose");
const { fetchAndStoreCities } = require("./service/wikidata-service");
const { getRandomCitiesWithImage } = require("./service/wikidata-service");
// Connect to MongoDB and execute the functionality
mongoose.connect(process.env.MONGO_URI).then(async () => {
    console.log("Connected to MongoDB");
    await fetchAndStoreCities();
    const randomCities = await getRandomCitiesWithImage();
    console.log("Random Cities with Image:", JSON.stringify(randomCities, null, 2));
    mongoose.connection.close();
}).catch(err => console.error("MongoDB connection error:", err));
