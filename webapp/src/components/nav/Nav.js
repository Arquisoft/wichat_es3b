import React from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import "./Nav.css";
import LanguageChangeMenu from "../languageChangeMenu/LanguageChangeMenu";

const Nav = () => {
  const { t } = useTranslation();

  return (
    <nav className="navbar">
      <Link className="nav-title" to="/home">
        {t("title")}
      </Link>

      <div className="nav-center">
        <div className="nav-links">
          <Link to="/home">{t("home")}</Link>
          <Link to="/play">{t("play")}</Link>
          <Link to="/profile">{t("profile")}</Link>
        </div>
      </div>

      <div className="nav-right">
        <div className="auth-links">
          <Link to="/auth" state={{ loginView: true }}>
            {t("login")}
          </Link>
        </div>
        <LanguageChangeMenu></LanguageChangeMenu>
      </div>
    </nav>
  );
};

export default Nav;
