const axios = require('axios');
const express = require('express');

require("dotenv").config();

const app = express();
const port = 8003;

// --- State Variables ---
const modelState = {
    primary: 'empathy',
    backup: 'mistral',
    current: 'empathy'
};

// Function to reset state (useful for tests)
function resetModelState() {
    modelState.current = modelState.primary;
    console.log("Model state reset to primary:", modelState.primary);
}

// Middleware
app.use(express.json());
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
    next();
});

// Health check endpoint
app.get('/', (req, res) => {
    res.status(200).send({ status: 'OK', message: `LLM Service running. Current Model: ${modelState.current}` });
});

// LLM Configurations
const llmConfigs = {
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

// --- Helper Functions ---

/**
 * Validates required fields for the /ask endpoint.
 * @param {object} req - The Express request object.
 */
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
    if (!question.pregunta[req.body.idioma]) {
        throw new Error(`Falta la pregunta en el idioma especificado: ${req.body.idioma}`);
    }
}

/**
 * Validates required fields for the /ai-answer endpoint.
 * @param {object} req - The Express request object.
 */
function validateAiAnswerRequiredFields(req) {
    const { question, options, idioma } = req.body;
    if (!idioma) {
        throw new Error("Campo 'idioma' faltante.");
    }
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
}


/**
 * Sends a question to the configured LLM, handling fallback and state update.
 * @param {string} systemPrompt - The system prompt for the LLM.
 * @param {string} userQuestion - The user's question or input.
 * @param {string} apiKey - The API key for the LLM service.
 * @param {string} [requestedModel=modelState.current] - The model to attempt first. Defaults to the current global state.
 * @returns {Promise<string|null>} The LLM's response text, or null if the response was empty.
 * @throws {Error} If both primary and backup models fail, or if a non-fallback error occurs.
 */
async function sendQuestionToLLM(systemPrompt, userQuestion, apiKey, requestedModel = modelState.current) {
    let modelToTry = requestedModel;
    const isPrimaryAttempt = (modelToTry === modelState.primary);

    try {
        console.log(`Attempting request with ${modelToTry} LLM...`);
        const config = llmConfigs[modelToTry];
        if (!config) {
            throw new Error(`Modelo "${modelToTry}" no soportado.`);
        }

        const url = config.url(apiKey);
        const requestData = config.transformRequest(systemPrompt, userQuestion);
        const headers = {
            'Content-Type': 'application/json',
            ...(config.headers ? config.headers(apiKey) : {})
        };

        const response = await axios.post(url, requestData, { headers });
        console.log(`Response status from ${modelToTry}: ${response.status}`);

        const transformedResponse = config.transformResponse(response);

        if (transformedResponse === null || transformedResponse === undefined || String(transformedResponse).trim() === '') {
            console.warn(`Respuesta vacía o nula recibida de ${modelToTry}. Retornando null.`);
            return null;
        }
        return transformedResponse;

    } catch (error) {
        console.error(`Error sending request to ${modelToTry}:`, error.message || error);

        if (error.response && error.response.status >= 500 && isPrimaryAttempt && modelState.current === modelState.primary) {
            console.warn(`Error ${error.response.status} with primary model ${modelToTry}. Switching to backup model ${modelState.backup} permanently for this service instance.`);
            modelState.current = modelState.backup; // Persist state change
            let backupModel = modelState.backup;

            try {
                console.log(`Retrying request with backup model ${backupModel}...`);
                const backupConfig = llmConfigs[backupModel];
                if (!backupConfig) throw new Error(`Modelo de respaldo "${backupModel}" no soportado.`);

                const backupUrl = backupConfig.url(apiKey);
                const backupRequestData = backupConfig.transformRequest(systemPrompt, userQuestion);
                const backupHeaders = {
                    'Content-Type': 'application/json',
                    ...(backupConfig.headers ? backupConfig.headers(apiKey) : {})
                };

                const backupResponse = await axios.post(backupUrl, backupRequestData, { headers: backupHeaders });
                console.log(`Response status from backup ${backupModel}: ${backupResponse.status}`);
                const transformedBackupResponse = backupConfig.transformResponse(backupResponse);

                if (transformedBackupResponse === null || transformedBackupResponse === undefined || String(transformedBackupResponse).trim() === '') {
                    console.warn(`Respuesta vacía o nula recibida del modelo de respaldo ${backupModel}. Retornando null.`);
                    return null;
                }
                return transformedBackupResponse; // Backup success

            } catch (backupError) {
                console.error(`Backup model ${backupModel} also failed:`, backupError.message || backupError);
                console.error("Both primary and backup models failed.");
                throw error; // Throw original error if backup fails
            }
        } else {
            // No fallback triggered or already using backup
            console.error(`No fallback triggered for ${modelToTry} or already using backup. Rethrowing error.`);
            throw error;
        }
    }
}

