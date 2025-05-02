"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import "./Game.css";
import HintButton from "../hintButton/HintButton";
import BaseButton from "../button/BaseButton";
import ChatBox from "../chatBox/ChatBox";
import InfoDialog from "../infoDialog/InfoDialog";
import { LinearProgress, Box } from "@mui/material";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";

const Game = ({ onGameEnd }) => {
  const { i18n, t } = useTranslation();
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
  const [timeLeft, setTimeLeft] = useState(30);
  const [progress, setProgress] = useState(100);
  const [isChatBoxVisible, setIsChatBoxVisible] = useState(false);
  const [showSummary, setShowSummary] = useState(false);
  const [totalTimeUsed, setTotalTimeUsed] = useState(0);
  const [showRules, setShowRules] = useState(false);
  const [hintsLeft, setHintsLeft] = useState(3);
  const [questionAnimationComplete, setQuestionAnimationComplete] =
    useState(false);
  const [shuffledAnswers, setShuffledAnswers] = useState([]);
  const [config, setConfig] = useState(null);

  const timerRef = useRef(null);
  const isMounted = useRef(true);
  const hasSavedStats = useRef(false);

  const GATEWAY_URL =
    process.env.REACT_APP_GATEWAY_SERVICE_URL || "http://localhost:8000";
  const loggedUsername = localStorage.getItem("username");

  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
      clearInterval(timerRef.current);
    };
  }, []);

  useEffect(() => {
    const storedConfig = JSON.parse(localStorage.getItem("quizConfig"));
    const defaultConfig = {
      numPreguntas: 10,
      tiempoPregunta: 30,
      limitePistas: 3,
      modoJuego: "singleplayer",
      categories: ["all"],
    };
    const finalConfig = { ...defaultConfig, ...storedConfig };

    if (isMounted.current) {
      setConfig(finalConfig);
      setTimeLeft(finalConfig.tiempoPregunta);
      setHintsLeft(finalConfig.limitePistas);
    }
  }, []);

  useEffect(() => {
    if (config) {
      const fetchQuestions = async () => {
        if (!config.categories || config.categories.length === 0) {
          console.warn("No categories selected, cannot fetch questions.");
          if (isMounted.current) setIsLoading(false);
          return;
        }
        try {
          const categories = config.categories.includes("all")
            ? ["all"]
            : config.categories;
          const numPreguntas = config.numPreguntas ?? 10;
          const queryString = `questionsDB?n=${
            config.numPreguntas
          }&topic=${categories.join(",")}`;
          console.log(
            "URL de la solicitud al gateway:",
            `${GATEWAY_URL}/${queryString}`
          );
          const response = await fetch(`${GATEWAY_URL}/${queryString}`);

          if (!response.ok) {
            throw new Error(
              `Failed to fetch questions: ${response.statusText}`
            );
          }
          const data = await response.json();

          if (isMounted.current) {
            if (data && data.length > 0) {
              setQuestions(data);
              setCurrentQuestion(data[0]);
            } else {
              console.error("No questions received from API.");
            }
            setIsLoading(false);
          }
        } catch (error) {
          console.error("Error fetching questions:", error);
          if (isMounted.current) setIsLoading(false);
        }
      };
      fetchQuestions();
    }
  }, [config, GATEWAY_URL]);

  useEffect(() => {
    if (isLoading || !currentQuestion || showSummary || !config) return;

    const TOTAL_TIME = config.tiempoPregunta;

    if (timeLeft <= 0 && !isAnswered) {
      clearInterval(timerRef.current);
      if (isMounted.current) {
        setIsAnswered(true);
        setIsCorrect(false);
        setIncorrectAnswers((prev) => prev + 1);
        const timeUsed = TOTAL_TIME;
        setTotalTimeUsed((prev) => prev + timeUsed);
      }
      return;
    }

    if (isAnswered) {
      clearInterval(timerRef.current);
      return;
    }

    // Start or continue the timer
    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        const newTime = Math.max(prev - 1, 0);
        setProgress((newTime / TOTAL_TIME) * 100); // Update progress
        return newTime;
      });
    }, 1000);

    // Cleanup interval
    return () => clearInterval(timerRef.current);
  }, [timeLeft, isAnswered, isLoading, currentQuestion, config, showSummary]);

  // Update progress bar visually based on timeLeft
  useEffect(() => {
    if (config) {
      const TOTAL_TIME = config.tiempoPregunta;
      setProgress((timeLeft / TOTAL_TIME) * 100);
    }
  }, [timeLeft, config]);

  // Shuffle answers when current question changes
  useEffect(() => {
    if (currentQuestion) {
      const correctAnswer =
        currentQuestion.respuestaCorrecta?.[currentLanguage];
      const incorrectAnswers =
        currentQuestion.respuestas?.[currentLanguage] || [];

      if (correctAnswer) {
        const allAnswers = [...incorrectAnswers, correctAnswer];
        for (let i = allAnswers.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [allAnswers[i], allAnswers[j]] = [allAnswers[j], allAnswers[i]];
        }
        if (isMounted.current) setShuffledAnswers(allAnswers);
      } else {
        if (isMounted.current) setShuffledAnswers([]);
      }
    }
  }, [currentQuestion, currentLanguage]);

  // Check if game ended to save stats and show summary
  useEffect(() => {
    if (
      config &&
      questions.length > 0 &&
      questionNumber >= config.numPreguntas - 1
    ) {
      if (isAnswered && !hasSavedStats.current) {
        saveStats();
        if (isMounted.current) setShowSummary(true);
        hasSavedStats.current = true;
      }
    }
  }, [isAnswered, questionNumber, questions.length, config]);

  // Save game statistics
  const saveStats = useCallback(async () => {
    if (!loggedUsername || config === null) return;

    try {
      const statsData = {
        username: loggedUsername,
        rightAnswers: correctAnswers,
        wrongAnswers: incorrectAnswers,
        time: totalTimeUsed,
        score: score,
        date: new Date().toISOString(),
        win: correctAnswers > incorrectAnswers,
        gameMode: "singleplayer",
      };
      const response = await fetch(`${GATEWAY_URL}/savestats`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(statsData),
      });

      if (!response.ok) {
        throw new Error(`Failed to save stats: ${response.statusText}`);
      }
      console.log("Single player statistics saved successfully.");
    } catch (error) {
      console.error("Error saving single player statistics:", error);
    }
  }, [
    loggedUsername,
    correctAnswers,
    incorrectAnswers,
    totalTimeUsed,
    score,
    config,
    GATEWAY_URL,
  ]);

  // Handle moving to the next question
  const handleNextQuestion = useCallback(() => {
    if (!config || questionNumber >= config.numPreguntas - 1) {
      return;
    }

    const nextQuestionIndex = questionNumber + 1;
    if (isMounted.current && questions[nextQuestionIndex]) {
      setQuestionNumber(nextQuestionIndex);
      setCurrentQuestion(questions[nextQuestionIndex]);
      setSelectedAnswer(null);
      setIsCorrect(null);
      setIsAnswered(false);
      setTimeLeft(config.tiempoPregunta);
      setProgress(100);
      setQuestionAnimationComplete(false);
    } else {
      console.error("Next question data is missing.");
      if (isMounted.current && !hasSavedStats.current) {
        saveStats();
        setShowSummary(true);
        hasSavedStats.current = true;
      }
    }
  }, [questionNumber, config, questions]);

  // Handle player's answer selection
  const handleAnswerClick = useCallback(
    async (respuesta) => {
      if (isAnswered || !currentQuestion || !config) return;

      clearInterval(timerRef.current);
      const timeUsed = config.tiempoPregunta - timeLeft;

      if (isMounted.current) {
        setSelectedAnswer(respuesta);
        setIsAnswered(true);
        setTotalTimeUsed((prev) => prev + timeUsed);

        if (
          respuesta === currentQuestion.respuestaCorrecta?.[currentLanguage]
        ) {
          setIsCorrect(true);
          const timeBonus = Math.round(
            (config.tiempoPregunta - timeUsed) * (20 / config.tiempoPregunta)
          );
          const pointsEarned = 10 + Math.max(0, timeBonus);
          setScore((prevScore) => prevScore + pointsEarned);
          setCorrectAnswers((prev) => prev + 1);
        } else {
          setIsCorrect(false);
          setIncorrectAnswers((prev) => prev + 1);
        }
      }
    },
    [isAnswered, currentQuestion, config, timeLeft, currentLanguage]
  );

  // Format time remaining
  const formatTime = (time) => {
    const minutes = Math.floor(time / 60);
    const seconds = time % 60;
    return `${minutes.toString().padStart(2, "0")}:${seconds
      .toString()
      .padStart(2, "0")}`;
  };

  // Toggle hint chatbox visibility
  const toggleChatBox = () => {
    setIsChatBoxVisible(!isChatBoxVisible);
  };

  if (isLoading) {
    return (
      <div className="loading-div">
        <h1>{t("loading")}</h1>
      </div>
    );
  }

  if (!currentQuestion) {
    return (
      <div className="loading-div">
        <h1>Error: No question data available.</h1>
      </div>
    );
  }

  const getCategoryDisplay = () => {
    if (!config || !config.categories || config.categories.length === 0)
      return "";

    if (config.categories.length > 1) {
      return t("various") + " 🧩";
    }

    const category = config.categories[0];
    switch (category) {
      case "clubes":
        return t("football") + " ⚽";
      case "cine":
        return t("cinema") + " 🎬";
      case "literatura":
        return t("literature") + " 📚";
      case "paises":
        return t("countries") + " 🌎";
      case "arte":
        return t("art") + " 🎨";
      case "all":
      default:
        return t("all") + " 🧠";
    }
  };

  return (
    <div className="gameContainer">
      {/* Main Game Area */}
      <main className={showRules || showSummary ? "blurred" : ""}>
        <div className="game-layout">
          {/* Left Column (Hints) */}
          <div className="left-column">
            <div className="hint-section">
              <HintButton
                text={
                  isChatBoxVisible
                    ? t("hideHints", "Ocultar pistas")
                    : t("needHint", "¿Necesitas una pista?")
                }
                onClick={toggleChatBox}
                disabled={hintsLeft <= 0 && !isChatBoxVisible}
              />
              <div
                className={`chatBoxContainer ${
                  isChatBoxVisible ? "visible" : "hidden"
                }`}
              >
                {currentQuestion && (
                  <ChatBox
                    question={{
                      pregunta: currentQuestion.pregunta,
                      respuestaCorrecta: currentQuestion.respuestaCorrecta,
                      respuestas: currentQuestion.respuestas,
                      descripcion: currentQuestion.descripcion || [],
                      img: currentQuestion.img || [],
                    }}
                    language={currentLanguage}
                    isVisible={isChatBoxVisible}
                    hintsLeft={hintsLeft}
                    setHintsLeft={setHintsLeft}
                  />
                )}
              </div>
            </div>
          </div>

          {/* Center Column (Question & Answers) */}
          <motion.div
            className="center-column"
            key={questionNumber}
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5, type: "spring", stiffness: 100 }}
            onAnimationComplete={() => setQuestionAnimationComplete(true)}
          >
            <div className="question-section">
              <div className="categoryDisplay">
                <h1>{getCategoryDisplay()}</h1>
              </div>
              <div className="questionNumber">
                <h2>{`${t("question")} ${questionNumber + 1}/${
                  config?.numPreguntas || 10
                }`}</h2>
                {questionNumber < (config?.numPreguntas || 10) - 1 && (
                  <ArrowForwardIcon
                    titleAccess={t("nextQuestion")}
                    fontSize="medium"
                    id="nextArrow"
                    onClick={isAnswered ? handleNextQuestion : undefined}
                    style={{
                      backgroundColor: isAnswered
                        ? "var(--color-primario)"
                        : "#ccc",
                      color: "white",
                      borderRadius: "50%",
                      padding: "0.3em",
                      cursor: isAnswered ? "pointer" : "not-allowed",
                      opacity: isAnswered ? 1 : 0.5,
                      transition:
                        "background-color 0.3s ease, opacity 0.3s ease",
                    }}
                  />
                )}
              </div>
              <h1>
                {currentQuestion?.pregunta?.[currentLanguage] || t("loading")}
              </h1>
            </div>

            {/* Optional Image */}
            {currentQuestion?.img?.[0] && (
              <div className="question-image">
                <img
                  src={currentQuestion.img[0]}
                  alt={t("questionImageAlt", {
                    question: currentQuestion?.pregunta?.[currentLanguage],
                  })}
                  onError={(e) => (e.target.style.display = "none")}
                />
              </div>
            )}

            {/* Answer Buttons */}
            <div className="answerPanel">
              {shuffledAnswers.map((respuesta, index) => (
                <BaseButton
                  key={index}
                  text={respuesta}
                  onClick={() => handleAnswerClick(respuesta)}
                  buttonType={
                    isAnswered
                      ? respuesta ===
                        currentQuestion?.respuestaCorrecta?.[currentLanguage]
                        ? "buttonCorrect"
                        : selectedAnswer === respuesta
                        ? "buttonIncorrect"
                        : "buttonDisabled"
                      : "buttonPrimary"
                  }
                  disabled={isAnswered}
                />
              ))}
            </div>

            {/* Timer */}
            <div className="timer-section">
              <Box display="flex" alignItems="center" width="100%" gap={1}>
                <span>{t("time")}</span>
                <Box width="100%" sx={{ mx: 1 }}>
                  <LinearProgress
                    id="progressBar"
                    variant="determinate"
                    value={progress}
                  />
                </Box>
                <span>{formatTime(timeLeft)}</span>
              </Box>
            </div>
          </motion.div>

          {/* Right Column (Score & Rules) */}
          <div className="right-column">
            <div className="rules-points-section">
              <div className="points-display">
                <span>{`${t("score")}: `} </span>
                <span className="score">{score}</span>
              </div>
              <BaseButton
                text={t("rules")}
                buttonType="buttonSecondary"
                onClick={() => setShowRules(true)}
              />
            </div>
          </div>
        </div>
      </main>

      {/* Rules Dialog */}
      {showRules && (
        <div className="overlay">
          <div className="dialogGameRulesContainer">
            <InfoDialog
              title={t("gameRules")}
              content={
                <ol>
                  <li>{t("singlePlayerRule1", t("observe"))}</li>
                  <li>{t("singlePlayerRule2", t("answer"))}</li>
                  <li>{t("singlePlayerRule3", t("hintInfo"))}</li>
                </ol>
              }
              onClose={() => setShowRules(false)}
            />
          </div>
        </div>
      )}

      {/* Summary Dialog */}
      {showSummary && (
        <div className="overlay">
          <div className="dialogGameRulesContainer">
            <InfoDialog
              title={t("summaryTitle")}
              content={
                <div className="summaryContent">
                  <p>
                    {t("summaryCorrect")} {correctAnswers}
                  </p>
                  <p>
                    {t("summaryIncorrect")} {incorrectAnswers}
                  </p>
                  <p>
                    {t("summaryRatio")}{" "}
                    {(
                      (correctAnswers /
                        (correctAnswers + incorrectAnswers || 1)) *
                      100
                    ).toFixed(0)}
                    %
                  </p>
                  <p>
                    {t("summaryAvgTime")}{" "}
                    {(
                      totalTimeUsed / (correctAnswers + incorrectAnswers || 1)
                    ).toFixed(2)}
                    s
                  </p>
                  <p>
                    {t("summaryMaxScore")} {score}
                  </p>
                </div>
              }
              onClose={() => {
                setShowSummary(false);
                if (onGameEnd) {
                  onGameEnd();
                } else {
                  window.location.reload();
                }
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default Game;
