"use client"

import React, { useState, useEffect, useRef } from "react";
import "./PlayerVsAIGame.css";
import BaseButton from "../button/BaseButton";
import InfoDialog from "../infoDialog/InfoDialog";
import { LinearProgress, Box } from "@mui/material";
import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";

const PlayerVsAIGame = () => {
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
    const [questionAnimationComplete, setQuestionAnimationComplete] = useState(false);
    const timerRef = useRef(null);
    const [difficulty, setDifficulty] = useState("medium"); // Nueva variable para la dificultad

    const GATEWAY_URL = process.env.REACT_APP_GATEWAY_SERVICE_URL || "http://localhost:8000";
    const loggedUsername = localStorage.getItem("username");
    const [config, setConfig] = useState(null);

    // Load configuration from localStorage
    useEffect(() => {
        const storedConfig = JSON.parse(localStorage.getItem("quizConfig"));
        if (storedConfig) {
            console.log("Configuración cargada desde localStorage:", storedConfig);
            const finalConfig = {
                numPreguntas: storedConfig.numPreguntas ?? 10,
                tiempoPregunta: storedConfig.tiempoPregunta ?? 30,
                limitePistas: storedConfig.limitePistas ?? 3,
                modoJuego: storedConfig.modoJuego ?? "Jugador vs IA",
                categories: storedConfig.categories?.length ? storedConfig.categories : ["all"],
                dificultad: storedConfig.dificultad ?? "medium" // Añadida la dificultad
            };
            setConfig(finalConfig);
            setTimeLeft(finalConfig.tiempoPregunta);
            setDifficulty(finalConfig.dificultad); // Inicializar la dificultad
        } else {
            console.warn("No se encontró configuración en localStorage");
            setConfig({
                numPreguntas: 10,
                tiempoPregunta: 30,
                limitePistas: 3,
                modoJuego: "Jugador vs IA",
                categories: ["all"],
                dificultad: "medium" // Valor predeterminado
            });
        }
    }, []);

    const TOTAL_TIME = config?.tiempoPregunta || 30;

    // Fetch questions when config is loaded
    useEffect(() => {
        if (config) {
            const fetchQuestions = async () => {
                if (!config.categories || config.categories.length === 0) {
                    console.warn("No hay categorías seleccionadas, no se pueden obtener preguntas.");
                    return;
                }
                try {
                    console.log("Solicitando preguntas con categorías:", config.categories);
                    const categories = config.categories.includes("all") ? ["all"] : config.categories;
                    const queryString = `questions?n=${config.numPreguntas}&topic=${categories.join(",")}`;
                    console.log("URL de la solicitud al gateway:", `${GATEWAY_URL}/${queryString}`);
                    const response = await fetch(`${GATEWAY_URL}/${queryString}`);
                    if (!response.ok) {
                        throw new Error("No se pudieron obtener las preguntas.");
                    }
                    const data = await response.json();
                    setQuestions(data);
                    setCurrentQuestion(data[questionNumber]);
                    setTimeLeft(config.tiempoPregunta);
                    setIsLoading(false);
                } catch (error) {
                    setIsLoading(false);
                }
            };
            fetchQuestions();
        }
    }, [config]);

    // Timer effect
    useEffect(() => {
        if (timeLeft <= 0 && !playerAnswered) {
            clearInterval(timerRef.current);
            handleTimeOut();
            return;
        }

        if (playerAnswered && aiAnswered) {
            clearInterval(timerRef.current);
            return;
        }

        timerRef.current = setInterval(() => {
            setTimeLeft((prev) => Math.max(prev - 1, 0));
        }, 1000);

        return () => clearInterval(timerRef.current);
    }, [timeLeft, playerAnswered, aiAnswered]);

    useEffect(() => {
        setProgress((timeLeft / TOTAL_TIME) * 100);
    }, [timeLeft, TOTAL_TIME]);

    // Shuffle answers when current question changes
    useEffect(() => {
        if (currentQuestion) {
            const allAnswers = [
                ...currentQuestion.respuestas[currentLanguage],
                currentQuestion.respuestaCorrecta[currentLanguage],
            ];
            const shuffled = allAnswers.sort(() => Math.random() - 0.5);
            setShuffledAnswers(shuffled);
        }
    }, [currentQuestion, currentLanguage]);

    // Handle AI answer using LLM service
    useEffect(() => {
        if (playerAnswered && !aiAnswered && currentQuestion) {
            // Show AI thinking animation
            setShowAIThinking(true);

            // Generate AI answer using LLM service
            getAIAnswer();
        }
    }, [playerAnswered, currentQuestion]);

    const getAIAnswer = async () => {
        try {
            // Prepare the data for the LLM service
            const aiAnswerData = {
                question: {
                    pregunta: currentQuestion.pregunta,
                    respuestaCorrecta: currentQuestion.respuestaCorrecta,
                    respuestas: currentQuestion.respuestas,
                    descripcion: currentQuestion.descripcion,
                    img: currentQuestion.img
                },
                options: shuffledAnswers,
                idioma: currentLanguage,
                difficulty: difficulty // Enviar la dificultad al servicio LLM
            };

            // Send request to the LLM service
            const response = await fetch(`${GATEWAY_URL}/ai-answer`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(aiAnswerData),
            });

            if (!response.ok) {
                throw new Error("Error al obtener respuesta de la IA");
            }

            const data = await response.json();

            // Determine if AI got the correct answer
            const aiCorrect = data.isCorrect;
            setAiCorrect(aiCorrect);

            // Obtener el mensaje personalizado del LLM si está disponible
            if (data.message) {
                setAiMessage(data.message);
            } else {
                // Generamos un mensaje personalizado basado en el resultado
                const messageData = {
                    result: aiCorrect ? "correct" : "incorrect",
                    question: currentQuestion.pregunta[currentLanguage],
                    idioma: currentLanguage,
                    difficulty: difficulty
                };

                try {
                    const messageResponse = await fetch(`${GATEWAY_URL}/ai-message`, {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json",
                        },
                        body: JSON.stringify(messageData),
                    });

                    if (messageResponse.ok) {
                        const messageResult = await messageResponse.json();
                        setAiMessage(messageResult.message);
                    } else {
                        throw new Error("Error al obtener mensaje de la IA");
                    }
                } catch (error) {
                    console.error("Error al obtener mensaje personalizado:", error);
                    // Fallback a mensajes predefinidos
                    setAiMessage(aiCorrect ?
                        "¡Lo logré! Acerté esta pregunta." :
                        "Vaya, parece que he fallado esta vez.");
                }
            }

            // Update AI score - solo si es correcta
            if (aiCorrect) {
                setAiScore(prev => prev + 10);
            }

            // Show AI response
            setAiAnswered(true);
            setShowAIThinking(false);
            setShowAiMessage(true);

            // Hide AI message after 8 seconds (aumentado de 5 a 8)
            setTimeout(() => {
                setShowAiMessage(false);
            }, 8000);

        } catch (error) {
            console.error("Error al procesar respuesta de la IA:", error);
            // Fallback to simulated answer if the service fails
            simulateAIAnswer();
        }
    };

    // Fallback function in case the LLM service fails
    const simulateAIAnswer = () => {
        // AI difficulty - ajustable según el nivel de dificultad
        let aiDifficulty;

        switch(difficulty) {
            case "easy":
                aiDifficulty = 0.5; // 50% de probabilidad en fácil
                break;
            case "hard":
                aiDifficulty = 0.9; // 90% de probabilidad en difícil
                break;
            case "medium":
            default:
                aiDifficulty = 0.75; // 75% de probabilidad en medio (predeterminado)
        }

        const isCorrect = Math.random() < aiDifficulty;
        setAiCorrect(isCorrect);
        setAiAnswered(true);
        setShowAIThinking(false);

        if (isCorrect) {
            setAiScore(prev => prev + 10);
            setAiMessage("¡Bien! He acertado esta pregunta.");
        } else {
            setAiMessage("Vaya, parece que he fallado esta vez.");
        }

        setShowAiMessage(true);
        setTimeout(() => {
            setShowAiMessage(false);
        }, 8000); // Aumentado a 8 segundos
    };

    const handlePlayerAnswer = (answer) => {
        if (playerAnswered) return;

        clearInterval(timerRef.current);
        setSelectedAnswer(answer);
        setPlayerAnswered(true);

        const isCorrect = answer === currentQuestion.respuestaCorrecta[currentLanguage];
        setPlayerCorrect(isCorrect);

        if (isCorrect) {
            setPlayerScore(prev => prev + 10);
        }
    };

    const handleTimeOut = () => {
        setPlayerAnswered(true);
        setPlayerCorrect(false);
        // Ya no es necesario llamar aquí a getAIAnswer ya que se activará por el efecto
        // que observa playerAnswered
    };

    const handleNextQuestion = () => {
        if (questionNumber + 1 >= config?.numPreguntas) {
            setShowSummary(true);
            return;
        }

        setQuestionNumber(prev => prev + 1);
        setCurrentQuestion(questions[questionNumber + 1]);
        setPlayerAnswered(false);
        setAiAnswered(false);
        setPlayerCorrect(null);
        setAiCorrect(null);
        setSelectedAnswer(null);
        setTimeLeft(TOTAL_TIME);
        setProgress(100);
        setShowAIThinking(false);
        setShowAiMessage(false);
        setQuestionAnimationComplete(false);
    };

    const formatTime = (time) => {
        const minutes = Math.floor(time / 60);
        const seconds = time % 60;
        return `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
    };

    const saveStats = async () => {
        try {
            const statsData = {
                username: loggedUsername,
                rightAnswers: playerCorrect ? 1 : 0,
                wrongAnswers: playerCorrect ? 0 : 1,
                time: TOTAL_TIME - timeLeft,
                score: playerScore,
                date: new Date().toISOString(),
                win: playerScore > aiScore,
            };
            const response = await fetch(`${GATEWAY_URL}/savestats`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(statsData),
            });

            if (!response.ok) {
                throw new Error();
            }

            const data = await response.json();
            console.log("Estadísticas guardadas", data);
        } catch (error) {
            console.error("Error al guardar estadísticas: ", error);
        }
    };

    useEffect(() => {
        return () => {
            clearInterval(timerRef.current);
        };
    }, []);

    if (isLoading) {
        return <div className="loading-div"><h1>{t('loading')}</h1></div>;
    }

    return (
        <div className="gameContainer">
            <main className={showRules ? "blurred" : ""}>
                <div className="game-layout">
                    <div className="left-column">
                        <div className="ai-character-container">
                            <div className="ai-robot">
                                <img src="/webapp/src/assets/img/FriendlyRobotThinking.png" alt="AI Robot" className="robot-image" />
                                {showAIThinking && (
                                    <div className="ai-thinking-bubble">
                                        <span>Pensando</span>
                                        <span className="thinking-dots">...</span>
                                    </div>
                                )}
                                {showAiMessage && (
                                    <div className="ai-speech-bubble">
                                        <p>{aiMessage}</p>
                                    </div>
                                )}
                            </div>
                            <div className="ai-score-display">
                                <h3>IA</h3>
                                <div className="score-value">{aiScore}</div>
                                {aiAnswered && (
                                    <div className={`answer-indicator ${aiCorrect ? "correct" : "incorrect"}`}>
                                        {aiCorrect ? "✓" : "✗"}
                                    </div>
                                )}
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
                                <h2>{`${t('question')} ${questionNumber + 1}/${config.numPreguntas}`}</h2>
                                <ArrowForwardIcon
                                    titleAccess="Siguiente pregunta"
                                    fontSize="1.5em"
                                    id="nextArrow"
                                    onClick={(playerAnswered && aiAnswered) ? handleNextQuestion : null}
                                    style={{
                                        color: (playerAnswered && aiAnswered) ? "white" : "gray",
                                        cursor: (playerAnswered && aiAnswered) ? "pointer" : "not-allowed",
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
                            {shuffledAnswers.map((respuesta, index) => (
                                <BaseButton
                                    key={index}
                                    text={respuesta}
                                    onClick={() => handlePlayerAnswer(respuesta)}
                                    buttonType={
                                        playerAnswered
                                            ? respuesta === currentQuestion.respuestaCorrecta[currentLanguage]
                                                ? "buttonCorrect"
                                                : selectedAnswer === respuesta
                                                    ? "buttonIncorrect"
                                                    : "buttonPrimary"
                                            : "buttonPrimary"
                                    }
                                    disabled={playerAnswered}
                                />
                            ))}
                        </div>

                        <div className="timer-section">
                            <Box display="flex" alignItems="center" width="100%" gap={2}>
                                <span>{t('time')}</span>
                                <Box width="100%" position="relative">
                                    <LinearProgress id="progressBar" variant="determinate" value={progress} />
                                </Box>
                                <span>{formatTime(timeLeft)}</span>
                            </Box>
                        </div>
                    </motion.div>

                    <div className="right-column">
                        <div className="player-score-container">
                            <div className="player-score">
                                <h3>{loggedUsername || "Jugador"}</h3>
                                <div className="score-value">{playerScore}</div>
                                {playerAnswered && (
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

            {showRules && (
                <div className="overlay">
                    <div className="dialogGameRulesContainer">
                        <InfoDialog
                            title={t("gameRules")}
                            content={
                                <ol>
                                    <li>{t('vsAIRule1', 'Compite contra la IA para responder correctamente')}</li>
                                    <li>{t('vsAIRule2', 'Gana puntos por cada respuesta correcta')}</li>
                                    <li>{t('vsAIRule3', 'El jugador con más puntos al final gana')}</li>
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
                            title="Resultado final"
                            content={
                                <div className="summaryContent">
                                    <h3>¡{playerScore > aiScore ? 'Has ganado!' : playerScore === aiScore ? 'Empate!' : 'Has perdido!'}</h3>
                                    <p>Tu puntuación: {playerScore}</p>
                                    <p>Puntuación IA: {aiScore}</p>
                                </div>
                            }
                            onClose={() => {
                                saveStats();
                                window.location.reload();
                            }}
                        />
                    </div>
                </div>
            )}
        </div>
    );
};

export default PlayerVsAIGame;