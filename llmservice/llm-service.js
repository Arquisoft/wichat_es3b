const axios = require('axios');
const express = require('express');

require("dotenv").config();

const app = express();
const port = 8003;


// Middleware to parse JSON in request body
app.use(express.json());

// Define configurations for different LLM APIs
const llmConfigs = {
  gemini: {
    url: (apiKey) => `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
    transformRequest: (question) => ({
      contents: [{ parts: [{ text: question }] }]
    }),
    transformResponse: (response) => response.data.candidates[0]?.content?.parts[0]?.text
  },
  empathy: {
    url: () => 'https://empathyai.prod.empathy.co/v1/chat/completions',
    transformRequest: (question) => ({
      model: "qwen/Qwen2.5-Coder-7B-Instruct",
      messages: [
        { role: "system", content: "You are a helpful assistant." },
        { role: "user", content: question }
      ]
    }),
    transformResponse: (response) => response.data.choices[0]?.message?.content,
    headers: (apiKey) => ({
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    })
  }
};

// Function to validate required fields in the request body
function validateRequiredFields(req, requiredFields) {
  for (const field of requiredFields) {
    if (!(field in req.body)) {
      throw new Error(`Missing required field: ${field}`);
    }
  }
}

// Generic function to send questions to LLM
async function sendQuestionToLLM(question, apiKey, model = 'gemini') {
  try {
    console.log("Inicio del send question: ")

    const config = llmConfigs[model];
    if (!config) {
      throw new Error(`Model "${model}" is not supported.`);
    }

    const url = config.url(apiKey);
    const requestData = config.transformRequest(question);

    const headers = {
      'Content-Type': 'application/json',
      ...(config.headers ? config.headers(apiKey) : {})
    };

    console.log("Antes del reponse: ")

    const response = await axios.post(url, requestData, { headers });

    console.log(response)

    return config.transformResponse(response);

  } catch (error) {
    console.error(`Error sending question to ${model}:`, error.message || error);
    return null;
  }
}

app.post('/ask', async (req, res) => {
  try {
    // Check if required fields are present in the request body
    validateRequiredFields(req, ['question', 'model']);

    const { question, model } = req.body;
    console.log("Antes del send")
    console.log("APIKEY: " + process.env.LLM_API_KEY)
    console.log(process.env)
    const answer = await sendQuestionToLLM(question, process.env.LLM_API_KEY, model);
    console.log("Despues del send")
    res.json({ answer });

  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

const server = app.listen(port, () => {
  console.log(`LLM Service listening at http://localhost:${port}`);
});

module.exports = server;

