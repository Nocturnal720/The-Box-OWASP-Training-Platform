import { useEffect, useState } from "react";
import "../styles/dashboard.css";
import { getTransactions } from "../services/bankApi";

export default function Transactions({ setPage }) {
  const userId = localStorage.getItem("userId") || 1;

  const [transactions, setTransactions] = useState([]);
  const [filter, setFilter] = useState("");

  useEffect(() => {
    load();
  }, []);

  const load = async () => {
    const data = await getTransactions(userId);
    setTransactions(data || []);
  };

  const filtered = transactions.filter((tx) =>
    filter ? tx.type === filter : true
  );

  return (
    <div className="dashboard">
      <div className="sidebar">
  <h2>FakeBank</h2>

  <div className="menu">
    <p
      className={active === "dashboard" ? "active" : ""}
      onClick={() => setPage("dashboard")}
    >
      Dashboard
    </p>

    <p
      className={active === "transactions" ? "active" : ""}
      onClick={() => setPage("transactions")}
    >
      Transactions
    </p>

    <p
      className={active === "transfer" ? "active" : ""}
      onClick={() => setPage("transfer")}
    >
      Transfer
    </p>

    <p
      className={active === "profile" ? "active" : ""}
      onClick={() => setPage("profile")}
    >
      Profile
    </p>
  </div>
</div>

      <div className="main">
        <h2>Transactions</h2>

        <div className="filter-bar">
          <select onChange={(e) => setFilter(e.target.value)}>
            <option value="">All</option>
            <option value="deposit">Deposit</option>
            <option value="withdraw">Withdraw</option>
            <option value="transfer">Transfer</option>
          </select>
        </div>

        {filtered.map((tx) => (
          <div key={tx.id} className="tx">
            <span>{tx.type}</span>
            <span>₹{tx.amount}</span>
            <span>{tx.created_at}</span>
          </div>
        ))}
      </div>
    </div>
  );
}