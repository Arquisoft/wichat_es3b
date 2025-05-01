import React from "react";
import "./BaseButton.css";

function BaseButton({ buttonid, text, onClick, buttonType = "buttonPrimary" }) {
  if (!buttonid){
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
  return (
    <button
      id={buttonid}
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
