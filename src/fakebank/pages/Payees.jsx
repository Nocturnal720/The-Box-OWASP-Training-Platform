import { useEffect, useState } from "react";
import "../styles/dashboard.css";
import Sidebar from "../components/Sidebar";
import { getPayees, addPayee, deletePayee } from "../services/bankApi";

export default function Payees({ setPage, setUser }) {
  const userId = parseInt(localStorage.getItem("userId")) || 1;
  const [payees, setPayees]   = useState([]);
  const [form, setForm]       = useState({ name: "", account_no: "", ifsc: "", nickname: "" });
  const [adding, setAdding]   = useState(false);

  const load = () => getPayees(userId).then(setPayees).catch(console.error);
  useEffect(() => { load(); }, []);

  const handleAdd = async () => {
    if (!form.name || !form.account_no || !form.ifsc) { alert("Fill in name, account number and IFSC"); return; }
    try {
      await addPayee({ user_id: userId, ...form });
      setForm({ name: "", account_no: "", ifsc: "", nickname: "" });
      setAdding(false);
      load();
    } catch (err) { console.error(err); alert("Failed to add payee"); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Remove this payee?")) return;
    try { await deletePayee(id); load(); }
    catch (err) { console.error(err); }
  };

  return (
    <div className="dashboard">
      <Sidebar page="payees" setPage={setPage} setUser={setUser} userId={userId} />
      <div className="main">
        <div className="main-header">
          <h2>Saved Payees</h2>
          <p>Manage your saved beneficiaries for quick transfers</p>
        </div>

        <div className="section-action-bar">
          <button className="action-btn" onClick={() => setAdding(!adding)}>
            {adding ? "✕ Cancel" : "+ Add Payee"}
          </button>
        </div>

        {adding && (
          <div className="form-card">
            <div className="form-grid">
              <div className="transfer-field">
                <label>Full Name</label>
                <input placeholder="e.g. Rahul Sharma" value={form.name} onChange={e => setForm({...form, name: e.target.value})} />
              </div>
              <div className="transfer-field">
                <label>Nickname (optional)</label>
                <input placeholder="e.g. Rahul" value={form.nickname} onChange={e => setForm({...form, nickname: e.target.value})} />
              </div>
              <div className="transfer-field">
                <label>Account Number</label>
                <input placeholder="e.g. 1234567890" value={form.account_no} onChange={e => setForm({...form, account_no: e.target.value})} />
              </div>
              <div className="transfer-field">
                <label>IFSC Code</label>
                <input placeholder="e.g. HDFC0001234" value={form.ifsc} onChange={e => setForm({...form, ifsc: e.target.value})} />
              </div>
            </div>
            <button className="transfer-btn" onClick={handleAdd}>Save Payee</button>
          </div>
        )}

        <div className="transactions">
          <div className="section-head">{payees.length} saved payee{payees.length !== 1 ? "s" : ""}</div>
          {payees.length === 0
            ? <div className="empty-row">No payees yet. Add one above.</div>
            : payees.map(p => (
              <div key={p.id} className="payee-row">
                <div className="payee-avatar">{(p.nickname || p.name)[0].toUpperCase()}</div>
                <div className="payee-info">
                  <div className="payee-name">{p.name} {p.nickname && <span className="payee-nick">({p.nickname})</span>}</div>
                  <div className="payee-meta">{p.account_no} · {p.ifsc}</div>
                </div>
                <div className="payee-actions">
                  <button className="payee-btn send" onClick={() => { localStorage.setItem("prefill_payee", p.id); setPage("transfer"); }}>Send</button>
                  <button className="payee-btn del" onClick={() => handleDelete(p.id)}>Remove</button>
                </div>
              </div>
            ))
          }
        </div>
      </div>
    </div>
  );
}
