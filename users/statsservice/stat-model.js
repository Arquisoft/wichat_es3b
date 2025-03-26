const mongoose = require('mongoose');


const statSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
  },
  games: { 
    type: Number, 
    required: true
  },
  rightAnswers: {
    type: Number, 
    required: true
  },
  wrongAnswers: {
    type: Number, 
    required: true
  },
  ratio: {
    type: Number, 
    required: true
  }, 
  averageTime: { 
    type: Number, 
    required: true 
  }, 
  maxScore: { 
    type: Number, 
    required: true 
  },
  streak: {
    type: Number,
    required: true
  },
  maxStreak: {
    type: Number,
    required: true
  }
});


const Stat = mongoose.model('Stat', statSchema);

module.exports = Stat;