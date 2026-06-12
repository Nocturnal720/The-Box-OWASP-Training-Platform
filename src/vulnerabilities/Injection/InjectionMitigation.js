import { useNavigate } from "react-router-dom";
import "../../styles/lab.css";

function InjectionMitigation() {
  const navigate = useNavigate();

  return (
    <div className="lab-page">
      <div className="lab-header">
        <button className="lab-back-btn" onClick={() => navigate("/lab/injection/basic")}>
          &larr; Back to Injection Lab
        </button>
        <h1 className="lab-title">Injection Mitigation</h1>
        <p className="lab-description">
          Replace interpreted user input with parameterized queries and strict validation.
        </p>
      </div>

      <div className="lab-content">
        <div className="learn-box">
          <h2>How to Prevent Injection</h2>

          <div className="concept-section">
            <h3>Safe Query Pattern</h3>
            <div className="example-code">
              <code>db.query("SELECT * FROM transactions WHERE transaction_id = ?", [userInput]);</code>
            </div>
          </div>

          <div className="concept-section">
            <h3>Hardening Checklist</h3>
            <ul>
              <li>Always use parameterized queries or prepared statements</li>
              <li>Validate and sanitize input by expected type and format</li>
              <li>Use least-privilege database accounts for application access</li>
              <li>Audit query failures and block repeated malicious payloads</li>
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
}

export default InjectionMitigation;