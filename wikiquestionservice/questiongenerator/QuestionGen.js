const axios = require('axios');
const Question = require('./Question');
class WikidataQueryService {
    constructor(categoryName, entity, properties, questions,types,img) {
        this.wikidataEndpoint = "https://query.wikidata.org/sparql";
        this.categoryName = categoryName;
        this.entity = entity;
        this.properties = properties;
        this.questions = questions;
        this.entitiesArray = [];
        this.types=types;
        this.questionsArray=[];
        this.img=img;
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
    convertirValorPorTipo(valor, tipo) {
        if (tipo === "date") {
            const fecha = new Date(valor);
            return fecha.toLocaleDateString("es-ES");
        } else if (tipo === "num") {
            return parseFloat(valor);
        } else if (tipo === "str") {
            return valor;
        }
        return valor;
    }

    async obtenerIdsDeWikidata(cantidad = 10) {
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

        } catch (error) {
            console.error('Error al obtener datos de Wikidata:', error);
            this.entitiesArray = [];
        }
    }

    getQuestions() {
        return this.questionsArray;
    }

    async generateQuestions() {
        await this.obtenerIdsDeWikidata();
        if (this.entitiesArray.length === 0) {
            console.warn("⚠️ No hay entidades disponibles para generar preguntas.");
            return [];
        }
        for (const entity of this.entitiesArray) {
            const entityName = entity.label;
            const indiceAleatorio = Math.floor(Math.random() * this.questions.length);
            const descripcion = [];
            for (let i = 0; i < this.properties.length; i++) {
                if (i === indiceAleatorio) {
                    continue;
                }
                const property = this.properties[i];
                const tipo = this.types[i];
                const valoresDePropiedad = await this.obtenerValoresDePropiedad(entity.id, property,tipo);
                if (valoresDePropiedad.length > 0) {
                    const etiquetaPropiedad = await this.obtenerEtiquetaDePropiedad(property);
                    if (this.validar(valoresDePropiedad[0])) {
                        continue;
                    }
                    descripcion.push({
                        propiedad: etiquetaPropiedad,
                        valor: valoresDePropiedad[0]
                    });
                }
            }
            if (descripcion.length === 0) {
                continue;
            }
            const valoresDePropiedad = await this.obtenerValoresDePropiedad(entity.id, this.properties[indiceAleatorio],this.types[indiceAleatorio]);
            if (valoresDePropiedad.length === 0) {
                continue;
            }
            const respuestaCorrecta = valoresDePropiedad[0];
            if (this.validar(respuestaCorrecta)) {
                continue;
            }
            const respuestasIncorrectas = await this.obtenerRespuestasIncorrectas(entity.id, this.properties[indiceAleatorio], valoresDePropiedad,this.types[indiceAleatorio]);
            if (respuestasIncorrectas.some(respuesta => this.validar(respuesta))) {
                continue;
            }
            if (respuestasIncorrectas.length !== 3) {
                continue;
            }

            const preguntaAleatoria = this.questions[indiceAleatorio];
            const preguntasModificadas = {};
            for (const idioma in preguntaAleatoria) {
                if (preguntaAleatoria.hasOwnProperty(idioma)) {
                    let preguntaEnIdioma = preguntaAleatoria[idioma];
                    preguntaEnIdioma = preguntaEnIdioma.replace("%", entityName);
                    preguntasModificadas[idioma] = preguntaEnIdioma;
                }
            }
            const imgprueba = await this.obtenerValoresDePropiedad(entity.id,this.img[0]);
            const nuevaPregunta = new Question(respuestaCorrecta, preguntasModificadas, respuestasIncorrectas, descripcion, imgprueba);
            this.questionsArray.push(nuevaPregunta);
        }
    }

    async obtenerValoresDePropiedad(id, property,tipo) {
        const sparqlQuery = `
        SELECT ?propertyValueLabel WHERE {
            wd:${id} wdt:${property} ?propertyValue.
            SERVICE wikibase:label { bd:serviceParam wikibase:language "[AUTO_LANGUAGE],es". }
        }`;

        try {
            const data = await this.fetchData(sparqlQuery);

            // Si existen valores, los devolvemos como un arreglo
            if (data.results.bindings.length > 0) {
                return data.results.bindings.map(binding => this.convertirValorPorTipo(binding.propertyValueLabel.value, tipo));
            } else {
                //console.warn("⚠️ No se encontraron valores de la propiedad.");
                return [];
            }
        } catch (error) {
            console.error('Error al obtener valores de propiedad:', error);
            return [];
        }
    }
    async obtenerRespuestasIncorrectas(entityId, property, valoresDePropiedadCorrectos,tipo) {
        let respuestasIncorrectas = [];
        for (const otherEntity of this.entitiesArray) {
            if (otherEntity.id !== entityId) {
                const valoresDePropiedad = await this.obtenerValoresDePropiedad(otherEntity.id, property,tipo);
                for (const valor of valoresDePropiedad) {
                    if (!valoresDePropiedadCorrectos.includes(valor) && !respuestasIncorrectas.includes(valor)) {
                        respuestasIncorrectas.push(valor);
                    }
                    if (respuestasIncorrectas.length >= 3) break;
                }
                if (respuestasIncorrectas.length >= 3) break;
            }
        }
        return respuestasIncorrectas;
    }

    async obtenerEtiquetaDePropiedad(property) {
        const sparqlQuery = `
        SELECT ?propertyLabel WHERE {
            wd:${property} rdfs:label ?propertyLabel.
            FILTER(LANG(?propertyLabel) = "es")
        }`;

        try {
            const data = await this.fetchData(sparqlQuery);

            if (data.results.bindings.length > 0) {
                return data.results.bindings[0].propertyLabel.value;
            } else {
                return property;
            }
        } catch (error) {
            console.error('Error al obtener etiqueta de propiedad:', error);
            return property;
        }
    }
    validar(respuesta) {
        const regex = /^[Qq].*/i;
        return regex.test(respuesta);
    }



}

module.exports = WikidataQueryService;
