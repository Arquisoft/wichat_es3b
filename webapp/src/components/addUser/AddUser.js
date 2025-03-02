// src/components/Login.js
import React, { useState } from "react";
import axios from "axios";
import { Snackbar } from "@mui/material";
import BaseButton from "../button/BaseButton";
import WiChatTextField from "../textField/WiChatTextField";
import PhotoPanel from "../photoPanel/PhotoPanel";
import "../login/Login.css";
import "../../assets/global.css";
import logo from "../../assets/img/logo_base.png";

const apiEndpoint =
  process.env.REACT_APP_API_ENDPOINT || "http://localhost:8000";

const AddUser = ({ handleToggleView }) => {
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [showPasswordConfirm, setShowPasswordConfirm] = useState("");

  const [error, setError] = useState("");
  const [openSnackbar, setOpenSnackbar] = useState(false);

  const addUser = async () => {
    try {
      await axios.post(`${apiEndpoint}/adduser`, { username, password });
      setOpenSnackbar(true);
    } catch (error) {
      setError(error.response.data.error);
    }
  };

  const toggleShowPassword = () => {
    setShowPassword(!showPassword);
  };

  const toggleShowPasswordConfirm = () => {
    setShowPasswordConfirm(!showPassword);
  };

  const handleCloseSnackbar = () => {
    setOpenSnackbar(false);
  };

  return (
    <div className="mainDiv">
      <PhotoPanel
        text="“ 
          Cada pregunta es un reto, cada acierto un paso más hacia el triunfo.“"
      />
      <div className="form">
        <img src={logo} alt="Logo de WiChat" />
        <h1>Crear cuenta</h1>
        <h2>Introduce tus datos y únete a WiChat ya mismo.</h2>

        <div className="formField">
          <label>Correo electrónico*</label>
          <WiChatTextField
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
        <div className="formField">
          <label>Nombre de usuario*</label>
          <WiChatTextField
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />
        </div>
        <div className="formField">
          <label>Contraseña*</label>
          <div className="passwordContainer">
            <WiChatTextField
              value={password}
              type={showPassword ? "text" : "password"}
              onChange={(e) => setPassword(e.target.value)}
            />
            <span onClick={toggleShowPassword}>👁️‍🗨️</span>
          </div>
        </div>

        <div className="formField">
          <label>Confirmar contraseña*</label>
          <div className="passwordContainer">
            <WiChatTextField
              value={passwordConfirm}
              type={showPasswordConfirm ? "text" : "password"}
              onChange={(e) => setPasswordConfirm(e.target.value)}
            />
            <span onClick={toggleShowPasswordConfirm}>👁️‍🗨️</span>
          </div>
        </div>
        <div className="buttonPanel">
          <BaseButton text="Crear Cuenta" onClick={addUser}></BaseButton>
          <span> o </span>
          <BaseButton
            text="Identifícate"
            onClick={handleToggleView}
            buttonType="buttonSecondary"
          ></BaseButton>
        </div>
        <Snackbar
          open={openSnackbar}
          autoHideDuration={6000}
          onClose={handleCloseSnackbar}
          message="Login successful"
        />
        {error && (
          <Snackbar
            open={!!error}
            autoHideDuration={6000}
            onClose={() => setError("")}
            message={`Error: ${error}`}
          />
        )}
      </div>
    </div>
  );
};

export default AddUser;
