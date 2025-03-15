const QuestionManager = require('./questiongenerator/questionManager');

(async () => {
    const questionManager = new QuestionManager();

    await questionManager.loadAllQuestions();

    console.log("📌 Todas las preguntas han sido generadas. Mostrando preguntas:\n");

    let index = 1;
    while (true) {
        try {
            const pregunta = questionManager.getRandomQuestion();
            console.log(`Pregunta ${index}:`);
            console.log(pregunta.toString() + '\n');
            index++;
        } catch (error) {
            console.log("✅ No hay más preguntas disponibles.");
            break;
        }
    }
})();
