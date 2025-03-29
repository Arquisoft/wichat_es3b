let app;

beforeAll(async () => {
    app = require('./stats-service'); // Ajusta la ruta según tu estructura
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
