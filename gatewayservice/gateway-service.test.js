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

describe("Gateway Service", () => {
  beforeEach(() => {
    jest.clearAllMocks();

    // Default mock implementations
    axios.post.mockImplementation((url) => {
      if (url.endsWith("/login")) {
        return Promise.resolve(successResponses.login);
      } else if (url.endsWith("/adduser")) {
        return Promise.resolve(successResponses.adduser);
      } else if (url.endsWith("/ask")) {
        return Promise.resolve(successResponses.askllm);
      } else if (url.endsWith("/ai-answer")) {
        return Promise.resolve(successResponses.aiAnswer);
      } else if (url.endsWith("/generate-apikey")) {
        return Promise.resolve(successResponses.generateApikey);
      } else if (url.endsWith("/savestats")) {
        return Promise.resolve(successResponses.savestats);
      }
    });

    axios.get.mockImplementation((url) => {
      if (url.includes("/validate-apikey/")) {
        return Promise.resolve(successResponses.validateApikey);
      } else if (url.includes("/getstats/")) {
        return Promise.resolve(successResponses.getStats);
      } else if (url.includes("/getranking")) {
        return Promise.resolve(successResponses.getRanking);
      } else if (url.includes("/getTop3")) {
        return Promise.resolve(successResponses.getTop3);
      } else if (url.includes("/games/")) {
        return Promise.resolve(successResponses.getGames);
      } else if (url.includes("/ratios-per-month/")) {
        return Promise.resolve(successResponses.getRatiosPerMonth);
      } else if (url.includes("/questions")) {
        return Promise.resolve(
          url.includes("/questionsDB")
            ? successResponses.getQuestionsDB
            : successResponses.getQuestionsGenerated
        );
      }
    });
  });

  // Test /health endpoint
  it("should return health status OK", async () => {
    const response = await request(app).get("/health");
    expect(response.statusCode).toBe(200);
    expect(response.body.status).toBe("OK");
  });

  // Test /login endpoint
  it("should forward login request to auth service", async () => {
    const response = await request(app)
      .post("/login")
      .send({ username: "testuser", password: "testpassword" });

    expect(response.statusCode).toBe(200);
    expect(response.body.token).toBe("mockedToken");
    expect(axios.post).toHaveBeenCalledWith(expect.stringContaining("/login"), {
      username: "testuser",
      password: "testpassword",
    });
  });

  it("should handle login service errors", async () => {
    axios.post.mockRejectedValueOnce(
      mockAxiosError(401, { error: "Credenciales inválidas" })
    );

    const response = await request(app)
      .post("/login")
      .send({ username: "baduser", password: "wrongpassword" });

    expect(response.statusCode).toBe(401);
    expect(response.body.error).toBe("Credenciales inválidas");
  });

  // Test /adduser endpoint
  it("should forward add user request to user service", async () => {
    const response = await request(app)
      .post("/adduser")
      .send({ username: "newuser", password: "newpassword" });

    expect(response.statusCode).toBe(200);
    expect(response.body.userId).toBe("mockedUserId");
    expect(axios.post).toHaveBeenCalledWith(
      expect.stringContaining("/adduser"),
      { username: "newuser", password: "newpassword" }
    );
  });

  it("should handle adduser service errors", async () => {
    axios.post.mockRejectedValueOnce(
      mockAxiosError(409, { error: "El usuario ya existe" })
    );

    const response = await request(app)
      .post("/adduser")
      .send({ username: "existinguser", password: "password" });

    expect(response.statusCode).toBe(409);
    expect(response.body.error).toBe("El usuario ya existe");
  });

  // Test /askllm endpoint
  it("should forward askllm request to the llm service", async () => {
    const response = await request(app)
      .post("/askllm")
      .send({ question: "question", apiKey: "apiKey", model: "gemini" });

    expect(response.statusCode).toBe(200);
    expect(response.body.answer).toBe("llmanswer");
    expect(axios.post).toHaveBeenCalledWith(expect.stringContaining("/ask"), {
      question: "question",
      apiKey: "apiKey",
      model: "gemini",
    });
  });

  it("should handle askllm service errors", async () => {
    axios.post.mockRejectedValueOnce(
      mockAxiosError(400, { error: "Formato de pregunta incorrecto" })
    );

    const response = await request(app)
      .post("/askllm")
      .send({ badformat: true });

    expect(response.statusCode).toBe(400);
    expect(response.body.error).toBe("Formato de pregunta incorrecto");
  });

  // Test /ai-answer endpoint
  it("should forward ai-answer request to the llm service", async () => {
    const response = await request(app)
      .post("/ai-answer")
      .send({ question: "question", context: "context" });

    expect(response.statusCode).toBe(200);
    expect(response.body.answer).toBe("AI generó esta respuesta");
    expect(axios.post).toHaveBeenCalledWith(
      expect.stringContaining("/ai-answer"),
      { question: "question", context: "context" }
    );
  });

  it("should handle ai-answer service errors with response", async () => {
    axios.post.mockRejectedValueOnce(
      mockAxiosError(400, { error: "Contexto insuficiente" })
    );

    const response = await request(app)
      .post("/ai-answer")
      .send({ question: "question" });

    expect(response.statusCode).toBe(400);
    expect(response.body.error).toBe("Contexto insuficiente");
  });

  it("should handle ai-answer service errors with request failure", async () => {
    axios.post.mockRejectedValueOnce(
      mockAxiosError(0, { message: "Connection refused" }, "request")
    );

    const response = await request(app)
      .post("/ai-answer")
      .send({ question: "question" });

    expect(response.statusCode).toBe(500);
    expect(response.body.error).toBe("El servicio LLM no está disponible");
  });

  it("should handle ai-answer general errors", async () => {
    axios.post.mockRejectedValueOnce(
      mockAxiosError(0, { message: "Error inesperado" }, "generic")
    );

    const response = await request(app)
      .post("/ai-answer")
      .send({ question: "question" });

    expect(response.statusCode).toBe(500);
    expect(response.body.error).toBe("Error interno del servidor");
  });

  // Test /savestats endpoint
  it("should forward savestats request to the stats service", async () => {
    const statsData = { username: "testuser", win: true, date: "2023-05-01" };
    const response = await request(app).post("/savestats").send(statsData);

    expect(response.statusCode).toBe(200);
    expect(response.body.success).toBe(true);
    expect(axios.post).toHaveBeenCalledWith(
      expect.stringContaining("/savestats"),
      statsData
    );
  });

  it("should handle savestats service errors with response", async () => {
    axios.post.mockRejectedValueOnce(
      mockAxiosError(400, { error: "Datos incompletos" })
    );

    const response = await request(app)
      .post("/savestats")
      .send({ incomplete: true });

    expect(response.statusCode).toBe(400);
    expect(response.body.error).toBe("Datos incompletos");
  });

  it("should handle savestats service errors with request failure", async () => {
    axios.post.mockRejectedValueOnce(
      mockAxiosError(0, { message: "Connection refused" }, "request")
    );

    const response = await request(app)
      .post("/savestats")
      .send({ username: "testuser", win: true });

    expect(response.statusCode).toBe(500);
    expect(response.body.error).toBe(
      "El servidor de estadísticas no está disponible"
    );
  });

  it("should handle savestats general errors", async () => {
    axios.post.mockRejectedValueOnce(
      mockAxiosError(0, { message: "Error inesperado" }, "generic")
    );

    const response = await request(app)
      .post("/savestats")
      .send({ username: "testuser", win: true });

    expect(response.statusCode).toBe(500);
    expect(response.body.error).toBe("Error interno del servidor");
  });

  // Test /getstats endpoint
  it("should forward getstats request to the stats service", async () => {
    const username = "testuser";
    const response = await request(app).get(`/getstats/${username}`);

    expect(response.statusCode).toBe(200);
    expect(response.body).toEqual({ games: 10, wins: 7, ratio: 0.7 });
    expect(axios.get).toHaveBeenCalledWith(
      expect.stringContaining(`/getstats/${username}`)
    );
  });

  it("should handle getstats service errors with response", async () => {
    axios.get.mockRejectedValueOnce(
      mockAxiosError(404, { error: "Usuario no encontrado" })
    );

    const response = await request(app).get("/getstats/nonexistentuser");

    expect(response.statusCode).toBe(404);
    expect(response.body.error).toBe("Usuario no encontrado");
  });

  it("should handle getstats service errors with request failure", async () => {
    axios.get.mockRejectedValueOnce(
      mockAxiosError(0, { message: "Connection refused" }, "request")
    );

    const response = await request(app).get("/getstats/testuser");

    expect(response.statusCode).toBe(500);
    expect(response.body.error).toBe(
      "El servidor de estadísticas no está disponible"
    );
  });

  it("should handle getstats general errors", async () => {
    axios.get.mockRejectedValueOnce(
      mockAxiosError(0, { message: "Error inesperado" }, "generic")
    );

    const response = await request(app).get("/getstats/testuser");

    expect(response.statusCode).toBe(500);
    expect(response.body.error).toBe("Error interno del servidor");
  });

  // Test /getranking endpoint
  it("should forward getranking request to the stats service", async () => {
    const response = await request(app).get("/getranking");

    expect(response.statusCode).toBe(200);
    expect(response.body).toEqual([
      { username: "user1", wins: 10 },
      { username: "user2", wins: 8 },
    ]);
    expect(axios.get).toHaveBeenCalledWith(
      expect.stringContaining("/getranking")
    );
  });

  it("should handle getranking service errors", async () => {
    axios.get.mockRejectedValueOnce(
      mockAxiosError(500, { error: "Error al obtener ranking" })
    );

    const response = await request(app).get("/getranking");

    expect(response.statusCode).toBe(500);
    expect(response.body.error).toBe("Error al obtener ranking");
  });

  // Test /getTop3 endpoint
  it("should forward getTop3 request to the stats service", async () => {
    const response = await request(app).get("/getTop3");

    expect(response.statusCode).toBe(200);
    expect(response.body).toEqual([
      { username: "user1", wins: 10 },
      { username: "user2", wins: 8 },
      { username: "user3", wins: 5 },
    ]);
    expect(axios.get).toHaveBeenCalledWith(expect.stringContaining("/getTop3"));
  });

  it("should handle getTop3 service errors", async () => {
    axios.get.mockRejectedValueOnce(
      mockAxiosError(500, { error: "Error al obtener top 3" })
    );

    const response = await request(app).get("/getTop3");

    expect(response.statusCode).toBe(500);
    expect(response.body.error).toBe("Error al obtener top 3");
  });

  // Test /games endpoint
  it("should forward games request to the stats service", async () => {
    const username = "testuser";
    const response = await request(app).get(`/games/${username}`);

    expect(response.statusCode).toBe(200);
    expect(response.body).toEqual({
      totalGames: 20,
      gamesPerMonth: [
        { month: "Enero", games: 5 },
        { month: "Febrero", games: 15 },
      ],
    });
    expect(axios.get).toHaveBeenCalledWith(
      expect.stringContaining(`/games/${username}`)
    );
  });

  it("should validate username in games request", async () => {
    const response = await request(app).get("/games/");

    expect(response.statusCode).toBe(404); // Ruta no encontrada
  });

  it("should handle games service errors", async () => {
    axios.get.mockRejectedValueOnce(
      mockAxiosError(404, { error: "Usuario no encontrado" })
    );

    const response = await request(app).get("/games/nonexistentuser");

    expect(response.statusCode).toBe(404);
    expect(response.body.error).toBe("Usuario no encontrado");
  });

  // Test /ratios-per-month endpoint
  it("should forward ratios-per-month request to the stats service", async () => {
    const username = "testuser";
    const response = await request(app).get(`/ratios-per-month/${username}`);

    expect(response.statusCode).toBe(200);
    expect(response.body).toEqual([
      { month: "Enero", ratio: 0.8 },
      { month: "Febrero", ratio: 0.6 },
    ]);
    expect(axios.get).toHaveBeenCalledWith(
      expect.stringContaining(`/ratios-per-month/${username}`)
    );
  });

  it("should validate username in ratios-per-month request", async () => {
    const response = await request(app).get("/ratios-per-month/");

    expect(response.statusCode).toBe(404); // Ruta no encontrada
  });

  it("should handle ratios-per-month service errors", async () => {
    axios.get.mockRejectedValueOnce(
      mockAxiosError(404, { error: "Usuario no encontrado" })
    );

    const response = await request(app).get(
      "/ratios-per-month/nonexistentuser"
    );

    expect(response.statusCode).toBe(404);
    expect(response.body.error).toBe("Usuario no encontrado");
  });

  // Test /questions endpoint
  it("should forward questions request to the wiki question service", async () => {
    const response = await request(app).get("/questions?n=5&topic=ciencia");

    expect(response.statusCode).toBe(200);
    expect(response.body).toEqual([
      {
        id: 1,
        question: "¿Pregunta generada?",
        answer: "respuesta",
        topic: "ciencia",
      },
    ]);
    expect(axios.get).toHaveBeenCalledWith(
      expect.stringContaining("/questions?n=5&topic=ciencia")
    );
  });

  it("should use default values for questions request if not provided", async () => {
    const response = await request(app).get("/questions");

    expect(response.statusCode).toBe(200);
    expect(axios.get).toHaveBeenCalledWith(
      expect.stringContaining("/questions?n=10&topic=all")
    );
  });

  it("should handle questions service errors", async () => {
    axios.get.mockRejectedValueOnce(
      mockAxiosError(0, { message: "Error al obtener preguntas" }, "generic")
    );

    const response = await request(app).get("/questions");

    expect(response.statusCode).toBe(500);
    expect(response.body.error).toBe("Error al obtener preguntas");
  });

  // Test /questionsDB endpoint
  it("should forward questionsDB request to the wiki question service", async () => {
    const response = await request(app).get("/questionsDB?n=5&topic=historia");

    expect(response.statusCode).toBe(200);
    expect(response.body).toEqual([
      {
        id: 1,
        question: "¿Pregunta de la base de datos?",
        answer: "respuesta",
        topic: "historia",
      },
    ]);
    expect(axios.get).toHaveBeenCalledWith(
      expect.stringContaining("/questionsDB?n=5&topic=historia")
    );
  });

  it("should use default values for questionsDB request if not provided", async () => {
    const response = await request(app).get("/questionsDB");

    expect(response.statusCode).toBe(200);
    expect(axios.get).toHaveBeenCalledWith(
      expect.stringContaining("/questionsDB?n=10&topic=all")
    );
  });

  it("should handle questionsDB service errors", async () => {
    axios.get.mockRejectedValueOnce(
      mockAxiosError(
        0,
        { message: "Error al obtener preguntas de DB" },
        "generic"
      )
    );

    const response = await request(app).get("/questionsDB");

    expect(response.statusCode).toBe(500);
    expect(response.body.error).toBe("Error al obtener preguntas de DB");
  });

  // Test /generate-apikey endpoint
  it("should forward generate-apikey request to the user service", async () => {
    const response = await request(app)
      .post("/generate-apikey")
      .send({ username: "testuser" });

    expect(response.statusCode).toBe(200);
    expect(response.body.apiKey).toBe("mock-api-key-12345");
    expect(axios.post).toHaveBeenCalledWith(
      expect.stringContaining("/generate-apikey"),
      { username: "testuser" }
    );
  });

  it("should handle EMAIL_REQUIRED error from user service", async () => {
    axios.post.mockRejectedValueOnce(
      mockAxiosError(400, { errorCode: "EMAIL_REQUIRED" })
    );

    const response = await request(app).post("/generate-apikey").send({}); // Sin email

    expect(response.status).toBe(400);
    expect(response.body).toEqual({ errorCode: "EMAIL_REQUIRED" });
  });

  it("should handle INVALID_EMAIL_FORMAT error from user service", async () => {
    axios.post.mockRejectedValueOnce(
      mockAxiosError(400, { errorCode: "INVALID_EMAIL_FORMAT" })
    );

    const response = await request(app)
      .post("/generate-apikey")
      .send({ email: "invalid-email" });

    expect(response.status).toBe(400);
    expect(response.body).toEqual({ errorCode: "INVALID_EMAIL_FORMAT" });
  });

  it("should handle EMAIL_ALREADY_EXISTS error from user service", async () => {
    axios.post.mockRejectedValueOnce(
      mockAxiosError(400, { errorCode: "EMAIL_ALREADY_EXISTS" })
    );

    const response = await request(app)
      .post("/generate-apikey")
      .send({ email: "existing@example.com" });

    expect(response.status).toBe(400);
    expect(response.body).toEqual({ errorCode: "EMAIL_ALREADY_EXISTS" });
  });

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

  // Test /validate-apikey endpoint
  it("should forward validate-apikey request to the user service", async () => {
    const apiKey = "valid-api-key-12345";
    const response = await request(app).get(`/validate-apikey/${apiKey}`);

    expect(response.statusCode).toBe(200);
    expect(response.body.valid).toBe(true);
    expect(response.body.username).toBe("testuser");
    expect(axios.get).toHaveBeenCalledWith(
      expect.stringContaining(`/validate-apikey/${apiKey}`)
    );
  });

  it("should handle errors from validate-apikey endpoint", async () => {
    axios.get.mockRejectedValueOnce(
      mockAxiosError(401, { error: "API key inválida" })
    );

    const response = await request(app).get("/validate-apikey/invalid-key");

    expect(response.statusCode).toBe(401);
    expect(response.body.error).toBe("API key inválida");
  });
});
