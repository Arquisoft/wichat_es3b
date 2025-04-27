const puppeteer = require('puppeteer');
const { defineFeature, loadFeature } = require('jest-cucumber');
const setDefaultOptions = require('expect-puppeteer').setDefaultOptions;
const fs = require('fs');
const path = require('path');

const feature = loadFeature('./features/login-form.feature');

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
    });

    test('The user is able to log in successfully', ({ given, when, then }) => {
        let username;
        let password;

        given('A user who wants to log in', async () => {
            username = 'enol';
            password = '1234';

            const screenshotsDir = path.resolve(__dirname, 'screenshots');

            try {
                const linkExists = await page.evaluate(() => {
                    const link = Array.from(document.querySelectorAll('a')).find(a => a.textContent.includes('Iniciar sesión'));
                    return link !== undefined;
                });

                console.log('¿El enlace "Iniciar sesión" existe en el DOM?', linkExists);

                if (!linkExists) {
                    if (!fs.existsSync(screenshotsDir)) {
                        fs.mkdirSync(screenshotsDir, { recursive: true });
                    }
                    const htmlPath = path.join(screenshotsDir, `page-dump-login-given-${Date.now()}.html`);
                    const pageContent = await page.content();
                    fs.writeFileSync(htmlPath, pageContent);
                    console.log(`Guardando HTML de la página en: ${htmlPath}`);

                    throw new Error('El enlace "Iniciar sesión" no está presente en el DOM');
                }

                await expect(page).toClick('a', { text: 'Iniciar sesión' });
                console.log('Clicado en "Iniciar sesión"');

            } catch (error) {
                console.error('Error en el clic de "Iniciar sesión":', error);

                if (!fs.existsSync(screenshotsDir)) {
                    fs.mkdirSync(screenshotsDir, { recursive: true });
                }

                const photoPath = path.join(screenshotsDir, `login-given-${Date.now()}.png`);
                await page.screenshot({ path: photoPath, fullPage: true });
                console.log(`Guardando captura en: ${photoPath}`);

                throw error;
            }
        });

        when('I enter valid credentials and click login', async () => {
            const screenshotsDir = path.resolve(__dirname, 'screenshots');

            try {
                await page.waitForSelector('input#username', { visible: true, timeout: 5000 });
                await expect(page).toFill('input#username', username);
                console.log('Completamos username');

                await page.waitForTimeout(500);

                await page.waitForSelector('input#password', { visible: true, timeout: 5000 });
                await expect(page).toFill('input#password', password);
                console.log('Completamos password');

                await page.waitForTimeout(500);

                await page.waitForSelector('button', { visible: true, timeout: 5000 });
                await expect(page).toClick('button', { text: 'Iniciar sesión' });
                console.log('Clicamos en botón de iniciar sesión');

                await page.waitForTimeout(2000); // dejamos un pequeño respiro al front

            } catch (error) {
                console.error('Error rellenando formulario o clicando en login:', error);

                if (!fs.existsSync(screenshotsDir)) {
                    fs.mkdirSync(screenshotsDir, { recursive: true });
                }

                const htmlPath = path.join(screenshotsDir, `page-dump-login-when-${Date.now()}.html`);
                const pageContent = await page.content();
                fs.writeFileSync(htmlPath, pageContent);
                console.log(`Guardando HTML de la página en: ${htmlPath}`);

                const photoPath = path.join(screenshotsDir, `login-when-${Date.now()}.png`);
                await page.screenshot({ path: photoPath, fullPage: true });
                console.log(`Guardando captura en: ${photoPath}`);

                throw error;
            }
        });

        then('I should be redirected to the home page', async () => {
            const screenshotsDir = path.resolve(__dirname, 'screenshots');

            try {
                await page.waitForSelector('.MuiSnackbar-root', { visible: true, timeout: 5000 });
                const snackbarText = await page.$eval('.MuiSnackbar-root', el => el.textContent.trim());
                console.log('Snackbar Text:', snackbarText);

                expect(snackbarText).toMatch('Has iniciado sesión correctamente');

                const url = await page.url();
                console.log('URL tras login:', url);
                expect(url).toContain('/home');

            } catch (error) {
                console.error('Error en la redirección tras login:', error);

                if (!fs.existsSync(screenshotsDir)) {
                    fs.mkdirSync(screenshotsDir, { recursive: true });
                }

                const photoPath = path.join(screenshotsDir, `login-then-${Date.now()}.png`);
                await page.screenshot({ path: photoPath, fullPage: true });
                console.log(`Guardando captura en: ${photoPath}`);

                throw error;
            }
        });
    });

    afterAll(async () => {
        await browser.close();
    });
});
