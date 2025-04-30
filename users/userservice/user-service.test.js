const request = require('supertest');
const bcrypt = require('bcrypt');
const { MongoMemoryServer } = require('mongodb-memory-server');

const User = require('./user-model');
const ApiKey = require('./apikey-model');

let mongoServer;
let app;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const mongoUri = mongoServer.getUri();
  process.env.MONGODB_URI = mongoUri;
  app = require('./user-service');
});

afterAll(async () => {
  app.close();
  await mongoServer.stop();
});

beforeEach(async () => {
  // Limpiar las colecciones antes de cada test
  await User.deleteMany({});
  await ApiKey.deleteMany({});
});

describe('User Service', () => {
  describe('User Management', () => {
    it('should add a new user on POST /adduser', async () => {
      const newUser = {
        email: 'testuser@example.com',
        username: 'testuser',
        password: 'testpassword',
      };

      const response = await request(app).post('/adduser').send(newUser);
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('email', newUser.email);
      expect(response.body).toHaveProperty('username', newUser.username);

      // Check if the user is inserted into the database
      const userInDb = await User.findOne({ username: 'testuser' });

      // Assert that the user exists in the database
      expect(userInDb).not.toBeNull();
      expect(userInDb.username).toBe('testuser');

      // Assert that the password is encrypted
      const isPasswordValid = await bcrypt.compare('testpassword', userInDb.password);
      expect(isPasswordValid).toBe(true);
    });

    it('should return an error when adding a user with missing fields', async () => {
      const incompleteUser = {
        email: 'testuser@example.com',
        // missing username and password
      };

      const response = await request(app).post('/adduser').send(incompleteUser);
      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
    });

    it('should return an error when adding a user with duplicate email or username', async () => {
      // First create a user
      const existingUser = {
        email: 'duplicate@example.com',
        username: 'duplicate',
        password: 'password123',
      };
      await request(app).post('/adduser').send(existingUser);

      // Try to create another user with the same email
      const duplicateEmailUser = {
        email: 'duplicate@example.com',
        username: 'newusername',
        password: 'password123',
      };
      const response1 = await request(app).post('/adduser').send(duplicateEmailUser);
      expect(response1.status).toBe(400);
      expect(response1.body.error).toContain('Ya existe un usuario');

      // Try to create another user with the same username
      const duplicateUsernameUser = {
        email: 'new@example.com',
        username: 'duplicate',
        password: 'password123',
      };
      const response2 = await request(app).post('/adduser').send(duplicateUsernameUser);
      expect(response2.status).toBe(400);
      expect(response2.body.error).toContain('Ya existe un usuario');
    });
  });

  describe('API Key Management', () => {
    it('should generate a new API key for a valid email', async () => {
      const emailData = {
        email: 'test@example.com'
      };

      const response = await request(app).post('/generate-apikey').send(emailData);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('apiKey');
      expect(typeof response.body.apiKey).toBe('string');
      expect(response.body.apiKey.length).toBe(64); // 32 bytes = 64 hex chars

      // Verify API key is saved in the database
      const savedApiKey = await ApiKey.findOne({ email: 'test@example.com' });
      expect(savedApiKey).not.toBeNull();
      expect(savedApiKey.apiKey).toBe(response.body.apiKey);
    });

    it('should return an error when generating an API key with missing email', async () => {
      const response = await request(app).post('/generate-apikey').send({});

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('errorCode');
      expect(response.body.errorCode).toContain('EMAIL_REQUIRED');
    });

    it('should return an error when generating an API key with invalid email format', async () => {
      const invalidEmailData = {
        email: 'invalid-email'
      };

      const response = await request(app).post('/generate-apikey').send(invalidEmailData);

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('errorCode');
      expect(response.body.errorCode).toContain('INVALID_EMAIL_FORMAT');
    });

    it('should return an error when trying to generate a duplicate API key', async () => {
      const emailData = {
        email: 'duplicate@example.com'
      };

      // Generate first API key
      await request(app).post('/generate-apikey').send(emailData);

      // Try to generate a second API key for the same email
      const response = await request(app).post('/generate-apikey').send(emailData);

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('errorCode');
      expect(response.body.errorCode).toContain('EMAIL_ALREADY_EXISTS');
    });

    it('should validate an existing API key as valid', async () => {
      // First generate an API key
      const emailData = {
        email: 'validate@example.com'
      };
      const generateResponse = await request(app).post('/generate-apikey').send(emailData);
      const apiKey = generateResponse.body.apiKey;

      // Now validate the API key
      const validateResponse = await request(app).get(`/validate-apikey/${apiKey}`);

      expect(validateResponse.status).toBe(200);
      expect(validateResponse.body).toHaveProperty('isValid', true);
    });

    it('should validate a non-existent API key as invalid', async () => {
      const nonExistentApiKey = 'abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890';

      const response = await request(app).get(`/validate-apikey/${nonExistentApiKey}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('isValid', false);
    });
  });
});