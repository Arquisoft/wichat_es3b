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
                marginTop: "auto"
            }}
        >
            <Typography variant="body1">{t("footer_text")}</Typography>
        </Box>
    );
};

export default Footer;
