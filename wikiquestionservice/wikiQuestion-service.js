const express = require("express");
const bodyParser = require("body-parser");
const QuestionManager = require("./questiongenerator/questionManager");
const mongoose = require("mongoose");
const Question = require("./question-model");

const app = express();
const port = 8004;

const mongoUri = process.env.MONGODB_URI;
mongoose.connect(mongoUri);

const questionManager = new QuestionManager();

const defaultTopics = ["all"];
const defaultNumQuestions = 25;

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

function filterValidTopics(rawTopic) {
  const validCategories = [
    "paises",
    "cine",
    "clubes",
    "literatura",
    "arte",
    "all",
  ];
  return rawTopic.split(",").filter((t) => validCategories.includes(t));
}

app.get("/questions", async (req, res) => {
  const { n = 25, topic = "all" } = req.query;
  const numQuestions = parseInt(n, 10);

  if (numQuestions > 30) {
    return res.status(400).json({ error: "El límite de preguntas es 30" });
  }

  let topics = filterValidTopics(topic);

  if (topics.length === 0) {
    return res
      .status(400)
      .json({ error: "No se proporcionaron categorías válidas." });
  }

  try {
    if (topics.includes("all") || topics.length === 0) {
      topics = ["all"];
    }

    const selectedQuestions = await questionManager.loadAllQuestions(
      topics,
      numQuestions
    );

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

app.get("/questionsDB", async (req, res) => {
  const numQuestions = parseInt(req.query.n ?? defaultNumQuestions, 10);
  const topic =
    req.query.topic && req.query.topic !== "undefined"
      ? req.query.topic
      : defaultTopics;

  if (numQuestions > 30) {
    return res.status(400).json({ error: "El límite de preguntas es 30" });
  }

  let topics = filterValidTopics(topic);

  if (topics.length === 0) {
    return res
      .status(400)
      .json({ error: "No se proporcionaron categorías válidas." });
  }

  try {
    if (topics.includes("all") || topics.length === 0) {
      topics = ["paises", "cine", "clubes", "literatura", "arte"];
    }

    const questionsPerCategory = Math.floor(numQuestions / topics.length);
    const extra = numQuestions % topics.length;
    const selectedQuestions = [];
    const selectedQuestionIds = new Set();

    for (let i = 0; i < topics.length; i++) {
      const topic = topics[i];
      const numToFetch = questionsPerCategory + (i < extra ? 1 : 0);

      // Obtener preguntas de la categoría actual
      const categoryQuestions = await Question.aggregate([
        {
          $match: {
            category: topic,
            _id: { $nin: Array.from(selectedQuestionIds) },
          },
        },
        { $sample: { size: numToFetch } },
      ]);

      // Agregar preguntas seleccionadas y registrar sus IDs
      selectedQuestions.push(...categoryQuestions);
      categoryQuestions.forEach((q) => selectedQuestionIds.add(q._id));
    }

    const formattedQuestions = selectedQuestions.map((q) => ({
      pregunta: q.question,
      respuestaCorrecta: q.correctAnswer,
      respuestas: q.incorrectAnswers,
      descripcion: q.description,
      img: q.img,
    }));

    res.json(formattedQuestions);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

async function saveQuestionsToDB(questions) {
  try {
    for (const q of questions) {
      const newQuestion = new Question({
        category: q.categoryName,
        question: q.preguntas,
        correctAnswer: q.respuestaCorrecta,
        incorrectAnswers: q.respuestasIncorrectas,
        description: q.descripcion,
        img: q.img,
      });

      await newQuestion.save();
    }
    console.log("Preguntas guardadas en MongoDB.");
  } catch (error) {
    console.error("Error al guardar preguntas:", error);
  }
}

async function obtainQuestions() {
  try {
    const categorias = ["paises", "cine", "clubes", "literatura", "arte"];
    for (const categoria of categorias) {
      const count = await Question.countDocuments({ category: categoria });
      if (count < 60) {
        const missingQuestionsCount = 60 - count;
        const additionalQuestions = await questionManager.loadAllQuestions(
          [categoria],
          missingQuestionsCount
        );
        if (additionalQuestions && additionalQuestions.length > 0) {
          await saveQuestionsToDB(additionalQuestions);
        }
      } else {
        console.log("Suficientes preguntas en la categoría: ", categoria);
        const allGeneratedQuestions = await questionManager.loadAllQuestions(
          [categoria],
          10
        );
        const newQuestions = await filtrarPreguntasNoExistentes(
          allGeneratedQuestions
        );
        const questionsToDelete = await Question.find({
          category: categoria,
        }).limit(newQuestions.length);
        const questionIdsToDelete = questionsToDelete.map((q) => q._id);
        await Question.deleteMany({ _id: { $in: questionIdsToDelete } });
        if (newQuestions && newQuestions.length > 0) {
          await saveQuestionsToDB(newQuestions);
        }
      }
    }
  } catch (error) {
    console.error("❌ Error al obtener el conteo de preguntas:", error);
  }
}

async function filtrarPreguntasNoExistentes(newQuestions) {
  const nuevosEnunciados = newQuestions.map((q) => q.preguntas.es);

  const existentes = await Question.find(
    { "question.es": { $in: nuevosEnunciados } },
    "question.es"
  ).lean();

  const enunciadosExistentes = new Set(existentes.map((q) => q.question.es));

  return newQuestions.filter((q) => !enunciadosExistentes.has(q.preguntas.es));
}

if (process.env.NODE_ENV === "e2e_test") {
  app.get("/generateQuestionsIfNotExists", async (req, res) => {
    console.log("Creando preguntas en ejecución de test.");
    try {
      const selectedQuestions = await questionManager.loadAllQuestions(
        ["all"],
        30
      );
      await saveQuestionsToDB(selectedQuestions);
      res.json(selectedQuestions);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });
}

var server = null;

if (require.main === module) {
  server = app.listen(port, () => {
    console.log(`🚀 Question Service listening at http://localhost:${port}`);
    obtainQuestions().catch((err) =>
      console.error("❌ Error al obtener preguntas:", err)
    );
  });
}

if (process.env.NODE_ENV === "e2e_test") {
  server = app.listen(port, () => {
    console.log("No se han cargado preguntas, ejecución en tests.");
    console.log(`🚀 Question Service listening at http://localhost:${port}`);
  });
}

server.on("close", () => {
  mongoose.connection.close();
});

module.exports = app;
