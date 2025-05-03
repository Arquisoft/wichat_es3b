const puppeteer = require('puppeteer');
const { defineFeature, loadFeature } = require('jest-cucumber');
const setDefaultOptions = require('expect-puppeteer').setDefaultOptions;
const fs = require('fs');
const path = require('path');

const feature = loadFeature('./features/ranking.feature');

let page;
let browser;

defineFeature(feature, test => {
    beforeAll(async () => {
        browser = process.env.GITHUB_ACTIONS
            ? await puppeteer.launch({ headless: 'new', args: ['--no-sandbox', '--disable-setuid-sandbox'] })
            : await puppeteer.launch({ headless: true, slowMo: 100 });

        page = await browser.newPage();
        setDefaultOptions({ timeout: 10000 });

        await page.goto('http://localhost:3000', {
            waitUntil: 'networkidle0',
        });
    });

    test('The user accesses the Ranking page from the Home page', ({ given, when, then }) => {
        given('The user is on the Home page', async () => {
            const screenshotsDir = path.resolve(__dirname, 'screenshots');

            try {
                // Comprobamos que algún elemento típico de Home esté presente, por ejemplo un título
                await page.waitForSelector('nav', { visible: true, timeout: 5000 });
                console.log('Estamos en la Home correctamente');
            } catch (error) {
                console.error('Error en Home:', error);

                if (!fs.existsSync(screenshotsDir)) {
                    fs.mkdirSync(screenshotsDir, { recursive: true });
                }

                const htmlPath = path.join(screenshotsDir, `home-dump-${Date.now()}.html`);
                const pageContent = await page.content();
                fs.writeFileSync(htmlPath, pageContent);
                console.log(`Guardando HTML de Home en: ${htmlPath}`);

                const screenshotPath = path.join(screenshotsDir, `home-error-${Date.now()}.png`);
                await page.screenshot({ path: screenshotPath, fullPage: true });
                console.log(`Guardando captura de Home en: ${screenshotPath}`);

                throw error;
            }
        });

        when('The user clicks on the "Ranking" link in the navigation bar', async () => {
            const screenshotsDir = path.resolve(__dirname, 'screenshots');

            try {
                await page.waitForXPath("//a[contains(text(), 'Ranking')]", { timeout: 5000 });
                const [rankingLink] = await page.$x("//a[contains(text(), 'Ranking')]");
                await rankingLink.click();
                console.log('Click en "Ranking" realizado correctamente');

                await page.waitForTimeout(1000); // Tiempo prudente para la navegación
            } catch (error) {
                console.error('Error al clicar en "Ranking":', error);

                if (!fs.existsSync(screenshotsDir)) {
                    fs.mkdirSync(screenshotsDir, { recursive: true });
                }

                const htmlPath = path.join(screenshotsDir, `ranking-click-dump-${Date.now()}.html`);
                const pageContent = await page.content();
                fs.writeFileSync(htmlPath, pageContent);
                console.log(`Guardando HTML tras click fallido en: ${htmlPath}`);

                const screenshotPath = path.join(screenshotsDir, `ranking-click-error-${Date.now()}.png`);
                await page.screenshot({ path: screenshotPath, fullPage: true });
                console.log(`Guardando captura tras error en click: ${screenshotPath}`);

                throw error;
            }
        });

        then('The user should be redirected to the "Ranking" page', async () => {
            try {
                await page.waitForNavigation({ waitUntil: 'networkidle0', timeout: 5000 }).catch(() => {}); // A veces no hay navegación completa
                const url = await page.url();
                console.log('URL actual después del click:', url);
                expect(url).toContain('/ranking');
            } catch (error) {
                const screenshotsDir = path.resolve(__dirname, 'screenshots');

                console.error('Error validando redirección a Ranking:', error);

                if (!fs.existsSync(screenshotsDir)) {
                    fs.mkdirSync(screenshotsDir, { recursive: true });
                }

                const htmlPath = path.join(screenshotsDir, `ranking-redirect-dump-${Date.now()}.html`);
                const pageContent = await page.content();
                fs.writeFileSync(htmlPath, pageContent);
                console.log(`Guardando HTML tras fallo de redirección en: ${htmlPath}`);

                const screenshotPath = path.join(screenshotsDir, `ranking-redirect-error-${Date.now()}.png`);
                await page.screenshot({ path: screenshotPath, fullPage: true });
                console.log(`Guardando captura tras fallo de redirección en: ${screenshotPath}`);

                throw error;
            }
        });
    });

    afterAll(async () => {
        await browser.close();
    });
});
