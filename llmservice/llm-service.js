const axios = require('axios');
const express = require('express');

require("dotenv").config();

const app = express();
const port = 8003;

// --- State Variables ---
// Use objects to manage state, allowing easier reset for tests
const modelState = {
    current: 'empathy',
    backup: 'mistral'
};

// Function to reset state (useful for tests)
function resetModelState() {
    modelState.current = 'empathy';
    modelState.backup = 'mistral';
    console.log("Model state reset.");
}


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
            model: "qwen/Qwen2.5-Coder-7B-Instruct", // Specify model directly
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
            model: "mistralai/Mistral-7B-Instruct-v0.3", // Specify model directly
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

// Función simplificada para validar campos requeridos para /ask
function validateAskRequiredFields(req) {
    const requiredFields = ['userQuestion', 'question', 'idioma'];
    for (const field of requiredFields) {
        if (!(field in req.body)) {
            throw new Error(`Campo requerido faltante: ${field}`);
        }
    }
    const question = req.body.question;
    if (!question || typeof question !== 'object' || !question.respuestaCorrecta || !question.pregunta || !question.descripcion) {
        throw new Error("Estructura de question inválida o faltante");
    }
    if (!question.pregunta[req.body.idioma]) { // Check specific language existence
        throw new Error(`Falta la pregunta en el idioma especificado: ${req.body.idioma}`);
    }
}

// Generic function to send questions to LLM
async function sendQuestionToLLM(systemPrompt, userQuestion, apiKey, model = modelState.current) {
    let currentAttemptModel = model;
    try {
        console.log(`Sending request to ${currentAttemptModel} LLM...`);

        const config = llmConfigs[currentAttemptModel];
        if (!config) {
            throw new Error(`Modelo "${currentAttemptModel}" no soportado.`);
        }

        const url = config.url(apiKey);
        const requestData = config.transformRequest(systemPrompt, userQuestion);

        const headers = {
            'Content-Type': 'application/json',
            ...(config.headers ? config.headers(apiKey) : {})
        };

        const response = await axios.post(url, requestData, { headers });
        console.log(`Response status from ${currentAttemptModel}: ${response.status}`);

        const transformedResponse = config.transformResponse(response);

        // *** MODIFICACIÓN: Devolver null si la respuesta está vacía ***
        if (transformedResponse === null || transformedResponse === undefined || String(transformedResponse).trim() === '') {
            console.warn(`Respuesta vacía o nula recibida de ${currentAttemptModel}. Retornando null.`);
            return null; // Devolver null explícitamente
        }
        return transformedResponse;

    } catch (error) {
        console.error(`Error al enviar pregunta a ${currentAttemptModel}:`, error.message || error);
        if (error.response) {
            console.error(`LLM ${currentAttemptModel} respondió con estado ${error.response.status}:`, error.response.data);
            // Intentar reintento solo si es 5xx y el modelo actual NO es ya el de respaldo
            if (error.response.status >= 500 && currentAttemptModel !== modelState.backup) {
                console.log(`Error ${error.response.status} con el modelo ${currentAttemptModel}, intentando con el modelo de respaldo ${modelState.backup}...`);
                // Intentar directamente con el modelo de respaldo
                try {
                    // No modificar el estado global aquí, solo intentar con el de respaldo
                    return await sendQuestionToLLM(systemPrompt, userQuestion, apiKey, modelState.backup);
                } catch (backupError) {
                    console.error(`Fallo también con el modelo de respaldo ${modelState.backup}. Propagando error original.`);
                    // Si el respaldo también falla, propagar el error ORIGINAL del primer intento
                    throw error;
                }
            }
        }
        // Si no es 5xx, o si ya se intentó con el de respaldo, o si es otro tipo de error, propagar.
        console.error(`Fallo definitivo al contactar LLM ${currentAttemptModel}. Propagando error.`);
        throw error; // Propagate the original error
    }
}

