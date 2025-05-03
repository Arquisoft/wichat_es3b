const axios = require('axios');
const express = require('express');

require("dotenv").config();

const app = express();
const port = 8003;

// --- State Variables ---
const modelState = {
    primary: 'empathy', // Modelo principal
    backup: 'mistral',  // Modelo de respaldo
    current: 'mistral'  // Modelo actualmente en uso
};

// Function to reset state (useful for tests)
// Función para reiniciar el estado (útil para tests)
function resetModelState() {
    modelState.current = modelState.primary;
    console.log("Model state reset to primary:", modelState.primary);
}

// Middleware
app.use(express.json()); // Para parsear JSON bodies
app.use((req, res, next) => {
    // Log básico de cada petición
    console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
    next();
});

// Health check endpoint
// Endpoint de verificación de estado
app.get('/', (req, res) => {
    res.status(200).send({ status: 'OK', message: `LLM Service running. Current Model: ${modelState.current}` });
});

// LLM Configurations
// Configuraciones de los LLMs
const llmConfigs = {
    empathy: {
        url: () => 'https://empathyai.prod.empathy.co/v1/chat/completions',
        // Transforma la petición para el modelo Empathy (Qwen)
        transformRequest: (systemPrompt, userQuestion) => ({
            model: "qwen/Qwen2.5-Coder-7B-Instruct", // Modelo específico Qwen
            messages: [
                { role: "system", content: systemPrompt },
                { role: "user", content: userQuestion }
            ]
        }),
        // Extrae la respuesta del modelo Empathy
        transformResponse: (response) => response.data.choices[0]?.message?.content,
        // Define las cabeceras necesarias para Empathy
        headers: (apiKey) => ({
            Authorization: `Bearer ${apiKey}`,
            'Content-Type': 'application/json'
        })
    },
    mistral: {
        url: () => 'https://empathyai.prod.empathy.co/v1/chat/completions',
        // Transforma la petición para el modelo Mistral
        transformRequest: (systemPrompt, userQuestion) => ({
            model: "mistralai/Mistral-7B-Instruct-v0.3", // Modelo específico Mistral
            messages: [
                { role: "system", content: systemPrompt },
                { role: "user", content: userQuestion }
            ]
        }),
        // Extrae la respuesta del modelo Mistral
        transformResponse: (response) => response.data.choices[0]?.message?.content,
        // Define las cabeceras necesarias para Mistral (igual que Empathy en este caso)
        headers: (apiKey) => ({
            Authorization: `Bearer ${apiKey}`,
            'Content-Type': 'application/json'
        })
    }
};

// --- Helper Functions ---

/**
 * Validates required fields for the /ask endpoint.
 * Valida los campos requeridos para el endpoint /ask.
 * @param {object} req - The Express request object. El objeto de petición de Express.
 */
function validateAskRequiredFields(req) {
    const requiredFields = ['userQuestion', 'question', 'idioma'];
    for (const field of requiredFields) {
        if (!(field in req.body)) {
            // Lanza error específico de validación
            throw new Error(`Campo requerido faltante: ${field}`);
        }
    }
    const question = req.body.question;
    // Valida la estructura del objeto 'question'
    if (!question || typeof question !== 'object' || !question.respuestaCorrecta || !question.pregunta || !question.descripcion) {
        // Lanza error específico de validación
        throw new Error("Estructura de question inválida o faltante");
    }
    // Valida que el texto de la pregunta exista para el idioma dado
    if (!question.pregunta[req.body.idioma]) {
        // Lanza error específico de validación
        throw new Error(`Falta la pregunta en el idioma especificado: ${req.body.idioma}`);
    }
}

/**
 * Validates required fields for the /ai-answer endpoint.
 * Valida los campos requeridos para el endpoint /ai-answer.
 * @param {object} req - The Express request object. El objeto de petición de Express.
 */
function validateAiAnswerRequiredFields(req) {
    const { question, options, idioma } = req.body;
    if (!idioma) {
        throw new Error("Campo 'idioma' faltante.");
    }
    // Valida la estructura del objeto 'question' y sus sub-propiedades de idioma
    if (!question || typeof question !== 'object' || !question.pregunta || !question.respuestaCorrecta || typeof question.pregunta !== 'object' || typeof question.respuestaCorrecta !== 'object') {
        throw new Error("Campo 'question' inválido o incompleto.");
    }
    if (!question.pregunta[idioma]) {
        throw new Error(`Falta la pregunta en el idioma especificado: ${idioma}`);
    }
    if (!question.respuestaCorrecta[idioma]) {
        throw new Error(`Falta la respuesta correcta en el idioma especificado: ${idioma}`);
    }
    // Valida que las opciones sean un array no vacío
    if (!options || !Array.isArray(options) || options.length === 0) {
        throw new Error("Campo 'options' inválido o faltante.");
    }
}


