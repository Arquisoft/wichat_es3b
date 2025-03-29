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

        if (name === "numPreguntas" || name === "tiempoPregunta" || name === "limitePistas") {
            updatedValue = parseInt(value.split(" ")[0]);
        }
        const updatedConfig = {
            ...config,
            [name]: updatedValue,
            categories: config.categories
        };
        setConfig(updatedConfig);
        localStorage.setItem("quizConfig", JSON.stringify(updatedConfig));
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
                            <option value={10}>10 preguntas</option>
                            <option value={20}>20 preguntas</option>
                            <option value={30}>30 preguntas</option>
                        </select>
                    </label>

                    <label>
                        Tiempo por pregunta
                        <select name="tiempoPregunta" onChange={handleChange} value={config.tiempoPregunta}>
                            <option value={30}>30 segundos</option>
                            <option value={45}>45 segundos</option>
                            <option value={60}>60 segundos</option>
                        </select>
                    </label>

                    <label>
                        Límite de pistas IA
                        <select name="limitePistas" onChange={handleChange} value={config.limitePistas}>
                            <option value={3}>3 pistas</option>
                            <option value={5}>5 pistas</option>
                            <option value={7}>7 pistas</option>
                        </select>
                    </label>

                    <label>
                        Modo de juego
                        <select name="modoJuego" onChange={handleChange} value={config.modoJuego}>
                            <option value="Jugador vs IA">Jugador vs IA</option>
                            <option value="Cooperativo">Cooperativo</option>
                            <option value="Contra Reloj">Contra Reloj</option>
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
