import React from "react";
import { FaChevronDown, FaChevronUp } from "react-icons/fa";
import useSubmitOnEnter from "../../../hooks/useSubmitOnEnter";
import "./DropdownButton.css";

const DropDownButton = ({ children, open, toggle, variant }) => {
  const handleEnter = useSubmitOnEnter(toggle);

  return (
    <div
      className={`dropdown-btn ${variant} ${open ? "button-open" : ""}`}
      onClick={toggle}
      onKeyDown={handleEnter}
      tabIndex={0}
      role="button"
    >
      {children}
      <span className="toggle-icon">
        {open ? <FaChevronUp /> : <FaChevronDown />}
      </span>
    </div>
  );
};

export default DropDownButton;
