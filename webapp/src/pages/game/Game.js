import React, { useEffect, useState, useCallback } from "react"; // Corregido useCallBack a useCallback
import "./Game.css";
import Nav from "../../components/nav/Nav";
import Footer from "../../components/Footer";
import HintButton from "../../components/hintButton/HintButton";
import BaseButton from "../../components/button/BaseButton";
import { LinearProgress, Box } from "@mui/material";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";

const Game = () => {
  const [questionNumber, setQuestionNumber] = useState(0);
  const [questions, setQuestions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentQuestion, setCurrentQuestion] = useState("");

  const URL = "http://localhost:8004/";

  const fetchQuestions = useCallback(async () => {
    // Correcto
    try {
      const response = await fetch(`${URL}questions?n=25&locale=es`);
      if (!response.ok) {
        throw new Error("No se pudieron obtener las preguntas.");
      }
      const data = await response.json();
      setQuestions(data);
      setCurrentQuestion(data[questionNumber]);
      setIsLoading(false);
    } catch (error) {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchQuestions();
  }, [fetchQuestions]);

  const handleNextQuestion = () => {
    setQuestionNumber(questionNumber + 1);
    setCurrentQuestion(questions[questionNumber]);
  };

  if (isLoading) {
    return <div>Cargando...</div>;
  }

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
              <h2>{`Pregunta ${questionNumber + 1}/25`}</h2>
              <ArrowForwardIcon
                titleAccess="Siguiente pregunta"
                fontSize="1.5em"
                id="nextArrow"
                onClick={handleNextQuestion}
              ></ArrowForwardIcon>
            </div>
            <h1>{currentQuestion.pregunta}</h1>
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
          {/* <div className="questionImageContainer"> */}
          {currentQuestion.img && (
            <img src={currentQuestion.img[0]} alt="imagen pregunta"></img>
          )}
          {/* </div> */}
          <div className="answerPanel">
            {currentQuestion.respuestas &&
              currentQuestion.respuestas.map((respuesta, index) => (
                <BaseButton key={index} text={respuesta}></BaseButton>
              ))}
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
