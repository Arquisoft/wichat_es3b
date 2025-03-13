import React from 'react';
import BaseButton from "../button/BaseButton"
import "./InfoDialog.css";

const InfoDialog = ({message, onClose}) => {
  return (
    <div className='dialogContainer'>
      <div className='dialogMessageContainer'>
        {message}
      </div>
      <div className='dialogButtonContainer'>
        <BaseButton text="Entendido" onClick={onClose}></BaseButton>
      </div>
    </div>
  )
}

export default InfoDialog