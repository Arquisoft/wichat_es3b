const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const cron = require("node-cron");
const QuestionManager = require("./questiongenerator/questionManager");
const mongoose = require("mongoose");
const Question = require("./question-model");

const app = express();
const port = 8004;
let questionsLoaded = false;

const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/statsdb';
mongoose.connect(mongoUri);

const questionManager = new QuestionManager();

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.use(cors());

app.use((req, res, next) => {
  if (!questionsLoaded) {
    return res.status(500).json({
      error:
        "Las preguntas aún no han sido cargadas. Por favor, inténtalo de nuevo más tarde.",
    });
  }
  next();
});

app.get("/questions", async (req, res) => {
  const { n = 10, locale = "es" } = req.query;

  const numQuestions = parseInt(n, 10);
  if (numQuestions > 25) {
    return res.status(400).json({ error: "El límite de preguntas es 25" });
  }

  const validLocales = ["es", "en"];
  const selectedLocale = validLocales.includes(locale) ? locale : "es";

  try {
    await questionManager.loadAllQuestions();

    const allQuestions = questionManager.questions;

    const limitedQuestions = allQuestions.slice(0, numQuestions).map((q) => {
      const questionText = q.obtenerPreguntaPorIdioma(selectedLocale);

      if (!questionText) {
        return res
          .status(400)
          .json({
            error: `Pregunta no disponible en el idioma: ${selectedLocale}`,
          });
      }

      const respuestas = q.obtenerRespuestas();

      return {
        pregunta: questionText,
        respuestaCorrecta: q.respuestaCorrecta,
        respuestas: respuestas,
        descripcion: q.descripcion,
        img: q.obtenerImg(),
      };
    });

    res.json(limitedQuestions);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.get("/question", async (req, res) => {
  try {
    const count = await Question.countDocuments();
    if (count === 0) {
      return res.status(404).json({ error: "No hay preguntas disponibles" });
    }

    const randomIndex = Math.floor(Math.random() * count);
    const randomQuestion = await Question.findOne().skip(randomIndex);

    res.json(randomQuestion);
  } catch (error) {
    console.error("Error obteniendo pregunta aleatoria:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
});

app.get("/question/:category", async (req, res) => {
  try {
    const { category } = req.params;
    const count = await Question.countDocuments({ category: category });

    if (count === 0) {
      return res.status(404).json({ error: `No hay preguntas en la categoría '${category}'` });
    }

    const randomIndex = Math.floor(Math.random() * count);
    const randomQuestion = await Question.findOne({ category: category }).skip(randomIndex);

    res.json(randomQuestion);
  } catch (error) {
    console.error(`Error obteniendo pregunta aleatoria de la categoría '${category}':`, error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
});

async function saveQuestionsToDB(questions) {
  try {
    for (const q of questions) {
      const newQuestion = new Question({
        category: q.categoria,
        question: q.preguntas,
        correctAnswer: q.respuestaCorrecta,
        incorrectAnswers: q.respuestasIncorrectas,  
        description: q.descripcion,
        img: q.img
      });

      await newQuestion.save();
    }
    console.log("Preguntas guardadas en MongoDB.");
  } catch (error) {
    console.error("Error al guardar preguntas:", error);
  }
}

const server = app.listen(port, async () => {
  console.log(`Question Service listening at http://localhost:${port}`);
  try {
    const questions = await questionManager.loadAllQuestions();
    await saveQuestionsToDB(questions);
    questionsLoaded = true;
    console.log("Generadores de preguntas cargados con éxito!");
  } catch (error) {
    console.error("Error al cargar los generadores de preguntas:", error);
  }
});

cron.schedule("0 3 * * *", async () => {
  try {
    const questions = await questionManager.loadAllQuestions();
    await saveQuestionsToDB(questions);
    console.log("Generadores de preguntas recargados.");
  } catch (error) {
    console.error("Error al recargar los generadores de preguntas:", error);
  }
});

module.exports = server;
