import { useState, useEffect } from "react";
import "./ChatBox.css";
import ChatBubble from "../chatBubble/ChatBubble";
import ArrowUpwardIcon from "@mui/icons-material/ArrowUpward";
import axios from "axios";
import { useTranslation } from "react-i18next";
import useSubmitOnEnter from "../../hooks/useSubmitOnEnter";

const ChatBox = ({
  question,
  language = "es",
  isVisible,
  hintsLeft,
  setHintsLeft,
}) => {
  const { t } = useTranslation();
  const [messages, setMessages] = useState([]);
  const [hint, setHint] = useState("");
  const [isLoadingHint, setIsLoadingHint] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState("");
  const [input, setInput] = useState("");

  // Función simple para obtener una pista
  const getHint = async () => {
    if (hintsLeft <= 0) {
      alert("No hay más pistas disponibles.");
      return;
    }
    setIsLoadingHint(true);
    setHint(""); // Limpiar pista anterior
    setLoadingMessage("...");

    try {
      const URL =
        process.env.REACT_APP_GATEWAY_SERVICE_URL || "http://localhost:8000";
      const requestData = {
        userQuestion: input,
        question: question,
        idioma: "es",
      };

      // Llamar al servicio LLM
      const response = await axios.post(`${URL}/askllm`, requestData);

      // Obtener la respuesta
      const answer = response.data.answer;

      // Actualizar el estado hint
      setHint(answer);
      console.log("Respuesta en el chatBox: " + answer);

      // Añadir el mensaje usando directamente answer, no hint
      setMessages((prevMessages) => [
        ...prevMessages,
        { text: answer, isSender: false },
      ]);
      setHintsLeft((prev) => prev - 1);
    } catch (error) {
      console.error("Error al obtener pista:", error);
      setHint(t("hintError"));
      setMessages((prevMessages) => [
        ...prevMessages,
        {
          text: t("hintError"),
          isSender: false,
        },
      ]);
    } finally {
      setIsLoadingHint(false);
    }
  };

  const handleSend = () => {
    if (input.trim() === "") return;
    setMessages([...messages, { text: input, isSender: true }]);
    setInput("");
    getHint();
  };

  const handleKeyDown = useSubmitOnEnter(handleSend);

  useEffect(() => {
    let interval;
    if (isLoadingHint) {
      let dots = 0;
      interval = setInterval(() => {
        dots = (dots + 1) % 4;
        setLoadingMessage(".".repeat(dots));
      }, 500); // Cambia cada 500ms
    } else {
      setLoadingMessage("");
    }
    return () => clearInterval(interval);
  }, [isLoadingHint]);

  if (!isVisible) return null;

  return (
    <div className="chat-box">
      <div className="chat-box-header">
        <span>{`${t("hintsLeft")}: `} </span>
        <span className={`hints-counter ${hintsLeft <= 0 ? "no-hints" : ""}`}>
          {hintsLeft}
        </span>
      </div>
      <div className="messages">
        {messages.map((msg, index) => (
          <ChatBubble key={index} message={msg.text} isSender={msg.isSender} />
        ))}
        {isLoadingHint && (
          <ChatBubble message={loadingMessage} isSender={false} />
        )}
      </div>
      <div className="input-container">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={hintsLeft > 0 ? t("askAIForHints") : t("noHintsLeft")}
          onKeyDown={handleKeyDown}
          disabled={hintsLeft <= 0}
        />
        <button
          className="send-button"
          onClick={handleSend}
          disabled={hintsLeft <= 0 || input.trim() === ""}
        >
          <ArrowUpwardIcon
            titleAccess={hintsLeft > 0 ? t("askAIForHints") : t("noHintsLeft")}
            fontSize="inherit"
            id="sendMessageToAIButton"
          />
        </button>
      </div>
    </div>
  );
};

export default ChatBox;
