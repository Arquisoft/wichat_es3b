import React, { useState } from "react";
import "./Game.css";
import Nav from "../../components/nav/Nav";
import Footer from "../../components/Footer";
import HintButton from "../../components/hintButton/HintButton";
import BaseButton from "../../components/button/BaseButton";
import { LinearProgress, Box } from "@mui/material";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import axios from "axios";

// Importa la imagen
import coliseoImage from "../../assets/img/coliseo.jpg";

const Game = () => {
  // Estado para manejar la pista
  const [hint, setHint] = useState("");
  const [isLoadingHint, setIsLoadingHint] = useState(false);

  // Pregunta de prueba mockeada
  const mockQuestion = {
    pregunta: "¿Cuál es este monumento?",
    respuestaCorrecta: "El Coliseo Romano",
    respuestasIncorrectas: ["Torre Eiffel", "Torre de Pisa", "La EII"],
    respuestas: ["Torre Eiffel", "Torre de Pisa", "La EII", "Coliseo Romano"],
    descripcion: [
      { propiedad: "Ciudad", valor: "Roma" },
      { propiedad: "País", valor: "Italia" },
      { propiedad: "Época", valor: "Imperio Romano" }
    ],
    img: coliseoImage
  };

  // Función simple para obtener una pista
  const getHint = async () => {
    setIsLoadingHint(true);
    setHint(""); // Limpiar pista anterior

    try {
      // URL del gateway
      const URL = "http://localhost:8000/";

      // Datos para enviar al servicio LLM
      const requestData = {
        userQuestion: "Dame una pista",
        question: {
          respuestaCorrecta: mockQuestion.respuestaCorrecta,
          preguntas: {
            es: mockQuestion.pregunta,
            en: mockQuestion.pregunta,
            idioma: mockQuestion.pregunta
          },
          descripcion: mockQuestion.descripcion
        },
        idioma: "es",
        model: "empathy"
      };

      // Llamar al servicio LLM
      const response = await axios.post(`${URL}askllm`, requestData);

      // Mostrar la pista
      setHint(response.data.answer);
    } catch (error) {
      console.error("Error al obtener pista:", error);
      setHint("No se pudo obtener una pista en este momento.");
    } finally {
      setIsLoadingHint(false);
    }
  };

  return (
      <div>
        <Nav />
        <main>
          <div className="upperSection">
            <div className="hintButton">
              <HintButton
                  text={"¿Necesitas una pista?"}
                  onClick={getHint}
              />
              {isLoadingHint && <div className="hintLoading">Cargando pista...</div>}
              {hint && <div className="hintText">{hint}</div>}
            </div>
            <div className="question">
              <div className="questionNumber">
                <h2>Pregunta 1/20</h2>
                <ArrowForwardIcon
                    titleAccess="Siguiente pregunta"
                    fontSize="1.5em"
                    id="nextArrow"
                    onClick={() => alert("Avanzar a la siguiente pregunta.")}
                ></ArrowForwardIcon>
              </div>
              <h1>{mockQuestion.pregunta}</h1>
            </div>
            <div className="rightUpperSection">
              <div className="pointsAndRules">
                <div>
                  <span>Puntuación: </span> <span className="score">100</span>
                </div>
                <BaseButton text={"Reglas"} buttonType="buttonSecondary" />
              </div>
            </div>
          </div>
          <div className="midSection">
            <img src={coliseoImage} alt="imagen pregunta"></img>
            <div className="answerPanel">
              <BaseButton text="Torre Eiffel"></BaseButton>
              <BaseButton text="Torre de Pisa"></BaseButton>
              <BaseButton text="La EII"></BaseButton>
              <BaseButton text="Coliseo Romano"></BaseButton>
            </div>
          </div>
          <div className="lowerSection">
            <Box
                display="flex"
                alignItems="center"
                width="50%"
                margin="auto"
                gap={2}
            >
              <span>Tiempo</span>
              <Box width="100%" position="relative">
                <LinearProgress
                    id="progressBar"
                    variant="determinate"
                    value={70}
                ></LinearProgress>
              </Box>
              <span>00:35</span>
            </Box>
          </div>
        </main>
        <Footer />
      </div>
  );
};

export default Game;