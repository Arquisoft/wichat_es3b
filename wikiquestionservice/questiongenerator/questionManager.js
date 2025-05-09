const CategoryLoader = require('./categoryLoader');

class QuestionManager {
    constructor() {
        this.questions = [];
    }

    async loadAllQuestions(topics,numQuestions) {
        const categoryLoader = new CategoryLoader(topics,numQuestions);
        const allServices = categoryLoader.getAllServices();
        const questionPromises = [];

        for (const categoryName in allServices) {
            const wikidataService = allServices[categoryName];

            if (wikidataService) {
                const promise = wikidataService.generateQuestions()
                    .then(() => {
                        const preguntas = wikidataService.getQuestions();
                        console.log(`✅ ${preguntas.length} preguntas generadas para '${categoryName}'`);
                        return preguntas;
                    })
                    .catch(error => {
                        console.error(`❌ Error generando preguntas para la categoría '${categoryName}':`, error);
                        return [];
                    });

                questionPromises.push(promise);
            } else {
                console.warn(`⚠️ El servicio para la categoría '${categoryName}' no existe.`);
            }
        }

        const results = await Promise.all(questionPromises);

        this.questions = results.flat();

        console.log(`📌 Total de preguntas generadas: ${this.questions.length}`);
        this.shuffleQuestions();
        return this.questions;
    }

    shuffleQuestions() {
        for (let i = this.questions.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [this.questions[i], this.questions[j]] = [this.questions[j], this.questions[i]];
        }
    }

}

module.exports = QuestionManager;