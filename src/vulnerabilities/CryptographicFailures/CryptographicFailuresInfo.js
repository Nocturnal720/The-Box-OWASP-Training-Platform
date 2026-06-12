import { Link } from "react-router-dom";
import "../../styles/vulnerabilities.css";
function CryptographicFailuresInfo() {
  return (
    <div className="vuln-page">
      <h1 className="vuln-title">🔐 Cryptographic Failure</h1>

      <p className="vuln-text">
        Cryptographic failures occur when sensitive data is not properly
        protected using encryption or when weak/incorrect cryptographic
        implementations are used. This can expose passwords, financial
        data, or personal information to attackers.
      </p>

      <h3 className="vuln-section-title">Learning Objectives</h3>
      <ul className="vuln-text">
        <li>Understand how sensitive data should be protected</li>
        <li>Identify weak or missing encryption</li>
        <li>Exploit improper cryptographic implementations</li>
        <li>Apply secure encryption and hashing techniques</li>
      </ul>

      <h3 className="vuln-section-title">Difficulty Levels</h3>
      <p className="vuln-text">
        Choose a level below to begin the challenge.
      </p>

      <Link to="/lab/crypto/basic">
        <button className="lab-button">Basic</button>
      </Link>

      <Link to="/lab/crypto/basic">
        <button className="lab-button">Moderate (Coming Soon)</button>
      </Link>

      <Link to="/lab/crypto/basic">
        <button className="lab-button">Advanced (Coming Soon)</button>
      </Link>
    </div>
  );
}

export default CryptographicFailuresInfo;