import {useEffect, useState} from "react";
import "../sidebar/Sidebar.css";

// Componente para la barra lateral con configuración del juego
export default function Sidebar({ isVisible, onClose }) {

    const [config, setConfig] = useState({
        numPreguntas: 10,
        tiempoPregunta: 30,
        limitePistas: 3,
        modoJuego: "Jugador vs IA",
    });

    const handleChange = (e) => {
        setConfig((prev) => ({ ...prev, [e.target.name]: e.target.value }));
        localStorage.setItem("quizConfig", JSON.stringify({ ...config, [e.target.name]: e.target.value }));
    };

    // Prevenir scroll del sidebar cuando está abierto en móviles
    useEffect(() => {
        return () => {
            // No es necesario hacer nada aquí
        };
    }, [isVisible]);

    return (
        <>
            <aside className={`sidebar ${isVisible ? "visible" : ""}`}>
                <div className="sidebar-header">
                    <h2>Configuración</h2>
                </div>

                <div className="sidebar-content">
                    <label>
                        Número de preguntas
                        <select name="numPreguntas" onChange={handleChange} value={config.numPreguntas}>
                            <option>10 preguntas</option>
                            <option>20 preguntas</option>
                            <option>30 preguntas</option>
                        </select>
                    </label>

                    <label>
                        Tiempo por pregunta
                        <select name="tiempoPregunta" onChange={handleChange} value={config.tiempoPregunta}>
                            <option>30 segundos</option>
                            <option>45 segundos</option>
                            <option>60 segundos</option>
                        </select>
                    </label>

                    <label>
                        Límite de pistas IA
                        <select name="limitePistas" onChange={handleChange} value={config.limitePistas}>
                            <option>3 pistas</option>
                            <option>5 pistas</option>
                            <option>7 pistas</option>
                        </select>
                    </label>

                    <label>
                        Modo de juego
                        <select name="modoJuego" onChange={handleChange} value={config.modoJuego}>
                            <option>Jugador vs IA</option>
                            <option>Cooperativo</option>
                            <option>Contra Reloj</option>
                        </select>
                    </label>

                    <button className="reset-button">Restablecer</button>
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
