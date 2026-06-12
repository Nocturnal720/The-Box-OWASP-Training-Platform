import { useEffect, useState } from "react";
import "../styles/dashboard.css";
import {
  getTransactions,
  addTransaction,
  getBalance,
  getActivity,
  logoutUser,
} from "../services/bankApi";

export default function Dashboard({ setPage, setUser }) {
  const userId = parseInt(localStorage.getItem("userId")) || 1;

  const [balance, setBalance] = useState(0);
  const [amount, setAmount] = useState("");
  const [transactions, setTransactions] = useState([]);
  const [activity, setActivity] = useState([]);
  const [active, setActive] = useState("dashboard");
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    try {
      setLoading(true);

      const [tx, bal, act] = await Promise.all([
        getTransactions(userId),
        getBalance(userId),
        getActivity(userId),
      ]);

      setTransactions(tx || []);
      setBalance(bal?.balance ?? 0);
      setActivity(act || []);
    } catch (err) {
      console.error("LOAD ERROR:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const deposit = async () => {
    const val = parseInt(amount);

    if (!val || val <= 0) {
      alert("Enter valid amount");
      return;
    }

    try {
      await addTransaction({
        user_id: userId,
        amount: val,
        type: "deposit",
      });

      setAmount("");
      await loadData();
    } catch (err) {
      console.error(err);
      alert("Deposit failed");
    }
  };

  const withdraw = async () => {
    const val = parseInt(amount);

    if (!val || val <= 0) {
      alert("Enter valid amount");
      return;
    }

    try {
      await addTransaction({
        user_id: userId,
        amount: val,
        type: "withdraw",
      });

      setAmount("");
      await loadData();
    } catch (err) {
      console.error(err);
      alert("Withdraw failed");
    }
  };

  // ✅ LOGOUT WITH BACKEND LOGGING
  const logout = async () => {
    try {
      await logoutUser(userId);
    } catch (err) {
      console.error("Logout logging failed", err);
    }

    localStorage.removeItem("userId");
    if (setUser) setUser(null);
    setPage("login");
  };

  return (
    <div className="dashboard">
      <div className="sidebar">
        <div>
          <h2>FakeBank</h2>

          <div className="menu">
            <p
              className={active === "dashboard" ? "active" : ""}
              onClick={() => setPage("dashboard")}
            >
              Dashboard
            </p>

            <p onClick={() => setPage("transactions")}>Transactions</p>
            <p onClick={() => setPage("transfer")}>Transfer</p>
            <p onClick={() => setPage("profile")}>Profile</p>
          </div>
        </div>

        <button onClick={logout}>Logout</button>
      </div>

      <div className="main">
        <h2>Welcome</h2>

        {loading ? (
          <p>Loading...</p>
        ) : (
          <>
            <div className="cards">
              <div className="card">
                <h3>Balance</h3>
                <h1>₹{balance}</h1>
              </div>

              <div className="card">
                <h3>Withdraw / Deposit</h3>

                <input
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="Enter amount"
                />

                <div className="buttons">
                  <button onClick={deposit}>Deposit</button>
                  <button onClick={withdraw}>Withdraw</button>
                </div>
              </div>
            </div>

            <div className="activity">
              <h3>Account Activity</h3>

              {activity.length === 0 ? (
                <p>No activity yet</p>
              ) : (
                activity.slice(0, 3).map((item, index) => (
                  <div key={index} className="activity-item">
                    <span>{item.action}</span>
                    <span>
                      {item.created_at
                        ? new Date(item.created_at).toLocaleTimeString()
                        : "-"}
                    </span>
                  </div>
                ))
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}