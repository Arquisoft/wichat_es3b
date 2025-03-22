import React from "react";
import { Menu } from "lucide-react";
import "./SidebarToggleButton.css";

const SidebarToggleButton = ({ onClick }) => {
  return (
    <button
      className="sidebar-toggle-button"
      onClick={onClick}
      aria-label="Abrir menú"
    >
      <Menu size={24}></Menu>
    </button>
  );
};

export default SidebarToggleButton;
