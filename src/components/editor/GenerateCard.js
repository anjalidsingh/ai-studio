import React from 'react';
import './GenerateCard.css';

const GenerateCard = ({ 
  onClick, 
  title = 'Generate Content', 
  description = 'Let AI help you create content',
  icon = 'fas fa-sparkles'
}) => {
  return (
    <div className="generate-card" onClick={onClick}>
      <div className="generate-icon">
        <i className={icon}></i>
      </div>
      <div className="generate-title">{title}</div>
      <div className="generate-desc">{description}</div>
    </div>
  );
};

export default GenerateCard;