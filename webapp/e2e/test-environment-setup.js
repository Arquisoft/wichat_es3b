 const { MongoMemoryServer } = require('mongodb-memory-server');
const axios = require('axios');
let mongoserver;
let userservice;
let authservice;
let llmservice;
let gatewayservice;
let statservice;
let wikiquestionservice;
let apiservice;

async function startServer() {
    console.log('Starting MongoDB memory server...');
    mongoserver = await MongoMemoryServer.create();
    const mongoUri = mongoserver.getUri();
    process.env.MONGODB_URI = mongoUri;
    process.env.NODE_ENV = 'test'
    console.log('MONGODB_URI: '+ mongoUri);
    userservice = await require("../../users/userservice/user-service");
    authservice = await require("../../users/authservice/auth-service");
    llmservice = await require("../../llmservice/llm-service");
    gatewayservice = await require("../../gatewayservice/gateway-service");
    statservice = await require("../../users/statsservice/stats-service");
    wikiquestionservice = await require("../../wikiquestionservice/wikiQuestion-service");
    apiservice = await require("../../apiservice/api-service");

    // Crear usuario de prueba
    await createTestUser();
}

async function createTestUser() {
    console.log('Creando usuario de prueba...');
    try {
        const response = await axios.post('http://localhost:8000/adduser', {
            email: 'testuser@example.com',
            username: 'testuser',
            password: 'testpassword',
        });
        console.log("Respuesta: " + response)
        console.log('Usuario de prueba creado:', response.data);

        await generateQuestions();
    } catch (error) {
        console.error('Error al crear el usuario de prueba:', error.response?.data || error.message);
    }
}

async function generateQuestions() {
    try{
        await axios.get('http://localhost:8004/generateQuestionsIfNotExists')
        //console.log(await axios.get('http://localhost:8004/questionsDB?n=1&topic=all'));
    }catch (error) {
        console.error('Error al generar preguntas de prueba:', error.response?.data || error.message);
    }
}

startServer();
