const request = require("supertest");
const axios = require("axios");
// Import app, startServer, closeServer from the service file
// Import resetModelState if exported and needed for direct state reset
const { app, startServer, closeServer, resetModelState } = require("./llm-service");

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

describe("LLM Service", () => {
  // Store original console functions to restore them later
  const originalConsoleError = console.error;
  const originalConsoleLog = console.log;
  const originalConsoleWarn = console.warn;


  // Common test data
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

  // Mock responses from external services before each test
  beforeEach(() => {
    // Restore original console functions and suppress logs/errors/warnings
    console.error = jest.fn();
    console.log = jest.fn();
    console.warn = jest.fn();

    // *** MODIFICACIÓN: Reset model state before each test ***
    if (resetModelState) {
      resetModelState(); // Call reset function if exported
    } else {
      // Fallback if not exported (less ideal) - assumes initial state
      console.warn("resetModelState function not exported from service, assuming initial state.");
    }


    // Reset mocks for axios before each test
    axios.post.mockReset();
    axios.get.mockReset();

    // Default mock implementation for axios.post (primarily for /ask)
    axios.post.mockImplementation(async (url, data) => {
      if (url.startsWith("https://generativelanguage")) {
        return Promise.resolve({
          status: 200,
          data: { candidates: [{ content: { parts: [{ text: "gemini-hint-answer" }] } }] },
        });
      } else if (url.startsWith("https://empathyai")) {
        if (data && data.messages && data.messages[0].content.includes("pistas")) {
          const modelUsed = data.model || 'empathy';
          const answer = modelUsed.includes('mistral') ? "mistral-hint-answer" : "empathy-hint-answer";
          return Promise.resolve({ status: 200, data: { choices: [{ message: { content: answer } }] } });
        }
        // Fallback for other calls if not overridden by specific tests
        return Promise.resolve({ status: 200, data: { choices: [{ message: { content: "default-empathy-mock-response" } }] } });
      }
      // Throw error for unhandled mock requests
      throw new Error(`Unhandled mock request to ${url}`);
    });

    // Mock axios.get for status check
    axios.get.mockResolvedValue({ status: 200, data: { status: "OK" } });
  });

  // --- Basic Endpoint Tests ---

  it("GET / should return status OK", async () => {
    const response = await request(app).get("/");
    expect(response.statusCode).toBe(200);
    expect(response.body.status).toBe("OK");
    expect(response.body.message).toBe("LLM Service running");
  });

  // --- /ask Endpoint Tests ---

  it("POST /ask should process request with empathy model", async () => {
    const response = await request(app)
        .post("/ask")
        .send({ ...testAskQuestionPayload, model: "empathy" });
    expect(response.statusCode).toBe(200);
    expect(response.body.answer).toBe("empathy-hint-answer");
    expect(axios.post).toHaveBeenCalledWith(expect.stringContaining("empathyai"), expect.objectContaining({ model: expect.stringContaining("Qwen") }), expect.any(Object));
  });

  it("POST /ask should process request with gemini model", async () => {
    const response = await request(app)
        .post("/ask")
        .send({ ...testAskQuestionPayload, model: "gemini" });
    expect(response.statusCode).toBe(200);
    expect(response.body.answer).toBe("gemini-hint-answer");
    expect(axios.post).toHaveBeenCalledWith(expect.stringContaining("generativelanguage"), expect.any(Object), expect.any(Object));
  });

  it("POST /ask should process request with mistral model", async () => {
    const response = await request(app)
        .post("/ask")
        .send({ ...testAskQuestionPayload, model: "mistral" });
    expect(response.statusCode).toBe(200);
    expect(response.body.answer).toBe("mistral-hint-answer");
    expect(axios.post).toHaveBeenCalledWith(expect.stringContaining("empathyai"), expect.objectContaining({ model: "mistralai/Mistral-7B-Instruct-v0.3" }), expect.any(Object));
  });

  it("POST /ask should handle empty LLM responses (gemini)", async () => {
    // Mock to return empty string (which sendQuestionToLLM converts to null)
    axios.post.mockImplementationOnce(async (url) => {
      if (url.startsWith("https://generativelanguage")) {
        return Promise.resolve({ status: 200, data: { candidates: [{ content: { parts: [{ text: " " }] } }] } });
      }
      throw new Error("Unexpected call in empty gemini test");
    });
    const response = await request(app)
        .post("/ask")
        .send({ ...testAskQuestionPayload, model: "gemini" });
    expect(response.statusCode).toBe(200);
    // Expect the specific string set by the /ask endpoint when answer is null
    expect(response.body.answer).toBe("No se recibió respuesta del LLM");
  });

  it("POST /ask should handle empty LLM responses (empathy/mistral)", async () => {
    // Mock to return empty string (which sendQuestionToLLM converts to null)
    axios.post.mockImplementationOnce(async (url) => {
      if (url.startsWith("https://empathyai")) {
        return Promise.resolve({ status: 200, data: { choices: [{ message: { content: "" } }] } });
      }
      throw new Error("Unexpected call in empty empathy test");
    });
    const response = await request(app)
        .post("/ask")
        .send({ ...testAskQuestionPayload, model: "empathy" });
    expect(response.statusCode).toBe(200);
    // Expect the specific string set by the /ask endpoint when answer is null
    expect(response.body.answer).toBe("No se recibió respuesta del LLM");
  });


  it("POST /ask should return 400 error for unsupported model", async () => {
    const response = await request(app)
        .post("/ask")
        .send({ ...testAskQuestionPayload, model: "unsupported-model" });
    expect(response.statusCode).toBe(400);
    expect(response.body.error).toBe('Modelo "unsupported-model" no soportado.');
  });

  it("POST /ask should handle LLM API errors (e.g., 403 Forbidden) and return 500", async () => {
    const apiError = new Error("Request failed with status code 403");
    apiError.response = { status: 403, data: { error: "Forbidden" } };
    axios.post.mockImplementationOnce(async () => { throw apiError; });

    const response = await request(app)
        .post("/ask")
        .send({ ...testAskQuestionPayload, model: "empathy" });
    expect(response.statusCode).toBe(500);
    expect(response.body.error).toContain("Error interno al procesar la solicitud de pista.");
    expect(response.body.details).toBe("Request failed with status code 403");
  });

  it("POST /ask should handle generic network errors and return 500", async () => {
    axios.post.mockImplementationOnce(async () => { throw new Error("Network error"); });

    const response = await request(app)
        .post("/ask")
        .send({ ...testAskQuestionPayload, model: "empathy" });
    expect(response.statusCode).toBe(500);
    expect(response.body.error).toContain("Error interno al procesar la solicitud de pista.");
    expect(response.body.details).toBe("Network error");
  });

  it("POST /ask should return 500 error if LLM_API_KEY is missing", async () => {
    const originalApiKey = process.env.LLM_API_KEY;
    delete process.env.LLM_API_KEY;
    const response = await request(app)
        .post("/ask")
        .send(testAskQuestionPayload);
    expect(response.statusCode).toBe(500);
    expect(response.body.error).toContain("Configuración del servidor incompleta");
    process.env.LLM_API_KEY = originalApiKey;
  });

  it("POST /ask should return 400 error for missing 'userQuestion'", async () => {
    const { userQuestion, ...payload } = testAskQuestionPayload;
    const response = await request(app).post("/ask").send(payload);
    expect(response.statusCode).toBe(400);
    expect(response.body.error).toContain("Campo requerido faltante: userQuestion");
  });

  it("POST /ask should return 400 error for missing 'question'", async () => {
    const { question, ...payload } = testAskQuestionPayload;
    const response = await request(app).post("/ask").send(payload);
    expect(response.statusCode).toBe(400);
    expect(response.body.error).toContain("Campo requerido faltante: question");
  });

  it("POST /ask should return 400 error for missing 'idioma'", async () => {
    const { idioma, ...payload } = testAskQuestionPayload;
    const response = await request(app).post("/ask").send(payload);
    expect(response.statusCode).toBe(400);
    expect(response.body.error).toContain("Campo requerido faltante: idioma");
  });

  it("POST /ask should return 400 error if question text is missing for specified idioma", async () => {
    const payload = JSON.parse(JSON.stringify(testAskQuestionPayload));
    delete payload.question.pregunta.es; // Remove spanish question text
    const response = await request(app).post("/ask").send(payload);
    expect(response.statusCode).toBe(400);
    expect(response.body.error).toContain("Falta la pregunta en el idioma especificado: es");
  });


  it("POST /ask should return 400 error for invalid 'question' structure (missing pregunta obj)", async () => {
    const invalidPayload = { ...testAskQuestionPayload, question: { respuestaCorrecta: "Test", descripcion: [] } };
    const response = await request(app).post("/ask").send(invalidPayload);
    expect(response.statusCode).toBe(400);
    expect(response.body.error).toContain("Estructura de question inválida");
  });

  it("POST /ask should return 400 error for invalid 'question' structure (missing respuestaCorrecta)", async () => {
    const invalidPayload = { ...testAskQuestionPayload, question: { pregunta: {es:"test"}, descripcion: [] } };
    const response = await request(app).post("/ask").send(invalidPayload);
    expect(response.statusCode).toBe(400);
    expect(response.body.error).toContain("Estructura de question inválida");
  });

  it("POST /ask should return 400 error for invalid 'question' structure (missing descripcion)", async () => {
    const invalidPayload = { ...testAskQuestionPayload, question: { pregunta: {es:"test"}, respuestaCorrecta: "Test" } };
    const response = await request(app).post("/ask").send(invalidPayload);
    expect(response.statusCode).toBe(400);
    expect(response.body.error).toContain("Estructura de question inválida");
  });


  it("POST /ask should use backup model on 5xx error and succeed", async () => {
    axios.post
        .mockImplementationOnce(async () => { // Empathy fails
          const error = new Error("Internal Server Error");
          error.response = { status: 500, data: "Server Error" };
          throw error;
        })
        .mockImplementationOnce(async (url, data) => { // Mistral (backup) succeeds
          if (url.startsWith("https://empathyai") && data.model === "mistralai/Mistral-7B-Instruct-v0.3") {
            return Promise.resolve({ status: 200, data: { choices: [{ message: { content: "mistral-backup-answer" } }] } });
          }
          throw new Error("Unexpected call in backup success test");
        });
    const response = await request(app).post("/ask").send({ ...testAskQuestionPayload, model: "empathy" });
    expect(response.statusCode).toBe(200);
    expect(response.body.answer).toBe("mistral-backup-answer");
    // Should be called twice now
    expect(axios.post).toHaveBeenCalledTimes(2);
  });

  it("POST /ask should return 500 if backup model also fails on 5xx error", async () => {
    const error500 = new Error("Internal Server Error");
    error500.response = { status: 500, data: "Server Error" };
    const error503 = new Error("Service Unavailable");
    error503.response = { status: 503, data: "Backup Unavailable" };

    axios.post
        .mockImplementationOnce(async () => { throw error500; }) // First attempt (empathy) fails
        .mockImplementationOnce(async () => { throw error503; }); // Backup attempt (mistral) also fails

    const response = await request(app).post("/ask").send({ ...testAskQuestionPayload, model: "empathy" });

    expect(response.statusCode).toBe(500); // Expect 500 because original error was 5xx
    expect(response.body.error).toContain("Error interno al procesar la solicitud de pista.");
    // It should contain the details of the *original* error
    expect(response.body.details).toBe("Internal Server Error");
    // *** CORRECTION: Expect 2 calls now ***
    expect(axios.post).toHaveBeenCalledTimes(2);
  });


  // --- /ai-answer Endpoint Tests ---

  it("POST /ai-answer should return AI answer (mocked correct)", async () => {
    axios.post
        .mockResolvedValueOnce({ status: 200, data: { choices: [{ message: { content: JSON.stringify({ selectedAnswer: "París", isCorrect: true }) } }] } })
        .mockResolvedValueOnce({ status: 200, data: { choices: [{ message: { content: "¡Genial!" } }] } });
    const response = await request(app).post("/ai-answer").send(testAiAnswerPayload);
    expect(response.statusCode).toBe(200);
    expect(response.body.selectedAnswer).toBe("París");
    expect(response.body.isCorrect).toBe(true);
    expect(response.body.message).toBe("¡Genial!");
    expect(axios.post).toHaveBeenCalledTimes(2);
  });

  it("POST /ai-answer should return AI answer (mocked incorrect)", async () => {
    axios.post
        .mockResolvedValueOnce({ status: 200, data: { choices: [{ message: { content: JSON.stringify({ selectedAnswer: "Londres", isCorrect: false }) } }] } })
        .mockResolvedValueOnce({ status: 200, data: { choices: [{ message: { content: "¡Oh no!" } }] } });
    const response = await request(app).post("/ai-answer").send(testAiAnswerPayload);
    expect(response.statusCode).toBe(200);
    expect(response.body.selectedAnswer).toBe("Londres");
    expect(response.body.isCorrect).toBe(false);
    expect(response.body.message).toBe("¡Oh no!");
    expect(axios.post).toHaveBeenCalledTimes(2);
  });

  it("POST /ai-answer should handle LLM response parsing error and use simulation fallback", async () => {
    axios.post
        .mockResolvedValueOnce({ status: 200, data: { choices: [{ message: { content: "this is not json" } }] } }) // Fail parsing
        .mockResolvedValueOnce({ status: 200, data: { choices: [{ message: { content: "¡Genial simulado!" } }] } }); // Message gen OK
    const mockMath = Object.create(global.Math);
    mockMath.random = () => 0.1; // Correct simulation
    global.Math = mockMath;
    const response = await request(app).post("/ai-answer").send({ ...testAiAnswerPayload, difficulty: "medium" });
    expect(response.statusCode).toBe(200);
    expect(response.body.isCorrect).toBe(true);
    expect(response.body.selectedAnswer).toBe("París");
    expect(response.body.message).toBe("¡Genial simulado!");
    expect(axios.post).toHaveBeenCalledTimes(2); // LLM answer + Message Gen
    global.Math = Object.create(Object.getPrototypeOf(mockMath));
  });

  it("POST /ai-answer should handle LLM response non-JSON direct match", async () => {
    axios.post
        .mockResolvedValueOnce({ status: 200, data: { choices: [{ message: { content: "París" } }] } }) // Direct answer
        .mockResolvedValueOnce({ status: 200, data: { choices: [{ message: { content: "¡Mensaje para respuesta directa!" } }] } }); // Message gen OK
    const response = await request(app).post("/ai-answer").send({ ...testAiAnswerPayload, difficulty: "medium" });
    expect(response.statusCode).toBe(200);
    expect(response.body.isCorrect).toBe(true);
    expect(response.body.selectedAnswer).toBe("París");
    expect(response.body.message).toBe("¡Mensaje para respuesta directa!");
    expect(axios.post).toHaveBeenCalledTimes(2); // LLM answer + Message Gen
  });

  it("POST /ai-answer should handle empty LLM response for answer and use simulation fallback", async () => {
    axios.post
        .mockResolvedValueOnce({ status: 200, data: { choices: [{ message: { content: " " } }] } }) // Empty answer -> null
        .mockResolvedValueOnce({ status: 200, data: { choices: [{ message: { content: "¡Simulado por vacío!" } }] } }); // Message gen OK
    const mockMath = Object.create(global.Math);
    mockMath.random = () => 0.1; // Correct simulation
    global.Math = mockMath;
    const response = await request(app).post("/ai-answer").send({ ...testAiAnswerPayload, difficulty: "medium" });
    expect(response.statusCode).toBe(200);
    expect(response.body.isCorrect).toBe(true);
    expect(response.body.selectedAnswer).toBe("París");
    expect(response.body.message).toBe("¡Simulado por vacío!");
    // Only 1 call expected: the first one returned null, triggering fallback *before* message generation call
    // Correction: Fallback *does* call generateAIMessage, so 2 calls expected.
    expect(axios.post).toHaveBeenCalledTimes(2); // LLM answer (null) + Message Gen in fallback
    global.Math = Object.create(Object.getPrototypeOf(mockMath));
  });


  it("POST /ai-answer should return 400 error for missing 'question'", async () => {
    const { question, ...payload } = testAiAnswerPayload;
    const response = await request(app).post("/ai-answer").send(payload);
    expect(response.statusCode).toBe(400);
    expect(response.body.error).toContain("Campo 'question' inválido o incompleto.");
  });

  it("POST /ai-answer should return 400 error for missing 'question.pregunta[idioma]'", async () => {
    const payload = JSON.parse(JSON.stringify(testAiAnswerPayload));
    delete payload.question.pregunta.es;
    const response = await request(app).post("/ai-answer").send(payload);
    expect(response.statusCode).toBe(400);
    expect(response.body.error).toContain("Falta la pregunta en el idioma especificado: es");
  });

  it("POST /ai-answer should return 400 error for missing 'question.respuestaCorrecta[idioma]'", async () => {
    const payload = JSON.parse(JSON.stringify(testAiAnswerPayload));
    delete payload.question.respuestaCorrecta.es;
    const response = await request(app).post("/ai-answer").send(payload);
    expect(response.statusCode).toBe(400);
    expect(response.body.error).toContain("Falta la respuesta correcta en el idioma especificado: es");
  });


  it("POST /ai-answer should return 400 error for missing 'options'", async () => {
    const { options, ...payload } = testAiAnswerPayload;
    const response = await request(app).post("/ai-answer").send(payload);
    expect(response.statusCode).toBe(400);
    expect(response.body.error).toContain("Campo 'options' inválido o faltante.");
  });

  it("POST /ai-answer should return 400 error for missing 'idioma'", async () => {
    const { idioma, ...payload } = testAiAnswerPayload; // Remove idioma
    const response = await request(app).post("/ai-answer").send(payload);
    expect(response.statusCode).toBe(400);
    expect(response.body.error).toContain("Campo 'idioma' faltante.");
  });

  it("POST /ai-answer should handle LLM API error during answer generation and return 500", async () => {
    axios.post.mockImplementationOnce(async () => { throw new Error("LLM answer generation failed"); });
    const response = await request(app).post("/ai-answer").send(testAiAnswerPayload);
    expect(response.statusCode).toBe(500);
    expect(response.body.error).toContain("Error interno al procesar la respuesta de la IA.");
    expect(response.body.details).toBe("LLM answer generation failed");
    expect(response.body.message).toBe("¡Vaya! Me he equivocado."); // Default message included
    expect(axios.post).toHaveBeenCalledTimes(1);
  });

  it("POST /ai-answer should handle LLM API error during message generation and return 200 with default message", async () => {
    axios.post
        .mockResolvedValueOnce({ status: 200, data: { choices: [{ message: { content: JSON.stringify({ selectedAnswer: "París", isCorrect: true }) } }] } }) // Answer OK
        .mockImplementationOnce(async () => { throw new Error("LLM message generation failed"); }); // Message fails
    const response = await request(app).post("/ai-answer").send(testAiAnswerPayload);
    expect(response.statusCode).toBe(200); // Expect 200 because answer was retrieved
    expect(response.body.selectedAnswer).toBe("París");
    expect(response.body.isCorrect).toBe(true);
    expect(response.body.message).toBe("¡Excelente! He acertado esta."); // Default message used
    expect(axios.post).toHaveBeenCalledTimes(2);
  });

  it("POST /ai-answer should use simulation path if useSimulation flag is true (mocked)", async () => {
    const originalNodeEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'test';
    const mockMath = Object.create(global.Math);
    mockMath.random = jest.fn().mockReturnValueOnce(0.99).mockReturnValueOnce(0.9); // Force simulation, incorrect
    global.Math = mockMath;
    axios.post.mockResolvedValueOnce({ status: 200, data: { choices: [{ message: { content: "Simulated incorrect message" } }] } }); // Mock message gen
    const response = await request(app).post("/ai-answer").send({ ...testAiAnswerPayload, difficulty: "easy" });
    expect(response.statusCode).toBe(200);
    expect(response.body.isCorrect).toBe(false);
    expect(response.body.message).toBe("Simulated incorrect message");
    expect(axios.post).toHaveBeenCalledTimes(1);
    global.Math = Object.create(Object.getPrototypeOf(mockMath));
    process.env.NODE_ENV = originalNodeEnv;
  });


  // --- /ai-message Endpoint Tests ---

  it("POST /ai-message should generate message for correct result", async () => {
    axios.post.mockResolvedValueOnce({ status: 200, data: { choices: [{ message: { content: "¡Correcto!" } }] } });
    const response = await request(app).post("/ai-message").send({ ...testAiMessagePayload, result: "correct" });
    expect(response.statusCode).toBe(200);
    expect(response.body.message).toBe("¡Correcto!");
    expect(axios.post).toHaveBeenCalledTimes(1);
  });

  it("POST /ai-message should generate message for incorrect result", async () => {
    axios.post.mockResolvedValueOnce({ status: 200, data: { choices: [{ message: { content: "¡Incorrecto!" } }] } });
    const response = await request(app).post("/ai-message").send({ ...testAiMessagePayload, result: "incorrect" });
    expect(response.statusCode).toBe(200);
    expect(response.body.message).toBe("¡Incorrecto!");
    expect(axios.post).toHaveBeenCalledTimes(1);
  });

  it("POST /ai-message should use default message if LLM returns empty", async () => {
    // Mock sendQuestionToLLM to return null (as if LLM returned empty)
    axios.post.mockResolvedValueOnce({ status: 200, data: { choices: [{ message: { content: "  " } }] } });
    const payload = { ...testAiMessagePayload, result: "correct", idioma: "en" };
    const response = await request(app).post("/ai-message").send(payload);
    expect(response.statusCode).toBe(200);
    // *** CORRECTION: Expect default message because generateAIMessage returns null ***
    expect(response.body.message).toBe("Excellent! I got this one right."); // Default for correct=en
    expect(axios.post).toHaveBeenCalledTimes(1);
  });


  it("POST /ai-message should return 400 error for missing 'result'", async () => {
    const { result, ...payload } = testAiMessagePayload;
    const response = await request(app).post("/ai-message").send(payload);
    expect(response.statusCode).toBe(400);
    expect(response.body.error).toContain("Campo 'result' inválido");
  });

  it("POST /ai-message should return 400 error for invalid 'result'", async () => {
    const payload = { ...testAiMessagePayload, result: "maybe" };
    const response = await request(app).post("/ai-message").send(payload);
    expect(response.statusCode).toBe(400);
    expect(response.body.error).toContain("Campo 'result' inválido");
  });


  it("POST /ai-message should return 400 error for missing 'question'", async () => {
    const { question, ...payload } = testAiMessagePayload;
    const response = await request(app).post("/ai-message").send(payload);
    expect(response.statusCode).toBe(400);
    expect(response.body.error).toContain("Campo 'question' inválido o faltante.");
  });

  it("POST /ai-message should return 400 error for missing 'idioma'", async () => {
    const { idioma, ...payload } = testAiMessagePayload; // Remove idioma
    const response = await request(app).post("/ai-message").send(payload);
    expect(response.statusCode).toBe(400);
    expect(response.body.error).toContain("Campo 'idioma' faltante.");
  });


  // --- Tests for /ai-message Error Handling ---

  it("POST /ai-message should handle LLM error and return 500 with default message (incorrect case)", async () => {
    const errorMessage = "LLM message generation failed";
    axios.post.mockImplementationOnce(async () => { throw new Error(errorMessage); });
    const payload = { ...testAiMessagePayload, result: "incorrect", idioma: "es" };
    const response = await request(app).post("/ai-message").send(payload);
    expect(response.statusCode).toBe(500);
    expect(response.body.error).toContain("Error interno al generar el mensaje de la IA.");
    expect(response.body.details).toBe(errorMessage);
    expect(response.body.message).toBe("¡Vaya! Me he equivocado.");
    expect(axios.post).toHaveBeenCalledTimes(1);
  });

  it("POST /ai-message should return 500 with default message on error (correct case)", async () => {
    const errorMessage = "LLM message generation failed";
    axios.post.mockImplementationOnce(async () => { throw new Error(errorMessage); });
    const payload = { ...testAiMessagePayload, result: "correct", idioma: "es" };
    const response = await request(app).post("/ai-message").send(payload);
    expect(response.statusCode).toBe(500);
    expect(response.body.error).toContain("Error interno al generar el mensaje de la IA.");
    expect(response.body.details).toBe(errorMessage);
    expect(response.body.message).toBe("¡Excelente! He acertado esta.");
    expect(axios.post).toHaveBeenCalledTimes(1);
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

  // Prueba

});

