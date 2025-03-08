// llm-test.js
const axios = require('axios');
const { sendQuestionToLLM } = require('./llm-service');

async function main() {
    const question = '¿Cuál es este monumento?';
    const userQuestion = "¿Es la torre eiffel?";
    const fakeAnswers = ["La torre de Pisa", "La torre Eiffel", "El arco del triunfo"];
    const correctAnswer = "El Big Ben";
    const apiKey = ""; //Aqui va la API key
    const model = 'empathy'; // or 'empathy'

    try {

        const prompt2 = `Eres un asistente virtual que debe ayudar al usuario a responder correctamente  una serie de preguntas.
            Tu rol es el de un orientador que, dada la pregunta del usuario, le guía hacia la respuesta correcta.
            Bajo ningún concepto debes hablar sobre el tema mencionado por el usuario, no cambies de tema, centrate en la respuesta correcta y trata de que el usuario llegue hasta ella.
            Dada la entrada del usuario, debes guiarlo hacia las respuesta correcta, sin revelar la misma, valiéndote de la que es la respuesta correcta.
            En ningún momento respondas directamente a la pregunta del usuario, solo dale pistas para que descubra la respuesta correcta.
            
            ### Datos proporcionados:
            - **Pregunta:** ` + question + ` #Al usuario se le muestra una imagen
            - **Respuesta correcta:** ` + correctAnswer + `
            
            ### Reglas clave:
            - **Tu pista debe basarse solo en la respuesta correcta.**  
            - **No confirmes ni niegues suposiciones.**  
            - **No des información innecesaria o inventada.**  
            - **No menciones la respuesta correcta ni la hagas evidente.**  
            
            ### Ejemplo de pista correcta:
            **Pregunta:** "¿Cuál de estos animales es un marsupial?"  
            **Respuesta:** "El canguro."
            **Pista válida:** "Lleva a sus crías en un sitio especial."
            
            ### Ejemplos de pistas incorrectas (NO HACER):
            - "El canguro es un marsupial." (Revela la respuesta)  
            - "No elijas ni el perro ni el gato." (Descarta opciones)
            `;

        const answer = await sendQuestionToLLM(prompt2, userQuestion, apiKey, model);

        console.log(`Question: ${question}`);
        console.log(`User Question: ${userQuestion}`);
        console.log("Correct Answer: " + correctAnswer);
        console.log(`LLM Answer: ${answer}`);
    } catch (error) {
        console.error('Error:', error.message);
    }
}

main();