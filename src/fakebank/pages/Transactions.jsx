import { useEffect, useState } from "react";
import "../styles/dashboard.css";
import Sidebar from "../components/Sidebar";
import { getTransactions } from "../services/bankApi";

export default function Transactions({ setPage, setUser }) {
  const userId = localStorage.getItem("userId") || 1;
  const [transactions, setTransactions] = useState([]);
  const [filter, setFilter]             = useState("");
  const [search, setSearch]             = useState("");

  useEffect(() => {
    getTransactions(userId).then((d) => setTransactions(d || [])).catch(console.error);
  }, []);

  const dotClass = (t) => t === "withdraw" ? "tx-dot withdraw" : t === "transfer" ? "tx-dot transfer" : "tx-dot";
  const filtered = transactions
    .filter(tx => filter ? tx.type === filter : true)
    .filter(tx => search ? tx.type.includes(search.toLowerCase()) || String(tx.amount).includes(search) : true);

  const totalAmt = filtered.reduce((s, t) => s + t.amount, 0);

  return (
    <div className="dashboard">
      <Sidebar page="transactions" setPage={setPage} setUser={setUser} userId={parseInt(userId)} />
      <div className="main">
        <div className="main-header">
          <h2>Transactions</h2>
          <p>Your complete transaction history</p>
        </div>

        <div className="toolbar">
          <select onChange={(e) => setFilter(e.target.value)}>
            <option value="">All types</option>
            <option value="deposit">Deposits</option>
            <option value="withdraw">Withdrawals</option>
            <option value="transfer">Transfers</option>
          </select>
          <input className="search-input" placeholder="Search amount or type…" value={search} onChange={e => setSearch(e.target.value)} />
          <span className="toolbar-meta">{filtered.length} records · Total ₹{totalAmt.toLocaleString("en-IN")}</span>
        </div>

        <div className="transactions">
          <div className="section-head">{filtered.length} transaction{filtered.length !== 1 ? "s" : ""}</div>
          {filtered.length === 0
            ? <div className="empty-row">No transactions found</div>
            : filtered.map((tx) => (
              <div key={tx.id} className="tx">
                <div className="tx-type">
                  <div className={dotClass(tx.type)}></div>
                  <div>
                    <div className="tx-name" style={{ textTransform: "capitalize" }}>{tx.type}</div>
                    <div className="tx-date">{tx.created_at ? new Date(tx.created_at).toLocaleString() : "—"}</div>
                  </div>
                </div>
                <div className={`tx-amount ${tx.type === "deposit" ? "credit" : "debit"}`}>
                  {tx.type === "deposit" ? "+" : "−"}₹{Number(tx.amount).toLocaleString("en-IN")}
                </div>
              </div>
            ))
          }
        </div>
      </div>
    </div>
  );
}
