import React from "react";
import { AppBar, Toolbar, Typography, Button, Box } from "@mui/material";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";


const Nav = () => {

    const { t } = useTranslation();

    const navigate = useNavigate(); // Hook para manejar la navegación

    return (
        <AppBar position="static" sx={{ backgroundColor: "purple", padding: "5px" }}>
            <Toolbar sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                {/* Logo o nombre de la aplicación */}
                <Typography
                    variant="h6"
                    sx={{ fontWeight: "bold", cursor: "pointer" }}
                    onClick={() => navigate("/home")}
                >
                    WIChat
                </Typography>

                {/* Botones de navegación */}
                <Box sx={{ display: "flex", gap: 2 }}>
                    <Button color="inherit" onClick={() => navigate("/home")}>
                        {t('components.nav.home')}</Button>
                    <Button color="inherit" onClick={() => navigate("/play")}>
                        {t('components.nav.play')}</Button>
                    <Button color="inherit" onClick={() => navigate("/rankings")}>
                        {t('components.nav.ranking')}</Button>
                </Box>

                {/* Botones de sesión */}
                <Box sx={{ display: "flex", gap: 1, marginLeft: "auto" }}>
                    <Button color="inherit" onClick={() => navigate("/login")}>
                        {t('components.nav.login')}</Button>
                    <Button
                        variant="contained"
                        sx={{ backgroundColor: "white", color: "purple" }}
                        onClick={() => navigate("/signup")}
                    >
                        {t('components.nav.singup')}
                    </Button>
                </Box>
            </Toolbar>
        </AppBar>
    );
};

export default Nav;
