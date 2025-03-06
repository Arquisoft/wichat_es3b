const axios = require('axios');

class WikidataQueryService {
    constructor() {
        this.wikidataEndpoint = "https://query.wikidata.org/sparql";
    }

    async fetchData(sparqlQuery) {
        const url = `${this.wikidataEndpoint}?query=${encodeURIComponent(sparqlQuery)}&format=json`;
        try {
            const response = await axios.get(url);
            return response.data;
        } catch (error) {
            console.error("Error al realizar consulta SPARQL:", error);
            throw error;
        }
    }

    async fetchCountryFlagQuestionData() {
        const sparqlQuery = `
        SELECT ?countryLabel ?flag ?country WHERE {
          ?country wdt:P31 wd:Q6256;
                   wdt:P41 ?flag.
          SERVICE wikibase:label { bd:serviceParam wikibase:language "es". }
        }
        ORDER BY RAND()
        LIMIT 1
    `;
        return this.fetchData(sparqlQuery);
    }

    async fetchIncorrectCountryOptions(correctCountryItemId) {
        const sparqlQuery = `
            SELECT ?countryLabel WHERE {
              ?country wdt:P31 wd:Q6256;
                       FILTER (?country != wd:${correctCountryItemId})
              FILTER EXISTS { ?country rdfs:label ?countryLabel FILTER(lang(?countryLabel) = "es") }
              SERVICE wikibase:label { bd:serviceParam wikibase:language "es". }
            }
            ORDER BY RAND()
            LIMIT 3
        `;
        return this.fetchData(sparqlQuery);
    }
}

module.exports = WikidataQueryService;