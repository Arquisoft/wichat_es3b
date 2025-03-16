import React from "react";
import "./App.css";
import AuthForm from "./pages/authForm/AuthForm";
import Home from "./pages/home/Home.js";
import { Route, Routes } from "react-router-dom";
import Game from "./pages/game/Game.js";
import PrivateRoute from "./components/routes/PrivateRoute.js"; // Importar el componente

function App() {
    return (
        <Routes>
            <Route path="/" element={<Home />} /> {/* Página principal */}
            <Route path="/auth" element={<AuthForm />} />

            {/* Ruta protegida para Play */}
            <Route path="/play" element={
                <PrivateRoute>
                    <Game />
                </PrivateRoute>
            } />

            <Route path="/home" element={<Home />} />
        </Routes>
    );
}

export default App;
