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
                // Responder con el JSON corregido
                request.respond({
                    status: 200,
                    contentType: 'application/json',
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
                        },
                        {
                            "pregunta": {
                                "es": "¿Cuál es el estadio del club de fútbol Juventus?",
                                "en": "What is the stadium of the football club Juventus?"
                            },
                            "respuestaCorrecta": {
                                "es": "Juventus Stadium",
                                "en": "Juventus Stadium"
                            },
                            "respuestas": {
                                "es": [
                                    "Estadio Luigi Ferraris",
                                    "Parc Olympique lyonnais",
                                    "Juventus Stadium",
                                    "Estadio Giuseppe Meazza"
                                ],
                                "en": [
                                    "Stadio Luigi Ferraris",
                                    "Parc Olympique Lyonnais",
                                    "Juventus Stadium",
                                    "Giuseppe Meazza Stadium"
                                ]
                            },
                            "descripcion": [
                                {
                                    "propiedad": "fecha de fundación o creación",
                                    "valor": "1/11/1897"
                                },
                                {
                                    "propiedad": "ubicación de la sede",
                                    "valor": "Turín"
                                },
                                {
                                    "propiedad": "país",
                                    "valor": "Italia"
                                },
                                {
                                    "propiedad": "fundador",
                                    "valor": "Carlo Vittorio Varetti"
                                },
                                {
                                    "propiedad": "entrenador",
                                    "valor": "Igor Tudor"
                                }
                            ],
                            "img": [
                                "http://commons.wikimedia.org/wiki/Special:FilePath/Juventus%20FC%20-%20logo%20black%20%28Italy%2C%202020%29.svg"
                            ]
                        }
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
            await page.waitForSelector('#answer-1', { visible: true, timeout: 5000 });
            for (let i = 0; i < 10; i++) {
                await page.waitForSelector('#answer-1', { visible: true, timeout: 5000 });
                await page.click('#answer-1');
                await page.waitForSelector('#nextArrow', { visible: true, timeout: 5000 });
                await page.click('#nextArrow');
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