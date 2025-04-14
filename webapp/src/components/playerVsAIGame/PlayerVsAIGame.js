"use client"

import React, { useState, useEffect, useRef, useCallback } from "react";
import "./PlayerVsAIGame.css";
import BaseButton from "../button/BaseButton";
import InfoDialog from "../infoDialog/InfoDialog";
import { LinearProgress, Box } from "@mui/material";
import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";

// Assuming the robot image path is correct relative to the public folder or build output
const ROBOT_IMAGE_PATH = "/webapp/src/assets/img/FriendlyRobotThinking.png"; // Adjust if necessary

// Added onGameEnd prop
const PlayerVsAIGame = ({ onGameEnd }) => {
    const { i18n, t } = useTranslation();
    const currentLanguage = i18n.language || "es"; // Default to Spanish if language is not set

    // --- State Variables ---
    const [questionNumber, setQuestionNumber] = useState(0);
    const [questions, setQuestions] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [currentQuestion, setCurrentQuestion] = useState(null);
    const [playerScore, setPlayerScore] = useState(0);
    const [aiScore, setAiScore] = useState(0);
    const [playerAnswered, setPlayerAnswered] = useState(false);
    const [aiAnswered, setAiAnswered] = useState(false);
    const [playerCorrect, setPlayerCorrect] = useState(null); // null, true, or false
    const [aiCorrect, setAiCorrect] = useState(null); // null, true, or false
    const [showRules, setShowRules] = useState(false);
    const [timeLeft, setTimeLeft] = useState(30); // Initial time, will be updated by config
    const [progress, setProgress] = useState(100);
    const [selectedAnswer, setSelectedAnswer] = useState(null);
    const [shuffledAnswers, setShuffledAnswers] = useState([]);
    const [showSummary, setShowSummary] = useState(false);
    const [showAIThinking, setShowAIThinking] = useState(false);
    const [aiMessage, setAiMessage] = useState("");
    const [showAiMessage, setShowAiMessage] = useState(false);
    const [questionAnimationComplete, setQuestionAnimationComplete] = useState(false);
    const [difficulty, setDifficulty] = useState("medium"); // Default difficulty
    const [config, setConfig] = useState(null); // Game configuration

    // --- Refs ---
    const timerRef = useRef(null);
    const isMounted = useRef(true); // Track component mount state
    const hasSavedStats = useRef(false); // Prevent saving stats multiple times

    // --- Constants ---
    const GATEWAY_URL = process.env.REACT_APP_GATEWAY_SERVICE_URL || "http://localhost:8000";
    const loggedUsername = localStorage.getItem("username") || t("player"); // Use translation for default player name

    // --- Functions defined with useCallback ---

    // Handle player running out of time (using useCallback)
    const handleTimeOut = useCallback(() => {
        // Ensure this only runs if the player hasn't already answered
        if (!playerAnswered && isMounted.current) {
            setPlayerAnswered(true);
            setPlayerCorrect(false); // Mark as incorrect due to timeout
            setSelectedAnswer(null); // Indicate no answer was selected
            // AI answer will be triggered by the useEffect watching playerAnswered
        }
    }, [playerAnswered]); // Dependency

    // Fallback AI answer simulation (using useCallback)
    const simulateAIAnswer = useCallback(() => {
        let aiAccuracy;
        switch(difficulty) {
            case "easy": aiAccuracy = 0.5; break;
            case "hard": aiAccuracy = 0.9; break;
            default: aiAccuracy = 0.75;
        }

        const isCorrect = Math.random() < aiAccuracy;

        if (isMounted.current) {
            setAiCorrect(isCorrect);
            if (isCorrect) setAiScore(prev => prev + 10);

            setAiMessage(isCorrect ? t('aiCorrectMessageDefault') : t('aiIncorrectMessageDefault'));
            setAiAnswered(true);
            setShowAIThinking(false);
            setShowAiMessage(true);

            setTimeout(() => {
                if (isMounted.current) setShowAiMessage(false);
            }, 5000);
        }
    }, [difficulty, t]); // Dependencies


    // Function to get AI's answer from the LLM service (using useCallback)
    const getAIAnswer = useCallback(async () => {
        if (!currentQuestion || !shuffledAnswers.length) {
            console.error("Cannot get AI answer: Missing current question or options.");
            if (isMounted.current) simulateAIAnswer(); // Fallback if data is missing
            return;
        }

        try {
            const aiAnswerData = {
                question: { // Ensure the structure matches llm-service expectations
                    pregunta: currentQuestion.pregunta,
                    respuestaCorrecta: currentQuestion.respuestaCorrecta,
                    respuestas: currentQuestion.respuestas,
                    descripcion: currentQuestion.descripcion || [], // Ensure description is an array
                    img: currentQuestion.img || [] // Ensure img is an array
                },
                options: shuffledAnswers,
                idioma: currentLanguage,
                difficulty: difficulty
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
                if (isCorrect) setAiScore(prev => prev + 10); // Award points only if correct

                // Use message from API if available, otherwise generate/fallback
                setAiMessage(data.message || (isCorrect ? t('aiCorrectMessageDefault') : t('aiIncorrectMessageDefault')));

                setAiAnswered(true);
                setShowAIThinking(false);
                setShowAiMessage(true);

                // Hide message after a delay
                setTimeout(() => {
                    if (isMounted.current) setShowAiMessage(false);
                }, 5000); // 5 seconds delay
            }

        } catch (error) {
            console.error("Error getting AI answer:", error);
            if (isMounted.current) simulateAIAnswer(); // Fallback on error
        }
    }, [currentQuestion, shuffledAnswers, currentLanguage, difficulty, GATEWAY_URL, t, simulateAIAnswer]); // Added simulateAIAnswer dependency

    // Save game statistics (using useCallback)
    const saveStats = useCallback(async () => {
        if (!loggedUsername || config === null) return; // Ensure username and config are available

        const playerWins = playerScore > aiScore;

        try {
            const statsData = {
                username: loggedUsername,
                // For PlayerVsAI, we might need more detailed stats if required
                rightAnswers: Math.round(playerScore / 10), // Approximation based on score
                wrongAnswers: config.numPreguntas - Math.round(playerScore / 10), // Approximation
                // time: /* Needs calculation if tracked per question */,
                score: playerScore,
                date: new Date().toISOString(),
                win: playerWins, // Indicate if player won against AI
                gameMode: "PlayerVsIA", // Add game mode context
                difficulty: difficulty // Add difficulty context
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
        }
    }, [loggedUsername, playerScore, aiScore, config, GATEWAY_URL, difficulty]); // Dependencies


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
            modoJuego: "playerVsIA", // Ensure correct mode for this component
            categories: ["all"],
            dificultad: "medium"
        };
        // Merge stored config with defaults, ensuring all keys exist
        const finalConfig = { ...defaultConfig, ...storedConfig };

        if (isMounted.current) {
            setConfig(finalConfig);
            setTimeLeft(finalConfig.tiempoPregunta);
            setDifficulty(finalConfig.dificultad); // Set difficulty from config
        }
    }, [t]); // Add t to dependencies if used in default username

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
                    setIsLoading(true); // Set loading true before fetch
                    const categories = config.categories.includes("all") ? ["all"] : config.categories;
                    const queryString = `questions?n=${config.numPreguntas}&topic=${categories.join(",")}`;
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
                            setQuestions([]); // Set empty questions if none received
                            setCurrentQuestion(null);
                        }
                    }
                } catch (error) {
                    console.error("Error fetching questions:", error);
                    if (isMounted.current) {
                        setQuestions([]); // Set empty questions on error
                        setCurrentQuestion(null);
                    }
                } finally {
                    if (isMounted.current) setIsLoading(false); // Set loading false after fetch/error
                }
            };
            fetchQuestions();
        }
    }, [config, GATEWAY_URL]); // Depend on config and GATEWAY_URL

    // Timer effect
    useEffect(() => {
        // Guard conditions: don't run if loading, no question, summary shown, or config not loaded
        if (isLoading || !currentQuestion || showSummary || !config) {
            clearInterval(timerRef.current); // Ensure timer is cleared if guards fail
            return;
        }

        const TOTAL_TIME = config.tiempoPregunta;

        // Handle timeout if time runs out before player answers
        if (timeLeft <= 0 && !playerAnswered) {
            clearInterval(timerRef.current);
            handleTimeOut(); // Player ran out of time
            return;
        }

        // Stop timer once both player and AI have answered
        if (playerAnswered && aiAnswered) {
            clearInterval(timerRef.current);
            return;
        }

        // Start or continue the timer
        // Clear previous interval before setting a new one
        clearInterval(timerRef.current);
        timerRef.current = setInterval(() => {
            setTimeLeft((prev) => {
                const newTime = Math.max(prev - 1, 0);
                // Update progress bar based on the new time
                setProgress((newTime / TOTAL_TIME) * 100);
                return newTime;
            });
        }, 1000);

        // Cleanup interval on effect change or unmount
        return () => clearInterval(timerRef.current);

        // *** REMOVED handleTimeOut from dependencies ***
    }, [timeLeft, playerAnswered, aiAnswered, isLoading, currentQuestion, config, showSummary]);


    // Shuffle answers when current question changes
    useEffect(() => {
        if (currentQuestion) {
            const correctAnswer = currentQuestion.respuestaCorrecta?.[currentLanguage];
            const incorrectAnswers = currentQuestion.respuestas?.[currentLanguage] || [];

            if (correctAnswer) {
                const allAnswers = [...incorrectAnswers, correctAnswer];
                // Simple shuffle algorithm
                for (let i = allAnswers.length - 1; i > 0; i--) {
                    const j = Math.floor(Math.random() * (i + 1));
                    [allAnswers[i], allAnswers[j]] = [allAnswers[j], allAnswers[i]];
                }
                if (isMounted.current) setShuffledAnswers(allAnswers);
            } else {
                if (isMounted.current) setShuffledAnswers([]); // Handle missing correct answer
            }
        } else {
            if (isMounted.current) setShuffledAnswers([]); // Clear if no current question
        }
    }, [currentQuestion, currentLanguage]);

    // Trigger AI answer after player answers
    useEffect(() => {
        // Ensure component is mounted and AI hasn't answered yet
        if (playerAnswered && !aiAnswered && currentQuestion && isMounted.current) {
            setShowAIThinking(true);
            getAIAnswer(); // Call AI answer logic
        }
    }, [playerAnswered, aiAnswered, currentQuestion, getAIAnswer]); // Added getAIAnswer dependency


    // Check if game ended to save stats and show summary
    useEffect(() => {
        // Ensure config, questions are loaded, and it's the last question
        if (config && questions.length > 0 && questionNumber >= config.numPreguntas - 1) {
            // Trigger only once when both player and AI have answered on the last question
            if (playerAnswered && aiAnswered && !hasSavedStats.current) {
                saveStats(); // Save stats
                if (isMounted.current) setShowSummary(true); // Show summary dialog
                hasSavedStats.current = true; // Mark as saved
            }
        }
    }, [playerAnswered, aiAnswered, questionNumber, questions.length, config, saveStats]); // Added saveStats dependency

    // --- Functions ---

    // Handle player's answer selection (using useCallback)
    const handlePlayerAnswer = useCallback((answer) => {
        if (playerAnswered || !currentQuestion || !config) return; // Prevent answering multiple times & guard

        clearInterval(timerRef.current); // Stop timer immediately
        if (isMounted.current) {
            setSelectedAnswer(answer);
            setPlayerAnswered(true);

            const isCorrect = answer === currentQuestion.respuestaCorrecta?.[currentLanguage];
            setPlayerCorrect(isCorrect);

            if (isCorrect) {
                // Simple scoring: 10 points for correct answer
                setPlayerScore(prev => prev + 10);
            }
            // AI answer is triggered by useEffect watching playerAnswered
        }
    }, [playerAnswered, currentQuestion, config, currentLanguage]); // Dependencies


    // Move to the next question or show summary (using useCallback)
    const handleNextQuestion = useCallback(() => {
        // Guard against missing config or questions, or if not finished with current
        if (!config || !questions.length || !(playerAnswered && aiAnswered)) return;

        const nextQuestionIndex = questionNumber + 1;

        // Check if it was the last question
        if (nextQuestionIndex >= config.numPreguntas) {
            // Summary is shown by the useEffect checking game end state
            // No need to explicitly call setShowSummary here
            return;
        }

        // Proceed to the next question
        if (isMounted.current && questions[nextQuestionIndex]) {
            // Reset state for the next question
            setQuestionNumber(nextQuestionIndex);
            setCurrentQuestion(questions[nextQuestionIndex]);
            setPlayerAnswered(false);
            setAiAnswered(false);
            setPlayerCorrect(null);
            setAiCorrect(null);
            setSelectedAnswer(null);
            setTimeLeft(config.tiempoPregunta); // Reset timer
            setProgress(100);
            setShowAIThinking(false);
            setShowAiMessage(false);
            setQuestionAnimationComplete(false); // Reset animation flag
            // Don't reset hasSavedStats here
        } else {
            console.error("Next question data is missing.");
            // Fallback to summary if next question data is missing unexpectedly
            if (isMounted.current && !hasSavedStats.current) {
                saveStats();
                setShowSummary(true);
                hasSavedStats.current = true;
            }
        }
    }, [questionNumber, config, questions, playerAnswered, aiAnswered, saveStats]); // Added saveStats dependency

    // Format time remaining
    const formatTime = (time) => {
        const minutes = Math.floor(time / 60);
        const seconds = time % 60;
        return `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
    };


    // --- Render Logic ---

    if (isLoading) {
        return <div className="loading-div"><h1>{t('loading')}</h1></div>;
    }

    // Added check for empty questions array after loading
    if (!isLoading && (!questions || questions.length === 0)) {
        return <div className="loading-div"><h1>Error: No questions loaded. Please check categories or API.</h1></div>;
    }

    if (!currentQuestion) {
        // This might happen briefly between loading and setting the first question
        return <div className="loading-div"><h1>{t('loading')}</h1></div>;
    }


    // Determine summary message based on scores
    let summaryTitle = t('finalResult');
    let summaryMessage;
    if (playerScore > aiScore) {
        summaryMessage = t('youWon');
    } else if (playerScore < aiScore) {
        summaryMessage = t('youLost');
    } else {
        summaryMessage = t('tie');
    }

    return (
        <div className="gameContainer">
            {/* Main Game Area */}
            <main className={showRules || showSummary ? "blurred" : ""}>
                <div className="game-layout">
                    {/* Left Column (AI) */}
                    <div className="left-column">
                        <div className="ai-character-container">
                            <div className="ai-robot">
                                <img src={ROBOT_IMAGE_PATH} alt="AI Robot" className="robot-image" />
                                {showAIThinking && (
                                    <div className="ai-thinking-bubble">
                                        <span>{t('thinking')}</span>
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
                            <div className="ai-score-display">
                                <h3>{t('ai', 'AI')}</h3> {/* Translate 'AI' */}
                                <div className="score-value">{aiScore}</div>
                                {aiAnswered && aiCorrect !== null && ( // Check aiCorrect is not null
                                    <div className={`answer-indicator ${aiCorrect ? "correct" : "incorrect"}`}>
                                        {aiCorrect ? "✓" : "✗"}
                                    </div>
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
                                {/* Enable next button only after both have answered and if not last question */}
                                {questionNumber < (config?.numPreguntas || 10) - 1 && (
                                    <ArrowForwardIcon
                                        titleAccess={t("nextQuestion")} // Translate title
                                        fontSize="medium" // Adjusted size
                                        id="nextArrow"
                                        onClick={(playerAnswered && aiAnswered) ? handleNextQuestion : undefined}
                                        style={{
                                            backgroundColor: (playerAnswered && aiAnswered) ? 'var(--color-primario)' : '#ccc', // Use CSS variables or defaults
                                            color: 'white',
                                            borderRadius: '50%',
                                            padding: '0.3em',
                                            cursor: (playerAnswered && aiAnswered) ? "pointer" : "not-allowed",
                                            opacity: (playerAnswered && aiAnswered) ? 1 : 0.5,
                                            transition: 'background-color 0.3s ease, opacity 0.3s ease',
                                        }}
                                    />
                                )}
                            </div>
                            {/* Ensure currentQuestion and pregunta exist */}
                            <h1>{currentQuestion?.pregunta?.[currentLanguage] || t('loading')}</h1>
                        </div>

                        {/* Optional Image */}
                        {currentQuestion?.img?.[0] && (
                            <div className="question-image">
                                <img
                                    src={currentQuestion.img[0]}
                                    alt={t('questionImageAlt', { question: currentQuestion?.pregunta?.[currentLanguage] })} // Translate alt text
                                    onError={(e) => e.target.style.display='none'} // Hide if image fails to load
                                />
                            </div>
                        )}

                        {/* Answer Buttons */}
                        <div className="answerPanel">
                            {shuffledAnswers.map((respuesta, index) => (
                                <BaseButton
                                    key={index}
                                    text={respuesta}
                                    onClick={() => handlePlayerAnswer(respuesta)}
                                    // Determine button style based on answer state
                                    buttonType={
                                        playerAnswered
                                            ? respuesta === currentQuestion?.respuestaCorrecta?.[currentLanguage]
                                                ? "buttonCorrect" // Correct answer style
                                                : selectedAnswer === respuesta
                                                    ? "buttonIncorrect" // Player's incorrect choice
                                                    : "buttonDisabled" // Other incorrect options
                                            : "buttonPrimary" // Default state
                                    }
                                    disabled={playerAnswered} // Disable after player answers
                                />
                            ))}
                        </div>

                        {/* Timer */}
                        <div className="timer-section">
                            <Box display="flex" alignItems="center" width="100%" gap={1}>
                                <span>{t('time')}</span>
                                <Box width="100%" sx={{ mx: 1 }}> {/* Add margin */}
                                    <LinearProgress id="progressBar" variant="determinate" value={progress} />
                                </Box>
                                <span>{formatTime(timeLeft)}</span>
                            </Box>
                        </div>
                    </motion.div>

                    {/* Right Column (Player Score & Rules) */}
                    <div className="right-column">
                        <div className="player-score-container">
                            <div className="player-score">
                                <h3>{loggedUsername}</h3>
                                <div className="score-value">{playerScore}</div>
                                {playerAnswered && playerCorrect !== null && ( // Check playerCorrect is not null
                                    <div className={`answer-indicator ${playerCorrect ? "correct" : "incorrect"}`}>
                                        {playerCorrect ? "✓" : "✗"}
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="rules-points-section">
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
                                    <li>{t('vsAIRule1')}</li>
                                    <li>{t('vsAIRule2')}</li>
                                    <li>{t('vsAIRule3')}</li>
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
                            title={summaryTitle}
                            content={
                                <div className="summaryContent">
                                    <h3>{summaryMessage}</h3>
                                    <p>{t('yourScore')} {playerScore}</p>
                                    <p>{t('aiScoreLabel')} {aiScore}</p>
                                </div>
                            }
                            onClose={() => {
                                // Don't save stats again, already saved by useEffect
                                setShowSummary(false); // Hide summary first
                                if (onGameEnd) {
                                    onGameEnd(); // Call the callback passed from PlayView
                                } else {
                                    // Fallback if prop is not passed
                                    console.warn("onGameEnd prop not provided to PlayerVsAIGame. Reloading page.");
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

