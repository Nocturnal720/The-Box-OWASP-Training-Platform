import React, { useState } from "react";
import "./SuccessDialog.css";

const SuccessDialog = ({ isOpen, onClose, onTryAgain, stats }) => {
  if (!isOpen) return null;

  const completedRounds = stats ? stats.filter(s => s.is_completed).length : 0;

  return (
    <div className="success-dialog-overlay">
      <div className="success-dialog">
        {/* Celebration Animation */}
        <div className="celebration">
          <div className="confetti"></div>
          <div className="confetti" style={{ delay: "0.2s" }}></div>
          <div className="confetti" style={{ delay: "0.4s" }}></div>
        </div>

        {/* Content */}
        <div className="success-content">
          <h1 className="success-title">🎉 FakeBank Secured!</h1>

          <p className="success-message">
            Congratulations! You've successfully identified and completed all 8
            active vulnerabilities in the FakeBank system.
          </p>

          <div className="success-stats">
            <div className="stat-item">
              <span className="stat-label">Vulnerabilities Fixed</span>
              <span className="stat-value">8/8</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Sessions Completed</span>
              <span className="stat-value">{completedRounds}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Status</span>
              <span className="stat-value success">✓ SECURE</span>
            </div>
          </div>

          <div className="achievements">
            <h3>Achievements Unlocked</h3>
            <ul>
              <li>🔍 Security Auditor</li>
              <li>🛡️ Vulnerability Hunter</li>
              <li>✅ All-Clear Badge</li>
            </ul>
          </div>

          <p className="challenge-text">
            Ready for another round? Each session will have a different set of 8
            random vulnerabilities!
          </p>

          <div className="success-buttons">
            <button className="btn btn-primary" onClick={onTryAgain}>
              🔄 Try Again (New Round)
            </button>
            <button className="btn btn-secondary" onClick={onClose}>
              ✕ Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SuccessDialog;
