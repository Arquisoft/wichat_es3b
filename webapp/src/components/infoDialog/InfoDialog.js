import React from "react";
import BaseButton from "../button/BaseButton";
import "./InfoDialog.css";
import { useTranslation } from "react-i18next";

const InfoDialog = ({ title, content, onClose, variant="info" }) => {
  const {t} = useTranslation();
  return (
    <div className={`dialogContainer ${variant}`}>
      <h1>{title}</h1>
      <div className="dialogMessageContainer">{content}</div>
      <div className="dialogButtonContainer">
        <BaseButton text={t("understood")} onClick={onClose}></BaseButton>
      </div>
    </div>
  );
};

export default InfoDialog;
