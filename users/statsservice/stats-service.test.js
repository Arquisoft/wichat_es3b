const request = require("supertest");
const mongoose = require("mongoose");
const { MongoMemoryServer } = require("mongodb-memory-server");
const Stats = require("./stat-model");
const Game = require("./game-model");

let server;
let mongoServer;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();

  process.env.MONGODB_URI = uri;
  server = require("./stats-service");
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
  server.close();
});

beforeEach(async () => {
  await Stats.deleteMany();
  await Game.deleteMany();
});

describe("Stats Service", () => {
  const payload = {
    username: "testuser",
    rightAnswers: 8,
    wrongAnswers: 2,
    time: 30,
    score: 100,
    win: true,
  };

  test("1. Guardar estadísticas nuevas", async () => {
    const res = await request(server).post("/savestats").send(payload);
    expect(res.status).toBe(201);
    expect(res.body.username).toBe("testuser");
    expect(res.body.ratio).toBeCloseTo(0.8);
  });

  test("2. Guardar estadísticas existentes (acumulación)", async () => {
    await request(server).post("/savestats").send(payload);
    const res = await request(server).post("/savestats").send({ ...payload, win: false, score: 50 });
    expect(res.status).toBe(201);
    expect(res.body.games).toBe(2);
    expect(res.body.streak).toBe(0);
    expect(res.body.maxScore).toBe(100);
  });

  test("3. Faltan campos requeridos en /savestats", async () => {
    const res = await request(server).post("/savestats").send({ username: "u" });
    expect(res.status).toBe(400);
    expect(res.body.error).toBe("Faltan datos requeridos");
  });

  test("4. Obtener estadísticas de un usuario existente", async () => {
    await request(server).post("/savestats").send(payload);
    const res = await request(server).get("/getstats/testuser");
    expect(res.status).toBe(200);
    expect(res.body.username).toBe("testuser");
  });

  test("5. Obtener estadísticas de un usuario inexistente", async () => {
    const res = await request(server).get("/getstats/unknown");
    expect(res.status).toBe(404);
    expect(res.body.error).toBe("Stats not found for this user");
  });

  test("6. Obtener ranking con un usuario", async () => {
    await request(server).post("/savestats").send(payload);
    const res = await request(server).get("/getranking");
    expect(res.status).toBe(200);
    expect(res.body.length).toBe(1);
  });

  test("7. Obtener Top 3 usuarios por puntuación", async () => {
    await request(server).post("/savestats").send({ ...payload, username: "u1", score: 80 });
    await request(server).post("/savestats").send({ ...payload, username: "u2", score: 120 });
    await request(server).post("/savestats").send({ ...payload, username: "u3", score: 60 });
    await request(server).post("/savestats").send({ ...payload, username: "u4", score: 70 });

    const res = await request(server).get("/getTop3");
    expect(res.status).toBe(200);
    expect(res.body.length).toBe(3);
    expect(res.body[0].username).toBe("u2");
  });

  test("8. Obtener historial de juegos", async () => {
    await request(server).post("/savestats").send(payload);
    const res = await request(server).get("/games/testuser");
    expect(res.status).toBe(200);
    expect(res.body.length).toBe(1);
  });

  test("9. No pasar username en /games/:username", async () => {
    const res = await request(server).get("/games/");
    expect(res.status).toBe(404); // Route mismatch
  });

  test("10. Obtener ratios por mes", async () => {
    await request(server).post("/savestats").send(payload);
    const res = await request(server).get("/ratios-per-month/testuser");
    expect(res.status).toBe(200);
    expect(res.body[0].avgRatio).toBeCloseTo(0.8);
  });

  test("11. /ratios-per-month con usuario sin partidas", async () => {
    const res = await request(server).get("/ratios-per-month/nope");
    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });

  test("12. Puntuación máxima se actualiza solo si es mayor", async () => {
    await request(server).post("/savestats").send({ ...payload, score: 150 });
    const res = await request(server).post("/savestats").send({ ...payload, score: 100 });
    expect(res.body.maxScore).toBe(150);
  });

  test("13. streak y maxStreak se actualizan correctamente", async () => {
    await request(server).post("/savestats").send({ ...payload, win: true });
    const res = await request(server).post("/savestats").send({ ...payload, win: true });
    expect(res.body.streak).toBe(2);
    expect(res.body.maxStreak).toBe(2);
  });

  test("14. streak se reinicia si se pierde", async () => {
    await request(server).post("/savestats").send({ ...payload, win: true });
    const res = await request(server).post("/savestats").send({ ...payload, win: false });
    expect(res.body.streak).toBe(0);
    expect(res.body.maxStreak).toBe(1);
  });

  test("15. Manejo de error interno simulado en /savestats", async () => {
    const originalSave = Stats.prototype.save;
    Stats.prototype.save = jest.fn().mockRejectedValue(new Error("boom"));

    const res = await request(server).post("/savestats").send(payload);
    expect(res.status).toBe(500);
    expect(res.body.error).toBe("Error al guardar las estadísticas");

    Stats.prototype.save = originalSave;
  });

  test("16. POST /savestats devuelve 400 si faltan datos requeridos", async () => {
    const res = await request(server)
      .post("/savestats")
      .send({ username: "testuser" }); // falta time y score
    expect(res.status).toBe(400);
    expect(res.body.error).toBe("Faltan datos requeridos");
  });

  test("17. GET /getstats/:username devuelve 404 si no hay stats", async () => {
    const res = await request(server).get("/getstats/noexistente123");
    expect(res.status).toBe(404);
    expect(res.body.error).toBe("Stats not found for this user");
  });

  test("18. GET /getstats/:username maneja errores del servidor", async () => {
    jest.spyOn(Stats, "findOne").mockImplementation(() => {
      throw new Error("Fallo forzado");
    });
  
    const res = await request(server).get("/getstats/usuarioError");
    expect(res.status).toBe(500);
    expect(res.body.error).toBe("Internal Server Error");
  
    Stats.findOne.mockRestore(); // Limpia el mock
  });

  test("19. GET /getranking maneja errores del servidor", async () => {
    jest.spyOn(Stats, "find").mockImplementation(() => {
      throw new Error("Fallo ranking");
    });
  
    const res = await request(server).get("/getranking");
    expect(res.status).toBe(500);
    expect(res.body.error).toBe("Error al obtener el ranking");
  
    Stats.find.mockRestore();
  });
  
});
