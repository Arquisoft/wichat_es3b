// src/components/Login.js
import React, { useState } from "react";
import axios from "axios";
import { Snackbar } from "@mui/material";
import BaseButton from "../button/BaseButton";
import WiChatTextField from "../textField/WiChatTextField";
import PhotoPanel from "../photoPanel/PhotoPanel";
import "../login/Login.css";
import "../../assets/global.css";
import { useTranslation } from "react-i18next";
import AuthHeader from "../authHeader/AuthHeader";
import useSubmitOnEnter from "../../hooks/useSubmitOnEnter";

const apiEndpoint =
  process.env.REACT_APP_GATEWAY_SERVICE_URL || "http://localhost:8000";

const AddUser = ({ handleToggleView }) => {
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showPasswordConfirm, setShowPasswordConfirm] = useState(false);
  const [error, setError] = useState("");
  const [openSnackbar, setOpenSnackbar] = useState(false);
  const { t } = useTranslation();

  const addUser = async () => {
    if (!email) {
      setError(t("emptyEmail"));
      return;
    } else if (!username) {
      setError(t("emptyUsername"));
      return;
    } else if (!password) {
      setError(t("emptyPassword"));
      return;
    } else if (!passwordConfirm) {
      setError(t("emptyPasswordConfirm"));
      return;
    }
    if (password !== passwordConfirm) {
      setError(t("passwordsDoNotMatch"));
      return;
    }
    try {
      await axios.post(`${apiEndpoint}/adduser`, { email, username, password });
      setOpenSnackbar(true);
    } catch (error) {
      setError(error.response?.data?.error || t("addUserError"));
    }
  };

  const toggleShowPassword = () => {
    setShowPassword(!showPassword);
  };

  const toggleShowPasswordConfirm = () => {
    setShowPasswordConfirm(!showPasswordConfirm);
  };

  const handleCloseSnackbar = () => {
    setOpenSnackbar(false);
  };

  const handleKeyDown = useSubmitOnEnter(addUser);
  const handleShowPasswordKeyDown = (e, toggleFunction) => {
    if (e.key === "Enter") {
      toggleFunction();
    }
  };

  return (
    <div className="mainDiv">
      <PhotoPanel text={t("panel_text")} />
      <div className="form">
        <AuthHeader></AuthHeader>
        <h1>{t("createAccount")}</h1>
        <h2>{t("introduceData")}</h2>
        <div className="formField">
          <label htmlFor="email">{t("email")}</label>
          <WiChatTextField
            id="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onKeyDown={handleKeyDown}
          />
        </div>
        <div className="formField">
          <label htmlFor="username">{t("username")}</label>
          <WiChatTextField
            id="username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            onKeyDown={handleKeyDown}
          />
        </div>
        <div className="formField">
          <label htmlFor="password">{t("password")}</label>
          <div className="passwordContainer">
            <WiChatTextField
              id="password"
              value={password}
              type={showPassword ? "text" : "password"}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={handleKeyDown}
            />
            <span
              tabIndex={0}
              onClick={toggleShowPassword}
              onKeyDown={(e) =>
                handleShowPasswordKeyDown(e, toggleShowPassword)
              }
            >
              👁️‍🗨️
            </span>
          </div>
        </div>
        <div className="formField">
          <label htmlFor="confirmPassword">{t("confirmPassword")}</label>
          <div className="passwordContainer">
            <WiChatTextField
              id="confirmPassword"
              value={passwordConfirm}
              type={showPasswordConfirm ? "text" : "password"}
              onChange={(e) => setPasswordConfirm(e.target.value)}
              onKeyDown={handleKeyDown}
            />
            <span
              tabIndex={0}
              onClick={toggleShowPasswordConfirm}
              onKeyDown={(e) =>
                handleShowPasswordKeyDown(e, toggleShowPasswordConfirm)
              }
            >
              👁️‍🗨️
            </span>
          </div>
        </div>
        <div className="buttonPanel">
          <BaseButton text={t("createAccount")} onClick={addUser}></BaseButton>
          <span>{t("or")}</span>
          <BaseButton
            text={t("login")}
            onClick={handleToggleView}
            buttonType="buttonSecondary"
          ></BaseButton>
        </div>
        <Snackbar
          open={openSnackbar}
          autoHideDuration={6000}
          onClose={handleCloseSnackbar}
          message={t("loginSuccessful")}
        />
        {error && (
          <Snackbar
            open={!!error}
            autoHideDuration={6000}
            onClose={() => setError("")}
            message={`Error: ${error}`}
          />
        )}
      </div>
    </div>
  );
};

export default AddUser;
