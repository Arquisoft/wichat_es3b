import React from "react";
import Nav from "../../components/nav/Nav.js";
import Footer from "../../components/Footer.js";
import { Box, Typography, Grid, Container } from "@mui/material";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import "./Home.css";
import "../../components/button/BaseButton";
import BaseButton from "../../components/button/BaseButton";

const Home = () => {
    const { t } = useTranslation();
    const navigate = useNavigate();

    return (
        <Box sx={{ display: "flex", flexDirection: "column", minHeight: "100vh" }}>
            <Nav />

            <Container
                maxWidth="xl"
                sx={{
                    textAlign: "center",
                    flex: 1,
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "center",
                    alignItems: "center",
                    paddingX: 3,
                    paddingY: 4,
                }}
            >
                {/* Box superior con ancho completo */}
                <Box sx={{ width: "100%", backgroundColor: "#E3F2FD", padding: 4, borderRadius: 2, marginTop: 4 }}>
                <Typography variant="h3" sx={{ fontWeight: "bold", color: "#2196F3" }}>
                        {t("title")}
                    </Typography>
                    <Typography variant="h6" sx={{ fontStyle: "italic", marginBottom: 3 }}>
                        {t("subtitle")}
                    </Typography>
                    <BaseButton
                        text={t("play")}
                        onClick={() => navigate("/play")}
                        buttonType="buttonSecondary"
                    />
                </Box>

                {/* Grid con separación adecuada */}
                <Grid container spacing={3} sx={{ marginTop: 4, width: "100%" }}>
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
                        <Box sx={{ backgroundColor: "#E3F2FD", padding: 3, borderRadius: 2, marginRight: "2vw" }}>
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