import React from "react";
import { FaChevronDown, FaChevronUp } from "react-icons/fa";
import "./DropdownButton.css";

const DropDownButton = ({ children, open, toggle, variant}) => {
  return (
    <div
      className={`dropdown-btn ${variant} ${open ? "button-open" : null}`}
      onClick={toggle}
    >
      {children}
      <span className="toggle-icon">
        {open ? <FaChevronUp /> : <FaChevronDown />}
      </span>
    </div>
  );
};

export default DropDownButton;
