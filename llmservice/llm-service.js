const axios = require('axios');
const express = require('express');

require("dotenv").config();

const app = express();
const port = 8003;

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

// Template para que el LLM responda preguntas del juego
const gameQuestionPromptTemplate = `Eres un asistente inteligente que ayuda a responder preguntas de trivia.

PREGUNTA ACTUAL:
{pregunta}

OPCIONES DISPONIBLES:
{opciones}

RESPUESTA CORRECTA (NO LA MUESTRES EN TU RESPUESTA):
{respuestaCorrecta}

Tu tarea es analizar la pregunta y las opciones, y elegir la que consideres correcta basándote en tu conocimiento. 
NO REPITAS la pregunta ni las opciones en tu respuesta. NO EXPLIQUES tu razonamiento.

Responde ÚNICAMENTE con un JSON en este formato exacto:
{
  "selectedAnswer": "la opción que eliges",
  "isCorrect": true/false (si tu respuesta coincide con la respuesta correcta)
}

Responde en: {idioma}`;

// Modificación del endpoint ai-answer para manejar la dificultad
app.post('/ai-answer', async (req, res) => {
    try {
        console.log("Received /ai-answer request");

        // Validar campos requeridos
        const { question, options, idioma, difficulty = "medium" } = req.body;

        if (!question || !question.pregunta || !question.respuestaCorrecta || !options || !idioma) {
            throw new Error("Faltan campos requeridos para la consulta");
        }

        // Verificar que tenemos la API key
        if (!process.env.LLM_API_KEY) {
            throw new Error("LLM_API_KEY no está configurada en las variables de entorno");
        }

        // Obtener la pregunta en el idioma correcto
        const questionText = question.pregunta[idioma];
        const correctAnswer = question.respuestaCorrecta[idioma];

        // Si estamos en modo simulado (para pruebas o si el LLM falla)
        // la dificultad afecta a la probabilidad de acierto
        let isCorrect = false;
        let selectedAnswer = "";
        let useSimulation = Math.random() > 0.95; // 5% de probabilidad de usar simulación para pruebas

        // Aplicar dificultad en modo simulado
        if (useSimulation) {
            let aiAccuracy;
            switch(difficulty) {
                case "easy":
                    aiAccuracy = 0.5; // 50% de probabilidad en fácil
                    break;
                case "hard":
                    aiAccuracy = 0.9; // 90% de probabilidad en difícil
                    break;
                case "medium":
                default:
                    aiAccuracy = 0.75; // 75% de probabilidad en medio (predeterminado)
            }

            isCorrect = Math.random() < aiAccuracy;
            selectedAnswer = isCorrect ? correctAnswer : options.find(opt => opt !== correctAnswer);

            // Generar mensaje personalizado
            const message = await generateAIMessage(isCorrect, questionText, idioma);

            return res.json({
                selectedAnswer,
                isCorrect,
                message
            });
        }

        // Ajustar el prompt para incluir la dificultad
        const promptWithDifficulty = gameQuestionPromptTemplate
                .replace('{pregunta}', questionText)
                .replace('{opciones}', options.join('\n- '))
                .replace('{respuestaCorrecta}', correctAnswer)
                .replace('{idioma}', idioma)
            + `\n\nDIFICULTAD: ${difficulty}. Ten en cuenta que:
               - Si la dificultad es "easy", deberías fallar aproximadamente el 50% de las veces.
               - Si la dificultad es "medium", deberías fallar aproximadamente el 25% de las veces.
               - Si la dificultad es "hard", deberías fallar aproximadamente el 10% de las veces.`;

        // Enviar al LLM
        const rawAnswer = await sendQuestionToLLM(promptWithDifficulty, "¿Cuál es tu respuesta?", process.env.LLM_API_KEY);

        console.log("LLM Raw Answer:", rawAnswer);

        // Intentar parsear la respuesta como JSON
        let parsedAnswer;
        try {
            // Buscar y extraer el JSON de la respuesta
            const jsonMatch = rawAnswer.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                parsedAnswer = JSON.parse(jsonMatch[0]);
            } else {
                throw new Error("No se encontró un JSON en la respuesta");
            }
        } catch (parseError) {
            console.error("Error al parsear la respuesta del LLM:", parseError);
            // Si falla el parseo, crear una respuesta simulada con la dificultad
            let aiAccuracy;
            switch(difficulty) {
                case "easy": aiAccuracy = 0.5; break;
                case "hard": aiAccuracy = 0.9; break;
                default: aiAccuracy = 0.75;
            }
            isCorrect = Math.random() < aiAccuracy;
            parsedAnswer = {
                selectedAnswer: isCorrect ? correctAnswer : options.find(opt => opt !== correctAnswer),
                isCorrect: isCorrect
            };
        }

        // Validar la respuesta
        if (!parsedAnswer.selectedAnswer) {
            throw new Error("Respuesta del LLM inválida, falta selectedAnswer");
        }

        // Generar un mensaje personalizado basado en la respuesta
        const message = await generateAIMessage(parsedAnswer.isCorrect, questionText, idioma);

        res.json({
            selectedAnswer: parsedAnswer.selectedAnswer,
            isCorrect: parsedAnswer.selectedAnswer === correctAnswer,
            message
        });
    } catch (error) {
        console.error('Error al procesar respuesta de la IA:', error.message);
        res.status(400).json({ error: error.message || "Error desconocido" });
    }
});

