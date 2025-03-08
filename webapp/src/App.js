import React from "react";
import "./App.css";
import AuthForm from "./pages/authForm/AuthForm";
import Home from "./pages/home/Home.js";
import { Route, Routes } from "react-router-dom";

function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} /> {/* Página principal */}
      <Route path="/auth" element={<AuthForm />} />
      {/* Otras rutas que puedas tener */}
    </Routes>
  );
}

export default App;
