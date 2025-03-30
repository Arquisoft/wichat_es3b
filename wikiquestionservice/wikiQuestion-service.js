const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const cron = require("node-cron");
const QuestionManager = require("./questiongenerator/questionManager");

const app = express();
const port = 8004;
let questionsLoaded = false;

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
  console.log("GET /questions");
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

const server = app.listen(port, async () => {
  console.log(`Question Service listening at http://localhost:${port}`);
  try {
    await questionManager.loadAllQuestions();
    questionsLoaded = true;
    console.log("Generadores de preguntas cargados con éxito!");
  } catch (error) {
    console.error("Error al cargar los generadores de preguntas:", error);
  }
});

cron.schedule("0 3 * * *", async () => {
  try {
    await questionManager.loadAllQuestions();
    console.log("Generadores de preguntas recargados.");
  } catch (error) {
    console.error("Error al recargar los generadores de preguntas:", error);
  }
});

module.exports = server;
