const request = require('supertest');
const axios = require('axios');
const app = require('./llm-service');

// Cerrar el servidor después de todas las pruebas
afterAll(async () => {
  app.close();
});

// Mockear axios para simular respuestas de servicios externos
jest.mock('axios');

// Mockear process.env para proporcionar una API key para las pruebas
process.env.LLM_API_KEY = 'test-api-key';

describe('LLM Service', () => {
  // Guardar las funciones originales de console.error y console.log
  const originalConsoleError = console.error;
  const originalConsoleLog = console.log;

  // Mock responses from external services
  beforeEach(() => {
    // Restaurar las funciones originales de console al inicio de cada test
    console.error = originalConsoleError;
    console.log = originalConsoleLog;

    axios.post.mockImplementation((url, data) => {
      if (url.startsWith('https://generativelanguage')) {
        return Promise.resolve({
          status: 200,
          data: {
            candidates: [{ content: { parts: [{ text: 'llmanswer' }] } }]
          }
        });
      } else if (url.startsWith('https://empathyai')) {
        return Promise.resolve({
          status: 200,
          data: {
            choices: [{ message: { content: 'llmanswer' } }]
          }
        });
      }
    });

    // También necesitamos mockear axios.get para la verificación de estado
    axios.get.mockResolvedValue({ status: 200, data: { status: 'OK' } });
  });

  // Test de la ruta de verificación de estado
  it('should return status OK for GET /', async () => {
    const response = await request(app).get('/');
    expect(response.statusCode).toBe(200);
    expect(response.body.status).toBe('OK');
  });

  // Test del endpoint /ask con los parámetros correctos
  it('should process ask request with valid parameters', async () => {
    const testQuestion = {
      respuestaCorrecta: 'El Big Ben',
      pregunta: {
        es: '¿Cuál es este monumento?',
        en: 'What is this monument?',
        idioma: '¿Cuál es este monumento?'
      },
      descripcion: [
        { propiedad: "Capital", valor: "Londres" },
        { propiedad: "Monarca del país", valor: "Carlos II" }
      ]
    };

    const response = await request(app)
        .post('/ask')
        .send({
          userQuestion: '¿Es la torre eiffel?',
          question: testQuestion,
          idioma: 'es',
          model: 'empathy'
        });

    expect(response.statusCode).toBe(200);
    expect(response.body.answer).toBe('llmanswer');
  });

  // Test de error por falta de parámetros requeridos
  it('should return error for missing required parameters', async () => {
    // Silenciar console.error y console.log para este test
    console.error = jest.fn();
    console.log = jest.fn();

    const response = await request(app)
        .post('/ask')
        .send({ model: 'empathy' });

    expect(response.statusCode).toBe(400);
    expect(response.body.error).toBeTruthy();

    // Verificar que se llamó a console.error (pero no veremos el mensaje)
    expect(console.error).toHaveBeenCalled();
  });

  // Test de error por estructura de question inválida
  it('should return error for invalid question structure', async () => {
    // Silenciar console.error y console.log para este test
    console.error = jest.fn();
    console.log = jest.fn();

    const response = await request(app)
        .post('/ask')
        .send({
          userQuestion: '¿Es la torre eiffel?',
          question: { /* estructura incorrecta */ },
          idioma: 'es',
          model: 'empathy'
        });

    expect(response.statusCode).toBe(400);
    expect(response.body.error).toBeTruthy();

    // Verificar que se llamó a console.error (pero no veremos el mensaje)
    expect(console.error).toHaveBeenCalled();
  });
});
