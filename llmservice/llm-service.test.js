const request = require("supertest");
const axios = require("axios");
// Import app, startServer, closeServer from the service file
// Import resetModelState for resetting state between tests
const { app, startServer, closeServer, resetModelState } = require("./llm-service"); // Asegúrate que la ruta sea correcta

// Variable to hold the server instance
let server;

// Start the server before all tests on a specific port for testing
beforeAll(async () => {
  // Use a different port for tests to avoid conflicts
  server = startServer(8090); // Use a dedicated test port
  // Wait a bit for the server to potentially start listening
  await new Promise(resolve => setTimeout(resolve, 100));
});

// Close the server after all tests are done
afterAll(async () => {
  await closeServer();
});

// Mock the axios library to simulate external API calls
jest.mock("axios");

// Mock process.env to provide a dummy API key for tests
process.env.LLM_API_KEY = "test-api-key";
// Set NODE_ENV to 'development' by default unless overridden in specific tests
process.env.NODE_ENV = 'development';

describe("LLM Service", () => {
  // --- Common test data ---
  const testAskQuestionPayload = {
    userQuestion: "¿Es la torre eiffel?",
    question: {
      respuestaCorrecta: "El Big Ben",
      pregunta: {
        es: "¿Cuál es este monumento?",
        en: "What is this monument?",
      },
      descripcion: [
        { propiedad: "Capital", valor: "Londres" },
        { propiedad: "Monarca del país", valor: "Carlos II" },
      ],
    },
    idioma: "es",
  };

  const testAiAnswerPayload = {
    question: {
      pregunta: { es: "¿Capital de Francia?", en: "Capital of France?" },
      respuestaCorrecta: { es: "París", en: "Paris" }
    },
    options: ["París", "Londres", "Berlín", "Madrid"],
    idioma: "es",
    difficulty: "medium"
  };

  const testAiAnswerPayloadEn = {
    question: {
      pregunta: { es: "¿Capital de Francia?", en: "Capital of France?" },
      respuestaCorrecta: { es: "París", en: "Paris" }
    },
    options: ["Paris", "London", "Berlin", "Madrid"],
    idioma: "en", // English
    difficulty: "medium"
  };


  const testAiMessagePayload = {
    result: "correct", // or "incorrect"
    question: "¿Capital de Francia?",
    idioma: "es"
  };

  // --- Mock responses from external services before each test ---
  beforeEach(() => {
    // Suppress console logs/errors/warnings during tests
    console.error = jest.fn();
    console.log = jest.fn();
    console.warn = jest.fn();

    // Reset model state to primary before each test
    resetModelState(); // Resets modelState.current to 'empathy'

    // Reset mocks for axios before each test
    axios.post.mockReset();
    axios.get.mockReset();

    // Default mock implementation for axios.post (Empathy AI API)
    axios.post.mockImplementation(async (url, data, config) => {
      // Check if the URL matches the Empathy AI endpoint
      if (url.startsWith("https://empathyai.prod.empathy.co/v1/chat/completions")) {
        const modelUsed = data.model || 'unknown';
        let mockContent = "default-mock-response";
        // Ensure data.messages exists and has at least one message before accessing content
        const systemPromptContent = data?.messages?.[0]?.content || "";

        // --- Mock logic for /ask (Hint Generation) ---
        if (systemPromptContent.includes("pistas sobre preguntas tipo quiz")) {
          mockContent = modelUsed.includes("Mistral") ? "mistral-hint-answer" : "empathy-hint-answer";
        }
        // --- Mock logic for /ai-answer (Answer Generation) ---
        else if (systemPromptContent.includes("participa en un juego de trivia")) {
          // Default: Primary model answers correctly
          mockContent = JSON.stringify({ selectedAnswer: "París", isCorrect: true });
          if (modelUsed.includes("Mistral")) {
            // Backup model answers incorrectly (example)
            mockContent = JSON.stringify({ selectedAnswer: "Londres", isCorrect: false });
          }
        }
        // --- Mock logic for /ai-message or generateAIMessage (Message Generation) ---
        else if (systemPromptContent.includes("Genera una frase corta y natural")) {
          // *** CORRECCIÓN v4: Check the RESULTADO line more reliably ***
          if (systemPromptContent.includes("RESULTADO: Has respondido CORRECTAMENTE")) {
            mockContent = "mock-message-correct";
          } else if (systemPromptContent.includes("RESULTADO: Has respondido INCORRECTAMENTE")) {
            mockContent = "mock-message-incorrect";
          } else {
            // Fallback if the RESULTADO line isn't found as expected
            console.warn("Mock could not determine correctness from prompt:", systemPromptContent);
            mockContent = "mock-message-unknown";
          }
          // Append model suffix if backup model is used
          if (modelUsed.includes("Mistral")) {
            mockContent += "-mistral";
          }
          // *** FIN CORRECCIÓN v4 ***
        }

        // Return the standard Empathy AI response structure
        return Promise.resolve({
          status: 200,
          data: { choices: [{ message: { content: mockContent } }] },
        });
      }
      // Throw error for unhandled mock requests
      console.error(`Unhandled mock POST request to ${url} with data:`, data);
      throw new Error(`Unhandled mock POST request to ${url}`);
    });

    // Mock axios.get for status check
    axios.get.mockResolvedValue({ status: 200, data: { status: "OK" } });
  });

  // --- Basic Endpoint Tests ---

  it("GET / should return status OK and current model", async () => {
    const response = await request(app).get("/");
    expect(response.statusCode).toBe(200);
    expect(response.body.status).toBe("OK");
    expect(response.body.message).toContain("LLM Service running");
    expect(response.body.message).toContain("Current Model: empathy"); // Initial state
  });

  // --- /ask Endpoint Tests ---

  it("POST /ask should process request with primary model (empathy)", async () => {
    const response = await request(app)
        .post("/ask")
        .send(testAskQuestionPayload); // No model specified in payload anymore

    expect(response.statusCode).toBe(200);
    expect(response.body.answer).toBe("empathy-hint-answer"); // Expect primary model's answer
    // Verify axios was called once with the primary model config
    expect(axios.post).toHaveBeenCalledTimes(1);
    expect(axios.post).toHaveBeenCalledWith(
        expect.stringContaining("empathyai.prod.empathy.co"),
        expect.objectContaining({ model: expect.stringContaining("Qwen") }), // Primary model identifier
        expect.any(Object) // Headers
    );
  });

  it("POST /ask should use backup model (mistral) on primary 5xx error and succeed", async () => {
    // Mock primary (empathy) to fail with 500
    axios.post.mockImplementationOnce(async (url, data) => {
      if (url.startsWith("https://empathyai") && data.model.includes("Qwen")) {
        const error = new Error("Internal Server Error");
        error.response = { status: 500, data: "Server Error" };
        throw error;
      }
      // Allow other calls to pass through to the default mock
      return axios.post.getMockImplementation()(url, data, {});
    });
    // The default mock will handle the second call (mistral) successfully

    const response = await request(app)
        .post("/ask")
        .send(testAskQuestionPayload);

    expect(response.statusCode).toBe(200);
    expect(response.body.answer).toBe("mistral-hint-answer"); // Expect backup model's answer
    // Verify axios was called twice: once for primary (failed), once for backup (succeeded)
    expect(axios.post).toHaveBeenCalledTimes(2);
    expect(axios.post).toHaveBeenNthCalledWith(1,
        expect.stringContaining("empathyai.prod.empathy.co"),
        expect.objectContaining({ model: expect.stringContaining("Qwen") }), // Primary
        expect.any(Object)
    );
    expect(axios.post).toHaveBeenNthCalledWith(2,
        expect.stringContaining("empathyai.prod.empathy.co"),
        expect.objectContaining({ model: expect.stringContaining("Mistral") }), // Backup
        expect.any(Object)
    );

    // Check if the model state switched
    const statusRes = await request(app).get("/");
    expect(statusRes.body.message).toContain("Current Model: mistral");
  });

  it("POST /ask should return 500 if backup model also fails after primary 5xx error", async () => {
    const error500 = new Error("Internal Server Error");
    error500.response = { status: 500, data: "Server Error" };
    const error503 = new Error("Service Unavailable");
    error503.response = { status: 503, data: "Backup Unavailable" };

    // Mock primary (empathy) to fail with 500
    axios.post.mockImplementationOnce(async (url, data) => {
      if (url.startsWith("https://empathyai") && data.model.includes("Qwen")) {
        throw error500;
      }
      return axios.post.getMockImplementation()(url, data, {});
    });
    // Mock backup (mistral) to also fail
    axios.post.mockImplementationOnce(async (url, data) => {
      if (url.startsWith("https://empathyai") && data.model.includes("Mistral")) {
        throw error503;
      }
      return axios.post.getMockImplementation()(url, data, {});
    });

    const response = await request(app)
        .post("/ask")
        .send(testAskQuestionPayload);

    expect(response.statusCode).toBe(500); // Expect 500 because original error was 5xx
    expect(response.body.error).toContain("Error al generar la pista."); // Generic error message from catch block
    // It should contain the details of the *original* error
    expect(response.body.details).toBe("Internal Server Error");
    // Verify axios was called twice
    expect(axios.post).toHaveBeenCalledTimes(2);
    // Check model state still switched
    const statusRes = await request(app).get("/");
    expect(statusRes.body.message).toContain("Current Model: mistral");
  });

  it("POST /ask should handle empty LLM response from primary model", async () => {
    // Mock primary (empathy) to return empty content
    axios.post.mockImplementationOnce(async (url, data) => {
      if (url.startsWith("https://empathyai") && data.model.includes("Qwen")) {
        return Promise.resolve({ status: 200, data: { choices: [{ message: { content: "  " } }] } });
      }
      return axios.post.getMockImplementation()(url, data, {});
    });

    const response = await request(app)
        .post("/ask")
        .send({ ...testAskQuestionPayload, idioma: "es" });

    expect(response.statusCode).toBe(200);
    // Expect the specific string set by the /ask endpoint when sendQuestionToLLM returns null
    expect(response.body.answer).toBe("Lo siento, no puedo dar una pista en este momento.");
    expect(axios.post).toHaveBeenCalledTimes(1); // Only primary model called
  });

  it("POST /ask should handle empty LLM response from backup model (after primary 5xx)", async () => {
    // Mock primary (empathy) to fail with 500
    axios.post.mockImplementationOnce(async (url, data) => {
      if (url.startsWith("https://empathyai") && data.model.includes("Qwen")) {
        const error = new Error("Internal Server Error");
        error.response = { status: 500, data: "Server Error" };
        throw error;
      }
      return axios.post.getMockImplementation()(url, data, {});
    });
    // Mock backup (mistral) to return empty
    axios.post.mockImplementationOnce(async (url, data) => {
      if (url.startsWith("https://empathyai") && data.model.includes("Mistral")) {
        return Promise.resolve({ status: 200, data: { choices: [{ message: { content: null } }] } }); // Test with null
      }
      return axios.post.getMockImplementation()(url, data, {});
    });

    const response = await request(app)
        .post("/ask")
        .send({ ...testAskQuestionPayload, idioma: "en" }); // Use english for different message

    expect(response.statusCode).toBe(200);
    // Expect the specific string set by the /ask endpoint when sendQuestionToLLM returns null
    expect(response.body.answer).toBe("Sorry, I cannot provide a hint right now.");
    expect(axios.post).toHaveBeenCalledTimes(2); // Both models called
  });


  it("POST /ask should handle non-5xx LLM API errors (e.g., 403 Forbidden) and return 500 (no fallback)", async () => {
    const apiError = new Error("Request failed with status code 403");
    apiError.response = { status: 403, data: { error: "Forbidden" } };
    // Mock primary to fail with 403
    axios.post.mockImplementationOnce(async (url, data) => {
      if (url.startsWith("https://empathyai") && data.model.includes("Qwen")) {
        throw apiError;
      }
      return axios.post.getMockImplementation()(url, data, {});
    });

    const response = await request(app)
        .post("/ask")
        .send(testAskQuestionPayload);

    expect(response.statusCode).toBe(500);
    expect(response.body.error).toContain("Error al generar la pista."); // Generic error message from catch block
    expect(response.body.details).toBe("Request failed with status code 403");
    expect(axios.post).toHaveBeenCalledTimes(1); // Fallback NOT triggered for non-5xx
  });

  it("POST /ask should handle generic network errors and return 500 (no fallback)", async () => {
    // Mock primary to fail with network error
    axios.post.mockImplementationOnce(async () => { throw new Error("Network error"); });

    const response = await request(app)
        .post("/ask")
        .send(testAskQuestionPayload);

    expect(response.statusCode).toBe(500);
    expect(response.body.error).toContain("Error al generar la pista."); // Generic error message from catch block
    expect(response.body.details).toBe("Network error");
    expect(axios.post).toHaveBeenCalledTimes(1); // Fallback NOT triggered
  });

  it("POST /ask should return 500 error if LLM_API_KEY is missing", async () => {
    const originalApiKey = process.env.LLM_API_KEY;
    delete process.env.LLM_API_KEY; // Temporarily remove API key
    const response = await request(app)
        .post("/ask")
        .send(testAskQuestionPayload);
    expect(response.statusCode).toBe(500);
    expect(response.body.error).toBe("Error interno del servidor."); // Generic message
    expect(response.body.details).toContain("Configuración del servidor incompleta"); // Specific detail
    process.env.LLM_API_KEY = originalApiKey; // Restore API key
  });

  // --- Validation Tests for /ask ---
  it("POST /ask should return 400 error for missing 'userQuestion'", async () => {
    const { userQuestion, ...payload } = testAskQuestionPayload;
    const response = await request(app).post("/ask").send(payload);
    expect(response.statusCode).toBe(400);
    expect(response.body.error).toBe("Campo requerido faltante: userQuestion"); // Exact message
    expect(response.body.details).toBe("Campo requerido faltante: userQuestion");
  });

  it("POST /ask should return 400 error for missing 'question'", async () => {
    const { question, ...payload } = testAskQuestionPayload;
    const response = await request(app).post("/ask").send(payload);
    expect(response.statusCode).toBe(400);
    expect(response.body.error).toBe("Campo requerido faltante: question"); // Exact message
    expect(response.body.details).toBe("Campo requerido faltante: question");
  });

  it("POST /ask should return 400 error for missing 'idioma'", async () => {
    const { idioma, ...payload } = testAskQuestionPayload;
    const response = await request(app).post("/ask").send(payload);
    expect(response.statusCode).toBe(400);
    expect(response.body.error).toBe("Campo requerido faltante: idioma"); // Exact message
    expect(response.body.details).toBe("Campo requerido faltante: idioma");
  });

  it("POST /ask should return 400 error if question text is missing for specified idioma", async () => {
    const payload = JSON.parse(JSON.stringify(testAskQuestionPayload));
    delete payload.question.pregunta.es; // Remove spanish question text
    const response = await request(app).post("/ask").send(payload);
    expect(response.statusCode).toBe(400);
    expect(response.body.error).toBe("Falta la pregunta en el idioma especificado: es"); // Exact message
    expect(response.body.details).toBe("Falta la pregunta en el idioma especificado: es");
  });


  it("POST /ask should return 400 error for invalid 'question' structure (missing pregunta obj)", async () => {
    const invalidPayload = { ...testAskQuestionPayload, question: { respuestaCorrecta: "Test", descripcion: [] } };
    const response = await request(app).post("/ask").send(invalidPayload);
    expect(response.statusCode).toBe(400);
    expect(response.body.error).toBe("Estructura de question inválida o faltante"); // Exact message
    expect(response.body.details).toBe("Estructura de question inválida o faltante");
  });

  it("POST /ask should return 400 error for invalid 'question' structure (missing respuestaCorrecta)", async () => {
    const invalidPayload = { ...testAskQuestionPayload, question: { pregunta: {es:"test"}, descripcion: [] } };
    const response = await request(app).post("/ask").send(invalidPayload);
    expect(response.statusCode).toBe(400);
    expect(response.body.error).toBe("Estructura de question inválida o faltante"); // Exact message
    expect(response.body.details).toBe("Estructura de question inválida o faltante");
  });

  it("POST /ask should return 400 error for invalid 'question' structure (missing descripcion)", async () => {
    const invalidPayload = { ...testAskQuestionPayload, question: { pregunta: {es:"test"}, respuestaCorrecta: "Test" } };
    const response = await request(app).post("/ask").send(invalidPayload);
    expect(response.statusCode).toBe(400);
    expect(response.body.error).toBe("Estructura de question inválida o faltante"); // Exact message
    expect(response.body.details).toBe("Estructura de question inválida o faltante");
  });


  // --- /ai-answer Endpoint Tests ---

  it("POST /ai-answer should return AI answer and message (primary model)", async () => {
    const response = await request(app).post("/ai-answer").send(testAiAnswerPayload);

    expect(response.statusCode).toBe(200);
    expect(response.body.selectedAnswer).toBe("París");
    expect(response.body.isCorrect).toBe(true);
    expect(response.body.message).toBe("mock-message-correct");
    expect(axios.post).toHaveBeenCalledTimes(2);
    expect(axios.post).toHaveBeenNthCalledWith(1, expect.stringContaining("empathyai.prod.empathy.co"), expect.objectContaining({ model: expect.stringContaining("Qwen") }), expect.any(Object));
    expect(axios.post).toHaveBeenNthCalledWith(2, expect.stringContaining("empathyai.prod.empathy.co"), expect.objectContaining({ model: expect.stringContaining("Qwen") }), expect.any(Object));
  });

  it("POST /ai-answer should use backup model for answer/message if primary fails (5xx)", async () => {
    axios.post.mockImplementationOnce(async (url, data) => {
      if (url.startsWith("https://empathyai") && data.model.includes("Qwen") && data.messages[0].content.includes("juego de trivia")) {
        const error = new Error("Internal Server Error");
        error.response = { status: 500, data: "Server Error" };
        throw error;
      }
      return axios.post.getMockImplementation()(url, data, {});
    });

    const response = await request(app).post("/ai-answer").send(testAiAnswerPayload);

    expect(response.statusCode).toBe(200);
    expect(response.body.selectedAnswer).toBe("Londres");
    expect(response.body.isCorrect).toBe(false);
    // *** CORRECTED EXPECTATION based on refined mock ***
    expect(response.body.message).toBe("mock-message-incorrect-mistral");
    expect(axios.post).toHaveBeenCalledTimes(3);
    expect(axios.post).toHaveBeenNthCalledWith(1, expect.stringContaining("empathyai.prod.empathy.co"), expect.objectContaining({ model: expect.stringContaining("Qwen") }), expect.any(Object));
    expect(axios.post).toHaveBeenNthCalledWith(2, expect.stringContaining("empathyai.prod.empathy.co"), expect.objectContaining({ model: expect.stringContaining("Mistral") }), expect.any(Object));
    expect(axios.post).toHaveBeenNthCalledWith(3, expect.stringContaining("empathyai.prod.empathy.co"), expect.objectContaining({ model: expect.stringContaining("Mistral") }), expect.any(Object));
    const statusRes = await request(app).get("/");
    expect(statusRes.body.message).toContain("Current Model: mistral");
  });


  it("POST /ai-answer should handle LLM response parsing error and use simulation fallback", async () => {
    axios.post.mockImplementationOnce(async (url, data) => {
      if (url.startsWith("https://empathyai") && data.model.includes("Qwen") && data.messages[0].content.includes("juego de trivia")) {
        return Promise.resolve({ status: 200, data: { choices: [{ message: { content: "this is not json" } }] } });
      }
      return axios.post.getMockImplementation()(url, data, {});
    });
    const originalMathRandom = Math.random;
    Math.random = jest.fn().mockReturnValue(0.1); // Force correct simulation

    const response = await request(app).post("/ai-answer").send({ ...testAiAnswerPayload, difficulty: "medium" });

    expect(response.statusCode).toBe(200);
    expect(response.body.isCorrect).toBe(true);
    expect(response.body.selectedAnswer).toBe("París");
    expect(response.body.message).toBe("mock-message-correct");
    expect(axios.post).toHaveBeenCalledTimes(2);
    expect(axios.post).toHaveBeenNthCalledWith(1, expect.stringContaining("empathyai.prod.empathy.co"), expect.objectContaining({ model: expect.stringContaining("Qwen") }), expect.any(Object));
    expect(axios.post).toHaveBeenNthCalledWith(2, expect.stringContaining("empathyai.prod.empathy.co"), expect.objectContaining({ model: expect.stringContaining("Qwen") }), expect.any(Object));
    Math.random = originalMathRandom;
  });

  it("POST /ai-answer should handle LLM response non-JSON direct match", async () => {
    axios.post.mockImplementationOnce(async (url, data) => {
      if (url.startsWith("https://empathyai") && data.model.includes("Qwen") && data.messages[0].content.includes("juego de trivia")) {
        return Promise.resolve({ status: 200, data: { choices: [{ message: { content: "   Madrid   " } }] } });
      }
      return axios.post.getMockImplementation()(url, data, {});
    });

    const response = await request(app).post("/ai-answer").send(testAiAnswerPayload);

    expect(response.statusCode).toBe(200);
    expect(response.body.isCorrect).toBe(false);
    expect(response.body.selectedAnswer).toBe("Madrid");
    // *** CORRECTED EXPECTATION based on refined mock ***
    expect(response.body.message).toBe("mock-message-incorrect");
    expect(axios.post).toHaveBeenCalledTimes(2);
  });

  it("POST /ai-answer should handle empty LLM response for answer and use simulation fallback", async () => {
    axios.post.mockImplementationOnce(async (url, data) => {
      if (url.startsWith("https://empathyai") && data.model.includes("Qwen") && data.messages[0].content.includes("juego de trivia")) {
        return Promise.resolve({ status: 200, data: { choices: [{ message: { content: "" } }] } });
      }
      return axios.post.getMockImplementation()(url, data, {});
    });
    const originalMathRandom = Math.random;
    Math.random = jest.fn().mockReturnValue(0.9); // Force incorrect simulation

    const response = await request(app).post("/ai-answer").send({ ...testAiAnswerPayload, difficulty: "medium" });

    expect(response.statusCode).toBe(200);
    expect(response.body.isCorrect).toBe(false);
    expect(response.body.selectedAnswer).toBe("Londres");
    // *** CORRECTED EXPECTATION based on refined mock ***
    expect(response.body.message).toBe("mock-message-incorrect");
    expect(axios.post).toHaveBeenCalledTimes(2);
    Math.random = originalMathRandom;
  });


  it("POST /ai-answer should return 500 if both primary and backup models fail for answer", async () => { // Test name updated for clarity
    const error500 = new Error("Internal Server Error");
    error500.response = { status: 500, data: "Server Error" };
    const error503 = new Error("Service Unavailable");
    error503.response = { status: 503, data: "Backup Unavailable" };

    axios.post.mockImplementationOnce(async (url, data) => {
      if (url.startsWith("https://empathyai") && data.model.includes("Qwen") && data.messages[0].content.includes("juego de trivia")) {
        throw error500;
      }
      return axios.post.getMockImplementation()(url, data, {});
    });
    axios.post.mockImplementationOnce(async (url, data) => {
      if (url.startsWith("https://empathyai") && data.model.includes("Mistral") && data.messages[0].content.includes("juego de trivia")) {
        throw error503;
      }
      return axios.post.getMockImplementation()(url, data, {});
    });

    const response = await request(app).post("/ai-answer").send({ ...testAiAnswerPayload, difficulty: "medium" });

    expect(response.statusCode).toBe(500);
    expect(response.body.error).toBe("Error al procesar la respuesta de la IA.");
    expect(response.body.details).toBe("Internal Server Error"); // Original error
    expect(response.body.message).toBe("¡Vaya! Me he equivocado.");
    expect(axios.post).toHaveBeenCalledTimes(2); // Only the two failed attempts
    const statusRes = await request(app).get("/");
    expect(statusRes.body.message).toContain("Current Model: mistral"); // State should have switched
  });


  it("POST /ai-answer should handle non-5xx LLM API error during answer generation and return 500 (no fallback)", async () => {
    axios.post.mockImplementationOnce(async (url, data) => {
      if (url.startsWith("https://empathyai") && data.model.includes("Qwen") && data.messages[0].content.includes("juego de trivia")) {
        const error = new Error("Bad Request");
        error.response = { status: 400, data: "Bad Data" };
        throw error;
      }
      return axios.post.getMockImplementation()(url, data, {});
    });

    const response = await request(app).post("/ai-answer").send(testAiAnswerPayload);

    expect(response.statusCode).toBe(500);
    expect(response.body.error).toBe("Error al procesar la respuesta de la IA.");
    expect(response.body.details).toBe("Bad Request");
    expect(response.body.message).toBe("¡Vaya! Me he equivocado.");
    expect(axios.post).toHaveBeenCalledTimes(1);
  });

  it("POST /ai-answer should handle LLM API error during message generation and return 200 with default message", async () => {
    axios.post.mockImplementationOnce(async (url, data) => {
      if (url.startsWith("https://empathyai") && data.model.includes("Qwen") && data.messages[0].content.includes("juego de trivia")) {
        return Promise.resolve({ status: 200, data: { choices: [{ message: { content: JSON.stringify({ selectedAnswer: "París", isCorrect: true }) } }] } });
      }
      return axios.post.getMockImplementation()(url, data, {});
    });
    axios.post.mockImplementationOnce(async (url, data) => {
      if (url.startsWith("https://empathyai") && data.model.includes("Qwen") && data.messages[0].content.includes("Genera una frase corta")) {
        throw new Error("LLM message generation failed");
      }
      return axios.post.getMockImplementation()(url, data, {});
    });

    const response = await request(app).post("/ai-answer").send(testAiAnswerPayload);

    expect(response.statusCode).toBe(200);
    expect(response.body.selectedAnswer).toBe("París");
    expect(response.body.isCorrect).toBe(true);
    expect(response.body.message).toBe("¡Excelente! He acertado esta.");
    expect(axios.post).toHaveBeenCalledTimes(2);
  });

  it("POST /ai-answer should use simulation path if NODE_ENV=test and random check passes", async () => {
    const originalNodeEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'test';
    const originalMathRandom = Math.random;
    Math.random = jest.fn()
        .mockReturnValueOnce(0.99) // Trigger simulation
        .mockReturnValueOnce(0.8); // Force incorrect simulation result

    const response = await request(app).post("/ai-answer").send({ ...testAiAnswerPayload, difficulty: "easy" });

    expect(response.statusCode).toBe(200);
    expect(response.body.isCorrect).toBe(false);
    expect(response.body.selectedAnswer).toBe("Londres");
    // *** CORRECTED EXPECTATION based on refined mock ***
    expect(response.body.message).toBe("mock-message-incorrect");
    expect(axios.post).toHaveBeenCalledTimes(1); // Only message generation called
    expect(axios.post).toHaveBeenCalledWith(expect.stringContaining("empathyai.prod.empathy.co"), expect.objectContaining({ model: expect.stringContaining("Qwen") }), expect.any(Object));
    Math.random = originalMathRandom;
    process.env.NODE_ENV = originalNodeEnv;
  });


  // --- Validation Tests for /ai-answer ---
  it("POST /ai-answer should return 400 error for missing 'question'", async () => {
    const { question, ...payload } = testAiAnswerPayload;
    const response = await request(app).post("/ai-answer").send(payload);
    expect(response.statusCode).toBe(400);
    expect(response.body.error).toBe("Campo 'question' inválido o incompleto.");
    expect(response.body.details).toBe("Campo 'question' inválido o incompleto.");
  });

  it("POST /ai-answer should return 400 error for missing 'question.pregunta[idioma]'", async () => {
    const payload = JSON.parse(JSON.stringify(testAiAnswerPayload));
    delete payload.question.pregunta.es;
    const response = await request(app).post("/ai-answer").send(payload);
    expect(response.statusCode).toBe(400);
    expect(response.body.error).toBe("Falta la pregunta en el idioma especificado: es");
    expect(response.body.details).toBe("Falta la pregunta en el idioma especificado: es");
  });

  it("POST /ai-answer should return 400 error for missing 'question.respuestaCorrecta[idioma]'", async () => {
    const payload = JSON.parse(JSON.stringify(testAiAnswerPayload));
    delete payload.question.respuestaCorrecta.es;
    const response = await request(app).post("/ai-answer").send(payload);
    expect(response.statusCode).toBe(400);
    expect(response.body.error).toBe("Falta la respuesta correcta en el idioma especificado: es");
    expect(response.body.details).toBe("Falta la respuesta correcta en el idioma especificado: es");
  });


  it("POST /ai-answer should return 400 error for missing 'options'", async () => {
    const { options, ...payload } = testAiAnswerPayload;
    const response = await request(app).post("/ai-answer").send(payload);
    expect(response.statusCode).toBe(400);
    expect(response.body.error).toBe("Campo 'options' inválido o faltante.");
    expect(response.body.details).toBe("Campo 'options' inválido o faltante.");
  });

  it("POST /ai-answer should return 400 error for missing 'idioma'", async () => {
    const { idioma, ...payload } = testAiAnswerPayload;
    const response = await request(app).post("/ai-answer").send(payload);
    expect(response.statusCode).toBe(400);
    expect(response.body.error).toBe("Campo 'idioma' faltante.");
    expect(response.body.details).toBe("Campo 'idioma' faltante.");
  });


  // --- /ai-message Endpoint Tests ---

  it("POST /ai-message should generate message for correct result (primary model)", async () => {
    const response = await request(app).post("/ai-message").send({ ...testAiMessagePayload, result: "correct" });
    expect(response.statusCode).toBe(200);
    expect(response.body.message).toBe("mock-message-correct");
    expect(axios.post).toHaveBeenCalledTimes(1);
    expect(axios.post).toHaveBeenCalledWith(expect.stringContaining("empathyai.prod.empathy.co"), expect.objectContaining({ model: expect.stringContaining("Qwen") }), expect.any(Object));
  });

  it("POST /ai-message should generate message for incorrect result (primary model)", async () => {
    const response = await request(app).post("/ai-message").send({ ...testAiMessagePayload, result: "incorrect" });
    expect(response.statusCode).toBe(200);
    // *** CORRECTED EXPECTATION based on refined mock ***
    expect(response.body.message).toBe("mock-message-incorrect");
    expect(axios.post).toHaveBeenCalledTimes(1);
    expect(axios.post).toHaveBeenCalledWith(expect.stringContaining("empathyai.prod.empathy.co"), expect.objectContaining({ model: expect.stringContaining("Qwen") }), expect.any(Object));
  });

  it("POST /ai-message should use backup model if primary fails (5xx)", async () => {
    axios.post.mockImplementationOnce(async (url, data) => {
      if (url.startsWith("https://empathyai") && data.model.includes("Qwen") && data.messages[0].content.includes("Genera una frase corta")) {
        const error = new Error("Internal Server Error");
        error.response = { status: 500, data: "Server Error" };
        throw error;
      }
      return axios.post.getMockImplementation()(url, data, {});
    });

    const response = await request(app).post("/ai-message").send({ ...testAiMessagePayload, result: "correct" });
    expect(response.statusCode).toBe(200);
    expect(response.body.message).toBe("mock-message-correct-mistral"); // Backup message
    expect(axios.post).toHaveBeenCalledTimes(2);
    const statusRes = await request(app).get("/");
    expect(statusRes.body.message).toContain("Current Model: mistral");
  });


  it("POST /ai-message should use default message if LLM returns empty", async () => {
    axios.post.mockImplementationOnce(async (url, data) => {
      if (url.startsWith("https://empathyai") && data.model.includes("Qwen") && data.messages[0].content.includes("Genera una frase corta")) {
        return Promise.resolve({ status: 200, data: { choices: [{ message: { content: "  " } }] } });
      }
      return axios.post.getMockImplementation()(url, data, {});
    });

    const payload = { ...testAiMessagePayload, result: "correct", idioma: "en" };
    const response = await request(app).post("/ai-message").send(payload);
    expect(response.statusCode).toBe(200);
    expect(response.body.message).toBe("Excellent! I got this one right.");
    expect(axios.post).toHaveBeenCalledTimes(1);
  });


  it("POST /ai-message should return 500 with default message if both models fail", async () => {
    const error500 = new Error("Internal Server Error");
    error500.response = { status: 500, data: "Server Error" };
    const error503 = new Error("Service Unavailable");
    error503.response = { status: 503, data: "Backup Unavailable" };

    axios.post.mockImplementationOnce(async (url, data) => {
      if (url.startsWith("https://empathyai") && data.model.includes("Qwen")) { throw error500; }
      return axios.post.getMockImplementation()(url, data, {});
    });
    axios.post.mockImplementationOnce(async (url, data) => {
      if (url.startsWith("https://empathyai") && data.model.includes("Mistral")) { throw error503; }
      return axios.post.getMockImplementation()(url, data, {});
    });

    const payload = { ...testAiMessagePayload, result: "incorrect", idioma: "es" };
    const response = await request(app).post("/ai-message").send(payload);

    expect(response.statusCode).toBe(500);
    expect(response.body.error).toBe("Error interno al generar el mensaje de la IA.");
    expect(response.body.details).toBe("Internal Server Error");
    expect(response.body.message).toBe("¡Vaya! Me he equivocado.");
    expect(axios.post).toHaveBeenCalledTimes(2);
  });

  it("POST /ai-message should return 500 with default message on non-5xx error (no fallback)", async () => {
    const errorMessage = "LLM message generation failed 400";
    axios.post.mockImplementationOnce(async (url, data) => {
      if (url.startsWith("https://empathyai") && data.model.includes("Qwen")) {
        const error = new Error(errorMessage);
        error.response = { status: 400 };
        throw error;
      }
      return axios.post.getMockImplementation()(url, data, {});
    });

    const payload = { ...testAiMessagePayload, result: "correct", idioma: "es" };
    const response = await request(app).post("/ai-message").send(payload);
    expect(response.statusCode).toBe(500);
    expect(response.body.error).toBe("Error interno al generar el mensaje de la IA.");
    expect(response.body.details).toBe(errorMessage);
    expect(response.body.message).toBe("¡Excelente! He acertado esta.");
    expect(axios.post).toHaveBeenCalledTimes(1);
  });


  // --- Validation tests for /ai-message ---
  it("POST /ai-message should return 400 error for missing 'result'", async () => {
    const { result, ...payload } = testAiMessagePayload;
    const response = await request(app).post("/ai-message").send(payload);
    expect(response.statusCode).toBe(400);
    expect(response.body.error).toBe("Campo 'result' inválido. Debe ser 'correct' o 'incorrect'.");
    expect(response.body.details).toBe("Campo 'result' inválido. Debe ser 'correct' o 'incorrect'.");
  });

  it("POST /ai-message should return 400 error for invalid 'result'", async () => {
    const payload = { ...testAiMessagePayload, result: "maybe" };
    const response = await request(app).post("/ai-message").send(payload);
    expect(response.statusCode).toBe(400);
    expect(response.body.error).toBe("Campo 'result' inválido. Debe ser 'correct' o 'incorrect'.");
    expect(response.body.details).toBe("Campo 'result' inválido. Debe ser 'correct' o 'incorrect'.");
  });


  it("POST /ai-message should return 400 error for missing 'question'", async () => {
    const { question, ...payload } = testAiMessagePayload;
    const response = await request(app).post("/ai-message").send(payload);
    expect(response.statusCode).toBe(400);
    expect(response.body.error).toBe("Campo 'question' inválido o faltante.");
    expect(response.body.details).toBe("Campo 'question' inválido o faltante.");
  });

  it("POST /ai-message should return 400 error for missing 'idioma'", async () => {
    const { idioma, ...payload } = testAiMessagePayload;
    const response = await request(app).post("/ai-message").send(payload);
    expect(response.statusCode).toBe(400);
    expect(response.body.error).toBe("Campo 'idioma' faltante.");
    expect(response.body.details).toBe("Campo 'idioma' faltante.");
  });


  // --- Helper Function Tests (via Endpoints Error Path) ---

  it("getDefaultMessage (in catch block) should return correct Spanish message on error", async () => {
    axios.post.mockImplementationOnce(async () => { throw new Error("Fail"); });
    const payload = { ...testAiMessagePayload, result: "incorrect", idioma: "es" };
    const response = await request(app).post("/ai-message").send(payload);
    expect(response.statusCode).toBe(500);
    expect(response.body.message).toBe("¡Vaya! Me he equivocado.");
  });

  it("getDefaultMessage (in catch block) should return correct English message on error", async () => {
    axios.post.mockImplementationOnce(async () => { throw new Error("Fail"); });
    const payload = { ...testAiMessagePayload, result: "incorrect", idioma: "en" };
    const response = await request(app).post("/ai-message").send(payload);
    expect(response.statusCode).toBe(500);
    expect(response.body.message).toBe("Oops! I got that wrong.");
  });

  it("getDefaultMessage (in catch block) should return fallback message for unknown language on error", async () => {
    axios.post.mockImplementationOnce(async () => { throw new Error("Fail"); });
    const payload = { ...testAiMessagePayload, result: "correct", idioma: "fr" };
    const response = await request(app).post("/ai-message").send(payload);
    expect(response.statusCode).toBe(500);
    expect(response.body.message).toBe("¡Correcto!");
  });


  // --- Server Start/Stop Tests ---

  it("startServer should return existing server if called again", () => {
    const secondServerInstance = startServer(8091);
    expect(secondServerInstance).toBe(server);
    expect(console.warn).toHaveBeenCalledWith("Server already running.");
  });

  it("closeServer should resolve if called when no server is running", async () => {
    await closeServer();
    await expect(closeServer()).resolves.toBeUndefined();
    expect(console.log).toHaveBeenCalledWith("Server not running or already closed.");
    server = startServer(8090);
    await new Promise(resolve => setTimeout(resolve, 50));
  });

  // --- Middleware Test ---
  it("should log request info using logging middleware", async () => {
    await request(app).get("/");
    expect(console.log).toHaveBeenCalledWith(expect.stringContaining("GET /"));
    expect(console.log).toHaveBeenCalledWith(expect.stringMatching(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z - GET \/$/));
  });

});
