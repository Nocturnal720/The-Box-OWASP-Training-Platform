import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../../styles/lab.css";

const InsecureDesignMitigation = () => {
  const [message, setMessage] = useState("");
  const navigate = useNavigate();

  const handlePurchase = () => {
    const serverControlledPrice = 100;
    setMessage(`Purchase successful. Charged $${serverControlledPrice} using server-side pricing.`);
  };

  return (
    <div className="lab-page">
      <div className="lab-header">
        <button className="lab-back-btn" onClick={() => navigate("/lab/insecure-design/basic")}>
          &larr; Back to System Architecture Lab
        </button>
        <h1 className="lab-title">System Architecture Mitigation</h1>
        <p className="lab-description">
          Secure design requires enforcing critical business logic on the server side.
        </p>
      </div>

      <div className="lab-content">
        <div className="learn-box">
          <h2>Secure Design Pattern</h2>

          <div className="concept-section">
            <h3>Server-Side Source of Truth</h3>
            <p>
              The final price should come from trusted server data, not from client-provided request values.
            </p>
            <div className="button-group">
              <button className="lab-button primary" onClick={handlePurchase}>
                Simulate Secure Purchase
              </button>
            </div>
            {message ? <div className="result-box success">{message}</div> : null}
          </div>

          <div className="concept-section">
            <h3>Checklist</h3>
            <ul>
              <li>Never trust client-supplied prices, discounts, or totals</li>
              <li>Recompute business-critical values on the server</li>
              <li>Validate workflow state transitions and enforce authorization</li>
              <li>Rate-limit sensitive actions and monitor abuse patterns</li>
            </ul>
          </div>

          <div className="button-group">
            <button className="lab-button primary" onClick={() => navigate("/dashboard")}>
              Back to Dashboard
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InsecureDesignMitigation;