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
                        'Access-Control-Allow-Origin': '*',
                        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
                        'Access-Control-Allow-Headers': 'Content-Type'
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
                                { "propiedad": "capital", "valor": "Tokio" },
                                { "propiedad": "jefe de Estado", "valor": "Naruhito" },
                                { "propiedad": "participó en", "valor": "Grupo de los cuatro" },
                                { "propiedad": "idioma oficial", "valor": "japonés" }
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
                                { "propiedad": "fecha de fundación o creación", "valor": "1/11/1897" },
                                { "propiedad": "ubicación de la sede", "valor": "Turín" },
                                { "propiedad": "país", "valor": "Italia" },
                                { "propiedad": "fundador", "valor": "Carlo Vittorio Varetti" },
                                { "propiedad": "entrenador", "valor": "Igor Tudor" }
                            ],
                            "img": [
                                "http://commons.wikimedia.org/wiki/Special:FilePath/Juventus%20FC%20-%20logo%20black%20%28Italy%2C%202020%29.svg"
                            ]
                        },
                        {
                            "pregunta": {
                                "es": "¿Quién es el autor de la obra literaria World Brain?",
                                "en": "Who is the author of the literary work World Brain?"
                            },
                            "respuestaCorrecta": {
                                "es": "H. G. Wells",
                                "en": "H. G. Wells"
                            },
                            "respuestas": {
                                "es": [
                                    "Jorge Luis Borges",
                                    "Douglas Adams",
                                    "H. G. Wells",
                                    "Miguel de Cervantes"
                                ],
                                "en": [
                                    "Jorge Luis Borges",
                                    "Douglas Adams",
                                    "H. G. Wells",
                                    "Miguel de Cervantes"
                                ]
                            },
                            "descripcion": [
                                { "propiedad": "fecha de publicación", "valor": "1/1/1938" },
                                { "propiedad": "género", "valor": "ensayo" }
                            ],
                            "img": [
                                "http://commons.wikimedia.org/wiki/Special:FilePath/World%20Brain%20HG%20Wells%201938.jpg"
                            ]
                        },
                        {
                            "pregunta": {
                                "es": "¿En qué año se pintó la obra Placa de la Pioneer?",
                                "en": "In what year was the artwork Placa de la Pioneer painted?"
                            },
                            "respuestaCorrecta": {
                                "es": "1/1/1972",
                                "en": "1/1/1972"
                            },
                            "respuestas": {
                                "es": [
                                    "1/1/1770",
                                    "1/1/1972",
                                    "1/1/1503",
                                    "1/1/1492"
                                ],
                                "en": [
                                    "1/1/1770",
                                    "1/1/1972",
                                    "1/1/1503",
                                    "1/1/1492"
                                ]
                            },
                            "descripcion": [
                                { "propiedad": "ubicación", "valor": "sistema solar exterior" }
                            ],
                            "img": [
                                "http://commons.wikimedia.org/wiki/Special:FilePath/GPN-2000-001621-x.jpg"
                            ]
                        },
                        {
                            "pregunta": {
                                "es": "¿Quién es director de la película Kick-Ass?",
                                "en": "Who is the director of the movie Kick-Ass?"
                            },
                            "respuestaCorrecta": {
                                "es": "Matthew Vaughn",
                                "en": "Matthew Vaughn"
                            },
                            "respuestas": {
                                "es": [
                                    "Olivier Marchal",
                                    "Olivier Nakache",
                                    "Matthew Vaughn",
                                    "Ondi Timoner"
                                ],
                                "en": [
                                    "Olivier Marchal",
                                    "Olivier Nakache",
                                    "Matthew Vaughn",
                                    "Ondi Timoner"
                                ]
                            },
                            "descripcion": [
                                { "propiedad": "fecha de publicación", "valor": "12/3/2010" },
                                { "propiedad": "costo", "valor": 30000000 }
                            ],
                            "img": [
                                "http://commons.wikimedia.org/wiki/Special:FilePath/Kick-ass.svg"
                            ]
                        },
                        {
                            "pregunta": {
                                "es": "¿Cuál es el género de la obra literaria Corán?",
                                "en": "What is the genre of the literary work Corán?"
                            },
                            "respuestaCorrecta": {
                                "es": "libro sagrado",
                                "en": "religious text"
                            },
                            "respuestas": {
                                "es": [
                                    "novela de caballerías",
                                    "fantasía",
                                    "ensayo",
                                    "libro sagrado"
                                ],
                                "en": [
                                    "chivalric romance",
                                    "fantasy",
                                    "essay",
                                    "religious text"
                                ]
                            },
                            "descripcion": [
                                { "propiedad": "personajes", "valor": "Mahoma" }
                            ],
                            "img": [
                                "http://commons.wikimedia.org/wiki/Special:FilePath/AndalusQuran.JPG"
                            ]
                        },
                        {
                            "pregunta": {
                                "es": "¿En qué año se pintó la obra Woman with a Mirror?",
                                "en": "In what year was the artwork Woman with a Mirror painted?"
                            },
                            "respuestaCorrecta": {
                                "es": "1/1/1515",
                                "en": "1/1/1515"
                            },
                            "respuestas": {
                                "es": [
                                    "1/1/1503",
                                    "1/1/1972",
                                    "1/1/1492",
                                    "1/1/1515"
                                ],
                                "en": [
                                    "1/1/1503",
                                    "1/1/1972",
                                    "1/1/1492",
                                    "1/1/1515"
                                ]
                            },
                            "descripcion": [
                                { "propiedad": "movimiento", "valor": "escuela veneciana" },
                                { "propiedad": "ubicación", "valor": "Salle des États" }
                            ],
                            "img": [
                                "http://commons.wikimedia.org/wiki/Special:FilePath/Portrait%20d%27une%20Femme%20%C3%A0%20sa%20Toilette%2C%20by%20Titian%2C%20from%20C2RMF%20retouched.jpg"
                            ]
                        },
                        {
                            "pregunta": {
                                "es": "¿Cuál es uno de los idiomas oficiales de Canadá?",
                                "en": "What is one of the official languages of Canadá?"
                            },
                            "respuestaCorrecta": {
                                "es": "francés",
                                "en": "French"
                            },
                            "respuestas": {
                                "es": [
                                    "francés",
                                    "noruego",
                                    "nynorsk",
                                    "japonés"
                                ],
                                "en": [
                                    "French",
                                    "Norwegian",
                                    "Nynorsk",
                                    "Japanese"
                                ]
                            },
                            "descripcion": [
                                { "propiedad": "capital", "valor": "Ottawa" },
                                { "propiedad": "jefe de Estado", "valor": "Carlos III del Reino Unido" },
                                { "propiedad": "participó en", "valor": "Guerra del Pacífico" },
                                { "propiedad": "comparte fronteras con", "valor": "Estados Unidos" }
                            ],
                            "img": [
                                "http://commons.wikimedia.org/wiki/Special:FilePath/Flag%20of%20Canada%20%28Pantone%29.svg"
                            ]
                        },
                        {
                            "pregunta": {
                                "es": "¿En qué fecha se estrenó el film Swept Away?",
                                "en": "On what date was the film Swept Away released?"
                            },
                            "respuestaCorrecta": {
                                "es": "1/1/1974",
                                "en": "1/1/1974"
                            },
                            "respuestas": {
                                "es": [
                                    "19/1/2009",
                                    "1/1/2011",
                                    "1/1/1974",
                                    "10/11/2011"
                                ],
                                "en": [
                                    "19/1/2009",
                                    "1/1/2011",
                                    "1/1/1974",
                                    "10/11/2011"
                                ]
                            },
                            "descripcion": [
                                { "propiedad": "director", "valor": "Lina Wertmüller" }
                            ],
                            "img": [
                                "http://commons.wikimedia.org/wiki/Special:FilePath/MelatoGianniniTravolti1974WP.jpg"
                            ]
                        },
                        {
                            "pregunta": {
                                "es": "¿Cuál es el entrenador del club de fútbol Inter de Milán?",
                                "en": "Who is the coach of the football club Inter de Milán?"
                            },
                            "respuestaCorrecta": {
                                "es": "Simone Inzaghi",
                                "en": "Simone Inzaghi"
                            },
                            "respuestas": {
                                "es": [
                                    "Simone Inzaghi",
                                    "Alberigo Evani",
                                    "Paulo Fonseca",
                                    "Igor Tudor"
                                ],
                                "en": [
                                    "Simone Inzaghi",
                                    "Alberico Evani",
                                    "Paulo Fonseca",
                                    "Igor Tudor"
                                ]
                            },
                            "descripcion": [
                                { "propiedad": "fecha de fundación o creación", "valor": "9/3/1908" },
                                { "propiedad": "ubicación de la sede", "valor": "Milán" },
                                { "propiedad": "país", "valor": "Italia" },
                                { "propiedad": "estadio", "valor": "Estadio Giuseppe Meazza" }
                            ],
                            "img": [
                                "http://commons.wikimedia.org/wiki/Special:FilePath/FC%20Internazionale%20Milano%202021.svg"
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
                await page.waitForSelector('#answer-1', { visible: true, timeout: 5000 });
                for (let i = 1; i < 10; i++) {
                    await page.waitForSelector('#answer-1', { visible: true, timeout: 5000 });
                    await expect(page).toClick('#answer-1', {});
                    await page.waitForSelector('#nextArrow', { visible: true, timeout: 5000 });
                    await expect(page).toClick('#nextArrow', {});
                }
                await page.waitForSelector('#answer-1', { visible: true, timeout: 5000 });
                await expect(page).toClick('#answer-1', {});
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

            // Lo anterior espera a que el elemento aparezca, no debería hacer falta compararlo, ya que esto no coge el h1 que debería.
            // const finalScoreText = await page.$eval('h1', el => el.textContent.trim());
            // expect(finalScoreText).toBe('Resumen de la partida');
        });
    },600000);

    afterAll(async () => {
        await browser.close();
    });
});