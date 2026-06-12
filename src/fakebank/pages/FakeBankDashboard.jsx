import React, { useEffect, useState } from "react";
import SuccessDialog from "./SuccessDialog";
import "../styles/fakebank-dashboard.css";

const FakeBankDashboard = ({ userId }) => {
  const [vulnerabilities, setVulnerabilities] = useState([]);
  const [currentSession, setCurrentSession] = useState(null);
  const [stats, setStats] = useState([]);
  const [showSuccess, setShowSuccess] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Load user's active vulnerabilities on mount
  useEffect(() => {
    if (userId) {
      loadVulnerabilities();
      loadStats();
    }
  }, [userId]);

  const loadVulnerabilities = async () => {
    try {
      const response = await fetch(
        `http://localhost:5000/api/fakebank/vulnerabilities/${userId}`
      );
      const data = await response.json();

      if (data.success) {
        setVulnerabilities(data.vulnerabilities);
        setCurrentSession(data.session);
      }
      setLoading(false);
    } catch (err) {
      setError("Failed to load vulnerabilities");
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const response = await fetch(
        `http://localhost:5000/api/fakebank/stats/${userId}`
      );
      const data = await response.json();

      if (data.success) {
        setStats(data.stats);
      }
    } catch (err) {
      console.error("Failed to load stats");
    }
  };

  const handleVulnerabilityComplete = async (vulnId) => {
    try {
      const response = await fetch(
        `http://localhost:5000/api/fakebank/vulnerability/complete`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ user_id: userId, vuln_id: vulnId })
        }
      );

      const data = await response.json();

      if (data.success) {
        // Update local vulnerability state
        setVulnerabilities(vulns =>
          vulns.map(v => v.id === vulnId ? { ...v, is_completed: true } : v)
        );

        // Check if all completed
        if (data.allCompleted) {
          setShowSuccess(true);
          // Reload stats
          setTimeout(() => {
            loadStats();
          }, 1000);
        }
      }
    } catch (err) {
      console.error("Error marking vulnerability complete:", err);
    }
  };

  const handleTryAgain = async () => {
    try {
      const response = await fetch(
        `http://localhost:5000/api/fakebank/start-new-session`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ user_id: userId })
        }
      );

      const data = await response.json();

      if (data.success) {
        setShowSuccess(false);
        loadVulnerabilities();
        loadStats();
      }
    } catch (err) {
      console.error("Error starting new session:", err);
    }
  };

  if (loading) {
    return <div className="loading">Loading vulnerabilities...</div>;
  }

  if (error) {
    return <div className="error">{error}</div>;
  }

  const completed = vulnerabilities.filter(v => v.is_completed).length;
  const total = vulnerabilities.length;
  const completedRounds = stats.filter(s => s.is_completed).length;

  return (
    <div className="fakebank-dashboard">
      {/* Header with Progress */}
      <div className="dashboard-header">
        <div className="header-content">
          <h2>🏦 FakeBank Security Challenge</h2>
          <p>Session {currentSession}: Identify and exploit all vulnerabilities</p>
        </div>

        <div className="progress-section">
          <div className="progress-info">
            <span className="label">Progress</span>
            <span className="counter">
              {completed}/{total} Completed
            </span>
          </div>
          <div className="progress-bar">
            <div
              className="progress-fill"
              style={{ width: `${(completed / total) * 100}%` }}
            ></div>
          </div>
        </div>
      </div>

      {/* Vulnerabilities Grid */}
      <div className="vulnerabilities-grid">
        <h3>Active Vulnerabilities</h3>
        <div className="vulns-list">
          {vulnerabilities.map(vuln => (
            <div
              key={vuln.id}
              className={`vuln-item ${vuln.is_completed ? "completed" : ""}`}
            >
              <div className="vuln-info">
                <h4>{vuln.name}</h4>
                <p className="endpoint">{vuln.endpoint}</p>
              </div>

              {vuln.is_completed ? (
                <div className="vuln-status completed-badge">
                  ✓ Completed
                </div>
              ) : (
                <button
                  className="vuln-action-btn"
                  onClick={() => handleVulnerabilityComplete(vuln.id)}
                >
                  Mark Complete
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Stats */}
      <div className="stats-section">
        <div className="stat-card">
          <h4>Sessions Completed</h4>
          <p className="stat-value">{completedRounds}</p>
        </div>
        <div className="stat-card">
          <h4>Total Vulnerabilities Found</h4>
          <p className="stat-value">{completedRounds * 8}</p>
        </div>
        <div className="stat-card">
          <h4>Current Challenge</h4>
          <p className="stat-value">Session {currentSession}</p>
        </div>
      </div>

      {/* Success Dialog */}
      <SuccessDialog
        isOpen={showSuccess}
        onClose={() => setShowSuccess(false)}
        onTryAgain={handleTryAgain}
        stats={stats}
      />
    </div>
  );
};

export default FakeBankDashboard;
