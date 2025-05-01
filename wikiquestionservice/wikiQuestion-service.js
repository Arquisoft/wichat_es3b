const express = require("express");
const bodyParser = require("body-parser");
const cron = require("node-cron");
const QuestionManager = require("./questiongenerator/questionManager");
const mongoose = require("mongoose");
const Question = require("./question-model");

const app = express();
const port = 8004;

const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:57611/questiondb';
async function connectDB() {
  if (mongoose.connection.readyState === 0) {
    await mongoose.connect(mongoUri);
  }
}

async function disconnectDB() {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
  }
}


const questionManager = new QuestionManager();

const defaultTopics = ["all"];
const defaultNumQuestions = 25;


app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

function filterValidTopics(rawTopic) {
  const validCategories = ["paises", "cine", "clubes", "literatura", "arte", "all"];
  return rawTopic.split(",").filter(t => validCategories.includes(t));
}

app.get("/questions", async (req, res) => {
  const { n = 25, topic = "all" } = req.query;
  const numQuestions = parseInt(n, 10);

  if (numQuestions > 30) {
    return res.status(400).json({ error: "El límite de preguntas es 30" });
  }

  let topics = filterValidTopics(topic);

  if (topics.length === 0) {
    return res.status(400).json({ error: "No se proporcionaron categorías válidas." });
  }

  try {
    if (topics.includes("all") || topics.length === 0) {
      topics = ["all"];
    }

    const selectedQuestions = await questionManager.loadAllQuestions(topics, numQuestions);

    const formattedQuestions = selectedQuestions.map((q) => ({
      pregunta: q.obtenerPreguntaPorIdioma(),
      respuestaCorrecta: q.respuestaCorrecta,
      respuestas: q.obtenerRespuestas(),
      descripcion: q.descripcion,
      img: q.obtenerImg(),
    }));

    res.json(formattedQuestions);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

if (process.env.NODE_ENV === "test") {
  app.get("/generateQuestionsIfNotExists", async (req, res) => {
    try {
      await connectDB();
      const selectedQuestions = await questionManager.loadAllQuestions(["all"], 10);
      await saveQuestionsToDB(selectedQuestions);
      res.json(selectedQuestions);
    }
    catch (error) {
      res.status(500).json({ error: error.message });
    }
  });
}

app.get("/questionsDB", async (req, res) => {
  try {
    await connectDB();
    const numQuestions = parseInt(req.query.n ?? defaultNumQuestions, 10);
    const topic = (req.query.topic && req.query.topic !== "undefined") ? req.query.topic : defaultTopics;

    if (numQuestions > 30) {
      return res.status(400).json({ error: "El límite de preguntas es 30" });
    }

    let topics = filterValidTopics(topic);

    if (topics.length === 0) {
      return res.status(400).json({ error: "No se proporcionaron categorías válidas." });
    }

    if (topics.includes("all") || topics.length === 0) {
      topics = ["paises", "cine", "clubes", "literatura", "arte"];
    }

    const questionsPerCategory = Math.floor(numQuestions / topics.length);
    const extra = numQuestions % topics.length;
    const selectedQuestions = [];
    const selectedQuestionIds = new Set();

    //for (let i = 0; i < topics.length; i++) {
    //  const topic = topics[i];
    //  let numToFetch = questionsPerCategory;
    //  if (i < extra) numToFetch++;
//
    //  let categoryQuestions = [];
    //  while (categoryQuestions.length < numToFetch) {
    //    const remainingQuestions = await Question.aggregate([
    //      { $match: { category: topic, _id: { $nin: Array.from(selectedQuestionIds) } } },
    //      { $sample: { size: numToFetch - categoryQuestions.length } }
    //    ]);
//
    //    if (remainingQuestions.length === 0) {
    //      console.log(`⚠️ No hay más preguntas disponibles para la categoría '${topic}'`);
    //      break; // Salir del bucle si no hay más preguntas disponibles
    //    }
//
    //    categoryQuestions = categoryQuestions.concat(remainingQuestions);
    //    remainingQuestions.forEach(q => selectedQuestionIds.add(q._id));
    //  }
//
    //  if (categoryQuestions.length === 0) {
    //    console.log(`⚠️ No hay preguntas disponibles para la categoría '${topic}'`);
    //  }
//
    //  const questionIds = categoryQuestions.map(q => q._id);
    //  await Question.deleteMany({ _id: { $in: questionIds } });
//
    //  selectedQuestions.push(...categoryQuestions);
    //}

    for (let i = 0; i < topics.length; i++) {
      const topic = topics[i];
      const numToFetch = questionsPerCategory + (i < extra ? 1 : 0);

      // Obtener preguntas de la categoría actual
      const categoryQuestions = await Question.aggregate([
        { $match: { categoryName: topic, _id: { $nin: Array.from(selectedQuestionIds) } } },
        { $sample: { size: numToFetch } }
      ]);

      // Agregar preguntas seleccionadas y registrar sus IDs
      selectedQuestions.push(...categoryQuestions);
      categoryQuestions.forEach(q => selectedQuestionIds.add(q._id));
    }

    const formattedQuestions = selectedQuestions.map(q => ({
      pregunta: q.question,
      respuestaCorrecta: q.correctAnswer,
      respuestas: q.incorrectAnswers,
      descripcion: q.description,
      img: q.img
    }));

    res.json(formattedQuestions);
  } catch (error) {
    res.status(500).json({ error: error.message });
  } finally {
    await disconnectDB();
  }
});

async function saveQuestionsToDB(questions) {
  try {
    for (const q of questions) {
      const newQuestion = new Question({
        categoryName: q.categoryName,
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

async function generateQuestions() {
  try {
    const allCategories = ["paises", "cine", "clubes", "literatura", "arte"];

    for (const category of allCategories) {
      const currentQuestions = await Question.find({
        category: category
      });

      if (currentQuestions.length < 100) {
        const missingQuestionsCount = 100 - currentQuestions.length;
        const additionalQuestions = await questionManager.loadAllQuestions([category], missingQuestionsCount);
        if (additionalQuestions && additionalQuestions.length > 0) {
          await saveQuestionsToDB(additionalQuestions);
        } else {
          console.log(`No se generaron preguntas adicionales para '${category}'`);
        }
      }
    }
    console.log("Proceso de todas las categorías completado.");
  } catch (error) {
    console.error("Error al procesar las categorías:", error);
  }
}

if (require.main === module || process.env.NODE_ENV === "test") {
  app.listen(port, () => {
    console.log(`🚀 Question Service listening at http://localhost:${port}`);
  });
}


module.exports = app;