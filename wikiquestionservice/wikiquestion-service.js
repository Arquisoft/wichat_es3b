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
        //const banderaUrl = resultado.flagImage.value;
        const banderaUrl = null;
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
        try {
            const rawQuestionData = await queryService.fetchCountryFlagQuestionData();
            const questionData = this.processCountryFlagQuestion(rawQuestionData);

            if (!questionData.pregunta) {
                return { pregunta: null, banderaUrl: null, paisCorrecto: null, opcionesIncorrectas: [], error: "No se pudo obtener la pregunta de bandera." };
            }

            const rawIncorrectOptionsData = await queryService.fetchIncorrectCountryOptions(questionData.countryEntityId);
            const opcionesIncorrectas = this.processIncorrectCountryOptions(rawIncorrectOptionsData);


            return {
                pregunta: questionData.pregunta,
                banderaUrl: questionData.banderaUrl,
                paisCorrecto: questionData.paisCorrecto,
                opcionesIncorrectas: opcionesIncorrectas,
            };

        } catch (error) {
            console.error("Error al generar pregunta de bandera en QuizQuestionProcessor:", error);
            return { pregunta: null, banderaUrl: null, paisCorrecto: null, opcionesIncorrectas: [], error: error.message };
        }
    }
}

module.exports = WikiquestionService;