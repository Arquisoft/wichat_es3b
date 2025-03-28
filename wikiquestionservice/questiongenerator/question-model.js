const mongoose = require('mongoose');


const QuestionSchema = new mongoose.Schema({
  category: { type: String, required: true }, 

  question: {
    es: { type: String, required: true }, 
    en: { type: String, required: true }  
  },

  correctAnswer: {
    es: { type: String, required: true },
    en: { type: String, required: true }
  },

  incorrectAnswers: {
    es: [{ type: String, required: true }],
    en: [{ type: String, required: true }]
  },

  description: {
    es: { type: String, required: true },
    en: { type: String, required: true }
  }
});

const Question = mongoose.model('Question', QuestionSchema);
module.exports = Question;

