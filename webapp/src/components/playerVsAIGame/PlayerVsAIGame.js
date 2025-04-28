import React, { useState, useEffect, useRef, useCallback } from "react";
import "./PlayerVsAIGame.css";
import BaseButton from "../button/BaseButton";
import InfoDialog from "../infoDialog/InfoDialog";
import { LinearProgress, Box } from "@mui/material";
import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";

const ROBOT_IMAGE_PATH = "/webapp/src/assets/img/FriendlyRobotThinking.png";

const PlayerVsAIGame = ({ onGameEnd }) => {
  const { i18n, t } = useTranslation();
  const currentLanguage = i18n.language || "es";

  const [questionNumber, setQuestionNumber] = useState(0);
  const [questions, setQuestions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [playerScore, setPlayerScore] = useState(0);
  const [aiScore, setAiScore] = useState(0);
  const [playerAnswered, setPlayerAnswered] = useState(false);
  const [aiAnswered, setAiAnswered] = useState(false);
  const [playerCorrect, setPlayerCorrect] = useState(null);
  const [aiCorrect, setAiCorrect] = useState(null);
  const [showRules, setShowRules] = useState(false);
  const [timeLeft, setTimeLeft] = useState(30);
  const [progress, setProgress] = useState(100);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [shuffledAnswers, setShuffledAnswers] = useState([]);
  const [showSummary, setShowSummary] = useState(false);
  const [showAIThinking, setShowAIThinking] = useState(false);
  const [aiMessage, setAiMessage] = useState("");
  const [showAiMessage, setShowAiMessage] = useState(false);
  const [questionAnimationComplete, setQuestionAnimationComplete] =
    useState(false);
  const [difficulty, setDifficulty] = useState("medium");
  const [config, setConfig] = useState(null);

  const timerRef = useRef(null);
  const isMounted = useRef(true);
  const hasSavedStats = useRef(false);

  const GATEWAY_URL =
    process.env.REACT_APP_GATEWAY_SERVICE_URL || "http://localhost:8000";
  const loggedUsername = localStorage.getItem("username") || t("player");

  const handleTimeOut = useCallback(() => {
    if (!playerAnswered && isMounted.current) {
      setPlayerAnswered(true);
      setPlayerCorrect(false);
      setSelectedAnswer(null);
    }
  }, [playerAnswered]);

  const simulateAIAnswer = useCallback(() => {
    let aiAccuracy;
    switch (difficulty) {
      case "easy":
        aiAccuracy = 0.5;
        break;
      case "hard":
        aiAccuracy = 0.9;
        break;
      default:
        aiAccuracy = 0.75;
    }
    const isCorrect = Math.random() < aiAccuracy;

    if (isMounted.current) {
      setAiCorrect(isCorrect);
      if (isCorrect) setAiScore((prev) => prev + 10);
      setAiMessage(
        isCorrect
          ? t("aiCorrectMessageDefault")
          : t("aiIncorrectMessageDefault")
      );
      setAiAnswered(true);
      setShowAIThinking(false);
      setShowAiMessage(true);
      setTimeout(() => {
        if (isMounted.current) setShowAiMessage(false);
      }, 5000);
    }
  }, [difficulty, t]);

  const getAIAnswer = useCallback(async () => {
    if (!currentQuestion || !shuffledAnswers.length) {
      console.error(
        "Cannot get AI answer: Missing current question or options."
      );
      if (isMounted.current) simulateAIAnswer();
      return;
    }

    setShowAIThinking(true);

    try {
      const aiAnswerData = {
        question: {
          pregunta: currentQuestion.pregunta,
          respuestaCorrecta: currentQuestion.respuestaCorrecta,
          respuestas: currentQuestion.respuestas,
          descripcion: currentQuestion.descripcion || [],
          img: currentQuestion.img || [],
        },
        options: shuffledAnswers,
        idioma: currentLanguage,
        difficulty: difficulty,
      };

      const response = await fetch(`${GATEWAY_URL}/ai-answer`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(aiAnswerData),
      });

      if (!response.ok) {
        throw new Error(`AI service error: ${response.statusText}`);
      }

      const data = await response.json();

      if (isMounted.current) {
        const isCorrect = data.isCorrect;
        setAiCorrect(isCorrect);
        if (isCorrect) setAiScore((prev) => prev + 10);
        setAiMessage(
          data.message ||
            (isCorrect
              ? t("aiCorrectMessageDefault")
              : t("aiIncorrectMessageDefault"))
        );
        setAiAnswered(true);
        setShowAIThinking(false);
        setShowAiMessage(true);
        setTimeout(() => {
          if (isMounted.current) setShowAiMessage(false);
        }, 5000);
      }
    } catch (error) {
      console.error("Error getting AI answer:", error);
      if (isMounted.current) simulateAIAnswer();
    }
  }, [
    currentQuestion,
    shuffledAnswers,
    currentLanguage,
    difficulty,
    GATEWAY_URL,
    t,
    simulateAIAnswer,
  ]);

  const saveStats = useCallback(async () => {
    if (!loggedUsername || config === null || hasSavedStats.current) return;

    const playerWins = playerScore > aiScore;
    hasSavedStats.current = true;

    try {
      const statsData = {
        username: loggedUsername,
        rightAnswers: Math.round(playerScore / 10),
        wrongAnswers: config.numPreguntas - Math.round(playerScore / 10),
        score: playerScore,
        date: new Date().toISOString(),
        win: playerWins,
        gameMode: "PlayerVsIA",
        difficulty: difficulty,
      };

      const response = await fetch(`${GATEWAY_URL}/savestats`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(statsData),
      });

      if (!response.ok) {
        throw new Error(`Failed to save stats: ${response.statusText}`);
      }
      console.log("Player vs AI statistics saved successfully.");
    } catch (error) {
      console.error("Error saving Player vs AI statistics:", error);
      hasSavedStats.current = false;
    }
  }, [loggedUsername, playerScore, aiScore, config, GATEWAY_URL, difficulty]);

  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
      clearInterval(timerRef.current);
    };
  }, []);

  useEffect(() => {
    let storedConfig = {};
    try {
      const storedItem = localStorage.getItem("quizConfig");
      storedConfig = storedItem ? JSON.parse(storedItem) : {};
    } catch (error) {
      console.error("Error reading quizConfig from localStorage:", error);
    }
    const defaultConfig = {
      numPreguntas: 10,
      tiempoPregunta: 30,
      limitePistas: 3,
      modoJuego: "playerVsIA",
      categories: ["all"],
      dificultad: "medium",
    };
    const finalConfig = { ...defaultConfig, ...storedConfig };

    if (isMounted.current) {
      setConfig(finalConfig);
      setTimeLeft(finalConfig.tiempoPregunta);
      setDifficulty(finalConfig.dificultad);
    }
  }, [t]);

  useEffect(() => {
    if (config) {
      const fetchQuestions = async () => {
        if (!config.categories || config.categories.length === 0) {
          console.warn("No categories selected, cannot fetch questions.");
          if (isMounted.current) setIsLoading(false);
          return;
        }
        setIsLoading(true);
        try {
          const categories = config.categories.includes("all")
            ? ["all"]
            : config.categories;
          const queryString = `questionsDB?n=${
            config.numPreguntas
          }&topic=${categories.join(",")}`;
          const response = await fetch(`${GATEWAY_URL}/${queryString}`);
          if (!response.ok)
            throw new Error(
              `Failed to fetch questions: ${response.statusText}`
            );
          const data = await response.json();

          if (isMounted.current) {
            if (data && data.length > 0) {
              setQuestions(data);
              setCurrentQuestion(data[0]);
            } else {
              console.error("No questions received from API.");
              setQuestions([]);
              setCurrentQuestion(null);
            }
          }
        } catch (error) {
          console.error("Error fetching questions:", error);
          if (isMounted.current) {
            setQuestions([]);
            setCurrentQuestion(null);
          }
        } finally {
          if (isMounted.current) setIsLoading(false);
        }
      };
      fetchQuestions();
    }
  }, [config, GATEWAY_URL]);

  useEffect(() => {
    if (
      isLoading ||
      !currentQuestion ||
      showSummary ||
      !config ||
      playerAnswered
    ) {
      clearInterval(timerRef.current);
      return;
    }

    if (timeLeft <= 0) {
      clearInterval(timerRef.current);
      handleTimeOut();
      return;
    }

    clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        const newTime = Math.max(prev - 1, 0);
        setProgress((newTime / config.tiempoPregunta) * 100);
        return newTime;
      });
    }, 1000);

    return () => clearInterval(timerRef.current);
  }, [
    timeLeft,
    playerAnswered,
    isLoading,
    currentQuestion,
    config,
    showSummary,
    handleTimeOut,
  ]);

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
    } else {
      if (isMounted.current) setShuffledAnswers([]);
    }
  }, [currentQuestion, currentLanguage]);

  useEffect(() => {
    if (playerAnswered && !aiAnswered && currentQuestion && isMounted.current) {
      getAIAnswer();
    }
  }, [playerAnswered, aiAnswered, currentQuestion, getAIAnswer]);

  useEffect(() => {
    if (
      config &&
      questions.length > 0 &&
      questionNumber >= config.numPreguntas - 1
    ) {
      if (
        playerAnswered &&
        aiAnswered &&
        !hasSavedStats.current &&
        !showSummary
      ) {
        saveStats();
        if (isMounted.current) {
          setShowSummary(true);
        }
      }
    }
  }, [
    playerAnswered,
    aiAnswered,
    questionNumber,
    questions.length,
    config,
    saveStats,
    showSummary,
  ]);

  const handlePlayerAnswer = useCallback(
    (answer) => {
      if (playerAnswered || !currentQuestion || !config) return;

      clearInterval(timerRef.current);

      if (isMounted.current) {
        setSelectedAnswer(answer);
        setPlayerAnswered(true);

        const isCorrect =
          answer === currentQuestion.respuestaCorrecta?.[currentLanguage];
        setPlayerCorrect(isCorrect);

        if (isCorrect) {
          setPlayerScore((prev) => prev + 10);
        }
      }
    },
    [playerAnswered, currentQuestion, config, currentLanguage]
  );

  const handleNextQuestion = useCallback(() => {
    if (!config || !questions.length || !playerAnswered || !aiAnswered) return;

    const nextQuestionIndex = questionNumber + 1;

    if (nextQuestionIndex >= config.numPreguntas) {
      return;
    }

    if (isMounted.current && questions[nextQuestionIndex]) {
      setQuestionNumber(nextQuestionIndex);
      setCurrentQuestion(questions[nextQuestionIndex]);
      setPlayerAnswered(false);
      setAiAnswered(false);
      setPlayerCorrect(null);
      setAiCorrect(null);
      setSelectedAnswer(null);
      setTimeLeft(config.tiempoPregunta);
      setProgress(100);
      setShowAIThinking(false);
      setShowAiMessage(false);
      setQuestionAnimationComplete(false);
    } else {
      console.error("Next question data is missing or component unmounted.");
      if (isMounted.current && !hasSavedStats.current && !showSummary) {
        saveStats();
        setShowSummary(true);
      }
    }
  }, [
    questionNumber,
    config,
    questions,
    playerAnswered,
    aiAnswered,
    saveStats,
    showSummary,
  ]);

  const formatTime = (time) => {
    const minutes = Math.floor(time / 60);
    const seconds = time % 60;
    return `${minutes.toString().padStart(2, "0")}:${seconds
      .toString()
      .padStart(2, "0")}`;
  };

  if (isLoading)
    return (
      <div className="loading-div">
        <h1>{t("loading")}</h1>
      </div>
    );
  if (!isLoading && (!questions || questions.length === 0))
    return (
      <div className="loading-div">
        <h1>{t("errorNoQuestions", "Error: No se cargaron preguntas.")}</h1>
      </div>
    );
  if (!currentQuestion || !config)
    return (
      <div className="loading-div">
        <h1>{t("loading")}</h1>
      </div>
    );

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

  let summaryTitle = t("finalResult");
  let summaryMessage;
  if (playerScore > aiScore) summaryMessage = t("youWon");
  else if (playerScore < aiScore) summaryMessage = t("youLost");
  else summaryMessage = t("tie");

  return (
    <div className="gameContainer">
      <main className={showRules || showSummary ? "blurred" : ""}>
        <div className="game-layout">
          <div className="left-column player-vs-ai">
            <div className="combined-scoreboard-left">
              <div className="scoreboard-line">
                <span className="ai-name">WI</span>
                <span className="score">{aiScore}</span>
                {aiAnswered && aiCorrect !== null && (
                  <span
                    className={`answer-indicator ${
                      aiCorrect ? "correct" : "incorrect"
                    }`}
                  >
                    {aiCorrect ? "✓" : "✗"}
                  </span>
                )}
              </div>
              <div className="scoreboard-line separator">-</div>
              <div className="scoreboard-line player-line">
                <span className="player-name">{loggedUsername}</span>
                <span className="score">{playerScore}</span>
                {playerAnswered && playerCorrect !== null && (
                  <span
                    className={`answer-indicator ${
                      playerCorrect ? "correct" : "incorrect"
                    }`}
                  >
                    {playerCorrect ? "✓" : "✗"}
                  </span>
                )}
              </div>
            </div>
            <div className="ai-character-container">
              <div className="ai-robot">
                <img
                  src={ROBOT_IMAGE_PATH}
                  alt={t("aiRobotAlt", "AI Robot")}
                  className="robot-image"
                />
                {showAIThinking && (
                  <div className="ai-thinking-bubble">
                    <span>{t("thinking")}</span>
                    <span className="thinking-dots">...</span>
                  </div>
                )}
                {showAiMessage && (
                  <motion.div
                    className="ai-speech-bubble"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                  >
                    <p>{aiMessage}</p>
                  </motion.div>
                )}
              </div>
            </div>
          </div>

          <motion.div
            className="center-column"
            key={questionNumber}
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.4, type: "spring", stiffness: 120 }}
            onAnimationComplete={() => setQuestionAnimationComplete(true)}
          >
            <div className="question-section">
              <div className="categoryDisplay">
                <h1>{getCategoryDisplay()}</h1>
              </div>
              <div className="questionNumber">
                <h2>{`${t("question")} ${questionNumber + 1}/${
                  config.numPreguntas
                }`}</h2>

                {questionNumber < config.numPreguntas - 1 && (
                  <ArrowForwardIcon
                    titleAccess={t("nextQuestion")}
                    fontSize="medium"
                    id="nextArrow"
                    onClick={
                      playerAnswered && aiAnswered
                        ? handleNextQuestion
                        : undefined
                    }
                  />
                )}
              </div>
              <h1>
                {currentQuestion.pregunta?.[currentLanguage] || t("loading")}
              </h1>
            </div>

            {currentQuestion.img?.[0] && (
              <div className="question-image">
                <img
                  src={currentQuestion.img[0]}
                  alt={t("questionImageAlt", {
                    question: currentQuestion.pregunta?.[currentLanguage],
                  })}
                  onError={(e) => (e.target.style.display = "none")}
                />
              </div>
            )}

            <div className="answerPanel">
              {shuffledAnswers.map((respuesta, index) => (
                <BaseButton
                  key={index}
                  text={respuesta}
                  onClick={() => handlePlayerAnswer(respuesta)}
                  buttonType={
                    playerAnswered
                      ? respuesta ===
                        currentQuestion.respuestaCorrecta?.[currentLanguage]
                        ? "buttonCorrect"
                        : selectedAnswer === respuesta
                        ? "buttonIncorrect"
                        : "buttonDisabled"
                      : "buttonPrimary"
                  }
                  disabled={playerAnswered}
                />
              ))}
            </div>

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

          <div className="right-column">
            <div className="rules-points-section">
              <BaseButton
                text={t("rules")}
                buttonType="buttonSecondary"
                onClick={() => setShowRules(true)}
              />
            </div>
          </div>
        </div>
      </main>

      {showRules && (
        <div className="overlay">
          <div className="dialogGameRulesContainer">
            <InfoDialog
              title={t("gameRules")}
              content={
                <ol>
                  <li>{t("vsAIRule1")}</li>
                  <li>{t("vsAIRule2")}</li>
                  <li>{t("vsAIRule3")}</li>
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
              title={summaryTitle}
              content={
                <div className="summaryContent">
                  <h3>{summaryMessage}</h3>
                  <p>
                    {t("yourScore")} {playerScore}
                  </p>
                  <p>
                    {t("aiScoreLabel")} {aiScore}
                  </p>
                </div>
              }
              onClose={() => {
                setShowSummary(false);
                if (onGameEnd) onGameEnd();
                else {
                  console.warn("onGameEnd prop not provided. Reloading.");
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

export default PlayerVsAIGame;
