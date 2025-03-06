const QuestionGen = require('./questiongenerator/questionGen');
const WikiQuestionService = require('./wikiquestion-service');

async function ejecutarEjemploClases() {
    const queryProcessor = new WikiQuestionService();

    const preguntaBandera = await queryProcessor.generateCountryFlagQuizQuestion();

    if (preguntaBandera.error) {
        console.error("Error al generar pregunta:", preguntaBandera.error);
    } else if (preguntaBandera.pregunta) {
        console.log("Pregunta:", preguntaBandera.pregunta);
        console.log("URL de la Bandera:", preguntaBandera.banderaUrl);
        console.log("País Correcto:", preguntaBandera.paisCorrecto);
        console.log("Opciones Incorrectas:", preguntaBandera.opcionesIncorrectas);
        console.log("------------------------------------");
    } else {
        console.log("No se encontraron preguntas de banderas.");
    }
}

ejecutarEjemploClases();