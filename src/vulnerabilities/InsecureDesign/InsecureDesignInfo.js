import { Link, useNavigate } from "react-router-dom";
import "../../styles/lab.css";

const InsecureDesignInfo = () => {
  const navigate = useNavigate();

  return (
    <div className="lab-page">
      <div className="lab-header">
        <button className="lab-back-btn" onClick={() => navigate("/dashboard")}>
          &larr; Back to Dashboard
        </button>
        <h1 className="lab-title">System Architecture Lab</h1>
        <p className="lab-description">
          Explore insecure design patterns where business logic and trust boundaries are implemented incorrectly.
        </p>
      </div>

      <div className="lab-content">
        <div className="learn-box">
          <h2>What This Lab Covers</h2>

          <div className="concept-section">
            <h3>Common Insecure Design Patterns</h3>
            <ul>
              <li>No rate limiting for sensitive workflows</li>
              <li>Trusting client-side price or quantity values</li>
              <li>Skipping server-side workflow validation</li>
              <li>Missing abuse-case checks in business logic</li>
            </ul>
          </div>

          <div className="concept-section">
            <h3>Impact</h3>
            <p>
              Attackers can bypass intended controls, manipulate transaction outcomes, and obtain unauthorized benefits
              without needing low-level technical exploits.
            </p>
          </div>

          <div className="button-group">
            <Link to="/lab/insecure-design/basic">
              <button className="lab-button primary">Start Lab</button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InsecureDesignInfo;