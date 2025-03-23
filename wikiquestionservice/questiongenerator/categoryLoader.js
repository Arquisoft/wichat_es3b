const fs = require('fs');
const path = require('path');
const WikidataQueryService = require('./questionGen');

class CategoryLoader {
    constructor(topics,numQuestions) {
        this.services = {};
        this.topics=topics;
        const categoriesPath = path.join(__dirname, 'categories.json');
        const rawData = fs.readFileSync(categoriesPath, 'utf8');
        const CATEGORIES = JSON.parse(rawData);
        let questionsPerCategory=numQuestions;
        if(this.topics === ["all"]){
            const totalCategories = Object.keys(CATEGORIES).length;
            questionsPerCategory = Math.floor(numQuestions / totalCategories);
        }

        for (const categoryName in CATEGORIES) {
            const categoryData = CATEGORIES[categoryName];

            if (categoryData.entity && categoryData.properties && categoryData.preguntas) {
                this.services[categoryName] = new WikidataQueryService(
                    categoryName,
                    categoryData.entity,
                    categoryData.properties,
                    categoryData.preguntas,
                    categoryData.types,
                    categoryData.img,
                    questionsPerCategory
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
