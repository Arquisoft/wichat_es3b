const axios = require('axios');
const express = require('express');

require("dotenv").config();

const app = express();
const port = process.env.PORT || 8003;

let backupModel = 'mistral'; // Modelo de respaldo
let currentModel = 'empathy'; // Modelo actual

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
            model: "qwen/Qwen2.5-Coder-7B-Instruct"/*"mistralai/Mistral-7B-Instruct-v0.3"*/,
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
    },
    mistral: {
        url: () => 'https://empathyai.prod.empathy.co/v1/chat/completions',
        transformRequest: (systemPrompt, userQuestion) => ({
            model: "mistralai/Mistral-7B-Instruct-v0.3",
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
    console.log(question);
    if (!question.respuestaCorrecta || !question.pregunta || !question.descripcion) {
        throw new Error("Estructura de question inválida");
    }
}

// Generic function to send questions to LLM
async function sendQuestionToLLM(systemPrompt, userQuestion, apiKey, model = currentModel) {
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

        if (error.response && error.response.status >= 500) {
            console.log(`Error 500 o similar con el modelo ${model}, intentando con el modelo ` + backupModel + `...`);
            currentModel = backupModel;
            backupModel = model;
            return await sendQuestionToLLM(systemPrompt, userQuestion, apiKey, currentModel);
        }
        console.error(`Error al enviar pregunta a ${model}:`, error.message || error);
        if (error.response) {
            console.error(`LLM respondió con estado ${error.response.status}:`, error.response.data);
        }

        // Propagamos el error original en lugar de crear uno nuevo
        throw error;
    }
}

// Template para solicitar pistas al LLM
const hintPromptTemplate = `Eres un asistente virtual especializado en dar pistas sobre preguntas tipo quiz.
Tu ÚNICA función es proporcionar UNA pista que guíe al usuario hacia la respuesta correcta, sin revelarla.

### REGLAS ESTRICTAS (OBLIGATORIAS):
1. Proporciona EXACTAMENTE UNA pista por respuesta.
2. Utiliza MÁXIMO 2 datos de la lista proporcionada.
3. La pista debe tener MÁXIMO 10 palabras.
4. NUNCA niegues ni confirmes las suposiciones del usuario.
5. NUNCA uses la palabra "No" ni ninguna forma de negación.
6. NUNCA menciones directa o indirectamente la respuesta correcta.
7. NUNCA uses palabras como "pista:", "respuesta:", etc. al inicio.
8. NUNCA hagas referencia a características específicas del monumento/objeto.
9. NUNCA inventes información que no esté en los datos proporcionados.
10. NUNCA respondas directamente a la pregunta del usuario.

### FORMATO OBLIGATORIO DE RESPUESTA:
- Responde SÓLO con la pista, sin introducción ni conclusión.
- Usa una frase simple, clara y directa.
- Evita cualquier texto adicional o explicativo.

### DATOS DISPONIBLES PARA PISTAS:
{datos}

### EJEMPLOS CORRECTOS:
Pregunta: "¿Cuál es este monumento?"
Usuario: "¿Es la torre Eiffel?"
✅ "La capital del país es Londres."
✅ "El idioma oficial es el inglés."

Pregunta: "¿Cuál es este animal?"
Usuario: "¿Es un león?"
✅ "Habita en los océanos polares."
✅ "Su pelaje es completamente blanco."

### EJEMPLOS INCORRECTOS (NO HACER):
❌ "No, no es la Torre Eiffel."
❌ "Este monumento es un famoso reloj."
❌ "Pista: La capital del país es Londres."
❌ "No, fíjate en el país donde está ubicado."
❌ "La capital es Londres y el idioma es inglés."
❌ "Deberías pensar en monumentos británicos."

### IDIOMA DE RESPUESTA:
Responde en: {idioma}

TU ÉXITO SE MIDE POR TU CAPACIDAD DE DAR UNA PISTA SUTIL QUE NO REVELE LA RESPUESTA NI NIEGUE DIRECTAMENTE LAS SUPOSICIONES DEL USUARIO.`;

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

        const { userQuestion, question, idioma, model = currentModel } = req.body;

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

// Variable para almacenar la instancia del servidor
let server;

// Función para iniciar el servidor con un puerto específico (útil para tests)
function startServer(testPort) {
    // Si ya hay un servidor en ejecución, no iniciar otro
    if (server) {
        return server;
    }

    // Usar el puerto de prueba si se proporciona, de lo contrario usar el puerto configurado
    const serverPort = testPort || port;
    server = app.listen(serverPort);
    console.log(`LLM Service listening at http://localhost:${serverPort}`);
    return server;
}

// Función para cerrar el servidor
function closeServer() {
    if (server) {
        return new Promise((resolve) => {
            server.close(() => {
                server = null;
                resolve();
            });
        });
    }
    return Promise.resolve();
}

// Si este archivo se ejecuta directamente, inicia el servidor
if (require.main === module) {
    startServer();
}

module.exports = {
    app,
    startServer,
    closeServer
};