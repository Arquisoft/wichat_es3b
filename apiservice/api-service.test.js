const request = require("supertest");
const axios = require("axios");
const fs = require("fs");
const YAML = require("yaml");

// Mockear módulos
jest.mock("axios");
jest.mock("fs");
jest.mock("yaml");

// Mockear express-prom-bundle para evitar conflictos con las métricas
jest.mock("express-prom-bundle", () => {
    return () => (req, res, next) => next();
});

describe("API Service", () => {
    let app;
    const originalConsoleLog = console.log;

    beforeEach(() => {
        // Restaurar console.log
        console.log = originalConsoleLog;

        // Limpiar la caché de módulos para empezar cada test con un estado fresco
        jest.resetModules();

        // Configurar mocks por defecto
        fs.existsSync = jest.fn().mockReturnValue(true);
        fs.readFileSync = jest.fn().mockReturnValue("mockYamlContent");
        YAML.parse = jest.fn().mockReturnValue({
            servers: [
                { description: "Development server", url: "http://localhost:8000" },
                { description: "Production server", url: "http://192.168.1.100:8000" }
            ]
        });

        // Mockear respuestas exitosas de axios por defecto
        axios.get.mockImplementation((url) => {
            if (url.includes("/health")) {
                return Promise.resolve({ data: { status: "OK" } });
            } else if (url.includes("/questions/")) {
                return Promise.resolve({ data: { questions: [] } });
            } else if (url.includes("/getstats/")) {
                return Promise.resolve({ data: { stats: {} } });
            }
            return Promise.resolve({ data: {} });
        });

        // Cargar el servicio API después de configurar los mocks
        app = require("./api-service");
    });

    afterEach(() => {
        // Cerrar el servidor después de cada test
        app.close();

        // Limpiar todos los mocks
        jest.clearAllMocks();
    });

    // Test del endpoint health
    it("should return OK status when gateway service is available", async () => {
        const response = await request(app).get("/health");

        expect(response.statusCode).toBe(200);
        expect(response.body.status).toBe("OK");
        expect(axios.get).toHaveBeenCalledWith(expect.stringContaining("/health"));
    });

    it("should return WARNING status when gateway service is unavailable", async () => {
        // Mockear fallo en el gateway
        axios.get.mockImplementationOnce(() => {
            return Promise.reject(new Error("Gateway unavailable"));
        });

        const response = await request(app).get("/health");

        expect(response.statusCode).toBe(500);
        expect(response.body.status).toBe("WARNING");
        expect(response.body.message).toContain("API service is running but gateway service is unavailable");
    });

    // Test del endpoint questions
    it("should return questions data", async () => {
        const mockQuestions = { questions: [{ id: 1, question: "Test question" }] };
        axios.get.mockImplementationOnce(() => {
            return Promise.resolve({ data: mockQuestions });
        });

        const response = await request(app).get("/questions/5");

        expect(response.statusCode).toBe(200);
        expect(response.body).toEqual(mockQuestions);
        expect(axios.get).toHaveBeenCalledWith(expect.stringContaining("/questions/5"));
    });

    it("should handle error from questions endpoint", async () => {
        axios.get.mockImplementationOnce(() => {
            return Promise.reject({
                response: {
                    status: 404,
                    data: { error: "Questions not found" }
                }
            });
        });

        const response = await request(app).get("/questions/99");

        expect(response.statusCode).toBe(404);
        expect(response.body.error).toBe("Questions not found");
    });

    it("should handle network error from questions endpoint", async () => {
        axios.get.mockImplementationOnce(() => {
            return Promise.reject(new Error("Network error"));
        });

        const response = await request(app).get("/questions/5");

        expect(response.statusCode).toBe(500);
        expect(response.body.error).toBe("Network error");
    });

    // Test del endpoint getstats
    it("should return user stats data", async () => {
        const mockStats = { stats: { score: 100, completed: 10 } };
        axios.get.mockImplementationOnce(() => {
            return Promise.resolve({ data: mockStats });
        });

        const response = await request(app).get("/getstats/testuser");

        expect(response.statusCode).toBe(200);
        expect(response.body).toEqual(mockStats);
        expect(axios.get).toHaveBeenCalledWith(expect.stringContaining("/getstats/testuser"));
    });

    it("should handle error from getstats endpoint", async () => {
        axios.get.mockImplementationOnce(() => {
            return Promise.reject({
                response: {
                    status: 404,
                    data: { error: "User not found" }
                }
            });
        });

        const response = await request(app).get("/getstats/unknownuser");

        expect(response.statusCode).toBe(404);
        expect(response.body.error).toBe("User not found");
    });

    it("should handle network error from getstats endpoint", async () => {
        axios.get.mockImplementationOnce(() => {
            return Promise.reject(new Error("Network error"));
        });

        const response = await request(app).get("/getstats/testuser");

        expect(response.statusCode).toBe(500);
        expect(response.body.error).toBe("Network error");
    });

    // Tests de configuración OpenAPI
    it("should configure OpenAPI documentation when file exists", () => {
        // Ya configurado en beforeEach, verificar que se llamaron las funciones correctas
        expect(fs.existsSync).toHaveBeenCalledWith("./openapi.yaml");
        expect(fs.readFileSync).toHaveBeenCalledWith("./openapi.yaml", "utf8");
        expect(YAML.parse).toHaveBeenCalled();
    });

    it("should log message when OpenAPI file is not found", () => {
        // Cerrar la app existente
        app.close();

        // Mockear fs.existsSync para simular archivo no encontrado
        fs.existsSync.mockReturnValueOnce(false);

        // Espiar console.log
        console.log = jest.fn();

        // Reiniciar el servicio
        app = require("./api-service");

        expect(console.log).toHaveBeenCalledWith("No se encontró el archivo de configuración OpenAPI.");
    });

    // Test para verificar uso del puerto correcto
    it("should use the configured port", () => {
        console.log = jest.fn();

        // Cerrar la app existente
        app.close();

        // Reiniciar el servicio
        app = require("./api-service");

        expect(console.log).toHaveBeenCalledWith(expect.stringContaining("8006"));
    });

    // Test para verificar configuración de CORS y middleware
    it("should have CORS middleware configured", async () => {
        const response = await request(app)
            .get("/health")
            .set("Origin", "http://example.com");

        expect(response.headers["access-control-allow-origin"]).toBeTruthy();
    });

    // Test para verificar custom environment variable
    it("should use custom gateway URL when environment variable is set", () => {
        // Cerrar la app existente
        app.close();

        // Configurar una variable de entorno personalizada
        const originalEnv = process.env.GATEWAY_SERVICE_URL;
        process.env.GATEWAY_SERVICE_URL = "http://custom-gateway:9000";

        // Reiniciar el servicio
        app = require("./api-service");

        // Hacer una solicitud para verificar que se use la URL personalizada
        return request(app)
            .get("/health")
            .then(() => {
                expect(axios.get).toHaveBeenCalledWith("http://custom-gateway:9000/health");

                // Restaurar la variable de entorno
                process.env.GATEWAY_SERVICE_URL = originalEnv;
            });
    });
});