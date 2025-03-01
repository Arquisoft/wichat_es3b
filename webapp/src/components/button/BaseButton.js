import React from "react";
import Button from "@mui/material/Button";
import "./BaseButton.css";

function BaseButton({ text, onClick }) {
  return (
    <Button
      variant="contained"
      color="primary"
      onClick={onClick}
      className="buttonPrimary"
    >
      {text}
    </Button>
  );
}

export default BaseButton;
