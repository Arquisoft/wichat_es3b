import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import "./Nav.css";
import BaseButton from "../button/BaseButton";
import LanguageChangeMenu from "../languageChangeMenu/LanguageChangeMenu";

const Nav = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();

  const handleSignupClick = () => {
    navigate("/auth", { state: { loginView: false } });
  };

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
          <BaseButton
            text={t("signup")}
            onClick={handleSignupClick}
            buttonType="buttonSecondary"
          ></BaseButton>
        </div>
        <LanguageChangeMenu></LanguageChangeMenu>
      </div>
    </nav>
  );
};

export default Nav;
