const puppeteer = require('puppeteer');
const { defineFeature, loadFeature } = require('jest-cucumber');
const setDefaultOptions = require('expect-puppeteer').setDefaultOptions;
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

            // Clicar en "Iniciar sesión" desde el navbar
            await expect(page).toClick('a', { text: 'Iniciar sesión' });
        });

        when('I enter valid credentials and click login', async () => {
            await expect(page).toFill('input#username', username);
            await expect(page).toFill('input#password', password);
            await expect(page).toClick('button', { text: 'Iniciar sesión' });

            // Añadir un timeout de 2 segundos después de hacer clic
            await page.waitForTimeout(2000); // Espera 2 segundos antes de continuar
        });

        then('I should be redirected to the home page', async () => {
            const url = await page.url();
            expect(url).toContain('/home');  // Verifica que la URL esté en la página de inicio
        });
    });

    afterAll(async () => {
        await browser.close();
    });
});
