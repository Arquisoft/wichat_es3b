import React from "react";
import { Box, Typography } from "@mui/material";
import "./ChatBubble.css";

const ChatBubble = ({ message, isSender }) => {
  return (
    <Box className={`chat-container ${isSender ? "sent" : "received"}`}>
      <Box className={`chat-bubble ${isSender ? "sent" : "received"}`}>
        <Typography variant="body2">{message}</Typography>
      </Box>
    </Box>
  );
};

export default ChatBubble;
