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

    countryCodesArray = []; // Array para almacenar objetos con label e ID de países

    async  obtenerDatosDeWikidata(tipoEntidad, cantidad = 100) {
        const sparqlQuery = `
    SELECT ?entity ?entityLabel WHERE {
        ?entity wdt:P31 ${tipoEntidad}.
        SERVICE wikibase:label { bd:serviceParam wikibase:language "[AUTO_LANGUAGE],es". }
    }
    LIMIT ${cantidad}
`;

        try {
            const data = await this.fetchData(sparqlQuery);
            this.entitiesArray = data.results.bindings
                .map(binding => {
                    const entityEntity = binding.entity.value;
                    const parts = entityEntity.split('/');
                    const entityId = parts[parts.length - 1];
                    const entityLabel = binding.entityLabel.value;
                    return {
                        id: entityId,
                        label: entityLabel
                    };
                })
                .filter(entidad => { // **AÑADIMOS UN FILTRO AQUÍ EN JAVASCRIPT**
                    return entidad.label !== ""; // Filtra entidades donde el label NO sea una cadena vacía
                });
            console.log("Datos almacenados en entitiesArray (sin etiquetas vacías):", this.entitiesArray);

        } catch (error) {
            console.error('Error al obtener datos de Wikidata:', error);
            this.entitiesArray = [];
        }
    }


    async fetchIncorrectCountryOptions(correctCountryItemId) {
        const sparqlQuery =  `
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

    async fetchPlanetQuestionData() {
        const sparqlQuery = `
        SELECT ?planet ?planetLabel ?image WHERE {
            VALUES ?planet {
                wd:Q308  # Mercurio
                wd:Q313  # Venus
                wd:Q2    # Tierra
                wd:Q111  # Marte
                wd:Q319  # Júpiter
                wd:Q193  # Saturno
                wd:Q324  # Urano
                wd:Q332  # Neptuno
            }
            ?planet wdt:P18 ?image.  # P18 es la propiedad de imagen
            SERVICE wikibase:label { bd:serviceParam wikibase:language "[AUTO_LANGUAGE],es". }
        }
        ORDER BY RAND()  # Ordena aleatoriamente los resultados
        LIMIT 1 
    `;
        return this.fetchData(sparqlQuery);
    }

    async fetchIncorrectPlanetOptions(correctPlanetItemId) {
        const sparqlQuery = `
        SELECT ?planet ?planetLabel ?image WHERE {
            VALUES ?planet {
                wd:Q308  # Mercurio
                wd:Q313  # Venus
                wd:Q2    # Tierra
                wd:Q111  # Marte
                wd:Q319  # Júpiter
                wd:Q193  # Saturno
                wd:Q324  # Urano
                wd:Q332  # Neptuno
            }
        ?planet wdt:P18 ?image.  # P18 es la propiedad de imagen
        FILTER(?planet != wd:Q2)  # Aquí excluimos a la Tierra como planeta correcto (puedes cambiar esto dinámicamente)
        SERVICE wikibase:label { bd:serviceParam wikibase:language "[AUTO_LANGUAGE],es". }
        }
        ORDER BY RAND()  # Ordena aleatoriamente los resultados
        LIMIT 3
        `;
        return this.fetchData(sparqlQuery);
    }
}

module.exports = WikidataQueryService;