import { Link } from "react-router-dom";

function BrokenAccessControlMitigation() {
  return (
    <div className="vuln-page">
        <h1 className="vuln-title">Mitigation - Broken Access Control</h1>

        <div className="mitigation-box">
            <h3 className="vuln-section-title">How to Prevent Broken Access Control?</h3>

            <div className="code-block">
{`// Example secure backend check

if (loggedInUserId !== requestedUserId) {
    return res.status(403).json({ message: "Access denied" });
}`}
            </div>

            <p className="vuln-text">
                Always verify that the authenticated user is authorized to access the requested resource on the server side.
            </p>
        </div>

        <Link to="/dashboard">
            <button className="back-button">Back to Dashboard</button>
        </Link>
    </div>
  );
}

export default BrokenAccessControlMitigation;