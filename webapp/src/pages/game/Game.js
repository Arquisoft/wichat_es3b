import React, { useState, useEffect } from "react";
import "./Game.css";
import Nav from "../../components/nav/Nav";
import Footer from "../../components/Footer";
import HintButton from "../../components/hintButton/HintButton";
import BaseButton from "../../components/button/BaseButton";
import { LinearProgress, Box } from "@mui/material";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import coliseoImage from "../../assets/img/coliseo.jpg";
import ChatBubble from "../../components/chatBubble/ChatBubble";

const TOTAL_TIME = 40; // Duración total de la pregunta en segundos

const Game = () => {
  const [timeLeft, setTimeLeft] = useState(TOTAL_TIME);
  const [progress, setProgress] = useState(100);

  useEffect(() => {
    if (timeLeft <= 0) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => Math.max(prev - 1, 0));
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft]);

  useEffect(() => {
    setProgress((timeLeft / TOTAL_TIME) * 100);
  }, [timeLeft]);

  return (
      <div>
        <Nav />
        <main>
          <div className="upperSection">
            <div className="hintButton">
              <HintButton
                  text={"¿Necesitas una pista?"}
                  onClick={() => alert("Tienes una pista!")}
              />
            </div>
            <div className="question">
              <div className="questionNumber">
                <h2>Pregunta 1/20</h2>
                <ArrowForwardIcon
                    titleAccess="Siguiente pregunta"
                    fontSize="1.5em"
                    id="nextArrow"
                    onClick={() => alert("Avanzar a la siguiente pregunta.")}
                />
              </div>
              <h1>¿Cuál es este monumento?</h1>
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
            <img src={coliseoImage} alt="imagen pregunta" />
            <div className="answerPanel">
              <BaseButton text="Torre Eiffel" />
              <BaseButton text="Torre de Pisa" />
              <BaseButton text="La EII" />
              <BaseButton text="Coliseo Romano" />
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
                <LinearProgress id="progressBar" variant="determinate" value={progress} />
              </Box>
              <span>{`00:${timeLeft < 10 ? "0" : ""}${timeLeft}`}</span>
            </Box>
          </div>
        </main>
        <Footer />
      </div>
  );
};

export default Game;
