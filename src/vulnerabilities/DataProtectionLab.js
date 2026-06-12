import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/lab.css";

function DataProtectionLab() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("challenge");
  const [encryptedData, setEncryptedData] = useState("");
  const [decodedData, setDecodedData] = useState("");
  const [attempts, setAttempts] = useState(0);
  const [completed, setCompleted] = useState(false);
  const [showHint, setShowHint] = useState(false);

  // Simulated encrypted database of secrets
  const secrets = {
    "U2VjcmV0QVBJS2V5OiA0YTZkNzc1MzQ2ZDc3Nw==": {
      name: "API Key",
      decoded: "SecretAPIKey: 4a6d7753464d7777",
      hint: "Admin API Key"
    },
    "RGJQYXNzOiBhZG1pbjEyMzQ1Ng==": {
      name: "Database Password",
      decoded: "DbPass: admin123456",
      hint: "Production database credential"
    },
    "QVdTX1NFQ1JFVDpzM2NyM3Rfa3phYg==": {
      name: "AWS Secret",
      decoded: "AWS_SECRET:s3cr3t_kzab",
      hint: "AWS IAM secret key"
    },
    "QWRtaW5Ub2tlbjogc3VwZXJfc2VjcmV0Xzk5OQ==": {
      name: "Admin Token",
      decoded: "AdminToken: super_secret_999",
      hint: "Session token for admin panel"
    }
  };

  const sampleSecrets = Object.keys(secrets);

  const handleDecode = () => {
    if (attempts >= 15) {
      setDecodedData("Maximum attempts reached!");
      return;
    }

    if (!encryptedData.trim()) {
      setDecodedData("Please enter encoded data");
      return;
    }

    setAttempts(prev => prev + 1);

    try {
      // Attempt to decode from Base64
      const decoded = atob(encryptedData);
      setDecodedData(decoded);

      // Check if this was one of our secrets
      if (secrets[encryptedData]) {
        setCompleted(true);
      }
    } catch (error) {
      setDecodedData("Failed to decode. Is it valid Base64?");
    }
  };

  const handleUseSample = (encoded) => {
    setEncryptedData(encoded);
    setDecodedData("");
  };

  const handleReset = () => {
    setEncryptedData("");
    setDecodedData("");
    setAttempts(0);
    setCompleted(false);
    setShowHint(false);
  };

  const handleGenerateSecret = () => {
    const text = `AdminPassword: ${Math.random().toString(36).substring(2, 15)}`;
    const encoded = btoa(text);
    setEncryptedData(encoded);
    setDecodedData("");
  };

  return (
    <div className="lab-page">
      {/* Header */}
      <div className="lab-header">
        <button className="lab-back-btn" onClick={() => navigate("/")}>&larr; Back to Dashboard</button>
        <h1 className="lab-title">Data Protection Lab</h1>
        <p className="lab-description">Discover why Base64 encoding is NOT encryption and how secrets leak</p>
      </div>

      {/* Navigation Tabs */}
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
          className={`lab-tab ${activeTab === "hint" ? "active" : ""}`}
          onClick={() => setActiveTab("hint")}
        >
          💡 Hints
        </button>
      </div>

      {/* Content */}
      <div className="lab-content">
        {/* Challenge Tab */}
        {activeTab === "challenge" && (
          <div className="tab-panel">
            <div className="challenge-box">
              <h2>🎯 Decode the Secrets</h2>
              <p className="challenge-text">
                The application stores sensitive data using Base64 encoding. 
                Your task is to decode the secrets found in the configuration files.
              </p>

              <div className="input-group">
                <label>Paste Encoded Data:</label>
                <textarea
                  className="lab-input"
                  style={{ minHeight: "80px", fontFamily: "'DM Mono', monospace", fontSize: "12px" }}
                  placeholder="Paste Base64 encoded text here..."
                  value={encryptedData}
                  onChange={(e) => setEncryptedData(e.target.value)}
                  disabled={completed}
                />
                <div className="button-group">
                  <button 
                    className="lab-button primary"
                    onClick={handleDecode}
                    disabled={completed}
                  >
                    Decode Base64
                  </button>
                  <button 
                    className="lab-button secondary"
                    onClick={handleReset}
                  >
                    Reset
                  </button>
                </div>
              </div>

              <div className="sample-section">
                <label style={{ fontSize: "13px", fontWeight: "500", color: "#333", display: "block", marginBottom: "12px" }}>
                  Try Sample Secrets:
                </label>
                <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: "8px" }}>
                  {sampleSecrets.map((secret, idx) => (
                    <button
                      key={idx}
                      className="lab-button secondary"
                      onClick={() => handleUseSample(secret)}
                      style={{ textAlign: "left", fontFamily: "'DM Mono', monospace", fontSize: "11px", padding: "8px 12px" }}
                    >
                      {secret.substring(0, 40)}...
                    </button>
                  ))}
                </div>
              </div>

              <button 
                className="lab-button secondary"
                onClick={handleGenerateSecret}
                style={{ marginTop: "12px", width: "100%" }}
              >
                Generate Random Secret
              </button>

              {/* Attempts Counter */}
              <div className="attempts-counter">
                Attempts: {attempts} / 15
              </div>

              {/* Decoded Result */}
              {decodedData && (
                <div className={`result-box ${completed ? "success" : ""}`}>
                  <h3 style={{ margin: "0 0 12px 0", fontSize: "13px" }}>Decoded Data:</h3>
                  <div style={{ 
                    background: "#f5f5f5", 
                    padding: "12px", 
                    borderRadius: "6px", 
                    fontFamily: "'DM Mono', monospace",
                    fontSize: "12px",
                    color: "#333",
                    wordBreak: "break-all"
                  }}>
                    {decodedData}
                  </div>
                </div>
              )}

              {/* Success Message */}
              {completed && (
                <div className="success-box">
                  🎉 <strong>Challenge Completed!</strong>
                  <p>You successfully decoded a Base64-encoded secret!</p>
                  <p className="lesson">
                    <strong>Critical insight:</strong> Base64 is encoding, NOT encryption. 
                    Anyone can instantly decode it. Never use it for sensitive data security!
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Learn Tab */}
        {activeTab === "learn" && (
          <div className="tab-panel">
            <div className="learn-box">
              <h2>📚 Encoding vs Encryption</h2>
              
              <div className="concept-section">
                <h3>Base64 Encoding</h3>
                <p>
                  Base64 is a method of encoding binary data into text format. It converts data 
                  into a 64-character alphabet, making it safe for transmission over text-based protocols.
                </p>
                <p><strong>Important:</strong> Base64 is NOT encryption. It's easily reversible.</p>
              </div>

              <div className="concept-section">
                <h3>The Difference</h3>
                <table style={{ width: "100%", marginTop: "12px", borderCollapse: "collapse" }}>
                  <thead>
                    <tr style={{ borderBottom: "2px solid #ddd" }}>
                      <th style={{ textAlign: "left", padding: "8px", fontWeight: "500" }}>Aspect</th>
                      <th style={{ textAlign: "left", padding: "8px", fontWeight: "500" }}>Encoding</th>
                      <th style={{ textAlign: "left", padding: "8px", fontWeight: "500" }}>Encryption</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr style={{ borderBottom: "1px solid #ddd" }}>
                      <td style={{ padding: "8px" }}><strong>Purpose</strong></td>
                      <td style={{ padding: "8px" }}>Format conversion</td>
                      <td style={{ padding: "8px" }}>Security/confidentiality</td>
                    </tr>
                    <tr style={{ borderBottom: "1px solid #ddd" }}>
                      <td style={{ padding: "8px" }}><strong>Reversible</strong></td>
                      <td style={{ padding: "8px" }}>Yes, trivially</td>
                      <td style={{ padding: "8px" }}>Yes, with key only</td>
                    </tr>
                    <tr style={{ borderBottom: "1px solid #ddd" }}>
                      <td style={{ padding: "8px" }}><strong>Secure?</strong></td>
                      <td style={{ padding: "8px" }}>❌ Not at all</td>
                      <td style={{ padding: "8px" }}>✓ When done right</td>
                    </tr>
                    <tr>
                      <td style={{ padding: "8px" }}><strong>Example</strong></td>
                      <td style={{ padding: "8px" }}>"password" → "cGFzc3dvcmQ="</td>
                      <td style={{ padding: "8px" }}>Uses keys and algorithms</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <div className="concept-section">
                <h3>Common Mistakes</h3>
                <ul>
                  <li>Storing passwords as Base64 (completely insecure)</li>
                  <li>Using Base64 to "hide" API keys (false sense of security)</li>
                  <li>Thinking encoded data is encrypted</li>
                  <li>Storing secrets in config files, even if Base64-encoded</li>
                </ul>
              </div>

              <div className="concept-section">
                <h3>Proper Protection</h3>
                <ul>
                  <li>Use strong encryption algorithms (AES-256)</li>
                  <li>Store secrets in environment variables, not code</li>
                  <li>Use secrets management tools (HashiCorp Vault, AWS Secrets Manager)</li>
                  <li>Hash passwords with bcrypt, not Base64</li>
                  <li>Rotate credentials regularly</li>
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* Hints Tab */}
        {activeTab === "hint" && (
          <div className="tab-panel">
            <div className="hints-box">
              <h2>💡 Hints & Tips</h2>
              
              <div className="hint-card">
                <h3>🟢 Getting Started (Easy)</h3>
                <p>Click one of the "Try Sample Secrets" buttons. They're already Base64 encoded.</p>
                <p>Then click "Decode Base64" to see what's hidden inside.</p>
              </div>

              <div className="hint-card">
                <h3>🟡 Understanding Base64 (Medium)</h3>
                <p>Base64 uses a specific character set: A-Z, a-z, 0-9, +, /, and = for padding.</p>
                <p>You can decode it instantly with any online tool or programming language.</p>
                <code>JavaScript: atob("cGFzc3dvcmQ=")</code>
              </div>

              <div className="hint-card">
                <h3>🔴 The Real Vulnerability (Hard)</h3>
                <p>
                  Applications often Base64-encode secrets thinking it's "safe" because the data 
                  is "hidden" in config files or responses. But Base64 is trivial to decode.
                </p>
                <p><strong>Real-world example:</strong> API keys in Base64 in JavaScript bundles.</p>
              </div>

              <div className="hint-card">
                <h3>💡 Try This</h3>
                <p>Use the "Generate Random Secret" button to create your own encoded secret.</p>
                <p>The tool will help you understand how easily any Base64 data can be decoded.</p>
              </div>

              <div className="hint-card">
                <h3>🔐 Prevention</h3>
                <p>Never rely on Base64 for security. Always use proper encryption for sensitive data:</p>
                <code>AES-256 encryption with proper key management</code>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Stats */}
      <div className="lab-stats">
        <div className="stat">
          <span className="stat-label">Attempts</span>
          <span className="stat-value">{attempts} / 15</span>
        </div>
        <div className="stat">
          <span className="stat-label">Status</span>
          <span className={`stat-value ${completed ? "completed" : "active"}`}>
            {completed ? "✓ Completed" : "In Progress"}
          </span>
        </div>
        <div className="stat">
          <span className="stat-label">Difficulty</span>
          <span className="stat-value">🟢 Easy</span>
        </div>
      </div>
    </div>
  );
}

export default DataProtectionLab;
