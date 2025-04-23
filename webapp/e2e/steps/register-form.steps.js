const puppeteer = require('puppeteer');
const { defineFeature, loadFeature } = require('jest-cucumber');
const setDefaultOptions = require('expect-puppeteer').setDefaultOptions;
const feature = loadFeature('./features/register-form.feature');

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

      // Esperar a que aparezca el botón para cambiar a la vista de registro
      await page.waitForSelector('#create-button', { visible: true, timeout: 5000 }); 
      await expect(page).toClick('button', { text: 'Crear cuenta' });

    });

    when('I fill the data in the form and press submit', async () => {
      email = `testuser${Date.now()}@example.com`;
      username = `testuser${Date.now()}`;
      password = "testpassword";
      passwordConfirm = "testpassword";

      await page.waitForSelector('#email', { visible: true, timeout: 5000 }); 
      await expect(page).toFill('input#email', email);
      await page.waitForSelector('#username', { visible: true, timeout: 5000 }); 
      await expect(page).toFill('input#username', username);
      await page.waitForSelector('#password', { visible: true, timeout: 5000 }); 
      await expect(page).toFill('input#password', password);
      await page.waitForSelector('#confirmPassword', { visible: true, timeout: 5000 });
      await expect(page).toFill('input#confirmPassword', passwordConfirm); 

      await page.waitForSelector('#create-button', { visible: true, timeout: 5000 }); 
      await expect(page).toClick('button', { text: 'Crear cuenta' });
    });

    then('A confirmation message should be shown in the screen', async () => {
      await page.waitForSelector('.MuiSnackbar-root', { visible: true, timeout: 5000 });
      const snackbarText = await page.$eval('.MuiSnackbar-root', el => el.textContent.trim());
      console.log('Snackbar Text:', snackbarText);  // Esto te ayudará a depurar
      expect(snackbarText).toMatch('Usuario añadido correctamente');
    });

  });

  afterAll(async () => {
    await browser.close();
  });
});
