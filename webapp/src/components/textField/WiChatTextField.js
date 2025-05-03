import React from "react";
import "./WiChatTextField.css";
const WiChatTextField = ({ id, value, onChange, type = "text", onKeyDown }) => {
  return (
    <input
      id={id}
      type={type}
      onChange={onChange}
      value={value}
      onKeyDown={onKeyDown}
      className="textField"
    ></input>
  );
};
export default WiChatTextField;
