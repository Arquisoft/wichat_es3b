const { sendQuestionToLLM } = require('./llm-service');

class LLMFacade {
    constructor() {
        this.apiKey = 'sk-83q34o9wd1IB04bGhx0ZdQ';
        this.model = 'empathy';
        this.prompt = `Eres un asistente virtual que debe ayudar al usuario a responder correctamente una serie de preguntas.
            Tu rol es el de un orientador que, dada la pregunta del usuario, le guía hacia la respuesta correcta.
            Bajo ningún concepto debes hablar sobre el tema mencionado por el usuario, no cambies de tema, centrate en la respuesta correcta y trata de que el usuario llegue hasta ella.
            Dada la entrada del usuario, debes guiarlo hacia las respuesta correcta, sin revelar la misma, valiéndote de la que es la respuesta correcta.
            En ningún momento respondas directamente a la pregunta del usuario, solo dale pistas para que descubra la respuesta correcta.
            
            ### Datos proporcionados:
            - **Pregunta:** {question} #Al usuario se le muestra una imagen
            - **Respuesta correcta:** {correctAnswer}
            
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
    }

    async getHint(userQuestion, question, correctAnswer) {
        try {
            const formattedPrompt = this.prompt.replace('{question}', question).replace('{correctAnswer}', correctAnswer);
            return await sendQuestionToLLM(formattedPrompt, userQuestion, this.apiKey, this.model);
        } catch (error) {
            console.error('Error al obtener pista:', error.message);
            return null;
        }
    }
}

module.exports = LLMFacade;