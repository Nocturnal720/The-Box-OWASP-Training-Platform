import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../../styles/lab.css";

const mockTransactions = [
  { id: 101, amount: 2500, hidden: false },
  { id: 102, amount: 4300, hidden: false },
  { id: 103, amount: 1800, hidden: false },
  { id: 999, amount: "ADMIN-SECRET", hidden: true }
];

function InjectionLab() {
  const [activeTab, setActiveTab] = useState("challenge");
  const [query, setQuery] = useState("");
  const [result, setResult] = useState([]);
  const [flag, setFlag] = useState(null);
  const [attempts, setAttempts] = useState(0);
  const [message, setMessage] = useState("");
  const navigate = useNavigate();

  const handleSearch = () => {
    if (attempts >= 5) {
      setMessage("Maximum attempts reached. Reset to try again.");
      return;
    }

    const input = String(query || "").trim();
    setAttempts((prev) => prev + 1);

    if (!input) {
      setResult([]);
      setMessage("Enter a transaction ID or an input payload.");
      return;
    }

    // Intentional lab behavior: treat SQL-like payloads as interpreted input.
    const interpretedPayload = /('|--|#|;|\/\*|\b(or|union|select)\b)/i.test(input);
    if (interpretedPayload) {
      setResult(mockTransactions.map(({ id, amount }) => ({ id, amount })));
      setFlag("FLAG{INPUT_INTERPRETATION_SQLI}");
      setMessage("Input interpreted as a command: hidden records exposed.");
      return;
    }

    const transactionId = Number.parseInt(input, 10);
    if (!Number.isFinite(transactionId)) {
      setResult([]);
      setMessage("No matching transaction found.");
      return;
    }

    const rows = mockTransactions
      .filter((row) => row.id === transactionId && !row.hidden)
      .map(({ id, amount }) => ({ id, amount }));

    setResult(rows);
    setMessage(rows.length ? "Record found." : "No matching transaction found.");
  };

  const goToMitigation = () => {
    navigate("/lab/injection/mitigation");
  };

  const handleReset = () => {
    setQuery("");
    setResult([]);
    setFlag(null);
    setAttempts(0);
    setMessage("");
  };

  return (
    <div className="lab-page">
      <div className="lab-header">
        <button className="lab-back-btn" onClick={() => navigate("/dashboard")}>
          &larr; Back to Dashboard
        </button>
        <h1 className="lab-title">Injection Vulnerability Lab</h1>
        <p className="lab-description">
          Learn how unsafe input interpretation can expose hidden records and bypass intended query logic.
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
              <h2>🎯 Your Challenge</h2>
              <p className="challenge-text">
                Retrieve the hidden <strong>ADMIN-SECRET</strong> transaction by crafting input that gets interpreted as
                query logic.
              </p>

              <div className="input-group">
                <label>Transaction ID or Payload</label>
                <input
                  className="lab-input"
                  type="text"
                  placeholder="Try ID 101 first, then test a payload"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && handleSearch()}
                  disabled={Boolean(flag)}
                />
                <div className="button-group">
                  <button className="lab-button primary" onClick={handleSearch} disabled={Boolean(flag)}>
                    Search
                  </button>
                  <button className="lab-button secondary" onClick={handleReset}>
                    Reset
                  </button>
                </div>
              </div>

              <div className="attempts-counter">Attempts: {attempts} / 5</div>

              {message && (
                <div className={`result-box ${flag ? "success" : result.length > 0 ? "success" : "error"}`}>
                  {message}
                </div>
              )}

              {result.length > 0 && (
                <div className="result-box success">
                  <h3 style={{ margin: "0 0 10px 0", fontSize: 14, color: "#111" }}>Search Results</h3>
                  <div style={{ overflowX: "auto" }}>
                    <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                      <thead>
                        <tr style={{ borderBottom: "1px solid #ddd" }}>
                          <th style={{ textAlign: "left", padding: "8px" }}>ID</th>
                          <th style={{ textAlign: "left", padding: "8px" }}>Amount</th>
                        </tr>
                      </thead>
                      <tbody>
                        {result.map((item, index) => (
                          <tr key={`${item.id}-${index}`} style={{ borderBottom: "1px solid #eee" }}>
                            <td style={{ padding: "8px" }}>{item.id}</td>
                            <td style={{ padding: "8px" }}>{item.amount}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {flag && (
                <div className="success-box">
                  🎉 <strong>Challenge Completed!</strong>
                  <p>
                    <strong>Flag:</strong> {flag}
                  </p>
                  <button className="lab-button primary" onClick={goToMitigation}>
                    View Mitigation
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === "learn" && (
          <div className="tab-panel">
            <div className="learn-box">
              <h2>📚 Understanding Injection</h2>

              <div className="concept-section">
                <h3>What Is Injection?</h3>
                <p>
                  Injection happens when untrusted input is treated as instructions instead of plain data. The
                  application then executes unintended logic.
                </p>
              </div>

              <div className="concept-section">
                <h3>Why This Lab Is Vulnerable</h3>
                <ul>
                  <li>User input is interpreted like command/query syntax</li>
                  <li>Payload patterns can bypass normal filtering</li>
                  <li>Hidden records become visible without authorization</li>
                </ul>
              </div>

              <div className="concept-section">
                <h3>Secure Pattern</h3>
                <div className="example-code">
                  <code>SELECT * FROM transactions WHERE transaction_id = ?</code>
                </div>
                <p>Use parameterized queries and strict input validation so payload text is never executed.</p>
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
                <p>Start with a normal ID like 101 to understand baseline behavior.</p>
              </div>

              <div className="hint-card">
                <h3>🟡 Step 2</h3>
                <p>Try payload-like input that includes query operators.</p>
                <code>Example: 101 OR 1=1 --</code>
              </div>

              <div className="hint-card">
                <h3>🔴 Success Condition</h3>
                <p>You solve the lab when hidden rows appear and you receive the flag.</p>
              </div>

              <div className="hint-card">
                <h3>🔐 Mitigation Reminder</h3>
                <p>Unsafe input interpretation is fixed with parameterized queries and allow-list validation.</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default InjectionLab;