const request = require('supertest');
const { MongoMemoryServer } = require('mongodb-memory-server');

let mongoServer;
let app;

beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();
    process.env.MONGODB_URI = mongoUri;
    app = require('./statsservice'); // Ajusta la ruta según tu estructura
});

afterAll(async () => {
    app.close();
    await mongoServer.stop();
});

describe('Stats Service', () => {
    it('should return status 200 on GET /stats', async () => {
        const response = await request(app).get('/stats');
        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty('message', 'Stats Service is running');
    });
});
