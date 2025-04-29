import React from "react";
import "./CategoryCard.css";
import useSubmitOnEnter from "../../hooks/useSubmitOnEnter";

const CategoryCard = ({ name, imageSrc, isSelected, onClick }) => {
  const handleKeyDown = useSubmitOnEnter(onClick);
  return (
    <div
      className={`category-card ${isSelected ? "selected" : ""}`}
      onClick={onClick}
      role="button"
      aria-pressed={isSelected}
      onKeyDown={handleKeyDown}
      tabIndex={0}
    >
      <div className="category-card-container">
        <img
          src={imageSrc || "/placeHolder.svg"}
          alt={name}
          className="category-card-image"
        />
      </div>
      <div className="category-card-overlay">
        <h2 className="category-card-title">{name}</h2>
      </div>
    </div>
  );
};

export default CategoryCard;