/**
 * Sends a question to the configured LLM, handling fallback and state update.
 * Envía una pregunta al LLM configurado, manejando el fallback y la actualización de estado.
 * @param {string} systemPrompt - The system prompt for the LLM. El prompt de sistema para el LLM.
 * @param {string} userQuestion - The user's question or input. La pregunta o entrada del usuario.
 * @param {string} apiKey - The API key for the LLM service. La clave API para el servicio LLM.
 * @param {string} [requestedModel=modelState.current] - The model to attempt first. Defaults to the current global state. El modelo a intentar primero. Por defecto, el estado global actual.
 * @returns {Promise<string|null>} The LLM's response text, or null if the response was empty. El texto de respuesta del LLM, o null si la respuesta estaba vacía.
 * @throws {Error} If both primary and backup models fail, or if a non-fallback error occurs. Si fallan tanto el modelo primario como el de respaldo, o si ocurre un error sin fallback.
 */
async function sendQuestionToLLM(systemPrompt, userQuestion, apiKey, requestedModel = modelState.current) {
    let modelToTry = requestedModel; // Modelo a usar en este intento
    const isPrimaryAttempt = (modelToTry === modelState.primary); // ¿Es el intento con el modelo primario?

    try {
        console.log(`Attempting request with ${modelToTry} LLM...`);
        const config = llmConfigs[modelToTry]; // Obtener configuración del modelo
        if (!config) {
            // Si el modelo no está configurado, lanzar error
            throw new Error(`Modelo "${modelToTry}" no soportado.`);
        }

        // Preparar y enviar la petición al LLM
        const url = config.url(apiKey);
        const requestData = config.transformRequest(systemPrompt, userQuestion);
        const headers = {
            'Content-Type': 'application/json',
            ...(config.headers ? config.headers(apiKey) : {}) // Añadir cabeceras específicas si existen
        };

        const response = await axios.post(url, requestData, { headers });
        console.log(`Response status from ${modelToTry}: ${response.status}`);

        // Procesar la respuesta
        const transformedResponse = config.transformResponse(response);

        // Manejar respuestas vacías o nulas
        if (transformedResponse === null || transformedResponse === undefined || String(transformedResponse).trim() === '') {
            console.warn(`Respuesta vacía o nula recibida de ${modelToTry}. Retornando null.`);
            return null;
        }
        // Devolver la respuesta procesada
        return transformedResponse;

    } catch (error) {
        // Manejo de errores en la llamada al LLM
        console.error(`Error sending request to ${modelToTry}:`, error.message || error);

        // Lógica de Fallback: Solo si es un error 5xx, es el intento primario y el estado actual es primario
        if (error.response && error.response.status >= 500 && isPrimaryAttempt && modelState.current === modelState.primary) {
            console.warn(`Error ${error.response.status} with primary model ${modelToTry}. Switching to backup model ${modelState.backup} permanently for this service instance.`);
            modelState.current = modelState.backup; // Cambiar estado permanentemente al modelo de respaldo
            let backupModel = modelState.backup;

            try {
                // Intentar con el modelo de respaldo
                console.log(`Retrying request with backup model ${backupModel}...`);
                const backupConfig = llmConfigs[backupModel];
                if (!backupConfig) throw new Error(`Modelo de respaldo "${backupModel}" no soportado.`);

                // Preparar y enviar petición al modelo de respaldo
                const backupUrl = backupConfig.url(apiKey);
                const backupRequestData = backupConfig.transformRequest(systemPrompt, userQuestion);
                const backupHeaders = {
                    'Content-Type': 'application/json',
                    ...(backupConfig.headers ? backupConfig.headers(apiKey) : {})
                };

                const backupResponse = await axios.post(backupUrl, backupRequestData, { headers: backupHeaders });
                console.log(`Response status from backup ${backupModel}: ${backupResponse.status}`);
                const transformedBackupResponse = backupConfig.transformResponse(backupResponse);

                // Manejar respuesta vacía del modelo de respaldo
                if (transformedBackupResponse === null || transformedBackupResponse === undefined || String(transformedBackupResponse).trim() === '') {
                    console.warn(`Respuesta vacía o nula recibida del modelo de respaldo ${backupModel}. Retornando null.`);
                    return null;
                }
                // Devolver respuesta del modelo de respaldo si tiene éxito
                return transformedBackupResponse;

            } catch (backupError) {
                // Si el modelo de respaldo también falla
                console.error(`Backup model ${backupModel} also failed:`, backupError.message || backupError);
                console.error("Both primary and backup models failed.");
                // Lanzar el error *original* (del modelo primario) para mantener la causa raíz
                throw error;
            }
        } else {
            // Si no se activa el fallback (error no 5xx, o ya se está usando el backup)
            console.error(`No fallback triggered for ${modelToTry} or already using backup. Rethrowing error.`);
            // Lanzar el error actual
            throw error;
        }
    }
}

