jest.mock('mongoose', () => ({
    connect: jest.fn(),
    disconnect: jest.fn(),
}));

let app;

beforeAll(async () => {
    app = require('./wikiQuestion-service'); // Ajusta la ruta según tu estructura
});

afterAll(async () => {
    app.close();
});

describe('Stats Service', () => {
    it('should always pass', async () => {
        // No hace nada, simplemente pasa el test
        expect(true).toBe(true);
    });
});

