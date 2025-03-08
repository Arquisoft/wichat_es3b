import React from "react";
import Nav from "../components/Nav.js";
import Footer from "../components/Footer.js";
import { Box, Typography, Button, Grid, Container } from "@mui/material";
import { Link } from "react-router-dom";

const Home = () => {
    return (
        <Box sx={{ display: "flex", flexDirection: "column", minHeight: "100vh" }}>
            <Nav />

            <Container maxWidth="lg" sx={{ textAlign: "center", paddingTop: 4, flexGrow: 1 }}>
                <Box sx={{ backgroundColor: "#E3F2FD", padding: 4, borderRadius: 2 }}>
                    <Typography variant="h3" sx={{ fontWeight: "bold", color: "#2196F3" }}>WIChat</Typography>
                    <Typography variant="h6" sx={{ fontStyle: "italic", marginBottom: 3 }}>
                        ¡Pon a prueba tus conocimientos con imágenes y pistas interactivas!
                    </Typography>
                    <Button variant="outlined" sx={{ borderColor: "#2196F3", color: "#2196F3", fontWeight: "bold" }} component={Link} to="/play">
                        Jugar
                    </Button>
                </Box>

                <Grid container spacing={2} sx={{ marginTop: 4 }}>
                    <Grid item xs={12} sm={6}>
                        <Box sx={{ backgroundColor: "#E3F2FD", padding: 3, borderRadius: 2 }}>
                            <Typography variant="h5" sx={{ fontWeight: "bold", color: "#2196F3" }}>¿Cómo se juega?</Typography>
                            <Typography variant="body1" sx={{ textAlign: "left", marginTop: 2 }}>
                                👁️ Observa la imagen.<br />
                                ⏳ Responde en el menor tiempo posible.<br />
                                ❓ Usa pistas generadas con IA si lo necesitas.
                            </Typography>
                        </Box>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                        <Box sx={{ backgroundColor: "#E3F2FD", padding: 3, borderRadius: 2 }}>
                            <Typography variant="h5" sx={{ fontWeight: "bold", color: "#2196F3" }}>Top 3 jugadores</Typography>
                            <Typography variant="body1" sx={{ textAlign: "left", marginTop: 2 }}>
                                <b>1.</b> Nombre del jugador - Puntuación<br />
                                <b>2.</b> Nombre del jugador - Puntuación<br />
                                <b>3.</b> Nombre del jugador - Puntuación
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

