import { Link, useNavigate } from "react-router-dom";
import "../../styles/lab.css";

function SecurityMisconfigurationInfo() {
  const navigate = useNavigate();

  return (
    <div className="lab-page">
      <div className="lab-header">
        <button className="lab-back-btn" onClick={() => navigate("/dashboard")}>
          &larr; Back to Dashboard
        </button>
        <h1 className="lab-title">Configuration & Exposure Lab</h1>
        <p className="lab-description">
          Discover insecure defaults, exposed diagnostics, and missing hardening controls in application setups.
        </p>
      </div>

      <div className="lab-content">
        <div className="learn-box">
          <h2>What You Will Learn</h2>

          <div className="concept-section">
            <h3>Learning Objectives</h3>
            <ul>
              <li>Identify common security misconfigurations</li>
              <li>Understand how accidental exposure is exploited</li>
              <li>Practice detecting weak configuration patterns</li>
              <li>Apply a practical hardening checklist</li>
            </ul>
          </div>

          <div className="concept-section">
            <h3>Difficulty Levels</h3>
            <p>Start with Basic. Additional levels will be available in future updates.</p>
            <div className="button-group">
              <Link to="/lab/misconfig/basic">
                <button className="lab-button primary">Basic</button>
              </Link>
              <button className="lab-button secondary" type="button" disabled>
                Moderate (Coming Soon)
              </button>
              <button className="lab-button secondary" type="button" disabled>
                Advanced (Coming Soon)
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default SecurityMisconfigurationInfo;