/**
 * Generates a default message based on correctness and language.
 * @param {boolean} isCorrect - Whether the answer was correct.
 * @param {string} idioma - The desired language ('es', 'en', etc.).
 * @returns {string} The default message.
 */
function getDefaultMessage(isCorrect, idioma) {
    const lang = idioma || 'es';
    if (lang.toLowerCase() === "es") {
        return isCorrect ? "¡Excelente! He acertado esta." : "¡Vaya! Me he equivocado.";
    } else if (lang.toLowerCase() === "en") {
        return isCorrect ? "Excellent! I got this one right." : "Oops! I got that wrong.";
    } else {
        return isCorrect ? "¡Correcto!" : "¡Incorrecto!"; // Generic fallback
    }
}

/**
 * Generates a personalized message from the AI based on correctness.
 * Uses the current model state by default.
 * @param {boolean} isCorrect - Whether the AI's answer was correct.
 * @param {string} question - The text of the question asked.
 * @param {string} idioma - The language for the message.
 * @param {string} [model=modelState.current] - The specific model to use. Defaults to the current global state.
 * @returns {Promise<string|null>} The generated message or null if the LLM response was empty or failed.
 */
async function generateAIMessage(isCorrect, question, idioma, model = modelState.current) {
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
        console.error("generateAIMessage: LLM_API_KEY no encontrada.");
        return null; // Return null if API key is missing
    }

    try {
        // Call sendQuestionToLLM, which handles fallback internally
        const response = await sendQuestionToLLM(messagePromptTemplate, "Genera una respuesta", process.env.LLM_API_KEY, model);
        return response; // Will be null if LLM response was empty or both models failed
    } catch (error) {
        console.error("Error dentro de generateAIMessage al llamar a sendQuestionToLLM:", error.message);
        return null; // Return null if sendQuestionToLLM throws an error (e.g., both models failed)
    }
}


/**
 * Handles fallback simulation when LLM fails or response is invalid.
 * @param {string} difficulty - The game difficulty ('easy', 'medium', 'hard').
 * @param {string} correctAnswer - The correct answer text.
 * @param {string[]} options - The list of possible answer options.
 * @param {string} questionText - The text of the question.
 * @param {string} idioma - The language code.
 * @param {string} reason - Short description of why fallback is triggered.
 * @returns {Promise<object>} A promise resolving to { selectedAnswer, isCorrect, message }.
 */
async function handleSimulationFallback(difficulty, correctAnswer, options, questionText, idioma, reason) {
    console.warn(`Fallback triggered (${reason}). Using simulation.`);
    let aiAccuracy;
    switch (difficulty.toLowerCase()) {
        case "easy": aiAccuracy = 0.3; break; // Lowered accuracy for easy
        case "hard": aiAccuracy = 0.9; break;
        case "medium":
        default: aiAccuracy = 0.75;
    }
    const isCorrectSimulated = Math.random() < aiAccuracy;
    const selectedAnswerSimulated = isCorrectSimulated
        ? correctAnswer
        : options.find(opt => opt !== correctAnswer) || options[0]; // Find a wrong answer or default

    let message;
    try {
        // Attempt to generate message even in fallback, using current model state
        message = await generateAIMessage(isCorrectSimulated, questionText, idioma);
        if (!message) { // If LLM message generation fails or is empty
            console.warn(`generateAIMessage (fallback: ${reason}) devolvió vacío/null, usando mensaje por defecto.`);
            message = getDefaultMessage(isCorrectSimulated, idioma);
        }
    } catch (msgError) {
        // Catch errors during message generation in fallback
        console.error(`Error al generar mensaje (fallback: ${reason}), usando default:`, msgError.message);
        message = getDefaultMessage(isCorrectSimulated, idioma);
    }

    return {
        selectedAnswer: selectedAnswerSimulated,
        isCorrect: isCorrectSimulated,
        message: message
    };
}


// --- Hint Generation ---

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

### IDIOMA DE RESPUESTA:
Responde en: {idioma}

