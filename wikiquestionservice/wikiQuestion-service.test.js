const request = require("supertest");
const { app } = require("./wikiQuestion-service");

const Question = require("./questiongenerator/question");
const WikidataQueryService = require('./questiongenerator/questionGen');

const CategoryLoader = require("./questiongenerator/categoryLoader");
const mongoose = require("mongoose");

jest.mock("mongoose", () => {
    const actualMongoose = jest.requireActual("mongoose");

    return {
        ...actualMongoose,
        connect: jest.fn(),
        disconnect: jest.fn(),
        connection: {
            readyState: 0
        }
    };
});

const { connectDB, disconnectDB } = require("./wikiQuestion-service");

describe("Conexión a MongoDB", () => {
    afterEach(() => {
        jest.clearAllMocks();
    });

    it("debería conectar si mongoose no está conectado", async () => {
        mongoose.connection.readyState = 0;
        await connectDB();
        expect(mongoose.connect).toHaveBeenCalled();
    });

    it("no debería reconectar si ya está conectado", async () => {
        mongoose.connection.readyState = 1;
        await connectDB();
        expect(mongoose.connect).not.toHaveBeenCalled();
    });

    it("debería desconectar si mongoose está conectado", async () => {
        mongoose.connection.readyState = 1;
        await disconnectDB();
        expect(mongoose.disconnect).toHaveBeenCalled();
    });

    it("no debería desconectar si ya está desconectado", async () => {
        mongoose.connection.readyState = 0;
        await disconnectDB();
        expect(mongoose.disconnect).not.toHaveBeenCalled();
    });
});
/* TEST FUNCIONANDO cambio */
describe('Wikidata Service', () => {
    let server;

    beforeAll(() => {
        server = app.listen(8004);
    });

    afterAll(() => {
        server.close();
    });

    describe('Category Loader Tests', () => {
        it('should distribute questions across all valid categories when "all" is selected', () => {
            const loader = new CategoryLoader(["all"], 30);
            const services = loader.getAllServices();

            expect(services).toHaveProperty('cine');
            expect(services).toHaveProperty('literatura');
            expect(services).toHaveProperty('paises');
            expect(services).toHaveProperty('clubes');
            expect(services).toHaveProperty('arte');
            expect(Object.keys(services).length).toBe(5);
        });

        /* Test para comprobar que poniendo "all" y otra nos cargan todas las categorías igualmente */
        it('should include "all" categories and the specified category when "all" is combined with another category', () => {
            const loader = new CategoryLoader(["all", "cine"], 30);
            const services = loader.getAllServices();

            expect(services).toHaveProperty('cine');
            expect(services).toHaveProperty('literatura');
            expect(services).toHaveProperty('paises');
            expect(services).toHaveProperty('clubes');
            expect(services).toHaveProperty('arte');
            expect(Object.keys(services).length).toBe(5); // Debería incluir todas las categorías
        });

        /* Test para comprobar que solo se cargan las categorías seleccionadas */
        it('should load questions only from the "cine" category', () => {
            const loader = new CategoryLoader(["cine"], 10);
            const services = loader.getAllServices();

            expect(services).toHaveProperty('cine');
            expect(services).not.toHaveProperty('literatura');
            expect(services).not.toHaveProperty('paises');
            expect(services).not.toHaveProperty('clubes');
            expect(services).not.toHaveProperty('arte');
        });

        it('should load questions only from the "literatura" category', () => {
            const loader = new CategoryLoader(["literatura"], 10);
            const services = loader.getAllServices();

            expect(services).toHaveProperty('literatura');
            expect(services).not.toHaveProperty('cine');
            expect(services).not.toHaveProperty('paises');
            expect(services).not.toHaveProperty('clubes');
            expect(services).not.toHaveProperty('arte');
        });

        it('should load questions only from the "paises" category', () => {
            const loader = new CategoryLoader(["paises"], 10);
            const services = loader.getAllServices();

            expect(services).toHaveProperty('paises');
            expect(services).not.toHaveProperty('cine');
            expect(services).not.toHaveProperty('literatura');
            expect(services).not.toHaveProperty('clubes');
            expect(services).not.toHaveProperty('arte');
        });

        it('should load questions only from the "clubes" category', () => {
            const loader = new CategoryLoader(["clubes"], 10);
            const services = loader.getAllServices();

            expect(services).toHaveProperty('clubes');
            expect(services).not.toHaveProperty('cine');
            expect(services).not.toHaveProperty('literatura');
            expect(services).not.toHaveProperty('paises');
            expect(services).not.toHaveProperty('arte');
        });

        it('should load questions only from the "arte" category', () => {
            const loader = new CategoryLoader(["arte"], 10);
            const services = loader.getAllServices();

            expect(services).toHaveProperty('arte');
            expect(services).not.toHaveProperty('cine');
            expect(services).not.toHaveProperty('literatura');
            expect(services).not.toHaveProperty('paises');
            expect(services).not.toHaveProperty('clubes');
        });

        /* Test para comprobar que solo se cargan las categorías seleccionadas */
        it('should load questions from "paises" and "clubes" categories only', () => {
            const loader = new CategoryLoader(["paises", "clubes"], 10);
            const services = loader.getAllServices();

            expect(services).toHaveProperty('paises');
            expect(services).toHaveProperty('clubes');
            expect(services).not.toHaveProperty('cine');
            expect(services).not.toHaveProperty('literatura');
            expect(services).not.toHaveProperty('arte');
        });

        it('should load questions from "literatura" and "arte" categories only', () => {
            const loader = new CategoryLoader(["literatura", "arte", "cine"], 10);
            const services = loader.getAllServices();

            expect(services).toHaveProperty('literatura');
            expect(services).toHaveProperty('arte');
            expect(services).not.toHaveProperty('paises');
            expect(services).not.toHaveProperty('clubes');
        });

        /* Test para comprobar que con temas inválidos no se carga ninguna categoría */
        it('should not load any questions for an invalid category', () => {
            const loader = new CategoryLoader(["invalido"], 10);
            const services = loader.getAllServices();

            expect(Object.keys(services)).toHaveLength(0);
        });

        it('should include all valid categories when "all" is selected with an invalid category', () => {
            const loader = new CategoryLoader(["all", "invalido"], 10);
            const services = loader.getAllServices();

            expect(services).toHaveProperty('cine');
            expect(services).toHaveProperty('literatura');
            expect(services).toHaveProperty('paises');
            expect(services).toHaveProperty('clubes');
            expect(services).toHaveProperty('arte');
            expect(Object.keys(services).length).toBe(5);
        });

        it('should include clubes when "clubes" is selected with an invalid category', () => {
            const loader = new CategoryLoader(["clubes", "invalido"], 10);
            const services = loader.getAllServices();

            expect(services).not.toHaveProperty('cine');
            expect(services).not.toHaveProperty('literatura');
            expect(services).not.toHaveProperty('paises');
            expect(services).toHaveProperty('clubes');
            expect(services).not.toHaveProperty('arte');
            expect(Object.keys(services).length).toBe(1);
        });
    });

    describe('API Tests', () => {

        it("should return 400 if the number of questions is more than 30", async () => {
            const response = await request(server).get("/questions?n=31");
            expect(response.status).toBe(400);
            expect(response.body.error).toBe("El límite de preguntas es 30");
        });

        it("should return 400 if no valid categories are provided", async () => {
            const response = await request(server).get("/questions?topic=invalidCategory");
            expect(response.status).toBe(400);
            expect(response.body.error).toBe("No se proporcionaron categorías válidas.");
        });

        it("should return questions for valid categories", async () => {
            const response = await request(server).get("/questions?topic=paises,cine&n=5");
            expect(response.status).toBe(200);
            expect(response.body).toBeInstanceOf(Array);
        }, 30000);

        it("should return the exact number of questions when requesting fewer questions than available", async () => {
            const response = await request(server).get("/questions?topic=all&n=5");
            expect(response.status).toBe(200);
            expect(response.body.length).toBe(5);
        }, 30000);

        it("should return questions for specific categories (e.g., 'paises' and 'cine')", async () => {
            const response = await request(server).get("/questions?topic=paises,cine&n=5");
            expect(response.status).toBe(200);
            expect(response.body).toBeInstanceOf(Array);
            expect(response.body.length).toBe(5);
            response.body.forEach(question => {
                expect(question).toHaveProperty('pregunta');
                expect(question).toHaveProperty('respuestaCorrecta');
                expect(question).toHaveProperty('respuestas');
            });
        }, 30000);
    });

    describe('Class Question', () => {

        it('should create a Question instance with correct properties', () => {
            const respuestaCorrecta = { es: 'Respuesta correcta' };
            const preguntas = { es: '¿Cuál es la capital de Francia?' };
            const respuestasIncorrectas = { es: ['Madrid', 'Roma', 'Londres'] };
            const descripcion = [{ propiedad: 'Capital', valor: 'París' }];
            const img = ['img1.jpg'];

            const question = new Question(respuestaCorrecta, preguntas, respuestasIncorrectas, descripcion, img);

            expect(question.respuestaCorrecta).toEqual(respuestaCorrecta);
            expect(question.preguntas).toEqual(preguntas);
            expect(question.respuestasIncorrectas).toEqual(respuestasIncorrectas);
            expect(question.descripcion).toEqual(descripcion);
            expect(question.img).toEqual(img);
        });

        it('should return correct question for the specified language', () => {
            const respuestaCorrecta = { es: 'Respuesta correcta' };
            const preguntas = { es: '¿Cuál es la capital de Francia?' };
            const respuestasIncorrectas = { es: ['Madrid', 'Roma', 'Londres'] };
            const descripcion = [{ propiedad: 'Capital', valor: 'París' }];
            const img = ['img1.jpg'];

            const question = new Question(respuestaCorrecta, preguntas, respuestasIncorrectas, descripcion, img);
            const questionText = question.obtenerPreguntaPorIdioma();

            expect(questionText['es']).toBe('¿Cuál es la capital de Francia?');
        });

        it('should return answers in random order', () => {
            const respuestaCorrecta     = { es: 'Respuesta correcta' };
            const preguntas             = { es: '¿Cuál es la capital de Francia?' };
            const respuestasIncorrectas = { es: ['Madrid', 'Roma', 'Londres'] };
            const descripcion           = [{ propiedad: 'Capital', valor: 'París' }];
            const img                   = ['img1.jpg'];

            const question  = new Question(respuestaCorrecta, preguntas, respuestasIncorrectas, descripcion, img);
            const respuestas = question.obtenerRespuestas()['es'];
            const original   = ['Respuesta correcta', 'Madrid', 'Roma', 'Londres'];

            const cmp = (a, b) => a.localeCompare(b, 'es', { sensitivity: 'variant' });
            expect(respuestas.sort(cmp)).toEqual(original.sort(cmp));
        });

        it('should return the image associated with the question', () => {
            const respuestaCorrecta = { es: 'Respuesta correcta' };
            const preguntas = { es: '¿Cuál es la capital de Francia?' };
            const respuestasIncorrectas = { es: ['Madrid', 'Roma', 'Londres'] };
            const descripcion = [{ propiedad: 'Capital', valor: 'París' }];
            const img = ['img1.jpg'];

            const question = new Question(respuestaCorrecta, preguntas, respuestasIncorrectas, descripcion, img);

            const imgResult = question.obtenerImg();
            expect(imgResult).toEqual(img);
        });

        it('should return the question details as a string', () => {
            const respuestaCorrecta = { es: 'Respuesta correcta' };
            const preguntas = { es: '¿Cuál es la capital de Francia?' };
            const respuestasIncorrectas = { es: ['Madrid', 'Roma', 'Londres'] };
            const descripcion = [{ propiedad: 'Capital', valor: 'París' }];
            const img = ['img1.jpg'];

            const question = new Question(respuestaCorrecta, preguntas, respuestasIncorrectas, descripcion, img);
            const questionString = question.toString();

            expect(questionString).toContain('🌍 **Idioma:** ES');
            expect(questionString).toContain('❓ Pregunta: ¿Cuál es la capital de Francia?');
            expect(questionString).toContain('✅ Respuesta correcta: Respuesta correcta');
            expect(questionString).toContain('❌ Respuestas incorrectas: Madrid, Roma, Londres');
            expect(questionString).toContain('📝 **Descripción:** Capital: París');
            expect(questionString).toContain('📸 **Imagen:** img1.jpg');
        });

        it('should handle empty descriptions and images', () => {
            const respuestaCorrecta = { es: 'Respuesta correcta' };
            const preguntas = { es: '¿Cuál es la capital de Francia?' };
            const respuestasIncorrectas = { es: ['Madrid', 'Roma', 'Londres'] };
            const descripcion = [];
            const img = [];

            const question = new Question(respuestaCorrecta, preguntas, respuestasIncorrectas, descripcion, img);
            const questionString = question.toString();

            expect(questionString).toContain('📝 **Descripción:** No hay descripción disponible.');
            expect(questionString).toContain('📸 **Imagen:** No hay imagen disponible.');
        });

        it('should handle missing languages gracefully', () => {
            const respuestaCorrecta = { es: 'Respuesta correcta' };
            const preguntas = { es: '¿Cuál es la capital de Francia?' };
            const respuestasIncorrectas = { es: ['Madrid', 'Roma', 'Londres'] };
            const descripcion = [{ propiedad: 'Capital', valor: 'París' }];
            const img = ['img1.jpg'];

            const question = new Question(respuestaCorrecta, preguntas, respuestasIncorrectas, descripcion, img);

            const questionTextInEnglish = question.obtenerPreguntaPorIdioma()['en'];
            expect(questionTextInEnglish).toBeUndefined();
        });

        it('should handle multiple languages correctly', () => {
            const respuestaCorrecta = { es: 'Respuesta correcta', en: 'Correct answer' };
            const preguntas = { es: '¿Cuál es la capital de Francia?', en: 'What is the capital of France?' };
            const respuestasIncorrectas = { es: ['Madrid', 'Roma', 'Londres'], en: ['Madrid', 'Rome', 'London'] };
            const descripcion = [{ propiedad: 'Capital', valor: 'París' }];
            const img = ['img1.jpg'];

            const question = new Question(respuestaCorrecta, preguntas, respuestasIncorrectas, descripcion, img);

            const questionTextEs = question.obtenerPreguntaPorIdioma()['es'];
            const questionTextEn = question.obtenerPreguntaPorIdioma()['en'];

            expect(questionTextEs).toBe('¿Cuál es la capital de Francia?');
            expect(questionTextEn).toBe('What is the capital of France?');
        });

        it('should handle empty question and answer arrays', () => {
            const respuestaCorrecta = { es: '', en: '' };
            const preguntas = { es: '', en: '' };
            const respuestasIncorrectas = { es: [], en: [] };
            const descripcion = [];
            const img = [];

            const question = new Question(respuestaCorrecta, preguntas, respuestasIncorrectas, descripcion, img);

            const questionTextEs = question.obtenerPreguntaPorIdioma()['es'];
            const questionTextEn = question.obtenerPreguntaPorIdioma()['en'];

            expect(questionTextEs).toBe('');
            expect(questionTextEn).toBe('');
        });
    });

});
