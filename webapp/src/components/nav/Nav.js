import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import "./Nav.css";
import LanguageChangeMenu from "../languageChangeMenu/LanguageChangeMenu";
import { useTranslation } from "react-i18next";

const Nav = () => {
  const navigate = useNavigate();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const { t } = useTranslation();

  useEffect(() => {
    const token = localStorage.getItem("token");
    setIsAuthenticated(!!token);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("username");
    setIsAuthenticated(false);
    navigate("/home");
  };

  return (
    <nav className="navbar">
      <Link className="nav-title" to="/home">
        {t("title")}
      </Link>
      <div className="nav-center">
        <Link to="/home">{t("home")}</Link>
        {isAuthenticated && <Link to="/play">{t("play")}</Link>}
        {isAuthenticated && <Link to="/profile">{t("profile")}</Link>}
      </div>
      <div className="nav-right">
        {isAuthenticated ? (
          <Link
            to="/home"
            onClick={(e) => {
              e.preventDefault(); // Evita la navegación inmediata
              handleLogout();
            }}
          >
            {t("logout")}
          </Link>
        ) : (
          <Link to="/auth" state={{ loginView: true }}>
            {t("login")}
          </Link>
        )}
        <LanguageChangeMenu />
      </div>
    </nav>
  );
};

export default Nav;
