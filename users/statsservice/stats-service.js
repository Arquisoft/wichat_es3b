const express = require('express');
const mongoose = require('mongoose');
const { check, validationResult } = require('express-validator');
const Stats = require('./stat-model'); 
//const User = require('../userservice/user-model');  

const app = express();
const port = 8005;  


app.use(express.json());


const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/statsdb';
mongoose.connect(mongoUri);


app.post('/savestats', async (req, res) => {
  try {

    const { username, rightAnswers, wrongAnswers, time, score } = req.body;

    /*const user = await User.findOne({ username });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }*/

    let stats = await Stats.findOne({ username }); 

    if (!stats) {
      stats = new Stats({
        username, 
        games: 1,
        rightAnswers,
        wrongAnswers,
        ratio: rightAnswers/(rightAnswers+wrongAnswers),
        averageTime: time,
        maxScore: score,
      });
    } else {
      stats.games += 1; 
      stats.rightAnswers += rightAnswers; 
      stats.wrongAnswers += wrongAnswers; 

      const totalAnswers = stats.rightAnswers + stats.wrongAnswers;
      stats.ratio = totalAnswers > 0 ? stats.rightAnswers / totalAnswers : 0;

      stats.averageTime = ((stats.averageTime * (stats.games-1)) + time) / stats.games;

      if (score > stats.maxScore) {
        stats.maxScore = score;
      }
    }

    await stats.save();

    res.status(201).json(stats);
  } catch (error) {
    console.error("Error al guardar estadísticas:", error.message);
    res.status(500).json({ error: 'Error al guardar las estadísticas' });
  }
});

app.get('/getstats/:username', async (req, res) => {
    try {
      const { username } = req.params;
  
      /*const user = await User.findOne({ username });
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }*/
  
      const stats = await Stats.findOne({ username }); 
  
      if (!stats) {
        return res.status(404).json({ error: 'Stats not found for this user' });
      }
  
      res.json({
        username: stats.username,
        games: stats.games,
        rightAnswers: stats.rightAnswers,
        wrongAnswers: stats.wrongAnswers,
        ratio: stats.ratio,
        averageTime: stats.averageTime,
        maxScore: stats.maxScore,
      });
  
    } catch (error) {
      res.status(500).json({ error: 'Internal Server Error' });
    }
  });

  app.get('/getranking', async (req, res) => {
    try {
      const ranking = await Stats.find()
        .sort({ maxScore: -1 })  // -1 indica orden descendente
        .select('username maxScore') 
        .limit(10);
  
      res.json(ranking);
    } catch (error) {
      console.error("Error al obtener el ranking:", error);
      res.status(500).json({ error: 'Error al obtener el ranking' });
    }
  });


const server = app.listen(port, () => {
  console.log(`Stats Service listening at http://localhost:${port}`);
});


server.on('close', () => {
  mongoose.connection.close();
});

module.exports = server;