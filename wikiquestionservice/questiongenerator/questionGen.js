const axios = require('axios');
const Question = require('./question');
class WikidataQueryService {
    constructor(categoryName, entity, properties, questions, types, img, questionsPerCategory) {
        this.wikidataEndpoint = "https://query.wikidata.org/sparql";
        this.categoryName = categoryName;
        this.entity = entity;
        this.properties = properties;
        this.questions = questions;
        this.entitiesArray = [];
        this.types = types;
        this.questionsArray = [];
        this.img = img;
        this.questionsPerCategory = questionsPerCategory;
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

    async obtenerIdsDeWikidata(cantidad = 50) {
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

        let entidadesProcesadas = 0;

        while (this.questionsArray.length < this.questionsPerCategory) {
            if (entidadesProcesadas >= this.entitiesArray.length) {
                console.log("No se alcanzaron suficientes entidades, buscando más...");
                await this.obtenerIdsDeWikidata(50);
            }

            for (const entity of this.entitiesArray) {
                if (this.questionsArray.length >= this.questionsPerCategory) {
                    break;
                }

                const entityName = entity.label;
                const indiceAleatorio = Math.floor(Math.random() * this.questions.length);
                const descripcion = await this.generarDescripcion(entity.id, indiceAleatorio);
                if (descripcion.length === 0) {
                    continue;
                }

                let entidadInvalida = false;
                const preguntaAleatoria = this.questions[indiceAleatorio];
                const preguntasModificadas = {};
                const respuestaCorrecta = {};
                const respuestasIncorrectas = {};

                for (const idioma in preguntaAleatoria) {
                    if (preguntaAleatoria.hasOwnProperty(idioma)) {
                        let preguntaEnIdioma = preguntaAleatoria[idioma];
                        preguntaEnIdioma = preguntaEnIdioma.replace("%", entityName);
                        preguntasModificadas[idioma] = preguntaEnIdioma;
                    }

                    const valoresDePropiedad = await this.obtenerValoresDePropiedad(entity.id, this.properties[indiceAleatorio], this.types[indiceAleatorio], idioma);
                    if (valoresDePropiedad.length === 0) {
                        entidadInvalida = true;
                        break;
                    }

                    respuestaCorrecta[idioma] = valoresDePropiedad[0];
                    if (this.validar(respuestaCorrecta)) {
                        entidadInvalida = true;
                        break;
                    }

                    respuestasIncorrectas[idioma] = await this.obtenerRespuestasIncorrectas(entity.id, this.properties[indiceAleatorio], valoresDePropiedad, this.types[indiceAleatorio], idioma);
                    if (respuestasIncorrectas[idioma].some(respuesta => this.validar(respuesta))) {
                        entidadInvalida = true;
                        break;
                    }

                    if (respuestasIncorrectas[idioma].length !== 3) {
                        entidadInvalida = true;
                        break;
                    }
                }

                if (entidadInvalida) {
                    continue;
                }

                const imgprueba = await this.obtenerValoresDePropiedad(entity.id, this.img[0]);
                if (!imgprueba || imgprueba.length === 0) continue;

                const nuevaPregunta = new Question(respuestaCorrecta, preguntasModificadas, respuestasIncorrectas, descripcion, imgprueba,this.categoryName);
                this.questionsArray.push(nuevaPregunta);
                entidadesProcesadas++;

                if (this.questionsArray.length >= this.questionsPerCategory) {
                    break;
                }
            }
        }
    }

    async obtenerValoresDePropiedad(id, property, tipo, idioma) {
        const sparqlQuery = `
        SELECT ?propertyValueLabel WHERE {
            wd:${id} wdt:${property} ?propertyValue.
            SERVICE wikibase:label { bd:serviceParam wikibase:language "${idioma}". }
        }`;

        try {
            const data = await this.fetchData(sparqlQuery);
            if (data.results.bindings.length > 0) {
                return data.results.bindings.map(binding => this.convertirValorPorTipo(binding.propertyValueLabel.value, tipo));
            } else {
                return [];
            }
        } catch (error) {
            console.error('Error al obtener valores de propiedad:', error);
            return [];
        }
    }

    async obtenerRespuestasIncorrectas(entityId, property, valoresDePropiedadCorrectos, tipo, idioma) {
        let respuestasIncorrectas = [];
        for (const otherEntity of this.entitiesArray) {
            if (otherEntity.id !== entityId) {
                const valoresDePropiedad = await this.obtenerValoresDePropiedad(otherEntity.id, property, tipo, idioma);
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

    async generarDescripcion(entityId, indiceAleatorio) {
        const descripcion = [];
        for (let i = 0; i < this.properties.length; i++) {
            if (i === indiceAleatorio) {
                continue;
            }
            const property = this.properties[i];
            const tipo = this.types[i];
            const valoresDePropiedad = await this.obtenerValoresDePropiedad(entityId, property, tipo, "es");
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
        return descripcion;
    }
}

module.exports = WikidataQueryService;