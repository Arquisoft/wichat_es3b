const request = require("supertest");
const axios = require("axios");
const app = require("./gateway-service");

afterAll(async () => {
  app.close();
});

jest.mock("axios");

// Función auxiliar para crear respuestas de error
const mockAxiosError = (statusCode, errorData, errorType = "response") => {
  // errorType puede ser 'response', 'request' o 'generic'
  if (errorType === "response") {
    return {
      response: {
        status: statusCode,
        data: errorData,
      },
    };
  } else if (errorType === "request") {
    return {
      request: {},
      message: errorData.message || "Connection refused",
    };
  } else {
    // Error genérico
    return new Error(errorData.message || "Error inesperado");
  }
};

// Respuestas exitosas comunes para reutilizar
const successResponses = {
  login: { data: { token: "mockedToken" } },
  adduser: { data: { userId: "mockedUserId" } },
  askllm: { data: { answer: "llmanswer" } },
  aiAnswer: { data: { answer: "AI generó esta respuesta" } },
  generateApikey: { data: { apiKey: "mock-api-key-12345" } },
  savestats: { data: { success: true, message: "Estadísticas guardadas" } },
  validateApikey: { data: { valid: true, username: "testuser" } },
  getStats: { data: { games: 10, wins: 7, ratio: 0.7 } },
  getRanking: {
    data: [
      { username: "user1", wins: 10 },
      { username: "user2", wins: 8 },
    ],
  },
  getTop3: {
    data: [
      { username: "user1", wins: 10 },
      { username: "user2", wins: 8 },
      { username: "user3", wins: 5 },
    ],
  },
  getGames: {
    data: {
      totalGames: 20,
      gamesPerMonth: [
        { month: "Enero", games: 5 },
        { month: "Febrero", games: 15 },
      ],
    },
  },
  getRatiosPerMonth: {
    data: [
      { month: "Enero", ratio: 0.8 },
      { month: "Febrero", ratio: 0.6 },
    ],
  },
  getQuestionsGenerated: {
    data: [
      {
        id: 1,
        question: "¿Pregunta generada?",
        answer: "respuesta",
        topic: "ciencia",
      },
    ],
  },
  getQuestionsDB: {
    data: [
      {
        id: 1,
        question: "¿Pregunta de la base de datos?",
        answer: "respuesta",
        topic: "historia",
      },
    ],
  },
};

// Función para probar endpoints GET con parámetros opcionales
const testGetEndpoint = (
  endpoint,
  paramName = null,
  paramValue = null,
  expectedStatus = 200,
  mockResponseKey = null,
  expectedError = null,
  errorType = null
) => {
  const baseUrl = paramName ? `/${endpoint}/${paramValue}` : `/${endpoint}`;

  it(`should forward ${endpoint} request to the service${
    paramName ? ` with ${paramName}` : ""
  }`, async () => {
    if (errorType) {
      // Si hay un errorType, configuramos el mock para rechazar con error
      const errorData = expectedError ? { error: expectedError } : {};
      axios.get.mockRejectedValueOnce(
        mockAxiosError(expectedStatus, errorData, errorType)
      );
    }

    const response = await request(app).get(baseUrl);

    expect(response.statusCode).toBe(expectedStatus);

    if (expectedStatus === 200 && mockResponseKey) {
      // Para respuestas exitosas, verificamos que el cuerpo contenga los datos esperados
      expect(response.body).toEqual(successResponses[mockResponseKey].data);
      expect(axios.get).toHaveBeenCalledWith(expect.stringContaining(baseUrl));
    } else if (expectedError) {
      // Para respuestas de error, verificamos el mensaje de error
      if (errorType === "request") {
        expect(response.body.error).toContain("no está disponible");
      } else if (errorType === "generic") {
        expect(response.body.error).toBe("Error interno del servidor");
      } else {
        expect(response.body.error).toBe(expectedError);
      }
    }
  });
};

