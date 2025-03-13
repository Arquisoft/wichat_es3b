import React from 'react';
import BaseButton from "../button/BaseButton"
import "./InfoDialog.css";

const InfoDialog = ({title, content, onClose}) => {
  return (
    <div className='dialogContainer'>
      <h1>{title}</h1>
      <div className='dialogMessageContainer'>
        {content}
      </div>
      <div className='dialogButtonContainer'>
        <BaseButton text="Entendido" onClick={onClose}></BaseButton>
      </div>
    </div>
  )
}

export default InfoDialog