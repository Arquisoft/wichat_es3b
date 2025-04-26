const request = require("supertest");
// Import axios BEFORE mocking
const axios = require("axios");
const fs = require("fs");
const YAML = require("yaml");
const path = require('path');

// --- Mocking Modules ---
// Mock entire modules used by api-service
jest.mock("axios");
jest.mock("fs");
jest.mock("yaml");
jest.mock("express-prom-bundle", () => jest.fn(() => (req, res, next) => next()));
// Mock swagger-ui-express to prevent actual UI setup
jest.mock("swagger-ui-express", () => ({
    serve: [],
    setup: () => (req, res) => {
        res.status(200).send("Swagger UI");
    }
}));

// --- Global Test Variables ---
let currentApiService; // Holds the required module exports { app, listen, close, ... }
let currentApp;      // Holds the express app instance for supertest
let currentServer;   // Holds the server instance returned by listen() for closing
const defaultGatewayUrl = "http://localhost:8000";
const validApiKey = process.env.TEST_OWN_API_KEY || "default-test-key-for-local-dev";

// Function to setup default mocks for fs/YAML (used after reset)
const setupDefaultFsYamlMocks = () => {
    fs.existsSync.mockReturnValue(true);
    fs.readFileSync.mockReturnValue(`
openapi: 3.0.0
info:
  title: Mock API
  version: 1.0.0
servers:
  - url: http://localhost:8006
    description: Development server
  - url: https://production-api.example.com:443
    description: Production server
paths: {}
`);
    const mockSwaggerDoc = {
        openapi: '3.0.0',
        info: { title: 'Mock API', version: '1.0.0' },
        servers: [
            { url: 'http://localhost:8006', description: 'Development server' },
            { url: 'https://production-api.example.com:443', description: 'Production server' }
        ],
        paths: {}
    };
    YAML.parse.mockReturnValue(mockSwaggerDoc);
};

