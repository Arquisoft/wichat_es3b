import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route } from 'react-router';
import reportWebVitals from './reportWebVitals';
import styles from './App.css';

import App from './App';
import Login from './components/Login';
import Signup from './components/AddUser';
import GameModeSelection from './components/GameModeSelection';
import Game from './components/Game';

console.log(styles);

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <BrowserRouter>
    <Routes>
      <Route element={<App />} >
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
      </Route>
      <Route path="/gamemode" element={<GameModeSelection />} />
      <Route path="/game" element={<Game />} />
    </Routes>
  </BrowserRouter>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
