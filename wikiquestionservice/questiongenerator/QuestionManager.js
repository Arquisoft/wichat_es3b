const CategoryLoader = require('./CategoryLoader');

class QuestionManager {
    constructor() {
        this.questions = [];
        this.categoryLoader = new CategoryLoader();
    }

    async loadAllQuestions() {
        const allServices = this.categoryLoader.getAllServices();
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

        // Agregar todas las preguntas generadas
        this.questions = results.flat();

        console.log(`📌 Total de preguntas generadas: ${this.questions.length}`);
        this.shuffleQuestions();
    }


    addQuestions(preguntas) {
        this.questions.push(...preguntas);
    }

    shuffleQuestions() {
        for (let i = this.questions.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [this.questions[i], this.questions[j]] = [this.questions[j], this.questions[i]];
        }
    }


    getRandomQuestion() {
        if (this.questions.length === 0) {
            throw new Error("No hay preguntas disponibles.");
        }
        return this.questions.shift();
    }
}

module.exports = QuestionManager;
