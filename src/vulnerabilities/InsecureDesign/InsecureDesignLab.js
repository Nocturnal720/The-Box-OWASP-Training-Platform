import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../../styles/lab.css";

function InsecureDesignLab() {
  const [activeTab, setActiveTab] = useState("challenge");
  const [quantity, setQuantity] = useState("");
  const [price, setPrice] = useState("");
  const [total, setTotal] = useState(null);
  const [flag, setFlag] = useState(null);
  const [attempts, setAttempts] = useState(0);
  const [message, setMessage] = useState("");
  const navigate = useNavigate();

  const handleCalculate = () => {
    if (attempts >= 5) {
      setMessage("Maximum attempts reached. Reset to try again.");
      return;
    }

    if (!quantity || !price) {
      setMessage("Please enter both quantity and price.");
      return;
    }

    const quantityNumber = Number(quantity);
    const priceNumber = Number(price);

    if (!Number.isFinite(quantityNumber) || !Number.isFinite(priceNumber) || quantityNumber <= 0 || priceNumber <= 0) {
      setMessage("Quantity and price must be valid positive numbers.");
      return;
    }

    setAttempts((prev) => prev + 1);

    // Intentional lab behavior: server trusts client-supplied price.
    const calculatedTotal = Number((quantityNumber * priceNumber).toFixed(2));
    const bypassSucceeded = quantityNumber >= 100 && priceNumber <= 0.01;

    setTotal(calculatedTotal);
    setMessage(
      bypassSucceeded
        ? "Business logic bypass succeeded: manipulated client price was accepted."
        : "Order accepted using client-supplied values."
    );

    if (bypassSucceeded) {
      setFlag("FLAG{SYSTEM_ARCHITECTURE_LOGIC_BYPASS}");
    }
  };

  const handleReset = () => {
    setQuantity("");
    setPrice("");
    setTotal(null);
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
        <h1 className="lab-title">System Architecture Lab</h1>
        <p className="lab-description">
          Learn how insecure business logic appears when the server trusts client-side values.
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
              <h2>🎯 Shopping Cart Logic Challenge</h2>
              <p className="challenge-text">
                Goal: buy 100 items by setting the client-side price to 0.01 and observe how insecure design can be
                abused.
              </p>

              <div className="input-group">
                <label>Quantity</label>
                <input
                  className="lab-input"
                  type="number"
                  placeholder="Enter quantity (for example, 100)"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  disabled={Boolean(flag)}
                />
              </div>

              <div className="input-group">
                <label>Price per Item ($)</label>
                <input
                  className="lab-input"
                  type="number"
                  step="0.01"
                  placeholder="Try a very low value like 0.01"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  disabled={Boolean(flag)}
                />
                <div className="button-group">
                  <button className="lab-button primary" onClick={handleCalculate} disabled={Boolean(flag)}>
                    Calculate Total
                  </button>
                  <button className="lab-button secondary" onClick={handleReset}>
                    Reset
                  </button>
                </div>
              </div>

              <div className="attempts-counter">Attempts: {attempts} / 5</div>

              {message && (
                <div className={`result-box ${flag || total !== null ? "success" : "error"}`}>
                  {message}
                </div>
              )}

              {total !== null && (
                <div className="result-box success">
                  <h3 style={{ margin: "0 0 10px 0", fontSize: 14, color: "#111" }}>Order Summary</h3>
                  <div style={{ fontSize: 13, color: "#333", lineHeight: 1.7 }}>
                    <div>Quantity: {quantity} items</div>
                    <div>Price per item: ${Number(price).toFixed(2)}</div>
                    <div>
                      <strong>Total: ${Number(total).toFixed(2)}</strong>
                    </div>
                  </div>
                </div>
              )}

              {flag && (
                <div className="success-box">
                  🎉 <strong>Challenge Completed!</strong>
                  <p>
                    <strong>Flag:</strong> {flag}
                  </p>
                  <button className="lab-button primary" onClick={() => navigate("/lab/insecure-design/mitigation")}>
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
              <h2>📚 Understanding Insecure Design</h2>

              <div className="concept-section">
                <h3>What Is Insecure Design?</h3>
                <p>
                  Insecure design is a flaw in the application workflow itself. Even if code is syntactically correct,
                  missing trust-boundary checks can still allow abuse.
                </p>
              </div>

              <div className="concept-section">
                <h3>Why This Challenge Works</h3>
                <ul>
                  <li>Client-supplied price is treated as trusted input</li>
                  <li>Server does not recalculate order total from catalog data</li>
                  <li>Abuse case checks are missing from checkout logic</li>
                </ul>
              </div>

              <div className="concept-section">
                <h3>Secure Design Pattern</h3>
                <ul>
                  <li>Load price from server-side product records</li>
                  <li>Recompute totals on the server before payment</li>
                  <li>Reject suspicious quantities and discount combinations</li>
                  <li>Log and alert on repeated workflow abuse attempts</li>
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
                <p>Set quantity to a high value first, then reduce price drastically.</p>
              </div>

              <div className="hint-card">
                <h3>🟡 Step 2</h3>
                <p>Try quantity 100 and price 0.01 to test whether client values are trusted.</p>
                <code>Quantity: 100, Price: 0.01</code>
              </div>

              <div className="hint-card">
                <h3>🔴 Success Condition</h3>
                <p>You complete the challenge when the manipulated order is accepted and a flag appears.</p>
              </div>

              <div className="hint-card">
                <h3>🔐 Mitigation Reminder</h3>
                <p>Never trust totals from the client; server-side business logic must always be authoritative.</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default InsecureDesignLab;