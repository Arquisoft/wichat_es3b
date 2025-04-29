module.exports = {
    testSequencer: './customTestSequencer.js',
    testMatch: ["**/steps/*.js"],
    testTimeout: 60000,
    setupFilesAfterEnv: ["expect-puppeteer"]
}