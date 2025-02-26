import React from "react";
import { Box, Typography, Button } from "@mui/material";
import { useNavigate } from "react-router-dom";

const Footer = () => {
    const navigate = useNavigate(); // Hook para manejar la navegación

    return (
        <Box sx={{ backgroundColor: "purple", padding: "20px", marginTop: "auto" }}>
            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap" }}>
                {/* Texto de derechos reservados */}
                <Typography variant="body2" sx={{ color: "white", textAlign: "center", flexBasis: "100%" }}>
                    © 2025 WIChat. Todos los derechos reservados.
                </Typography>

                {/* Botones de navegación */}
                <Box sx={{ display: "flex", gap: 2 }}>
                    <Button color="inherit" onClick={() => navigate("/home")}>Inicio</Button>
                    <Button color="inherit" onClick={() => navigate("/about")}>Sobre nosotros</Button>
                    <Button color="inherit" onClick={() => navigate("/contact")}>Contacto</Button>
                </Box>

                {/* Redes sociales */}
                <Box sx={{ display: "flex", gap: 2, marginTop: { xs: 2, sm: 0 } }}>
                    <Button color="inherit" onClick={() => navigate("/facebook")}>Facebook</Button>
                    <Button color="inherit" onClick={() => navigate("/twitter")}>Twitter</Button>
                    <Button color="inherit" onClick={() => navigate("/instagram")}>Instagram</Button>
                </Box>
            </Box>
        </Box>
    );
};

export default Footer;
