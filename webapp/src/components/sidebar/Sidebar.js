"use client";

import { useEffect } from "react";
import "./Sidebar.css";
import { useTranslation } from "react-i18next";
import UserAvatar from "../userAvatar/UserAvatar";

// Componente para la barra lateral con información del usuario
export default function Sidebar({ userData, isVisible, onClose }) {
  useEffect(() => {
    return () => {};
  }, [isVisible]);

  const { t } = useTranslation();

  return (
    <>
      <aside className={`sidebar ${isVisible ? "visible" : ""}`}>
        <div className="sidebar-header">
          <div className="user-header">
            <h2>{userData.username}</h2>
          </div>

          <div className="avatar-container">
            <UserAvatar username={userData.username}></UserAvatar>
          </div>
        </div>

        <div className="user-stats">
          <div className="stat-item">
            <span className="stat-label">{`${t("gamesPlayed")}:`}</span>
            <span className="stat-value">{userData.stats.gamesPlayed}</span>
          </div>

          <div className="stat-item">
            <span className="stat-label">{`${t("rightQuestions")}:`}</span>
            <span className="stat-value">{userData.stats.correctAnswers}</span>
          </div>

          <div className="stat-item">
            <span className="stat-label">{`${t("wrongQuestions")}:`}</span>
            <span className="stat-value">{userData.stats.wrongAnswers}</span>
          </div>

          <div className="stat-item">
            <span className="stat-label">{`${t("rightAnswersRatio")}:`}</span>
            <span className="stat-value">{userData.stats.ratio}</span>
          </div>

          <div className="stat-item">
            <span className="stat-label">{`${t("averageTime")}:`}</span>
            <span className="stat-value">{userData.stats.averageTime}</span>
          </div>

          <div className="stat-item">
            <span className="stat-label">{`${t("bestScore")}:`}</span>
            <span className="stat-value">{userData.stats.bestScore}</span>
          </div>
        </div>
      </aside>

      {isVisible && (
        <div
          className="sidebar-overlay"
          onClick={onClose}
          aria-hidden="true"
        ></div>
      )}
    </>
  );
}
