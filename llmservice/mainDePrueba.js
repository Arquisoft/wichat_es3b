const { getHint } = require('./LLMFacade');
const Question = require("../wikiquestionservice/questiongenerator/Question");

async function main() {
    const questionEs = '¿Cuál es este monumento?';
    const questionEn = '¿Cuál es este monumento?';
    const questions = {es:questionEs, en:questionEn};
    const userQuestion = "¿Es la torre eiffel?";
    const correctAnswer = "El Big Ben";
    const wrongAnswers = ["La torre Eiffel", "La torre inclinada de pizza", "El arco del triunfo"];
    const description = {propiedad:"nombre", valor:"valor"};
    const img = "img";

    const qObject = new Question(correctAnswer, questions, wrongAnswers, description, img);

    try {

        const answer = await getHint(userQuestion, qObject, "es");

        console.log(`Question: ${questionEs}`);
        console.log(`User Question: ${userQuestion}`);
        console.log("Correct Answer: " + correctAnswer);
        console.log(`LLM Answer: ${answer}`);
    } catch (error) {
        console.error('Error:', error.message);
    }
}

main();