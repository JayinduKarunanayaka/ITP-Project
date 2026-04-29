import React from 'react';

const MissedDoseAlert = ({ adherencePercentage, onClose }) => {
    if (adherencePercentage >= 65) return null;

    return (
        <div className="card alert-card warning-alert">
            <div className="alert-content">
                <i className="fa-solid fa-triangle-exclamation alert-icon"></i>
                <div className="alert-text">
                    <h3>Attention Required</h3>
                    <p>Recent medication adherence has dropped below 65%. Please review your medication schedule.</p>
                </div>
            </div>
            <button className="close-alert-btn" onClick={onClose}><i className="fa-solid fa-xmark"></i></button>
        </div>
    );
};

export default MissedDoseAlert;
