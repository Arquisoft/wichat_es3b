import React from "react";
import "./WiChatTextField.css";
const WiChatTextField = ({ value, onChange, type = "text" }) => {
  return (
    <input
      type={type}
      onChange={onChange}
      value={value}
      className="textField"
    ></input>
  );
};
export default WiChatTextField;
