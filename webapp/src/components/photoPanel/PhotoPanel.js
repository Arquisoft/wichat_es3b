import React, { useEffect, useState } from "react";
import "./PhotoPanel.css";

const INTERVAL_DURATION = 100;

function PhotoPanel({ text }) {
  // Para el efecto de máquina de escribir. Ajustamos un intervalo para que el texto se vaya mostrando en el panel
  const [displayedText, setDisplayedText] = useState("");

  useEffect(() => {
    setDisplayedText(""); // Reiniciamos el texto antes de comenzar

    let i = 0;
    const interval = setInterval(() => {
      if (i < text.length) {
        setDisplayedText((prev) => prev + text.charAt(i));
        i++;
      } else {
        clearInterval(interval);
      }
    }, INTERVAL_DURATION);

    return () => clearInterval(interval); // Evita que haya múltiples intervalos activos si text cambia muy rápido
  }, [text]); // Se ejecuta únicamente cada vez que text cambie (1 vez).

  return (
    <div className="image-panel">
      <div className="blue-panel">
        <p className="text">{displayedText}</p>
      </div>
    </div>
  );
}
export default PhotoPanel;
