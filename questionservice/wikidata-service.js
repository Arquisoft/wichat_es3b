const axios = require("axios");
const mongoose = require("mongoose");
const express = require("express");
const WikidataObject = require("./wikidata-model");
const cors = require('cors');
const app = express();
// To allow access from port 3000
app.use(cors({
    origin: 'http://localhost:3000' // Only allow port 3000
}));

app.use(express.json());

//define the port
const port = 8004; 

//Define the connection to DB
const mongoDB = process.env.mongoDB || 'mongodb://localhost:27017/mongo-db-wichat_en3b'; 

// SPARQL endpoint for WikiData
const SPARQL_ENDPOINT = "https://query.wikidata.org/sparql";

// Global variable to store the selected game modes
let selectedModes = []; 

const QUERIES = {
    city: `SELECT ?city ?cityLabel ?image WHERE {
  ?city wdt:P31 wd:Q515;  # La entidad es una ciudad
        wikibase:sitelinks ?sitelinks;  # Número de enlaces en Wikipedia
        wdt:P18 ?image.  # La ciudad tiene una imagen
  SERVICE wikibase:label { bd:serviceParam wikibase:language "en". }
}
ORDER BY DESC(?sitelinks)
LIMIT 50`,

    flag: `SELECT ?flag ?flagLabel ?image WHERE {
  ?flag wdt:P31 wd:Q6256;  # La entidad es un país
           wikibase:sitelinks ?sitelinks;  # Número de enlaces en Wikipedia
           wdt:P41 ?image.  # Imagen de la bandera del país
  SERVICE wikibase:label { bd:serviceParam wikibase:language "en". }
}
ORDER BY DESC(?sitelinks)  # Ordenamos por popularidad
LIMIT 50
`,

    athlete: `SELECT DISTINCT ?athlete ?athleteLabel ?image WHERE {
  ?athlete wdt:P31 wd:Q5;  # Es una persona
           wdt:P106 ?sport;  # Es un deportista
           wikibase:sitelinks ?sitelinks;  # Número de enlaces en Wikipedia
           wdt:P18 ?image;  # Tiene imagen obligatoria
           wdt:P166 ?award.  # Ha ganado un premio importante

  # Filtrar por tipos de deportistas
  VALUES ?sport { wd:Q937857 wd:Q10833314 wd:Q3665646 }  
  # Q937857 = Futbolista
  # Q10833314 = Tenista
  # Q3665646 = Baloncestista

  SERVICE wikibase:label { bd:serviceParam wikibase:language "en". }
}
ORDER BY DESC(?sitelinks)  # Ordenamos por popularidad
LIMIT 50
`,

    singer: `SELECT ?singer ?singerLabel ?image (COUNT(?sitelink) AS ?numLangs) WHERE {
  ?singer wdt:P31 wd:Q5;  # Es una persona
          wdt:P106 wd:Q177220;  # Es un cantante
          wdt:P18 ?image.  # Tiene una imagen asociada

  OPTIONAL {
    ?sitelink schema:about ?singer.
  }

  SERVICE wikibase:label { bd:serviceParam wikibase:language "en". }
}
GROUP BY ?singer ?singerLabel ?image
ORDER BY DESC(?numLangs)  # Ordenamos por cantidad de enlaces en Wikipedia
LIMIT 50
`
};


mongoose.connect(mongoDB)
    .then(() => console.log('Connected'))
    .catch(err => console.log('Error on the connection to the DB. ', err)); 


// Function to fetch the alternative description of an image from Wikimedia Commons
async function getImageDescription(imageUrl) {
    const fileName = decodeURIComponent(imageUrl.split("/").pop()); // Extract the image filename
    const commonsApiUrl = `https://commons.wikimedia.org/w/api.php?action=query&titles=File:${fileName}&prop=imageinfo&iiprop=extmetadata&format=json`;

    try {
        const response = await axios.get(commonsApiUrl);
        const pages = response.data.query.pages;
        const pageId = Object.keys(pages)[0]; // Get the first (and only) page ID

        if (pages[pageId].imageinfo) { 
            const metadata = pages[pageId].imageinfo[0].extmetadata;
            return metadata.ImageDescription?.value || "No alternative text available"; // Return image description or fallback message
        }
        return "No alternative text available"; // If no description is found, return a default message
    } catch (error) {
        console.error("Error fetching image description:", error);
        return "No alternative text available"; // Return a fallback message in case of an error
    }
}

async function fetchAndStoreData(modes) {
    try {
        const fetchPromises = modes.map(async (mode) => {
            if (!QUERIES[mode]) return;

            const response = await axios.get(SPARQL_ENDPOINT, {
                params: { query: QUERIES[mode], format: "json" },
                headers: { "User-Agent": "QuizGame/1.0 (student project)" }
            });

            const items = await Promise.all(response.data.results.bindings.map(async (item) => {
                const id = item[mode]?.value?.split("/").pop() || "Unknown";
                const name = item[`${mode}Label`]?.value || "No Name";
                const imageUrl = item.image?.value || "";
                const imageAltText = item.image?.value ? await getImageDescription(item.image.value) : "No alternative text available";

                return { id, name, imageUrl, imageAltText, mode };
            }));            
            
            await WikidataObject.insertMany(items, { ordered: false }).catch(err => console.log("Some elements could not be saved: ", err));
        });

        await Promise.all(fetchPromises);
    } catch (error) {
        console.error("Error obtaining data from Wikidata:", error);
    }
}

// Función para vaciar la base de datos
async function clearDatabase() {
    try {
        await WikidataObject.deleteMany({});
    } catch (error) {
        console.error("Error clearing the database:", error);
    }
}

// Endpoint to fetch data from Wikidata and store it in the database
app.post("/load", async (req, res) => {
    try {
        const { modes } = req.body;
        if (!modes || !Array.isArray(modes)) {
            return res.status(400).json({ error: "Invalid modes parameter" });
        }

        selectedModes = modes; // Store the selected modes in the global variable
        await clearDatabase(); // Clear the database before loading new data
        await fetchAndStoreData(modes); // Fetch data and store it in MongoDB
        
        res.status(200).json({ message: "Data successfully stored" });
    } catch (error) {
        console.error("Error in /load endpoint:", error);
        res.status(500).json({ error: "Internal server error" });
    }
});

// Function to get random items from MongoDB
async function getRandomItems() {
    try {
        const randomMode = selectedModes[Math.floor(Math.random() * selectedModes.length)]; // Choose a random mode from the selected ones
        const items = await WikidataObject.aggregate([
            { $match: { mode: randomMode } }, // Filter by the chosen mode
            { $sample: { size: 4 } } // Retrieve 4 random items
        ]);

        const randomItem = items[Math.floor(Math.random() * items.length)]; // Choose one random item
        return {
            mode: randomMode,
            items: items.map(item => ({ name: item.name })), // Return only names
            itemWithImage: randomItem // Return one item with an image
        };
    } catch (error) {
        console.error("Error fetching random items:", error);
        throw error;
    }
}

// Endpoint to get a game round with random items
app.get("/getRound", async (req, res) => {
    try {
        if (selectedModes.length === 0) {
            return res.status(400).json({ error: "No modes available. Load data first." });
        }

        const data = await getRandomItems(); // Use stored modes instead of receiving them in the request
        res.json(data);
    } catch (error) {
        console.error("Error in /getRound endpoint:", error);
        res.status(500).json({ error: "Internal server error" });
    }
});

const server = app.listen(port, () => {
    console.log(`Question Service listening at http://localhost:${port}`);
  });

// Exporting the function so that it can be used in other files
module.exports = server;