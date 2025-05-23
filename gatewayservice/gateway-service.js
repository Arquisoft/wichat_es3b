const express = require("express");
const axios = require("axios");
const cors = require("cors");
const path = require("path");
const promBundle = require("express-prom-bundle");

const app = express();
app.disable("x-powered-by");

const port = 8000;

const wikiQuestionServiceUrl =
  process.env.QUESTION_SERVICE_URL || "http://localhost:8004";
const llmServiceUrl = process.env.LLM_SERVICE_URL || "http://localhost:8003";
const authServiceUrl = process.env.AUTH_SERVICE_URL || "http://localhost:8002";
const userServiceUrl = process.env.USER_SERVICE_URL || "http://localhost:8001";
const statsServiceUrl =
  process.env.STATS_SERVICE_URL || "http://localhost:8005";

app.use(cors());

app.use(express.json());

const promClient = require('prom-client');

// Crear un contador de solicitudes
const httpRequestsTotal = new promClient.Counter({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'path', 'status_code'],
});

// Middleware para contar las solicitudes
app.use((req, res, next) => {
  res.on('finish', () => {
    httpRequestsTotal.inc({
      method: req.method,
      path: req.path,
      status_code: res.statusCode,
    });
  });
  next();
});


//Prometheus configuration
const metricsMiddleware = promBundle({
  includeMethod: true,
  includePath: true, // ← agrega esto
  normalizePath: true // ← útil para agrupar rutas como /getstats/:username
});
app.use(metricsMiddleware);

// Health check endpoint
app.get("/health", (req, res) => {
  res.json({ status: "OK" });
});

app.post("/login", async (req, res) => {
  try {
    // Forward the login request to the authentication service
    const authResponse = await axios.post(authServiceUrl + "/login", req.body);
    res.json(authResponse.data);
  } catch (error) {
    res
        .status(error?.response?.status)
        .json({ error: error?.response?.data.error });
  }
});


app.post("/adduser", async (req, res) => {
  try {
    // Forward the add user request to the user service
    const userResponse = await axios.post(
      userServiceUrl + "/adduser",
      req.body
    );
    res.json(userResponse.data);
  } catch (error) {
    res
      .status(error.response.status)
      .json({ error: error.response.data.error });
  }
});

app.post("/askllm", async (req, res) => {
  try {
    // Forward the add user request to the user service
    const llmResponse = await axios.post(llmServiceUrl + "/ask", req.body);
    res.json(llmResponse.data);
  } catch (error) {
    res
      .status(error.response.status)
      .json({ error: error.response.data.error });
  }
});

app.post("/ai-answer", async (req, res) => {
  try {
    const llmResponse = await axios.post(llmServiceUrl + "/ai-answer", req.body);
    res.json(llmResponse.data);
  } catch (error) {
    console.error("Error en el gateway al procesar la respuesta de la IA:", error.message);

    if (error.response) {
      res
          .status(error.response.status)
          .json({ error: error.response.data.error });
    } else if (error.request) {
      res
          .status(500)
          .json({ error: "El servicio LLM no está disponible" });
    } else {
      res.status(500).json({ error: "Error interno del servidor" });
    }
  }
});

app.post("/savestats", async (req, res) => {
  try {
    const statsResponse = await axios.post(
      statsServiceUrl + "/savestats",
      req.body
    );
    res.json(statsResponse.data);
  } catch (error) {
    console.error("Error en el gateway: ", error.message);

    if (error.response) {
      res
        .status(error.response.status)
        .json({ error: error.response.data.error });
    } else if (error.request) {
      res
        .status(500)
        .json({ error: "El servidor de estadísticas no está disponible" });
    } else {
      res.status(500).json({ error: "Error interno del servidor" });
    }
  }
});

app.get("/getstats/:username", async (req, res) => {
  try {
    const username = req.params.username;
    console.log("Link: " + statsServiceUrl + `/getstats/${username}`);
    const statsResponse = await axios.get(
      statsServiceUrl + `/getstats/${username}`
    );
    res.json(statsResponse.data);
  } catch (error) {
    console.error("Error en el gateway:", error.message);

    if (error.response) {
      res
        .status(error.response.status)
        .json({ error: error.response.data.error });
    } else if (error.request) {
      res
        .status(500)
        .json({ error: "El servidor de estadísticas no está disponible" });
    } else {
      res.status(500).json({ error: "Error interno del servidor" });
    }
  }
});

