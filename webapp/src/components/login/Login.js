// src/components/Login.js
import React, { useState } from "react";
import axios from "axios";
import { Container, Typography, Snackbar, Box } from "@mui/material";
import { Typewriter } from "react-simple-typewriter";
import Button from "../button/BaseButton";
import WiChatTextField from "../textField/WiChatTextField";

const Login = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
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
        <Container
          sx={{ display: "flex", flexDirection: "column", gap: "0.5em" }}
        >
          <Typography
            component="h1"
            variant="h5"
            textAlign={"center"}
            fontFamily={"Poppins, sans-serif"}
            fontWeight={"bold"}
            color={"#38B6FF"}
          >
            Identifícate
          </Typography>
          <Typography
            component="subtitle1"
            fontSize={"0.8em"}
            textAlign={"center"}
            fontFamily={"Poppins, sans-serif"}
            fontStyle={"italic"}
          >
            Introduce el nombre de usuario y la contraseña de tu cuenta de
            WiChat.
          </Typography>
          <WiChatTextField
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          ></WiChatTextField>
          <WiChatTextField
            value={password}
            type="password"
            onChange={(e) => setPassword(e.target.value)}
          ></WiChatTextField>
          {/* Centrar el botón */}
          <Box sx={{ display: "flex", justifyContent: "center", marginTop: 2 }}>
            <Button text="Iniciar Sesión" onclick={loginUser}></Button>
          </Box>

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
        </Container>
      )}
    </Container>
  );
};

export default Login;
