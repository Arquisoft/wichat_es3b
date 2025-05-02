import React from "react";
import "./DropdownContent.css";

const DropdownContent = ({ children, open, variant}) => {
  return (
    <div className={`dropdown-content ${variant} ${open ? "content-open" : ""}`}>
      {children}
    </div>
  );
};

export default DropdownContent;
