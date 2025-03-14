import React, { useState } from 'react';
import './ChatBox.css';
import ChatBubble from '../chatBubble/ChatBubble';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';

const ChatBox = () => {
    const [messages, setMessages] = useState([
        {text: "¿Me das una pista?", isSender: true}, 
        {text: "Está en Italia", isSender: false},
        {text: "¿No podrías ser un poco más específico?", isSender: true},
        {text: "Se encuentra en Roma.", isSender: false}
    ]);

    const[input, setInput] = useState("");

    const handleSend = () => {
        if(input.trim() === "") return;
        setMessages([...messages, {text:input, isSender:true}]);
        setInput("");
    };

    return (
        <div className="chat-box">
          <div className="messages">
            {messages.map((msg, index) => (
              <ChatBubble key={index} message={msg.text} isSender={msg.isSender} />
            ))}
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
}

export default ChatBox