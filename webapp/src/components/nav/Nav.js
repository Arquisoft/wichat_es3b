import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import "./Nav.css";
import LanguageChangeMenu from "../languageChangeMenu/LanguageChangeMenu";

const Nav = () => {
    const navigate = useNavigate();
    const [isAuthenticated, setIsAuthenticated] = useState(false);

    useEffect(() => {
        const token = localStorage.getItem("token");
        setIsAuthenticated(!!token);
    }, []);

    const handleLogout = () => {
        localStorage.removeItem("token");
        localStorage.removeItem("username");
        setIsAuthenticated(false);
        navigate("/auth");
    };

    return (
        <nav className="navbar">
            <Link className="nav-title" to="/home">
                WiChat
            </Link>
            <div className="nav-center">
                <Link to="/home">Inicio</Link>
                {isAuthenticated && <Link to="/play">Jugar</Link>}
                {isAuthenticated && <Link to="/profile">Perfil</Link>}
            </div>
            <div className="nav-right">
                {isAuthenticated ? (
                    <Link to="#" state= {{loginView: true}} onClick={handleLogout}>
                        Cerrar Sesión
                    </Link>
                ) : (
                    <Link to="/auth" state={{ loginView: true }}>
                        Iniciar Sesión
                    </Link>
                )}
                <LanguageChangeMenu />
            </div>
        </nav>
    );
};

export default Nav;
