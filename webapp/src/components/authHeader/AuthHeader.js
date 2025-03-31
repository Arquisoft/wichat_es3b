import React from 'react';
import './AuthHeader.css';
import logo from "../../assets/img/logo_base.png";
import LanguageChangeMenu from "../../components/languageChangeMenu/LanguageChangeMenu";

const AuthHeader = () => {
  return (
    <div className="authHeader">
        <img className="logoAuth" src={logo} alt="Logo de WiChat" />
        <LanguageChangeMenu variant='secondary'/>
    </div>
  )
}

export default AuthHeader;