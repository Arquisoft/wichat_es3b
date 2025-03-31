import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { Container, Snackbar } from "@mui/material";
import BaseButton from "../button/BaseButton";
import WiChatTextField from "../textField/WiChatTextField";
import PhotoPanel from "../photoPanel/PhotoPanel";
import "./Login.css";
import "../../assets/global.css";
import { useTranslation } from "react-i18next";


const Login = ({ handleToggleView }) => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loginSuccess, setLoginSuccess] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [openSnackbar, setOpenSnackbar] = useState(false);

  const navigate = useNavigate();
  
  const GATEWAY_URL = process.env.REACT_APP_GATEWAY_SERVICE_URL || "http://localhost:8000";

  const { t } = useTranslation();

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
      const response = await axios.post( `${GATEWAY_URL}/login`, {
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
                <h1>{t("identify")}</h1>
                <h2>{t("introduceData")}</h2>
                <div className="formField">
                  <label>{t("username")}</label>
                  <WiChatTextField
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                  />
                </div>
                <div className="formField">
                  <label>{t("password")}</label>
                  <WiChatTextField
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                  />
                </div>
                <div className="buttonPanel">
                  <BaseButton text={t("login")} onClick={loginUser} />
                  <span> o </span>
                  <BaseButton
                      text={t("signup")}
                      onClick={handleToggleView}
                      buttonType="buttonSecondary"
                  />
                </div>
                <Snackbar
                    open={openSnackbar}
                    autoHideDuration={6000}
                    message={t("loginSuccessful")}
                    onClose={() => setOpenSnackbar(false)}
                />
                {error && <p className="error">{error}</p>}
              </div>
              <PhotoPanel text={t("welcomeMessage")} />
            </div>
        )}
      </div>
  );
};

export default Login;