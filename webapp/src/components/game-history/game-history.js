"use client";

import { useState } from "react";
import "./game-history.css";
import { useTranslation } from "react-i18next";

// Componente para mostrar el historial de partidas
export default function GameHistory({ games, currentIndex, onNavigate }) {
  const { t } = useTranslation();
  // Estado para controlar la animación
  const [isAnimating, setIsAnimating] = useState(false);

  // Función para manejar la navegación con animación
  const handleNavigate = (direction) => {
    if (isAnimating) return; // Evitar múltiples clics durante la animación

    setIsAnimating(true);
    onNavigate(direction);

    // Restablecer el estado después de que termine la animación
    setTimeout(() => {
      setIsAnimating(false);
    }, 500);
  };

  // Calcular qué juegos mostrar basados en el índice actual
  const getVisibleGames = () => {
    // Crear un array circular para manejar el carrusel
    const circularGames = [...games];

    // Obtener los 3 juegos a mostrar
    const visibleGames = [];
    for (let i = 0; i < 3; i++) {
      const index = (currentIndex + i) % games.length;
      visibleGames.push(circularGames[index]);
    }

    return visibleGames;
  };

  const visibleGames = games.length > 0 ? getVisibleGames() : [];

  return (
    <section className="history-section">
      <h2 className="section-title">{t("gameHistory")}</h2>

      <div className="carousel-container">
        {/* Botón de navegación izquierdo */}
        <button
          className="nav-button left"
          onClick={() => handleNavigate("prev")}
          disabled={isAnimating}
          aria-label="Ver partidas anteriores"
        >
          &lt;
        </button>

        {/* Contenedor del carrusel */}
        <div
          className={`game-cards-container ${isAnimating ? "animating" : ""}`}
        >
          {/* Tarjetas de partidas */}
          {visibleGames.map((game, index) => (
            <div
              key={`${game.id}-${index}`}
              className="game-card"
              style={{
                animationDelay: `${index * 0.1}s`,
              }}
            >
              <div className="game-date">{game.date}</div>
              <div className="game-number">#{game.id}</div>
              <div className="game-score">{`${game.score} ${t("points")}`}</div>
              <div className="game-correct">{`${game.correct} ${t(
                "rightQuestions"
              ).toLowerCase()}`}</div>
              <div className="game-ratio">
                {`${t("rightAnswersRatio")}: ${parseFloat(game.ratio).toFixed(
                  2
                )}`}
              </div>
              <div className="game-time">{`${t("time")}: ${game.time}`}</div>
            </div>
          ))}
        </div>

        {/* Botón de navegación derecho */}
        <button
          className="nav-button right"
          onClick={() => handleNavigate("next")}
          disabled={isAnimating}
          aria-label="Ver partidas siguientes"
        >
          &gt;
        </button>
      </div>

      {/* Indicadores de paginación */}
      <div className="pagination-dots">
        {games.length > 0 &&
          Array.from({ length: games.length }).map((_, index) => {
            const isActive = currentIndex === index;

            const handleDotNavigation = () => {
              if (isAnimating || isActive) return;

              setIsAnimating(true);
              const diff = index - currentIndex;
              const direction = diff > 0 ? "next" : "prev";
              const steps = Math.abs(diff);

              for (let i = 0; i < steps; i++) {
                setTimeout(() => onNavigate(direction), i * 100);
              }

              setTimeout(() => {
                setIsAnimating(false);
              }, steps * 100 + 500);
            };

            const handleKeyDown = (e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                handleDotNavigation();
              }
            };

            return (
              <span
                key={index}
                data-testid="pagination-dot"
                className={`pagination-dot ${isActive ? "active" : ""}`}
                onClick={handleDotNavigation}
                onKeyDown={handleKeyDown}
                tabIndex={0}
                role="button"
                aria-label={`Ir a la partida ${index + 1}`}
              />
            );
          })}
      </div>
    </section>
  );
}
