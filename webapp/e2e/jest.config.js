module.exports = {
    testMatch: ["**/steps/*.js"],
    testTimeout: 60000,
    setupFilesAfterEnv: ["expect-puppeteer"],
    testEnvironmentOptions:{
        url: "http://localhost:8000"
    } 
}