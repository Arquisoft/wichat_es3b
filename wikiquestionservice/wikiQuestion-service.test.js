const request = require('supertest');
const { MongoMemoryServer } = require('mongodb-memory-server');

let mongoServer;
let app;

beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();
    process.env.MONGODB_URI = mongoUri;
    app = require('./wikiQuestion-service'); // Ajusta la ruta según tu estructura
});

afterAll(async () => {
    app.close();
    await mongoServer.stop();
});

describe('Wiki Question Service', () => {
    it('should return status 200 on GET /questions', async () => {
        const response = await request(app).get('/questions');
        expect(response.status).toBe(200);
    });
});
