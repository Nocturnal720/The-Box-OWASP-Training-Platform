import { useState } from "react";
import { useNavigate } from "react-router-dom";

function BrokenAccessControlLab() {
  const [userId, setUserId] = useState("");
  const [profile, setProfile] = useState(null);
  const [flag, setFlag] = useState(null);
  const [attempts, setAttempts] = useState(0);
  const navigate = useNavigate();

  const handleAccess = async () => {
    if (attempts >= 5) {
      alert("Maximum attempts reached!");
      return;
    }

    try {
      const response = await fetch(
        `http://localhost:5000/api/security_lab/profile?uid=${encodeURIComponent(userId)}`
      );

      const data = await response.json();

      setAttempts((prev) => prev + 1);
      setProfile(data.profile || null);

      if (data.flag) {
        setFlag(data.flag);
      }
    } catch (error) {
      console.error("Error:", error);
    }
  };

  const goToMitigation = () => {
    navigate("/lab/broken-access-control/mitigation");
  };

  return (
    <div className="vuln-page">
      <h1 className="vuln-title">Broken Access Control Lab</h1>

      <div className="lab-container">
        <p className="vuln-text">
          Goal: Access another user's profile (<b>ADMIN</b>) by modifying the user ID.
        </p>

        <input
          className="lab-input"
          type="text"
          placeholder="Enter User ID"
          value={userId}
          onChange={(e) => setUserId(e.target.value)}
          disabled={flag}
        />

        <button
          className="lab-button"
          onClick={handleAccess}
          disabled={flag}
        >
          View Profile
        </button>

        <p className="attempt-counter">
          Attempts: {attempts} / 5
        </p>

        {/* 🔹 PROFILE RESULT */}
        {profile && (
          <div className="result-table">
            <table>
              <thead>
                <tr>
                  <th>User ID</th>
                  <th>Name</th>
                  <th>Role</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>{profile.id}</td>
                  <td>{profile.name}</td>
                  <td>{profile.role}</td>
                </tr>
              </tbody>
            </table>
          </div>
        )}

        {/* 🔹 FLAG */}
        {flag && (
          <div className="flag-box">
            🎉 Challenge Completed! <br />
            <strong>Flag:</strong> {flag}

            <button
              className="lab-button"
              style={{ marginTop: "15px" }}
              onClick={goToMitigation}
            >
              View Mitigation
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default BrokenAccessControlLab;