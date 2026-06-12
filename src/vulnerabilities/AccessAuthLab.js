import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/lab.css";

function AccessAuthorizationLab() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("challenge");
  const [userId, setUserId] = useState("");
  const [result, setResult] = useState(null);
  const [attempts, setAttempts] = useState(0);
  const [completed, setCompleted] = useState(false);

  // Simulated user database
  const users = {
    "1": { id: "1", name: "John User", role: "User", email: "john@example.com" },
    "2": { id: "2", name: "Jane Developer", role: "Developer", email: "jane@example.com" },
    "3": { id: "3", name: "Admin User", role: "Administrator", email: "admin@example.com" },
    "999": { id: "999", name: "Secret Admin", role: "Super Admin", email: "secret@admin.com" }
  };

  const handleCheckAccess = () => {
    if (attempts >= 10) {
      setResult({ error: "Maximum attempts reached!" });
      return;
    }

    if (!userId.trim()) {
      setResult({ error: "Please enter a User ID" });
      return;
    }

    const user = users[userId];
    setAttempts(prev => prev + 1);

    if (user) {
      setResult({
        success: true,
        user: user
      });

      // Challenge complete when accessing admin (ID 999)
      if (userId === "999") {
        setCompleted(true);
      }
    } else {
      setResult({
        error: `User ID '${userId}' not found. Try IDs: 1, 2, 3, or discover more...`
      });
    }
  };

  const handleReset = () => {
    setUserId("");
    setResult(null);
    setAttempts(0);
    setCompleted(false);
  };

  return (
    <div className="lab-page">
      {/* Header */}
      <div className="lab-header">
        <button className="lab-back-btn" onClick={() => navigate("/")}>&larr; Back to Dashboard</button>
        <h1 className="lab-title">Access & Authorization Lab</h1>
        <p className="lab-description">Learn how IDOR vulnerabilities allow unauthorized access to user data</p>
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
              <h2>🎯 Your Challenge</h2>
              <p className="challenge-text">
                Access the profile of a user with administrative privileges. 
                <br/>
                The system uses simple numeric User IDs. Try to enumerate and find the admin account!
              </p>

              <div className="input-group">
                <label>Enter User ID:</label>
                <input
                  type="text"
                  className="lab-input"
                  placeholder="Try: 1, 2, 3, or guess higher..."
                  value={userId}
                  onChange={(e) => setUserId(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && handleCheckAccess()}
                  disabled={completed}
                />
                <div className="button-group">
                  <button 
                    className="lab-button primary"
                    onClick={handleCheckAccess}
                    disabled={completed}
                  >
                    Check Access
                  </button>
                  <button 
                    className="lab-button secondary"
                    onClick={handleReset}
                  >
                    Reset
                  </button>
                </div>
              </div>

              {/* Attempts Counter */}
              <div className="attempts-counter">
                Attempts: {attempts} / 10
              </div>

              {/* Results */}
              {result && (
                <div className={`result-box ${result.success ? "success" : "error"}`}>
                  {result.error && (
                    <div className="result-error">
                      ⚠️ {result.error}
                    </div>
                  )}
                  {result.user && (
                    <div className="result-user">
                      <h3>User Profile Found:</h3>
                      <div className="user-card">
                        <div className="user-field">
                          <span className="label">ID:</span>
                          <span className="value">{result.user.id}</span>
                        </div>
                        <div className="user-field">
                          <span className="label">Name:</span>
                          <span className="value">{result.user.name}</span>
                        </div>
                        <div className="user-field">
                          <span className="label">Email:</span>
                          <span className="value">{result.user.email}</span>
                        </div>
                        <div className="user-field">
                          <span className="label">Role:</span>
                          <span className="value role">{result.user.role}</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Success Message */}
              {completed && (
                <div className="success-box">
                  🎉 <strong>Challenge Completed!</strong>
                  <p>You successfully found the Super Admin account by enumerating user IDs.</p>
                  <p className="lesson">
                    <strong>What you learned:</strong> The system trusted the user-provided ID without proper authorization checks. 
                    This IDOR vulnerability allowed you to access any user's data by guessing their ID.
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
              <h2>📚 Understanding IDOR</h2>
              
              <div className="concept-section">
                <h3>What is Broken Access Control?</h3>
                <p>
                  Broken Access Control occurs when an application fails to properly enforce restrictions on 
                  what resources authenticated users can access. Instead of checking if a user owns the resource 
                  they're trying to access, the app trusts the user's input directly.
                </p>
              </div>

              <div className="concept-section">
                <h3>IDOR (Insecure Direct Object Reference)</h3>
                <p>
                  A specific type of access control flaw where:
                </p>
                <ul>
                  <li>Users reference objects (files, profiles, accounts) using predictable IDs (1, 2, 3...)</li>
                  <li>The application doesn't verify if the user owns that object</li>
                  <li>Attackers can change the ID and access other users' data</li>
                </ul>
              </div>

              <div className="concept-section">
                <h3>How It Works</h3>
                <div className="example-code">
                  <p><strong>Vulnerable URL:</strong></p>
                  <code>GET /api/profile?user_id=123</code>
                  <p style={{marginTop: "10px"}}><strong>Attacker changes the ID:</strong></p>
                  <code>GET /api/profile?user_id=999</code>
                  <p style={{marginTop: "10px"}}><strong>Server returns data without checking ownership:</strong></p>
                  <code>{'{"id": 999, "name": "Admin", "email": "admin@example.com"}'}</code>
                </div>
              </div>

              <div className="concept-section">
                <h3>Real-World Examples</h3>
                <ul>
                  <li>Changing account ID to view other users' bank balances</li>
                  <li>Modifying order ID to see competitors' purchases</li>
                  <li>Altering profile ID to download other users' documents</li>
                  <li>Changing transaction ID to view/modify payment history</li>
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
                <p>The system uses simple numeric IDs. Try accessing users 1, 2, and 3 first to understand the system.</p>
                <code>Try: user_id = 1</code>
              </div>

              <div className="hint-card">
                <h3>🟡 Finding the Admin (Medium)</h3>
                <p>Admin accounts often use higher ID numbers. Try going beyond 3.</p>
                <code>Try: user_id = 100, 999, 1000</code>
              </div>

              <div className="hint-card">
                <h3>🔴 Understanding the Vulnerability (Hard)</h3>
                <p>
                  The app doesn't verify ownership. It just checks if the ID exists in the database. 
                  This is why you can access ANY user's data without proper authorization.
                </p>
                <p><strong>Key insight:</strong> Authentication ≠ Authorization</p>
                <ul style={{marginTop: "10px"}}>
                  <li><strong>Authentication:</strong> Proving who you are (login)</li>
                  <li><strong>Authorization:</strong> Proving you can access a resource</li>
                </ul>
              </div>

              <div className="hint-card">
                <h3>💻 How to Fix It</h3>
                <p>
                  Before returning any resource, the server must verify:
                </p>
                <code style={{display: "block", marginTop: "10px"}}>
                  IF (user_id == requested_id) THEN return data ELSE deny access
                </code>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Stats */}
      <div className="lab-stats">
        <div className="stat">
          <span className="stat-label">Attempts</span>
          <span className="stat-value">{attempts} / 10</span>
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

export default AccessAuthorizationLab;
