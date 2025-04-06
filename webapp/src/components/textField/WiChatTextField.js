import React from "react";
import "./WiChatTextField.css";
const WiChatTextField = ({ id, value, onChange, type = "text" }) => {
  return (
    <input
        id={id}
      type={type}
      onChange={onChange}
      value={value}
      className="textField"
    ></input>
  );
};
export default WiChatTextField;