TU ÉXITO SE MIDE POR TU CAPACIDAD DE DAR UNA PISTA SUTIL QUE NO REVELE LA RESPUESTA NI NIEGUE DIRECTAMENTE LAS SUPOSICIONES DEL USUARIO.`;

function generateHintPrompt(question, idioma) {
    const dataText = question.descripcion
        .map(item => `${item.propiedad}: ${item.valor}`)
        .join('\n');
    return hintPromptTemplate
        .replace('{datos}', dataText)
        .replace('{idioma}', idioma);
}

// --- AI Answer Generation ---

const gameQuestionPromptTemplate = `Eres un asistente inteligente que participa en un juego de trivia. Tu personalidad varía según la dificultad.

PERSONALIDAD (según dificultad):
{personality_instruction}

PREGUNTA ACTUAL:
{pregunta}

OPCIONES DISPONIBLES:
{opciones}

RESPUESTA CORRECTA (Contexto interno, NO REVELAR):
{respuestaCorrecta}

TU TAREA:
1. Adopta la personalidad indicada por la dificultad. **¡ES MUY IMPORTANTE QUE SIGAS ESTA PERSONALIDAD!**
2. Elige UNA de las opciones disponibles como tu respuesta.
3. Basa tu elección en la pregunta, las opciones y tu personalidad asignada.
4. Determina si tu elección coincide con la RESPUESTA CORRECTA proporcionada.

FORMATO DE RESPUESTA OBLIGATORIO (JSON):
Responde ÚNICAMENTE con un JSON válido siguiendo esta estructura exacta:
{
  "selectedAnswer": "la opción que elegiste",
  "isCorrect": true/false (true si tu selectedAnswer == RESPUESTA CORRECTA, false si no)
}

