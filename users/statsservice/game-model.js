const mongoose = require('mongoose');


const gameSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
  },
  gameId: {
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
  time: { 
    type: Number, 
    required: true 
  }, 
  score: { 
    type: Number, 
    required: true 
  },
  date: {
    type: Date,
    default: Date.now, 
  },
});


const Game = mongoose.model('Game', gameSchema);

module.exports = Game;