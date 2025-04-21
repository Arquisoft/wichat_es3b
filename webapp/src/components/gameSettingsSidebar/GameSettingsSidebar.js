import React, { useEffect, useState, useCallback } from "react";
import "./GameSettingsSidebar.css";
import { useTranslation } from "react-i18next";
import BaseButton from "../button/BaseButton";

// Define default configuration values
const DEFAULT_CONFIG = {
  numPreguntas: 10,
  tiempoPregunta: 30,
  limitePistas: 3,
  modoJuego: "singleplayer", // Default to single player
  dificultad: "medium", // Default difficulty
  categories: ["all"], // Default category
};

const GameSettingsSidebar = ({ isOpen, toggleButton }) => {
  const { t } = useTranslation();
  const [config, setConfig] = useState(() => {
    // Try to load from localStorage, otherwise use defaults
    let storedConfig = {};
    try {
      const storedItem = localStorage.getItem("quizConfig");
      storedConfig = storedItem ? JSON.parse(storedItem) : {};
    } catch (error) {
      console.error("Error reading quizConfig from localStorage:", error);
      // Use empty object if parsing fails
      storedConfig = {};
    }
    // Merge stored config with defaults to ensure all keys exist
    return { ...DEFAULT_CONFIG, ...storedConfig };
  });

  // Effect to synchronize with localStorage if it changes elsewhere (optional but good practice)
  useEffect(() => {
    const handleStorageChange = (event) => {
      if (event.key === "quizConfig") {
        try {
          const newStoredConfig = event.newValue ? JSON.parse(event.newValue) : {};
          setConfig(prevConfig => ({ ...DEFAULT_CONFIG, ...newStoredConfig, categories: prevConfig.categories })); // Keep current categories unless they change
        } catch (error) {
          console.error("Error parsing storage update:", error);
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);

    // Cleanup listener on unmount
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []); // Empty dependency array ensures this runs only once on mount


  // Effect to load categories from localStorage once when component mounts
  // This ensures categories selected in GameSettings.js are preserved initially
  // It runs *after* the initial state is set
  useEffect(() => {
    try {
      const storedConfig = JSON.parse(localStorage.getItem("quizConfig")) || {};
      // Only update categories if they exist in storage, otherwise keep default/initial
      if (storedConfig.categories) {
        setConfig((prevConfig) => ({
          ...prevConfig,
          categories: storedConfig.categories
        }));
      }
    } catch (error) {
      console.error("Error reading categories from localStorage:", error);
    }
  }, []); // Empty dependency array ensures this runs only once on mount

  // Handle changes in form elements
  const handleChange = useCallback((e) => {
    const { name, value } = e.target;
    let updatedValue = value;

    // Convert specific fields to numbers
    if (["numPreguntas", "tiempoPregunta", "limitePistas"].includes(name)) {
      // Ensure conversion is safe, fallback to default if NaN
      updatedValue = parseInt(value, 10);
      if (isNaN(updatedValue)) {
        updatedValue = DEFAULT_CONFIG[name]; // Fallback to default value
      }
    }

    setConfig(prevConfig => {
      const newConfig = {
        ...prevConfig,
        [name]: updatedValue
      };
      // Save the updated configuration to localStorage
      try {
        localStorage.setItem("quizConfig", JSON.stringify(newConfig));
      } catch (error) {
        console.error("Error saving quizConfig to localStorage:", error);
      }
      return newConfig;
    });
  }, []); // No dependencies needed as it uses the state setter function form

  // Handle resetting settings to default
  const handleReset = useCallback(() => {
    // Get current categories from the state to preserve them
    const categoriesToKeep = config.categories || DEFAULT_CONFIG.categories;

    // Create the reset configuration, keeping categories
    const resetConfig = {
      ...DEFAULT_CONFIG,
      categories: categoriesToKeep // Preserve current categories
    };

    // Update state and localStorage
    setConfig(resetConfig);
    try {
      localStorage.setItem("quizConfig", JSON.stringify(resetConfig));
    } catch (error) {
      console.error("Error saving reset config to localStorage:", error);
    }
  }, [config.categories]); // Depend on categories in state to preserve them correctly

  return (
      // Apply 'open' class based on isOpen prop
      <div className={`gameSettingsSidebar ${isOpen ? "open" : ""}`}>
        <div className="gameSettingsSidebar-content">
          {/* Header Section */}
          <div className="sidebar-header">
            <h2>{t("settings")}</h2>
            {/* Show toggle button only when sidebar is open */}
            {isOpen && (
                <div className="sidebar-toggle-top-right">{toggleButton}</div>
            )}
          </div>

          {/* Number of Questions Section */}
          <div className="gameSettingsSidebar-section">
            <label htmlFor="numPreguntas">{t("numQuestions")}</label>
            <select
                id="numPreguntas"
                name="numPreguntas"
                className="sidebar-select"
                value={config.numPreguntas}
                onChange={handleChange}
                aria-label={t("numQuestions")} // Accessibility
            >
              <option value={10}>10 {t("questions")}</option>
              <option value={20}>20 {t("questions")}</option>
              <option value={30}>30 {t("questions")}</option>
            </select>
          </div>

          {/* Time per Question Section */}
          <div className="gameSettingsSidebar-section">
            <label htmlFor="tiempoPregunta">{t("timePerQuestion")}</label>
            <select
                id="tiempoPregunta"
                name="tiempoPregunta"
                className="sidebar-select"
                value={config.tiempoPregunta}
                onChange={handleChange}
                aria-label={t("timePerQuestion")} // Accessibility
            >
              <option value={30}>30 {t("seconds")}</option>
              <option value={45}>45 {t("seconds")}</option>
              <option value={60}>60 {t("seconds")}</option>
            </select>
          </div>

          {/* AI Hint Limit Section */}
          <div className="gameSettingsSidebar-section">
            <label htmlFor="limitePistas">{t("aiHintLimit")}</label>
            <select
                id="limitePistas"
                name="limitePistas"
                className="sidebar-select"
                value={config.limitePistas}
                onChange={handleChange}
                aria-label={t("aiHintLimit")} // Accessibility
            >
              <option value={3}>3 {t("hints")}</option>
              <option value={5}>5 {t("hints")}</option>
              <option value={7}>7 {t("hints")}</option>
            </select>
          </div>

          {/* Game Mode Section */}
          <div className="gameSettingsSidebar-section">
            <label htmlFor="modoJuego">{t("gameMode")}</label>
            <select
                id="modoJuego"
                name="modoJuego"
                className="sidebar-select"
                value={config.modoJuego}
                onChange={handleChange}
                aria-label={t("gameMode")} // Accessibility
            >
              <option value="singleplayer">{t("singlePlayer")}</option>
              <option value="playerVsIA">{t("playerVsAI")}</option>
            </select>
          </div>

          {/* Difficulty Section (Conditional) */}
          {/* Apply the new CSS class here */}
          {config.modoJuego === 'playerVsIA' && (
              <div className="gameSettingsSidebar-section difficulty-section"> {/* Added class */}
                <label htmlFor="dificultad">{t("difficulty")}</label>
                <select
                    id="dificultad"
                    name="dificultad" // Ensure name matches the state key
                    className="sidebar-select"
                    value={config.dificultad}
                    onChange={handleChange}
                    aria-label={t("difficulty")} // Accessibility
                >
                  <option value="easy">{t("easy")}</option>
                  <option value="medium">{t("medium")}</option>
                  <option value="hard">{t("hard")}</option>
                </select>
              </div>
          )}

          {/* Reset Button Section */}
          <div className="sidebar-button-container">
            <BaseButton
                text={t("reset")}
                onClick={handleReset}
                aria-label={t("resetSettings")} // Accessibility
            />
          </div>
        </div>
      </div>
  );
};

export default GameSettingsSidebar;
