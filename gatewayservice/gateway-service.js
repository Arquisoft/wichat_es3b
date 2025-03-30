const express = require('express');
const axios = require('axios');
const cors = require('cors');
const promBundle = require('express-prom-bundle');
//libraries required for OpenAPI-Swagger
const swaggerUi = require('swagger-ui-express');
const fs = require("fs")
const YAML = require('yaml')

const app = express();
const port = 8000;

const llmServiceUrl = process.env.LLM_SERVICE_URL || 'http://localhost:8003';
const authServiceUrl = process.env.AUTH_SERVICE_URL || 'http://localhost:8002';
const userServiceUrl = process.env.USER_SERVICE_URL || 'http://localhost:8001';
const questionServiceUrl = process.env.QUESTION_SERVICE_URL || 'http://localhost:8004';

app.use(cors());
app.use(express.json());

//Prometheus configuration
const metricsMiddleware = promBundle({includeMethod: true});
app.use(metricsMiddleware);

// Middleware for authorization verification
const verifyToken = async (req, res, next) => {
  const bearerHeader = req.headers['authorization'];

  if (!bearerHeader) {
    return res.status(401).json({ error: 'Access denied. No token provided.' });
  }

  const bearer = bearerHeader.split(' ');
  const token = bearer[1];

  try {
    // Verify token with auth service
    const verifyResponse = await axios.post(authServiceUrl + '/verify', { token });
    req.user = verifyResponse.data;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Invalid token' });
  }
};

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'OK' });
});

// ============= LEGACY ENDPOINTS =============

app.post('/login', async (req, res) => {
  try {
    // Forward the login request to the authentication service
    const authResponse = await axios.post(authServiceUrl + '/login', req.body);
    res.json(authResponse.data);
  } catch (error) {
    if (error.response) {
      res.status(error.response.status).json({ error: error.response.data.error });
    } else {
      res.status(500).json({ error: 'Internal server error' });
    }
  }
});

app.post('/adduser', async (req, res) => {
  try {
    // Forward the add user request to the user service
    const userResponse = await axios.post(userServiceUrl + '/adduser', req.body);
    res.status(201).json(userResponse.data);
  } catch (error) {
    if (error.response) {
      res.status(error.response.status).json({ error: error.response.data.error });
    } else {
      res.status(400).json({ error: 'Failed to add user' });
    }
  }
});

app.post('/askllm', verifyToken, async (req, res) => {
  try {
    // Forward the ask request to the LLM service
    const llmResponse = await axios.post(llmServiceUrl + '/ask', req.body);
    res.json(llmResponse.data);
  } catch (error) {
    if (error.response) {
      res.status(error.response.status).json({ error: error.response.data.error });
    } else {
      res.status(500).json({ error: 'Error reaching LLM service' });
    }
  }
});

// ============= NEW REST ENDPOINTS =============

// Authentication
app.post('/auth', async (req, res) => {
  try {
    const authResponse = await axios.post(authServiceUrl + '/login', req.body);
    res.json(authResponse.data);
  } catch (error) {
    if (error.response) {
      res.status(error.response.status).json({ error: error.response.data.error });
    } else {
      res.status(500).json({ error: 'Internal server error' });
    }
  }
});

// User endpoints
app.get('/users', verifyToken, async (req, res) => {
  try {
    const { sort, order, limit, offset } = req.query;
    let queryString = '';

    if (sort) queryString += `sort=${sort}&`;
    if (order) queryString += `order=${order}&`;
    if (limit) queryString += `limit=${limit}&`;
    if (offset) queryString += `offset=${offset}&`;

    // Remove trailing '&' if exists
    queryString = queryString ? `?${queryString.slice(0, -1)}` : '';

    const usersResponse = await axios.get(`${userServiceUrl}/users${queryString}`);
    res.json(usersResponse.data);
  } catch (error) {
    if (error.response) {
      res.status(error.response.status).json({ error: error.response.data.error });
    } else {
      res.status(500).json({ error: 'Internal server error' });
    }
  }
});

app.post('/users', async (req, res) => {
  try {
    const userResponse = await axios.post(userServiceUrl + '/users', req.body);
    res.status(201).json(userResponse.data);
  } catch (error) {
    if (error.response) {
      const status = error.response.status;
      if (status === 409) {
        res.status(409).json({ error: 'Username already exists' });
      } else {
        res.status(status).json({ error: error.response.data.error });
      }
    } else {
      res.status(400).json({ error: 'Invalid user data' });
    }
  }
});

app.get('/users/:username', verifyToken, async (req, res) => {
  try {
    const userResponse = await axios.get(userServiceUrl + '/users/' + req.params.username);
    res.json(userResponse.data);
  } catch (error) {
    if (error.response) {
      res.status(error.response.status).json({ error: error.response.data.error });
    } else {
      res.status(404).json({ error: 'User not found' });
    }
  }
});

app.put('/users/:username', verifyToken, async (req, res) => {
  try {
    const userResponse = await axios.put(userServiceUrl + '/users/' + req.params.username, req.body);
    res.json(userResponse.data);
  } catch (error) {
    if (error.response) {
      res.status(error.response.status).json({ error: error.response.data.error });
    } else {
      res.status(404).json({ error: 'User not found' });
    }
  }
});

app.delete('/users/:username', verifyToken, async (req, res) => {
  try {
    await axios.delete(userServiceUrl + '/users/' + req.params.username);
    res.status(204).send();
  } catch (error) {
    if (error.response) {
      res.status(error.response.status).json({ error: error.response.data.error });
    } else {
      res.status(404).json({ error: 'User not found' });
    }
  }
});