/**
 * Generates a default message based on correctness and language.
 * Genera un mensaje por defecto basado en la corrección y el idioma.
 * @param {boolean} isCorrect - Whether the answer was correct. Si la respuesta fue correcta.
 * @param {string} idioma - The desired language ('es', 'en', etc.). El idioma deseado.
 * @returns {string} The default message. El mensaje por defecto.
 */
function getDefaultMessage(isCorrect, idioma) {
    const lang = idioma || 'es'; // Idioma por defecto 'es'
    if (lang.toLowerCase() === "es") {
        return isCorrect ? "¡Excelente! He acertado esta." : "¡Vaya! Me he equivocado.";
    } else if (lang.toLowerCase() === "en") {
        return isCorrect ? "Excellent! I got this one right." : "Oops! I got that wrong.";
    } else {
        // Fallback genérico para otros idiomas no definidos explícitamente
        return isCorrect ? "¡Correcto!" : "¡Incorrecto!";
    }
}

/**
 * Generates a personalized message from the AI based on correctness.
 * Uses the current model state by default.
 * Genera un mensaje personalizado de la IA basado en la corrección.
 * Usa el estado actual del modelo por defecto.
 * @param {boolean} isCorrect - Whether the AI's answer was correct. Si la respuesta de la IA fue correcta.
 * @param {string} question - The text of the question asked. El texto de la pregunta realizada.
 * @param {string} idioma - The language for the message. El idioma para el mensaje.
 * @param {string} [model=modelState.current] - The specific model to use. Defaults to the current global state. El modelo específico a usar. Por defecto, el estado global actual.
 * @returns {Promise<string|null>} The generated message or null if the LLM response was empty or failed. El mensaje generado o null si la respuesta del LLM fue vacía o falló.
 */
async function generateAIMessage(isCorrect, question, idioma, model = modelState.current) {
    const result = isCorrect ? "correct" : "incorrect";
    // Plantilla del prompt para generar el mensaje de la IA
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

    // Verificar si la API key está disponible
    if (!process.env.LLM_API_KEY) {
        console.error("generateAIMessage: LLM_API_KEY no encontrada.");
        // Lanzar error específico para que lo capture el endpoint
        throw new Error("Configuración del servidor incompleta: falta LLM_API_KEY");
    }

    try {
        // Llamar a sendQuestionToLLM, que maneja el fallback internamente
        // Usa el modelo actual del estado o el especificado
        const response = await sendQuestionToLLM(messagePromptTemplate, "Genera una respuesta", process.env.LLM_API_KEY, model);
        // Devuelve la respuesta (será null si el LLM respondió vacío o ambos modelos fallaron)
        return response;
    } catch (error) {
        // Capturar errores si sendQuestionToLLM lanza una excepción (ej. ambos modelos fallaron)
        console.error("Error dentro de generateAIMessage al llamar a sendQuestionToLLM:", error.message);
        // Relanzar el error para que lo maneje el endpoint que llamó a esta función
        throw error;
    }
}


/**
 * Handles fallback simulation when LLM fails or response is invalid.
 * Maneja la simulación de fallback cuando el LLM falla o la respuesta es inválida.
 * @param {string} difficulty - The game difficulty ('easy', 'medium', 'hard'). La dificultad del juego.
 * @param {string} correctAnswer - The correct answer text. El texto de la respuesta correcta.
 * @param {string[]} options - The list of possible answer options. La lista de opciones de respuesta posibles.
 * @param {string} questionText - The text of the question. El texto de la pregunta.
 * @param {string} idioma - The language code. El código de idioma.
 * @param {string} reason - Short description of why fallback is triggered. Descripción corta de por qué se activa el fallback.
 * @returns {Promise<object>} A promise resolving to { selectedAnswer, isCorrect, message }. Una promesa que resuelve a { selectedAnswer, isCorrect, message }.
 */
