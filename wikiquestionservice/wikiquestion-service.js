const WikidataQueryService = require('./questiongenerator/questionGen');
class WikiquestionService {
    constructor() {
    }

    processCountryFlagQuestion(jsonData) {
        if (!jsonData || !jsonData.results || !jsonData.results.bindings || jsonData.results.bindings.length === 0) {
            return { pregunta: null, banderaUrl: null, paisCorrecto: null, opcionesIncorrectas: [] };
        }

        const resultado = jsonData.results.bindings[0];
        const paisCorrecto = resultado.countryLabel.value;
        const banderaUrl = resultado.flag.value;
        const pregunta = `¿A qué país pertenece esta bandera?`;

        return { pregunta, banderaUrl, paisCorrecto };
    }

    processIncorrectCountryOptions(rawData) {
        if (!rawData || !rawData.results || !rawData.results.bindings) {
            return [];
        }

        return rawData.results.bindings.map(item => item.countryLabel.value);
    }

    async generateCountryFlagQuizQuestion() {
        const queryService = new WikidataQueryService();
        const rawQuestionData = await queryService.obtenerIdsDeWikidata("wd:Q6256");
        // const queryService = new WikidataQueryService();
        // try {
        //     const rawQuestionData = await queryService.fetchCountryFlagQuestionData();
        //     const pruebo= await  queryService.obtenerIdsDeWikidata("wd:Q4989906", 10);
        //
        //     const questionData = this.processCountryFlagQuestion(rawQuestionData);
        //
        //     if (!questionData.pregunta) {
        //         return { pregunta: null, banderaUrl: null, paisCorrecto: null, opcionesIncorrectas: [], error: "No se pudo obtener la pregunta de bandera." };
        //     }
        //
        //     const rawIncorrectOptionsData = await queryService.fetchIncorrectCountryOptions(questionData.countryEntityId);
        //     const opcionesIncorrectas = this.processIncorrectCountryOptions(rawIncorrectOptionsData);
        //
        //
        //     return {
        //         pregunta: questionData.pregunta,
        //         banderaUrl: questionData.banderaUrl,
        //         paisCorrecto: questionData.paisCorrecto,
        //         opcionesIncorrectas: opcionesIncorrectas,
        //     };
        //
        // } catch (error) {
        //     console.error("Error al generar pregunta de bandera en QuizQuestionProcessor:", error);
        //     return { pregunta: null, banderaUrl: null, paisCorrecto: null, opcionesIncorrectas: [], error: error.message };
        // }
    }

    processPlanetQuestion(jsonData) {
        if (!jsonData || !jsonData.results || !jsonData.results.bindings || jsonData.results.bindings.length === 0) {
            return { pregunta: null, planetaImagen: null, planetaCorrecto: null, planetItemId: null };
        }

        const resultado = jsonData.results.bindings[0];
        const planetaCorrecto = resultado.planetLabel.value;
        const planetaImagen = resultado.image ? resultado.image.value : null;
        const pregunta = `¿Qué planeta es el de esta imagen?`;

        return { pregunta, planetaImagen, planetaCorrecto };
    }

    processIncorrectPlanetOptions(rawData) {
        if (!rawData || !rawData.results || !rawData.results.bindings) {
            return [];
        }

        return rawData.results.bindings.map(item => item.planetLabel.value);
    }

    async generatePlanetQuizQuestion() {
        const queryService = new WikidataQueryService();
        try {
            const rawQuestionData = await queryService.fetchPlanetQuestionData();
            const questionData = this.processPlanetQuestion(rawQuestionData);

            if (!questionData.pregunta) {
                return { pregunta: null, planetaImagen: null, planetaCorrecto: null, opcionesIncorrectas: [], error: "No se pudo obtener la pregunta del planeta." };
            }

            const rawIncorrectOptionsData = await queryService.fetchIncorrectPlanetOptions(questionData.planetItemId);
            const opcionesIncorrectas = this.processIncorrectPlanetOptions(rawIncorrectOptionsData);

            return {
                pregunta: questionData.pregunta,
                planetaImagen: questionData.planetaImagen,
                planetaCorrecto: questionData.planetaCorrecto,
                opcionesIncorrectas: opcionesIncorrectas,
            };

        } catch (error) {
            console.error("Error al generar pregunta de planeta:", error);
            return { pregunta: null, planetaImagen: null, planetaCorrecto: null, opcionesIncorrectas: [], error: error.message };
        }
    }
}

module.exports = WikiquestionService;