import React, { useState, useEffect, useRef } from "react";
import DropDownButton from "./dropdownButton/DropDownButton";
import DropdownContent from "./dropdownContent/DropdownContent";
import "./Dropdown.css";

const Dropdown = ({ buttonText, content }) => {
  const [open, setOpen] = useState(false);

  const toggleDropdown = () => setOpen(!open);
  const dropdownRef = useRef();

  useEffect(() => {
    const handler = (e) => {
      // Verifica si el clic es fuera del menú desplegable
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setOpen(false); // Cierra el dropdown si se hace clic fuera de él
      }
    };
    // Agrega el evento de escucha del clic
    document.addEventListener("click", handler);
    // Elimina el evento de escucha cuando el componente se desmonta
    return () => {
      document.removeEventListener("click", handler);
    };
  }, []);

  return (
    <div className="dropdown" ref={dropdownRef}>
      <DropDownButton toggle={toggleDropdown} open={open}>
        {buttonText}
      </DropDownButton>
      <DropdownContent open={open}>{content}</DropdownContent>
    </div>
  );
};
export default Dropdown;
