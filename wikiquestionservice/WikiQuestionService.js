const CategoryLoader = require('./questiongenerator/CategoryLoader');

const categoryLoader = new CategoryLoader();

const allServices = categoryLoader.getAllServices();

for (const categoryName in allServices) {
    const wikidataService = allServices[categoryName];

    if (wikidataService) {
        wikidataService.generateQuestions().then(() => {
            const preguntas = wikidataService.getQuestions();

            console.log(`❓ Preguntas para la categoría '${categoryName}':`);
            preguntas.forEach((pregunta, index) => {
                console.log(`Pregunta ${index + 1}:`);
                console.log(pregunta.toString() + '\n');
            });
        }).catch(error => {
            console.error(`Error generando preguntas para la categoría '${categoryName}':`, error);
        });
    } else {
        console.warn(`⚠️ El servicio para la categoría '${categoryName}' no existe.`);
    }
}

console.log("📌 Categorías cargadas:", Object.keys(allServices));
