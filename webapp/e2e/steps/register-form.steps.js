const puppeteer = require('puppeteer');
const { defineFeature, loadFeature } = require('jest-cucumber');
const setDefaultOptions = require('expect-puppeteer').setDefaultOptions;
const feature = loadFeature('./features/register-form.feature');

const fs = require('fs');
const path = require('path');
let page;
let browser;

defineFeature(feature, test => {
  beforeAll(async () => {
    browser = process.env.GITHUB_ACTIONS
      ? await puppeteer.launch({ headless: "new", args: ['--no-sandbox', '--disable-setuid-sandbox'] })
      : await puppeteer.launch({ headless: false, slowMo: 100 });

    page = await browser.newPage();
    setDefaultOptions({ timeout: 10000 });

    await page.goto("http://localhost:3000/auth", {
      waitUntil: "networkidle0",
    });
  });

  test('The user is not registered in the site', ({ given, when, then }) => {
    let email;
    let username;
    let password;
    let passwordConfirm;

    given('An unregistered user', async () => {
      const screenshotsDir = path.resolve(__dirname, 'screenshots');

      try {

        /*const buttonExists = await page.evaluate(() => {
          const button = document.querySelector('#buttonSecondary');
          return button !== null;
        });

        console.log('¿El botón existe en el DOM?', buttonExists);

        if (!buttonExists) {

          // Crear el directorio screenshots si no existe
          if (!fs.existsSync(screenshotsDir)) {
            fs.mkdirSync(screenshotsDir, { recursive: true });
          }

          // Guardar el HTML de la página
          const htmlPath = path.join(screenshotsDir, `page-dump-given-${Date.now()}.html`);
          const pageContent = await page.content();

          fs.writeFileSync(htmlPath, pageContent);
          console.log(`Guardando HTML de la página en: ${htmlPath}`);

          throw new Error('El botón #buttonSecondary no está presente en el DOM');
        } */

        // Esperar a que aparezca el botón para cambiar a la vista de registro
        await page.waitForSelector('button', { visible: true, timeout: 5000 });
        await expect(page).toClick('button', { text: 'Crear cuenta' });

      } catch (error) {
        console.error('Error esperando el selector o haciendo clic:', error);

        // Crear el directorio screenshots si no existe
        if (!fs.existsSync(screenshotsDir)) {
          fs.mkdirSync(screenshotsDir, { recursive: true });
        }

        let photopath = path.join(screenshotsDir, `register-given-${Date.now()}.png`);
        console.log(`Guardando captura en: ${photopath}`);
        // Capturar la pantalla en caso de error
        await page.screenshot({ path: photopath, fullPage: true });
        throw error; // Re-lanzar el error para que falle el test
      }

    });

    when('I fill the data in the form and press submit', async () => {
      const screenshotsDir = path.resolve(__dirname, 'screenshots');
      
      email = `testuserlogin@example.com`;
      username = `testuserlogin`;
      password = "testpassword";
      passwordConfirm = "testpassword";

      try {
        await page.waitForSelector('#email', { visible: true, timeout: 5000 });
        await expect(page).toFill('input#email', email);
        console.log('Completamos email');
        await page.waitForTimeout(500);
        await page.waitForSelector('#username', { visible: true, timeout: 5000 });
        await expect(page).toFill('input#username', username);
        console.log('Completamos username');
        await page.waitForTimeout(500);
        await page.waitForSelector('#password', { visible: true, timeout: 5000 });
        await expect(page).toFill('input#password', password);
        console.log('Completamos password');
        await page.waitForTimeout(500);
        await page.waitForSelector('#confirmPassword', { visible: true, timeout: 5000 });
        await expect(page).toFill('input#confirmPassword', passwordConfirm);
        console.log('Completamos confirm password');
        await page.waitForTimeout(500);

        await page.waitForSelector('button', { visible: true, timeout: 5000 });
        await expect(page).toClick('button', { text: 'Crear cuenta' });

      } catch (error) {

        console.error('Error esperando el selector o haciendo clic:', error);

        // Crear el directorio screenshots si no existe
        if (!fs.existsSync(screenshotsDir)) {
          fs.mkdirSync(screenshotsDir, { recursive: true });
        }

        // Guardar el HTML de la página
        const htmlPath = path.join(screenshotsDir, `page-dump-when-${Date.now()}.html`);
        const pageContent = await page.content();

        fs.writeFileSync(htmlPath, pageContent);
        console.log(`Guardando HTML de la página en: ${htmlPath}`);

        let photopath = path.join(screenshotsDir, `register-when-${Date.now()}.png`);
        console.log(`Guardando captura en: ${photopath}`);
        // Capturar la pantalla en caso de error
        await page.screenshot({ path: photopath, fullPage: true });
        throw error; // Re-lanzar el error para que falle el test
      }
    });

    then('A confirmation message should be shown in the screen', async () => {
      await page.waitForSelector('.MuiSnackbar-root', { visible: true, timeout: 5000 });
      const snackbarText = await page.$eval('.MuiSnackbar-root', el => el.textContent.trim());
      console.log('Snackbar Text:', snackbarText);  // Esto te ayudará a depurar
      expect(snackbarText).toMatch('Usuario añadido correctamente');
    });

  });

  //linea de cambio
  afterAll(async () => {
    await browser.close();
  });
});