// --- Test Suite ---
describe("API Service", () => {
    // Store originals
    const originalConsoleLog = console.log;
    const originalConsoleError = console.error;
    const originalGatewayUrlEnv = process.env.GATEWAY_SERVICE_URL;
    const originalPortEnv = process.env.PORT;
    const originalNodeEnv = process.env.NODE_ENV;

    beforeAll(() => {
        // Suppress console logs/errors unless debugging
        // console.log = jest.fn();
        // console.error = jest.fn();
    });

    afterAll(() => {
        // Restore original console and environment variables
        console.log = originalConsoleLog;
        console.error = originalConsoleError;
        process.env.GATEWAY_SERVICE_URL = originalGatewayUrlEnv;
        process.env.PORT = originalPortEnv;
        process.env.NODE_ENV = originalNodeEnv;
    });

    // Setup and teardown for most tests (those not needing module reload)
    beforeEach(async () => {
        // Reset mocks for isolation BEFORE requiring the service
        jest.resetAllMocks();
        setupDefaultFsYamlMocks(); // Apply default fs/YAML mocks

        // Require the service (uses default env vars)
        currentApiService = require("./api-service");
        currentApp = currentApiService.app;
        // Start the server explicitly if needed by tests (supertest often doesn't need it listening)
        // currentServer = await currentApiService.listen(); // Optional: Start server if tests require it
    });

    afterEach(async () => {
        // Close the server if it was started
        if (currentApiService && typeof currentApiService.close === 'function') {
            // Check if server instance exists before closing
            // This check might be needed depending on whether beforeEach started the server
            // if (currentServer && currentServer.listening) {
            await currentApiService.close().catch(err => console.error("Error during afterEach close:", err));
            // }
        }
        currentApiService = null;
        currentApp = null;
        currentServer = null;
        // Clear only mock call history, not implementations set in beforeEach/test
        axios.get.mockClear();
        fs.existsSync.mockClear();
        fs.readFileSync.mockClear();
        YAML.parse.mockClear();
    });


    // --- Test Cases ---

    describe("Basic Setup and Health Check", () => {
        it("should initialize the server and respond to basic requests", async () => {
            // App is loaded in beforeEach
            const response = await request(currentApp).get("/nonexistentpath");
            expect(response.status).toBe(404);
        });

        it("should call the gateway health endpoint on /health and return 200 on success", async () => {
            const mockGatewayHealth = { status: "GATEWAY_OK", timestamp: Date.now() };
            // Set the specific mock for THIS test
            axios.get.mockResolvedValueOnce({ data: mockGatewayHealth });

            const response = await request(currentApp).get("/health");

            expect(response.status).toBe(200);
            // Check the response body structure matches the expected output
            expect(response.body).toEqual({ status: "OK", gateway: mockGatewayHealth });
            expect(axios.get).toHaveBeenCalledTimes(1);
            expect(axios.get).toHaveBeenCalledWith(`${defaultGatewayUrl}/health`);
        });

        it("should handle gateway unavailability correctly during /health check (return 503)", async () => {
            const networkError = new Error("ECONNREFUSED Network Error");
            networkError.request = {}; // Simulate connection error
            // Set the specific mock for THIS test
            axios.get.mockRejectedValueOnce(networkError);

            const response = await request(currentApp).get("/health");

            expect(response.status).toBe(503); // Expect 503 based on service logic
            expect(response.body.status).toBe("WARNING");
            expect(response.body.message).toContain("could not confirm gateway status");
            expect(response.body.gateway_error).toBe("ECONNREFUSED Network Error");
            expect(axios.get).toHaveBeenCalledTimes(1);
            expect(axios.get).toHaveBeenCalledWith(`${defaultGatewayUrl}/health`);
        });

        it("should handle other gateway errors during /health check (return 500)", async () => {
            const gatewayError = { response: { status: 502, data: "Bad Gateway" } };
            // Set the specific mock for THIS test
            axios.get.mockRejectedValueOnce(gatewayError);

            const response = await request(currentApp).get("/health");

            expect(response.status).toBe(500); // Expect 500 for non-network errors in health
            expect(response.body.status).toBe("WARNING");
            expect(response.body.message).toContain("could not confirm gateway status");
            expect(response.body.gateway_error).toBeDefined(); // Raw error message might be complex
            expect(axios.get).toHaveBeenCalledTimes(1);
            expect(axios.get).toHaveBeenCalledWith(`${defaultGatewayUrl}/health`);
        });
    });

    describe("API Key Validation Middleware", () => {
        it("should return 401 when API key is missing", async () => {
            const response = await request(currentApp).get("/questions/5");

            expect(response.status).toBe(401);
            expect(response.body.error).toBe("API key is required");
            expect(axios.get).not.toHaveBeenCalled(); // No call to gateway should happen
        });

        it("should return 401 when API key is invalid", async () => {
            // Mock validate-apikey gateway response for invalid key
            axios.get.mockResolvedValueOnce({ data: { isValid: false } });

            const response = await request(currentApp)
                .get("/questions/5")
                .set("x-api-key", "invalid-key");

            expect(response.status).toBe(401);
            expect(response.body.error).toBe("Invalid API key");
            expect(axios.get).toHaveBeenCalledTimes(1);
            expect(axios.get).toHaveBeenCalledWith(`${defaultGatewayUrl}/validate-apikey/invalid-key`);
        });

        it("should return 500 when API key validation fails due to gateway error", async () => {
            // Mock validate-apikey gateway error
            axios.get.mockRejectedValueOnce(new Error("Gateway error"));

            const response = await request(currentApp)
                .get("/questions/5")
                .set("x-api-key", validApiKey);

            expect(response.status).toBe(500);
            expect(response.body.error).toBe("Internal server error");
            expect(axios.get).toHaveBeenCalledTimes(1);
            expect(axios.get).toHaveBeenCalledWith(`${defaultGatewayUrl}/validate-apikey/${validApiKey}`);
        });

        it("should proceed when API key is valid", async () => {
            // Mock validate-apikey gateway response for valid key
            axios.get.mockResolvedValueOnce({ data: { isValid: true } });
            // Mock the actual questions endpoint response
            axios.get.mockResolvedValueOnce({ data: [{ id: 1, text: "Question 1?" }] });

            const response = await request(currentApp)
                .get("/questions/5")
                .set("x-api-key", validApiKey);

            expect(response.status).toBe(200);
            expect(axios.get).toHaveBeenCalledTimes(2);
            expect(axios.get.mock.calls[0][0]).toBe(`${defaultGatewayUrl}/validate-apikey/${validApiKey}`);
            expect(axios.get.mock.calls[1][0]).toBe(`${defaultGatewayUrl}/questions?n=5`);
        });
    });

    describe("Questions Endpoint", () => {
        // Set up the valid API key mock before each test in this group
        beforeEach(() => {
            // First axios call will be for API key validation
            axios.get.mockResolvedValueOnce({ data: { isValid: true } });
        });

        it("should forward questions request with correct parameters (no topic) and return 200", async () => {
            const mockQuestions = [{ id: 1, text: "Question 1?" }];
            // Set the specific mock for THIS test (second axios call)

            axios.get.mockResolvedValueOnce({ data: mockQuestions });

            const response = await request(currentApp)
                .get("/questions/5")
                .set("x-api-key", validApiKey);

            expect(response.status).toBe(200);
            expect(response.body).toEqual(mockQuestions); // Expect the actual questions array
            expect(axios.get).toHaveBeenCalledTimes(2); // API key validation + questions
            expect(axios.get.mock.calls[1][0]).toBe(`${defaultGatewayUrl}/questions?n=5`);
        });

        it("should forward questions request with topic parameter and return 200", async () => {
            const mockHistoryQuestions = [{ id: 2, text: "History Q?" }];
            // Set the specific mock for THIS test (second axios call)
            axios.get.mockResolvedValueOnce({ data: mockHistoryQuestions });

            const response = await request(currentApp)
                .get("/questions/10/history")
                .set("x-api-key", validApiKey);

            expect(response.status).toBe(200);
            expect(response.body).toEqual(mockHistoryQuestions); // Expect the actual questions array
            expect(axios.get).toHaveBeenCalledTimes(2); // API key validation + questions
            expect(axios.get.mock.calls[1][0]).toBe(`${defaultGatewayUrl}/questions?n=10&topic=history`);
        });

        it("should handle gateway response error (e.g., 404) correctly", async () => {
            const errorResponse = {
                message: "Request failed with status code 404",
                response: { status: 404, data: { message: 'Not Found from Gateway - Test' } },
                isAxiosError: true, request: {}, config: {}
            };
            // Set the specific mock for THIS test (second axios call)
            axios.get.mockRejectedValueOnce(errorResponse);

            const response = await request(currentApp)
                .get("/questions/99/nonexistent")
                .set("x-api-key", validApiKey);

            expect(response.status).toBe(404); // Expect 404
            expect(response.body.error).toContain("Gateway Error: 404");
            expect(response.body.message).toBe('Not Found from Gateway - Test');
            expect(axios.get).toHaveBeenCalledTimes(2); // API key validation + questions
            expect(axios.get.mock.calls[1][0]).toBe(`${defaultGatewayUrl}/questions?n=99&topic=nonexistent`);
        });

        it("should handle gateway connection error correctly (return 503)", async () => {
            const connectionError = new Error("ECONNREFUSED connection refused");
            connectionError.request = {};
            connectionError.isAxiosError = true; config: {};
            // Set the specific mock for THIS test (second axios call)
            axios.get.mockRejectedValueOnce(connectionError);

            const response = await request(currentApp)
                .get("/questions/5/any")
                .set("x-api-key", validApiKey);

            expect(response.status).toBe(503); // Expect 503
            expect(response.body.error).toBe("Gateway service unavailable");
            expect(response.body.message).toContain("ECONNREFUSED connection refused");
            expect(axios.get).toHaveBeenCalledTimes(2); // API key validation + questions
            expect(axios.get.mock.calls[1][0]).toBe(`${defaultGatewayUrl}/questions?n=5&topic=any`);
        });

        it("should handle non-axios errors correctly (return 500)", async () => {
            const genericError = new Error("Something broke unexpectedly");
            // Set the specific mock for THIS test (second axios call)
            axios.get.mockRejectedValueOnce(genericError);

            const response = await request(currentApp)
                .get("/questions/5/any")
                .set("x-api-key", validApiKey);

            expect(response.status).toBe(500); // Expect 500
            expect(response.body.error).toBe("Internal server error");
            expect(response.body.message).toBe("Something broke unexpectedly");
            expect(axios.get).toHaveBeenCalledTimes(2); // API key validation + questions
            expect(axios.get.mock.calls[1][0]).toBe(`${defaultGatewayUrl}/questions?n=5&topic=any`);
        });
    });

    describe("Get Stats Endpoint", () => {
        // Set up the valid API key mock before each test in this group
        beforeEach(() => {
            // First axios call will be for API key validation
            axios.get.mockResolvedValueOnce({ data: { isValid: true } });
        });

        it("should forward getstats request with correct username and return 200", async () => {
            const mockStats = { username: "testuser", score: 42, completed: 5 };
            // Set the specific mock for THIS test (second axios call)
            axios.get.mockResolvedValueOnce({ data: mockStats });

            const response = await request(currentApp)
                .get("/getstats/testuser")
                .set("x-api-key", validApiKey);

            expect(response.status).toBe(200);
            expect(response.body).toEqual(mockStats); // Expect the actual stats object
            expect(axios.get).toHaveBeenCalledTimes(2); // API key validation + getstats
            expect(axios.get.mock.calls[1][0]).toBe(`${defaultGatewayUrl}/getstats/testuser`);
        });

        it("should handle gateway response error for getstats correctly", async () => {
            const errorResponse = {
                message: "Request failed with status code 404",
                response: { status: 404, data: { message: 'User not found' } },
                isAxiosError: true, request: {}, config: {}
            };
            // Set the specific mock for THIS test (second axios call)
            axios.get.mockRejectedValueOnce(errorResponse);

            const response = await request(currentApp)
                .get("/getstats/nonexistentuser")
                .set("x-api-key", validApiKey);

            expect(response.status).toBe(404); // Expect 404
            expect(response.body.error).toContain("Gateway Error: 404");
            expect(response.body.message).toBe('User not found');
            expect(axios.get).toHaveBeenCalledTimes(2); // API key validation + getstats
            expect(axios.get.mock.calls[1][0]).toBe(`${defaultGatewayUrl}/getstats/nonexistentuser`);
        });

        it("should handle gateway connection error for getstats correctly", async () => {
            const connectionError = new Error("ECONNREFUSED connection refused");
            connectionError.request = {};
            connectionError.isAxiosError = true; config: {};
            // Set the specific mock for THIS test (second axios call)
            axios.get.mockRejectedValueOnce(connectionError);

            const response = await request(currentApp)
                .get("/getstats/anyuser")
                .set("x-api-key", validApiKey);

            expect(response.status).toBe(503); // Expect 503
            expect(response.body.error).toBe("Gateway service unavailable");
            expect(response.body.message).toContain("ECONNREFUSED connection refused");
            expect(axios.get).toHaveBeenCalledTimes(2); // API key validation + getstats
            expect(axios.get.mock.calls[1][0]).toBe(`${defaultGatewayUrl}/getstats/anyuser`);
        });
    });

    describe("Stats Endpoint", () => {
        it("should forward stats request with correct username and return 200", async () => {
            const mockStats = { username: "testuser", stats: { score: 100, rank: 1 } };

            axios.get.mockResolvedValueOnce({ data: mockStats });

            const response = await request(currentApp).get("/getstats/testuser");

            expect(response.status).toBe(200);
            expect(response.body).toEqual(mockStats); // Expect the actual stats object
            expect(axios.get).toHaveBeenCalledTimes(1);
            expect(axios.get).toHaveBeenCalledWith(`${defaultGatewayUrl}/getstats/testuser`);
        });

        it("should handle gateway response error (e.g., 404) correctly", async () => {
            const errorResponse = {
                message: "Request failed with status code 404",
                response: { status: 404, data: { message: "User not found" } },
                isAxiosError: true, request: {}, config: {}
            };

            axios.get.mockRejectedValueOnce(errorResponse);

            const response = await request(currentApp).get("/getstats/nonexistentuser");

            expect(response.status).toBe(404); // Expect 404
            expect(response.body.error).toContain("Gateway Error: 404");
            expect(response.body.message).toBe("User not found");
            expect(axios.get).toHaveBeenCalledTimes(1);
            expect(axios.get).toHaveBeenCalledWith(`${defaultGatewayUrl}/getstats/nonexistentuser`);
        });
    });

    // --- Tests requiring module reload ---
    // Use describe.each or separate describes if preferred
    describe("OpenAPI Configuration with Module Reload", () => {
        // These tests need careful setup/teardown for module reloading

        let serviceForTest;
        let appForTest;
        const originalPort = process.env.PORT;

        afterEach(async () => {
            // Ensure server is closed and env vars restored
            if (serviceForTest && typeof serviceForTest.close === 'function') {
                await serviceForTest.close().catch(err => console.error("Error closing serviceForTest:", err));
            }
            serviceForTest = null;
            appForTest = null;
            process.env.PORT = originalPort; // Restore original port
            // Reset modules again to not affect subsequent non-reload tests
            jest.resetModules();
        });

        it("should serve OpenAPI documentation at /api-doc", async () => {
            // Reset, mock, require
            jest.resetModules();

            // Mock necessary modules
            jest.mock("axios");
            jest.mock("express-prom-bundle", () => jest.fn(() => (req, res, next) => next()));

            // Simular el middleware de swagger-ui-express con mayor precisión
            // La clave es que mockSwaggerSetup debe devolver un middleware que responde con 200
            const mockMiddleware = (req, res) => {
                res.status(200).send("Swagger UI");
            };
            const mockSwaggerSetup = jest.fn().mockReturnValue(mockMiddleware);

            jest.mock("swagger-ui-express", () => ({
                serve: [(req, res, next) => next()], // Middleware array que solo pasa al siguiente
                setup: mockSwaggerSetup
            }));

            // Configurar mocks de fs y YAML
            const fs = require('fs');
            jest.mock('fs');
            fs.existsSync = jest.fn().mockReturnValue(true);
            fs.readFileSync = jest.fn().mockReturnValue('valid yaml content');

            // Asegurarnos de que YAML.parse devuelva un objeto válido
            const YAML = require('yaml');
            jest.mock('yaml');
            YAML.parse = jest.fn().mockReturnValue({
                openapi: '3.0.0',
                info: { title: 'Mock API', version: '1.0.0' },
                servers: [
                    { url: 'http://localhost:8006', description: 'Development server' }
                ],
                paths: {}
            });

            // Importar el servicio de API después de configurar todos los mocks
            const serviceForTest = require("./api-service");
            const appForTest = serviceForTest.app;

            // Verificar que el middleware de Swagger haya sido configurado en app
            // Enviar una solicitud a /api-doc
            const response = await request(appForTest).get("/api-doc");

            // Verificar que la respuesta sea correcta
            expect(response.status).toBe(200);
            expect(response.text).toContain("Swagger UI");

            // Verificar que mockSwaggerSetup fue llamado durante la carga del módulo
            expect(mockSwaggerSetup).toHaveBeenCalled();
        });

        it("should handle OpenAPI configuration file not found (return 404)", async () => {
            // Reset modules first
            jest.resetModules();

            // --- Mock fs specifically for this scenario ---
            const mockFs = {
                existsSync: jest.fn().mockReturnValue(false), // File doesn't exist
                readFileSync: jest.fn(), // Should not be called
            };
            jest.mock('fs', () => mockFs);
            jest.mock("axios"); // Need to mock other dependencies too
            jest.mock("yaml");
            jest.mock("express-prom-bundle", () => jest.fn(() => (req, res, next) => next()));
            // --- End Mock fs ---

            serviceForTest = require("./api-service"); // Reload service with the specific mock
            appForTest = serviceForTest.app;

            expect(mockFs.existsSync).toHaveBeenCalledWith(expect.stringContaining('openapi.yaml'));
            expect(mockFs.readFileSync).not.toHaveBeenCalled();

            const response = await request(appForTest).get("/api-doc");
            expect(response.status).toBe(404);
            expect(response.text).toContain("API Documentation configuration file not found");
        });

        it("should handle errors during OpenAPI YAML parsing (return 500)", async () => {
            // Reset modules first
            jest.resetModules();

            // --- Mock fs and YAML specifically ---
            const mockFs = {
                existsSync: jest.fn().mockReturnValue(true),
                readFileSync: jest.fn().mockReturnValue("invalid: yaml: content"),
            };
            const mockYaml = {
                parse: jest.fn().mockImplementation(() => { throw new Error("Mock YAML Parse Error"); }),
            };
            jest.mock('fs', () => mockFs);
            jest.mock('yaml', () => mockYaml);
            jest.mock("axios");
            jest.mock("express-prom-bundle", () => jest.fn(() => (req, res, next) => next()));
            // --- End Mocks ---

            serviceForTest = require("./api-service"); // Reload
            appForTest = serviceForTest.app;

            expect(mockFs.existsSync).toHaveBeenCalled();
            expect(mockFs.readFileSync).toHaveBeenCalled();
            expect(mockYaml.parse).toHaveBeenCalled();

            const response = await request(appForTest).get("/api-doc");
            expect(response.status).toBe(500);
            expect(response.text).toContain("API Documentation could not be loaded");
        });
    });

    describe("Environment Variable Usage with Module Reload", () => {
        let serviceForTest;
        let appForTest;
        const originalGatewayUrl = process.env.GATEWAY_SERVICE_URL;

        afterEach(async () => {
            // Ensure server is closed and env vars restored
            if (serviceForTest && typeof serviceForTest.close === 'function') {
                await serviceForTest.close().catch(err => console.error("Error closing serviceForTest:", err));
            }
            serviceForTest = null;
            appForTest = null;
            process.env.GATEWAY_SERVICE_URL = originalGatewayUrl; // Restore original GW URL
            // Reset modules again
            jest.resetModules();
        });

        it("should use custom gateway URL from environment variable", async () => {
            const customGatewayUrl = "http://custom-gateway:9000";
            process.env.GATEWAY_SERVICE_URL = customGatewayUrl; // Set BEFORE reset/require

            // Reset modules, re-apply mocks, re-require service
            jest.resetModules();
            jest.mock("axios"); // Crucial: Re-mock axios AFTER reset
            setupDefaultFsYamlMocks(); // Re-apply other mocks if needed
            jest.mock("express-prom-bundle", () => jest.fn(() => (req, res, next) => next())); // Re-mock promBundle

            // Now require the service, it will pick up the new env var
            serviceForTest = require("./api-service");
            appForTest = serviceForTest.app;

            // Configure the axios mock AFTER requiring the service and getting the app
            const mockHealthData = { status: "CUSTOM_GATEWAY_OK" };
            // IMPORTANT: Access the mocked axios directly, not via an old import
            const mockedAxios = require("axios");
            mockedAxios.get.mockResolvedValueOnce({ data: mockHealthData });

            // Make the request
            await request(appForTest).get("/health");

            // Verify axios was called with the CUSTOM URL
            expect(mockedAxios.get).toHaveBeenCalledTimes(1); // Check call count on the fresh mock
            expect(mockedAxios.get).toHaveBeenCalledWith(`${customGatewayUrl}/health`); // Check URL
        });
    });

    describe("Server Management Functions", () => {
        it("should properly start and close the server", async () => {
            // Test explicit server start
            const server = await currentApiService.listen();
            expect(server).toBeDefined();
            expect(server.listening).toBe(true);

            // Test server close
            await currentApiService.close();
            expect(server.listening).toBe(false);
        });

        it("should handle multiple close calls gracefully", async () => {
            // Start server
            await currentApiService.listen();

            // Close once
            await currentApiService.close();

            // Second close should not error
            await currentApiService.close();
            // If we got here without errors, the test passes
        });
    });

    describe("CORS Configuration", () => {
        // This test doesn't need module reload, uses standard beforeEach/afterEach
        it("should include CORS headers in the response", async () => {
            // Axios mock needed for the underlying /health call
            axios.get.mockResolvedValueOnce({ data: { status: "GATEWAY_OK" } });

            const response = await request(currentApp)
                .get("/health")
                .set("Origin", "http://example.com");

            expect(response.headers["access-control-allow-origin"]).toBe("*");
        });
    });



    describe("Server Lifecycle Tests", () => {
        let server;

        afterEach(async () => {
            // Asegurarse de cerrar el servidor después de cada prueba
            if (server) {
                await close();
                server = null;
            }
        });

        beforeEach(async () => {
            currentApiService = require("./api-service");
            app = currentApiService.app;
            close = currentApiService.close;
            listen = currentApiService.listen;
        });

        it("should start the server and listen on the specified port", async () => {
            // Iniciar el servidor
            server = listen();

            // Verificar que el servidor está escuchando
            const response = await request(app).get("/health");
            expect(response.status).toBe(200); // Suponiendo que el endpoint /health está configurado
        });

        it("should not start a new server if one is already running", async () => {
            // Iniciar el servidor por primera vez
            server = listen();

            // Intentar iniciar el servidor nuevamente
            const secondServer = listen();

            // Verificar que el mismo servidor fue devuelto
            expect(secondServer).toBe(server);
        });

        it("should close the server gracefully", async () => {
            // Iniciar el servidor
            server = listen();

            // Verify server is listening before closing
            expect(server.listening).toBe(true);

            // Cerrar el servidor
            await close();

            // Verify server is no longer listening
            expect(server.listening).toBe(false);
        });

        it("should handle errors when closing a non-running server", async () => {
            // Intentar cerrar el servidor sin haberlo iniciado
            await expect(close()).resolves.not.toThrow();
        });
    });
});