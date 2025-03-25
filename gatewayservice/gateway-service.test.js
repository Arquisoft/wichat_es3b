const request = require('supertest');
const axios = require('axios');
const app = require('./gateway-service'); 

// Close the server after all tests
afterAll(async () => {
    app.close();
});

// Mock axios to prevent actual API calls
jest.mock('axios');

describe('Gateway Service', () => {
    // Mock responses from external services
    axios.post.mockImplementation((url, data) => {
        if (url.endsWith('/login')) {
            return Promise.resolve({ data: { token: 'mockedToken' } });
        } else if (url.endsWith('/adduser')) {
            return Promise.resolve({ data: { userId: 'mockedUserId' } });
        } else if (url.endsWith('/ask')) {
            return Promise.resolve({ data: { answer: 'llmanswer' } });
        } else if (url.endsWith('/load')) {
            return Promise.resolve({ data: { status: 'questions loaded' } });
        }
    });
    
    axios.get.mockImplementation((url) => {
        if (url.endsWith('/getRound')) {
            return Promise.resolve({ data: { round: 'mockedRoundData' } });
        }
    });
    
    // Test /health endpoint
    it('should return status OK for health check', async () => {
        const response = await request(app).get('/health');
        expect(response.statusCode).toBe(200);
        expect(response.body).toEqual({ status: 'OK' });
    });
    
    // Test /login endpoint
    it('should forward login request to auth service', async () => {
        const response = await request(app)
            .post('/login')
            .send({ username: 'testuser', password: 'testpassword' });

        expect(response.statusCode).toBe(200);
        expect(response.body.token).toBe('mockedToken');
    });
    
    // Test /adduser endpoint
    it('should forward add user request to user service', async () => {
        const response = await request(app)
            .post('/adduser')
            .send({ username: 'newuser', password: 'newpassword' });

        expect(response.statusCode).toBe(200);
        expect(response.body.userId).toBe('mockedUserId');
    });
    
    // Test /askllm endpoint
    it('should forward askllm request to the llm service', async () => {
        const response = await request(app)
            .post('/askllm')
            .send({ question: 'question', apiKey: 'apiKey', model: 'gemini' });

        expect(response.statusCode).toBe(200);
        expect(response.body.answer).toBe('llmanswer');
    });
    
    // Test /loadQuestion endpoint
    it('should forward loadQuestion request to the question service', async () => {
        const response = await request(app)
            .post('/loadQuestion')
            .send({ modes: ['city', 'athlete'] });

        expect(response.statusCode).toBe(200);
        expect(response.body.status).toBe('questions loaded');
    });
    
    // Test /getRound endpoint
    it('should fetch round data from the question service', async () => {
        const response = await request(app).get('/getRound');
        
        expect(response.statusCode).toBe(200);
        expect(response.body.round).toBe('mockedRoundData');
    });
});
