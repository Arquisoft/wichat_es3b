const mongoose = require("mongoose"); // Library for interacting with MongoDB
const axios = require("axios"); // Library for making HTTP requests
require("dotenv").config({ path: "./wichat_en3b/.env" }); // Load environment variables from a .env file

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI, { 
    useNewUrlParser: true, 
    useUnifiedTopology: true 
}).then(() => console.log("Connected to MongoDB"))
  .catch(err => console.error("MongoDB connection error:", err));

// Define the Mongoose schema
const citySchema = new mongoose.Schema({
    id: { type: String, unique: true }, // Ensure unique IDs
    name: String,
    imageUrl: String,
    imageAltText: String
});

// Create the model
const City = mongoose.model("City", citySchema);

// SPARQL endpoint for WikiData
const SPARQL_ENDPOINT = "https://query.wikidata.org/sparql";

// SPARQL query to get the 50 most populated cities with an image
const SPARQL_QUERY = `
SELECT DISTINCT ?city ?cityLabel ?image WHERE {  
  ?city wdt:P31 wd:Q515;   
        wdt:P1082 ?population;  
        wdt:P18 ?image.   
  SERVICE wikibase:label { bd:serviceParam wikibase:language "en". }  
} 
ORDER BY DESC(?population)  
LIMIT 50  
`;

// Function to fetch alternative text for an image from Wikimedia Commons
async function getImageDescription(imageUrl) {
    const fileName = decodeURIComponent(imageUrl.split("/").pop());
    const commonsApiUrl = `https://commons.wikimedia.org/w/api.php?action=query&titles=File:${fileName}&prop=imageinfo&iiprop=extmetadata&format=json`;

    try {
        const response = await axios.get(commonsApiUrl);
        const pages = response.data.query.pages;
        const pageId = Object.keys(pages)[0];

        if (pages[pageId].imageinfo) { 
            const metadata = pages[pageId].imageinfo[0].extmetadata;
            return metadata.ImageDescription?.value || "No alternative text available";
        }
        return "No alternative text available";
    } catch (error) {
        console.error("Error fetching image description:", error);
        return "No alternative text available";
    }
}

// Function to fetch and save cities in MongoDB
async function fetchAndStoreCities() {
    try {
        // Fetch city data from WikiData
        const response = await axios.get(SPARQL_ENDPOINT, {
            params: { query: SPARQL_QUERY, format: "json" },
            headers: { "User-Agent": "QuizGame/1.0 (student project)" }
        });

        // Process the results
        const cities = await Promise.all(response.data.results.bindings.map(async (city) => {
            const imageUrl = city.image.value;
            const imageAltText = await getImageDescription(imageUrl);

            return {
                id: city.city.value.split("/").pop(),
                name: city.cityLabel.value,
                imageUrl,
                imageAltText
            };
        }));

        // Insert or update cities in MongoDB
        for (const city of cities) {
            await City.findOneAndUpdate(
                { id: city.id }, // Find by city ID
                city, // Update fields
                { upsert: true, new: true } // Insert if not exists, return updated document
            );
        }

        console.log("Cities successfully stored in MongoDB");
    } catch (error) {
        console.error("Error fetching and storing cities:", error);
    } finally {
        mongoose.connection.close(); // Close MongoDB connection after operation
    }
}

// Execute the function
fetchAndStoreCities();
