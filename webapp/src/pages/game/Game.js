import React, { useEffect, useState, useCallback, useRef } from "react";
import "./Game.css";
import Nav from "../../components/nav/Nav";
import Footer from "../../components/Footer";
import HintButton from "../../components/hintButton/HintButton";
import BaseButton from "../../components/button/BaseButton";
import ChatBox from "../../components/chatBox/ChatBox";
import { LinearProgress, Box } from "@mui/material";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import { useTranslation } from "react-i18next";

const Game = () => {
  const { i18n } = useTranslation();
  const currentLanguage = i18n.language || "es";
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
  const [progress, setProgress] = useState(100);
  const [isChatBoxVisible, setIsChatBoxVisible] = useState(false);
  const timerRef = useRef(null);

  const URL = "http://localhost:8004/";

  const [config, setConfig] = useState({
    numPreguntas: 10,
    tiempoPregunta: 30,
    limitePistas: 3,
    modoJuego: "Jugador vs IA",
    categories: ["all"],
  });

  const [timeLeft, setTimeLeft] = useState(config.tiempoPregunta);

  useEffect(() => {
    const storedConfig = JSON.parse(localStorage.getItem("quizConfig"));
    if (storedConfig) {
      setConfig(storedConfig);
    }
  }, []);

  useEffect(() => {
    setTimeLeft(config.tiempoPregunta || 30);
  }, [config.tiempoPregunta]);

  const TOTAL_TIME = config.tiempoPregunta;

  const fetchQuestions = useCallback(async () => {
    try {
      const categories = config.categories.includes("all") ? ["all"] : config.categories;
      const queryString = `questions?n=${config.numPreguntas}&topic=${categories.join(",")}`;

      console.log("Solicitando preguntas con categorías: ", categories);

      const response = await fetch(`${URL}${queryString}`);
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
  }, [config.numPreguntas, questionNumber]);

  useEffect(() => {
    fetchQuestions();
  }, [fetchQuestions]);

  useEffect(() => {
    if (isAnswered || timeLeft <= 0) return;

    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timerRef.current);
  }, [isAnswered]);

  useEffect(() => {
    setProgress((timeLeft / TOTAL_TIME) * 100);
  }, [timeLeft, TOTAL_TIME]);

  const handleNextQuestion = () => {
    setQuestionNumber((prevNumber) => {
      const newNumber = prevNumber + 1;
      setCurrentQuestion(questions[newNumber]);
      setSelectedAnswer(null);
      setIsCorrect(null);
      setIsAnswered(false);
      setProgress(100);
      setTimeLeft(config.tiempoPregunta);
      return newNumber;
    });
  };

  const handleAnswerClick = (respuesta) => {
    if (isAnswered) return;
    clearInterval(timerRef.current);
    setSelectedAnswer(respuesta);
    setIsAnswered(true);
    if (respuesta === currentQuestion.respuestaCorrecta[currentLanguage]) {
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
    return `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
  };

  const toggleChatBox = () => {
    setIsChatBoxVisible(!isChatBoxVisible);
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
                  text={isChatBoxVisible ? "Ocultar pistas" : "¿Necesitas una pista?"}
                  onClick={toggleChatBox}
              />
            </div>
            <div className="question">
              <div className="questionNumber">
                <h2>{`Pregunta ${questionNumber + 1}/${config.numPreguntas}`}</h2>
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
              <h1>{currentQuestion.pregunta[currentLanguage]}</h1>
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
            {currentQuestion.img && <img src={currentQuestion.img[0]} alt="imagen pregunta"></img>}
            <div className="answerPanel">
              {currentQuestion.respuestas &&
                  currentQuestion.respuestas[currentLanguage].map((respuesta, index) => (
                      <BaseButton
                          key={index}
                          text={respuesta}
                          onClick={() => handleAnswerClick(respuesta)}
                          buttonType={
                            isAnswered
                                ? respuesta === currentQuestion.respuestaCorrecta[currentLanguage]
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
            <Box display="flex" alignItems="center" width="50%" margin="auto" gap={2}>
              <span>Tiempo</span>
              <Box width="100%" position="relative">
                <LinearProgress id="progressBar" variant="determinate" value={progress}></LinearProgress>
              </Box>
              <span>{formatTime(timeLeft)}</span>
            </Box>
          </div>
          <div></div>
          <div className={`chatBoxContainer ${isChatBoxVisible ? 'visible' : 'hidden'}`}>
            <ChatBox
                question={{
                  pregunta: currentQuestion.pregunta.es,
                  respuestaCorrecta: currentQuestion.respuestaCorrecta.es,
                  respuestas: currentQuestion.respuestas.es,
                  descripcion: currentQuestion.descripcion,
                  img: currentQuestion.img,
                }}
                language="es"
                isVisible={true}
            />
          </div>
        </main>
        <Footer />
      </div>
  );
};

export default Game;
