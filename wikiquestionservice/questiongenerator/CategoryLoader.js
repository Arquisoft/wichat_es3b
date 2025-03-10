const fs = require('fs');
const path = require('path');
const WikidataQueryService = require('./QuestionGen');

class CategoryLoader {
    constructor() {
        this.services = {};
        const categoriesPath = path.join(__dirname, 'categories.json');
        const rawData = fs.readFileSync(categoriesPath, 'utf8');
        const CATEGORIES = JSON.parse(rawData);
        for (const categoryName in CATEGORIES) {
            const categoryData = CATEGORIES[categoryName];

            if (categoryData.entity && categoryData.properties && categoryData.preguntas) {
                this.services[categoryName] = new WikidataQueryService(
                    categoryName,
                    categoryData.entity,
                    categoryData.properties,
                    categoryData.preguntas,
                    categoryData.types,
                    categoryData.img
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
