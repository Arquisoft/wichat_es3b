import React from "react";
import "./BaseButton.css";

function BaseButton({ text, onClick, buttonType = "buttonPrimary" }) {
  return (
    <button
      variant="contained"
      color="primary"
      onClick={onClick}
      className={buttonType}
    >
      {text}
    </button>
  );
}

export default BaseButton;
