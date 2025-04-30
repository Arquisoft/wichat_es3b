const puppeteer = require('puppeteer');
const { defineFeature, loadFeature } = require('jest-cucumber');
const fs = require("fs");
const path = require("path");
const setDefaultOptions = require('expect-puppeteer').setDefaultOptions;
const feature = loadFeature('./features/game.feature');

let page;
let browser;

defineFeature(feature, test => {
    beforeAll(async () => {
        browser = process.env.GITHUB_ACTIONS
            ? await puppeteer.launch({ headless: "new", args: ['--no-sandbox', '--disable-setuid-sandbox'] })
            : await puppeteer.launch({ headless: false, slowMo: 100 });

        page = await browser.newPage();
        setDefaultOptions({ timeout: 10000 });

        await page.goto("http://localhost:3000", {
            waitUntil: "networkidle0",
        });

        // Login process
        const username = 'testuser';
        const password = 'testpassword';

        try {
            // Click on "Iniciar sesión" link
            await page.waitForSelector('a', { visible: true, timeout: 5000 });
            await expect(page).toClick('a', { text: 'Iniciar sesión' });

            // Fill in login form
            await page.waitForSelector('#username', { visible: true, timeout: 5000 });
            await expect(page).toFill('input#username', username);

            await page.waitForSelector('#password', { visible: true, timeout: 5000 });
            await expect(page).toFill('input#password', password);

            // Submit login form
            await page.waitForSelector('button', { visible: true, timeout: 5000 });
            await expect(page).toClick('button', { text: 'Iniciar sesión' });

            // Wait for redirection to home page
            await page.waitForNavigation({ waitUntil: 'networkidle0', timeout: 5000 });
            const url = await page.url();
            if (!url.includes('/home')) {
                throw new Error('Login failed or redirection did not occur');
            }
        } catch (error) {
            console.error('Error during login process:', error);
            await browser.close();
            throw error;
        }

        // Habilitar la interceptación de solicitudes
        await page.setRequestInterception(true);

        page.on('request', (request) => {
            if (request.url().includes('/questionsDB')) {
                // Respond with the JSON and include CORS headers
                request.respond({
                    status: 200,
                    contentType: 'application/json',
                    headers: {
                        'Access-Control-Allow-Origin': '*', // Allow all origins
                        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS', // Allow specific methods
                        'Access-Control-Allow-Headers': 'Content-Type' // Allow specific headers
                    },
                    body: JSON.stringify([
                        {
                            "pregunta": {
                                "es": "¿Con qué país comparte frontera Japón?",
                                "en": "Which country shares a border with Japón?"
                            },
                            "respuestaCorrecta": {
                                "es": "Estados Unidos",
                                "en": "United States"
                            },
                            "respuestas": {
                                "es": [
                                    "Estados Unidos",
                                    "Reino de Dinamarca",
                                    "Finlandia",
                                    "Suecia"
                                ],
                                "en": [
                                    "United States",
                                    "Kingdom of Denmark",
                                    "Finland",
                                    "Sweden"
                                ]
                            },
                            "descripcion": [
                                {
                                    "propiedad": "capital",
                                    "valor": "Tokio"
                                },
                                {
                                    "propiedad": "jefe de Estado",
                                    "valor": "Naruhito"
                                },
                                {
                                    "propiedad": "participó en",
                                    "valor": "Grupo de los cuatro"
                                },
                                {
                                    "propiedad": "idioma oficial",
                                    "valor": "japonés"
                                }
                            ],
                            "img": [
                                "http://commons.wikimedia.org/wiki/Special:FilePath/Flag%20of%20Japan.svg"
                            ]
                        }
                        // Add more questions as needed
                    ])
                });
            } else {
                request.continue();
            }
        });
    });

    test('The user is able to play a game', ({ given, when, then }) => {

        given('A logged user', async () => {
            // Ensure the game page is loaded
            await page.waitForSelector('button', { visible: true, timeout: 5000 });
        });

        when('I play a game', async () => {
            try{
            await expect(page).toClick('a', { text: 'Jugar' });
            await page.waitForSelector('#numPreguntas', { visible: true, timeout: 5000 });
            await page.select('#numPreguntas', '10');
            await expect(page).toClick('button', { text: 'Jugar' });
            await page.waitForSelector('#answer-1', { visible: true, timeout: 50000 });
            for (let i = 0; i < 10; i++) {
                await page.waitForSelector('#answer-1', { visible: true, timeout: 5000 });
                await expect(page).toClick('#answer-1', {});
                await page.waitForSelector('#nextArrow', { visible: true, timeout: 5000 });
                await expect(page).toClick('#nextArrow', {});
            }
            } catch (error) {
                console.error('Error al jugar:', error);
                if (!fs.existsSync(screenshotsDir)) {
                    fs.mkdirSync(screenshotsDir, { recursive: true });
                }
                const htmlPath = path.join(screenshotsDir, `page-dump-complete-game-when-${Date.now()}.html`);
                fs.writeFileSync(htmlPath, await page.content());
                console.log(`Guardando HTML de la página en: ${htmlPath}`);

                const photoPath = path.join(screenshotsDir, `complete-game-when-${Date.now()}.png`);
                console.log(`Guardando captura en: ${photoPath}`);
                await page.screenshot({ path: photoPath, fullPage: true });
                throw error;
            }
        });

        then('The results page should be shown', async () => {
            await page.waitForSelector('h1', { text: "Resumen de la partida", timeout: 5000 });
            const finalScoreText = await page.$eval('h1', el => el.textContent.trim());
            expect(finalScoreText).toBe('Resumen de la partida');
        });
    });

    afterAll(async () => {
        await browser.close();
    });
});