import React, { useEffect, useState, useCallback, useRef } from "react";
import "./Game.css";
import Nav from "../../components/nav/Nav";
import Footer from "../../components/Footer";
import HintButton from "../../components/hintButton/HintButton";
import BaseButton from "../../components/button/BaseButton";
import ChatBox from "../../components/chatBox/ChatBox";
import { LinearProgress, Box, Dialog, DialogTitle, DialogContent, DialogActions, Button } from "@mui/material";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";

import { useTranslation } from "react-i18next";

const TOTAL_TIME = 40;
const USERNAME = "jugador1";


const Game = () => {
  const { i18n } = useTranslation();
  const currentLanguage = i18n.language || "es";
  const [questionNumber, setQuestionNumber] = useState(0);
  const [questions, setQuestions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [correctAnswers, setCorrectAnswers] = useState(0);
  const [incorrectAnswers, setIncorrectAnswers] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [isCorrect, setIsCorrect] = useState(null);
  const [score, setScore] = useState(0);
  const [isAnswered, setIsAnswered] = useState(false);
  const [timeLeft, setTimeLeft] = useState(TOTAL_TIME);
  const [progress, setProgress] = useState(100);

  const [isChatBoxVisible, setIsChatBoxVisible] = useState(false);

  const [showSummary, setShowSummary] = useState(false);
  const timerRef = useRef(null);
  const [totalTimeUsed, setTotalTimeUsed] = useState(0);




  const URL = "http://localhost:8004/";
  const STATS_URL = "http://localhost:8005/savestats";

  const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

  const fetchQuestions = useCallback(async () => {
    try {
      const response = await fetch(`${URL}questions?n=25`);
      if (!response.ok) {
        throw new Error("No se pudieron obtener las preguntas.");
      }
      const data = await response.json();
      setQuestions(data);
      setCurrentQuestion(data[0]);
      setIsLoading(false);
    } catch (error) {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchQuestions();
  }, [fetchQuestions]);

  useEffect( () => {
    if (timeLeft <= 0 ) {// Si el contador de tiempo llega a 0, se cuenta la pregunta actual como incorrecta y se reinicia el juego
      setIncorrectAnswers((prev) => prev + 1);
      const timeUsed = TOTAL_TIME - timeLeft; // Tiempo usado en esta pregunta
      setTotalTimeUsed((prev) => prev + timeUsed); // ⏱️ Acumula el tiempo
      setShowSummary(true);
      return;
    }


    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => Math.max(prev - 1, 0));
    }, 1000);

    return () => clearInterval(timerRef.current);
  }, [timeLeft, isAnswered]);

  useEffect(() => {
    setProgress((timeLeft / TOTAL_TIME) * 100);
  }, [timeLeft]);

  const saveStats = async () => {
    try {
      await fetch(STATS_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: USERNAME,
          games: 1,
          rightAnswers: correctAnswers,
          wrongAnswers: incorrectAnswers,
          ratio: correctAnswers / (correctAnswers + incorrectAnswers || 1),
          averageTime: totalTimeUsed / (correctAnswers + incorrectAnswers || 1),
          maxScore: score,
        }),
      });
    } catch (error) {
      console.error("Error al guardar estadísticas:", error);
    }
  };

  const handleNextQuestion =  () => {
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

  const handleAnswerClick = async (respuesta) => {
    if (isAnswered) return;
    clearInterval(timerRef.current);
    setSelectedAnswer(respuesta);
    setIsAnswered(true);
    if (respuesta === currentQuestion.respuestaCorrecta[currentLanguage]) {
      setIsCorrect(true);
      setScore((prevScore) => prevScore + 10);
      setCorrectAnswers((prev) => prev + 1);

      if (questionNumber + 1 >= questions.length) {
        saveStats();
        setShowSummary(true);
      } else {
        await sleep(250);
        handleNextQuestion();
      }
    } else {
      setIsCorrect(false);
      setIncorrectAnswers((prev) => prev + 1);
      saveStats();
      setShowSummary(true);
    }
    const timeUsed = TOTAL_TIME - timeLeft; // Tiempo usado en esta pregunta
    setTotalTimeUsed((prev) => prev + timeUsed); // ⏱️ Acumula el tiempo
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



            {currentQuestion.img && (
                <img src={currentQuestion.img[0]} alt="imagen pregunta"></img>
            )}
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

          <div className={`chatBoxContainer ${isChatBoxVisible ? 'visible' : 'hidden'}`}>
            <ChatBox  question={{
              pregunta: currentQuestion.pregunta.es,
              respuestaCorrecta: currentQuestion.respuestaCorrecta.es,
              respuestas: currentQuestion.respuestas.es,
              descripcion: currentQuestion.descripcion,
              img: currentQuestion.img
            }}  language="es" isVisible={true} />
          </div>
        </main>
        <Footer />

        <Dialog open={showSummary} onClose={() => setShowSummary(false)}>
          <DialogTitle>Resumen de la partida</DialogTitle>
          <DialogContent>
            <p>Respuestas correctas: {correctAnswers}</p>
            <p>Respuestas incorrectas: {incorrectAnswers}</p>
            <p>Ratio de aciertos: {(correctAnswers / (correctAnswers + incorrectAnswers || 1)).toFixed(2)}</p>
            <p>Tiempo promedio por pregunta: {(totalTimeUsed / (correctAnswers + incorrectAnswers || 1)).toFixed(2)}s</p>
            <p>Puntuación máxima: {score}</p>
          </DialogContent>
          <DialogActions>
            <Button onClick={async () =>{
              setShowSummary(false);
              window.location.reload();
            }}>
              Cerrar
            </Button>
          </DialogActions>
        </Dialog>

      </div>
  );
};
export default Game;