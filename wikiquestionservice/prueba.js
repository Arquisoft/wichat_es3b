const QuestionManager = require('./questiongenerator/questionManager');
async function test() {
    const manager = new QuestionManager();

    console.log("🔄 Cargando preguntas...");
    await manager.loadAllQuestions();

    console.log("✅ Preguntas generadas:");

    if (manager.questions.length > 0) {
        manager.questions.forEach((question, index) => {
            console.log(`🔹 Pregunta ${index + 1}:`);
            console.log(question.toString()); // Llamamos al método toString()
            console.log('--------------------------------------');
        });

        console.log("🎯 Pregunta aleatoria:");
        console.log(manager.getRandomQuestion().toString());
    } else {
        console.log("⚠️ No se generaron preguntas.");
    }
}

test();