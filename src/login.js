import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import "./login.css";

export default function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async () => {
    if (!username || !password) {
      setError("Please fill in all fields");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await fetch("http://localhost:5000/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: username,
          password: password,
        }),
      });

      const data = await response.json();

      if (data.success) {
        // Store lab identity separately to prevent fakebank login from replacing attacker context.
        const resolvedUserId = Number(data.user?.user_id || data.user?.id || 0);
        localStorage.setItem("user", JSON.stringify(data.user));
        localStorage.setItem("token", data.token);
        localStorage.setItem("labToken", data.token);
        localStorage.setItem("username", data.user?.username || username);
        if (resolvedUserId) {
          localStorage.setItem("userId", String(resolvedUserId));
          localStorage.setItem("labUserId", String(resolvedUserId));
        }

        if (Array.isArray(data.assignedVulns)) {
          const assigned = JSON.stringify(data.assignedVulns);
          localStorage.setItem("assignedVulns", assigned);
          localStorage.setItem("labAssignedVulns", assigned);
        }

        navigate("/dashboard");
      } else {
        setError(data.message || "Login failed");
      }
    } catch (err) {
      setError("Connection error: " + err.message);
      console.error("Login error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter") {
      handleLogin();
    }
  };

  return (
    <div className="login-page">
      <div className="login-left">
        <div className="login-brand">OWASP Learning Platform</div>

        <div className="login-headline">
          <h1>
            Learn to <span>break</span><br />
            before they do.
          </h1>
          <p>
            Hands-on labs covering the OWASP Top 10. Understand real
            vulnerabilities by exploiting them in a safe environment.
          </p>
        </div>

        <div className="login-footer-text">v1.7.5 · Security Education</div>
      </div>

      <div className="login-right">
        <div className="login-box">
          <div className="login-box-header">
            <h2>Sign in</h2>
            <p>Enter your credentials to continue</p>
          </div>

          {error && <div className="login-error">{error}</div>}

          <div className="login-field">
            <label>Username</label>
            <input
              type="text"
              placeholder="your_username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              onKeyPress={handleKeyPress}
              disabled={loading}
            />
          </div>

          <div className="login-field">
            <label>Password</label>
            <input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyPress={handleKeyPress}
              disabled={loading}
            />
          </div>

          <button onClick={handleLogin} disabled={loading}>
            {loading ? "Signing in..." : "Continue →"}
          </button>

          <p className="register-text">
            New here? <Link to="/register">Create account</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
