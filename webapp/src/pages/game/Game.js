import React, { useEffect, useState, useCallback, useRef } from "react";
import "./Game.css";
import Nav from "../../components/nav/Nav";
import Footer from "../../components/Footer";
import HintButton from "../../components/hintButton/HintButton";
import BaseButton from "../../components/button/BaseButton";
import ChatBox from "../../components/chatBox/ChatBox";
import { LinearProgress, Box } from "@mui/material";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
const TOTAL_TIME = 40; // Duración total de la pregunta en segundos

const Game = () => {
  const [questionNumber, setQuestionNumber] = useState(0);
  const [questions, setQuestions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentQuestion, setCurrentQuestion] = useState("");
  const [correctAnswers, setCorrectAnswers] = useState(0);
  const [incorrectAnswers, setIncorrectAnswers] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [isCorrect, setIsCorrect] = useState(null);
  const [score, setScore] = useState(0);
  const [isAnswered, setIsAnswered] = useState(false);
  const [timeLeft, setTimeLeft] = useState(TOTAL_TIME);
  const [progress, setProgress] = useState(100);
  const [isChatBoxVisible, setIsChatBoxVisible] = useState(false); // State for ChatBox visibility

  const timerRef = useRef(null); // Referencia para almacenar el ID del intervalo

  const URL = "http://localhost:8004/";

  const fetchQuestions = useCallback(async () => {
    try {
      const response = await fetch('http://localhost:8000/questions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ n: 25, locale: 'es' }),
      });
      if (!response.ok) {
        throw new Error('No se pudieron obtener las preguntas.');
      }
      const data = await response.json();
      setQuestions(data);
      setCurrentQuestion(data[questionNumber]);
      setIsLoading(false);
    } catch (error) {
      setIsLoading(false);
    }
  }, [questionNumber]);

  useEffect(() => {
    fetchQuestions();
  }, [fetchQuestions]);

  useEffect(() => {
    if (timeLeft <= 0 || isAnswered) return;

    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => Math.max(prev - 1, 0));
    }, 1000);

    return () => clearInterval(timerRef.current);
  }, [timeLeft, isAnswered]);

  useEffect(() => {
    setProgress((timeLeft / TOTAL_TIME) * 100);
  }, [timeLeft]);

  const handleNextQuestion = () => {
    setQuestionNumber((prevNumber) => {
      const newNumber = prevNumber + 1;
      setCurrentQuestion(questions[newNumber]);
      setSelectedAnswer(null);
      setIsCorrect(null);
      setIsAnswered(false);
      setProgress(100);
      setTimeLeft(TOTAL_TIME);
      return newNumber;
    });
  };

  const handleAnswerClick = (respuesta) => {
    if (isAnswered) return;
    clearInterval(timerRef.current);
    setSelectedAnswer(respuesta);
    setIsAnswered(true);
    if (respuesta === currentQuestion.respuestaCorrecta) {
      setIsCorrect(true);
      setScore((prevScore) => prevScore + 10);
      setCorrectAnswers((prev) => prev + 1);
    } else {
      setIsCorrect(false);
      setIncorrectAnswers((prev) => prev + 1);
    }
  };

  const formatTime = (time) => {
    const minutes = Math.floor(time / 60);
    const seconds = time % 60;
    return `${minutes.toString().padStart(2, "0")}:${seconds
      .toString()
      .padStart(2, "0")}`;
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
                onClick={() => setIsChatBoxVisible((prev) => !prev)} // Toggle ChatBox visibility
            />
          </div>
          <div className="question">
            <div className="questionNumber">
              <h2>{`Pregunta ${questionNumber + 1}/25`}</h2>
              <ArrowForwardIcon
                titleAccess="Siguiente pregunta"
                fontSize="1.5em"
                id="nextArrow"
                onClick={isAnswered ? handleNextQuestion : null}
                style={{
                  color: isAnswered ? "white" : "gray",
                  cursor: isAnswered ? "pointer" : "not-allowed",
                }}
              ></ArrowForwardIcon>
            </div>
            <h1>{currentQuestion.pregunta}</h1>
          </div>
          <div className="rightUpperSection">
            <div className="pointsAndRules">
              <div>
                <span>Puntuación: </span> <span className="score">{score}</span>
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
          <div className="answerPanel">
            {currentQuestion.respuestas &&
              currentQuestion.respuestas.map((respuesta, index) => (
                <BaseButton
                  key={index}
                  text={respuesta}
                  onClick={() => handleAnswerClick(respuesta)}
                  buttonType={
                    isAnswered
                      ? respuesta === currentQuestion.respuestaCorrecta
                        ? "buttonCorrect"
                        : selectedAnswer === respuesta
                        ? "buttonIncorrect"
                        : "buttonPrimary"
                      : "buttonPrimary"
                  }
                  disabled={isAnswered}
                ></BaseButton>
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
                value={progress}
              ></LinearProgress>
            </Box>
            <span>{formatTime(timeLeft)}</span>
          </Box>
        </div>
        <div></div>
        {isChatBoxVisible && (
            <div className="chatBoxContainer">
              <ChatBox question={currentQuestion} language="es" />
            </div>
        )}
      </main>
      <Footer />
    </div>
  );
};
export default Game;
