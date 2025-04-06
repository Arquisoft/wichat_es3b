const express = require("express");
const mongoose = require("mongoose");
const { check, validationResult } = require("express-validator");
const Stats = require("./stat-model");
const Game = require("./game-model");
//const User = require('../userservice/user-model');

const app = express();
const port = 8005;

app.use(express.json());

const mongoUri = process.env.MONGODB_URI || "mongodb://localhost:27017/statsdb";
mongoose.connect(mongoUri);

app.post("/savestats", async (req, res) => {
  try {
    const {
      username,
      rightAnswers = 0,
      wrongAnswers = 0,
      time,
      score,
      win,
    } = req.body;

    if (!username || time === undefined || score === undefined) {
      return res.status(400).json({ error: "Faltan datos requeridos" });
    }

    let stats = await Stats.findOne({ username });

    if (!stats) {
      stats = new Stats({
        username,
        games: 1,
        rightAnswers,
        wrongAnswers,
        ratio:
          rightAnswers + wrongAnswers > 0
            ? rightAnswers / (rightAnswers + wrongAnswers)
            : 0,
        averageTime: time,
        maxScore: score,
        streak: 1,
        maxStreak: 1,
      });
    } else {
      stats.games += 1;
      stats.rightAnswers += rightAnswers;
      stats.wrongAnswers += wrongAnswers;

      const totalAnswers = stats.rightAnswers + stats.wrongAnswers;
      stats.ratio = totalAnswers > 0 ? stats.rightAnswers / totalAnswers : 0;

      stats.averageTime =
        stats.averageTime && stats.games > 1
          ? (stats.averageTime * (stats.games - 1) + time) / stats.games
          : time;

      stats.maxScore = Math.max(stats.maxScore, score);
      stats.streak = win ? stats.streak + 1 : 0;
      stats.maxStreak = Math.max(stats.maxStreak, stats.streak);
    }

    await stats.save();

    const lastGame = await Game.findOne({ username }).sort({ gameId: -1 });

    let gameId = lastGame ? lastGame.gameId + 1 : 1;

    let game = new Game({
      username, 
      gameId,

      rightAnswers,
      wrongAnswers,
      ratio:
        rightAnswers + wrongAnswers > 0
          ? rightAnswers / (rightAnswers + wrongAnswers)
          : 0,
      time,
      score,
      date: new Date(),
    });

    await game.save();

    res.status(201).json(stats);
  } catch (error) {
    console.error("Error al guardar estadísticas:", error.message);
    res.status(500).json({ error: "Error al guardar las estadísticas" });
  }
});

app.get("/getstats/:username", async (req, res) => {
  try {
    const { username } = req.params;

    /*const user = await User.findOne({ username });
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }*/
        const stats = await Stats.findOne({ username });

        if (!stats) {
          return res.status(404).json({ error: "Stats not found for this user" });
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
        res.status(500).json({ error: "Internal Server Error" });
      }
    });

  app.get('/getTop3', async (req, res) => {
    try {
      const ranking = await Stats.find()
        .sort({ maxScore: -1 })  
        .select('username maxScore') 
        .limit(3);
  
      res.json(ranking);
    } catch (error) {
      console.error("Error al obtener el ranking:", error);
      res.status(500).json({ error: 'Error al obtener el ranking' });
    }
  });
    

app.get("/getranking", async (req, res) => {
  try {
    const ranking = await Stats.find()
      .sort({ maxScore: -1, ratio: -1 }) 
      .select(
        "username games rightAnswers wrongAnswers ratio averageTime maxScore"
      )
      .limit(10);

    res.json(ranking);
  } catch (error) {
    console.error("Error al obtener el ranking:", error);
    res.status(500).json({ error: "Error al obtener el ranking" });
  }
});


app.get("/games/:username", async (req, res) => {
  try {
    const { username } = req.params;

    if (!username) {
      return res.status(400).json({ error: "El username es requerido" });
    }

    const games = await Game.find({ username }).sort({ date: -1 });

    res.status(200).json(games);
  } catch (error) {
    console.error("Error al obtener historial de partidas:", error.message);
    res
      .status(500)
      .json({ error: "Error al obtener el historial de partidas" });
  }
});

app.get("/ratios-per-month/:username", async (req, res) => {
  try {
    const games = await Game.aggregate([
      {
        $match: { username: req.params.username },
      },
      {
        $group: {
          _id: { year: { $year: "$date" }, month: { $month: "$date" } },
          avgRatio: { $avg: "$ratio" },
        },
      },
      { $sort: { "_id.year": 1, "_id.month": 1 } }, // Ordenar cronológicamente
    ]);

    const ratios = games.map((g) => ({
      month: `${g._id.year}-${String(g._id.month).padStart(2, "0")}`,
      avgRatio: g.avgRatio,
    }));

    res.json(ratios);
  } catch (error) {
    console.error("Error al calcular ratios por mes:", error.message);
    res.status(500).json({ error: "Error interno del servidor" });
  }
});

const server = app.listen(port, () => {
  console.log(`Stats Service listening at http://localhost:${port}`);
});

server.on("close", () => {
  mongoose.connection.close();
});

module.exports = server;
