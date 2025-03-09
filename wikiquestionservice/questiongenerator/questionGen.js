const axios = require('axios');

class WikidataQueryService {
    constructor(categoryName, entity, properties, questions) {
        this.wikidataEndpoint = "https://query.wikidata.org/sparql";
        this.categoryName = categoryName;
        this.entity = entity;
        this.properties = properties;
        this.questions = questions;
        this.entitiesArray = [];
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

    async obtenerIdsDeWikidata(cantidad = 100) {
        const sparqlQuery = `
        SELECT ?entity ?entityLabel WHERE {
            ?entity wdt:P31 ${this.entity}.
            SERVICE wikibase:label { bd:serviceParam wikibase:language "[AUTO_LANGUAGE],es". }
        }
        LIMIT ${cantidad}`;

        try {
            const data = await this.fetchData(sparqlQuery);
            this.entitiesArray = data.results.bindings
                .map(binding => {
                    const entityEntity = binding.entity.value;
                    const parts = entityEntity.split('/');
                    const entityId = parts[parts.length - 1];
                    const entityLabel = binding.entityLabel?.value || "";
                    return { id: entityId, label: entityLabel };
                })
                .filter(entidad => entidad.label && entidad.label !== entidad.id);

            console.log("Datos almacenados en entitiesArray:", this.entitiesArray);
        } catch (error) {
            console.error('Error al obtener datos de Wikidata:', error);
            this.entitiesArray = [];
        }
    }

    getQuestions() {
        return this.questions;
    }

    async generateQuestions() {
        await this.obtenerIdsDeWikidata();

        if (this.entitiesArray.length === 0) {
            console.warn("⚠️ No hay entidades disponibles para generar preguntas.");
            return [];
        }

        let generatedQuestions = [];

        for (const entity of this.entitiesArray) {
            const entityName = entity.label;
            const indiceAleatorio = Math.floor(Math.random() * this.questions.length);
            const preguntaAleatoria = this.questions[indiceAleatorio];
            const preguntasModificadas = {};
            for (const idioma in preguntaAleatoria) {
                if (preguntaAleatoria.hasOwnProperty(idioma)) {
                    let preguntaEnIdioma = preguntaAleatoria[idioma];
                    preguntaEnIdioma = preguntaEnIdioma.replace("%", entityName);
                    preguntasModificadas[idioma] = preguntaEnIdioma;
                }
            }
            console.log("Preguntas: "+preguntasModificadas);
            const jefeDeEstado = await this.obtenerValorDePropiedad(entity.id, this.properties[indiceAleatorio]);
            console.log("Nombre entidad: "+entityName,", valor obtenido : "+jefeDeEstado);
            //console.log(indiceAleatorio,entityName,this.questions[indiceAleatorio],this.obtenerValorDePropiedad(entity.id,this.properties[indiceAleatorio]));
        }

        console.log("Preguntas generadas:", generatedQuestions);
        return generatedQuestions;
    }

    async obtenerValorDePropiedad(id, property) {
        const sparqlQuery = `
    SELECT ?propertyValueLabel WHERE {
        wd:${id} wdt:${property} ?propertyValue.
        SERVICE wikibase:label { bd:serviceParam wikibase:language "[AUTO_LANGUAGE],es". }
    }`;

        try {
            const data = await this.fetchData(sparqlQuery);

            if (data.results.bindings.length > 0) {
                const propertyValueLabel = data.results.bindings[0].propertyValueLabel.value;
                return propertyValueLabel;
            } else {
                console.warn("⚠️ No se encontró el valor de la propiedad.");
                return null;
            }
        } catch (error) {
            console.error('Error al obtener valor de propiedad:', error);
            return null;
        }
    }
}

module.exports = WikidataQueryService;
