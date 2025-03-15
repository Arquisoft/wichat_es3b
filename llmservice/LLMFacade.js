//const { sendQuestionToLLM } = require('./llm-service');
const  server = require('./llm-service');
const axios = require('axios');

const model = 'empathy';
const prompt = `Eres un asistente virtual que debe dar una pista al usuario a responder correctamente una serie de preguntas.
    Tu rol es el de un orientador que, dada la pregunta del usuario, le guía hacia la respuesta correcta.
    Bajo ningún concepto debes hablar sobre el tema mencionado por el usuario, no cambies de tema, centrate en la respuesta correcta y trata de que el usuario llegue hasta ella respetando las restricciones.
    Dada la entrada del usuario, debes guiarlo hacia las respuesta correcta dando una sola pista, sin revelar la misma, valiéndote de la que es la respuesta correcta.
    En ningún momento respondas directamente a la pregunta del usuario, solo dale pistas para que descubra la respuesta correcta.
    
    ### Datos proporcionados:
    - **Pregunta:** {question} #Al usuario se le muestra una imagen
    - **Respuesta correcta:** {correctAnswer}
    
    ### Datos para pistas:
    Debes utilizar SOLO los siguientes datos y no utilizar más de 2 en la misma respuesta:
    {datos}
    
    ### Reglas clave:
    - **Tu pista debe basarse solo en la respuesta correcta.**  
    - **No confirmes ni niegues suposiciones.**  
    - **No des información innecesaria o inventada.**  
    - **No menciones la respuesta correcta ni la hagas evidente.**  
    
    ### Ejemplo de pista correcta:
    **Pregunta:** - Tu respuesta: "¿Cuál de estos animales es un marsupial?"  
    **Respuesta:** - Tu respuesta: "El canguro."
    **Pista válida:** - Tu respuesta: "Lleva a sus crías en un sitio especial."
    
    ### Ejemplos de pistas incorrectas (NO HACER):
    - "El canguro es un marsupial." (Revela la respuesta)  
    - "No elijas ni el perro ni el gato." (Descarta opciones)
    
    ### Idioma de la respuesta
    Debes responder en el siguiente idioma: {idioma}
`;

async function getHint(userQuestion, question, idioma, apiKey) {
    try {
        console.log("Comienza la fachada")
        const dataText = question.descripcion
            .map(item => `${item.propiedad}: ${item.valor}`)
            .join('\n');
        const formattedPrompt = prompt
            .replace('{question}', question.preguntas.idioma)
            .replace('{correctAnswer}', question.respuestaCorrecta)
            .replace('{datos}', dataText)
            .replace('{idioma}', idioma);

        let body = {question: userQuestion, model: model};
        try {
            // Forward the add user request to the user service
            const llmResponse = await axios.post((process.env.LLM_SERVICE_URL || 'http://localhost:8003') + '/ask', body);

            console.log('llmResponse:', llmResponse.data);

            return llmResponse.data;

        } catch (error) {
            console.error('Error al obtener pista:', error.message);
            return null;
        }

        //server.post('/ask', { prompt: formattedPrompt, question: userQuestion, model, apiKey });
        //return await sendQuestionToLLM(formattedPrompt, userQuestion, apiKey, model);

    } catch (error) {
        console.error('Error al obtener pista:', error.message);
        return null;
    }
}


module.exports = { getHint };