// Template para solicitar pistas al LLM (sin cambios)
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

// Función para generar el prompt de pista (sin cambios)
function generateHintPrompt(question, idioma) {
    const dataText = question.descripcion
        .map(item => `${item.propiedad}: ${item.valor}`)
        .join('\n');
    return hintPromptTemplate
        .replace('{datos}', dataText)
        .replace('{idioma}', idioma);
}

// Endpoint para procesar solicitudes de pistas
app.post('/ask', async (req, res) => {
    try {
        console.log("Received /ask request");

        validateAskRequiredFields(req); // Use specific validation

        const { userQuestion, question, idioma, model = modelState.current } = req.body; // Usa el estado actual

        if (!process.env.LLM_API_KEY) {
            return res.status(500).json({ error: "Configuración del servidor incompleta: falta LLM_API_KEY" });
        }

        const systemPrompt = generateHintPrompt(question, idioma);
        let answer = await sendQuestionToLLM(systemPrompt, userQuestion, process.env.LLM_API_KEY, model);

        // *** MODIFICACIÓN: Manejar respuesta null de sendQuestionToLLM ***
        if (answer === null) {
            console.log("sendQuestionToLLM returned null for /ask, sending default empty response string.");
            answer = "No se recibió respuesta del LLM"; // Devolver string específico
        }

        console.log("LLM Hint Answer:", answer);
        res.json({ answer });

    } catch (error) {
        console.error('Error al procesar solicitud de pista:', error.message);
        if (error.message.includes("requerido faltante") || error.message.includes("inválida") || error.message.includes("Falta la pregunta")) {
            res.status(400).json({ error: error.message });
        } else if (error.message.includes("no soportado")) {
            res.status(400).json({ error: error.message });
        } else {
            // Errores internos o de LLM (incluyendo fallos post-reintento) -> 500
            res.status(500).json({ error: "Error interno al procesar la solicitud de pista.", details: error.message });
        }
    }
});

// Template para que el LLM responda preguntas del juego (sin cambios)
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

