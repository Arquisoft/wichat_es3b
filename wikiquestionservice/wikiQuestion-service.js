const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const cron = require("node-cron");
const QuestionManager = require("./questiongenerator/questionManager");
const mongoose = require("mongoose");
const Question = require("./question-model");

const app = express();
const port = 8004;

const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/questiondb';
mongoose.connect(mongoUri);

const questionManager = new QuestionManager();

const defaultTopics = ["all"];
const defaultNumQuestions = 25;

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cors());

app.get("/questions", async (req, res) => {
  const numQuestions = parseInt(req.query.n ?? defaultNumQuestions, 10);
  const topic = (req.query.topic && req.query.topic !== "undefined") ? req.query.topic : defaultTopics;

  if (numQuestions > 30) {
    return res.status(400).json({ error: "El límite de preguntas es 30" });
  }

  const validCategories = ["paises", "cine", "clubes", "literatura", "arte", "all"];
  let topics = topic.split(",").filter(t => validCategories.includes(t));

  if (topics.length === 0) {
    return res.status(400).json({ error: "No se proporcionaron categorías válidas." });
  }

  try {
    if (topics.includes("all")|| topics.length === 0) {
      topics = ["paises", "cine", "clubes", "literatura", "arte"];
    }

    const questionsPerCategory = Math.floor(numQuestions / topics.length);
    const extra = numQuestions % topics.length;
    const selectedQuestions = [];
    const selectedQuestionIds = new Set();

    for (let i = 0; i < topics.length; i++) {
      const topic = topics[i];
      let numToFetch = questionsPerCategory;
      if (i < extra) numToFetch++; 

      let categoryQuestions = [];
      while (categoryQuestions.length < numToFetch) {
        const remainingQuestions = await Question.aggregate([
          { $match: { category: topic, _id: { $nin: Array.from(selectedQuestionIds) } } },
          { $sample: { size: numToFetch - categoryQuestions.length } }
        ]);

        categoryQuestions = categoryQuestions.concat(remainingQuestions);
        remainingQuestions.forEach(q => selectedQuestionIds.add(q._id));
      }

      if (categoryQuestions.length === 0) {
        console.log(`⚠️ No hay preguntas disponibles para la categoría '${topic}'`);
      }

      const questionIds = categoryQuestions.map(q => q._id);
      await Question.deleteMany({ _id: { $in: questionIds } });

      selectedQuestions.push(...categoryQuestions);
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

const server = app.listen(port, async () => {
  console.log(`Question Service listening at http://localhost:${port}`);
  try {
    //const questions =await questionManager.loadAllQuestions(defaultTopics,defaultNumQuestions);
    //await saveQuestionsToDB(questions);
    generateQuestions();
    questionsLoaded = true;
    console.log("Generadores de preguntas cargados con éxito!");
  } catch (error) {
    console.error("Error al cargar los generadores de preguntas:", error);
  }
});

cron.schedule("0 3 * * *", async () => {
  try {
    //const questions = await questionManager.loadAllQuestions(defaultTopics,defaultNumQuestions);
    //await saveQuestionsToDB(questions);
    generateQuestions();
    console.log("🔄 Generadores de preguntas recargados automáticamente.");
  } catch (error) {
    console.error("❌ Error al recargar los generadores de preguntas:", error);
  }
});

module.exports = server;