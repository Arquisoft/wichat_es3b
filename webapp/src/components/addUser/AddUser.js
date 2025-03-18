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

const apiEndpoint =
  process.env.REACT_APP_API_ENDPOINT || "http://localhost:8000";


const AddUser = ({ handleToggleView }) => {
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [showPasswordConfirm, setShowPasswordConfirm] = useState("");

  const [error, setError] = useState("");
  const [openSnackbar, setOpenSnackbar] = useState(false);

  const { t } = useTranslation();

  const addUser = async () => {
    try {
      await axios.post(`${apiEndpoint}/adduser`, { username, password });
      setOpenSnackbar(true);
    } catch (error) {
      setError(error.response.data.error);
    }
  };

  const toggleShowPassword = () => {
    setShowPassword(!showPassword);
  };

  const toggleShowPasswordConfirm = () => {
    setShowPasswordConfirm(!showPassword);
  };

  const handleCloseSnackbar = () => {
    setOpenSnackbar(false);
  };

  return (
    <div className="mainDiv">
      <PhotoPanel
        text={t("panel_text")}
      />
      <div className="form">
        <h1>{t("createAccount")}</h1>
        <h2>{t("introduceData")}</h2>

        <div className="formField">
          <label>{t("email")}</label>
          <WiChatTextField
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
        <div className="formField">
          <label>{t("username")}</label>
          <WiChatTextField
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />
        </div>
        <div className="formField">
          <label>{t("password")}</label>
          <div className="passwordContainer">
            <WiChatTextField
              value={password}
              type={showPassword ? "text" : "password"}
              onChange={(e) => setPassword(e.target.value)}
            />
            <span onClick={toggleShowPassword}>👁️‍🗨️</span>
          </div>
        </div>

        <div className="formField">
          <label>{t("confirmPassword")}</label>
          <div className="passwordContainer">
            <WiChatTextField
              value={passwordConfirm}
              type={showPasswordConfirm ? "text" : "password"}
              onChange={(e) => setPasswordConfirm(e.target.value)}
            />
            <span onClick={toggleShowPasswordConfirm}>👁️‍🗨️</span>
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
