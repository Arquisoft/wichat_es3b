import React, { useState } from "react";
import Login from "../../components/login/Login";
import AddUser from "../../components/addUser/AddUser";
import { CSSTransition } from "react-transition-group";
import "./AuthForm.css";

function AuthForm() {
  const TIMEOUT_MS = 300;
  const [showLogin, setShowLogin] = useState(true);

  const handleToggleView = () => {
    setShowLogin(!showLogin);
  };

  return (
    <div className="authForm">
      <CSSTransition
        in={showLogin}
        timeout={TIMEOUT_MS}
        classNames="fade"
        unmountOnExit
      >
        <Login handleToggleView={handleToggleView}></Login>
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
