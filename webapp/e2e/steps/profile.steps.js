const puppeteer = require('puppeteer');
const { defineFeature, loadFeature } = require('jest-cucumber');
const setDefaultOptions = require('expect-puppeteer').setDefaultOptions;

const feature = loadFeature('./features/profile.feature');

let page;
let browser;

defineFeature(feature, test => {
    beforeAll(async () => {
        browser = process.env.GITHUB_ACTIONS
            ? await puppeteer.launch({ headless: 'new', args: ['--no-sandbox', '--disable-setuid-sandbox'] })
            : await puppeteer.launch({ headless: false, slowMo: 100 });

        page = await browser.newPage();
        setDefaultOptions({ timeout: 10000 });

        await page.goto('http://localhost:3000', {
            waitUntil: 'networkidle0',
        });
    });

    test('The user is redirected to /profile after clicking the "Perfil" link', ({ given, when, then }) => {
        let username = 'enol';
        let password = '1234';

        given('A user who is logged in', async () => {
            // Click on "Iniciar sesión" in the navbar
            await expect(page).toClick('a', { text: 'Iniciar sesión' });

            // Fill login form
            await expect(page).toFill('input#username', username);
            await expect(page).toFill('input#password', password);
            await expect(page).toClick('button', { text: 'Iniciar sesión' });

            // Wait until "Perfil" link is visible
            await page.waitForXPath("//a[contains(text(), 'Perfil')]");
        });

        when('I click on the "Perfil" link in the navbar', async () => {
            const [profileLink] = await page.$x("//a[contains(text(), 'Perfil')]");
            await profileLink.click();

            // Wait for route change
            await page.waitForTimeout(1000);
        });

        then('I should be redirected to the "/profile" page', async () => {
            const url = await page.url();

            expect(url).toContain('/profile');
        });
    });

    afterAll(async () => {
        await browser.close();
    });
});
