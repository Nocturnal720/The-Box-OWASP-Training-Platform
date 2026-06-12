import { useState } from "react";
import "../styles/bankLogin.css";

export default function BankLogin({ setUser }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const demoUsers = [
    { id: 1, username: "ava.thompson", password: "Ava@2026" },
    { id: 2, username: "liam.carter", password: "Liam@2026" },
    { id: 3, username: "noah.bennett", password: "Noah@2026" },
    { id: 4, username: "mia.patel", password: "Mia@2026" },
  ];

  const handleLogin = async () => {
    setError("");

    try {
      const attackerToken =
        localStorage.getItem("labToken") ||
        localStorage.getItem("token") ||
        "";

      const headers = { "Content-Type": "application/json" };
      if (attackerToken) {
        headers.Authorization = attackerToken;
        headers["X-Lab-Token"] = attackerToken;
      }

      const res = await fetch("http://localhost:5000/bank/login", {
        method: "POST",
        headers,
        body: JSON.stringify({ username, password }),
      });
      const data = await res.json();
      if (data.success) {
        localStorage.setItem("userId", data.user.id);
        localStorage.setItem("bankToken", data.token);
        localStorage.setItem("bankUserId", String(data.user.id));
        if (data.assignedVulns) {
          localStorage.setItem("bankAssignedVulns", JSON.stringify(data.assignedVulns));
        }

        // Backward-compatible fallback when a lab login has not happened yet.
        if (!localStorage.getItem("labToken")) {
          localStorage.setItem("token", data.token);
          if (data.assignedVulns) {
            localStorage.setItem("assignedVulns", JSON.stringify(data.assignedVulns));
          }
        }
        setUser(data.user);
      } else {
        setError("invalid credentials");
      }
    } catch (err) {
      console.error(err);
      setError("Server error. Please check backend on port 5000 and try again.");
    }
  };

  return (
    <div className="fb-login-page">
      <div className="fb-login-card">
        <div className="fb-bank-logo">
          <div className="fb-bank-logo-icon">🏦</div>
          <div>
            <div className="fb-bank-logo-name">FakeBank</div>
            <span className="fb-bank-logo-tag">Secure Banking</span>
          </div>
        </div>

        <h2>Welcome back</h2>
        <p className="fb-subtitle">Sign in to your bank account (not lab account)</p>

        <div className="fb-login-credentials">
          <div className="fb-credentials-title">FakeBank users</div>
          <div className="fb-credentials-table-wrap">
            <table className="fb-credentials-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Username</th>
                  <th>Password</th>
                </tr>
              </thead>
              <tbody>
                {demoUsers.map((user) => (
                  <tr key={user.id}>
                    <td>{user.id}</td>
                    <td>{user.username}</td>
                    <td>{user.password}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {error ? <div className="fb-login-error">{error}</div> : null}

        <div className="fb-field">
          <label>Username</label>
          <input
            placeholder="Enter your username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />
        </div>

        <div className="fb-field">
          <label>Password</label>
          <input
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>

        <button onClick={handleLogin}>Sign in →</button>

        <div className="fb-login-notice">
          🔒 Your connection is secured with 256-bit encryption
        </div>
      </div>
    </div>
  );
}
