import React from "react";
import Nav from "../components/Nav.js";
import Footer from "../components/Footer.js";
import { Box, Typography, Button, Grid, Container } from "@mui/material";
import { Link } from "react-router-dom";

const Home = () => {
    return (
        <>
            <Nav />
            <Container maxWidth="lg">
                {/* Sección 1: Pantalla completa con texto y botón */}
                <Box
                    sx={{
                        height: "100vh",
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        justifyContent: "center",
                        backgroundColor: "#f0f0f0",
                        border: "5px solid #9b4dca", // Borde morado
                        borderRadius: 2, // Bordes redondeados
                        padding: 3, // Espaciado interno
                    }}
                >
                    <Typography variant="h2" sx={{ color: '#9b4dca' }} gutterBottom>
                       WIChat
                    </Typography>
                    <Typography variant="h6" color="textSecondary" paragraph>
                        ¡Pon a prueba tus conocimientos con imágenes y pistas interactivas!
                    </Typography>
                    <Button variant="contained" color="primary" component={Link}
                            to="/play" >
                        Jugar
                    </Button>
                </Box>

                {/* Sección 2: Instrucciones rápidas */}
                <Grid container spacing={2}>
                    <Grid item xs={12} sm={6}>
                        <Box
                            sx={{
                                height: "50vh",
                                display: "flex",
                                flexDirection: "column",
                                alignItems: "center",
                                justifyContent: "center",
                                backgroundColor: "#f0f0f0", // Fondo azul claro
                                border: "5px solid #9b4dca", // Borde morado
                                borderRadius: 2, // Bordes redondeados
                                padding: 3, // Espaciado interno
                            }}
                        >
                            <Typography variant="h5" gutterBottom>
                               ¿Cómo se juega?
                            </Typography>
                            <Typography variant="body1" color="textSecondary">
                                1. Observa la imagen.{" "}
                                <br />
                                2. Responde en el menor tiempo posible <br />
                                3. Usa pistas generales con IA si lo necesitas
                            </Typography>
                        </Box>
                    </Grid>

                    {/* Sección 3: Ranking de estadísticas */}
                    <Grid item xs={12} sm={6}>
                        <Box
                            sx={{
                                height: "50vh",
                                display: "flex",
                                flexDirection: "column",
                                alignItems: "center",
                                justifyContent: "center",
                                backgroundColor: "#f0f0f0",
                                borderRadius: 2,
                                boxShadow: 3,
                                padding: 3,
                            }}
                        >
                            <Typography variant="h5" gutterBottom>
                               Top 3 jugadores
                            </Typography>
                            <Typography variant="body1" color="textSecondary">
                                1. Juan - 150 puntos <br />
                                2. Ana - 130 puntos <br />
                                3. Luis - 120 puntos <br />
                                4. Marta - 100 puntos
                            </Typography>
                        </Box>
                    </Grid>
                </Grid>
            </Container>
            <Footer />
        </>
    );
};

export default Home;
