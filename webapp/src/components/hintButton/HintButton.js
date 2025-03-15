import React from "react";
import { Box, Tooltip, IconButton } from "@mui/material";
import ForumIcon from "@mui/icons-material/Forum";
import "./HintButton.css";
const HintButton = ({ text, onClick }) => {
  return (
    <Box id="hint-container">
      <Tooltip
        id="tooltip"
        title={text}
        placement="bottom"
        arrow
        enterDelay={500}
        leaveDelay={500}
      >
        <IconButton id="hint-button" onClick={onClick}>
          <ForumIcon id="hint-icon" fontSize="large" />
        </IconButton>
      </Tooltip>
    </Box>
  );
};

export default HintButton;
