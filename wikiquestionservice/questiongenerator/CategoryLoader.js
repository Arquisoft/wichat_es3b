const CATEGORIES = require('./categories');
const WikidataQueryService = require('./questionGen');

class CategoryLoader {
    constructor() {
        this.services = {};

        for (const categoryName in CATEGORIES) {
            const categoryData = CATEGORIES[categoryName];

            if (categoryData.entity && categoryData.properties && categoryData.preguntas) {
                this.services[categoryName] = new WikidataQueryService(
                    categoryName,
                    categoryData.entity,
                    categoryData.properties,
                    categoryData.preguntas
                );
            } else {
                console.warn(`⚠️ La categoría '${categoryName}' está incompleta y no se cargará.`);
            }
        }
    }

    getService(categoryName) {
        return this.services[categoryName] || null;
    }

    getAllServices() {
        return this.services;
    }
}

module.exports = CategoryLoader;
