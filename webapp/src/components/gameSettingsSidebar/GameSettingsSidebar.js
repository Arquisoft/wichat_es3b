import React, { useEffect, useState } from "react";
import "./GameSettingsSidebar.css";
import { useTranslation } from "react-i18next";
import BaseButton from "../button/BaseButton";

const GameSettingsSidebar = ({ isOpen, toggleButton }) => {
  const { t } = useTranslation();
  const [config, setConfig] = useState(() => {
    const storedConfig = JSON.parse(localStorage.getItem("quizConfig"));
    return storedConfig || {
      numPreguntas: 10,
      tiempoPregunta: 30,
      limitePistas: 3,
      modoJuego: "Jugador vs IA",
      categories: [],
    };
  });

  useEffect(() => {
    const storedConfig = JSON.parse(localStorage.getItem("quizConfig")) || {};
    setConfig((prevConfig) => ({
      ...prevConfig,
      categories: storedConfig.categories || []
    }));
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    let updatedValue = value;

    // Convirtiendo valores en números cuando es necesario
    if (name === "numPreguntas" || name === "tiempoPregunta" || name === "limitePistas") {
      updatedValue = parseInt(value);
    }

    const updatedConfig = {
      ...config,
      [name]: updatedValue,
      categories: config.categories
    };
    setConfig(updatedConfig);
    localStorage.setItem("quizConfig", JSON.stringify(updatedConfig));
  };

  return (
      <div className={`gameSettingsSidebar ${isOpen ? "open" : ""}`}>
        <div className="gameSettingsSidebar-content">
          <div className="sidebar-header">
            <h2>{t("settings")}</h2>
            {isOpen && (
                <div className="sidebar-toggle-top-right">{toggleButton}</div>
            )}
          </div>
          <div className="gameSettingsSidebar-section">
            <label htmlFor="numPreguntas">{t("numQuestions")}</label>
            <select
                id="numPreguntas"
                name="numPreguntas"  // Asegúrate de que el "name" sea el correcto
                className="sidebar-select"
                value={config.numPreguntas}
                onChange={handleChange}
            >
              <option value={10}>10 {t("questions")}</option>
              <option value={20}>20 {t("questions")}</option>
              <option value={30}>30 {t("questions")}</option>
            </select>
          </div>
          <div className="gameSettingsSidebar-section">
            <label htmlFor="tiempoPregunta">{t("timePerQuestion")}</label>
            <select
                id="tiempoPregunta"
                name="tiempoPregunta"  // Asegúrate de que el "name" sea el correcto
                className="sidebar-select"
                value={config.tiempoPregunta}
                onChange={handleChange}
            >
              <option value={30}>30 {t("seconds")}</option>
              <option value={45}>45 {t("seconds")}</option>
              <option value={60}>60 {t("seconds")}</option>
            </select>
          </div>
          <div className="gameSettingsSidebar-section">
            <label htmlFor="limitePistas">{t("aiHintLimit")}</label>
            <select
                id="limitePistas"
                name="limitePistas"  // Asegúrate de que el "name" sea el correcto
                className="sidebar-select"
                value={config.limitePistas}
                onChange={handleChange}
            >
              <option value={3}>3 {t("hints")}</option>
              <option value={5}>5 {t("hints")}</option>
              <option value={7}>7 {t("hints")}</option>
            </select>
          </div>
          <div className="gameSettingsSidebar-section">
            <label htmlFor="modoJuego">{t("gameMode")}</label>
            <select
                id="modoJuego"
                name="modoJuego"  // Asegúrate de que el "name" sea el correcto
                className="sidebar-select"
                value={config.modoJuego}
                onChange={handleChange}
            >
              <option value="singleplayer">{t("singlePlayer")}</option>
              <option value="playerVsIA">{t("playerVsAI")}</option>
            </select>
          </div>
          <div className="sidebar-button-container">
            <BaseButton text={t("reset")} />
          </div>
        </div>
      </div>
  );
};

export default GameSettingsSidebar;
