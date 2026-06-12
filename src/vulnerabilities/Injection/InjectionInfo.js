import { Link, useNavigate } from "react-router-dom";
import "../../styles/lab.css";

function InjectionInfo() {
  const navigate = useNavigate();

  return (
    <div className="lab-page">
      <div className="lab-header">
        <button className="lab-back-btn" onClick={() => navigate("/dashboard")}>
          &larr; Back to Dashboard
        </button>
        <h1 className="lab-title">Injection Vulnerability Lab</h1>
        <p className="lab-description">
          Learn how unsafe input interpretation can expose hidden data and bypass intended query logic.
        </p>
      </div>

      <div className="lab-content">
        <div className="learn-box">
          <h2>What You Will Practice</h2>

          <div className="concept-section">
            <h3>Learning Objectives</h3>
            <ul>
              <li>Understand how injection vulnerabilities occur</li>
              <li>Identify unsafe input patterns and payloads</li>
              <li>Exploit interpreted input in a safe lab setting</li>
              <li>Apply secure mitigation techniques</li>
            </ul>
          </div>

          <div className="concept-section">
            <h3>Difficulty Levels</h3>
            <p>Start with Basic to complete the challenge. Additional levels will be unlocked later.</p>
            <div className="button-group">
              <Link to="/lab/injection/basic">
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

export default InjectionInfo;