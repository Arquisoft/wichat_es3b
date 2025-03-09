const CategoryLoader = require('./questiongenerator/CategoryLoader');

const categoryLoader = new CategoryLoader();

// Obtener un servicio específico (ejemplo: "paises")
const wikidataServicePaises = categoryLoader.getService("paises");

if (wikidataServicePaises) {
    wikidataServicePaises.generateQuestions().then(data => {
        const preguntas = wikidataServicePaises.getQuestions();

        console.log("❓ Preguntas para 'paises':");
        preguntas.forEach((pregunta, index) => {
            console.log(`Pregunta ${index + 1}:`);
            console.log(pregunta.toString()+'\n');
        });
    });


}

const allServices = categoryLoader.getAllServices();
console.log("📌 Categorías cargadas:", Object.keys(allServices));
