import React from "react";
import Nav from "../components/Nav.js";
import Footer from "../components/Footer.js";
import { Box, Typography, Button, Grid, Container } from "@mui/material";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";

const Home = () => {
    const { t } = useTranslation();

    return (
        <Box sx={{ display: "flex", flexDirection: "column", minHeight: "100vh" }}>
            <Nav />

            <Container maxWidth="lg" sx={{ textAlign: "center", flexGrow: 1, display: "flex", flexDirection: "column", justifyContent: "center", paddingY: 4 }}>
                <Box sx={{ backgroundColor: "#E3F2FD", padding: 4, borderRadius: 2 }}>
                    <Typography variant="h3" sx={{ fontWeight: "bold", color: "#2196F3" }}>{t("title")}</Typography>
                    <Typography variant="h6" sx={{ fontStyle: "italic", marginBottom: 3 }}>
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
                            transition: "0.3s",
                            '&:hover': {
                                backgroundColor: "#2196F3",
                                color: "white"
                            }
                        }}
                        component={Link} to="/play"
                    >
                        {t("play")}
                    </Button>
                </Box>

                <Grid container spacing={2} sx={{ marginTop: 4 }}>
                    <Grid item xs={12} sm={6}>
                        <Box sx={{ backgroundColor: "#E3F2FD", padding: 3, borderRadius: 2 }}>
                            <Typography variant="h5" sx={{ fontWeight: "bold", color: "#2196F3" }}>{t("how_to_play")}</Typography>
                            <Typography variant="body1" sx={{ textAlign: "left", marginTop: 2 }}>
                                {t("observe")}<br />
                                {t("answer")}<br />
                                {t("hints")}
                            </Typography>
                        </Box>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                        <Box sx={{ backgroundColor: "#E3F2FD", padding: 3, borderRadius: 2 }}>
                            <Typography variant="h5" sx={{ fontWeight: "bold", color: "#2196F3" }}>{t("top_players")}</Typography>
                            <Typography variant="body1" sx={{ textAlign: "left", marginTop: 2 }}>
                                <b>1.</b> {t("player_score")}<br />
                                <b>2.</b> {t("player_score")}<br />
                                <b>3.</b> {t("player_score")}
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
