const express = require("express");
const axios = require("axios");
const cors = require("cors");
const promBundle = require("express-prom-bundle");

const app = express();
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

//Prometheus configuration
const metricsMiddleware = promBundle({ includeMethod: true });
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
      .status(error.response.status)
      .json({ error: error.response.data.error });
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

app.post("/savestats", async (req, res) => {
  try {
    const statsResponse = await axios.post(
      statsServiceUrl + "/savestats",
      req.body
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
    let { n, topic = "all" } = req.query;

    n = parseInt(n);
    if (isNaN(n)) n = 10;

    const fullURL = `${wikiQuestionServiceUrl}/questions?n=${n}&topic=${encodeURIComponent(topic)}`;
    console.log("Redirigiendo a:", fullURL);

    const response = await axios.get(fullURL);
    res.json(response.data);
  } catch (error) {
    console.error("Error al obtener preguntas:", error.message);
    res.status(error.response?.status || 500).json({ error: error.message });
  }
});

// Start the gateway service
const server = app.listen(port, () => {
  console.log(`Gateway Service listening at http://localhost:${port}`);
});

module.exports = server;
