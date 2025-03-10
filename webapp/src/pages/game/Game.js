import React from "react";
import "./Game.css";
import Nav from "../../components/nav/Nav";
import Footer from "../../components/Footer";
import HintButton from "../../components/hintButton/HintButton";
import BaseButton from "../../components/button/BaseButton";
import { LinearProgress, Box } from "@mui/material";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";

// Importa la imagen
import coliseoImage from "../../assets/img/coliseo.jpg";
import ChatBubble from "../../components/chatBubble/ChatBubble";

const Game = () => {
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
              ></ArrowForwardIcon>
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
        <div></div>
      </main>
      <Footer />
    </div>
  );
};

export default Game;
