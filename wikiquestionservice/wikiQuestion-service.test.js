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

describe('WikiQuestion Service', () => {
    it('should always pass', async () => {
        // No hace nada, simplemente pasa el test
        expect(true).toBe(true);
    });
});