REGLAS ADICIONALES:
- NO incluyas ningún texto fuera del JSON.
- NO expliques tu razonamiento.
- NO repitas la pregunta ni las opciones.
- Responde en el idioma: {idioma}`;

function generateAiAnswerPrompt(questionText, options, correctAnswer, difficulty, idioma) {
    let personalityInstruction = "";
    switch (difficulty.toLowerCase()) {
        case "easy":
            // ** More direct instruction for easy difficulty **
            personalityInstruction = "Actúa como un participante de trivia bastante distraído y olvidadizo. A menudo te equivocas o eliges una opción incorrecta porque no prestas mucha atención. Sin embargo, de vez en cuando, aciertas por casualidad o porque la pregunta es muy obvia. ¡Falla a propósito en la mayoría de las preguntas!";
            break;
        case "hard":
            personalityInstruction = "Actúa como un experto en trivia. Analiza cuidadosamente y casi siempre eliges la respuesta correcta. Rara vez fallas.";
            break;
        case "medium":
        default:
            personalityInstruction = "Actúa como un participante de trivia con conocimientos generales. Intentas acertar, pero tu memoria a veces te falla o te confundes si las opciones son parecidas. Cometes errores de vez en cuando, pero no constantemente.";
            break;
    }

    return gameQuestionPromptTemplate
        .replace('{personality_instruction}', personalityInstruction)
        .replace('{pregunta}', questionText)
        .replace('{opciones}', options.join('\n '))
        .replace('{respuestaCorrecta}', correctAnswer)
        .replace('{idioma}', idioma);
}

// --- Endpoints ---

// Endpoint /ask (Hint generation)
app.post('/ask', async (req, res) => {
    try {
        console.log("Received /ask request");
        validateAskRequiredFields(req);
        const { userQuestion, question, idioma } = req.body;

        if (!process.env.LLM_API_KEY) {
            return res.status(500).json({ error: "Configuración del servidor incompleta: falta LLM_API_KEY" });
        }

        const systemPrompt = generateHintPrompt(question, idioma);
        // sendQuestionToLLM handles model selection and fallback
        let answer = await sendQuestionToLLM(systemPrompt, userQuestion, process.env.LLM_API_KEY);

        if (answer === null) {
            console.log("sendQuestionToLLM returned null for /ask, sending default error message.");
            // Provide a more informative error message for hints
            answer = (idioma === 'es') ? "Lo siento, no puedo dar una pista en este momento." : "Sorry, I cannot provide a hint right now.";
        }

        console.log("LLM Hint Answer:", answer);
        res.json({ answer });

    } catch (error) {
        console.error('Error al procesar solicitud de pista:', error.message);
        const errorStatus = (error.message.includes("requerido") || error.message.includes("inválida")) ? 400 : 500;
        const errorMessage = (idioma === 'es') ? "Error al generar la pista." : "Error generating hint.";
        res.status(errorStatus).json({ error: errorMessage, details: error.message });
    }
});

// Endpoint /ai-answer (AI opponent's answer)
app.post('/ai-answer', async (req, res) => {
    let responsePayload; // To store the final payload

    try {
        console.log("Received /ai-answer request");

        // --- Input Validation ---
        validateAiAnswerRequiredFields(req); // Use dedicated validation function
        const { question, options, difficulty = "medium", idioma } = req.body;
        const questionText = question.pregunta[idioma];
        const correctAnswer = question.respuestaCorrecta[idioma];

        if (!process.env.LLM_API_KEY) {
            throw new Error("Configuración del servidor incompleta: falta LLM_API_KEY");
        }

        // --- Simulation Check (for testing) ---
        const useSimulation = process.env.NODE_ENV === 'test' && Math.random() > 0.95;
        if (useSimulation) {
            console.log("Usando respuesta simulada para /ai-answer (TEST)");
            responsePayload = await handleSimulationFallback(difficulty, correctAnswer, options, questionText, idioma, "Test Simulation");
            return res.json(responsePayload);
        }

        // --- Normal Flow: Get AI Answer ---
        const systemPrompt = generateAiAnswerPrompt(questionText, options, correctAnswer, difficulty, idioma);
        let rawAnswer;

        try {
            // Call LLM for the answer. sendQuestionToLLM handles fallback & state update.
            rawAnswer = await sendQuestionToLLM(systemPrompt, "¿Cuál es tu respuesta JSON?", process.env.LLM_API_KEY);

        } catch (llmError) {
            // This catch block is reached ONLY if BOTH primary and backup models failed.
            console.error("Both primary and backup models failed to get answer.");
            responsePayload = await handleSimulationFallback(difficulty, correctAnswer, options, questionText, idioma, "LLM Double Failure");
            return res.json(responsePayload);
        }

        // Handle case where LLM (potentially the backup) returned an empty response
        if (rawAnswer === null) {
            console.warn("sendQuestionToLLM devolvió null (respuesta vacía).");
            responsePayload = await handleSimulationFallback(difficulty, correctAnswer, options, questionText, idioma, "LLM Empty Response");
            return res.json(responsePayload);
        }

        // --- Parse and Validate LLM Answer ---
        console.log("LLM Raw Answer:", rawAnswer);
        let parsedAnswer;
        try {
            const jsonMatch = rawAnswer.match(/\{[\s\S]*?\}/); // Non-greedy JSON match
            if (jsonMatch && jsonMatch[0]) {
                parsedAnswer = JSON.parse(jsonMatch[0]);
                if (!parsedAnswer || typeof parsedAnswer.selectedAnswer === 'undefined' || typeof parsedAnswer.isCorrect === 'undefined') {
                    throw new Error("JSON parseado no tiene la estructura esperada (selectedAnswer, isCorrect).");
                }
                if (!options.includes(parsedAnswer.selectedAnswer)) {
                    throw new Error(`La selectedAnswer ("${parsedAnswer.selectedAnswer}") del LLM no es una opción válida.`);
                }

                // Use the response directly from the LLM as it was instructed based on persona
                const selectedAnswer = parsedAnswer.selectedAnswer;
                const isCorrectFromLLM = parsedAnswer.isCorrect;

                // Optional Sanity Check (Log difference but use LLM's value)
                const actualCorrectness = (selectedAnswer === correctAnswer);
                if (isCorrectFromLLM !== actualCorrectness) {
                    console.warn(`Advertencia: El campo 'isCorrect' (${isCorrectFromLLM}) del LLM no coincide con la corrección real (${actualCorrectness}) para la respuesta seleccionada "${selectedAnswer}". Se usará el valor del LLM.`);
                }

                // --- Generate AI Message ---
                let messageContent = await generateAIMessage(isCorrectFromLLM, questionText, idioma);
                if (!messageContent) {
                    console.warn("generateAIMessage (normal) devolvió vacío/null, usando mensaje por defecto.");
                    messageContent = getDefaultMessage(isCorrectFromLLM, idioma);
                }

                // --- Prepare Final Successful Response ---
                responsePayload = {
                    selectedAnswer: selectedAnswer,
                    isCorrect: isCorrectFromLLM, // Use correctness determined by LLM's persona
                    message: messageContent
                };
                return res.json(responsePayload);

            } else {
                // Try direct match if no JSON found (less likely)
                const directMatch = options.find(opt => rawAnswer.trim().toLowerCase() === opt.toLowerCase());
                if (directMatch) {
                    console.warn("LLM no devolvió JSON, pero la respuesta coincide directamente con una opción.");
                    const selectedAnswer = directMatch;
                    const isCorrectDirect = selectedAnswer === correctAnswer;
                    let messageContent = await generateAIMessage(isCorrectDirect, questionText, idioma);
                    if (!messageContent) messageContent = getDefaultMessage(isCorrectDirect, idioma);

                    responsePayload = { selectedAnswer, isCorrect: isCorrectDirect, message: messageContent };
                    return res.json(responsePayload);
                } else {
                    // No JSON and no direct match
                    throw new Error("No se encontró un JSON válido ni una respuesta directa coincidente en la respuesta del LLM.");
                }
            }
        } catch (parseError) {
            // Handle JSON parsing errors or validation errors (e.g., selectedAnswer not in options)
            console.error("Error al parsear o validar la respuesta JSON del LLM:", parseError.message);
            responsePayload = await handleSimulationFallback(difficulty, correctAnswer, options, questionText, idioma, "Parsing/Validation Error");
            return res.json(responsePayload);
        }

    } catch (error) {
        // Catch unexpected errors or validation errors from the top level
        console.error('Error general en /ai-answer:', error.message);
        const finalIdioma = req.body.idioma || 'es'; // Get idioma if possible
        const errorStatus = (error.message.includes("inválido") || error.message.includes("faltante")) ? 400 : 500;
        // Send a generic error response, potentially using default message logic if needed
        res.status(errorStatus).json({
            error: "Error al procesar la respuesta de la IA.",
            details: error.message,
            // Provide a minimal fallback structure if possible
            selectedAnswer: "Error",
            isCorrect: false,
            message: getDefaultMessage(false, finalIdioma)
        });
    }
});


// Endpoint /ai-message (Potentially deprecated by /ai-answer including message)
app.post('/ai-message', async (req, res) => {
    let isCorrect = false; // Default value
    const requestedIdioma = req.body.idioma;

    try {
        console.log("Received /ai-message request");
        const { result, question } = req.body;

        // Validation
        if (!requestedIdioma) { throw new Error("Campo 'idioma' faltante."); }
        if (result !== "correct" && result !== "incorrect") { throw new Error("Campo 'result' inválido. Debe ser 'correct' o 'incorrect'."); }
        if (!question || typeof question !== 'string' || question.trim() === '') { throw new Error("Campo 'question' inválido o faltante."); }
        if (!process.env.LLM_API_KEY) { throw new Error("Configuración del servidor incompleta: falta LLM_API_KEY"); }


        isCorrect = result === "correct";
        // generateAIMessage uses modelState.current and handles fallback
        let message = await generateAIMessage(isCorrect, question, requestedIdioma);

        if (message === null) { // Handle empty response or LLM failure
            console.warn("generateAIMessage (for /ai-message) devolvió null, usando mensaje por defecto.");
            message = getDefaultMessage(isCorrect, requestedIdioma);
        }
        res.json({ message });

    } catch (error) {
        console.error('Error en /ai-message:', error.message);
        const finalIdioma = requestedIdioma || 'es';
        const defaultMessage = getDefaultMessage(isCorrect, finalIdioma); // Use potentially updated isCorrect
        const statusCode = error.message.includes("LLM_API_KEY") ? 500 : (error.message.includes("inválido") || error.message.includes("faltante") ? 400 : 500);
        res.status(statusCode).json({
            error: error.message.includes("LLM_API_KEY") ? "Error interno del servidor." : error.message,
            details: error.message,
            message: defaultMessage // Provide default message on error
        });
    }
});


// --- Server Start/Stop ---
let server;

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
            console.log(`Initial model state: ${modelState.current}`);
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

function closeServer() {
    return new Promise((resolve, reject) => {
        if (server && server.listening) {
            console.log("Closing server...");
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
        } else {
            console.log("Server not running or already closed.");
            resolve();
        }
    });
}

// Start server if run directly
if (require.main === module) {
    startServer();
    // Graceful shutdown handling
    process.on('SIGINT', async () => {
        console.log('SIGINT signal received: closing HTTP server');
        await closeServer();
        process.exit(0);
    });
    process.on('SIGTERM', async () => {
        console.log('SIGTERM signal received: closing HTTP server');
        await closeServer();
        process.exit(0);
    });
}

module.exports = {
    app,
    startServer,
    closeServer,
    resetModelState
};
