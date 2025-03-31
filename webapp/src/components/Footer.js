import React from "react";
import { Box, Typography } from "@mui/material";
import { useTranslation } from "react-i18next";

const Footer = () => {
  const { t } = useTranslation();

  return (
    <Box
      sx={{
        backgroundColor: "#38b6ff",
        color: "white",
        textAlign: "center",
        padding: "1em",
        minHeight: "6vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        width: "100%",
        zIndex: "100"
      }}
    >
      <Typography variant="body1" sx={{ fontWeight: "normal" }}>
        {t("footer_text")}
      </Typography>
    </Box>
  );
};

export default Footer;
