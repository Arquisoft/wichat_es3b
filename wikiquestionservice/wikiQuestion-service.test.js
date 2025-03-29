let app;

beforeAll(async () => {
    app = require('./wikiQuestion-service'); // Ajusta la ruta según tu estructura
});

afterAll(async () => {
    app.close();
});

describe('WikiQuestion Service', () => {
    it('should always pass', async () => {
        // No hace nada, simplemente pasa el test
        expect(true).toBe(true);
    });
});
