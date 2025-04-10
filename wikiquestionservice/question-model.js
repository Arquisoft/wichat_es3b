const mongoose = require('mongoose');


const QuestionSchema = new mongoose.Schema({
  category: { type: String }, 

  question: {
    es: { type: String }, 
    en: { type: String }  
  },

  correctAnswer: {
    es: { type: String }, 
    en: { type: String } 
  },

  incorrectAnswers: {
    es: [{ type: String }], 
    en: [{ type: String }] 
  },

  description: [
    {
      propiedad: { type: String },
      valor: { type: String }
    }
  ],

  img: [{ type: String }],
  
  createdAt: { type: Date, default: Date.now }
});

const Question = mongoose.model('Question', QuestionSchema);
module.exports = Question;

