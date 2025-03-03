import React from "react";
import { Box, Typography, Button } from "@mui/material";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";


const Footer = () => {

    const { t } = useTranslation();

    const navigate = useNavigate(); // Hook para manejar la navegación

    return (
        <Box sx={{ backgroundColor: "purple", padding: "20px", marginTop: "auto" }}>
            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap" }}>
                {/* Texto de derechos reservados */}
                <Typography variant="body2" sx={{ color: "white", textAlign: "center", flexBasis: "100%" }}>
                    © 2025 WIChat.  {t('components.footer.rights')}
                </Typography>

                {/* Botones de navegación */}
                <Box sx={{ display: "flex", gap: 2 }}>
                    <Button color="inherit" onClick={() => navigate("/about")}>
                        {t('components.footer.about')}</Button>
                    <Button color="inherit" onClick={() => navigate("/contact")}>
                        {t('components.footer.contact')}</Button>
                </Box>
            </Box>
        </Box>
    );
};

export default Footer;
