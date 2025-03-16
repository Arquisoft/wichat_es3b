import React, { useState, useEffect } from "react";
import axios from "axios";
import "./ChatBox.css";
import ChatBubble from "../chatBubble/ChatBubble";
import ArrowUpwardIcon from "@mui/icons-material/ArrowUpward";

const ChatBox = ({ question, language = "es" }) => {
  const [messages, setMessages] = useState([]);
  const [hint, setHint] = useState("");
  const [isLoadingHint, setIsLoadingHint] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState("");

  const [input, setInput] = useState("");

  // Función simple para obtener una pista
  const getHint = async () => {
    setIsLoadingHint(true);
    setHint(""); // Limpiar pista anterior
    setLoadingMessage("...");

    try {
      // URL del gateway
      const URL = "http://localhost:8000/";

    /*
      // Datos para enviar al servicio LLM
     const requestData = {
        userQuestion: input,
        question: question,
        idioma: language,
        model: "empathy"
      };
      */

      const requestData = {
        userQuestion: input,
        question: question,
        idioma: "es",
        model: "empathy"
      };

      // Llamar al servicio LLM
      const response = await axios.post(`${URL}askllm`, requestData);

      // Mostrar la pista
      // Hasta aquí llega
      setHint(response.data.answer);
      console.log("Respuesta en el chatBox: " + response.data.answer)

      setMessages((prevMessages) => [
        ...prevMessages,
        { text: hint, isSender: false },
      ]);
    } catch (error) {
      console.error("Error al obtener pista:", error);
      setHint("No se pudo obtener una pista en este momento.");
      setMessages((prevMessages) => [
        ...prevMessages,
        { text: hint, isSender: false },
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

  return (
    <div className="chat-box">
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
          placeholder="Pídele una pista a la IA..."
        />
        <ArrowUpwardIcon
          titleAccess="Envía un mensaje"
          fontSize="1.5em"
          id="sendMessageToAIButton"
          onClick={handleSend}
        />
      </div>
    </div>
  );
};

export default ChatBox;
