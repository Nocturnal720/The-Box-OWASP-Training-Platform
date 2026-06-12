import { useNavigate } from "react-router-dom";
import "../../styles/lab.css";

function SecurityMisconfigurationMitigation() {
  const navigate = useNavigate();

  return (
    <div className="lab-page">
      <div className="lab-header">
        <button className="lab-back-btn" onClick={() => navigate("/lab/misconfig/basic")}>
          &larr; Back to Configuration & Exposure Lab
        </button>
        <h1 className="lab-title">Configuration & Exposure Mitigation</h1>
        <p className="lab-description">
          Use a hardening baseline to reduce accidental exposure and insecure defaults.
        </p>
      </div>

      <div className="lab-content">
        <div className="learn-box">
          <h2>Hardening Checklist</h2>

          <div className="concept-section">
            <ul>
              <li>Apply secure defaults and disable non-essential features</li>
              <li>Enable CSP, HSTS, X-Frame-Options, and X-Content-Type-Options</li>
              <li>Remove debug and diagnostics endpoints from production builds</li>
              <li>Protect admin/export paths with role checks and authentication</li>
              <li>Automate configuration reviews as part of CI/CD</li>
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

export default SecurityMisconfigurationMitigation;