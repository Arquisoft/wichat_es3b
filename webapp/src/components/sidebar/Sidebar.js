"use client";

import { useEffect } from "react";
import "./Sidebar.css";

// Componente para la barra lateral con información del usuario
export default function Sidebar({ userData, isVisible, onClose }) {

  useEffect(() => {
    return () => {
    };
  }, [isVisible]);

  return (
    <>
      <aside className={`sidebar ${isVisible ? "visible" : ""}`}>
        <div className="sidebar-header">
          <div className="user-header">
            <h2>{userData.username}</h2>
          </div>

          <div className="avatar-container">
            <img
              src={userData.avatar || "/placeholder.svg"}
              alt="Avatar de usuario"
              className="avatar"
            />
          </div>
        </div>

        <div className="user-stats">
          <div className="stat-item">
            <span className="stat-label">Partidas jugadas:</span>
            <span className="stat-value">{userData.stats.gamesPlayed}</span>
          </div>

          <div className="stat-item">
            <span className="stat-label">Preguntas acertadas:</span>
            <span className="stat-value">{userData.stats.correctAnswers}</span>
          </div>

          <div className="stat-item">
            <span className="stat-label">Preguntas falladas:</span>
            <span className="stat-value">{userData.stats.wrongAnswers}</span>
          </div>

          <div className="stat-item">
            <span className="stat-label">Ratio de aciertos:</span>
            <span className="stat-value">{userData.stats.ratio}</span>
          </div>

          <div className="stat-item">
            <span className="stat-label">Tiempo promedio:</span>
            <span className="stat-value">{userData.stats.averageTime}</span>
          </div>

          <div className="stat-item">
            <span className="stat-label">Mejor puntuación:</span>
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
