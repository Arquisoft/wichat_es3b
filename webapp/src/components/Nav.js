import React, { useState } from "react";
import { AppBar, Toolbar, Typography, Button, Box } from "@mui/material";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next"; // Importa el hook useTranslation

const Nav = () => {
    const { t, i18n } = useTranslation(); // Utiliza el hook useTranslation para obtener las funciones de traducción
    const navigate = useNavigate();

    const handleLanguageChange = () => {
        const newLang = i18n.language === "es" ? "en" : "es"; // Cambia el idioma entre "es" y "en"
        i18n.changeLanguage(newLang); // Cambia el idioma usando i18n
    };

    return (
        <AppBar position="static" sx={{ backgroundColor: "#42A5F5", padding: "10px" }}>
            <Toolbar sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <Typography
                    variant="h6"
                    sx={{ fontWeight: "bold", cursor: "pointer" }}
                    onClick={() => navigate("/home")}
                >
                    {t("title")} ⚪
                </Typography>

                <Box sx={{ display: "flex", gap: 3 }}>
                    <Button sx={{ color: "white", fontWeight: "bold", textTransform: "none" }} onClick={() => navigate("/home")}>
                        {t("home")}
                    </Button>
                    <Button sx={{ color: "white", fontWeight: "bold", textTransform: "none" }} onClick={() => navigate("/play")}>
                        {t("play")}
                    </Button>
                    <Button sx={{ color: "white", fontWeight: "bold", textTransform: "none" }} onClick={() => navigate("/profile")}>
                        {t("profile")}
                    </Button>
                </Box>

                <Box sx={{ display: "flex", gap: 2 }}>
                    <Button sx={{ color: "white", textTransform: "none" }} onClick={() => navigate("/login")}>
                        {t("login")}
                    </Button>
                    <Button
                        variant="contained"
                        sx={{ backgroundColor: "white", color: "#42A5F5", fontWeight: "bold", textTransform: "none" }}
                        onClick={() => navigate("/signup")}
                    >
                        {t("signup")}
                    </Button>
                    <Button
                        sx={{ color: "white", fontWeight: "bold", textTransform: "none" }}
                        onClick={handleLanguageChange}
                    >
                        {i18n.language === "es" ? "Cambiar a Inglés" : "Switch to Spanish"}
                    </Button>
                </Box>
            </Toolbar>
        </AppBar>
    );
};

export default Nav;
