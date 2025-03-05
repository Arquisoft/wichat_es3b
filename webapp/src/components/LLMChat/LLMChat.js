import { useState } from "react";
import axios from "axios";

import { Button, Container, Divider, TextField, Typography } from "@mui/material";

const LLMChat = () => {
    const [messages, setMessages] = useState([]);
    const [question, setQuestion] = useState("");

    const apiEndpoint = process.env.REACT_APP_API_ENDPOINT || 'http://localhost:8000';

    const sendMessage = async () => {
        if (!question.trim()) return;

        let newMessage = { sender: "user", text: question };
        setMessages(previous => [...previous, newMessage]);
        setQuestion("");
        
        try {
            // create the history of messages (the memory of the llm) and send it through the gateway
            const history = [...messages, newMessage].map(message => `${message.sender}: ${message.text}`).join("\n");
            const response = await axios.post(`${apiEndpoint}/askllm`, { question: history, model: "empathy" });
            
            setMessages(previous => [...previous, { sender: "llm", text: response.data.answer }]);
        } catch (error) {
            console.error("Error sending message to LLM:", error.message || error);
            setMessages(previous => [...previous, { sender: "llm", text: "An unexpected error has occurred." }]);
        }
    }

    return (
        <Container sx={{display: "flex", flexDirection: "column", gap: 1, padding: 1, border: "5px solid #ccc", borderRadius: 5, height: "50vh"}}>
            <Container fullWidth sx={{padding: 1, bgcolor: "#1976d2", color: "white", borderRadius: 1 }}>
                <Typography variant="h3" align="center">TipBot</Typography>
            </Container>
            <Divider />
            <Container sx={{display: "flex", flexDirection: "column", overflow: "hidden", overflowY: "auto"}}>
                {messages.map((message, index) => (
                    <Typography key={index} sx={{
                        maxWidth: "80%",
                        alignSelf: message.sender === "user" ? "flex-end" : "flex-start",
                        padding: 1,
                        margin: 1,
                        bgcolor: message.sender === "user" ? "#1976d2" : "#eee",
                        color: message.sender === "user" ? "white" : "black",
                        borderRadius: 1
                    }}>
                        {message.text}
                    </Typography>
                ))}
            </Container>
            <Divider />
            <TextField
                fullWidth
                multiline
                placeholder="Ask for a hint"
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
            />
            <Button onClick={sendMessage}>Send</Button>
        </Container>
    );
}

export default LLMChat;