async function handleSimulationFallback(difficulty, correctAnswer, options, questionText, idioma, reason) {
    console.warn(`Fallback triggered (${reason}). Using simulation.`);
    let aiAccuracy; // Precisión de la IA simulada según la dificultad
    switch (difficulty.toLowerCase()) {
        case "easy": aiAccuracy = 0.3; break; // Menor precisión para fácil
        case "hard": aiAccuracy = 0.9; break; // Mayor precisión para difícil
        case "medium":
        default: aiAccuracy = 0.75; // Precisión media por defecto
    }
    // Simular si la IA acierta o falla
    const isCorrectSimulated = Math.random() < aiAccuracy;
    // Elegir respuesta simulada: la correcta si acertó, una incorrecta si falló
    const selectedAnswerSimulated = isCorrectSimulated
        ? correctAnswer
        : options.find(opt => opt !== correctAnswer) || options[0]; // Encuentra una respuesta incorrecta o usa la primera opción

    let message;
    try {
        // Intentar generar un mensaje incluso en el fallback, usando el estado actual del modelo
        // (El modelo podría haberse cambiado a backup si el fallo original fue 5xx)
        message = await generateAIMessage(isCorrectSimulated, questionText, idioma);
        if (!message) { // Si la generación de mensaje falla o devuelve vacío
            console.warn(`generateAIMessage (fallback: ${reason}) devolvió vacío/null, usando mensaje por defecto.`);
            message = getDefaultMessage(isCorrectSimulated, idioma); // Usar mensaje por defecto
        }
    } catch (msgError) {
        // Capturar errores durante la generación de mensaje en el fallback
        // Esto podría pasar si la API key falta, por ejemplo.
        console.error(`Error al generar mensaje (fallback: ${reason}), usando default:`, msgError.message);
        message = getDefaultMessage(isCorrectSimulated, idioma); // Usar mensaje por defecto
    }

    // Devolver el resultado simulado
    return {
        selectedAnswer: selectedAnswerSimulated,
        isCorrect: isCorrectSimulated,
        message: message
    };
}


// --- Hint Generation ---
// --- Generación de Pistas ---

// Plantilla del prompt para generar pistas
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

/**
 * Generates the system prompt for hint generation.
 * Genera el prompt de sistema para la generación de pistas.
 * @param {object} question - The question object containing description data. El objeto pregunta que contiene los datos de descripción.
 * @param {string} idioma - The language for the hint. El idioma para la pista.
 * @returns {string} The formatted system prompt. El prompt de sistema formateado.
 */
function generateHintPrompt(question, idioma) {
    // Formatear los datos de descripción para el prompt
    const dataText = question.descripcion
        .map(item => `${item.propiedad}: ${item.valor}`)
        .join('\n');
    // Reemplazar placeholders en la plantilla
    return hintPromptTemplate
        .replace('{datos}', dataText)
        .replace('{idioma}', idioma);
}

// --- AI Answer Generation ---
// --- Generación de Respuesta de IA ---

// Plantilla del prompt para generar la respuesta de la IA
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

/**
 * Generates the system prompt for AI answer generation.
 * Genera el prompt de sistema para la generación de respuesta de la IA.
 * @param {string} questionText - The text of the question. El texto de la pregunta.
 * @param {string[]} options - The available answer options. Las opciones de respuesta disponibles.
 * @param {string} correctAnswer - The correct answer text. El texto de la respuesta correcta.
 * @param {string} difficulty - The game difficulty. La dificultad del juego.
 * @param {string} idioma - The language for the response. El idioma para la respuesta.
 * @returns {string} The formatted system prompt. El prompt de sistema formateado.
 */
