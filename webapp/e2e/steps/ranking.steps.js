const puppeteer = require('puppeteer');
const { defineFeature, loadFeature } = require('jest-cucumber');
const setDefaultOptions = require('expect-puppeteer').setDefaultOptions;

const feature = loadFeature('./features/ranking.feature');

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

    test('The user is redirected to /ranking after clicking the "Ranking" link', ({ given, when, then }) => {
        let username = 'enol';
        let password = '1234';

        given('A user who is logged in', async () => {
            await expect(page).toClick('a', { text: 'Iniciar sesión' });

            await expect(page).toFill('input#username', username);
            await expect(page).toFill('input#password', password);
            await expect(page).toClick('button', { text: 'Iniciar sesión' });

            // Esperar a que se renderice el navbar tras login
            await page.waitForXPath("//a[contains(text(), 'Ranking')]");
        });

        when('I click on the "Ranking" link in the navbar', async () => {
            const [rankingLink] = await page.$x("//a[contains(text(), 'Ranking')]");
            await rankingLink.click();

            await page.waitForTimeout(1000); // Esperar a la navegación
        });

        then('I should be redirected to the "/ranking" page', async () => {
            const url = await page.url();
            expect(url).toContain('/ranking');
        });
    });

    afterAll(async () => {
        await browser.close();
    });
});
