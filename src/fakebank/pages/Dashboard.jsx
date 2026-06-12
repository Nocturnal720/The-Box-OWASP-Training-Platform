import { useEffect, useState } from "react";
import "../styles/dashboard.css";
import Sidebar from "../components/Sidebar";
import { getTransactions, addTransaction, getBalance, getActivity } from "../services/bankApi";

export default function Dashboard({ setPage, setUser }) {
  const userId = parseInt(localStorage.getItem("userId"));
  const [balance, setBalance] = useState(0);
  const [amount, setAmount]   = useState("");
  const [transactions, setTransactions] = useState([]);
  const [activity, setActivity]         = useState([]);
  const [loading, setLoading]           = useState(true);

  const loadData = async () => {
    try {
      setLoading(true);
      const [tx, bal, act] = await Promise.all([getTransactions(userId), getBalance(userId), getActivity(userId)]);
      setTransactions(tx || []);
      setBalance(bal?.balance ?? 0);
      setActivity(act || []);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  useEffect(() => { loadData(); }, []);

  const deposit = async () => {
    const val = parseInt(amount);
    if (!val || val <= 0) { alert("Enter valid amount"); return; }
    try { await addTransaction({ user_id: userId, amount: val, type: "deposit" }); setAmount(""); await loadData(); }
    catch (err) { console.error(err); alert("Deposit failed"); }
  };

  const withdraw = async () => {
    const val = parseInt(amount);
    if (!val || val <= 0) { alert("Enter valid amount"); return; }
    try { await addTransaction({ user_id: userId, amount: val, type: "withdraw" }); setAmount(""); await loadData(); }
    catch (err) { console.error(err); alert("Withdraw failed"); }
  };

  const totalIn  = transactions.filter(t => t.type === "deposit").reduce((s, t) => s + t.amount, 0);
  const totalOut = transactions.filter(t => t.type !== "deposit").reduce((s, t) => s + t.amount, 0);

  return (
    <div className="dashboard">
      <Sidebar page="dashboard" setPage={setPage} setUser={setUser} userId={userId} />
      <div className="main">
        <div className="main-header">
          <h2>Overview</h2>
          <p>Welcome back — here's your account summary</p>
        </div>

        {loading ? <p className="loading-text">Loading account data…</p> : (
          <>
            <div className="balance-hero">
              <div className="balance-label">Total Balance</div>
              <div className="balance-amount"><span>₹</span>{balance.toLocaleString("en-IN")}</div>
              <div className="balance-meta">Account #{userId} · Savings Account</div>
              <div className="balance-stats">
                <div className="balance-stat"><span>Total In</span><strong>+₹{totalIn.toLocaleString("en-IN")}</strong></div>
                <div className="balance-stat"><span>Total Out</span><strong>-₹{totalOut.toLocaleString("en-IN")}</strong></div>
                <div className="balance-stat"><span>Transactions</span><strong>{transactions.length}</strong></div>
              </div>
            </div>

            <div className="dash-row">
              <div className="card">
                <h3>Quick Action</h3>
                <input value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="Enter amount (₹)" />
                <div className="buttons">
                  <button onClick={deposit}>+ Deposit</button>
                  <button onClick={withdraw}>− Withdraw</button>
                </div>
              </div>

              <div className="card">
                <h3>Quick Links</h3>
                <div className="quick-links">
                  <div className="ql-btn" onClick={() => setPage("transfer")}>↗<span>Transfer</span></div>
                  <div className="ql-btn" onClick={() => setPage("payees")}>👥<span>Payees</span></div>
                  <div className="ql-btn" onClick={() => setPage("scheduled")}>🗓<span>Scheduled</span></div>
                  <div className="ql-btn" onClick={() => setPage("support")}>🎫<span>Support</span></div>
                </div>
              </div>
            </div>

            <div className="activity">
              <div className="section-head">
                Recent Activity
                <span onClick={() => setPage("transactions")}>View all →</span>
              </div>
              {activity.length === 0
                ? <div className="empty-row">No activity yet</div>
                : activity.slice(0, 5).map((item, i) => (
                  <div key={i} className="activity-item">
                    <span>{item.action}</span>
                    <span className="tx-date">{item.created_at ? new Date(item.created_at).toLocaleString() : "—"}</span>
                  </div>
                ))
              }
            </div>
          </>
        )}
      </div>
    </div>
  );
}
