// src/components/Login.js
import React, { useState } from "react";
import axios from "axios";
import {
  Container,
  Typography,
  Snackbar,
  Checkbox,
  FormControlLabel,
} from "@mui/material";
import { Typewriter } from "react-simple-typewriter";
import BaseButton from "../button/BaseButton";
import WiChatTextField from "../textField/WiChatTextField";
import "./Login.css";
import "../../assets/global.css";
import logo from "../../assets/img/logo_base.png";

const Login = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const [loginSuccess, setLoginSuccess] = useState(false);
  const [createdAt, setCreatedAt] = useState("");

  const [openSnackbar, setOpenSnackbar] = useState(false);

  const [showLogin, setShowLogin] = useState(true);

  const apiEndpoint =
    process.env.REACT_APP_API_ENDPOINT || "http://localhost:8000";
  const apiKey = process.env.REACT_APP_LLM_API_KEY || "None";

  const handleToggleView = () => {
    setShowLogin(!showLogin);
  };

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

  return (
    <Container component="main" sx={{ marginTop: 4 }}>
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
        <div>
          <img src={logo} alt="Logo de WiChat" />
          <div className="form">
            <h1>Identifícate</h1>
            <h2>
              Introduce el nombre de usuario y la contraseña de tu cuenta de
              WiChat.
            </h2>
            <div>
              <label>
                Correo electrónico
                <WiChatTextField
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                ></WiChatTextField>
              </label>
              <label>
                Contraseña
                <WiChatTextField
                  value={password}
                  type="password"
                  onChange={(e) => setPassword(e.target.value)}
                ></WiChatTextField>
              </label>
            </div>
            <div className="rememberMe">
              <FormControlLabel
                control={
                  <Checkbox
                    checked={rememberMe}
                    onChange={() => setRememberMe(!rememberMe)}
                    sx={{
                      color: "var(--color-primario)",
                      "&.Mui-checked": { color: "var(--color-primario)" },
                    }}
                  />
                }
                label="Recordar mi contraseña"
              />
            </div>
            <div className="buttonPanel">
              <BaseButton
                text="Iniciar Sesión"
                onclick={loginUser}
              ></BaseButton>
              <span> o </span>
              <BaseButton
                text="Crear cuenta"
                onclick={handleToggleView}
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
      )}
    </Container>
  );
};

export default Login;
