import { useState, useEffect } from "react";
import "../styles/dashboard.css";
import "../styles/TransferMon.css";
import Sidebar from "../components/Sidebar";
import { transferMoney, transferToPayee, getPayees, logoutUser } from "../services/bankApi";

export default function TransferMon({ setPage, setUser }) {
  const userId = parseInt(localStorage.getItem("userId")) || 1;
  const [tab, setTab]     = useState("user"); // "user" | "payee"
  const [toUser, setToUser] = useState("");
  const [amount, setAmount] = useState("");
  const [note, setNote]     = useState("");
  const [payees, setPayees] = useState([]);
  const [selectedPayee, setSelectedPayee] = useState("");

  useEffect(() => {
    getPayees(userId).then(setPayees).catch(console.error);
  }, []);

  const handleTransfer = async () => {
    const val = parseInt(amount);
    if (!val || val <= 0) { alert("Enter valid amount"); return; }

    try {
      if (tab === "user") {
        const receiver = parseInt(toUser);
        if (!receiver || receiver === userId) { alert("Enter a valid recipient user ID"); return; }
        await transferMoney({ from_user: userId, to_user: receiver, amount: val });
      } else {
        if (!selectedPayee) { alert("Select a payee"); return; }
        await transferToPayee({ from_user: userId, payee_id: parseInt(selectedPayee), amount: val });
      }
      alert(`₹${val} sent successfully!`);
      setToUser(""); setAmount(""); setNote(""); setSelectedPayee("");
      setPage("dashboard");
    } catch (err) { console.error(err); alert("Transfer failed"); }
  };

  return (
    <div className="dashboard">
      <Sidebar page="transfer" setPage={setPage} setUser={setUser} userId={userId} />
      <div className="main">
        <div className="main-header">
          <h2>Transfer Money</h2>
          <p>Send funds to another account instantly</p>
        </div>

        <div className="transfer-wrapper">
          <div className="transfer-card">
            <div className="tab-row">
              <button className={`tab-btn${tab === "user" ? " active" : ""}`} onClick={() => setTab("user")}>By User ID</button>
              <button className={`tab-btn${tab === "payee" ? " active" : ""}`} onClick={() => setTab("payee")}>Saved Payee</button>
            </div>

            {tab === "user" ? (
              <div className="transfer-field">
                <label>Recipient User ID</label>
                <input type="number" placeholder="e.g. 2" value={toUser} onChange={e => setToUser(e.target.value)} />
              </div>
            ) : (
              <div className="transfer-field">
                <label>Select Payee</label>
                <select value={selectedPayee} onChange={e => setSelectedPayee(e.target.value)}>
                  <option value="">— Choose payee —</option>
                  {payees.map(p => (
                    <option key={p.id} value={p.id}>{p.nickname || p.name} · {p.account_no}</option>
                  ))}
                </select>
                <span className="field-hint" onClick={() => setPage("payees")}>+ Add new payee</span>
              </div>
            )}

            <div className="transfer-field">
              <label>Amount (₹)</label>
              <input type="number" placeholder="e.g. 500" value={amount} onChange={e => setAmount(e.target.value)} />
            </div>

            <div className="transfer-field">
              <label>Note (optional)</label>
              <input type="text" placeholder="e.g. Rent for April" value={note} onChange={e => setNote(e.target.value)} />
            </div>

            <button className="transfer-btn" onClick={handleTransfer}>Send Money →</button>
            <div className="transfer-notice">🔒 Transfers are processed securely and instantly</div>
          </div>
        </div>
      </div>
    </div>
  );
}
