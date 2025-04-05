const request = require("supertest");
const axios = require("axios");
const { app, startServer, closeServer } = require("./llm-service");

let server;

// Iniciar el servidor antes de todas las pruebas con un puerto diferente para tests
beforeAll(async () => {
  // Usar un puerto diferente para las pruebas
  server = startServer(8090);
});

// Cerrar el servidor después de todas las pruebas
afterAll(async () => {
  await closeServer();
});

// Mockear axios para simular respuestas de servicios externos
jest.mock("axios");

// Mockear process.env para proporcionar una API key para las pruebas
process.env.LLM_API_KEY = "test-api-key";

describe("LLM Service", () => {
  // Guardar las funciones originales de console.error y console.log
  const originalConsoleError = console.error;
  const originalConsoleLog = console.log;

  // Mock responses from external services
  beforeEach(() => {
    // Restaurar las funciones originales de console al inicio de cada test
    console.error = originalConsoleError;
    console.log = originalConsoleLog;

    axios.post.mockImplementation((url, data) => {
      if (url.startsWith("https://generativelanguage")) {
        return Promise.resolve({
          status: 200,
          data: {
            candidates: [{ content: { parts: [{ text: "gemini-answer" }] } }],
          },
        });
      } else if (url.startsWith("https://empathyai")) {
        return Promise.resolve({
          status: 200,
          data: {
            choices: [{ message: { content: "empathy-answer" } }],
          },
        });
      }
    });

    // También necesitamos mockear axios.get para la verificación de estado
    axios.get.mockResolvedValue({ status: 200, data: { status: "OK" } });
  });

  // Test de la ruta de verificación de estado
  it("should return status OK for GET /", async () => {
    const response = await request(app).get("/");
    expect(response.statusCode).toBe(200);
    expect(response.body.status).toBe("OK");
  });

  // Test del endpoint /ask con los parámetros correctos usando empathy
  it("should process ask request with valid parameters using empathy model", async () => {
    const testQuestion = {
      respuestaCorrecta: "El Big Ben",
      pregunta: {
        es: "¿Cuál es este monumento?",
        en: "What is this monument?",
        idioma: "¿Cuál es este monumento?",
      },
      descripcion: [
        { propiedad: "Capital", valor: "Londres" },
        { propiedad: "Monarca del país", valor: "Carlos II" },
      ],
    };

    const response = await request(app).post("/ask").send({
      userQuestion: "¿Es la torre eiffel?",
      question: testQuestion,
      idioma: "es",
      model: "empathy",
    });

    expect(response.statusCode).toBe(200);
    expect(response.body.answer).toBe("empathy-answer");
  });

  // Test del endpoint /ask con los parámetros correctos usando gemini
  it("should process ask request with valid parameters using gemini model", async () => {
    const testQuestion = {
      respuestaCorrecta: "El Big Ben",
      pregunta: {
        es: "¿Cuál es este monumento?",
        en: "What is this monument?",
        idioma: "¿Cuál es este monumento?",
      },
      descripcion: [
        { propiedad: "Capital", valor: "Londres" },
        { propiedad: "Monarca del país", valor: "Carlos II" },
      ],
    };

    const response = await request(app).post("/ask").send({
      userQuestion: "¿Es la torre eiffel?",
      question: testQuestion,
      idioma: "es",
      model: "gemini",
    });

    expect(response.statusCode).toBe(200);
    expect(response.body.answer).toBe("gemini-answer");
  });

  // Test para verificar manejo cuando el LLM responde vacío
  it("should handle empty LLM responses", async () => {
    console.error = jest.fn();
    console.log = jest.fn();

    // Modificar el mock para simular una respuesta vacía
    axios.post.mockImplementationOnce(() => {
      return Promise.resolve({
        status: 200,
        data: {
          choices: [] // Respuesta vacía
        }
      });
    });

    const testQuestion = {
      respuestaCorrecta: "El Big Ben",
      pregunta: {
        es: "¿Cuál es este monumento?",
        en: "What is this monument?",
        idioma: "¿Cuál es este monumento?",
      },
      descripcion: [
        { propiedad: "Capital", valor: "Londres" },
        { propiedad: "Monarca del país", valor: "Carlos II" },
      ],
    };

    const response = await request(app).post("/ask").send({
      userQuestion: "¿Es la torre eiffel?",
      question: testQuestion,
      idioma: "es",
      model: "empathy",
    });

    expect(response.statusCode).toBe(200);
    expect(response.body.answer).toBe("No se recibió respuesta del LLM");
  });

  // Test para verificar modelo no soportado
  it("should return error for unsupported model", async () => {
    console.error = jest.fn();
    console.log = jest.fn();

    const testQuestion = {
      respuestaCorrecta: "El Big Ben",
      pregunta: {
        es: "¿Cuál es este monumento?",
        en: "What is this monument?",
        idioma: "¿Cuál es este monumento?",
      },
      descripcion: [
        { propiedad: "Capital", valor: "Londres" },
        { propiedad: "Monarca del país", valor: "Carlos II" },
      ],
    };

    const response = await request(app).post("/ask").send({
      userQuestion: "¿Es la torre eiffel?",
      question: testQuestion,
      idioma: "es",
      model: "unsupported-model", // Modelo no soportado
    });

    expect(response.statusCode).toBe(400);
    // Cambiamos la expectativa para que coincida con el mensaje real
    expect(response.body.error).toBe('Modelo "unsupported-model" no soportado.');
  });

  // Test para verificar errores de API
  it("should handle API errors", async () => {
    console.error = jest.fn();
    console.log = jest.fn();

    // Modificar el mock para simular un error API
    axios.post.mockImplementationOnce(() => {
      return Promise.reject({
        response: {
          status: 403,
          data: { error: "API Error" }
        }
      });
    });

    const testQuestion = {
      respuestaCorrecta: "El Big Ben",
      pregunta: {
        es: "¿Cuál es este monumento?",
        en: "What is this monument?",
        idioma: "¿Cuál es este monumento?",
      },
      descripcion: [
        { propiedad: "Capital", valor: "Londres" },
        { propiedad: "Monarca del país", valor: "Carlos II" },
      ],
    };

    const response = await request(app).post("/ask").send({
      userQuestion: "¿Es la torre eiffel?",
      question: testQuestion,
      idioma: "es",
      model: "empathy",
    });

    expect(response.statusCode).toBe(400);
    expect(response.body.error).toBeTruthy();
  });

  // Test para verificar el middleware de logging
  it("should log request info with middleware", async () => {
    console.log = jest.fn();

    await request(app).get("/");

    // Verificar que se llamó a console.log (el middleware de logging)
    expect(console.log).toHaveBeenCalled();
    const logCall = console.log.mock.calls[0][0];
    expect(logCall).toContain("GET /");
  });

  // Test verificando errores cuando falta API key
  it("should return error when LLM_API_KEY is missing", async () => {
    console.error = jest.fn();
    console.log = jest.fn();

    // Guardamos la API key actual
    const originalApiKey = process.env.LLM_API_KEY;
    // La eliminamos temporalmente
    delete process.env.LLM_API_KEY;

    const testQuestion = {
      respuestaCorrecta: "El Big Ben",
      pregunta: {
        es: "¿Cuál es este monumento?",
        en: "What is this monument?",
        idioma: "¿Cuál es este monumento?",
      },
      descripcion: [
        { propiedad: "Capital", valor: "Londres" },
        { propiedad: "Monarca del país", valor: "Carlos II" },
      ],
    };

    const response = await request(app).post("/ask").send({
      userQuestion: "¿Es la torre eiffel?",
      question: testQuestion,
      idioma: "es",
    });

    expect(response.statusCode).toBe(400);
    expect(response.body.error).toContain("LLM_API_KEY no está configurada");

    // Restauramos la API key
    process.env.LLM_API_KEY = originalApiKey;
  });

  // Test de error por falta de parámetros requeridos
  it("should return error for missing required parameters", async () => {
    // Silenciar console.error y console.log para este test
    console.error = jest.fn();
    console.log = jest.fn();

    const response = await request(app).post("/ask").send({ model: "empathy" });

    expect(response.statusCode).toBe(400);
    expect(response.body.error).toBeTruthy();
    expect(response.body.error).toContain("Campo requerido faltante");

    // Verificar que se llamó a console.error
    expect(console.error).toHaveBeenCalled();
  });

  // Test de error por estructura de question inválida
  it("should return error for invalid question structure", async () => {
    // Silenciar console.error y console.log para este test
    console.error = jest.fn();
    console.log = jest.fn();

    const response = await request(app).post("/ask").send({
      userQuestion: "¿Es la torre eiffel?",
      question: { /* estructura incorrecta */ },
      idioma: "es",
      model: "empathy",
    });

    expect(response.statusCode).toBe(400);
    expect(response.body.error).toBeTruthy();
    expect(response.body.error).toContain("Estructura de question inválida");

    // Verificar que se llamó a console.error
    expect(console.error).toHaveBeenCalled();
  });

  // Test para error genérico sin objeto de respuesta
  it("should handle generic errors without response object", async () => {
    console.error = jest.fn();
    console.log = jest.fn();

    // Modificar el mock para simular un error genérico
    axios.post.mockImplementationOnce(() => {
      return Promise.reject(new Error("Network error"));
    });

    const testQuestion = {
      respuestaCorrecta: "El Big Ben",
      pregunta: {
        es: "¿Cuál es este monumento?",
        en: "What is this monument?",
        idioma: "¿Cuál es este monumento?",
      },
      descripcion: [
        { propiedad: "Capital", valor: "Londres" },
        { propiedad: "Monarca del país", valor: "Carlos II" },
      ],
    };

    const response = await request(app).post("/ask").send({
      userQuestion: "¿Es la torre eiffel?",
      question: testQuestion,
      idioma: "es",
      model: "empathy",
    });

    expect(response.statusCode).toBe(400);
    expect(response.body.error).toBe("Network error");
  });
});
