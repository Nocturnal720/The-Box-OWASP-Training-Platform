import { useEffect, useState } from "react";
import "../styles/dashboard.css";
import Sidebar from "../components/Sidebar";
import { getAccountDetails, getActivity, getMiniStatement } from "../services/bankApi";

export default function Profile({ setPage, setUser }) {
  const userId  = localStorage.getItem("userId") || 1;
  const [account, setAccount]   = useState(null);
  const [activity, setActivity] = useState([]);
  const [mini, setMini]         = useState([]);

  useEffect(() => {
    getAccountDetails(userId).then(setAccount).catch(console.error);
    getActivity(userId).then(setActivity).catch(console.error);
    getMiniStatement(userId).then(setMini).catch(console.error);
  }, []);

  return (
    <div className="dashboard">
      <Sidebar page="profile" setPage={setPage} setUser={setUser} userId={parseInt(userId)} />
      <div className="main">
        <div className="main-header">
          <h2>Profile</h2>
          <p>Your account details and mini statement</p>
        </div>

        <div className="profile-grid">
          {account && (
            <div className="profile-card">
              <div className="profile-card-head">Account Details</div>
              <p><strong>Account No.</strong>{account.account_number}</p>
              <p><strong>IFSC Code</strong>{account.ifsc}</p>
              <p><strong>Account Type</strong>{account.account_type}</p>
              <p><strong>Branch</strong>{account.branch}</p>
              <p><strong>Balance</strong>₹{Number(account.balance).toLocaleString("en-IN")}</p>
            </div>
          )}

          <div className="profile-card">
            <div className="profile-card-head">Mini Statement</div>
            {mini.length === 0
              ? <p style={{ color: "#bbb", fontSize: 13, padding: "14px 0" }}>No transactions yet</p>
              : mini.map((t, i) => (
                <p key={i}>
                  <strong style={{ textTransform: "capitalize" }}>{t.type}</strong>
                  <span className={t.type === "deposit" ? "credit" : "debit"}>
                    {t.type === "deposit" ? "+" : "−"}₹{Number(t.amount).toLocaleString("en-IN")}
                  </span>
                </p>
              ))
            }
          </div>
        </div>

        <div className="activity" style={{ marginTop: 24 }}>
          <div className="section-head">Login & Activity Log</div>
          {activity.length === 0
            ? <div className="empty-row">No activity yet</div>
            : activity.map((item, i) => (
              <div key={i} className="activity-item">
                <span>{item.action}</span>
                <span className="tx-date">{item.created_at ? new Date(item.created_at).toLocaleString() : "—"}</span>
              </div>
            ))
          }
        </div>
      </div>
    </div>
  );
}
