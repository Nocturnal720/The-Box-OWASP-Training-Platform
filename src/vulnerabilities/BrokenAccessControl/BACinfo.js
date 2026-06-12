import { Link } from "react-router-dom";
import "../../styles/vulnerabilities.css";
function BrokenAccessControlInfo() {
  return (
    <div className="vuln-page">
      <h1 className="vuln-title">🔓 Broken Access Control</h1>

      <p className="vuln-text">
        Broken Access Control occurs when an application fails to properly
        enforce restrictions on what authenticated users are allowed to do.
        Attackers can access unauthorized data or functionality by modifying
        parameters such as user IDs or directly accessing protected resources.
      </p>

      <h3 className="vuln-section-title">Learning Objectives</h3>
      <ul className="vuln-text">
        <li>Understand how access control failures occur</li>
        <li>Identify insecure direct object references (IDOR)</li>
        <li>Exploit unauthorized resource access</li>
        <li>Apply proper server-side authorization checks</li>
      </ul>

      <h3 className="vuln-section-title">Difficulty Levels</h3>
      <p className="vuln-text">
        Choose a level below to begin the challenge.
      </p>

      <Link to="/lab/broken-access-control/basic">
        <button className="lab-button">Basic</button>
      </Link>

      <Link to="/lab/broken-access-control/basic">
        <button className="lab-button">Moderate (Coming Soon)</button>
      </Link>

      <Link to="/lab/broken-access-control/basic">
        <button className="lab-button">Advanced (Coming Soon)</button>
      </Link>
    </div>
  );
}

export default BrokenAccessControlInfo;