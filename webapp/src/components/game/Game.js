"use client"

import { useEffect, useState, useRef, useCallback } from "react"; // Added useCallback
import "./Game.css";
import HintButton from "../hintButton/HintButton";
import BaseButton from "../button/BaseButton";
import ChatBox from "../chatBox/ChatBox";
import InfoDialog from "../infoDialog/InfoDialog";
import { LinearProgress, Box } from "@mui/material";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";

// Added onGameEnd prop
const Game = ({ onGameEnd }) => {
  const { i18n, t } = useTranslation();
  const currentLanguage = i18n.language || "es";

  // --- State Variables ---
  const [questionNumber, setQuestionNumber] = useState(0);
  const [questions, setQuestions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [correctAnswers, setCorrectAnswers] = useState(0);
  const [incorrectAnswers, setIncorrectAnswers] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [isCorrect, setIsCorrect] = useState(null); // null, true, or false
  const [score, setScore] = useState(0);
  const [isAnswered, setIsAnswered] = useState(false);
  const [timeLeft, setTimeLeft] = useState(30); // Initial time, updated by config
  const [progress, setProgress] = useState(100);
  const [isChatBoxVisible, setIsChatBoxVisible] = useState(false);
  const [showSummary, setShowSummary] = useState(false);
  const [totalTimeUsed, setTotalTimeUsed] = useState(0);
  const [showRules, setShowRules] = useState(false);
  const [hintsLeft, setHintsLeft] = useState(3); // Default hints, updated by config
  const [questionAnimationComplete, setQuestionAnimationComplete] = useState(false);
  const [shuffledAnswers, setShuffledAnswers] = useState([]);
  const [config, setConfig] = useState(null); // Game configuration

  // --- Refs ---
  const timerRef = useRef(null);
  const isMounted = useRef(true); // Track component mount state
  const hasSavedStats = useRef(false); // Prevent saving stats multiple times

  // --- Constants ---
  const GATEWAY_URL = process.env.REACT_APP_GATEWAY_SERVICE_URL || "http://localhost:8000";
  const loggedUsername = localStorage.getItem("username");

  // --- Effects ---

  // Set mounted ref to false on unmount
  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
      clearInterval(timerRef.current); // Clear timer on unmount
    };
  }, []);

  // Load configuration from localStorage
  useEffect(() => {
    const storedConfig = JSON.parse(localStorage.getItem("quizConfig"));
    const defaultConfig = {
      numPreguntas: 10,
      tiempoPregunta: 30,
      limitePistas: 3,
      modoJuego: "singleplayer", // Ensure correct mode default
      categories: ["all"]
    };
    const finalConfig = { ...defaultConfig, ...storedConfig };

    if (isMounted.current) {
      setConfig(finalConfig);
      setTimeLeft(finalConfig.tiempoPregunta);
      setHintsLeft(finalConfig.limitePistas); // Set hints from config
    }
  }, []); // Run only on mount

  // Fetch questions when config is loaded
  useEffect(() => {
    if (config) {
      const fetchQuestions = async () => {
        if (!config.categories || config.categories.length === 0) {
          console.warn("No categories selected, cannot fetch questions.");
          if (isMounted.current) setIsLoading(false);
          return;
        }
        try {
          const categories = config.categories.includes("all") ? ["all"] : config.categories;
          const numPreguntas = config.numPreguntas ?? 10;
          const queryString = `questionsDB?n=${config.numPreguntas}&topic=${categories.join(",")}`;
          console.log("URL de la solicitud al gateway:", `${GATEWAY_URL}/${queryString}`);
          const response = await fetch(`${GATEWAY_URL}/${queryString}`);

          if (!response.ok) {
            throw new Error(`Failed to fetch questions: ${response.statusText}`);
          }
          const data = await response.json();

          if (isMounted.current) {
            if (data && data.length > 0) {
              setQuestions(data);
              setCurrentQuestion(data[0]); // Set initial question
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
  }, [config, GATEWAY_URL]); // Depend on config and GATEWAY_URL

  // Timer effect
  useEffect(() => {
    if (isLoading || !currentQuestion || showSummary || !config) return; // Guard conditions

    const TOTAL_TIME = config.tiempoPregunta;

    if (timeLeft <= 0 && !isAnswered) {
      clearInterval(timerRef.current);
      // Handle timeout: mark as answered incorrectly
      if (isMounted.current) {
        setIsAnswered(true);
        setIsCorrect(false); // Mark as incorrect on timeout
        setIncorrectAnswers((prev) => prev + 1);
        const timeUsed = TOTAL_TIME; // Full time used on timeout
        setTotalTimeUsed((prev) => prev + timeUsed);
      }
      return;
    }

    if (isAnswered) {
      clearInterval(timerRef.current); // Stop timer if answered
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

  }, [timeLeft, isAnswered, isLoading, currentQuestion, config, showSummary]); // Dependencies

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
      const correctAnswer = currentQuestion.respuestaCorrecta?.[currentLanguage];
      const incorrectAnswers = currentQuestion.respuestas?.[currentLanguage] || [];

      if (correctAnswer) {
        const allAnswers = [...incorrectAnswers, correctAnswer];
        // Simple shuffle
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
    // Ensure config and questions are loaded, and it's the last question
    if (config && questions.length > 0 && questionNumber >= config.numPreguntas - 1) {
      // Trigger only once when the last question is answered or timed out
      if (isAnswered && !hasSavedStats.current) {
        saveStats(); // Save stats
        if (isMounted.current) setShowSummary(true); // Show summary dialog
        hasSavedStats.current = true; // Mark as saved
      }
    }
  }, [isAnswered, questionNumber, questions.length, config]); // Dependencies


  // --- Functions ---

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
        // 'win' might not be relevant for single player, adjust as needed
        win: correctAnswers > incorrectAnswers, // Example logic
        gameMode: "singleplayer", // Add game mode
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
  }, [loggedUsername, correctAnswers, incorrectAnswers, totalTimeUsed, score, config, GATEWAY_URL]); // Dependencies

  // Handle moving to the next question
  const handleNextQuestion = useCallback(() => {
    if (!config || questionNumber >= config.numPreguntas - 1) {
      // Should already be handled by the useEffect checking for game end
      return;
    }

    const nextQuestionIndex = questionNumber + 1;
    if (isMounted.current && questions[nextQuestionIndex]) {
      setQuestionNumber(nextQuestionIndex);
      setCurrentQuestion(questions[nextQuestionIndex]);
      setSelectedAnswer(null);
      setIsCorrect(null);
      setIsAnswered(false);
      setTimeLeft(config.tiempoPregunta); // Reset timer
      setProgress(100);
      setQuestionAnimationComplete(false); // Reset animation flag
      // Don't reset hasSavedStats here
    } else {
      console.error("Next question data is missing.");
      // Potentially show summary as a fallback if next question is missing
      if (isMounted.current && !hasSavedStats.current) {
        saveStats();
        setShowSummary(true);
        hasSavedStats.current = true;
      }
    }
  }, [questionNumber, config, questions]); // Dependencies

  // Handle player's answer selection
  const handleAnswerClick = useCallback(async (respuesta) => {
    if (isAnswered || !currentQuestion || !config) return; // Guard conditions

    clearInterval(timerRef.current); // Stop timer
    const timeUsed = config.tiempoPregunta - timeLeft; // Calculate time taken

    if (isMounted.current) {
      setSelectedAnswer(respuesta);
      setIsAnswered(true);
      setTotalTimeUsed((prev) => prev + timeUsed); // Add time used for this question

      if (respuesta === currentQuestion.respuestaCorrecta?.[currentLanguage]) {
        setIsCorrect(true);
        setScore((prevScore) => prevScore + 10); // Add points
        setCorrectAnswers((prev) => prev + 1);
      } else {
        setIsCorrect(false);
        setIncorrectAnswers((prev) => prev + 1);
      }
    }
    // The useEffect checking for game end will handle summary/saving
  }, [isAnswered, currentQuestion, config, timeLeft, currentLanguage]); // Dependencies

  // Format time remaining
  const formatTime = (time) => {
    const minutes = Math.floor(time / 60);
    const seconds = time % 60;
    return `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
  };

  // Toggle hint chatbox visibility
  const toggleChatBox = () => {
    setIsChatBoxVisible(!isChatBoxVisible);
  };

  // --- Render Logic ---

  if (isLoading) {
    return <div className="loading-div"><h1>{t('loading')}</h1></div>;
  }

  if (!currentQuestion) {
    return <div className="loading-div"><h1>Error: No question data available.</h1></div>;
  }

  return (
      <div className="gameContainer">
        {/* Main Game Area */}
        <main className={showRules || showSummary ? "blurred" : ""}>
          <div className="game-layout">
            {/* Left Column (Hints) */}
            <div className="left-column">
              <div className="hint-section">
                <HintButton
                    // Translate button text based on visibility
                    text={isChatBoxVisible ? t('hideHints', 'Ocultar pistas') : t('needHint', '¿Necesitas una pista?')}
                    onClick={toggleChatBox}
                    disabled={hintsLeft <= 0 && !isChatBoxVisible} // Disable if no hints left and not visible
                />
                {/* ChatBox for hints */}
                <div className={`chatBoxContainer ${isChatBoxVisible ? "visible" : "hidden"}`}>
                  {currentQuestion && ( // Ensure currentQuestion exists before rendering ChatBox
                      <ChatBox
                          // Pass necessary question details
                          question={{
                            pregunta: currentQuestion.pregunta, // Pass the whole object
                            respuestaCorrecta: currentQuestion.respuestaCorrecta, // Pass the whole object
                            respuestas: currentQuestion.respuestas, // Pass the whole object
                            descripcion: currentQuestion.descripcion || [],
                            img: currentQuestion.img || [],
                          }}
                          language={currentLanguage} // Pass current language
                          isVisible={isChatBoxVisible} // Control visibility
                          hintsLeft={hintsLeft}
                          setHintsLeft={setHintsLeft} // Allow ChatBox to update hints count
                      />
                  )}
                </div>
              </div>
            </div>

            {/* Center Column (Question & Answers) */}
            <motion.div
                className="center-column"
                key={questionNumber} // Animate when question changes
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.5, type: "spring", stiffness: 100 }}
                onAnimationComplete={() => setQuestionAnimationComplete(true)}
            >
              <div className="question-section">
                <div className="questionNumber">
                  <h2>{`${t('question')} ${questionNumber + 1}/${config?.numPreguntas || 10}`}</h2>
                  {/* Enable next button only after answered and if not the last question */}
                  {questionNumber < (config?.numPreguntas || 10) - 1 && (
                      <ArrowForwardIcon
                          titleAccess={t("nextQuestion")}
                          fontSize="medium"
                          id="nextArrow"
                          onClick={isAnswered ? handleNextQuestion : undefined}
                          style={{
                            backgroundColor: isAnswered ? 'var(--color-primario)' : '#ccc',
                            color: 'white',
                            borderRadius: '50%',
                            padding: '0.3em',
                            cursor: isAnswered ? "pointer" : "not-allowed",
                            opacity: isAnswered ? 1 : 0.5,
                            transition: 'background-color 0.3s ease, opacity 0.3s ease',
                          }}
                      />
                  )}
                </div>
                <h1>{currentQuestion?.pregunta?.[currentLanguage] || t('loading')}</h1>
              </div>

              {/* Optional Image */}
              {currentQuestion?.img?.[0] && (
                  <div className="question-image">
                    <img
                        src={currentQuestion.img[0]}
                        alt={t('questionImageAlt', { question: currentQuestion?.pregunta?.[currentLanguage] })}
                        onError={(e) => e.target.style.display='none'}
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
                              ? respuesta === currentQuestion?.respuestaCorrecta?.[currentLanguage]
                                  ? "buttonCorrect"
                                  : selectedAnswer === respuesta
                                      ? "buttonIncorrect"
                                      : "buttonDisabled" // Style for other incorrect options
                              : "buttonPrimary" // Default state
                        }
                        disabled={isAnswered}
                    />
                ))}
              </div>

              {/* Timer */}
              <div className="timer-section">
                <Box display="flex" alignItems="center" width="100%" gap={1}>
                  <span>{t('time')}</span>
                  <Box width="100%" sx={{ mx: 1 }}>
                    <LinearProgress id="progressBar" variant="determinate" value={progress} />
                  </Box>
                  <span>{formatTime(timeLeft)}</span>
                </Box>
              </div>
            </motion.div>

            {/* Right Column (Score & Rules) */}
            <div className="right-column">
              <div className="rules-points-section">
                <div className="points-display">
                  <span>{`${t('score')}: `} </span>
                  <span className="score">{score}</span>
                </div>
                <BaseButton text={t('rules')} buttonType="buttonSecondary" onClick={() => setShowRules(true)} />
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
                        {/* Translate rules specific to single player */}
                        <li>{t('singlePlayerRule1', t('observe'))}</li>
                        <li>{t('singlePlayerRule2', t('answer'))}</li>
                        <li>{t('singlePlayerRule3', t('hintInfo'))}</li>
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
                    title={t("summaryTitle")} // Use translated title
                    content={
                      <div className="summaryContent">
                        {/* Use translated labels */}
                        <p>{t('summaryCorrect')} {correctAnswers}</p>
                        <p>{t('summaryIncorrect')} {incorrectAnswers}</p>
                        <p>{t('summaryRatio')} {(correctAnswers / (correctAnswers + incorrectAnswers || 1) * 100).toFixed(0)}%</p>
                        <p>
                          {t('summaryAvgTime')}{" "}
                          {(totalTimeUsed / (correctAnswers + incorrectAnswers || 1)).toFixed(2)}s
                        </p>
                        <p>{t('summaryMaxScore')} {score}</p>
                      </div>
                    }
                    onClose={() => {
                      // Don't save stats again here, already saved by useEffect
                      setShowSummary(false);
                      if (onGameEnd) {
                        onGameEnd(); // Call the callback passed from PlayView
                      } else {
                        // Fallback if prop is not passed (should not happen with PlayView update)
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

