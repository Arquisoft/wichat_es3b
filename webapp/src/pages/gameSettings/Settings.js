import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "../../components/sidebarConfiguration/SidebarConfiguration";
import SidebarToggleButton from "../../components/sidebarToggleButton/SidebarToggleButton";
import "./Settings.css";
import Footer from "../../components/Footer";
import Navbar from "../../components/nav/Nav";

export default function Settings() {
    const [sidebarVisible, setSidebarVisible] = useState(true);
    const navigate = useNavigate(); // Hook para la navegación
    const toggleSidebar = () => {
        setSidebarVisible(!sidebarVisible);
    };
    const [selectedCategories, setSelectedCategories] = useState(() => {
        const storedConfig = JSON.parse(localStorage.getItem("quizConfig"));
        return storedConfig?.categories || [];
    });
    const closeSidebar = () => setSidebarVisible(false);

    const categories = [
        { name: "Fútbol", value: "clubes" },
        { name: "Cine", value: "cine" },
        { name: "Literatura", value: "literatura" },
        { name: "Países", value: "paises" },
        { name: "Arte", value: "arte" },
        { name: "Todo", value: "all" },
    ];
    const [, forceUpdate] = useState(0); // Un estado que forzará el re-render

    useEffect(() => {
        const storedConfig = JSON.parse(localStorage.getItem("quizConfig"));
        if (storedConfig?.categories) {
            setSelectedCategories(storedConfig.categories);
            forceUpdate(prev => prev + 1);
        }
    }, []);

    useEffect(() => {
        const storedConfig = JSON.parse(localStorage.getItem("quizConfig"));
        if (storedConfig?.categories) {
            setSelectedCategories(storedConfig.categories);
        }
    }, []);

    const toggleCategory = (categoryValue) => {
        if (categoryValue === "all") {
            setSelectedCategories(["all"]);
        } else {
            setSelectedCategories((prev) => {
                const isAlreadySelected = prev.includes(categoryValue);
                let newSelection = isAlreadySelected
                    ? prev.filter((c) => c !== categoryValue)
                    : [...prev.filter((c) => c !== "all"), categoryValue];

                // Si todas las categorías son deseleccionadas, "Todo" se selecciona
                if (newSelection.length === 0) {
                    newSelection = ["all"];
                }

                return newSelection;
            });
        }
    };

    useEffect(() => {
        const config = JSON.parse(localStorage.getItem("quizConfig")) || {};
        config.categories = selectedCategories;
        localStorage.setItem("quizConfig", JSON.stringify(config));
    }, [selectedCategories]);

    return (
        <div className="app-container">
            <Navbar />
            <div className={`main-content ${sidebarVisible ? "with-sidebar" : ""}`}>
                <SidebarToggleButton onClick={toggleSidebar} />
                <div className="sidebar-stats">
                    <Sidebar isVisible={sidebarVisible} onClose={() => setSidebarVisible(false)} />
                </div>

                <div className="content-area">
                    <h1>Selecciona una categoría</h1>
                    <div className="category-grid">
                        {categories.map(({ name, value }) => (
                            <div
                                key={value}
                                className={`category-card ${selectedCategories.includes(value) ? "selected" : ""}`}
                                onClick={() => toggleCategory(value)}
                            >
                                <h3>{name}</h3>
                            </div>
                        ))}
                    </div>

                    <button
                        className="play-button"
                        disabled={selectedCategories.length === 0}
                        onClick={() => navigate("/play")}
                    >
                        Jugar
                    </button>
                </div>
            </div>
            <Footer />
        </div>
    );
}