function generateAiAnswerPrompt(questionText, options, correctAnswer, difficulty, idioma) {
    let personalityInstruction = ""; // Instrucción de personalidad según dificultad
    switch (difficulty.toLowerCase()) {
        case "easy":
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

    // Reemplazar placeholders en la plantilla
    return gameQuestionPromptTemplate
        .replace('{personality_instruction}', personalityInstruction)
        .replace('{pregunta}', questionText)
        .replace('{opciones}', options.join('\n ')) // Unir opciones con salto de línea
        .replace('{respuestaCorrecta}', correctAnswer)
        .replace('{idioma}', idioma);
}

// --- Endpoints ---

// Endpoint /ask (Hint generation)
// Endpoint /ask (Generación de Pista)
app.post('/ask', async (req, res) => {
    try {
        console.log("Received /ask request");
        // --- CORRECCIÓN: Verificar API key ANTES de validar ---
        if (!process.env.LLM_API_KEY) {
            // Lanzar error específico si falta la API key
            throw new Error("Configuración del servidor incompleta: falta LLM_API_KEY");
        }
        // Validar campos de entrada DESPUÉS de verificar la API key
        validateAskRequiredFields(req);
        const { userQuestion, question, idioma } = req.body;
        // --- FIN CORRECCIÓN ---

        // Generar prompt y llamar al LLM (maneja fallback internamente)
        const systemPrompt = generateHintPrompt(question, idioma);
        let answer = await sendQuestionToLLM(systemPrompt, userQuestion, process.env.LLM_API_KEY);

        // Si sendQuestionToLLM devuelve null (respuesta vacía o fallo irrecuperable)
        if (answer === null) {
            console.log("sendQuestionToLLM returned null for /ask, setting default hint message.");
            // Establecer un mensaje específico para pistas cuando no se puede generar
            answer = (idioma === 'es') ? "Lo siento, no puedo dar una pista en este momento." : "Sorry, I cannot provide a hint right now.";
        }

        console.log("LLM Hint Answer:", answer);
        // Enviar respuesta exitosa
        res.json({ answer });

    } catch (error) {
        // Capturar errores (de validación, API key, o de sendQuestionToLLM)
        console.error('Error al procesar solicitud de pista:', error.message);

        // --- CORRECCIÓN: Mejorar manejo de errores en catch ---
        let errorStatus = 500; // Por defecto 500
        let responseError = "Error interno al generar la pista."; // Mensaje genérico por defecto

        // Identificar errores de validación (lanzados por validateAskRequiredFields)
        if (error.message.includes("requerido") || error.message.includes("inválida") || error.message.includes("especificado")) {
            errorStatus = 400;
            responseError = error.message; // Usar el mensaje específico de la validación
        }
        // Identificar error de API Key faltante
        else if (error.message.includes("Configuración del servidor incompleta")) {
            errorStatus = 500; // Sigue siendo un error interno
            responseError = "Error interno del servidor."; // Mensaje más genérico para el usuario
        }
        // Para otros errores de sendQuestionToLLM (ej. 4xx, network error)
        else {
            const finalIdioma = req?.body?.idioma || 'es';
            responseError = (finalIdioma === 'es') ? "Error al generar la pista." : "Error generating hint.";
        }

        // Enviar respuesta de error
        res.status(errorStatus).json({
            error: responseError, // Mensaje determinado arriba
            details: error.message // Mensaje técnico original
        });
        // --- FIN CORRECCIÓN ---
    }
});

// Endpoint /ai-answer (AI opponent's answer)
// Endpoint /ai-answer (Respuesta del oponente IA)
app.post('/ai-answer', async (req, res) => {
    let responsePayload; // Payload final de la respuesta

    try {
        console.log("Received /ai-answer request");

        // --- CORRECCIÓN: Verificar API key ANTES de validar ---
        if (!process.env.LLM_API_KEY) {
            throw new Error("Configuración del servidor incompleta: falta LLM_API_KEY");
        }
        // --- FIN CORRECCIÓN ---

        // --- Input Validation ---
        // Validar campos requeridos usando la función dedicada
        validateAiAnswerRequiredFields(req);
        const { question, options, difficulty = "medium", idioma } = req.body;
        const questionText = question.pregunta[idioma];
        const correctAnswer = question.respuestaCorrecta[idioma];

        // --- Simulation Check (for testing) ---
        // Comprobación de simulación (para testing)
        const useSimulation = process.env.NODE_ENV === 'test' && Math.random() > 0.95;
        if (useSimulation) {
            console.log("Usando respuesta simulada para /ai-answer (TEST)");
            // Generar respuesta simulada y enviarla
            responsePayload = await handleSimulationFallback(difficulty, correctAnswer, options, questionText, idioma, "Test Simulation");
            return res.json(responsePayload);
        }

        // --- Normal Flow: Get AI Answer ---
        // Flujo normal: Obtener respuesta de la IA
        const systemPrompt = generateAiAnswerPrompt(questionText, options, correctAnswer, difficulty, idioma);
        let rawAnswer; // Respuesta cruda del LLM
        let selectedAnswer;
        let isCorrect;
        let messageContent;

        try {
            // Llamar al LLM para obtener la respuesta. sendQuestionToLLM maneja fallback y estado.
            rawAnswer = await sendQuestionToLLM(systemPrompt, "¿Cuál es tu respuesta JSON?", process.env.LLM_API_KEY);

            // Manejar caso donde LLM (primario o backup) devolvió respuesta vacía
            if (rawAnswer === null) {
                console.warn("sendQuestionToLLM devolvió null (respuesta vacía). Usando simulación.");
                // Usar simulación como fallback si la respuesta es vacía
                responsePayload = await handleSimulationFallback(difficulty, correctAnswer, options, questionText, idioma, "LLM Empty Response");
                return res.json(responsePayload);
            }

            // --- Parse and Validate LLM Answer ---
            console.log("LLM Raw Answer:", rawAnswer);
            let parsedAnswer;
            try {
                // Intentar encontrar y parsear un JSON en la respuesta
                const jsonMatch = rawAnswer.match(/\{[\s\S]*?\}/); // Match no-greedy de JSON
                if (jsonMatch && jsonMatch[0]) {
                    parsedAnswer = JSON.parse(jsonMatch[0]);
                    // Validar estructura del JSON parseado
                    if (!parsedAnswer || typeof parsedAnswer.selectedAnswer === 'undefined' || typeof parsedAnswer.isCorrect === 'undefined') {
                        throw new Error("JSON parseado no tiene la estructura esperada (selectedAnswer, isCorrect).");
                    }
                    // Validar que la respuesta seleccionada esté entre las opciones
                    if (!options.includes(parsedAnswer.selectedAnswer)) {
                        // Si la respuesta no es válida, lanzar error para ir a simulación
                        throw new Error(`La selectedAnswer ("${parsedAnswer.selectedAnswer}") del LLM no es una opción válida.`);
                    }

                    // Usar la respuesta directamente del LLM (basada en su personalidad)
                    selectedAnswer = parsedAnswer.selectedAnswer;
                    isCorrect = parsedAnswer.isCorrect; // Usar la corrección determinada por la personalidad del LLM

                    // Comprobación opcional (loguear si la corrección del LLM no coincide con la real)
                    const actualCorrectness = (selectedAnswer === correctAnswer);
                    if (isCorrect !== actualCorrectness) {
                        console.warn(`Advertencia: El campo 'isCorrect' (${isCorrect}) del LLM no coincide con la corrección real (${actualCorrectness}) para la respuesta seleccionada "${selectedAnswer}". Se usará el valor del LLM.`);
                    }

                } else {
                    // Intentar match directo si no se encontró JSON (menos probable)
                    const directMatch = options.find(opt => rawAnswer.trim().toLowerCase() === opt.toLowerCase());
                    if (directMatch) {
                        console.warn("LLM no devolvió JSON, pero la respuesta coincide directamente con una opción.");
                        selectedAnswer = directMatch;
                        isCorrect = selectedAnswer === correctAnswer;
                    } else {
                        // Si no hay JSON ni match directo, lanzar error para ir a simulación
                        throw new Error("No se encontró un JSON válido ni una respuesta directa coincidente en la respuesta del LLM.");
                    }
                }
            } catch (parseError) {
                // Manejar errores de parseo JSON o validación (ej. selectedAnswer no válida)
                console.error("Error al parsear o validar la respuesta JSON del LLM, usando simulación:", parseError.message);
                // Usar simulación como fallback
                responsePayload = await handleSimulationFallback(difficulty, correctAnswer, options, questionText, idioma, "Parsing/Validation Error");
                return res.json(responsePayload);
            }

            // --- Generate AI Message ---
            // Generar mensaje de la IA basado en el resultado obtenido (del LLM o match directo)
            // *** CORRECCIÓN: Mover generación de mensaje aquí y manejar su error ***
            try {
                messageContent = await generateAIMessage(isCorrect, questionText, idioma);
                if (!messageContent) {
                    // Si la generación de mensaje falla o está vacía, usar mensaje por defecto
                    console.warn("generateAIMessage (normal) devolvió vacío/null, usando mensaje por defecto.");
                    messageContent = getDefaultMessage(isCorrect, idioma);
                }
            } catch (messageError) {
                // Si generateAIMessage lanza un error (ej. API key missing, o fallo irrecuperable de LLM)
                console.error("Error al generar mensaje para /ai-answer, usando default:", messageError.message);
                messageContent = getDefaultMessage(isCorrect, idioma); // Usar mensaje por defecto
                // NO lanzar error aquí, devolver 200 con el mensaje por defecto
            }
            // *** FIN CORRECCIÓN ***

            // --- Prepare Final Successful Response ---
            // Preparar la respuesta final exitosa
            responsePayload = {
                selectedAnswer: selectedAnswer,
                isCorrect: isCorrect,
                message: messageContent
            };
            return res.json(responsePayload); // Enviar respuesta

        } catch (llmError) {
            // Captura errores *irrecuperables* de sendQuestionToLLM (ej. 4xx, network error, o fallback fallido)
            console.error("Error irrecuperable al obtener respuesta del LLM para /ai-answer:", llmError.message);
            // Lanzar el error para que lo capture el catch principal del endpoint
            throw llmError;
        }

    } catch (error) {
        // Capturar errores generales del endpoint (validación inicial, API key, error irrecuperable de LLM)
        console.error('Error general en /ai-answer:', error.message);
        const finalIdioma = req?.body?.idioma || 'es'; // Obtener idioma si es posible

        // Determinar código de estado y mensaje de error para la respuesta
        let errorStatus = 500; // Por defecto 500 para errores internos/LLM
        let responseError = "Error al procesar la respuesta de la IA."; // Mensaje genérico

        // Si es un error de validación conocido
        if (error.message.includes("inválido") || error.message.includes("faltante") || error.message.includes("especificado")) {
            errorStatus = 400;
            responseError = error.message; // Usar el mensaje específico de la validación
        } else if (error.message.includes("Configuración del servidor incompleta")) {
            errorStatus = 500; // Mantener 500
            responseError = "Error interno del servidor."; // Mensaje más genérico
        }
        // Aquí podrían ir otros chequeos si se lanzan errores específicos

        // Enviar respuesta de error
        res.status(errorStatus).json({
            error: responseError, // Usar el mensaje de error determinado
            details: error.message, // Mantener el detalle técnico
            // Incluir una estructura mínima de respuesta para consistencia
            selectedAnswer: "Error",
            isCorrect: false,
            message: getDefaultMessage(false, finalIdioma) // Mensaje por defecto de fallo
        });
    }
});


// Endpoint /ai-message (Genera solo el mensaje de la IA)
app.post('/ai-message', async (req, res) => {
    let isCorrect = false; // Valor por defecto para usar en el mensaje por defecto en caso de error temprano
    let requestedIdioma = req?.body?.idioma; // Guardar idioma solicitado (con optional chaining)

    try {
        console.log("Received /ai-message request");
        // --- CORRECCIÓN: Verificar API key ANTES de validar ---
        if (!process.env.LLM_API_KEY) {
            throw new Error("Configuración del servidor incompleta: falta LLM_API_KEY");
        }
        // --- FIN CORRECCIÓN ---

        // --- Validation ---
        // Validación de campos de entrada
        const { result, question } = req.body; // Obtener result y question
        if (!requestedIdioma) { throw new Error("Campo 'idioma' faltante."); } // Validar idioma
        if (result !== "correct" && result !== "incorrect") { throw new Error("Campo 'result' inválido. Debe ser 'correct' o 'incorrect'."); }
        if (!question || typeof question !== 'string' || question.trim() === '') { throw new Error("Campo 'question' inválido o faltante."); }


        // Determinar corrección basado en el input
        isCorrect = result === "correct";
        // Generar mensaje usando la función (maneja fallback internamente y puede lanzar error)
        let message = await generateAIMessage(isCorrect, question, requestedIdioma);

        // Si generateAIMessage devuelve null (respuesta vacía de LLM)
        if (message === null) {
            console.warn("generateAIMessage (for /ai-message) devolvió null, usando mensaje por defecto.");
            message = getDefaultMessage(isCorrect, requestedIdioma); // Usar mensaje por defecto
        }
        // Enviar respuesta exitosa
        res.json({ message });

    } catch (error) {
        // Capturar errores (validación, API key, o fallo irrecuperable de generateAIMessage)
        console.error('Error en /ai-message:', error.message);
        const finalIdioma = requestedIdioma || 'es'; // Usar idioma solicitado o 'es' por defecto
        const defaultMessage = getDefaultMessage(isCorrect, finalIdioma); // Mensaje por defecto basado en 'result' si está disponible

        // Determinar código de estado y mensaje de error
        let statusCode = 500; // Por defecto 500 si generateAIMessage falla
        let responseError = "Error interno al generar el mensaje de la IA."; // Mensaje genérico por defecto

        if (error.message.includes("inválido") || error.message.includes("faltante")) {
            statusCode = 400; // Error de validación
            responseError = error.message; // Usar mensaje específico
        } else if (error.message.includes("Configuración del servidor incompleta")) {
            statusCode = 500; // Error de configuración es 500
            responseError = "Error interno del servidor."; // Mensaje más genérico
        }
        // Si es otro tipo de error de generateAIMessage (ej. fallo de LLM)
        else {
            // Mantenemos 500 y el mensaje genérico, pero usamos el details original
        }

        // Enviar respuesta de error
        res.status(statusCode).json({
            error: responseError, // Mensaje determinado arriba
            details: error.message, // Mensaje técnico original
            message: defaultMessage // Incluir mensaje por defecto en la respuesta de error
        });
    }
});


// --- Server Start/Stop ---
// --- Inicio/Parada del Servidor ---
let server; // Variable para mantener la instancia del servidor

/**
 * Starts the Express server.
 * Inicia el servidor Express.
 * @param {number} [testPort] - Optional port for testing. Puerto opcional para testing.
 * @returns {object|null} The server instance or null if failed. La instancia del servidor o null si falló.
 */
function startServer(testPort) {
    // Evitar iniciar si ya está corriendo
    if (server && server.listening) {
        console.warn("Server already running.");
        return server;
    }
    const serverPort = testPort || port; // Usar puerto de test o el por defecto
    try {
        // Iniciar el servidor escuchando en el puerto
        server = app.listen(serverPort);
        // Evento cuando el servidor empieza a escuchar
        server.on('listening', () => {
            console.log(`LLM Service listening at http://localhost:${serverPort}`);
            console.log(`Initial model state: ${modelState.current}`); // Mostrar estado inicial del modelo
        });
        // Evento en caso de error al iniciar (ej. puerto ocupado)
        server.on('error', (err) => {
            console.error(`Error starting server on port ${serverPort}:`, err);
            if (err.code === 'EADDRINUSE') {
                console.error(`Port ${serverPort} is already in use.`);
            }
            server = null; // Resetear variable del servidor
        });
        return server; // Devolver instancia del servidor
    } catch (err) {
        // Capturar error inmediato al intentar iniciar
        console.error(`Failed to start server immediately on port ${serverPort}:`, err);
        server = null;
        throw err; // Relanzar error
    }
}

/**
 * Stops the Express server gracefully.
 * Detiene el servidor Express de forma controlada.
 * @returns {Promise<void>} A promise that resolves when the server is closed. Una promesa que resuelve cuando el servidor se cierra.
 */
function closeServer() {
    return new Promise((resolve, reject) => {
        // Verificar si el servidor existe y está escuchando
        if (server && server.listening) {
            console.log("Closing server...");
            // Cerrar el servidor
            server.close((err) => {
                if (err) {
                    // Si hay error al cerrar
                    console.error("Error closing server:", err);
                    reject(err);
                } else {
                    // Si se cierra correctamente
                    console.log("Server closed.");
                    server = null; // Resetear variable del servidor
                    resolve(); // Resolver la promesa
                }
            });
        } else {
            // Si el servidor no está corriendo
            console.log("Server not running or already closed.");
            resolve(); // Resolver la promesa igualmente
        }
    });
}

// Start server if run directly (not imported as a module)
// Iniciar servidor si se ejecuta directamente (no si se importa como módulo)
if (require.main === module || process.env.NODE_ENV === 'test') {
    startServer(); // Iniciar con el puerto por defecto
    // Graceful shutdown handling (manejo de cierre controlado)
    // Capturar señales SIGINT (Ctrl+C) y SIGTERM
    process.on('SIGINT', async () => {
        console.log('SIGINT signal received: closing HTTP server');
        await closeServer(); // Esperar a que cierre el servidor
        process.exit(0); // Salir del proceso
    });
    process.on('SIGTERM', async () => {
        console.log('SIGTERM signal received: closing HTTP server');
        await closeServer(); // Esperar a que cierre el servidor
        process.exit(0); // Salir del proceso
    });
}

// Exportar elementos necesarios para tests u otros módulos
module.exports = {
    app,            // Instancia de Express
    startServer,    // Función para iniciar el servidor
    closeServer,    // Función para detener el servidor
    resetModelState // Función para reiniciar el estado del modelo (para tests)
};