app.get('/users/:username/stats', verifyToken, async (req, res) => {
  try {
    const statsResponse = await axios.get(userServiceUrl + '/users/' + req.params.username + '/stats');
    res.json(statsResponse.data);
  } catch (error) {
    if (error.response) {
      res.status(error.response.status).json({ error: error.response.data.error });
    } else {
      res.status(404).json({ error: 'User not found' });
    }
  }
});

// Question endpoints
app.get('/questions', verifyToken, async (req, res) => {
  try {
    const { category, difficulty, limit, offset } = req.query;
    let queryString = '';

    if (category) queryString += `category=${category}&`;
    if (difficulty) queryString += `difficulty=${difficulty}&`;
    if (limit) queryString += `limit=${limit}&`;
    if (offset) queryString += `offset=${offset}&`;

    // Remove trailing '&' if exists
    queryString = queryString ? `?${queryString.slice(0, -1)}` : '';

    const questionsResponse = await axios.get(`${questionServiceUrl}/questions${queryString}`);
    res.json(questionsResponse.data);
  } catch (error) {
    if (error.response) {
      res.status(error.response.status).json({ error: error.response.data.error });
    } else {
      res.status(500).json({ error: 'Internal server error' });
    }
  }
});

app.post('/questions', verifyToken, async (req, res) => {
  try {
    const questionResponse = await axios.post(questionServiceUrl + '/questions', req.body);
    res.status(201).json(questionResponse.data);
  } catch (error) {
    if (error.response) {
      res.status(error.response.status).json({ error: error.response.data.error });
    } else {
      res.status(400).json({ error: 'Invalid question data' });
    }
  }
});

app.get('/questions/:questionId', verifyToken, async (req, res) => {
  try {
    const questionResponse = await axios.get(questionServiceUrl + '/questions/' + req.params.questionId);
    res.json(questionResponse.data);
  } catch (error) {
    if (error.response) {
      res.status(error.response.status).json({ error: error.response.data.error });
    } else {
      res.status(404).json({ error: 'Question not found' });
    }
  }
});

app.put('/questions/:questionId', verifyToken, async (req, res) => {
  try {
    const questionResponse = await axios.put(questionServiceUrl + '/questions/' + req.params.questionId, req.body);
    res.json(questionResponse.data);
  } catch (error) {
    if (error.response) {
      res.status(error.response.status).json({ error: error.response.data.error });
    } else {
      res.status(404).json({ error: 'Question not found' });
    }
  }
});

app.delete('/questions/:questionId', verifyToken, async (req, res) => {
  try {
    await axios.delete(questionServiceUrl + '/questions/' + req.params.questionId);
    res.status(204).send();
  } catch (error) {
    if (error.response) {
      res.status(error.response.status).json({ error: error.response.data.error });
    } else {
      res.status(404).json({ error: 'Question not found' });
    }
  }
});

app.post('/questions/:questionId/hints', verifyToken, async (req, res) => {
  try {
    const questionId = req.params.questionId;
    const prompt = req.body.prompt;

    // Construir el objeto de solicitud para el servicio LLM
    const llmRequest = {
      questionId,
      prompt
    };

    const llmResponse = await axios.post(llmServiceUrl + '/ask', llmRequest);
    res.json(llmResponse.data);
  } catch (error) {
    if (error.response) {
      res.status(error.response.status).json({ error: error.response.data.error });
    } else {
      res.status(500).json({ error: 'Error reaching LLM service' });
    }
  }
});

app.post('/questions/:questionId/answers', verifyToken, async (req, res) => {
  try {
    const questionId = req.params.questionId;
    const answer = req.body.answer;
    const username = req.user.username; // Obtenido del token de autenticación

    // Enviar la respuesta al servicio de preguntas
    const answerResponse = await axios.post(questionServiceUrl + '/questions/' + questionId + '/answer', {
      username,
      answer
    });

    res.json(answerResponse.data);
  } catch (error) {
    if (error.response) {
      res.status(error.response.status).json({ error: error.response.data.error });
    } else {
      res.status(404).json({ error: 'Question not found' });
    }
  }
});

// Leaderboard endpoint
app.get('/leaderboard', verifyToken, async (req, res) => {
  try {
    const { limit = 10, offset = 0 } = req.query;
    const leaderboardResponse = await axios.get(userServiceUrl + `/leaderboard?limit=${limit}&offset=${offset}`);
    res.json(leaderboardResponse.data);
  } catch (error) {
    if (error.response) {
      res.status(error.response.status).json({ error: error.response.data.error });
    } else {
      res.status(500).json({ error: 'Internal server error' });
    }
  }
});

app.get('/questions/:n/:locale', async (req, res) => {
  try {
    const { n, locale } = req.params;
    console.log(`${questionServiceUrl}/questions`)
    const response = await axios.get(`${questionServiceUrl}/questions`);
    res.json(response.data);
  } catch (error) {
    res.status(error.response ? error.response.status : 500).json({ error: error.message });
  }
});

// Read the OpenAPI YAML file synchronously
openapiPath='./openapi.yaml'
if (fs.existsSync(openapiPath)) {
  const file = fs.readFileSync(openapiPath, 'utf8');

  // Parse the YAML content into a JavaScript object representing the Swagger document
  const swaggerDocument = YAML.parse(file);

  // Serve the Swagger UI documentation at the '/api-doc' endpoint
  // This middleware serves the Swagger UI files and sets up the Swagger UI page
  // It takes the parsed Swagger document as input
  app.use('/api-doc', swaggerUi.serve, swaggerUi.setup(swaggerDocument));
} else {
  console.log("Not configuring OpenAPI. Configuration file not present.")
}

// Start the gateway service
const server = app.listen(port, () => {
  console.log(`Gateway Service listening at http://localhost:${port}`);
});

module.exports = server

