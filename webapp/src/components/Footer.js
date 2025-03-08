import React from "react";
import { Box, Typography } from "@mui/material";
import { useTranslation } from "react-i18next";

const Footer = () => {
    const { t } = useTranslation();

    return (
        <Box
            sx={{
                backgroundColor: "#2196F3",
                color: "white",
                textAlign: "center",
                padding: "20px",
                marginTop: "auto",
                height: "80px", // Ajusta la altura del footer para que sea igual al nav
                display: "flex",
                alignItems: "center",
                justifyContent: "center"
            }}
        >
            <Typography variant="body1" sx={{ fontWeight: "normal" }}>
                {t("footer_text")}
            </Typography>
        </Box>
    );
};

export default Footer;
