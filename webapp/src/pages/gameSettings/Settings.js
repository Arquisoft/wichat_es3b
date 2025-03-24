import { useState } from "react";
import Sidebar from "../../components/sidebarConfiguration/SidebarConfiguration";
import SidebarToggleButton from "../../components/sidebarToggleButton/SidebarToggleButton";
import "./Settings.css";
import Footer from "../../components/Footer";
import Navbar from "../../components/nav/Nav";

export default function Settings() {
    const [sidebarVisible, setSidebarVisible] = useState(true);

    const toggleSidebar = () => {
        setSidebarVisible(!sidebarVisible);
    };

    const closeSidebar = () => setSidebarVisible(false);

    const categories = [
        { name: "Fútbol" },
        { name: "Cine"},
        { name: "Música"},
        { name: "Países"},
        { name: "Arte"},
        { name: "Todo"},
    ];

    return (
        <div className="app-container">
            <Navbar />
            <div className={`main-content ${sidebarVisible ? "with-sidebar" : ""}`}>
                <SidebarToggleButton onClick={toggleSidebar} />
                <div className="sidebar-stats">
                    <Sidebar isVisible={sidebarVisible} onClose={closeSidebar} />
                </div>

                <div className="content-area">
                <h1>Selecciona una categoría</h1>
                <div className="category-grid">
                    {categories.map((category) => (
                        <div key={category.name} className="category-card">
                            <h3>{category.name}</h3>
                        </div>
                    ))}
                </div>

                    <a href="/play">
                        <button className="play-button">Jugar</button>
                    </a>

                </div>
        </div>
            <Footer/>
        </div>
    );
}

