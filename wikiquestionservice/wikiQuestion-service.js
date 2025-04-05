const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const QuestionManager = require("./questiongenerator/questionManager");

const app = express();
const port = 8004;

const questionManager = new QuestionManager();

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cors());

app.get("/questions", async (req, res) => {
  const { n = 25, topic = "all" } = req.query;
  const numQuestions = parseInt(n, 10);

  if (numQuestions > 30) {
    return res.status(400).json({ error: "El límite de preguntas es 30" });
  }

  const validCategories = ["paises", "cine", "clubes", "literatura", "arte", "all"];
  let topics = topic.split(",").filter(t => validCategories.includes(t));

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

if (require.main === module) {
  app.listen(port, () => {
    console.log(`🚀 Question Service listening at http://localhost:${port}`);
  });
}

module.exports = app;
