const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const server = require('./stats-service');

let mongoServer;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();
  await mongoose.disconnect();
  await mongoose.connect(uri, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });
}, 60000); 

afterAll(async () => {
  await mongoose.connection.dropDatabase();
  await mongoose.connection.close();
  await mongoServer.stop();
  server.close();
});

describe('Stats Service API', () => {
  const mockUser = {
    username: 'player1',
    rightAnswers: 5,
    wrongAnswers: 3,
    time: 100,
    score: 1200,
    win: true,
  };

  it('POST /savestats - debería guardar nuevas estadísticas', async () => {
    const res = await request(server).post('/savestats').send(mockUser);
    expect(res.status).toBe(201);
    expect(res.body.username).toBe('player1');
    expect(res.body.games).toBe(1);
    expect(res.body.maxScore).toBe(1200);
  });

  it('POST /savestats - actualiza estadísticas existentes', async () => {
    const res = await request(server).post('/savestats').send({
      ...mockUser,
      score: 1500,
      win: false,
    });
    expect(res.status).toBe(201);
    expect(res.body.games).toBe(2);
    expect(res.body.maxScore).toBe(1500);
  });

  it('POST /savestats - devuelve error si faltan datos requeridos', async () => {
    const res = await request(server).post('/savestats').send({
      username: 'player2',
    });
    expect(res.status).toBe(400);
    expect(res.body.error).toContain('Faltan datos requeridos');
  });

  it('GET /getstats/:username - obtiene estadísticas correctamente', async () => {
    const res = await request(server).get('/getstats/player1');
    expect(res.status).toBe(200);
    expect(res.body.username).toBe('player1');
    expect(res.body.games).toBeGreaterThan(0);
  });

  it('GET /getstats/:username - devuelve 404 si no hay estadísticas', async () => {
    const res = await request(server).get('/getstats/nonexistent');
    expect(res.status).toBe(404);
  });

  it('GET /getranking - obtiene ranking de usuarios', async () => {
    const res = await request(server).get('/getranking');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThan(0);
  });

  it('GET /getTop3 - obtiene top 3 por maxScore', async () => {
    const res = await request(server).get('/getTop3');
    expect(res.status).toBe(200);
    expect(res.body.length).toBeLessThanOrEqual(3);
  });

  it('GET /games/:username - obtiene historial de partidas', async () => {
    const res = await request(server).get('/games/player1');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  it('GET /games/:username - error si falta username', async () => {
    const res = await request(server).get('/games/');
    expect(res.status).toBe(404);
  });

  it('GET /ratios-per-month/:username - ratios mensuales', async () => {
    const res = await request(server).get('/ratios-per-month/player1');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    if (res.body.length > 0) {
      expect(res.body[0]).toHaveProperty('month');
      expect(res.body[0]).toHaveProperty('avgRatio');
    }
  });
});
