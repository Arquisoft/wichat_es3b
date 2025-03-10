// src/components/Login.js
import React, { useState } from "react";
import axios from "axios";
import { Container, Typography, Snackbar } from "@mui/material";
import { Typewriter } from "react-simple-typewriter";
import BaseButton from "../button/BaseButton";
import WiChatTextField from "../textField/WiChatTextField";
import PhotoPanel from "../photoPanel/PhotoPanel";
import "./Login.css";
import "../../assets/global.css";
import logo from "../../assets/img/logo_base.png";

const Login = ({ handleToggleView }) => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const [loginSuccess, setLoginSuccess] = useState(false);
  const [createdAt, setCreatedAt] = useState("");

  const [openSnackbar, setOpenSnackbar] = useState(false);

  const apiEndpoint =
    process.env.REACT_APP_API_ENDPOINT || "http://localhost:8000";
  const apiKey = process.env.REACT_APP_LLM_API_KEY || "None";

  const loginUser = async () => {
    try {
      const response = await axios.post(`${apiEndpoint}/login`, {
        username,
        password,
      });

      const question =
        "Please, generate a greeting message for a student called " +
        username +
        " that is a student of the Software Architecture course in the University of Oviedo. Be nice and polite. Two to three sentences max.";
      const model = "empathy";

      if (apiKey === "None") {
        setMessage("LLM API key is not set. Cannot contact the LLM.");
      } else {
        const message = await axios.post(`${apiEndpoint}/askllm`, {
          question,
          model,
          apiKey,
        });
        setMessage(message.data.answer);
      }
      // Extract data from the response
      const { createdAt: userCreatedAt } = response.data;

      setCreatedAt(userCreatedAt);
      setLoginSuccess(true);

      setOpenSnackbar(true);
    } catch (error) {
      setError(error.response.data.error);
    }
  };

  const handleCloseSnackbar = () => {
    setOpenSnackbar(false);
  };

  const toggleShowPassword = () => {
    setShowPassword(!showPassword);
  };

  return (
    <div>
      {loginSuccess ? (
        <Container>
          <Typewriter
            words={[message]} // Pass your message as an array of strings
            cursor
            cursorStyle="|"
            typeSpeed={50} // Typing speed in ms
          />
          <Typography
            component="p"
            variant="body1"
            sx={{ textAlign: "center", marginTop: 2 }}
          >
            Your account was created on{" "}
            {new Date(createdAt).toLocaleDateString()}.
          </Typography>
        </Container>
      ) : (
        <div className="mainDiv">
          <div className="form">
            <img className="logoAuth" src={logo} alt="Logo de WiChat" />
            <h1>Identifícate</h1>
            <h2>
              Introduce el nombre de usuario y la contraseña de tu cuenta de
              WiChat.
            </h2>

            <div className="formField">
              <label>Nombre de usuario</label>
              <WiChatTextField
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
            </div>
            <div className="formField">
              <label>Contraseña</label>
              <div className="passwordContainer">
                <WiChatTextField
                  value={password}
                  type={showPassword ? "text" : "password"}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <span onClick={toggleShowPassword}>👁️‍🗨️</span>
              </div>
            </div>
            <div className="rememberMe">
              <input type="checkbox" id="rememberMeCbx"></input>
              <label htmlFor="rememberMeCbx"> Recordar mi contraseña</label>
            </div>

            <div className="buttonPanel">
              <BaseButton
                text="Iniciar Sesión"
                onClick={loginUser}
              ></BaseButton>
              <span> o </span>
              <BaseButton
                text="Crear cuenta"
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
          <PhotoPanel
            text="“ 
          El conocimiento es un viaje sin final, una aventura que nos enriquece cada día.
           Aprender, descubrir y compartir es lo que nos hace crecer, porque en cada pregunta hay una oportunidad
           y en cada respuesta, un nuevo reto. ¡Sigamos jugando y ganando juntos! “"
          />
        </div>
      )}
    </div>
  );
};

export default Login;
