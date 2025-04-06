const express = require("express");
const axios = require("axios");
const cors = require("cors");
const swaggerUi = require("swagger-ui-express");
const fs = require("fs");
const YAML = require("yaml");
const promBundle = require("express-prom-bundle");
const path = require('path');

const app = express();

const port = 8006;
const gatewayServiceUrl = process.env.GATEWAY_SERVICE_URL || "http://localhost:8000";

app.use(cors());
app.use(express.json());

// Mocked in tests, real setup here
const metricsMiddleware = promBundle({ includeMethod: true });
app.use(metricsMiddleware);

// --- Helper function for consistent error handling ---
const handleAxiosError = (error, res) => {
    // Log the received error structure for debugging if needed
    // console.error('Handling Axios Error:', JSON.stringify(error, null, 2));

    if (error.response) {
        // Gateway responded with an error status code
        const status = error.response.status || 500; // Default to 500 if status is missing
        const message = error.response.data?.message || error.response.data || 'No additional message from gateway.';
        console.error(`Gateway Error Response: Status=${status}, Data=${JSON.stringify(error.response.data)}`);
        res.status(status).json({
            error: `Gateway Error: ${status}`,
            message: message
        });
    } else if (error.request) {
        // Request was made but no response received (network error)
        // Ensure this is a genuine network error, not just a rejected promise without a response
        console.error('Gateway Connection Error:', error.message);
        res.status(503).json({
            error: 'Gateway service unavailable',
            message: `The request to the gateway failed: ${error.message}` // Include Axios error message
        });
    } else {
        // Something else happened setting up the request or a non-Axios error
        console.error('Internal Server Error:', error.message, error.stack); // Log stack trace
        res.status(500).json({
            error: 'Internal server error',
            message: error.message || 'An unexpected error occurred.'
        });
    }
};

// --- Routes ---

// Health check endpoint
app.get("/health", async (req, res) => {
    try {
        console.log(`Performing health check towards: ${gatewayServiceUrl}/health`);
        const gatewayHealth = await axios.get(`${gatewayServiceUrl}/health`);
        // Ensure gatewayHealth.data exists before accessing it
        res.status(200).json({ status: "OK", gateway: gatewayHealth?.data || "No data received" });
    } catch (error) {
        // Simplified error handling for health check
        const errorMessage = error.message || "Unknown error";
        console.error("Health check failed to reach gateway:", errorMessage);
        // Provide a more specific message based on error type if possible
        const responseBody = {
            status: "WARNING",
            message: "API service is running but could not confirm gateway status.",
            // Send the raw error message from the underlying error
            gateway_error: errorMessage
        };
        // Determine status based on error type (basic check)
        if (error.request && !error.response) { // Likely network error
            res.status(503).json(responseBody); // Use 503 for network issues
        } else {
            res.status(500).json(responseBody); // Use 500 for other errors (including gateway 4xx/5xx)
        }
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
        const response = await axios.get(`${gatewayServiceUrl}/${queryString}`);
        // Ensure response.data exists before sending
        res.json(response?.data || {});
    } catch (error) {
        handleAxiosError(error, res);
    }
});

// Stats endpoint
app.get('/getstats/:username', async (req, res) => {
    try {
        const { username } = req.params;
        const requestUrl = `${gatewayServiceUrl}/getstats/${username}`;
        console.log(`Forwarding request to: ${requestUrl}`);
        const response = await axios.get(requestUrl);
        res.json(response?.data || {});
    } catch (error) {
        handleAxiosError(error, res);
    }
});


// --- OpenAPI Configuration ---
let swaggerDocument; // Keep swaggerDocument accessible
try {
    const openapiPath = path.join(__dirname, 'openapi.yaml');
    if (fs.existsSync(openapiPath)) {
        const file = fs.readFileSync(openapiPath, 'utf8');
        swaggerDocument = YAML.parse(file); // Assign to the outer variable

        // Dynamically update server URLs based on current environment/port
        if (swaggerDocument && swaggerDocument.servers && Array.isArray(swaggerDocument.servers)) {
            swaggerDocument.servers.forEach((server, index) => {
                try {
                    const serverUrl = new URL(server.url);
                    serverUrl.port = port; // Update port
                    swaggerDocument.servers[index].url = serverUrl.toString();
                    console.log(`Updated OpenAPI server URL (${server.description || index}) to: ${swaggerDocument.servers[index].url}`);
                } catch (urlError) {
                    console.error(`Could not parse or update server URL: ${server.url} - ${urlError.message}`);
                }
            });
        } else {
            console.log("No valid 'servers' array found in OpenAPI document to update.");
        }

        // Serve the updated documentation ONLY if swaggerDocument is valid
        if (swaggerDocument) {
            app.use("/api-doc", swaggerUi.serve, swaggerUi.setup(swaggerDocument));
            console.log(`API Documentation available at http://localhost:${port}/api-doc`);
        } else {
            throw new Error("Parsed Swagger document is invalid.");
        }

    } else {
        console.log(`OpenAPI configuration file not found at: ${openapiPath}`);
        // Add a placeholder route if file not found
        app.get("/api-doc", (req, res) => {
            res.status(404).send("API Documentation configuration file not found.");
        });
    }
} catch (err) {
    console.error(`Error configuring OpenAPI: ${err.message}`);
    app.get("/api-doc", (req, res) => {
        res.status(500).send("API Documentation could not be loaded due to a configuration error.");
    });
}

// --- Server Start ---
let server;

module.exports = {
    app,
    listen: (callback) => {
        // Prevent multiple listeners
        if (server && server.listening) {
            console.log(`Server already listening on port ${port}`);
            if (callback) process.nextTick(callback); // Ensure callback runs async
            return server;
        }
        server = app.listen(port, () => {
            console.log(`API Service listening at http://localhost:${port}`);
            if (callback) callback();
        });
        server.on('error', (err) => {
            console.error("Server failed to start:", err);
            server = null; // Reset server variable on error
            // Don't exit process in tests, maybe re-throw or handle differently
            // process.exit(1);
        });
        return server;
    },
    close: (callback) => {
        return new Promise((resolve, reject) => {
            if (server && server.listening) {
                console.log("Closing server...");
                server.close((err) => {
                    if (err) {
                        console.error("Error closing server:", err);
                        if (callback) callback(err);
                        return reject(err);
                    }
                    console.log("Server closed.");
                    server = null; // Reset server variable
                    if (callback) callback();
                    resolve();
                });
            } else {
                console.log("Server not running or already closed.");
                if (callback) process.nextTick(callback);
                resolve(); // Resolve immediately if not running
            }
        });
    },
    // Expose the potentially modified swagger doc for testing if needed
    // Note: This is generally not ideal, prefer testing via endpoints
    _getSwaggerDoc: () => swaggerDocument
};

// --- Auto-start logic ---
if (require.main === module && process.env.NODE_ENV !== 'test') {
    module.exports.listen();
}
