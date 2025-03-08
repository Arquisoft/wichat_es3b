import React from "react";
import { AppBar, Toolbar, Typography, Button, Box } from "@mui/material";
import { useNavigate } from "react-router-dom";

const Nav = () => {
    const navigate = useNavigate();

    return (
        <AppBar position="static" sx={{ backgroundColor: "#42A5F5", padding: "10px" }}>
            <Toolbar sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <Typography
                    variant="h6"
                    sx={{ fontWeight: "bold", cursor: "pointer" }}
                    onClick={() => navigate("/home")}
                >
                    WIChat ⚪
                </Typography>

                <Box sx={{ display: "flex", gap: 3 }}>
                    <Button sx={{ color: "white", fontWeight: "bold", textTransform: "none" }} onClick={() => navigate("/home")}>
                        Inicio
                    </Button>
                    <Button sx={{ color: "white", fontWeight: "bold", textTransform: "none" }} onClick={() => navigate("/play")}>
                        Juego
                    </Button>
                    <Button sx={{ color: "white", fontWeight: "bold", textTransform: "none" }} onClick={() => navigate("/profile")}>
                        Perfil
                    </Button>
                </Box>

                <Box sx={{ display: "flex", gap: 2 }}>
                    <Button sx={{ color: "white", textTransform: "none" }} onClick={() => navigate("/login")}>
                        Iniciar sesión
                    </Button>
                    <Button
                        variant="contained"
                        sx={{ backgroundColor: "white", color: "#42A5F5", fontWeight: "bold", textTransform: "none" }}
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
