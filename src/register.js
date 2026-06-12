import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import "./login.css";

export default function Register() {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleRegister = async () => {
    // Validation
    if (!username || !email || !password || !confirmPassword) {
      setError("Please fill in all fields");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await fetch("http://localhost:5000/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: username,
          email: email,
          password: password,
        }),
      });

      const data = await response.json();

      if (data.success) {
        // Registration successful, redirect to login
        navigate("/login");
      } else {
        setError(data.error || "Registration failed");
      }
    } catch (err) {
      setError("Connection error: " + err.message);
      console.error("Register error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter") {
      handleRegister();
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
            <h2>Create Account</h2>
            <p>Sign up to get started</p>
          </div>

          {error && <div className="login-error">{error}</div>}

          <div className="login-field">
            <label>Username</label>
            <input
              type="text"
              placeholder="your_username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              disabled={loading}
            />
          </div>

          <div className="login-field">
            <label>Email</label>
            <input
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
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
              disabled={loading}
            />
          </div>

          <div className="login-field">
            <label>Confirm Password</label>
            <input
              type="password"
              placeholder="••••••••"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              onKeyPress={handleKeyPress}
              disabled={loading}
            />
          </div>

          <button onClick={handleRegister} disabled={loading}>
            {loading ? "Creating account..." : "Register"}
          </button>

          <p className="register-text">
            Already have an account? <Link to="/login">Login</Link>
          </p>
        </div>
      </div>
    </div>
  );
}