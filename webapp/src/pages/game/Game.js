import React, { useEffect, useState, useCallback, useRef } from "react";
import { useTranslation } from "react-i18next";
import "./Game.css";
import Nav from "../../components/nav/Nav";
import Footer from "../../components/Footer";
import HintButton from "../../components/hintButton/HintButton";
import BaseButton from "../../components/button/BaseButton";
import ChatBox from "../../components/chatBox/ChatBox";
import { LinearProgress, Box } from "@mui/material";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";

const TOTAL_TIME = 40; // Tiempo por pregunta en segundos
const URL = "http://localhost:8004/";

const Game = () => {
  const { i18n } = useTranslation();
  const selectedLanguage = i18n.language || "es"; // Idioma actual

  const [questionNumber, setQuestionNumber] = useState(0);
  const [allQuestions, setAllQuestions] = useState([]); // Guarda todas las preguntas originales
  const [questions, setQuestions] = useState([]); // Preguntas en el idioma seleccionado
  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(TOTAL_TIME);
  const [progress, setProgress] = useState(100);
  const [isChatBoxVisible, setIsChatBoxVisible] = useState(false);

  const timerRef = useRef(null); // Referencia para almacenar el ID del intervalo

  const fetchQuestions = useCallback(async () => {
    try {
      const response = await fetch(`${URL}questions?n=25`);
      if (!response.ok) {
        throw new Error("No se pudieron obtener las preguntas.");
      }
      const data = await response.json();
      setAllQuestions(data);
      setIsLoading(false);
    } catch (error) {
      console.error(error);
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchQuestions();
  }, [fetchQuestions]);

  useEffect(() => {
    if (allQuestions.length > 0) {
      const translatedQuestions = allQuestions.map((q) => ({
        pregunta: q.pregunta[selectedLanguage],
        respuestas: q.respuestas[selectedLanguage],
        respuestaCorrecta: q.respuestaCorrecta[selectedLanguage],
        img: q.img || null,
      }));

      setQuestions(translatedQuestions);
      setCurrentQuestion(translatedQuestions[questionNumber]);
    }
  }, [selectedLanguage, allQuestions, questionNumber]);

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
    if (questionNumber + 1 < questions.length) {
      setQuestionNumber(questionNumber + 1);
      setSelectedAnswer(null);
      setIsAnswered(false);
      setProgress(100);
      setTimeLeft(TOTAL_TIME);
    }
  };

  const handleAnswerClick = (respuesta) => {
    if (isAnswered) return;
    clearInterval(timerRef.current);
    setSelectedAnswer(respuesta);
    setIsAnswered(true);
    if (respuesta === currentQuestion.respuestaCorrecta) {
      setScore((prevScore) => prevScore + 10);
    }
  };

  const formatTime = (time) => {
    const minutes = Math.floor(time / 60);
    const seconds = time % 60;
    return `${minutes.toString().padStart(2, "0")}:${seconds
        .toString()
        .padStart(2, "0")}`;
  };

  const toggleChatBox = () => {
    setIsChatBoxVisible(!isChatBoxVisible);
  };

  if (isLoading) return <div>Cargando...</div>;

  return (
      <div>
        <Nav />
        <main>
          <div className="upperSection">
            <div className="hintButton">
              <HintButton
                  text={isChatBoxVisible ? "Ocultar pistas" : "¿Necesitas una pista?"}
                  onClick={toggleChatBox}
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
                />
              </div>
              <h1>{currentQuestion?.pregunta}</h1>
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
            {currentQuestion?.img && <img src={currentQuestion.img[0]} alt="imagen pregunta" />}
            <div className="answerPanel">
              {currentQuestion?.respuestas &&
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
                      />
                  ))}
            </div>
          </div>
          <div className="lowerSection">
            <Box display="flex" alignItems="center" width="50%" margin="auto" gap={2}>
              <span>Tiempo</span>
              <Box width="100%" position="relative">
                <LinearProgress id="progressBar" variant="determinate" value={progress} />
              </Box>
              <span>{formatTime(timeLeft)}</span>
            </Box>
          </div>
          <div className={`chatBoxContainer ${isChatBoxVisible ? 'visible' : 'hidden'}`}>
            <ChatBox question={currentQuestion} language={selectedLanguage} isVisible={true} />
          </div>
        </main>
        <Footer />
      </div>
  );
};

export default Game;