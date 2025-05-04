import React, { useState } from "react";
import InfoDialog from "../../components/infoDialog/InfoDialog";
import { Copy } from "lucide-react";
import "./ApiKeyGenerator.css";
import BaseButton from "../../components/button/BaseButton";
import Nav from "../../components/nav/Nav";
import Footer from "../../components/Footer";
import WiChatTextField from "../../components/textField/WiChatTextField";
import axios from "axios";
import useSubmitOnEnter from ".././../hooks/useSubmitOnEnter";
import { useTranslation } from "react-i18next";

const ApiKeyGenerator = () => {
  const [email, setEmail] = useState("");
  const [showDialog, setShowDialog] = useState(false);
  const [apiKey, setApiKey] = useState("");
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState("");
  const { t } = useTranslation();

  const GATEWAY_URL =
    process.env.REACT_APP_GATEWAY_SERVICE_URL || "http://localhost:8000";

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post(`${GATEWAY_URL}/generate-apikey`, {
        email,
      });
      setApiKey(response.data.apiKey);
      setShowDialog(true);
      setError("");
    } catch (error) {
      const code = error.response?.data?.errorCode;
      setError(t(`errors.${code}`) || t("errors.GENERIC"));
      setShowDialog(true);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(apiKey);
    setCopied(true);

    setTimeout(() => {
      setCopied(false);
    }, 2000);
  };

  const closeDialog = () => {
    setShowDialog(false);
    setEmail("");
  };

  const handleKeyDown = useSubmitOnEnter((e) => handleSubmit(e));

  const apiKeyDialogContent = (
    <div className="api-key-content">
      {error ? (
        <p>{error}</p>
      ) : (
        <>
          <p>{t("askForAPIKeySuccessfulResponse")}</p>
          <div className="api-key-display">
            <input
              type="text"
              value={apiKey}
              readOnly
              className="api-key-input"
            ></input>
            <button
              className="copy-button"
              onClick={copyToClipboard}
              title="Copiar al portapapeles"
            >
              <Copy size={20} />
            </button>
          </div>
          {copied && <p className="copied-message">{t("copiedToPortfolio")}</p>}
        </>
      )}
    </div>
  );

  return (
    <div className="main-container">
      <Nav></Nav>
      <div className="api-key-container">
        <h1>{t("askForAPIKeyTitle")}</h1>
        <p className="api-key-instructions">{t("askForAPIKeyInstructions")}</p>

        <div className="form-group">
          <label htmlFor="api-key-email">{t("email")}</label>
          <WiChatTextField
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onKeyDown={handleKeyDown}
          />
        </div>
        <BaseButton
          text={t("generateAPIKey")}
          onClick={handleSubmit}
        ></BaseButton>
        {showDialog && (
          <div className="dialog-overlay">
            <div className="dialog-wrapper">
              <InfoDialog
                title={error ? "Error" : "API Key"}
                content={apiKeyDialogContent}
                onClose={closeDialog}
                variant={error ? "error" : "info"}
              />
            </div>
          </div>
        )}
      </div>
      <Footer></Footer>
    </div>
  );
};

export default ApiKeyGenerator;
