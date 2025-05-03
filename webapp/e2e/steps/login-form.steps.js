const puppeteer = require('puppeteer');
const { defineFeature, loadFeature } = require('jest-cucumber');
const setDefaultOptions = require('expect-puppeteer').setDefaultOptions;
const feature = loadFeature('./features/login-form.feature');

const fs = require('fs');
const path = require('path');

let page;
let browser;

defineFeature(feature, test => {
    beforeAll(async () => {
        browser = process.env.GITHUB_ACTIONS
            ? await puppeteer.launch({ headless: "new", args: ['--no-sandbox', '--disable-setuid-sandbox'] })
            : await puppeteer.launch({ headless: true, slowMo: 100 });

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
            const screenshotsDir = path.resolve(__dirname, 'screenshots');
            username = 'testuser';
            password = 'testpassword';

            try {
                // Esperamos que exista el enlace "Iniciar sesión"
                await page.waitForSelector('a', { visible: true, timeout: 5000 });
                const linkExists = await page.evaluate(() => {
                    return Array.from(document.querySelectorAll('a')).some(link => link.textContent.includes('Iniciar sesión'));
                });

                console.log('¿El enlace "Iniciar sesión" existe en el DOM?', linkExists);

                if (!linkExists) {
                    if (!fs.existsSync(screenshotsDir)) {
                        fs.mkdirSync(screenshotsDir, { recursive: true });
                    }
                    const htmlPath = path.join(screenshotsDir, `page-dump-given-${Date.now()}.html`);
                    fs.writeFileSync(htmlPath, await page.content());
                    console.log(`Guardando HTML de la página en: ${htmlPath}`);
                    throw new Error('No se encontró el enlace "Iniciar sesión" en el DOM');
                }

                await expect(page).toClick('a', { text: 'Iniciar sesión' });
                console.log('Clicado en "Iniciar sesión"');

            } catch (error) {
                console.error('Error al buscar o clicar en "Iniciar sesión":', error);
                if (!fs.existsSync(screenshotsDir)) {
                    fs.mkdirSync(screenshotsDir, { recursive: true });
                }
                const photoPath = path.join(screenshotsDir, `login-given-${Date.now()}.png`);
                console.log(`Guardando captura en: ${photoPath}`);
                await page.screenshot({ path: photoPath, fullPage: true });
                throw error;
            }
        });

        when('I enter valid credentials and click login', async () => {
            const screenshotsDir = path.resolve(__dirname, 'screenshots');

            try {
                await page.waitForSelector('#username', { visible: true, timeout: 5000 });
                await expect(page).toFill('input#username', username);
                console.log('Completamos username');
                await page.waitForTimeout(500);

                await page.waitForSelector('#password', { visible: true, timeout: 5000 });
                await expect(page).toFill('input#password', password);
                console.log('Completamos password');
                await page.waitForTimeout(500);

                await page.waitForSelector('button', { visible: true, timeout: 5000 });
                await expect(page).toClick('button', { text: 'Iniciar sesión' });
                console.log('Clicamos en botón de iniciar sesión');

                await page.waitForTimeout(2000);

            } catch (error) {
                console.error('Error al rellenar formulario o hacer login:', error);
                if (!fs.existsSync(screenshotsDir)) {
                    fs.mkdirSync(screenshotsDir, { recursive: true });
                }
                const htmlPath = path.join(screenshotsDir, `page-dump-when-${Date.now()}.html`);
                fs.writeFileSync(htmlPath, await page.content());
                console.log(`Guardando HTML de la página en: ${htmlPath}`);

                const photoPath = path.join(screenshotsDir, `login-when-${Date.now()}.png`);
                console.log(`Guardando captura en: ${photoPath}`);
                await page.screenshot({ path: photoPath, fullPage: true });
                throw error;
            }
        });

        then('I should be redirected to the home page', async () => {
            const screenshotsDir = path.resolve(__dirname, 'screenshots');

            try {
                //await page.waitForNavigation({ waitUntil: 'networkidle0', timeout: 5000 });
                const url = await page.url();
                console.log('URL tras login:', url);
                expect(url).toContain('/home');

            } catch (error) {
                console.error('Error en la redirección tras login:', error);
                if (!fs.existsSync(screenshotsDir)) {
                    fs.mkdirSync(screenshotsDir, { recursive: true });
                }
                const photoPath = path.join(screenshotsDir, `login-then-${Date.now()}.png`);
                console.log(`Guardando captura en: ${photoPath}`);
                await page.screenshot({ path: photoPath, fullPage: true });
                const htmlPath = path.join(screenshotsDir, `page-dump-given-${Date.now()}.html`);
                fs.writeFileSync(htmlPath, await page.content());
                console.log(`Guardando HTML de la página en: ${htmlPath}`);
                throw error;
            }
        });

    });

    afterAll(async () => {
        await browser.close();
    });
});
