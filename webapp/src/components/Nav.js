import React from "react";
import { AppBar, Toolbar, Typography, Button, Box } from "@mui/material";
import { useNavigate } from "react-router-dom";

const Nav = () => {
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
                    <Button color="inherit" onClick={() => navigate("/home")}>Inicio</Button>
                    <Button color="inherit" onClick={() => navigate("/game")}>Juego</Button>
                    <Button color="inherit" onClick={() => navigate("/rankings")}>Estadísticas</Button>
                </Box>

                {/* Botones de sesión */}
                <Box sx={{ display: "flex", gap: 1, marginLeft: "auto" }}>
                    <Button color="inherit" onClick={() => navigate("/login")}>Iniciar sesión</Button>
                    <Button
                        variant="contained"
                        sx={{ backgroundColor: "white", color: "purple" }}
                        onClick={() => navigate("/signup")}
                    >
                        Crear cuenta
                    </Button>
                </Box>
            </Toolbar>
        </AppBar>
    );
};

export default Nav;
