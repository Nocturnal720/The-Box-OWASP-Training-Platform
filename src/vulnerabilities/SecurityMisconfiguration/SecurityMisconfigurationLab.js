import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import "../../styles/lab.css";

const checks = [
  {
    key: "headers",
    label: "Review Missing Security Headers",
    detail: "Response lacks CSP, HSTS, and clickjacking protections."
  },
  {
    key: "debug",
    label: "Inspect Exposed Debug Information",
    detail: "Runtime/debug data can leak internal configuration details."
  },
  {
    key: "forcedBrowsing",
    label: "Test Forced Browsing Risk",
    detail: "Admin export path can be discovered and accessed directly."
  }
];

function SecurityMisconfigurationLab() {
  const [activeTab, setActiveTab] = useState("challenge");
  const [results, setResults] = useState({});
  const [activeCheck, setActiveCheck] = useState("");
  const navigate = useNavigate();

  const solved = useMemo(
    () => checks.every((check) => Boolean(results[check.key])),
    [results]
  );

  const runCheck = (check) => {
    setActiveCheck(check.key);
    setTimeout(() => {
      setResults((prev) => ({
        ...prev,
        [check.key]: check.detail
      }));
      setActiveCheck("");
    }, 250);
  };

  const handleReset = () => {
    setResults({});
    setActiveCheck("");
  };

  const completedCount = Object.keys(results).length;

  return (
    <div className="lab-page">
      <div className="lab-header">
        <button className="lab-back-btn" onClick={() => navigate("/dashboard")}>
          &larr; Back to Dashboard
        </button>
        <h1 className="lab-title">Configuration & Exposure Lab</h1>
        <p className="lab-description">
          Learn to detect insecure defaults, accidental debug exposure, and missing hardening controls.
        </p>
      </div>

      <div className="lab-tabs">
        <button
          className={`lab-tab ${activeTab === "challenge" ? "active" : ""}`}
          onClick={() => setActiveTab("challenge")}
        >
          🎯 Challenge
        </button>
        <button
          className={`lab-tab ${activeTab === "learn" ? "active" : ""}`}
          onClick={() => setActiveTab("learn")}
        >
          📚 Learn
        </button>
        <button
          className={`lab-tab ${activeTab === "tips" ? "active" : ""}`}
          onClick={() => setActiveTab("tips")}
        >
          💡 Tips
        </button>
      </div>

      <div className="lab-content">
        {activeTab === "challenge" && (
          <div className="tab-panel">
            <div className="challenge-box">
              <h2>🎯 Validation Checklist Challenge</h2>
              <p className="challenge-text">
                Run all checks below. Complete all three to unlock the final flag.
              </p>

              {checks.map((check) => (
                <div key={check.key} style={{ marginBottom: 16 }}>
                  <button
                    className={`lab-button ${results[check.key] ? "secondary" : "primary"}`}
                    onClick={() => runCheck(check)}
                    disabled={Boolean(results[check.key]) || activeCheck === check.key}
                  >
                    {results[check.key] ? "Completed" : check.label}
                  </button>

                  {results[check.key] ? (
                    <div className="result-box success" style={{ marginTop: 10 }}>
                      <strong>{check.label}</strong>
                      <p style={{ margin: "8px 0 0 0", fontSize: 13, color: "#047857" }}>{results[check.key]}</p>
                    </div>
                  ) : null}
                </div>
              ))}

              <div className="attempts-counter">Checks completed: {completedCount} / {checks.length}</div>

              {solved ? (
                <div className="success-box">
                  🎉 <strong>Challenge Completed!</strong>
                  <p>
                    <strong>Flag:</strong> {"FLAG{CONFIGURATION_EXPOSURE_CHAIN}"}
                  </p>
                  <div className="button-group">
                    <button className="lab-button primary" onClick={() => navigate("/lab/misconfig/mitigation")}>
                      View Mitigation
                    </button>
                    <button className="lab-button secondary" onClick={handleReset}>
                      Run Again
                    </button>
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        )}

        {activeTab === "learn" && (
          <div className="tab-panel">
            <div className="learn-box">
              <h2>📚 Understanding Misconfiguration</h2>

              <div className="concept-section">
                <h3>What Is Security Misconfiguration?</h3>
                <p>
                  Security misconfiguration happens when systems are deployed with unsafe defaults, unnecessary
                  features, or exposed internal information.
                </p>
              </div>

              <div className="concept-section">
                <h3>High-Risk Examples</h3>
                <ul>
                  <li>Missing headers like CSP, HSTS, and X-Frame-Options</li>
                  <li>Debug pages available in production environments</li>
                  <li>Admin endpoints reachable through forced browsing</li>
                  <li>Verbose errors leaking stack traces and environment details</li>
                </ul>
              </div>

              <div className="concept-section">
                <h3>Hardening Strategy</h3>
                <ul>
                  <li>Apply secure defaults in every environment profile</li>
                  <li>Disable debug/diagnostic routes in production builds</li>
                  <li>Gate privileged routes with strict auth + role checks</li>
                  <li>Continuously audit config drift in CI/CD pipelines</li>
                </ul>
              </div>
            </div>
          </div>
        )}

        {activeTab === "tips" && (
          <div className="tab-panel">
            <div className="hints-box">
              <h2>💡 Tips</h2>

              <div className="hint-card">
                <h3>🟢 Step 1</h3>
                <p>Run the header check first; it usually reveals missing baseline protections quickly.</p>
              </div>

              <div className="hint-card">
                <h3>🟡 Step 2</h3>
                <p>Look for debug traces and endpoint hints that can reveal internal paths.</p>
              </div>

              <div className="hint-card">
                <h3>🔴 Step 3</h3>
                <p>Try forced browsing patterns to find privileged routes without normal navigation.</p>
                <code>/admin/export, /debug, /internal/status</code>
              </div>

              <div className="hint-card">
                <h3>✅ Completion</h3>
                <p>You solve the challenge once all three checks are completed and the flag appears.</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default SecurityMisconfigurationLab;