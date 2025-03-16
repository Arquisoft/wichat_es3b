import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { Container, Snackbar } from "@mui/material";
import BaseButton from "../button/BaseButton";
import WiChatTextField from "../textField/WiChatTextField";
import PhotoPanel from "../photoPanel/PhotoPanel";
import "./Login.css";
import "../../assets/global.css";
import logo from "../../assets/img/logo_base.png";

const Login = ({ handleToggleView }) => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loginSuccess, setLoginSuccess] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [openSnackbar, setOpenSnackbar] = useState(false);

  const navigate = useNavigate();

  useEffect(() => {
    // Verificar si hay un token guardado
    const token = localStorage.getItem("token");
    if (token) {
      setLoginSuccess(true);
    }
  }, []);

  // Iniciar sesión
  const loginUser = async () => {
    try {
      const response = await axios.post("http://localhost:8000/login", {
        username,
        password,
      });

      const { token } = response.data;

      // Guardar token en localStorage
      localStorage.setItem("token", token);
      localStorage.setItem("username", username);

      setLoginSuccess(true);
      setOpenSnackbar(true);
      setMessage(`Bienvenido, ${username}!`);
      navigate("/home");
    } catch (error) {
      setError(error.response?.data?.error || "Error al iniciar sesión");
    }
  };

  // Cerrar sesión
  const logoutUser = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("username");
    setLoginSuccess(false);
    navigate("/auth");
  };

  return (
      <div>
        {loginSuccess ? (
            <Container>
              <p>{message}</p>
              <BaseButton text="Cerrar Sesión" onClick={logoutUser} />
            </Container>
        ) : (
            <div className="mainDiv">
              <div className="form">
                <img className="logoAuth" src={logo} alt="Logo de WiChat" />
                <h1>Identifícate</h1>
                <h2>Introduce tus datos y únete a WiChat ya mismo.</h2>
                <div className="formField">
                  <label>Nombre de usuario</label>
                  <WiChatTextField
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                  />
                </div>
                <div className="formField">
                  <label>Contraseña</label>
                  <WiChatTextField
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                  />
                </div>
                <div className="buttonPanel">
                  <BaseButton text="Iniciar Sesión" onClick={loginUser} />
                  <span> o </span>
                  <BaseButton
                      text="Crear cuenta"
                      onClick={handleToggleView}
                      buttonType="buttonSecondary"
                  />
                </div>
                <Snackbar
                    open={openSnackbar}
                    autoHideDuration={6000}
                    message="Login exitoso"
                    onClose={() => setOpenSnackbar(false)}
                />
                {error && <p className="error">{error}</p>}
              </div>
              <PhotoPanel text="¡Bienvenido a WiChat!" />
            </div>
        )}
      </div>
  );
};

export default Login;