const axios = require('axios');

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
            console.error(`Error al consultar Wikidata para ${this.categoryName}:`, error);
            throw error;
        }
    }

    async obtenerDatosDeWikidata(cantidad = 100) {
        const sparqlQuery = `
            SELECT ?entity ?entityLabel WHERE {
                ?entity wdt:P31 ${this.entity}.
                SERVICE wikibase:label { bd:serviceParam wikibase:language "[AUTO_LANGUAGE],es". }
            }
            LIMIT ${cantidad}
        `;

        try {
            const data = await this.fetchData(sparqlQuery);
            return data.results.bindings.map(binding => ({
                id: binding.entity.value.split('/').pop(),
                label: binding.entityLabel?.value || ""
            })).filter(entidad => entidad.label && entidad.label !== entidad.id);

        } catch (error) {
            console.error(`❌ Error obteniendo datos de la categoría ${this.categoryName}:`, error);
            return [];
        }
    }

    getQuestions() {
        return this.questions;
    }
}

module.exports = WikidataQueryService;
