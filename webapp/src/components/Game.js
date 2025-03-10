import React, { useState } from "react";
import "./GameStyles.css";

function Game() {
    const [round, setRound] = useState(1);
    const totalRounds = 10;

    return (
        <div className="app-container">
            {/* Top Bar */}
            <div className="top-bar">
                <button className="btn logo">LOGO</button>
                <div className="top-right">
                    <button className="btn">Coins 🪙</button>
                    <button className="btn">Score</button>
                </div>
            </div>

            {/* Main Content */}
            <div className="main-content">
                {/* Left Side */}
                <div className="left-side">
                    <div className="help-section"></div>
                    <div className="help-buttons">
                        <button className="btn help">50/50 - 100 🪙</button>
                        <button className="btn help">Call a Friend - 150 🪙</button>
                        <button className="btn help">Use the Chat - 200 🪙</button>
                    </div>
                </div>

                {/* Game Area */}
                <div className="game-area">
                    <h2 className="round-info">
                        Round {round}/{totalRounds}
                    </h2>
                    <div className="image-container">
                        <img src={"paris.jpg"} alt="Paris" className="game-image" />
                    </div>
                    <div className="options-grid">
                        <button className="btn option">Option A</button>
                        <button className="btn option">Option B</button>
                        <button className="btn option">Option C</button>
                        <button className="btn option">Option D</button>
                    </div>
                </div>

                {/* Right Side (Chat) */}
                <div className="chat-container">
                    <div className="chat-box">
                        <div className="chat-title">CHAT</div>
                        <div className="chat-messages">
                            <div className="chat-bubble">...</div>
                            <div className="chat-bubble">...</div>
                            <div className="chat-bubble">...</div>
                        </div>
                        <button className="btn chat-input">WRITE HERE</button>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default Game;
