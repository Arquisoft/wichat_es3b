const axios = require('axios');

const CATEGORIES = require('./categories');
class WikidataQueryService {
    constructor(categoryName, entity, properties, questions) {
        this.wikidataEndpoint = "https://query.wikidata.org/sparql";
        this.categoryName = categoryName;
        this.entity = entity;
        this.properties = properties;
        this.questions = questions;
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


    countryCodesArray = [];

    async  obtenerIdsDeWikidata(tipoEntidad, cantidad = 100) {
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
                    const entityLabel = binding.entityLabel?.value || "";  // Si no tiene label, poner una cadena vacía
                    return {
                        id: entityId,
                        label: entityLabel
                    };
                })
                .filter(entidad => entidad.label && entidad.label !== entidad.id);
            console.log("Datos almacenados en entitiesArray (sin etiquetas vacías):", this.entitiesArray);

        } catch (error) {
            console.error('Error al obtener datos de Wikidata:', error);
            this.entitiesArray = [];
        }
    }

    getQuestions() {
        return this.questions;
    }

}

module.exports = WikidataQueryService;