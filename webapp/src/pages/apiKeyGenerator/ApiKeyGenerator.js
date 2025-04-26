import React, { useState } from "react";
import InfoDialog from "../../components/infoDialog/InfoDialog";
import { Copy } from "lucide-react";
import "./ApiKeyGenerator.css";
import BaseButton from "../../components/button/BaseButton";
import Nav from "../../components/nav/Nav";
import Footer from "../../components/Footer";
import WiChatTextField from '../../components/textField/WiChatTextField';

const ApiKeyGenerator = () => {
  const [email, setEmail] = useState("");
  const [showDialog, setShowDialog] = useState(false);
  const [apiKey, setApiKey] = useState("");
  const [copied, setCopied] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    const generatedKey = "32402DSKAWADSNDFGJ2";
    setApiKey(generatedKey);
    setShowDialog(true);
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

  const apiKeyDialogContent = (
    <div className="api-key-content">
      <p>
        Esta es la API key que ha solicitado para utilizar nuestros servicios.
        Asegúrese de almacenarla en un lugar seguro.
      </p>

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

      {copied && <p className="copied-message">¡Copiado al portapapeles!</p>}
    </div>
  );

  return (
    <div className="main-container">
        <Nav></Nav>
      <div className="api-key-container">
        <h1>Solicitar API key</h1>
        <p className="api-key-instructions">
          Ingresa tu correo electrónico para generar una API key y acceder a
          nuestros servicios.
        </p>

        <div className="form-group">
          <label htmlFor="api-key-email">Correo electrónico</label>
          <WiChatTextField
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
        <BaseButton text="Generar API Key" onClick={handleSubmit}></BaseButton>
        {showDialog && (
          <div className="dialog-overlay">
            <div className="dialog-wrapper">
              <InfoDialog
                title="API Key"
                content={apiKeyDialogContent}
                onClose={closeDialog}
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
