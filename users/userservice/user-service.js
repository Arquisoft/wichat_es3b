// user-service.js
const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const User = require('./user-model')

const ApiKey = require('./apikey-model');
const crypto = require('crypto'); // Para generar la API key

const app = express();
const port = 8001;

// Middleware to parse JSON in request bodydocker ps --filter "name=mongodb-wichat_es3b"
app.use(express.json());

// Connect to MongoDB
const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/userdb';
mongoose.connect(mongoUri);



// Function to validate required fields in the request body
function validateRequiredFields(req, requiredFields) {
    for (const field of requiredFields) {
      if (!(field in req.body)) {
        throw new Error(`Missing required field: ${field}`);
      }
    }
}

app.post('/adduser', async (req, res) => {
    try {
        // Check if required fields are present in the request body
        validateRequiredFields(req, ['email', 'username', 'password']);

        const existingUser = await User.findOne({ 
          $or: [{ username: req.body.username }, { email: req.body.email }]
         });
        if (existingUser) {
            return res.status(400).json({ 
              error: 'Ya existe un usuario con ese nombre o correo electrónico' 
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
    }});

// Endpoint para generar y guardar una API key
app.post('/generate-apikey', async (req, res) => {
    try {
        console.log(req.body);
        const { email } = req.body;

        // Validar que el campo email esté presente
        if (!email) {
            return res.status(400).json({ error: 'El campo email es obligatorio' });
        }

        // Verificar si ya existe una API key para este correo
        const existingApiKey = await ApiKey.findOne({ email });
        if (existingApiKey) {
            // Si ya existe, devolver un error
            return res.status(400).json({ error: 'Ya existe una API key para este correo' });
        }

        // Generar una nueva API key
        const apiKey = crypto.randomBytes(32).toString('hex');
        const newApiKeyEntry = new ApiKey({ email, apiKey });
        await newApiKeyEntry.save();

        // Devolver la API key generada
        res.json({ apiKey: newApiKeyEntry.apiKey });
    } catch (error) {
        console.error('Error al generar la API key:', error.message);
        res.status(500).json({ error: 'Error al generar la API key' });
    }
});

// Endpoint para validar una API key
app.get('/validate-apikey/:apikey', async (req, res) => {
    try {
        const { apikey } = req.params;
        if (!apikey) {
            return res.status(400).json({ error: 'El campo apikey es obligatorio' });
        }

        // Verificar si la API key existe
        const apiKeyEntry = await ApiKey.findOne({ apiKey: apikey });
        res.json({ isValid: !!apiKeyEntry });
    } catch (error) {
        res.status(500).json({ error: 'Error al validar la API key' });
    }
});

const server = app.listen(port, () => {
  console.log(`User Service listening at http://localhost:${port}`);
});

// Listen for the 'close' event on the Express.js server
server.on('close', () => {
    // Close the Mongoose connection
    mongoose.connection.close();
  });

module.exports = server