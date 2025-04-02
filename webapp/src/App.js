import React from "react";
import "./App.css";
import AuthForm from "./pages/authForm/AuthForm";
import Home from "./pages/home/Home.js";
import PerfilPage from "./pages/profilePage/PerfilPage.js";
import { Route, Routes } from "react-router-dom";
import Game from "./pages/game/Game.js";
import PrivateRoute from "./components/routes/PrivateRoute.js";
import Settings from "./pages/settings/Settings.js";

function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/auth" element={<AuthForm />} />

      <Route
        path="/play"
        element={
          <PrivateRoute>
            <Game />
          </PrivateRoute>
        }
      />
      <Route
        path="/profile"
        element={
          <PrivateRoute>
            <PerfilPage />
          </PrivateRoute>
        }
      />
      <Route
        path="/settings"
        element={
            <Settings />
        }
      />
      <Route path="/home" element={<Home />} />
    </Routes>
  );
}

export default App;
