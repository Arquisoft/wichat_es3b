import React, { useState } from "react";
import Login from "../../components/login/Login";
import AddUser from "../../components/addUser/AddUser";
import { CSSTransition } from "react-transition-group";
import "./AuthForm.css";
import { useLocation } from "react-router-dom";
import logo from "../../assets/img/logo_base.png";
import LanguageChangeMenu from "../../components/languageChangeMenu/LanguageChangeMenu"; // Asegúrate de importar el logo

function AuthForm() {
    const location = useLocation();
    const loginView = location.state?.loginView || true;
    const TIMEOUT_MS = 300;
    const [showLogin, setShowLogin] = useState(loginView);

    const handleToggleView = () => {
        setShowLogin(!showLogin);
    };

    return (
        <div className="authForm">
            <div className="authHeader">
                <img className="logoAuth" src={logo} alt="Logo de WiChat" />
                <div
                    className={`language-menu ${showLogin ? 'language-menu-left' : 'language-menu-right'}`}
                >
                    <LanguageChangeMenu />
                </div>
            </div>

            <CSSTransition
                in={showLogin}
                timeout={TIMEOUT_MS}
                classNames="fade"
                unmountOnExit
            >
                <Login handleToggleView={handleToggleView} />
            </CSSTransition>

            <CSSTransition
                in={!showLogin}
                timeout={TIMEOUT_MS}
                classNames="fade"
                unmountOnExit
            >
                <AddUser handleToggleView={handleToggleView} />
            </CSSTransition>
        </div>
    );
}


export default AuthForm;
