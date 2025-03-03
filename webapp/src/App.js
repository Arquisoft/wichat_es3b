import React from "react";
import "./App.css";
import AuthForm from "./pages/authForm/AuthForm";
import Home from "./pages/Home.js"
import {Route, Routes} from "react-router-dom";
import Login from "./components/login/Login";
import AddUser from "./components/addUser/AddUser";

function App() {
  return <Routes>
    <Route path="/" element={<Home />} />  {/* Página principal */}
    <Route path="/login" element={<Login />} />
    <Route path="/signup" element={<AddUser />} />
    {/* Otras rutas que puedas tener */}
  </Routes>
}

export default App;
