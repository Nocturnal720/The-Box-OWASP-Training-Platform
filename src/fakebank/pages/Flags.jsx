import { useEffect, useState } from "react";
import Sidebar from "../components/Sidebar";
import { getFlags } from "../services/bankApi";

export default function Flags({ setPage, setUser }) {
  const userId = parseInt(localStorage.getItem("userId"));
  const [flags, setFlags] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) return;
    setLoading(true);
    console.log(`🚩 [FLAGS PAGE] Fetching flags for user_id=${userId}`);
    getFlags(userId)
      .then((data) => {
        console.log(`🚩 [FLAGS PAGE] Received ${data?.length || 0} flags:`, data);
        setFlags(data || [])
      })
      .catch((err) => {
        console.error(`🚩 [FLAGS PAGE] Error fetching flags:`, err);
      })
      .finally(() => setLoading(false));
  }, [userId]);

  return (
    <div className="dashboard">
      <Sidebar page="flags" setPage={setPage} setUser={setUser} userId={userId} />
      <div className="main">
        <div className="main-header">
          <h2>🚩 Captured Flags</h2>
          <p>{flags.length} vulnerability{flags.length !== 1 ? "s" : ""} exploited so far</p>
        </div>

        {loading ? (
          <p className="loading-text">Loading flags…</p>
        ) : flags.length === 0 ? (
          <div className="card" style={{ textAlign: "center", padding: "40px 20px", color: "#888" }}>
            <p style={{ fontSize: "32px", marginBottom: "10px" }}>📭</p>
            <p>No flags collected yet. Exploit vulnerabilities to capture flags!</p>
          </div>
        ) : (
          <div className="card">
            <table className="flags-table">
              <thead>
                <tr>
                  <th>Vulnerability Type</th>
                  <th>Flag</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {flags.map((flag, idx) => (
                  <tr key={idx}>
                    <td>
                      <strong>{flag.type}</strong>
                    </td>
                    <td>
                      <code style={{ fontSize: "11px", color: "#666", wordBreak: "break-all" }}>
                        {flag.flag}
                      </code>
                    </td>
                    <td>
                      <span style={{ color: "green", fontWeight: "600" }}>✓ Captured</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
