const express = require("express");
const axios = require("axios");
const cors = require("cors");
const swaggerUi = require("swagger-ui-express");
const fs = require("fs");
const YAML = require("yaml");
const promBundle = require("express-prom-bundle");

const app = express();
const port = 8006; // Nuevo puerto para el API service

// URL del gateway service
const gatewayServiceUrl = process.env.GATEWAY_SERVICE_URL || "http://localhost:8000";

app.use(cors());
app.use(express.json());

// Configuración de Prometheus
const metricsMiddleware = promBundle({ includeMethod: true });
app.use(metricsMiddleware);

// Health check endpoint
app.get("/health", async (req, res) => {
    try {
        // Verificar el estado del gateway service
        const gatewayHealth = await axios.get(`${gatewayServiceUrl}/health`);
        res.status(200).json({ status: "OK", gateway: gatewayHealth.data });
    } catch (error) {
        res.status(500).json({
            status: "WARNING",
            message: "API service is running but gateway service is unavailable",
            error: error.message
        });
    }
});

// Questions endpoint
app.get('/questions/:n/:topic?', async (req, res) => {
    try {
        const { n, topic } = req.params;
        let queryString = `questions?n=${n}`;
        if (topic) {
            queryString += `&topic=${encodeURIComponent(topic)}`;
        }
        // Redirigir la solicitud al gateway service
        const response = await axios.get(`${gatewayServiceUrl}/${queryString}`);
        res.status(200).json(response.data);
    } catch (error) {
        if (error.response) {
            // El servidor respondió con un status code fuera del rango 2xx
            res.status(error.response.status).json({
                error: error.response.data?.error || "Request failed"
            });
        } else if (error.request) {
            // La solicitud fue hecha pero no se recibió respuesta
            res.status(500).json({
                error: "Network error"
            });
        } else {
            // Error en la configuración de la solicitud
            res.status(500).json({
                error: error.message
            });
        }
    }
});

// Get user stats endpoint
app.get('/getstats/:username', async (req, res) => {
    try {
        const { username } = req.params;
        // Redirigir la solicitud al gateway service
        const response = await axios.get(`${gatewayServiceUrl}/getstats/${username}`);
        res.status(200).json(response.data);
    } catch (error) {
        if (error.response) {
            // El servidor respondió con un status code fuera del rango 2xx
            res.status(error.response.status).json({
                error: error.response.data?.error || "Request failed"
            });
        } else if (error.request) {
            // La solicitud fue hecha pero no se recibió respuesta
            res.status(500).json({
                error: "Network error"
            });
        } else {
            // Error en la configuración de la solicitud
            res.status(500).json({
                error: error.message
            });
        }
    }
});

// Cargar y configurar la documentación OpenAPI
let swaggerDocument;
const openapiPath = "./openapi.yaml";

try {
    if (fs.existsSync(openapiPath)) {
        const file = fs.readFileSync(openapiPath, "utf8");
        swaggerDocument = YAML.parse(file);

        // Actualizar la URL del servidor a la del API service
        if (swaggerDocument && swaggerDocument.servers) {
            swaggerDocument.servers.forEach((server, index) => {
                if (server.description === "Development server") {
                    swaggerDocument.servers[index].url = `http://localhost:${port}`;
                } else if (server.description === "Production server") {
                    // Mantener la IP pero cambiar el puerto
                    const url = server.url.split(':');
                    swaggerDocument.servers[index].url = `${url[0]}:${url[1]}:${port}`;
                }
            });
        }

        // Servir la documentación en la ruta /api-doc
        app.use("/api-doc", swaggerUi.serve, swaggerUi.setup(swaggerDocument));
    } else {
        console.log("No se encontró el archivo de configuración OpenAPI.");
    }
} catch (err) {
    console.log(`Error al configurar OpenAPI: ${err.message}`);
}

// Iniciar el servicio API
let server;
if (process.env.NODE_ENV !== 'test') {
    server = app.listen(port, () => {
        console.log(`API Service listening at http://localhost:${port}`);
        console.log(`API Documentation available at http://localhost:${port}/api-doc`);
    });
} else {
    // Solo imprimir el mensaje para el test pero no iniciar el servidor
    console.log(`API Service listening at http://localhost:${port}`);
}

// Exportar un objeto con métodos para el servidor y la app
module.exports = {
    app,
    close: () => {
        if (server) {
            return server.close();
        }
        return null;
    },
    // Metodo para iniciar el servidor explícitamente en pruebas
    listen: () => {
        if (!server) {
            server = app.listen(port);
        }
        return server;
    }
};