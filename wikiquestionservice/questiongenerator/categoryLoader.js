const fs = require('fs');
const path = require('path');
const WikidataQueryService = require('./questionGen');

class CategoryLoader {
    constructor(topics,numQuestions) {
        this.services = {}
        const categoriesPath = path.join(__dirname, 'categories.json');
        const rawData = fs.readFileSync(categoriesPath, 'utf8');
        const CATEGORIES = JSON.parse(rawData);
        let selectedCategories = Object.keys(CATEGORIES);
        if (!topics.includes("all")) {
            selectedCategories = selectedCategories.filter(category => topics.includes(category));
        }

        const questionsPerCategory = Math.floor(numQuestions / selectedCategories.length);
        let remainingQuestions = numQuestions % selectedCategories.length;
        for (const categoryName of selectedCategories) {
            const categoryData = CATEGORIES[categoryName];

            if (categoryData.entity && categoryData.properties && categoryData.preguntas) {
                let categoryQuestions = questionsPerCategory;

                if (remainingQuestions > 0) {
                    categoryQuestions += 1;
                    remainingQuestions -= 1;
                }
                this.services[categoryName] = new WikidataQueryService(
                    categoryName,
                    categoryData.entity,
                    categoryData.properties,
                    categoryData.preguntas,
                    categoryData.types,
                    categoryData.img,
                    categoryQuestions
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