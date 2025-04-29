const puppeteer = require('puppeteer');
const { defineFeature, loadFeature } = require('jest-cucumber');
const setDefaultOptions = require('expect-puppeteer').setDefaultOptions;
const fs = require('fs');
const path = require('path');

const feature = loadFeature('./features/profile.feature');

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

    test('The user is redirected to /profile after clicking the "Perfil" link', ({ given, when, then }) => {
        const username = 'testuser';
        const password = 'testpassword';

        given('A user who is logged in', async () => {
            const screenshotsDir = path.resolve(__dirname, 'screenshots');
            try {
                await expect(page).toClick('a', { text: 'Iniciar sesión' });

                await page.waitForSelector('input#username', { visible: true, timeout: 5000 });
                await expect(page).toFill('input#username', username);
                await expect(page).toFill('input#password', password);
                await expect(page).toClick('button', { text: 'Iniciar sesión' });

                await page.waitForXPath("//a[contains(text(), 'Perfil')]", { visible: true, timeout: 5000 });
            } catch (error) {
                if (!fs.existsSync(screenshotsDir)) {
                    fs.mkdirSync(screenshotsDir, { recursive: true });
                }
                const photopath = path.join(screenshotsDir, `profile-given-${Date.now()}.png`);
                await page.screenshot({ path: photopath, fullPage: true });
                throw error;
            }
        });

        when('I click on the "Perfil" link in the navbar', async () => {
            const screenshotsDir = path.resolve(__dirname, 'screenshots');
            try {
                const [profileLink] = await page.$x("//a[contains(text(), 'Perfil')]");
                if (!profileLink) throw new Error('Perfil link not found');
                await profileLink.click();

                await page.waitForTimeout(1000);
            } catch (error) {
                if (!fs.existsSync(screenshotsDir)) {
                    fs.mkdirSync(screenshotsDir, { recursive: true });
                }
                const photopath = path.join(screenshotsDir, `profile-when-${Date.now()}.png`);
                await page.screenshot({ path: photopath, fullPage: true });
                throw error;
            }
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
