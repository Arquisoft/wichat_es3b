const puppeteer = require('puppeteer');
const { defineFeature, loadFeature } = require('jest-cucumber');
const setDefaultOptions = require('expect-puppeteer').setDefaultOptions;
const feature = loadFeature('./features/login-form.feature');

const fs = require('fs');
const path = require('path');

let page;
let browser;
let username;
let password;

defineFeature(feature, test => {
    beforeAll(async () => {
        browser = process.env.GITHUB_ACTIONS
            ? await puppeteer.launch({ headless: "new", args: ['--no-sandbox', '--disable-setuid-sandbox'] })
            : await puppeteer.launch({ headless: false, slowMo: 100 });

        page = await browser.newPage();
        setDefaultOptions({ timeout: 10000 });

        // 1. Registro de usuario para que luego pueda loguearse
        await page.goto("http://localhost:3000/auth", { waitUntil: "networkidle0" });

        username = `testuser${Date.now()}`;
        password = 'testpassword';
        const email = `${username}@example.com`;

        try {
            await page.waitForSelector('#create-button', { visible: true, timeout: 5000 });
            await expect(page).toClick('button', { text: 'Crear cuenta' });

            await page.waitForSelector('#email', { visible: true });
            await expect(page).toFill('input#email', email);
            await expect(page).toFill('input#username', username);
            await expect(page).toFill('input#password', password);
            await expect(page).toFill('input#confirmPassword', password);

            await page.waitForSelector('#create-button', { visible: true, timeout: 5000 });
            await expect(page).toClick('button', { text: 'Crear cuenta' });

            await page.waitForSelector('.MuiSnackbar-root', { visible: true, timeout: 5000 });
            const snackbarText = await page.$eval('.MuiSnackbar-root', el => el.textContent.trim());
            console.log('Snackbar tras registro:', snackbarText);
            expect(snackbarText).toMatch('Usuario añadido correctamente');

        } catch (error) {
            console.error('Error en el registro:', error);
            throw error;
        }

        await page.goto("http://localhost:3000", { waitUntil: "networkidle0" });
    });

    test('The user is able to log in successfully', ({ given, when, then }) => {
        const screenshotsDir = path.resolve(__dirname, 'screenshots');

        given('A user who wants to log in', async () => {
            try {
                const linkExists = await page.evaluate(() => {
                    return Array.from(document.querySelectorAll('a')).some(link => link.textContent.includes('Iniciar sesión'));
                });

                console.log('¿Existe el enlace "Iniciar sesión"?', linkExists);

                if (!linkExists) {
                    if (!fs.existsSync(screenshotsDir)) {
                        fs.mkdirSync(screenshotsDir, { recursive: true });
                    }
                    const htmlPath = path.join(screenshotsDir, `page-dump-given-${Date.now()}.html`);
                    fs.writeFileSync(htmlPath, await page.content());
                    console.log(`Guardando HTML en: ${htmlPath}`);

                    const photoPath = path.join(screenshotsDir, `login-given-${Date.now()}.png`);
                    await page.screenshot({ path: photoPath, fullPage: true });
                    console.log(`Guardando captura en: ${photoPath}`);

                    throw new Error('No se encontró el enlace "Iniciar sesión" en el DOM');
                }

                await expect(page).toClick('a', { text: 'Iniciar sesión' });

            } catch (error) {
                console.error('Error al buscar o clicar en "Iniciar sesión":', error);

                if (!fs.existsSync(screenshotsDir)) {
                    fs.mkdirSync(screenshotsDir, { recursive: true });
                }

                const htmlPath = path.join(screenshotsDir, `page-dump-given-error-${Date.now()}.html`);
                fs.writeFileSync(htmlPath, await page.content());
                console.log(`Guardando HTML de error en: ${htmlPath}`);

                const photoPath = path.join(screenshotsDir, `login-given-error-${Date.now()}.png`);
                await page.screenshot({ path: photoPath, fullPage: true });
                console.log(`Guardando captura de error en: ${photoPath}`);

                throw error;
            }
        });

        when('I enter valid credentials and click login', async () => {
            try {
                await page.waitForSelector('#username', { visible: true, timeout: 5000 });
                await expect(page).toFill('input#username', username);
                await page.waitForTimeout(500);

                await page.waitForSelector('#password', { visible: true, timeout: 5000 });
                await expect(page).toFill('input#password', password);
                await page.waitForTimeout(500);

                await page.waitForSelector('button', { visible: true, timeout: 5000 });
                await expect(page).toClick('button', { text: 'Iniciar sesión' });

                await page.waitForTimeout(2000);

            } catch (error) {
                console.error('Error al rellenar o enviar el login:', error);

                if (!fs.existsSync(screenshotsDir)) {
                    fs.mkdirSync(screenshotsDir, { recursive: true });
                }

                const htmlPath = path.join(screenshotsDir, `page-dump-when-error-${Date.now()}.html`);
                fs.writeFileSync(htmlPath, await page.content());
                console.log(`Guardando HTML de error en: ${htmlPath}`);

                const photoPath = path.join(screenshotsDir, `login-when-error-${Date.now()}.png`);
                await page.screenshot({ path: photoPath, fullPage: true });
                console.log(`Guardando captura de error en: ${photoPath}`);

                throw error;
            }
        });

        then('I should be redirected to the home page', async () => {
            try {
                await page.waitForNavigation({ waitUntil: 'networkidle0', timeout: 5000 });
                const url = await page.url();
                console.log('URL tras login:', url);
                expect(url).toContain('/home');

            } catch (error) {
                console.error('Error al comprobar redirección:', error);

                if (!fs.existsSync(screenshotsDir)) {
                    fs.mkdirSync(screenshotsDir, { recursive: true });
                }

                const htmlPath = path.join(screenshotsDir, `page-dump-then-error-${Date.now()}.html`);
                fs.writeFileSync(htmlPath, await page.content());
                console.log(`Guardando HTML de error en: ${htmlPath}`);

                const photoPath = path.join(screenshotsDir, `login-then-error-${Date.now()}.png`);
                await page.screenshot({ path: photoPath, fullPage: true });
                console.log(`Guardando captura de error en: ${photoPath}`);

                throw error;
            }
        });
    });

    afterAll(async () => {
        await browser.close();
    });
});
