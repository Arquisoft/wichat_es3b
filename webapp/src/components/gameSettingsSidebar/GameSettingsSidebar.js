import React from "react";
import "./GameSettingsSidebar.css";
import { useTranslation } from "react-i18next";
import BaseButton from "../button/BaseButton";

const GameSettingsSidebar = ({ isOpen, toggleButton }) => {
  const { t } = useTranslation();

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
          <label htmlFor="numQuestions">{t("numQuestions")}</label>
          <select id="numQuestions" className="sidebar-select">
            <option value="10">10 {t("questions")}</option>
            <option value="20">20 {t("questions")}</option>
            <option value="30">30 {t("questions")}</option>
          </select>
        </div>
        <div className="gameSettingsSidebar-section">
          <label htmlFor="timePerQuestion">{t("timePerQuestion")}</label>
          <select id="timePerQuestion" className="sidebar-select">
            <option value="30">30 {t("seconds")}</option>
            <option value="45">45 {t("seconds")}</option>
            <option value="60">60 {t("seconds")}</option>
          </select>
        </div>
        <div className="gameSettingsSidebar-section">
          <label htmlFor="aiHints">{t("aiHintLimit")}</label>
          <select id="aiHints" className="sidebar-select">
            <option value="3">3 {t("hints")}</option>
            <option value="5">5 {t("hints")}</option>
            <option value="10">10 {t("hints")}</option>
          </select>
        </div>
        <div className="gameSettingsSidebar-section">
          <label htmlFor="gameMode">{t("gameMode")}</label>
          <select id="gameMode" className="sidebar-select">
            <option value="singleplayer">{t("singlePlayer")}</option>
            <option value="playerVsAI">{t("playerVsAI")}</option>
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
