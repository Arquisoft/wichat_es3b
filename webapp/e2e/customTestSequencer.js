const TestSequencer = require('@jest/test-sequencer').default;

class CustomSequencer extends TestSequencer {
    sort(tests) {
        // Prioriza el archivo register-form.steps.js
        return tests.sort((a, b) => {
            if (a.path.includes('register-form.steps.js')) return -1;
            if (b.path.includes('register-form.steps.js')) return 1;
            return a.path.localeCompare(b.path);
        });
    }
}

module.exports = CustomSequencer;