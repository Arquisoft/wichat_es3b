const puppeteer = require('puppeteer');
const { defineFeature, loadFeature } = require('jest-cucumber');
const setDefaultOptions = require('expect-puppeteer').setDefaultOptions;
const fs = require('fs');
const path = require('path');

const feature = loadFeature('./features/logout.feature');

let page;
let browser;

defineFeature(feature, (test) => {
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

    test('After logging out, the user is redirected to /auth when clicking "Jugar"', ({ given, when, then }) => {
        given('A user who is logged in', async () => {
            const screenshotsDir = path.resolve(__dirname, 'screenshots');
            try {
                await expect(page).toClick('a', { text: 'Iniciar sesión' });
                await page.waitForSelector('input#username', { visible: true, timeout: 5000 });
                await expect(page).toFill('input#username', 'enol');
                await expect(page).toFill('input#password', '1234');
                await expect(page).toClick('button', { text: 'Iniciar sesión' });

                await page.waitForNavigation({ waitUntil: 'networkidle0' });
            } catch (error) {
                if (!fs.existsSync(screenshotsDir)) {
                    fs.mkdirSync(screenshotsDir, { recursive: true });
                }
                const photopath = path.join(screenshotsDir, `logout-given-${Date.now()}.png`);
                await page.screenshot({ path: photopath, fullPage: true });
                throw error;
            }
        });

        when('The user logs out', async () => {
            try {
                await expect(page).toClick('a', { text: 'Cerrar sesión' });
                await page.waitForTimeout(500);
            } catch (error) {
                const screenshotsDir = path.resolve(__dirname, 'screenshots');
                if (!fs.existsSync(screenshotsDir)) {
                    fs.mkdirSync(screenshotsDir, { recursive: true });
                }
                const photopath = path.join(screenshotsDir, `logout-when1-${Date.now()}.png`);
                await page.screenshot({ path: photopath, fullPage: true });
                throw error;
            }
        });

        when('The user clicks the "Jugar" button', async () => {
            try {
                await Promise.all([
                    page.waitForNavigation({ waitUntil: 'networkidle0' }),
                    expect(page).toClick('button', { text: 'Jugar' }),
                ]);
            } catch (error) {
                const screenshotsDir = path.resolve(__dirname, 'screenshots');
                if (!fs.existsSync(screenshotsDir)) {
                    fs.mkdirSync(screenshotsDir, { recursive: true });
                }
                const photopath = path.join(screenshotsDir, `logout-when2-${Date.now()}.png`);
                await page.screenshot({ path: photopath, fullPage: true });
                throw error;
            }
        });

        then('I should be redirected to the "/auth" page', async () => {
            const url = await page.url();
            expect(url).toContain('/auth');
        });
    });

    afterAll(async () => {
        await browser.close();
    });
});