// Endpoint /ai-answer (sin cambios funcionales significativos, solo validación idioma)
app.post('/ai-answer', async (req, res) => {
    let isCorrectForMessage = false;
    const requestedIdioma = req.body.idioma;

    try {
        console.log("Received /ai-answer request");

        const { question, options, difficulty = "medium" } = req.body;

        if (!req.body.idioma) {
            throw new Error("Campo 'idioma' faltante.");
        }
        const idioma = requestedIdioma;

        if (!question || typeof question !== 'object' || !question.pregunta || !question.respuestaCorrecta || typeof question.pregunta !== 'object' || typeof question.respuestaCorrecta !== 'object') {
            throw new Error("Campo 'question' inválido o incompleto.");
        }
        if (!question.pregunta[idioma]) {
            throw new Error(`Falta la pregunta en el idioma especificado: ${idioma}`);
        }
        if (!question.respuestaCorrecta[idioma]) {
            throw new Error(`Falta la respuesta correcta en el idioma especificado: ${idioma}`);
        }
        if (!options || !Array.isArray(options) || options.length === 0) {
            throw new Error("Campo 'options' inválido o faltante.");
        }

        if (!process.env.LLM_API_KEY) {
            return res.status(500).json({ error: "Configuración del servidor incompleta: falta LLM_API_KEY" });
        }

        const questionText = question.pregunta[idioma];
        const correctAnswer = question.respuestaCorrecta[idioma];
        let selectedAnswer = "";
        const useSimulation = process.env.NODE_ENV === 'test' && Math.random() > 0.95;

        if (useSimulation) {
            console.log("Usando respuesta simulada para /ai-answer");
            let aiAccuracy;
            switch(difficulty) {
                case "easy": aiAccuracy = 0.5; break;
                case "hard": aiAccuracy = 0.9; break;
                default: aiAccuracy = 0.75;
            }
            isCorrectForMessage = Math.random() < aiAccuracy;
            selectedAnswer = isCorrectForMessage ? correctAnswer : options.find(opt => opt !== correctAnswer) || options[0];

            let message;
            try {
                message = await generateAIMessage(isCorrectForMessage, questionText, idioma);
                if (!message) { // Usar default si generateAIMessage devuelve vacío/null
                    console.warn("generateAIMessage (simulación) devolvió vacío/null, usando mensaje por defecto.");
                    message = getDefaultMessage(isCorrectForMessage, idioma);
                }
            } catch (msgError) {
                console.error("Error al generar mensaje (simulación), usando default:", msgError.message);
                message = getDefaultMessage(isCorrectForMessage, idioma);
            }

            return res.json({
                selectedAnswer,
                isCorrect: isCorrectForMessage,
                message
            });
        }

        // --- Flujo Normal (Llamada al LLM) ---
        const promptWithDifficulty = gameQuestionPromptTemplate
                .replace('{pregunta}', questionText)
                .replace('{opciones}', options.join('\n- '))
                .replace('{respuestaCorrecta}', correctAnswer)
                .replace('{idioma}', idioma)
            + `\n\nDIFICULTAD: ${difficulty}. Ten en cuenta que:
               - Si la dificultad es "easy", deberías fallar aproximadamente el 50% de las veces.
               - Si la dificultad es "medium", deberías fallar aproximadamente el 25% de las veces.
               - Si la dificultad es "hard", deberías fallar aproximadamente el 10% de las veces.`;

        const rawAnswer = await sendQuestionToLLM(promptWithDifficulty, "¿Cuál es tu respuesta?", process.env.LLM_API_KEY);
        console.log("LLM Raw Answer:", rawAnswer);

        // Si la respuesta es null (vacía), usar fallback de simulación
        if (rawAnswer === null) {
            console.warn("sendQuestionToLLM devolvió null, usando fallback de simulación.");
            // Reutilizar lógica de simulación
            let aiAccuracy;
            switch(difficulty) {
                case "easy": aiAccuracy = 0.5; break;
                case "hard": aiAccuracy = 0.9; break;
                default: aiAccuracy = 0.75;
            }
            isCorrectForMessage = Math.random() < aiAccuracy;
            selectedAnswer = isCorrectForMessage ? correctAnswer : options.find(opt => opt !== correctAnswer) || options[0];
            let message;
            try {
                message = await generateAIMessage(isCorrectForMessage, questionText, idioma);
                if (!message) {
                    console.warn("generateAIMessage (fallback por null) devolvió vacío/null, usando mensaje por defecto.");
                    message = getDefaultMessage(isCorrectForMessage, idioma);
                }
            } catch (msgError) {
                console.error("Error al generar mensaje (fallback por null), usando default:", msgError.message);
                message = getDefaultMessage(isCorrectForMessage, idioma);
            }
            return res.json({ selectedAnswer, isCorrect: isCorrectForMessage, message });
        }


        let parsedAnswer;
        try {
            const jsonMatch = rawAnswer.match(/\{[\s\S]*\}/);
            if (jsonMatch && jsonMatch[0]) {
                parsedAnswer = JSON.parse(jsonMatch[0]);
                if (!parsedAnswer || typeof parsedAnswer.selectedAnswer === 'undefined' || typeof parsedAnswer.isCorrect === 'undefined') {
                    throw new Error("JSON parseado no tiene la estructura esperada (selectedAnswer, isCorrect).");
                }
            } else {
                const directMatch = options.find(opt => rawAnswer.trim() === opt);
                if (directMatch) {
                    console.warn("LLM no devolvió JSON, pero la respuesta coincide con una opción.");
                    parsedAnswer = {
                        selectedAnswer: directMatch,
                        isCorrect: directMatch === correctAnswer
                    };
                } else {
                    throw new Error("No se encontró un JSON válido ni una respuesta directa coincidente en la respuesta del LLM.");
                }
            }
        } catch (parseError) {
            console.error("Error al parsear o validar la respuesta JSON del LLM:", parseError.message);
            console.log("Usando respuesta simulada como fallback debido a error de parseo/validación.");
            let aiAccuracy;
            switch(difficulty) {
                case "easy": aiAccuracy = 0.5; break;
                case "hard": aiAccuracy = 0.9; break;
                default: aiAccuracy = 0.75;
            }
            isCorrectForMessage = Math.random() < aiAccuracy;
            selectedAnswer = isCorrectForMessage ? correctAnswer : options.find(opt => opt !== correctAnswer) || options[0];

            let message;
            try {
                message = await generateAIMessage(isCorrectForMessage, questionText, idioma);
                if (!message) {
                    console.warn("generateAIMessage (fallback por parseo) devolvió vacío/null, usando mensaje por defecto.");
                    message = getDefaultMessage(isCorrectForMessage, idioma);
                }
            } catch (msgError) {
                console.error("Error al generar mensaje (fallback por parseo), usando default:", msgError.message);
                message = getDefaultMessage(isCorrectForMessage, idioma);
            }

            return res.json({
                selectedAnswer,
                isCorrect: isCorrectForMessage,
                message
            });
        }

        isCorrectForMessage = parsedAnswer.selectedAnswer === correctAnswer;

        let messageContent; // Usar un nombre de variable diferente
        try {
            // Intenta generar el mensaje llamando al LLM
            messageContent = await generateAIMessage(isCorrectForMessage, questionText, idioma);
            // Si generateAIMessage devuelve null o vacío (porque el LLM respondió vacío)
            if (!messageContent) {
                console.warn("generateAIMessage (normal) devolvió vacío/null, usando mensaje por defecto.");
                messageContent = getDefaultMessage(isCorrectForMessage, idioma);
            }
            console.log("Mensaje generado por LLM (o por defecto si vacío):", messageContent); // Log añadido

        } catch (msgError) {
            // Si generateAIMessage lanza un error (porque la llamada al LLM falló)
            console.error("Error al generar mensaje (normal), usando default:", msgError.message);
            // Asigna explícitamente el mensaje por defecto en caso de error
            messageContent = getDefaultMessage(isCorrectForMessage, idioma);
            console.log("Mensaje asignado por defecto en catch block:", messageContent); // Log añadido
        }

        console.log("Valor final de messageContent antes de res.json:", messageContent); // Log añadido

        // Construye y envía la respuesta final
        res.json({
            selectedAnswer: parsedAnswer.selectedAnswer,
            isCorrect: isCorrectForMessage,
            message: messageContent // Usa la variable actualizada
        });

    } catch (error) {
        console.error('Error al procesar respuesta de la IA:', error.message);
        const finalIdioma = requestedIdioma || 'es';
        if (error.message.includes("inválido") || error.message.includes("faltante") || error.message.includes("Falta la pregunta") || error.message.includes("Falta la respuesta correcta")) {
            res.status(400).json({
                error: error.message,
                message: getDefaultMessage(isCorrectForMessage, finalIdioma)
            });
        } else {
            res.status(500).json({
                error: "Error interno al procesar la respuesta de la IA.",
                details: error.message,
                message: getDefaultMessage(isCorrectForMessage, finalIdioma)
            });
        }
    }
});

