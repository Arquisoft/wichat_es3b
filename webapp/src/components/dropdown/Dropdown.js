import React, { useState } from "react";
import DropDownButton from "./dropdownButton/DropDownButton";
import DropdownContent from "./dropdownContent/DropdownContent";
import "./Dropdown.css";

const Dropdown = ({ buttonText, content }) => {
  const [open, setOpen] = useState(false);

  const toggleDropdown = () => setOpen(!open);

  return (
    <div className="dropdown">
      <DropDownButton toggle={toggleDropdown} open={open}>
        {buttonText}
      </DropDownButton>
      <DropdownContent open={open}>{content}</DropdownContent>
    </div>
  );
};
export default Dropdown;
