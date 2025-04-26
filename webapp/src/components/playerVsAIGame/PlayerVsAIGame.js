"use client"

import React, { useState, useEffect, useRef, useCallback } from "react";
import "./PlayerVsAIGame.css"; // Ensure CSS path is correct
import BaseButton from "../button/BaseButton"; // Adjust path if needed
import InfoDialog from "../infoDialog/InfoDialog"; // Adjust path if needed
import { LinearProgress, Box } from "@mui/material";
import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";

// Assuming the robot image path is correct relative to the public folder or build output
// ¡Recuerda actualizar esta imagen a una sin fondo cuando la tengas!
const ROBOT_IMAGE_PATH = "/webapp/src/assets/img/FriendlyRobotThinking.png"; // Adjust if necessary

// Player vs AI Game Component
const PlayerVsAIGame = ({ onGameEnd }) => {
    // --- Hooks ---
    const { i18n, t } = useTranslation(); // For internationalization
    const currentLanguage = i18n.language || "es"; // Default language

    // --- State Variables ---
    const [questionNumber, setQuestionNumber] = useState(0); // Index of the current question
    const [questions, setQuestions] = useState([]); // Array of questions fetched from API
    const [isLoading, setIsLoading] = useState(true); // Loading state for fetching questions
    const [currentQuestion, setCurrentQuestion] = useState(null); // The current question object
    const [playerScore, setPlayerScore] = useState(0); // Player's score
    const [aiScore, setAiScore] = useState(0); // AI's score
    const [playerAnswered, setPlayerAnswered] = useState(false); // Flag if player has answered the current question
    const [aiAnswered, setAiAnswered] = useState(false); // Flag if AI has answered the current question
    const [playerCorrect, setPlayerCorrect] = useState(null); // Was player's answer correct? (null, true, false)
    const [aiCorrect, setAiCorrect] = useState(null); // Was AI's answer correct? (null, true, false)
    const [showRules, setShowRules] = useState(false); // Flag to show/hide the rules dialog
    const [timeLeft, setTimeLeft] = useState(30); // Time remaining for the current question
    const [progress, setProgress] = useState(100); // Progress bar percentage (based on timeLeft)
    const [selectedAnswer, setSelectedAnswer] = useState(null); // The answer selected by the player
    const [shuffledAnswers, setShuffledAnswers] = useState([]); // Array of answers in random order
    const [showSummary, setShowSummary] = useState(false); // Flag to show/hide the game summary dialog
    const [showAIThinking, setShowAIThinking] = useState(false); // Flag to show AI "thinking" bubble
    const [aiMessage, setAiMessage] = useState(""); // Message content for AI speech bubble
    const [showAiMessage, setShowAiMessage] = useState(false); // Flag to show AI speech bubble
    const [questionAnimationComplete, setQuestionAnimationComplete] = useState(false); // Flag for animation state (optional use)
    const [difficulty, setDifficulty] = useState("medium"); // AI difficulty level
    const [config, setConfig] = useState(null); // Game configuration loaded from storage

    // --- Refs ---
    const timerRef = useRef(null); // Ref to store the timer interval ID
    const isMounted = useRef(true); // Ref to track if the component is mounted (prevents state updates on unmounted component)
    const hasSavedStats = useRef(false); // Ref to prevent saving stats multiple times

    // --- Constants ---
    const GATEWAY_URL = process.env.REACT_APP_GATEWAY_SERVICE_URL || "http://localhost:8000"; // URL for the backend gateway
    const loggedUsername = localStorage.getItem("username") || t("player"); // Get logged-in username or default

    // --- Functions (Callbacks for performance) ---

    /**
     * Handles the case where the player runs out of time.
     */
    const handleTimeOut = useCallback(() => {
        if (!playerAnswered && isMounted.current) {
            setPlayerAnswered(true); // Mark player as answered (timeout)
            setPlayerCorrect(false); // Mark as incorrect due to timeout
            setSelectedAnswer(null); // No answer was selected
            // AI answer will be triggered by the useEffect watching playerAnswered
        }
    }, [playerAnswered]); // Dependency: playerAnswered

    /**
     * Simulates an AI answer locally as a fallback.
     * Determines correctness based on difficulty.
     */
    const simulateAIAnswer = useCallback(() => {
        let aiAccuracy;
        switch(difficulty) {
            case "easy": aiAccuracy = 0.5; break;
            case "hard": aiAccuracy = 0.9; break;
            default: aiAccuracy = 0.75; // Medium difficulty
        }
        const isCorrect = Math.random() < aiAccuracy; // Simulate correctness

        if (isMounted.current) {
            setAiCorrect(isCorrect);
            if (isCorrect) setAiScore(prev => prev + 10); // Update AI score if correct
            setAiMessage(isCorrect ? t('aiCorrectMessageDefault') : t('aiIncorrectMessageDefault')); // Set default message
            setAiAnswered(true); // Mark AI as answered
            setShowAIThinking(false); // Hide thinking bubble
            setShowAiMessage(true); // Show message bubble
            // Hide message after 5 seconds
            setTimeout(() => { if (isMounted.current) setShowAiMessage(false); }, 5000);
        }
    }, [difficulty, t]); // Dependencies: difficulty, t (translation function)

    /**
     * Fetches the AI's answer from the backend service.
     * Includes error handling and fallback simulation.
     */
    const getAIAnswer = useCallback(async () => {
        // Ensure required data is available
        if (!currentQuestion || !shuffledAnswers.length) {
            console.error("Cannot get AI answer: Missing current question or options.");
            if (isMounted.current) simulateAIAnswer(); // Use fallback if data is missing
            return;
        }

        setShowAIThinking(true); // Show thinking indicator

        try {
            // Prepare data for the AI service request
            const aiAnswerData = {
                question: { // Structure expected by the backend
                    pregunta: currentQuestion.pregunta,
                    respuestaCorrecta: currentQuestion.respuestaCorrecta,
                    respuestas: currentQuestion.respuestas,
                    descripcion: currentQuestion.descripcion || [],
                    img: currentQuestion.img || []
                },
                options: shuffledAnswers, // Shuffled options presented to the player
                idioma: currentLanguage, // Current game language
                difficulty: difficulty // Current AI difficulty
            };

            // Fetch AI answer from the gateway
            const response = await fetch(`${GATEWAY_URL}/ai-answer`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(aiAnswerData),
            });

            // Handle non-successful responses
            if (!response.ok) {
                throw new Error(`AI service error: ${response.statusText}`);
            }

            const data = await response.json(); // Parse the JSON response

            // Update state if component is still mounted
            if (isMounted.current) {
                const isCorrect = data.isCorrect; // Get correctness from response
                setAiCorrect(isCorrect);
                if (isCorrect) setAiScore(prev => prev + 10); // Award points if correct
                setAiMessage(data.message || (isCorrect ? t('aiCorrectMessageDefault') : t('aiIncorrectMessageDefault'))); // Use API message or default
                setAiAnswered(true); // Mark AI as answered
                setShowAIThinking(false); // Hide thinking indicator
                setShowAiMessage(true); // Show AI message bubble

                // Hide message after 5 seconds
                setTimeout(() => { if (isMounted.current) setShowAiMessage(false); }, 5000);
            }
        } catch (error) {
            console.error("Error getting AI answer:", error);
            // Use fallback simulation if API call fails
            if (isMounted.current) simulateAIAnswer();
        }
    }, [currentQuestion, shuffledAnswers, currentLanguage, difficulty, GATEWAY_URL, t, simulateAIAnswer]); // Dependencies

    /**
     * Saves the game statistics for the logged-in user.
     */
    const saveStats = useCallback(async () => {
        // Ensure required data is available and stats haven't been saved yet
        if (!loggedUsername || config === null || hasSavedStats.current) return;

        const playerWins = playerScore > aiScore; // Determine if player won
        hasSavedStats.current = true; // Prevent saving multiple times

        try {
            // Prepare statistics data object
            const statsData = {
                username: loggedUsername,
                // Calculate approximate right/wrong answers based on score (adjust if needed)
                rightAnswers: Math.round(playerScore / 10),
                wrongAnswers: config.numPreguntas - Math.round(playerScore / 10),
                score: playerScore,
                date: new Date().toISOString(), // Current date and time
                win: playerWins, // Did the player win?
                gameMode: "PlayerVsIA", // Game mode identifier
                difficulty: difficulty // Difficulty level played
            };

            // Send statistics to the gateway
            const response = await fetch(`${GATEWAY_URL}/savestats`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(statsData),
            });

            // Handle non-successful responses
            if (!response.ok) {
                throw new Error(`Failed to save stats: ${response.statusText}`);
            }
            console.log("Player vs AI statistics saved successfully.");
        } catch (error) {
            console.error("Error saving Player vs AI statistics:", error);
            hasSavedStats.current = false; // Allow retry if saving failed? Consider error handling strategy.
        }
    }, [loggedUsername, playerScore, aiScore, config, GATEWAY_URL, difficulty]); // Dependencies

    // --- Effects ---

    /**
     * Effect hook for component mount and unmount cleanup.
     * Sets the isMounted ref.
     */
    useEffect(() => {
        isMounted.current = true;
        // Cleanup function: clear timer and set mounted flag to false
        return () => {
            isMounted.current = false;
            clearInterval(timerRef.current);
        };
    }, []); // Empty dependency array: runs only on mount and unmount

    /**
     * Effect hook to load game configuration from localStorage on mount.
     */
    useEffect(() => {
        let storedConfig = {};
        try {
            const storedItem = localStorage.getItem("quizConfig");
            storedConfig = storedItem ? JSON.parse(storedItem) : {};
        } catch (error) {
            console.error("Error reading quizConfig from localStorage:", error);
        }
        // Default configuration values
        const defaultConfig = { numPreguntas: 10, tiempoPregunta: 30, limitePistas: 3, modoJuego: "playerVsIA", categories: ["all"], dificultad: "medium" };
        // Merge stored config with defaults
        const finalConfig = { ...defaultConfig, ...storedConfig };

        // Update state if component is mounted
        if (isMounted.current) {
            setConfig(finalConfig);
            setTimeLeft(finalConfig.tiempoPregunta); // Set initial time from config
            setDifficulty(finalConfig.dificultad); // Set difficulty from config
        }
    }, [t]); // Dependency: t (for default username translation if needed)

    /**
     * Effect hook to fetch questions from the API when the config is loaded.
     */
    useEffect(() => {
        if (config) { // Only run if config is loaded
            const fetchQuestions = async () => {
                // Check if categories are selected
                if (!config.categories || config.categories.length === 0) {
                    console.warn("No categories selected, cannot fetch questions.");
                    if (isMounted.current) setIsLoading(false);
                    return;
                }
                setIsLoading(true); // Set loading state
                try {
                    // Determine categories for query string
                    const categories = config.categories.includes("all") ? ["all"] : config.categories;
                    const queryString = `questionsDB?n=${config.numPreguntas}&topic=${categories.join(",")}`;
                    // Fetch questions from gateway
                    const response = await fetch(`${GATEWAY_URL}/${queryString}`);
                    if (!response.ok) throw new Error(`Failed to fetch questions: ${response.statusText}`);
                    const data = await response.json(); // Parse JSON response

                    // Update state if component is mounted
                    if (isMounted.current) {
                        if (data && data.length > 0) {
                            setQuestions(data); // Store fetched questions
                            setCurrentQuestion(data[0]); // Set the first question
                        } else {
                            console.error("No questions received from API.");
                            setQuestions([]); // Set empty array if no questions
                            setCurrentQuestion(null);
                        }
                    }
                } catch (error) {
                    console.error("Error fetching questions:", error);
                    // Reset state on error
                    if (isMounted.current) { setQuestions([]); setCurrentQuestion(null); }
                } finally {
                    // Reset loading state regardless of success or error
                    if (isMounted.current) setIsLoading(false);
                }
            };
            fetchQuestions();
        }
    }, [config, GATEWAY_URL]); // Dependencies: config, GATEWAY_URL

    /**
     * Effect hook to manage the question timer.
     * Stops when player answers or time runs out.
     */
    useEffect(() => {
        // Conditions to stop the timer: loading, no question, summary shown, config not loaded, OR PLAYER HAS ANSWERED
        if (isLoading || !currentQuestion || showSummary || !config || playerAnswered) {
            clearInterval(timerRef.current); // Clear interval if any condition is met
            return; // Stop the effect
        }

        // Handle timeout if time runs out
        if (timeLeft <= 0) {
            clearInterval(timerRef.current);
            handleTimeOut(); // Trigger timeout logic
            return; // Stop the effect
        }

        // Start or continue the timer interval
        clearInterval(timerRef.current); // Clear previous interval just in case
        timerRef.current = setInterval(() => {
            setTimeLeft((prev) => {
                const newTime = Math.max(prev - 1, 0); // Decrement time, minimum 0
                // Update progress bar based on remaining time
                setProgress((newTime / config.tiempoPregunta) * 100);
                return newTime;
            });
        }, 1000); // Run every second

        // Cleanup interval on effect re-run or component unmount
        return () => clearInterval(timerRef.current);

    }, [timeLeft, playerAnswered, isLoading, currentQuestion, config, showSummary, handleTimeOut]); // Dependencies

    /**
     * Effect hook to shuffle answers when the current question changes.
     */
    useEffect(() => {
        if (currentQuestion) {
            // Get correct and incorrect answers for the current language
            const correctAnswer = currentQuestion.respuestaCorrecta?.[currentLanguage];
            const incorrectAnswers = currentQuestion.respuestas?.[currentLanguage] || [];

            // Proceed only if there's a correct answer
            if (correctAnswer) {
                const allAnswers = [...incorrectAnswers, correctAnswer];
                // Fisher-Yates (Knuth) shuffle algorithm
                for (let i = allAnswers.length - 1; i > 0; i--) {
                    const j = Math.floor(Math.random() * (i + 1));
                    [allAnswers[i], allAnswers[j]] = [allAnswers[j], allAnswers[i]]; // Swap elements
                }
                // Update state if component is mounted
                if (isMounted.current) setShuffledAnswers(allAnswers);
            } else {
                // Handle missing correct answer
                if (isMounted.current) setShuffledAnswers([]);
            }
        } else {
            // Clear answers if there's no current question
            if (isMounted.current) setShuffledAnswers([]);
        }
    }, [currentQuestion, currentLanguage]); // Dependencies: currentQuestion, currentLanguage

    /**
     * Effect hook to trigger the AI's answer after the player has answered.
     */
    useEffect(() => {
        // Run only if player has answered, AI hasn't, there's a question, and component is mounted
        if (playerAnswered && !aiAnswered && currentQuestion && isMounted.current) {
            getAIAnswer(); // Call the function to get AI's answer
        }
    }, [playerAnswered, aiAnswered, currentQuestion, getAIAnswer]); // Dependencies

    /**
     * Effect hook to check if the game has ended (last question answered by both).
     * Saves stats and shows the summary dialog.
     */
    useEffect(() => {
        // Ensure config, questions are loaded, and it's the last question
        if (config && questions.length > 0 && questionNumber >= config.numPreguntas - 1) {
            // Trigger only once when both player and AI have answered on the last question
            // and stats haven't been saved yet, and summary isn't already shown
            if (playerAnswered && aiAnswered && !hasSavedStats.current && !showSummary) {
                saveStats(); // Save statistics
                // Show summary dialog if component is mounted
                if (isMounted.current) {
                    setShowSummary(true);
                }
            }
        }
    }, [playerAnswered, aiAnswered, questionNumber, questions.length, config, saveStats, showSummary]); // Dependencies: Keep aiAnswered

    // --- Event Handlers ---

    /**
     * Handles the player clicking an answer button.
     * Stops the timer, updates score/correctness, and marks player as answered.
     */
    const handlePlayerAnswer = useCallback((answer) => {
        // Prevent answering multiple times or if no question/config
        if (playerAnswered || !currentQuestion || !config) return;

        clearInterval(timerRef.current); // **** Stop timer immediately ****

        // Update state if component is mounted
        if (isMounted.current) {
            setSelectedAnswer(answer); // Store selected answer
            setPlayerAnswered(true); // Mark player as answered

            // Check if the selected answer is correct
            const isCorrect = answer === currentQuestion.respuestaCorrecta?.[currentLanguage];
            setPlayerCorrect(isCorrect); // Update player correctness state

            // Award points if correct
            if (isCorrect) {
                setPlayerScore(prev => prev + 10);
            }
            // AI answer is triggered by the useEffect watching playerAnswered state change
        }
    }, [playerAnswered, currentQuestion, config, currentLanguage]); // Dependencies

    /**
     * Handles moving to the next question.
     * Requires both player and AI to have answered.
     * Resets relevant state variables for the new question.
     */
    const handleNextQuestion = useCallback(() => {
        // --- RESTORED: Check for both player and AI answered ---
        if (!config || !questions.length || !playerAnswered || !aiAnswered) return;

        const nextQuestionIndex = questionNumber + 1;

        // Check if it was the last question
        if (nextQuestionIndex >= config.numPreguntas) {
            // Summary is shown by the useEffect checking game end state
            return;
        }

        // Proceed to the next question if data exists and component is mounted
        if (isMounted.current && questions[nextQuestionIndex]) {
            // Reset state for the next question
            setQuestionNumber(nextQuestionIndex);
            setCurrentQuestion(questions[nextQuestionIndex]);
            setPlayerAnswered(false); // Reset player answered flag
            setAiAnswered(false); // Reset AI answered flag
            setPlayerCorrect(null);
            setAiCorrect(null);
            setSelectedAnswer(null);
            setTimeLeft(config.tiempoPregunta); // Reset timer
            setProgress(100); // Reset progress bar
            setShowAIThinking(false); // Reset AI thinking state
            setShowAiMessage(false); // Reset AI message state
            setQuestionAnimationComplete(false); // Reset animation flag
        } else {
            console.error("Next question data is missing or component unmounted.");
            // Fallback to summary if next question data is missing unexpectedly
            if (isMounted.current && !hasSavedStats.current && !showSummary) {
                saveStats();
                setShowSummary(true);
            }
        }
        // --- RESTORED: aiAnswered dependency ---
    }, [questionNumber, config, questions, playerAnswered, aiAnswered, saveStats, showSummary]); // Dependencies

    /**
     * Formats the time remaining in MM:SS format.
     * @param {number} time - Time in seconds.
     * @returns {string} Formatted time string.
     */
    const formatTime = (time) => {
        const minutes = Math.floor(time / 60);
        const seconds = time % 60;
        return `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
    };

    // --- Render Logic ---

    // Display loading message while fetching questions
    if (isLoading) return <div className="loading-div"><h1>{t('loading')}</h1></div>;
    // Display error if no questions were loaded
    if (!isLoading && (!questions || questions.length === 0)) return <div className="loading-div"><h1>{t('errorNoQuestions', 'Error: No se cargaron preguntas.')}</h1></div>;
    // Display loading briefly if config/question isn't ready yet
    if (!currentQuestion || !config) return <div className="loading-div"><h1>{t('loading')}</h1></div>;

    // Determine summary message based on final scores
    let summaryTitle = t('finalResult');
    let summaryMessage;
    if (playerScore > aiScore) summaryMessage = t('youWon');
    else if (playerScore < aiScore) summaryMessage = t('youLost');
    else summaryMessage = t('tie');

    return (
        // Add specific class for potential CSS overrides
        <div className="gameContainer player-vs-ai">
            {/* Apply blur effect if rules or summary dialog is shown */}
            <main className={showRules || showSummary ? "blurred" : ""}>
                {/* Main 3-column layout */}
                <div className="game-layout">
                    {/* Left Column: Scoreboard & AI Robot */}
                    <div className="left-column">
                        {/* Combined Scoreboard */}
                        <div className="combined-scoreboard-left">
                            {/* AI Score Line */}
                            <div className="scoreboard-line">
                                <span className="ai-name">WI</span>
                                <span className="score">{aiScore}</span>
                                {/* AI Correct/Incorrect Indicator */}
                                {aiAnswered && aiCorrect !== null && (
                                    <span className={`answer-indicator ${aiCorrect ? "correct" : "incorrect"}`}>
                                        {aiCorrect ? "✓" : "✗"}
                                    </span>
                                )}
                            </div>
                            {/* Separator */}
                            <div className="scoreboard-line separator">-</div>
                            {/* Player Score Line */}
                            <div className="scoreboard-line player-line">
                                <span className="player-name">{loggedUsername}</span>
                                <span className="score">{playerScore}</span>
                                {/* Player Correct/Incorrect Indicator */}
                                {playerAnswered && playerCorrect !== null && (
                                    <span className={`answer-indicator ${playerCorrect ? "correct" : "incorrect"}`}>
                                        {playerCorrect ? "✓" : "✗"}
                                    </span>
                                )}
                            </div>
                        </div>
                        {/* AI Character Area */}
                        <div className="ai-character-container">
                            <div className="ai-robot">
                                <img src={ROBOT_IMAGE_PATH} alt={t('aiRobotAlt', 'AI Robot')} className="robot-image" />
                                {/* AI Thinking Bubble */}
                                {showAIThinking && (
                                    <div className="ai-thinking-bubble">
                                        <span>{t('thinking')}</span>
                                        <span className="thinking-dots">...</span>
                                    </div>
                                )}
                                {/* AI Speech Bubble (Animated) */}
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

                    {/* Center Column: Question, Image, Answers, Timer */}
                    <motion.div
                        className="center-column"
                        key={questionNumber} // Trigger animation on question change
                        initial={{ scale: 0.95, opacity: 0 }} // Initial animation state
                        animate={{ scale: 1, opacity: 1 }} // Final animation state
                        transition={{ duration: 0.4, type: "spring", stiffness: 120 }} // Animation properties
                        onAnimationComplete={() => setQuestionAnimationComplete(true)} // Optional callback
                    >
                        {/* Question Text Section */}
                        <div className="question-section">
                            {/* Container for Counter and Next Button */}
                            <div className="questionNumber">
                                {/* Question Counter (H2) - Placed first */}
                                <h2>{`${t('question')} ${questionNumber + 1}/${config.numPreguntas}`}</h2>

                                {/* Next Button (ArrowForwardIcon) - Placed second */}
                                {/* Render always except on last question */}
                                {questionNumber < config.numPreguntas - 1 && (
                                    <ArrowForwardIcon
                                        titleAccess={t("nextQuestion")} // Accessibility title
                                        fontSize="medium"
                                        id="nextArrow" // ID for potential specific styling
                                        // onClick enabled only when both have answered
                                        onClick={(playerAnswered && aiAnswered) ? handleNextQuestion : undefined}
                                        // --- Apply inline style for dynamic background/state ---
                                        style={{
                                            // Use #ccc when disabled (playerAnswered && aiAnswered is false)
                                            backgroundColor: (playerAnswered && aiAnswered) ? 'var(--color-primario)' : '#ccc',
                                            color: 'white', // Icon color is always white
                                            borderRadius: '50%',
                                            padding: '0.4em', // Adjusted padding slightly
                                            // Cursor and opacity depend on enabled state
                                            cursor: (playerAnswered && aiAnswered) ? "pointer" : "not-allowed",
                                            opacity: (playerAnswered && aiAnswered) ? 1 : 0.6, // Use 0.6 for disabled opacity
                                            // Transition for smooth color/opacity change
                                            transition: 'background-color 0.3s ease, opacity 0.3s ease, transform 0.2s ease', // Added transform transition
                                            // Ensure flex alignment if needed by parent (though parent handles centering)
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            // Add hover effect directly here (will apply regardless of disabled state, but visually less obvious when disabled)
                                            // A better approach for conditional hover is CSS classes, but sticking to inline as requested
                                            // Consider adding a simple scale on hover for enabled state if desired
                                            transform: (playerAnswered && aiAnswered) ? 'scale(1)' : 'scale(1)', // Base scale
                                        }}
                                        // Add mouseEnter/Leave for dynamic hover effect if needed (more complex)
                                        // onMouseEnter={(e) => { if (playerAnswered && aiAnswered) e.currentTarget.style.transform = 'scale(1.1)'; }}
                                        // onMouseLeave={(e) => { e.currentTarget.style.transform = 'scale(1)'; }}
                                    />
                                )}
                            </div>
                            {/* Main Question Text (H1) */}
                            <h1>{currentQuestion.pregunta?.[currentLanguage] || t('loading')}</h1>
                        </div>

                        {/* Optional Image Display */}
                        {currentQuestion.img?.[0] && (
                            <div className="question-image">
                                <img
                                    src={currentQuestion.img[0]}
                                    alt={t('questionImageAlt', { question: currentQuestion.pregunta?.[currentLanguage] })} // Dynamic alt text
                                    onError={(e) => e.target.style.display='none'} // Hide image if loading fails
                                />
                            </div>
                        )}

                        {/* Answer Buttons Panel */}
                        <div className="answerPanel">
                            {shuffledAnswers.map((respuesta, index) => (
                                <BaseButton
                                    key={index}
                                    text={respuesta}
                                    onClick={() => handlePlayerAnswer(respuesta)}
                                    // Dynamically set button style based on answer state
                                    buttonType={
                                        playerAnswered
                                            ? respuesta === currentQuestion.respuestaCorrecta?.[currentLanguage]
                                                ? "buttonCorrect" // Correct answer
                                                : selectedAnswer === respuesta
                                                    ? "buttonIncorrect" // Player's incorrect choice
                                                    : "buttonDisabled" // Other incorrect options
                                            : "buttonPrimary" // Default state before answering
                                    }
                                    disabled={playerAnswered} // Disable buttons after player answers
                                />
                            ))}
                        </div>

                        {/* Timer and Progress Bar Section */}
                        <div className="timer-section">
                            <Box display="flex" alignItems="center" width="100%" gap={1}>
                                <span>{t('time')}</span> {/* Time label */}
                                <Box width="100%" sx={{ mx: 1 }}> {/* MUI Box for layout */}
                                    <LinearProgress id="progressBar" variant="determinate" value={progress} /> {/* Progress bar */}
                                </Box>
                                <span>{formatTime(timeLeft)}</span> {/* Formatted time remaining */}
                            </Box>
                        </div>
                    </motion.div>

                    {/* Right Column: Rules Button */}
                    <div className="right-column">
                        <div className="rules-points-section">
                            {/* Button to open the rules dialog */}
                            <BaseButton
                                text={t('rules')}
                                buttonType="buttonSecondary"
                                onClick={() => setShowRules(true)}
                            />
                        </div>
                    </div>
                </div>
            </main>

            {/* Rules Dialog (Overlay) */}
            {showRules && (
                <div className="overlay">
                    <div className="dialogGameRulesContainer">
                        {/* InfoDialog component displays the rules */}
                        <InfoDialog
                            title={t("gameRules")} // Dialog title
                            content={
                                <ol> {/* Rules list */}
                                    <li>{t('vsAIRule1')}</li>
                                    <li>{t('vsAIRule2')}</li>
                                    <li>{t('vsAIRule3')}</li>
                                </ol>
                            }
                            onClose={() => setShowRules(false)} // Close button action
                        />
                    </div>
                </div>
            )}

            {/* Summary Dialog (Overlay) */}
            {showSummary && (
                <div className="overlay">
                    <div className="dialogGameRulesContainer">
                        {/* InfoDialog component displays the summary */}
                        <InfoDialog
                            title={summaryTitle} // Dynamic title (Win/Lose/Tie)
                            content={
                                <div className="summaryContent"> {/* Summary details */}
                                    <h3>{summaryMessage}</h3> {/* Win/Lose/Tie message */}
                                    <p>{t('yourScore')} {playerScore}</p> {/* Player's final score */}
                                    <p>{t('aiScoreLabel')} {aiScore}</p> {/* AI's final score */}
                                </div>
                            }
                            onClose={() => { // Action when closing the summary
                                setShowSummary(false); // Hide the dialog
                                // Call the onGameEnd callback passed as a prop (e.g., to navigate away)
                                if (onGameEnd) onGameEnd();
                                else {
                                    // Fallback if the prop is not provided
                                    console.warn("onGameEnd prop not provided. Reloading.");
                                    window.location.reload(); // Simple fallback: reload the page
                                }
                            }}
                        />
                    </div>
                </div>
            )}
        </div>
    );
};

export default PlayerVsAIGame; // Export the component

