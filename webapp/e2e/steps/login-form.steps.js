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
        const screenshotsDir = path.resolve(__dirname, 'screenshots');

        // 1. Registro de usuario
        await page.goto("http://localhost:3000/auth", { waitUntil: "networkidle0" });

        username = `testuser${Date.now()}`;
        password = 'testpassword';
        const email = `${username}@example.com`;

        try {
            // Acceder al formulario de registro
            await page.waitForSelector('#create-button', { visible: true, timeout: 5000 });
            await expect(page).toClick('button', { text: 'Crear cuenta' });

            // Rellenar formulario
            await page.waitForSelector('#email', { visible: true });
            await expect(page).toFill('input#email', email);
            await expect(page).toFill('input#username', username);
            await expect(page).toFill('input#password', password);
            await expect(page).toFill('input#confirmPassword', password);

            await page.waitForSelector('#create-button', { visible: true, timeout: 5000 });
            await expect(page).toClick('button', { text: 'Crear cuenta' });

            // Esperar el mensaje de éxito
            await page.waitForSelector('.MuiSnackbar-root', { visible: true, timeout: 5000 });
            const snackbarText = await page.$eval('.MuiSnackbar-root', el => el.textContent.trim());
            console.log('Snackbar tras registro:', snackbarText);
            expect(snackbarText).toMatch('Usuario añadido correctamente');

        } catch (error) {
            console.error('Error en el registro:', error);
            const photopath = path.join(screenshotsDir, `login-before-${Date.now()}.png`);
            await page.screenshot({ path: photopath, fullPage: true });
            throw error;
        }

        // 2. Ir a Home para iniciar sesión
        await page.goto("http://localhost:3000", { waitUntil: "networkidle0" });
    });

    test('The user is able to log in successfully', ({ given, when, then }) => {

        given('A user who wants to log in', async () => {
            const screenshotsDir = path.resolve(__dirname, 'screenshots');
            try {
                await page.waitForSelector('a', { visible: true, timeout: 5000 });
                const linkExists = await page.evaluate(() => {
                    return Array.from(document.querySelectorAll('a')).some(link => link.textContent.includes('Iniciar sesión'));
                });

                if (!linkExists) {
                    if (!fs.existsSync(screenshotsDir)) {
                        fs.mkdirSync(screenshotsDir, { recursive: true });
                    }
                    const htmlPath = path.join(screenshotsDir, `page-dump-given-${Date.now()}.html`);
                    fs.writeFileSync(htmlPath, await page.content());
                    throw new Error('No se encontró el enlace "Iniciar sesión" en el DOM');
                }

                await expect(page).toClick('a', { text: 'Iniciar sesión' });

            } catch (error) {
                console.error('Error al buscar o clicar en "Iniciar sesión":', error);
                const photopath = path.join(screenshotsDir, `login-given-${Date.now()}.png`);
                await page.screenshot({ path: photopath, fullPage: true });
                throw error;
            }
        });

        when('I enter valid credentials and click login', async () => {
            const screenshotsDir = path.resolve(__dirname, 'screenshots');
            try {

                await page.waitForSelector('#username', { visible: true, timeout: 5000 });
                await expect(page).toFill('input#username', username);

                await page.waitForSelector('#password', { visible: true, timeout: 5000 });
                await expect(page).toFill('input#password', password);

                await page.waitForSelector('button', { visible: true, timeout: 5000 });
                await expect(page).toClick('button', { text: 'Iniciar sesión' });

                await page.waitForTimeout(2000);

            } catch (error) {
                console.error('Error al rellenar formulario o hacer login:', error);
                const photopath = path.join(screenshotsDir, `login-when-${Date.now()}.png`);
                await page.screenshot({ path: photopath, fullPage: true });
                throw error;
            }
        });

        then('I should be redirected to the home page', async () => {
            const screenshotsDir = path.resolve(__dirname, 'screenshots');
            try {
                await page.waitForNavigation({ waitUntil: 'networkidle0', timeout: 5000 });
                const url = await page.url();
                console.log('URL tras login:', url);
                expect(url).toContain('/home');

            } catch (error) {
                console.error('Error en la redirección tras login:', error);
                const photopath = path.join(screenshotsDir, `login-then-${Date.now()}.png`);
                await page.screenshot({ path: photopath, fullPage: true });
                throw error;
            }
        });

    });

    afterAll(async () => {
        await browser.close();
    });
});

