"use client"

import { useEffect } from "react"
import "./sidebar.css"

// Componente para la barra lateral con información del usuario
export default function Sidebar({ userData, isVisible, onClose }) {
  // Prevenir scroll del sidebar cuando está abierto en móviles
  useEffect(() => {
    // No necesitamos bloquear el scroll de toda la página
    // Solo asegurarnos de que el sidebar tenga su propio scroll

    // Limpieza al desmontar
    return () => {
      // No es necesario hacer nada aquí
    }
  }, [isVisible])

  return (
    <>
      <aside className={`sidebar ${isVisible ? "visible" : ""}`}>
        <div className="sidebar-header">
          <div className="user-header">
            <h2>{userData.username}</h2>
            <button className="menu-button" onClick={onClose} aria-label="Cerrar menú">
              <span></span>
              <span></span>
              <span></span>
            </button>
          </div>

          <div className="avatar-container">
            <img src={userData.avatar || "/placeholder.svg"} alt="Avatar de usuario" className="avatar" />
          </div>
        </div>

        <div className="user-stats">
          {/* Estadísticas del usuario */}
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

          <div className="stat-item">
            <span className="stat-label">Mayor racha de aciertos:</span>
            <span className="stat-value">{userData.stats.bestStreak}</span>
          </div>
        </div>
      </aside>

      {/* Overlay para cerrar el sidebar en móviles */}
      {isVisible && <div className="sidebar-overlay" onClick={onClose} aria-hidden="true"></div>}
    </>
  )
}

