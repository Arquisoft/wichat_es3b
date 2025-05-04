import React, { useState, useEffect, useCallback } from "react";
import Nav from "../../components/nav/Nav";
import Footer from "../../components/Footer";
import Settings from "../../components/gameSettings/GameSettings";
import Game from "../../components/game/Game"; // Single Player Game
import PlayerVsAIGame from "../../components/playerVsAIGame/PlayerVsAIGame"; // Player vs AI Game
import './PlayView.css';

const PlayView = () => {
    const [gameStarted, setGameStarted] = useState(false);
    const [gameMode, setGameMode] = useState("singleplayer"); // Default game mode
    const [gameKey, setGameKey] = useState(0); // Key to force re-mount of game component

    // Load game mode from localStorage config when component mounts
    useEffect(() => {
        const loadGameConfig = () => {
            try {
                const storedConfig = JSON.parse(localStorage.getItem("quizConfig"));
                if (storedConfig && storedConfig.modoJuego) {
                    setGameMode(storedConfig.modoJuego);
                }
                // If no config or modoJuego, it keeps the default "singleplayer"
            } catch (error) {
                console.error("Error reading quizConfig from localStorage:", error);
                // Keep default gameMode if localStorage is corrupted
            }
        };
        loadGameConfig();
    }, []); // Run only on mount

    // Function to start the game
    const startGame = useCallback(() => {
        // Refresh the game mode from localStorage before starting
        try {
            const storedConfig = JSON.parse(localStorage.getItem("quizConfig"));
            if (storedConfig && storedConfig.modoJuego) {
                setGameMode(storedConfig.modoJuego);
            } else {
                setGameMode("singleplayer"); // Fallback to default if missing again
            }
        } catch (error) {
            console.error("Error reading quizConfig from localStorage:", error);
            setGameMode("singleplayer"); // Fallback on error
        }
        setGameStarted(true);
    }, []); // No dependencies, reads localStorage directly

    // Function to handle game end - passed to game components
    const handleGameEnd = useCallback(() => {
        setGameStarted(false); // Go back to settings view
        setGameKey(prevKey => prevKey + 1); // Change key to reset game component state on next start
    }, []); // No dependencies needed

    // Determine which game component to render based on game mode
    const renderGameComponent = () => {
        const gameProps = {
            key: gameKey, // Use the key to force re-mount
            onGameEnd: handleGameEnd, // Pass the callback function
        };

        switch (gameMode) {
            case "playerVsIA":
                return <PlayerVsAIGame {...gameProps} />;
            case "singleplayer":
            default:
                return <Game {...gameProps} />; // Pass props to Game component as well
        }
    };

    return (
        // Main container for the play view
        <div className='play-view-main-container'>
            {/* Navigation Bar */}
            <Nav />
            {/* Content area for settings or game */}
            <div className="play-view-game-content">
                {!gameStarted ? (
                    // Show Settings component if game hasn't started
                    <Settings onStartGame={startGame} />
                ) : (
                    // Render the appropriate game component if game has started
                    renderGameComponent()
                )}
            </div>
            {/* Footer */}
            <Footer />
        </div>
    );
};

export default PlayView;
