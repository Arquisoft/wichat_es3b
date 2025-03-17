import React, { useEffect, useState } from "react";
import "./GameStyles.css";
import Chat from './LLMChat/LLMChat';
import axios from "axios";


const apiEndpoint = process.env.REACT_APP_API_ENDPOINT || 'http://localhost:8000';

function Game() {
    const [round, setRound] = useState(1);
    const totalRounds = 10;
    const [roundData, setRoundData] = useState(null);
    const [score, setScore] = useState(0);

    //Function to load the data for each round.
    const loadRound = async () => {
        try {
            const response = await axios.get(`${apiEndpoint}/getRound`);
            console.log("Get Round");
            console.log(response.data);
            return response.data;
        }catch (error) {
            console.error('Error fetching data from question service:', error);
        }
    }

    const gameSetup = async () => {
        try{
        //Loads the questions from wikidata into the database
        await axios.post(`${apiEndpoint}/loadQuestion`);
        //First round
        const data =  await loadRound();
        setRoundData(data);
        }catch (error) {
            console.error('Error fetching data from question service:', error);
        }
    }

    useEffect(() => {
        gameSetup();
    }, []);

    
    const handleOptionSelect = async (index) => {
        CorrectOption(index)? setScore(score+50): setScore(score);

        if(round === totalRounds) {
            alert('Game Over');
            setRoundData(null);
            setRound(1);
            setScore(0);
            return;
        }

        setRound(round+1);
        setRoundData(null);

        try{
        const data =  await loadRound();
        setRoundData(data);
        } catch (error) {
            console.error('Error loading new round', error);
        }
    }

    const CorrectOption = (index) => {
        let selectedName = roundData.cities[index].name;
        let correctName = roundData.cityWithImage.name;
        return selectedName === correctName;
    }
    
    return (
        <div className="app-container">
            {/* Top Bar */}
            <div className="top-bar">
                <button className="btn logo">LOGO</button>
                <div className="top-right">
                    <button className="btn">Coins 🪙</button>
                    <button className="btn">Score: {score}</button>
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
                {roundData && (
                    <div className="game-area">
                        <h2 className="round-info">
                            Round {round}/{totalRounds}
                        </h2>
                        <div className="image-container">
                            <img src={roundData.cityWithImage.imageUrl} alt={roundData.cityWithImage.imageAltText} className="game-image" />
                        </div>
                        <div className="options-grid">
                            {roundData.cities.map((city, index) => (
                                <button key={index} className="btn option" onClick={() => handleOptionSelect(index)}>{city.name}</button>
                            ))}
                        </div>
                    </div>
                )}

                {/* Right Side (Chat) */}
                <div className="chat-container">
                    <div className="chat-box">
                        {
                            <Chat />
                        }
                    </div>
                </div>
            </div>
        </div>
    );
}

export default Game;