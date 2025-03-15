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
        return res
            .status(500)
            .json({
                error: "Las preguntas aún no han sido cargadas. Por favor, inténtalo de nuevo más tarde.",
            });
    }
    next();
});

app.get("/questions", async (req, res) => {
    const { n = 10, locale = "es" } = req.query;

    const numQuestions = parseInt(n, 10);
    if (numQuestions > 20) {
        return res.status(400).json({ error: "El límite de preguntas es 20" });
    }

    if (locale !== "en" && locale !== "es") {
        return res.status(400).json({ error: "El valor de 'locale' debe ser 'en' o 'es'" });
    }

    try {
        await questionManager.loadAllQuestions();

        const allQuestions = questionManager.questions;

        const limitedQuestions = allQuestions.slice(0, numQuestions).map(q => {
            return {
                ...q,
                pregunta: q.preguntas[locale],
                respuestaCorrecta: q.respuestaCorrecta,
                respuestasIncorrectas: q.respuestasIncorrectas,
                descripcion: q.descripcion,
                img: q.img
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