app.get("/getranking", async (req, res) => {
  try {
    const rankingResponse = await axios.get(statsServiceUrl + "/getranking");
    res.json(rankingResponse.data);
  } catch (error) {
    res
      .status(error.response.status)
      .json({ error: error.response.data.error });
  }
});

app.get("/getTop3", async (req, res) => {
  try {
    const rankingResponse = await axios.get(statsServiceUrl + "/getTop3");
    res.json(rankingResponse.data);
  } catch (error) {
    res
      .status(error.response.status)
      .json({ error: error.response.data.error });
  }
});

app.get("/games/:username", async (req, res) => {
  try {
    const username = req.params.username;
    if (!username)
      return res.status(400).json({ error: "Se requiere un username" });
    const gamesResponse = await axios.get(
      statsServiceUrl + `/games/${username}`
    );
    res.json(gamesResponse.data);
  } catch (error) {
    res
      .status(error.response.status)
      .json({ error: error.response.data.error });
  }
});

// Endpoint para obtener las estadísticas de ratios por mes
app.get("/ratios-per-month/:username", async (req, res) => {
  try {
    const username = req.params.username;
    if (!username)
      return res.status(400).json({ error: "Se requiere un username" });
    const ratiosResponse = await axios.get(
      statsServiceUrl + `/ratios-per-month/${username}`
    );
    res.json(ratiosResponse.data);
  } catch (error) {
    res
      .status(error.response.status)
      .json({ error: error.response.data.error });
  }
});

// Question endpoints
app.get('/questions', async (req, res) => {
  try {
    const { n = 10, topic = "all" } = req.query;

    const fullURL = `${wikiQuestionServiceUrl}/questions?n=${n}&topic=${encodeURIComponent(topic)}`;
    console.log("Redirigiendo a:", fullURL);

    const response = await axios.get(fullURL);
    res.json(response.data);
  } catch (error) {
    console.error("Error al obtener preguntas:", error.message);
    res.status(error.response?.status || 500).json({ error: error.message });
  }
});

// Endpoint para redirigir la generación de API key
app.post('/generate-apikey', async (req, res) => {
  try {
    const response = await axios.post(`${userServiceUrl}/generate-apikey`, req.body);
    res.json(response.data);
  } catch (error) {
    console.error('Error en /generate-apikey:', error.message);
    const code = error.response?.data?.errorCode;
    res.status(error.response?.status || 500).json({ errorCode: code || 'GENERIC' });
  }
});

// Endpoint para redirigir la validación de API key
app.get('/validate-apikey/:apikey', async (req, res) => {
  try {
    const { apikey } = req.params;
    const response = await axios.get(`${userServiceUrl}/validate-apikey/${apikey}`);
    res.json(response.data);
  } catch (error) {
    console.error('Error en /validate-apikey:', error.message);
    res.status(error.response?.status || 500).json({ error: error.response?.data?.error || 'Error interno del servidor' });
  }
});


// Endpoint para redirigir la generación de preguntas
app.get('/questionsDB', async (req, res) => {
  try {
    const { n = 10, topic = "all" } = req.query;

    const fullURL = `${wikiQuestionServiceUrl}/questionsDB?n=${n}&topic=${encodeURIComponent(topic)}`;
    console.log("Redirigiendo a:", fullURL);

    const response = await axios.get(fullURL);
    res.json(response.data);
  } catch (error) {
    console.error("Error al obtener preguntas:", error.message);
    res.status(error.response?.status || 500).json({ error: error.message });
  }
});

//Para mostrar metricas de Prometheus
app.get("/metrics", async (req, res) => {
  res.set('Content-Type', promClient.register.contentType);
  res.end(await promClient.register.metrics());
});


// Start the gateway service
const server = app.listen(port, () => {
  console.log(`Gateway Service listening at http://localhost:${port}`);
});

module.exports = server;

//Cambio
