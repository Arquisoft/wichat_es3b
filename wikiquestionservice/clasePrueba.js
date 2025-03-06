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

    const preguntaPlaneta = await queryProcessor.generatePlanetQuizQuestion();

    if (preguntaPlaneta.error) {
        console.error("Error al generar pregunta:", preguntaPlaneta.error);
    } else if (preguntaPlaneta.pregunta) {
        console.log("Pregunta:", preguntaPlaneta.pregunta);
        console.log("URL de la imagen:", preguntaPlaneta.planetaImagen);
        console.log("Planeta Correcto:", preguntaPlaneta.planetaCorrecto);
        console.log("Opciones Incorrectas:", preguntaPlaneta.opcionesIncorrectas);
        console.log("------------------------------------");
    } else {
        console.log("No se encontraron preguntas de planetas.");
    }
}

ejecutarEjemploClases();