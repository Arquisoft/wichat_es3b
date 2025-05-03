// user-service.js
const express = require("express");
const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const User = require("./user-model");

const ApiKey = require("./apikey-model");
const crypto = require("crypto"); // Para generar la API key

const app = express();
app.disable("x-powered-by");
const port = 8001;

// Middleware to parse JSON in request bodydocker ps --filter "name=mongodb-wichat_es3b"
app.use(express.json());

// Connect to MongoDB
const mongoUri = process.env.MONGODB_URI || "mongodb://localhost:27017/userdb";
mongoose.connect(mongoUri);

// Function to validate required fields in the request body
function validateRequiredFields(req, requiredFields) {
  for (const field of requiredFields) {
    if (!(field in req.body)) {
      throw new Error(`Missing required field: ${field}`);
    }
  }
}

app.post("/adduser", async (req, res) => {
  try {
    // Check if required fields are present in the request body
    validateRequiredFields(req, ["email", "username", "password"]);

    const username = req.body.username?.toString().trim();
    const email = req.body.email?.toString().trim();

    const existingUser = await User.findOne({
      $or: [{ username }, { email }],
    });
    
    if (existingUser) {
      return res.status(400).json({
        error: "Ya existe un usuario con ese nombre o correo electrónico",
      });
    }

    // Encrypt the password before saving it
    const hashedPassword = await bcrypt.hash(req.body.password, 10);

    const newUser = new User({
      email: req.body.email,
      username: req.body.username,
      password: hashedPassword,
    });

    await newUser.save();
    res.json(newUser);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Endpoint para generar y guardar una API key
app.post("/generate-apikey", async (req, res) => {
  try {
    console.log(req.body);
    const { email } = req.body;

    // Validar que el campo email esté presente
    if (!email) {
      return res.status(400).json({ errorCode: "EMAIL_REQUIRED" });
    }

    // Validar el formato del email usando una expresión regular
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || typeof email !== "string" || !emailRegex.test(email)) {
      return res.status(400).json({ errorCode: "INVALID_EMAIL_FORMAT" });
    }

    // Usar una comparación estricta de string en lugar de pasar el objeto directamente
    const existingApiKey = await ApiKey.findOne({
      email: String(email).trim(),
    });

    if (existingApiKey) {
      // Si ya existe, devolver un error
      return res.status(400).json({ errorCode: "EMAIL_ALREADY_EXISTS" });
    }

    // Generar una nueva API key
    const apiKey = crypto.randomBytes(32).toString("hex");
    const newApiKeyEntry = new ApiKey({ email: String(email).trim(), apiKey });
    await newApiKeyEntry.save();

    // Devolver la API key generada
    res.json({ apiKey: newApiKeyEntry.apiKey });
  } catch (error) {
    console.error("Error al generar la API key:", error.message);
    res.status(500).json({ error: "Error al generar la API key" });
  }
});

// Endpoint para validar una API key
app.get("/validate-apikey/:apikey", async (req, res) => {
  try {
    const { apikey } = req.params;
    if (!apikey) {
      return res.status(400).json({ error: "El campo apikey es obligatorio" });
    }

    // Verificar si la API key existe
    const apiKeyEntry = await ApiKey.findOne({ apiKey: apikey });
    res.json({ isValid: !!apiKeyEntry });
  } catch (error) {
    res.status(500).json({ error: "Error al validar la API key" });
  }
});

const server = app.listen(port, () => {
  console.log(`User Service listening at http://localhost:${port}`);
});

// Listen for the 'close' event on the Express.js server
server.on("close", () => {
  // Close the Mongoose connection
  mongoose.connection.close();
});

module.exports = server;
