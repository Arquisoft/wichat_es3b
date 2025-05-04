import React from "react";
import "./DropdownItem.css";
import useSubmitOnEnter from "../../../hooks/useSubmitOnEnter";

const DropdownItem = ({ children, onClick }) => {
  const handleEnter = useSubmitOnEnter(onClick);
  return (
    <div
      className="dropdown-item"
      onClick={onClick}
      onKeyDown={handleEnter}
      tabIndex={0}
      role="button"
    >
      {children}
    </div>
  );
};

export default DropdownItem;
