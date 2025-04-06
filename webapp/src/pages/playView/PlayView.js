import React, { useState } from "react";
import Nav from "../../components/nav/Nav";
import Footer from "../../components/Footer";
import Settings from "../../components/gameSettings/GameSettings";
import Game from "../../components/game/Game";
import './PlayView.css';

const PlayView = () => {
  const [gameStarted, setGameStarted] = useState(false);

  const startGame = () => {
    setGameStarted(true);
  };

  return (
    <div className='play-view-main-container'>
      <Nav />
      <div className="play-view-game-content">
      {!gameStarted ? (
        <Settings onStartGame = {startGame}/>
      ) : (
        <Game />
      )}
      </div>
      <Footer></Footer>
    </div>
  );
};

export default PlayView;
