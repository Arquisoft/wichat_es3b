"use client"

import { useEffect, useState, useCallback, useRef } from "react"
import "./Game.css"
import Nav from "../../components/nav/Nav"
import Footer from "../../components/Footer"
import HintButton from "../../components/hintButton/HintButton"
import BaseButton from "../../components/button/BaseButton"
import ChatBox from "../../components/chatBox/ChatBox"
import InfoDialog from "../../components/infoDialog/InfoDialog"
import { LinearProgress, Box } from "@mui/material"
import ArrowForwardIcon from "@mui/icons-material/ArrowForward"
import { motion } from "framer-motion"

import { useTranslation } from "react-i18next"

const TOTAL_TIME = 40

const Game = () => {
  const { i18n } = useTranslation()
  const currentLanguage = i18n.language || "es"
  const [questionNumber, setQuestionNumber] = useState(0)
  const [questions, setQuestions] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [currentQuestion, setCurrentQuestion] = useState(null)
  const [correctAnswers, setCorrectAnswers] = useState(0)
  const [incorrectAnswers, setIncorrectAnswers] = useState(0)
  const [selectedAnswer, setSelectedAnswer] = useState(null)
  const [isCorrect, setIsCorrect] = useState(null)
  const [score, setScore] = useState(0)
  const [isAnswered, setIsAnswered] = useState(false)
  const [timeLeft, setTimeLeft] = useState(TOTAL_TIME)
  const [progress, setProgress] = useState(100)
  const [isChatBoxVisible, setIsChatBoxVisible] = useState(false)
  const [showSummary, setShowSummary] = useState(false)
  const timerRef = useRef(null)
  const [totalTimeUsed, setTotalTimeUsed] = useState(0)
  const [showRules, setShowRules] = useState(false)
  const HINT_LIMIT = 5
  const [hintsLeft, setHintsLeft] = useState(HINT_LIMIT)
  const [questionAnimationComplete, setQuestionAnimationComplete] = useState(false)

  const URL = "http://localhost:8004/"
  const GATEWAY_URL = process.env.REACT_APP_GATEWAY_SERVICE_URL || "http://localhost:8000"
  const loggedUsername = localStorage.getItem("username")

  const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

  const fetchQuestions = useCallback(async () => {
    try {
      console.log(`${GATEWAY_URL}/questions/${25}`)
      let n = 25
      const response = await fetch(`${GATEWAY_URL}/questions/${n}`)
      if (!response.ok) {
        throw new Error("No se pudieron obtener las preguntas.")
      }
      const data = await response.json()
      setQuestions(data)
      setCurrentQuestion(data[0])
      setIsLoading(false)
    } catch (error) {
      setIsLoading(false)
    }
  }, [])

  const saveStats = async () => {
    try {
      const statsData = {
        username: loggedUsername,
        rightAnswers: correctAnswers,
        wrongAnswers: incorrectAnswers,
        time: totalTimeUsed,
        score: score,
        date: new Date().toISOString(),
        win: correctAnswers > incorrectAnswers, // TODO: esto hay que quitarlo
      }
      const response = await fetch(`${GATEWAY_URL}/savestats`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(statsData),
      })

      if (!response.ok) {
        throw new Error()
      }

      const data = await response.json()
      console.log("Estadísticas guardadas", data)
    } catch (error) {
      console.error("Error al guardar estadísticas: ", error)
    }
  }

  useEffect(() => {
    return () => {
      clearInterval(timerRef.current)
    }
  }, [])

  useEffect(() => {
    fetchQuestions()
  }, [fetchQuestions])

  useEffect(() => {
    if (timeLeft <= 0 && !isAnswered) {
      clearInterval(timerRef.current)
      setIsAnswered(true)
      setIncorrectAnswers((prev) => prev + 1)
      const timeUsed = TOTAL_TIME
      setTotalTimeUsed((prev) => prev + timeUsed)

      if (questionNumber + 1 >= questions.length) {
        saveStats()
        setShowSummary(true)
      }
      return
    }

    if (isAnswered) return

    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => Math.max(prev - 1, 0))
    }, 1000)

    return () => clearInterval(timerRef.current)
  }, [timeLeft, isAnswered, questionNumber, questions.length])

  useEffect(() => {
    setProgress((timeLeft / TOTAL_TIME) * 100)
  }, [timeLeft])

  const handleNextQuestion = () => {
    setQuestionNumber((prevNumber) => {
      const newNumber = prevNumber + 1
      setCurrentQuestion(questions[newNumber])
      setSelectedAnswer(null)
      setIsCorrect(null)
      setIsAnswered(false)
      setProgress(100)
      setTimeLeft(TOTAL_TIME)
      setQuestionAnimationComplete(false)
      return newNumber
    })
  }

  const handleAnswerClick = async (respuesta) => {
    if (isAnswered) return
    clearInterval(timerRef.current)
    setSelectedAnswer(respuesta)
    setIsAnswered(true)
    if (respuesta === currentQuestion.respuestaCorrecta[currentLanguage]) {
      setIsCorrect(true)
      setScore((prevScore) => prevScore + 10)
      setCorrectAnswers((prev) => prev + 1)
    } else {
      setIsCorrect(false)
      setIncorrectAnswers((prev) => prev + 1)
    }

    if (questionNumber + 1 >= questions.length) {
      saveStats()
      setShowSummary(true)
    }
    const timeUsed = TOTAL_TIME - timeLeft
    setTotalTimeUsed((prev) => prev + timeUsed)
  }

  const formatTime = (time) => {
    const minutes = Math.floor(time / 60)
    const seconds = time % 60
    return `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`
  }

  const toggleChatBox = () => {
    setIsChatBoxVisible(!isChatBoxVisible)
  }

  if (isLoading) {
    return <div>Cargando...</div>
  }

  return (
    <div className="gameContainer">
      <Nav />
      <main className={showRules ? "blurred" : ""}>
        <div className="game-layout">
          <div className="left-column">
            <div className="hint-section">
              <HintButton
                text={isChatBoxVisible ? "Ocultar pistas" : "¿Necesitas una pista?"}
                onClick={toggleChatBox}
              />
              <div className={`chatBoxContainer ${isChatBoxVisible ? "visible" : "hidden"}`}>
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
                  hintsLeft={hintsLeft}
                  setHintsLeft={setHintsLeft}
                />
              </div>
            </div>
          </div>
          <motion.div
            className="center-column"
            key={questionNumber}
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{
              duration: 0.7,
              type: "spring",
              stiffness: 100,
              damping: 15,
            }}
            onAnimationComplete={() => setQuestionAnimationComplete(true)}
          >
            <div className="question-section">
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
              <h1>{currentQuestion.pregunta[currentLanguage]}</h1>
            </div>

            {currentQuestion.img && (
              <div className="question-image">
                <img src={currentQuestion.img[0] || "/placeholder.svg"} alt="imagen pregunta" />
              </div>
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
                          : timeLeft <= 0
                            ? "buttonPrimary"
                            : selectedAnswer === respuesta
                              ? "buttonIncorrect"
                              : "buttonPrimary"
                        : "buttonPrimary"
                    }
                    disabled={isAnswered}
                  />
                ))}
            </div>

            <div className="timer-section">
              <Box display="flex" alignItems="center" width="100%" gap={2}>
                <span>Tiempo</span>
                <Box width="100%" position="relative">
                  <LinearProgress id="progressBar" variant="determinate" value={progress} />
                </Box>
                <span>{formatTime(timeLeft)}</span>
              </Box>
            </div>
          </motion.div>
          <div className="right-column">
            <div className="rules-points-section">
              <div className="points-display">
                <span>Puntuación: </span>
                <span className="score">{score}</span>
              </div>
              <BaseButton text={"Reglas"} buttonType="buttonSecondary" onClick={() => setShowRules(true)} />
            </div>
          </div>
        </div>
      </main>

      {showRules && (
        <div className="overlay">
          <div className="dialogGameRulesContainer">
            <InfoDialog
              title={"Reglas del juego"}
              content={
                <ol>
                  <li>Observa la imagen.</li>
                  <li>Responde en el menor tiempo posible, dentro de los límites ofrecidos.</li>
                  <li>Usa las pistas generadas por nuestra IA si lo necesitas.</li>
                </ol>
              }
              onClose={() => setShowRules(false)}
            />
          </div>
        </div>
      )}

      {showSummary && (
        <div className="overlay">
          <div className="dialogGameRulesContainer">
            <InfoDialog
              title="Resumen de la partida"
              content={
                <div className="summaryContent">
                  <p>Respuestas correctas: {correctAnswers}</p>
                  <p>Respuestas incorrectas: {incorrectAnswers}</p>
                  <p>Ratio de aciertos: {(correctAnswers / (correctAnswers + incorrectAnswers || 1)).toFixed(2)}</p>
                  <p>
                    Tiempo promedio por pregunta:{" "}
                    {(totalTimeUsed / (correctAnswers + incorrectAnswers || 1)).toFixed(2)}s
                  </p>
                  <p>Puntuación máxima: {score}</p>
                </div>
              }
              onClose={async () => {
                setShowSummary(false)
                window.location.reload()
              }}
            />
          </div>
        </div>
      )}
      <Footer />
    </div>
  )
}

export default Game

