const CategoryLoader = require('./questiongenerator/CategoryLoader');

const categoryLoader = new CategoryLoader();

// Obtener un servicio específico (ejemplo: "paises")
const wikidataServicePaises = categoryLoader.getService("paises");

if (wikidataServicePaises) {
    wikidataServicePaises.obtenerIdsDeWikidata("wd:Q6256").then(data => {
        console.log("📊 Datos obtenidos de 'paises':", data);
    });

    console.log("❓ Preguntas para 'paises':", wikidataServicePaises.getQuestions());
}

// Obtener todas las categorías cargadas
const allServices = categoryLoader.getAllServices();
console.log("📌 Categorías cargadas:", Object.keys(allServices));
