import React from "react";
import Button from "@mui/material/Button";

function BaseButton({text, onClick}){
    return (
        <Button variant='contained' color='primary' onClick={onClick}
        sx={{padding: '0.8em 1.8em', fontSize: '1em', backgroundColor: '#38B6FF',
            '&:hover': {backgroundColor: '#006F94'}, fontWeight:'bold', fontFamily:"'Poppins',sans-serif",
            textTransform: 'none'
        }}>
            {text}
        </Button>
    );
}

export default BaseButton;