// Nueva función para generar mensajes personalizados para el robot
async function generateAIMessage(isCorrect, question, idioma) {
    try {
        const result = isCorrect ? "correct" : "incorrect";

        // Template para el prompt de mensajes
        const messagePromptTemplate = `Eres un asistente de IA en un juego de trivia que acaba de responder una pregunta.

RESULTADO: Has respondido ${result === "correct" ? "CORRECTAMENTE" : "INCORRECTAMENTE"} a la pregunta.
PREGUNTA: ${question}
IDIOMA: ${idioma}

Genera una frase corta y natural (máximo 10 palabras) que expreses como te sientes sobre tu resultado.
Si acertaste, puedes mostrar satisfacción, alegría o confianza.
Si fallaste, puedes mostrar decepción, sorpresa o determinación para mejorar.

El tono debe ser amigable, conversacional y adecuado para todos los públicos.
NO empieces con "Yo" o "He" - habla en primera persona directamente.

EJEMPLOS SI ACERTASTE:
✓ "¡Excelente! Sabía esta respuesta."
✓ "¡Bingo! Estaba seguro de esta."
✓ "¡Perfecto! Mi memoria no falla."

EJEMPLOS SI FALLASTE:
✓ "¡Vaya! Esta era complicada."
✓ "¡Ups! Me equivoqué totalmente."
✓ "La próxima lo haré mejor."

RESPONDE ÚNICAMENTE CON LA FRASE, sin ningún texto adicional.`;

        // Enviar al LLM
        const response = await sendQuestionToLLM(messagePromptTemplate, "Genera una respuesta", process.env.LLM_API_KEY);

        // Limpiar la respuesta (eliminar comillas, espacios extras, etc.)
        const cleanedResponse = response.replace(/^["'\s]+|["'\s]+$/g, '');

        return cleanedResponse || getDefaultMessage(isCorrect, idioma);
    } catch (error) {
        console.error("Error al generar mensaje de IA:", error);
        return getDefaultMessage(isCorrect, idioma);
    }
}

// Mensajes por defecto en caso de error
function getDefaultMessage(isCorrect, idioma) {
    if (idioma === "es") {
        return isCorrect ? "¡Excelente! He acertado esta." : "¡Vaya! Me he equivocado.";
    } else if (idioma === "en") {
        return isCorrect ? "Excellent! I got this one right." : "Oops! I got that wrong.";
    } else {
        return isCorrect ? "✓" : "✗";
    }
}

// Añadir endpoint para generar mensajes de la IA
app.post('/ai-message', async (req, res) => {
    try {
        console.log("Received /ai-message request");

        const { result, question, idioma } = req.body;

        if (!result || !question || !idioma) {
            throw new Error("Faltan campos requeridos para generar el mensaje");
        }

        const isCorrect = result === "correct";
        const message = await generateAIMessage(isCorrect, question, idioma);

        res.json({ message });
    } catch (error) {
        console.error('Error al generar mensaje de la IA:', error.message);
        res.status(400).json({
            error: error.message || "Error desconocido",
            message: error.result === "correct" ? "¡Lo logré!" : "¡Vaya! Me equivoqué."
        });
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