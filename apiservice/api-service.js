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
const gatewayServiceUrl = process.env.GATEWAY_SERVICE_URL || "http://xxxxxx:8000";

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
        res.json({ status: "OK", gateway: gatewayHealth.data });
    } catch (error) {
        res.status(500).json({
            status: "WARNING",
            message: "API service is running but gateway service is unavailable",
            error: error.message
        });
    }
});

// Questions endpoint
app.get('/questions/:n', async (req, res) => {
    try {
        const { n } = req.params;
        // Redirigir la solicitud al gateway service
        const response = await axios.get(`${gatewayServiceUrl}/questions/${n}`);
        res.json(response.data);
    } catch (error) {
        res.status(error.response ? error.response.status : 500).json({
            error: error.response ? error.response.data.error : error.message
        });
    }
});

// Get user stats endpoint
app.get('/getstats/:username', async (req, res) => {
    try {
        const { username } = req.params;
        // Redirigir la solicitud al gateway service
        const response = await axios.get(`${gatewayServiceUrl}/getstats/${username}`);
        res.json(response.data);
    } catch (error) {
        res.status(error.response ? error.response.status : 500).json({
            error: error.response ? error.response.data.error : error.message
        });
    }
});

// Cargar y configurar la documentación OpenAPI
const openapiPath = "./openapi.yaml";
if (fs.existsSync(openapiPath)) {
    const file = fs.readFileSync(openapiPath, "utf8");
    const swaggerDocument = YAML.parse(file);

    // Actualizar la URL del servidor a la del API service
    swaggerDocument.servers.forEach((server, index) => {
        if (server.description === "Development server") {
            swaggerDocument.servers[index].url = `http://localhost:${port}`;
        } else if (server.description === "Production server") {
            // Mantener la IP pero cambiar el puerto
            const url = server.url.split(':');
            swaggerDocument.servers[index].url = `${url[0]}:${url[1]}:${port}`;
        }
    });

    // Servir la documentación en la ruta /api-doc
    app.use("/api-doc", swaggerUi.serve, swaggerUi.setup(swaggerDocument));
} else {
    console.log("No se encontró el archivo de configuración OpenAPI.");
}

// Iniciar el servicio API
const server = app.listen(port, () => {
    console.log(`API Service listening at http://localhost:${port}`);
    console.log(`API Documentation available at http://localhost:${port}/api-doc`);
});

module.exports = server;