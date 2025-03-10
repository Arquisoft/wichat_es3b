import React from "react";
import "./App.css";
import AuthForm from "./pages/authForm/AuthForm";
import Home from "./pages/home/Home.js";
import { Route, Routes } from "react-router-dom";
import Game from "./pages/game/Game.js";

function App() {
    return (
        <Routes>
            <Route path="/" element={<Home />} /> {/* Página principal */}
            <Route path="/auth" element={<AuthForm />} />
            <Route path="/play" element={<Game />} />
            <Route path="/home" element={<Home />} />
        </Routes>
    );
}

export default App;
