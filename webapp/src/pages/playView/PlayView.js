import React, { useState, useEffect } from "react";
import Nav from "../../components/nav/Nav";
import Footer from "../../components/Footer";
import Settings from "../../components/gameSettings/GameSettings";
import Game from "../../components/game/Game";
import PlayerVsAIGame from "../../components/playerVsAIGame/PlayerVsAIGame";
import './PlayView.css';

const PlayView = () => {
    const [gameStarted, setGameStarted] = useState(false);
    const [gameMode, setGameMode] = useState(null);

    // Load game mode from localStorage config when component mounts
    useEffect(() => {
        const loadGameConfig = () => {
            const storedConfig = JSON.parse(localStorage.getItem("quizConfig"));
            if (storedConfig && storedConfig.modoJuego) {
                setGameMode(storedConfig.modoJuego);
            } else {
                // Default to single player if no config found
                setGameMode("singleplayer");
            }
        };
        loadGameConfig();
    }, []);

    const startGame = () => {
        // Before starting the game, refresh the game mode from localStorage
        // in case it was changed in the settings
        const storedConfig = JSON.parse(localStorage.getItem("quizConfig"));
        if (storedConfig && storedConfig.modoJuego) {
            setGameMode(storedConfig.modoJuego);
        }
        setGameStarted(true);
    };

    // Determine which game component to render based on game mode
    const renderGameComponent = () => {
        switch (gameMode) {
            case "playerVsIA":
                return <PlayerVsAIGame />;
            case "singleplayer":
            default:
                return <Game />;
        }
    };

    return (
        <div className='play-view-main-container'>
            <Nav />
            <div className="play-view-game-content">
                {!gameStarted ? (
                    <Settings onStartGame={startGame} />
                ) : (
                    renderGameComponent()
                )}
            </div>
            <Footer />
        </div>
    );
};

export default PlayView;