// Función para probar endpoints POST
const testPostEndpoint = (
  endpoint,
  payload,
  expectedStatus = 200,
  mockResponseKey = null,
  expectedError = null,
  errorType = null,
  serviceName = null,
  actualServiceEndpoint = null
) => {
  it(`should forward ${endpoint} request to the ${
    serviceName || endpoint
  } service`, async () => {
    if (errorType) {
      // Si hay un errorType, configuramos el mock para rechazar con error
      const errorData = expectedError ? { error: expectedError } : {};
      axios.post.mockRejectedValueOnce(
        mockAxiosError(expectedStatus, errorData, errorType)
      );
    }

    const response = await request(app).post(`/${endpoint}`).send(payload);

    expect(response.statusCode).toBe(expectedStatus);

    if (expectedStatus === 200 && mockResponseKey) {
      // Para respuestas exitosas, verificamos que el cuerpo contenga los datos esperados
      Object.entries(successResponses[mockResponseKey].data).forEach(
        ([key, value]) => {
          expect(response.body[key]).toEqual(value);
        }
      );
      const expectedUrl = actualServiceEndpoint
        ? expect.stringContaining(`/${actualServiceEndpoint}`)
        : expect.stringContaining(`/${endpoint}`);
      expect(axios.post).toHaveBeenCalledWith(expectedUrl, payload);
    } else if (expectedError) {
      // Para respuestas de error, verificamos el mensaje de error
      if (errorType === "request") {
        if (serviceName === "llm") {
          expect(response.body.error).toBe(
            "El servicio LLM no está disponible"
          );
        } else if (serviceName === "stats") {
          expect(response.body.error).toBe(
            "El servidor de estadísticas no está disponible"
          );
        } else {
          expect(response.body.error).toContain("no está disponible");
        }
      } else if (errorType === "generic") {
        expect(response.body.error).toBe("Error interno del servidor");
      } else {
        expect(response.body.error).toBe(expectedError);
      }
    }
  });
};

// Función específica para probar errores de api-key
const testApiKeyErrors = (errorCode, expectedStatus) => {
  it(`should handle ${errorCode} error from user service`, async () => {
    axios.post.mockRejectedValueOnce(
      mockAxiosError(expectedStatus, { errorCode })
    );

    const response = await request(app)
      .post("/generate-apikey")
      .send({
        email: errorCode === "EMAIL_REQUIRED" ? {} : "test@example.com",
      });

    expect(response.status).toBe(expectedStatus);
    expect(response.body).toEqual({ errorCode });
  });
};

// Función para configurar los mocks por defecto
const setupDefaultMocks = () => {
  axios.post.mockImplementation((url) => {
    if (url.endsWith("/login")) return Promise.resolve(successResponses.login);
    if (url.endsWith("/adduser"))
      return Promise.resolve(successResponses.adduser);
    if (url.endsWith("/ask")) return Promise.resolve(successResponses.askllm);
    if (url.endsWith("/ai-answer"))
      return Promise.resolve(successResponses.aiAnswer);
    if (url.endsWith("/generate-apikey"))
      return Promise.resolve(successResponses.generateApikey);
    if (url.endsWith("/savestats"))
      return Promise.resolve(successResponses.savestats);
    return Promise.resolve({});
  });

  axios.get.mockImplementation((url) => {
    if (url.includes("/validate-apikey/"))
      return Promise.resolve(successResponses.validateApikey);
    if (url.includes("/getstats/"))
      return Promise.resolve(successResponses.getStats);
    if (url.includes("/getranking"))
      return Promise.resolve(successResponses.getRanking);
    if (url.includes("/getTop3"))
      return Promise.resolve(successResponses.getTop3);
    if (url.includes("/games/"))
      return Promise.resolve(successResponses.getGames);
    if (url.includes("/ratios-per-month/"))
      return Promise.resolve(successResponses.getRatiosPerMonth);
    if (url.includes("/questions")) {
      return Promise.resolve(
        url.includes("/questionsDB")
          ? successResponses.getQuestionsDB
          : successResponses.getQuestionsGenerated
      );
    }
    return Promise.resolve({});
  });
};

