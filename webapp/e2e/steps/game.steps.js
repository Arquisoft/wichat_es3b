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
            ? await puppeteer.launch({ headless: "new", args: ['--no-sandbox', '--disable-setuid-sandbox'], slowMo: 100})
            : await puppeteer.launch({ headless: false, slowMo: 100});

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
            // Esperamos a que carguen todas las preguntas.
            await page.waitForTimeout(10000);
        } catch (error) {
            console.error('Error during login process: ', error);
            await browser.close();
            throw error;
        }
    });

    beforeEach(async () => {
        await page.goto("http://localhost:3000/home", {
            waitUntil: "networkidle0",
        });
    });

    test('The user is able to start playing a game', ({ given, when, then }) => {
        given('A logged user', async () => {
            // Ensure the game page is loaded
            await page.waitForSelector('button', { visible: true, timeout: 5000 });
        });

        when('I configure and start a new game', async () => {
            await startDefaultGame();
        }
        );

        then('The game page should be shown', async () => {
            await page.waitForSelector('#answer-1', { visible: true, timeout: 500000 });
        });
    },600000000);

    test('The user is able to play a game', ({ given, when, then }) => {

        given('A logged user', async () => {
            await page.waitForSelector('button', { visible: true, timeout: 5000 });
        });

        when('I play a game', async () => {
            try{
                await startDefaultGame();
                await playA10QGame();
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
        });
    },600000000);

    test('The user is able to restart a game', ({ given, when, then }) => {
        given('A logged user', async () => {
            // Ensure the game page is loaded
            await page.waitForSelector('button', { visible: true, timeout: 5000 });
        });

        when('I play a game and start another', async () => {

            await startDefaultGame();
            await playA10QGame();
            await expect(page).toClick('button', {text: "Entendido"});
            await page.waitForSelector('#numPreguntas', { visible: true, timeout: 5000 });
            await page.select('#numPreguntas', '10');
            await expect(page).toClick('button', { text: 'Jugar' });
        }
        );

        then('A new question should be shown', async () => {
            await page.waitForSelector('#answer-1', { visible: true, timeout: 500000 });
        });
    },600000000);

    async function startDefaultGame() {
        await expect(page).toClick('a', { text: 'Jugar' });
        await page.waitForSelector('#numPreguntas', { visible: true, timeout: 5000 });
        await page.select('#numPreguntas', '10');
        await expect(page).toClick('button', { text: 'Jugar' });
    }

    async function playA10QGame() {
        for (let i = 1; i < 10; i++) {
            await page.waitForSelector('#answer-1', { visible: true, timeout: 500000 });
            await expect(page).toClick('#answer-1', {});
            await page.waitForSelector('#nextArrow', { visible: true, timeout: 5000 });
            await expect(page).toClick('#nextArrow', {});
        }
        await page.waitForSelector('#answer-1', { visible: true, timeout: 5000 });
        await expect(page).toClick('#answer-1', {});
    }

    afterAll(async () => {
        await browser.close();
    });
});