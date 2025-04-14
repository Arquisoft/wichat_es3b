import React from "react";
import "./App.css";
import AuthForm from "./pages/authForm/AuthForm";
import Home from "./pages/home/Home.js";
import PerfilPage from "./pages/profilePage/PerfilPage.js";
import { Route, Routes } from "react-router-dom";
import PlayView from "./pages/playView/PlayView.js";
import PrivateRoute from "./components/routes/PrivateRoute.js";
import Ranking from './pages/ranking/Ranking.js'

function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/auth" element={<AuthForm />} />

      <Route
        path="/play"
        element={
          <PrivateRoute>
            <PlayView />
          </PrivateRoute>
        }
      />
      <Route
        path="/profile/"
        element={
          <PrivateRoute>
            <PerfilPage />
          </PrivateRoute>
        }
      />
      <Route
        path="/stats/:username"
        element={
            <PerfilPage />
        }
      />
      <Route path="/home" element={<Home />} />
      <Route path="/ranking" element={<Ranking/>} />
    </Routes>
  );
}

export default App;
