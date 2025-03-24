import React, { useState, useEffect } from "react";
import axios from "axios";
import "./ChatBox.css";
import ChatBubble from "../chatBubble/ChatBubble";
import ArrowUpwardIcon from "@mui/icons-material/ArrowUpward";

const ChatBox = ({ question, language = "es", isVisible }) => {
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

      const requestData = {
        userQuestion: input,
        question: question,
        idioma: "es",
        model: "empathy"
      };

      // Llamar al servicio LLM
      const response = await axios.post(`${URL}askllm`, requestData);

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

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSend();
    }
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

  if (!isVisible) return null;

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
              onKeyPress={handleKeyPress}
          />
          <button className="send-button" onClick={handleSend}>
            <ArrowUpwardIcon
                titleAccess="Envía un mensaje"
                fontSize="inherit"
                id="sendMessageToAIButton"
            />
          </button>
        </div>
      </div>
  );
};

export default ChatBox;