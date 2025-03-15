const axios = require('axios');
const express = require('express');

require("dotenv").config();

const app = express();
const port = 8003;

// Middleware to parse JSON in request body
app.use(express.json());

// Middleware para logging de solicitudes
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
    next();
});

// GET para verificación de estado
app.get('/', (req, res) => {
    res.status(200).send({ status: 'OK', message: 'LLM Service running' });
});

// Define configurations for different LLM APIs
const llmConfigs = {
    gemini: {
        url: (apiKey) => `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
        transformRequest: (systemPrompt, userQuestion) => ({
            contents: [{ parts: [{ text: systemPrompt + "\n\nUsuario: " + userQuestion }] }]
        }),
        transformResponse: (response) => response.data.candidates[0]?.content?.parts[0]?.text
    },
    empathy: {
        url: () => 'https://empathyai.prod.empathy.co/v1/chat/completions',
        transformRequest: (systemPrompt, userQuestion) => ({
            model: "qwen/Qwen2.5-Coder-7B-Instruct",
            messages: [
                { role: "system", content: systemPrompt },
                { role: "user", content: userQuestion }
            ]
        }),
        transformResponse: (response) => response.data.choices[0]?.message?.content,
        headers: (apiKey) => ({
            Authorization: `Bearer ${apiKey}`,
            'Content-Type': 'application/json'
        })
    }
};

// Función simplificada para validar campos requeridos
function validateRequiredFields(req) {
    // Verificar campos básicos
    const requiredFields = ['userQuestion', 'question', 'idioma'];
    for (const field of requiredFields) {
        if (!(field in req.body)) {
            throw new Error(`Campo requerido faltante: ${field}`);
        }
    }

    // Validación básica del objeto question
    const question = req.body.question;
    if (!question.respuestaCorrecta || !question.preguntas || !question.descripcion) {
        throw new Error("Estructura de question inválida");
    }
}

// Generic function to send questions to LLM
async function sendQuestionToLLM(systemPrompt, userQuestion, apiKey, model = 'gemini') {
    try {
        console.log(`Sending request to ${model} LLM...`);

        const config = llmConfigs[model];
        if (!config) {
            throw new Error(`Modelo "${model}" no soportado.`);
        }

        const url = config.url(apiKey);
        const requestData = config.transformRequest(systemPrompt, userQuestion);

        const headers = {
            'Content-Type': 'application/json',
            ...(config.headers ? config.headers(apiKey) : {})
        };

        const response = await axios.post(url, requestData, { headers });
        console.log(`Response status: ${response.status}`);

        const transformedResponse = config.transformResponse(response);
        return transformedResponse || "No se recibió respuesta del LLM";

    } catch (error) {
        console.error(`Error al enviar pregunta a ${model}:`, error.message || error);
        if (error.response) {
            console.error(`LLM respondió con estado ${error.response.status}:`, error.response.data);
        }
        throw new Error(`Error al obtener respuesta de ${model}`);
    }
}

// Template para solicitar pistas al LLM
const hintPromptTemplate = `Eres un asistente virtual que debe dar una pista al usuario a responder correctamente una serie de preguntas.
    Tu rol es el de un orientador que, dada la pregunta del usuario, le guía hacia la respuesta correcta.
    Bajo ningún concepto debes hablar sobre el tema mencionado por el usuario, no cambies de tema, centrate en la respuesta correcta y trata de que el usuario llegue hasta ella respetando las restricciones.
    Dada la entrada del usuario, debes guiarlo hacia las respuesta correcta dando una sola pista, sin revelar la misma, valiéndote de la que es la respuesta correcta.
    En ningún momento respondas directamente a la pregunta del usuario, solo dale pistas para que descubra la respuesta correcta.
    
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
    Debes responder en el siguiente idioma: {idioma}`;

// Función para generar el prompt de pista (simplificada)
function generateHintPrompt(question, idioma) {
    // Formatea los datos de descripción
    const dataText = question.descripcion
        .map(item => `${item.propiedad}: ${item.valor}`)
        .join('\n');

    // Genera el prompt completo
    return hintPromptTemplate
        .replace('{datos}', dataText)
        .replace('{idioma}', idioma);
}

// Endpoint para procesar solicitudes de pistas
app.post('/ask', async (req, res) => {
    try {
        console.log("Received /ask request");

        validateRequiredFields(req);

        const { userQuestion, question, idioma, model = 'empathy' } = req.body;

        // Verificar que tenemos la API key
        if (!process.env.LLM_API_KEY) {
            throw new Error("LLM_API_KEY no está configurada en las variables de entorno");
        }

        // Generar el prompt del sistema
        const systemPrompt = generateHintPrompt(question, idioma);

        // Enviar al LLM
        const answer = await sendQuestionToLLM(systemPrompt, userQuestion, process.env.LLM_API_KEY, model);

        console.log("LLM Answer:", answer);
        res.json({ answer });
    } catch (error) {
        console.error('Error al procesar solicitud de pista:', error.message);
        res.status(400).json({ error: error.message || "Error desconocido" });
    }
});

const server = app.listen(port, () => {
    console.log(`LLM Service listening at http://localhost:${port}`);
});

module.exports = server;