// Función para generar mensajes personalizados (sin cambios)
async function generateAIMessage(isCorrect, question, idioma) {
    const result = isCorrect ? "correct" : "incorrect";
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

    if (!process.env.LLM_API_KEY) {
        throw new Error("generateAIMessage: LLM_API_KEY no encontrada.");
    }

    // Dejar que sendQuestionToLLM maneje errores y devuelva null si está vacío
    const response = await sendQuestionToLLM(messagePromptTemplate, "Genera una respuesta", process.env.LLM_API_KEY);

    // response será null si sendQuestionToLLM recibió vacío, o la respuesta limpia.
    // No necesitamos limpiar aquí porque sendQuestionToLLM ya devuelve null para vacíos.
    return response;
}

// Mensajes por defecto (sin cambios)
function getDefaultMessage(isCorrect, idioma) {
    const lang = idioma || 'es';
    if (lang.toLowerCase() === "es") {
        return isCorrect ? "¡Excelente! He acertado esta." : "¡Vaya! Me he equivocado.";
    } else if (lang.toLowerCase() === "en") {
        return isCorrect ? "Excellent! I got this one right." : "Oops! I got that wrong.";
    } else {
        return isCorrect ? "¡Correcto!" : "¡Incorrecto!";
    }
}

// Endpoint /ai-message (ajustado para usar default si generateAIMessage devuelve null)
app.post('/ai-message', async (req, res) => {
    let isCorrect = false;
    const requestedIdioma = req.body.idioma;

    try {
        console.log("Received /ai-message request");

        const { result, question } = req.body;

        if (!req.body.idioma) {
            throw new Error("Campo 'idioma' faltante.");
        }
        const idioma = requestedIdioma;

        if (result !== "correct" && result !== "incorrect") {
            throw new Error("Campo 'result' inválido. Debe ser 'correct' o 'incorrect'.");
        }
        if (!question || typeof question !== 'string' || question.trim() === '') {
            throw new Error("Campo 'question' inválido o faltante.");
        }

        isCorrect = result === "correct";
        let message = await generateAIMessage(isCorrect, question, idioma);

        // *** MODIFICACIÓN: Usar default si generateAIMessage devuelve null ***
        if (message === null) {
            console.warn("generateAIMessage devolvió null, usando mensaje por defecto.");
            message = getDefaultMessage(isCorrect, idioma);
        }

        res.json({ message });

    } catch (error) {
        console.error('Error al generar mensaje de la IA en /ai-message:', error.message);
        const finalIdioma = requestedIdioma || 'es';
        const defaultMessage = getDefaultMessage(isCorrect, finalIdioma);

        if (error.message.includes("inválido") || error.message.includes("faltante")) {
            res.status(400).json({
                error: error.message,
                message: defaultMessage
            });
        } else {
            res.status(500).json({
                error: "Error interno al generar el mensaje de la IA.",
                details: error.message,
                message: defaultMessage
            });
        }
    }
});

