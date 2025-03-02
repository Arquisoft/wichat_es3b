import React, { useEffect, useState } from "react";
import "./PhotoPanel.css";

const INTERVAL_DURATION = 100;

function PhotoPanel({ text }) {
  // Para el efecto de máquina de escribir. Ajustamos un intervalo para que el texto se vaya mostrando en el panel
  const [displayedText, setDisplayText] = useState("");

  useEffect(() => {
    const startTyping = () => {
      let i = 0;
      const interval = setInterval(() => {
        if (i < text.length) {
          setDisplayText((prev) => prev + text.charAt(i));
          i++;
        } else {
          clearInterval(interval);
        }
      }, INTERVAL_DURATION); // Se mostrará cada 100 ms
    };
    // Tiempo pequeño para que el primer caracter se muestre correctamente
    const timeoutId = setTimeout(startTyping, 10);

    return () => clearTimeout(timeoutId);
  }, [text]);

  return (
    <div className="image-panel">
      <div className="blue-panel">
        <p className="text">{displayedText}</p>
      </div>
    </div>
  );
}
export default PhotoPanel;
