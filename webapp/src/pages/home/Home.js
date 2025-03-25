import React, { useEffect, useState } from "react";
import axios from "axios";
import Nav from "../../components/nav/Nav.js";
import Footer from "../../components/Footer.js";
import { Box, Typography, Button, Grid, Container } from "@mui/material";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import "./Home.css";

// Simulación de autenticación (cambia esto según cómo manejes la autenticación)
const isAuthenticated = () => {
  return localStorage.getItem("username") !== null; // Puedes cambiarlo según tu lógica
};

const Home = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const gatewayUrl = "http://localhost:8000";
  const [ranking, setRanking] = useState([]);

  useEffect(() => {
    const fetchRanking = async () => {
      try {
        const response = await axios.get(`${gatewayUrl}/getTop3`);
        setRanking(response.data);
      } catch (error) {
        console.error("Error al obtener los datos del ranking: ", error);
      }
    };
    fetchRanking();
  }, []);

  const handleProtectedNavigation = (path) => {
    if (isAuthenticated()) {
      navigate(path);
    } else {
      navigate("/auth");
    }
  };

  return (
    <Box sx={{ display: "flex", flexDirection: "column", minHeight: "100vh" }}>
      <Nav />

      <Container
        maxWidth="lg"
        sx={{ textAlign: "center", paddingTop: 4, flexGrow: 1 }}
      >
        <Box sx={{ backgroundColor: "#E3F2FD", padding: 4, borderRadius: 2 }}>
          <Typography
            variant="h3"
            sx={{ fontWeight: "bold", color: "#2196F3" }}
          >
            {t("title")}
          </Typography>
          <Typography
            variant="h6"
            sx={{ fontStyle: "italic", marginBottom: 3 }}
          >
            {t("subtitle")}
          </Typography>
          <Button
            variant="outlined"
            sx={{
              borderColor: "#2196F3",
              color: "#2196F3",
              fontWeight: "bold",
              fontSize: "1.5rem",
              padding: "12px 30px",
            }}
            onClick={() => handleProtectedNavigation("/play")}
          >
            {t("play")}
          </Button>
        </Box>

        <Grid container spacing={2} sx={{ marginTop: 4 }}>
          <Grid item xs={12} sm={6}>
            <Box
              sx={{ backgroundColor: "#E3F2FD", padding: 3, borderRadius: 2 }}
            >
              <Typography
                variant="h5"
                sx={{ fontWeight: "bold", color: "#2196F3" }}
              >
                {t("how_to_play")}
              </Typography>
              <Typography
                variant="body1"
                sx={{ textAlign: "left", marginTop: 2 }}
              >
                {t("observe")}
                <br />
                {t("answer")}
                <br />
                {t("hints")}
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={12} sm={6}>
            <Box
              sx={{ backgroundColor: "#E3F2FD", padding: 3, borderRadius: 2 }}
            >
              <Typography
                variant="h5"
                sx={{ fontWeight: "bold", color: "#2196F3" }}
              >
                {t("top_players")}
              </Typography>
              <Typography
                variant="body1"
                sx={{ textAlign: "left", marginTop: 2 }}
              >
                {ranking.map((player, index) => (
                  <div key={index}>
                    <b>{index + 1}.</b> {player.username} - {player.maxScore}{" "}
                    puntos.
                  </div>
                ))}
              </Typography>
            </Box>
          </Grid>
        </Grid>
      </Container>

      <Footer />
    </Box>
  );
};

export default Home;