describe("Gateway Service", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    setupDefaultMocks();
  });

  // Test /health endpoint
  it("should return health status OK", async () => {
    const response = await request(app).get("/health");
    expect(response.statusCode).toBe(200);
    expect(response.body.status).toBe("OK");
  });

  // Tests para el endpoint /login
  testPostEndpoint(
    "login",
    { username: "testuser", password: "testpassword" },
    200,
    "login"
  );
  testPostEndpoint(
    "login",
    { username: "baduser", password: "wrongpassword" },
    401,
    null,
    "Credenciales inválidas",
    "response"
  );

  // Tests para el endpoint /adduser
  testPostEndpoint(
    "adduser",
    { username: "newuser", password: "newpassword" },
    200,
    "adduser"
  );
  testPostEndpoint(
    "adduser",
    { username: "existinguser", password: "password" },
    409,
    null,
    "El usuario ya existe",
    "response"
  );

  // Tests para el endpoint /askllm
  testPostEndpoint(
    "askllm",
    { question: "question", apiKey: "apiKey", model: "gemini" },
    200,
    "askllm",
    null,
    null,
    null,
    "ask"
  );
  testPostEndpoint(
    "askllm",
    { badformat: true },
    400,
    null,
    "Formato de pregunta incorrecto",
    "response"
  );

  // Tests para el endpoint /ai-answer
  testPostEndpoint(
    "ai-answer",
    { question: "question", context: "context" },
    200,
    "aiAnswer"
  );
  testPostEndpoint(
    "ai-answer",
    { question: "question" },
    400,
    null,
    "Contexto insuficiente",
    "response"
  );
  testPostEndpoint(
    "ai-answer",
    { question: "question" },
    500,
    null,
    "El servicio LLM no está disponible",
    "request",
    "llm"
  );
  testPostEndpoint(
    "ai-answer",
    { question: "question" },
    500,
    null,
    "Error interno del servidor",
    "generic"
  );

  // Tests para el endpoint /savestats
  testPostEndpoint(
    "savestats",
    { username: "testuser", win: true, date: "2023-05-01" },
    200,
    "savestats"
  );
  testPostEndpoint(
    "savestats",
    { incomplete: true },
    400,
    null,
    "Datos incompletos",
    "response"
  );
  testPostEndpoint(
    "savestats",
    { username: "testuser", win: true },
    500,
    null,
    "El servidor de estadísticas no está disponible",
    "request",
    "stats"
  );
  testPostEndpoint(
    "savestats",
    { username: "testuser", win: true },
    500,
    null,
    "Error interno del servidor",
    "generic"
  );

  // Tests para el endpoint /getstats
  testGetEndpoint("getstats", "username", "testuser", 200, "getStats");
  testGetEndpoint(
    "getstats",
    "username",
    "nonexistentuser",
    404,
    null,
    "Usuario no encontrado",
    "response"
  );
  testGetEndpoint(
    "getstats",
    "username",
    "testuser",
    500,
    null,
    "El servidor de estadísticas no está disponible",
    "request"
  );
  testGetEndpoint(
    "getstats",
    "username",
    "testuser",
    500,
    null,
    "Error interno del servidor",
    "generic"
  );

  // Tests para el endpoint /getranking
  testGetEndpoint("getranking", null, null, 200, "getRanking");
  testGetEndpoint(
    "getranking",
    null,
    null,
    500,
    null,
    "Error al obtener ranking",
    "response"
  );

  // Tests para el endpoint /getTop3
  testGetEndpoint("getTop3", null, null, 200, "getTop3");
  testGetEndpoint(
    "getTop3",
    null,
    null,
    500,
    null,
    "Error al obtener top 3",
    "response"
  );

  // Tests para el endpoint /games
  testGetEndpoint("games", "username", "testuser", 200, "getGames");

  it("should validate username in games request", async () => {
    const response = await request(app).get("/games/");
    expect(response.statusCode).toBe(404); // Ruta no encontrada
  });

  testGetEndpoint(
    "games",
    "username",
    "nonexistentuser",
    404,
    null,
    "Usuario no encontrado",
    "response"
  );

  // Tests para el endpoint /ratios-per-month
  testGetEndpoint(
    "ratios-per-month",
    "username",
    "testuser",
    200,
    "getRatiosPerMonth"
  );

  it("should validate username in ratios-per-month request", async () => {
    const response = await request(app).get("/ratios-per-month/");
    expect(response.statusCode).toBe(404); // Ruta no encontrada
  });

  testGetEndpoint(
    "ratios-per-month",
    "username",
    "nonexistentuser",
    404,
    null,
    "Usuario no encontrado",
    "response"
  );

  // Funciones auxiliares para probar endpoints con parámetros de query
  const testQuestionsEndpoint = (endpoint, queryParams, defaultParams) => {
    it(`should forward ${endpoint} request to the wiki question service`, async () => {
      const query = new URLSearchParams(queryParams).toString();
      const response = await request(app).get(`/${endpoint}?${query}`);

      expect(response.statusCode).toBe(200);
      expect(response.body).toEqual(
        endpoint === "questions"
          ? successResponses.getQuestionsGenerated.data
          : successResponses.getQuestionsDB.data
      );
      expect(axios.get).toHaveBeenCalledWith(
        expect.stringContaining(`/${endpoint}?${query}`)
      );
    });

    it(`should use default values for ${endpoint} request if not provided`, async () => {
      const response = await request(app).get(`/${endpoint}`);

      expect(response.statusCode).toBe(200);
      const defaultQueryString = new URLSearchParams(defaultParams).toString();
      expect(axios.get).toHaveBeenCalledWith(
        expect.stringContaining(`/${endpoint}?${defaultQueryString}`)
      );
    });

    it(`should handle ${endpoint} service errors`, async () => {
      const errorMessage = `Error al obtener preguntas${
        endpoint === "questionsDB" ? " de DB" : ""
      }`;
      axios.get.mockRejectedValueOnce(
        mockAxiosError(0, { message: errorMessage }, "generic")
      );

      const response = await request(app).get(`/${endpoint}`);

      expect(response.statusCode).toBe(500);
      expect(response.body.error).toBe(errorMessage);
    });
  };

  // Tests para el endpoint /questions
  testQuestionsEndpoint(
    "questions",
    { n: 5, topic: "ciencia" },
    { n: 10, topic: "all" }
  );

  // Tests para el endpoint /questionsDB
  testQuestionsEndpoint(
    "questionsDB",
    { n: 5, topic: "historia" },
    { n: 10, topic: "all" }
  );

  // Tests para el endpoint /generate-apikey
  testPostEndpoint(
    "generate-apikey",
    { username: "testuser" },
    200,
    "generateApikey"
  );

  // Tests específicos para errores de apikey
  testApiKeyErrors("EMAIL_REQUIRED", 400);
  testApiKeyErrors("INVALID_EMAIL_FORMAT", 400);
  testApiKeyErrors("EMAIL_ALREADY_EXISTS", 400);

  it("should return GENERIC error code for unexpected errors", async () => {
    axios.post.mockRejectedValueOnce(
      mockAxiosError(500, { error: "Internal server error" })
    );

    const response = await request(app)
      .post("/generate-apikey")
      .send({ email: "test@example.com" });

    expect(response.status).toBe(500);
    expect(response.body).toEqual({ errorCode: "GENERIC" });
  });

  it("should handle network errors when user service is unavailable", async () => {
    axios.post.mockRejectedValueOnce(mockAxiosError(0, {}, "request"));

    const response = await request(app)
      .post("/generate-apikey")
      .send({ email: "test@example.com" });

    expect(response.status).toBe(500);
    expect(response.body).toEqual({ errorCode: "GENERIC" });
  });

  // Tests para el endpoint /validate-apikey
  testGetEndpoint(
    "validate-apikey",
    "apiKey",
    "valid-api-key-12345",
    200,
    "validateApikey"
  );
  testGetEndpoint(
    "validate-apikey",
    "apiKey",
    "invalid-key",
    401,
    null,
    "API key inválida",
    "response"
  );
});