// Variable para almacenar la instancia del servidor
let server;

// Función para iniciar el servidor (sin cambios)
function startServer(testPort) {
    if (server && server.listening) {
        console.warn("Server already running.");
        return server;
    }
    const serverPort = testPort || port;
    try {
        server = app.listen(serverPort);
        server.on('listening', () => {
            console.log(`LLM Service listening at http://localhost:${serverPort}`);
        });
        server.on('error', (err) => {
            console.error(`Error starting server on port ${serverPort}:`, err);
            if (err.code === 'EADDRINUSE') {
                console.error(`Port ${serverPort} is already in use.`);
            }
            server = null;
        });
        return server;
    } catch (err) {
        console.error(`Failed to start server immediately on port ${serverPort}:`, err);
        server = null;
        throw err;
    }
}

// Función para cerrar el servidor (sin cambios)
function closeServer() {
    if (server && server.listening) {
        console.log("Closing server...");
        return new Promise((resolve, reject) => {
            server.close((err) => {
                if (err) {
                    console.error("Error closing server:", err);
                    reject(err);
                } else {
                    console.log("Server closed.");
                    server = null;
                    resolve();
                }
            });
        });
    }
    console.log("Server not running or already closed.");
    return Promise.resolve();
}

// Si este archivo se ejecuta directamente, inicia el servidor
if (require.main === module || process.env.NODE_ENV === 'test') {
    startServer();
}

module.exports = {
    app,
    startServer,
    closeServer,
    resetModelState // Exportar para tests si es necesario
};
