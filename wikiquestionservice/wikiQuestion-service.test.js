const server = require("./wikiQuestion-service");
const request = require("supertest");
const CategoryLoader = require("./questiongenerator/categoryLoader");
describe('Wikidata Service', () => {
    /* Test para combrobar que todo va bien
     */
    it('should always pass', async () => {
        // No hace nada, simplemente pasa el test
        expect(true).toBe(true);
    });

    /* Test para combrobar que poniendo all nos cargan tosas las categorías
     */
    it('should distribute questions across all valid categories when "all" is selected', () => {
        const loader = new CategoryLoader(["all"], 30);
        const services = loader.getAllServices();

        expect(services).toHaveProperty('cine');
        expect(services).toHaveProperty('literatura');
        expect(services).toHaveProperty('paises');
        expect(services).toHaveProperty('clubes');
        expect(services).toHaveProperty('arte');
        expect(Object.keys(services).length).toBe(5);  // Solo categorías válidas deben estar
    });

    /* Test para combrobar que poniendo all y otra nos cargan todas las categorías igualmente
     */

    it('should include "all" categories and the specified category when "all" is combined with another category', () => {
        const loader = new CategoryLoader(["all", "cine"], 30);
        const services = loader.getAllServices();

        expect(services).toHaveProperty('cine');
        expect(services).toHaveProperty('literatura');
        expect(services).toHaveProperty('paises');
        expect(services).toHaveProperty('clubes');
        expect(services).toHaveProperty('arte');
        expect(Object.keys(services).length).toBe(5); // Debería incluir todas las categorías
    });

    /* Test para combrobar que poniendo categorías individuales y no están las demás
     */

    it('should load questions only from the "cine" category', () => {
        const loader = new CategoryLoader(["cine"], 10);
        const services = loader.getAllServices();

        expect(services).toHaveProperty('cine');
        expect(services).not.toHaveProperty('literatura');
        expect(services).not.toHaveProperty('paises');
        expect(services).not.toHaveProperty('clubes');
        expect(services).not.toHaveProperty('arte');
    });

    it('should load questions only from the "literatura" category', () => {
        const loader = new CategoryLoader(["literatura"], 10);
        const services = loader.getAllServices();

        expect(services).toHaveProperty('literatura');
        expect(services).not.toHaveProperty('cine');
        expect(services).not.toHaveProperty('paises');
        expect(services).not.toHaveProperty('clubes');
        expect(services).not.toHaveProperty('arte');
    });


    it('should load questions only from the "paises" category', () => {
        const loader = new CategoryLoader(["paises"], 10);
        const services = loader.getAllServices();

        expect(services).toHaveProperty('paises');
        expect(services).not.toHaveProperty('cine');
        expect(services).not.toHaveProperty('literatura');
        expect(services).not.toHaveProperty('clubes');
        expect(services).not.toHaveProperty('arte');
    });


    it('should load questions only from the "clubes" category', () => {
        const loader = new CategoryLoader(["clubes"], 10);
        const services = loader.getAllServices();

        expect(services).toHaveProperty('clubes');
        expect(services).not.toHaveProperty('cine');
        expect(services).not.toHaveProperty('literatura');
        expect(services).not.toHaveProperty('paises');
        expect(services).not.toHaveProperty('arte');
    });


    it('should load questions only from the "arte" category', () => {
        const loader = new CategoryLoader(["arte"], 10);
        const services = loader.getAllServices();

        expect(services).toHaveProperty('arte');
        expect(services).not.toHaveProperty('cine');
        expect(services).not.toHaveProperty('literatura');
        expect(services).not.toHaveProperty('paises');
        expect(services).not.toHaveProperty('clubes');
    });

    /* Test para combrobar que poniendo parejas de categorías y no están las demás
 */
    it('should load questions from "paises" and "clubes" categories only', () => {
        const loader = new CategoryLoader(["paises", "clubes"], 10);
        const services = loader.getAllServices();

        expect(services).toHaveProperty('paises');
        expect(services).toHaveProperty('clubes');
        expect(services).not.toHaveProperty('cine');
        expect(services).not.toHaveProperty('literatura');
        expect(services).not.toHaveProperty('arte');
    });

    it('should load questions from "literatura" and "arte" categories only', () => {
        const loader = new CategoryLoader(["literatura", "arte","cine"], 10);
        const services = loader.getAllServices();

        expect(services).toHaveProperty('literatura');
        expect(services).toHaveProperty('arte');
        expect(services).not.toHaveProperty('paises');
        expect(services).not.toHaveProperty('clubes');
    });


    /* Test para combrobar que poniendo temás inválidos de categorías sigue funcionando
    */

    it('should not load any questions for an invalid category', () => {
        const loader = new CategoryLoader(["invalido"], 10);
        const services = loader.getAllServices();

        expect(Object.keys(services)).toHaveLength(0);
    });

    it('should include all valid categories when "all" is selected with an invalid category', () => {
        const loader = new CategoryLoader(["all", "invalido"], 10);
        const services = loader.getAllServices();

        expect(services).toHaveProperty('cine');
        expect(services).toHaveProperty('literatura');
        expect(services).toHaveProperty('paises');
        expect(services).toHaveProperty('clubes');
        expect(services).toHaveProperty('arte');
        expect(Object.keys(services).length).toBe(5);
    });

    it('should include clubes when "clubes" is selected with an invalid category', () => {
        const loader = new CategoryLoader(["clubes", "invalido"], 10);
        const services = loader.getAllServices();

        expect(services).not.toHaveProperty('cine');
        expect(services).not.toHaveProperty('literatura');
        expect(services).not.toHaveProperty('paises');
        expect(services).toHaveProperty('clubes');
        expect(services).not.toHaveProperty('arte');
        expect(Object.keys(services).length).toBe(1);
    });


    it("should return 400 if the number of questions is more than 30", async () => {
        const response = await request(server).get("/questions?n=31");
        expect(response.status).toBe(400);
        expect(response.body.error).toBe("El límite de preguntas es 30");
    });

    it("should return 400 if no valid categories are provided", async () => {
        const response = await request(server).get("/questions?topic=invalidCategory");
        expect(response.status).toBe(400);
        expect(response.body.error).toBe("No se proporcionaron categorías válidas.");
    });

    it("should return questions for valid categories", async () => {
        const response = await request(server).get("/questions?topic=paises,cine&n=5");
        expect(response.status).toBe(200);
        expect(response.body).toBeInstanceOf(Array);
    }, 30000);

});
afterAll(async () => {
    await new Promise(resolve => server.close(resolve));
});