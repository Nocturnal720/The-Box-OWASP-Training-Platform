import { useEffect, useState } from "react";
import "../styles/dashboard.css";
import Sidebar from "../components/Sidebar";
import { getScheduled, addScheduled, deleteScheduled, getPayees } from "../services/bankApi";

export default function Scheduled({ setPage, setUser }) {
  const userId = parseInt(localStorage.getItem("userId")) || 1;
  const [scheduled, setScheduled] = useState([]);
  const [payees, setPayees]       = useState([]);
  const [adding, setAdding]       = useState(false);
  const [form, setForm]           = useState({ payee_id: "", amount: "", frequency: "monthly", next_run_date: "", description: "" });

  const load = () => getScheduled(userId).then(setScheduled).catch(console.error);

  useEffect(() => {
    load();
    getPayees(userId).then(setPayees).catch(console.error);
  }, []);

  const handleAdd = async () => {
    if (!form.amount || !form.next_run_date) { alert("Fill amount and next run date"); return; }
    try {
      await addScheduled({ user_id: userId, ...form, payee_id: form.payee_id || null });
      setForm({ payee_id: "", amount: "", frequency: "monthly", next_run_date: "", description: "" });
      setAdding(false);
      load();
    } catch (err) { console.error(err); alert("Failed to schedule payment"); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Cancel this scheduled payment?")) return;
    try { await deleteScheduled(id); load(); }
    catch (err) { console.error(err); }
  };

  const freqBadge = (f) => ({ once: "🔵 Once", weekly: "🟢 Weekly", monthly: "🟡 Monthly" }[f] || f);

  return (
    <div className="dashboard">
      <Sidebar page="scheduled" setPage={setPage} setUser={setUser} userId={userId} />
      <div className="main">
        <div className="main-header">
          <h2>Scheduled Payments</h2>
          <p>Set up recurring or one-time future payments</p>
        </div>

        <div className="section-action-bar">
          <button className="action-btn" onClick={() => setAdding(!adding)}>
            {adding ? "✕ Cancel" : "+ Schedule Payment"}
          </button>
        </div>

        {adding && (
          <div className="form-card">
            <div className="form-grid">
              <div className="transfer-field">
                <label>Payee (optional)</label>
                <select value={form.payee_id} onChange={e => setForm({...form, payee_id: e.target.value})}>
                  <option value="">— Self / General —</option>
                  {payees.map(p => <option key={p.id} value={p.id}>{p.nickname || p.name}</option>)}
                </select>
              </div>
              <div className="transfer-field">
                <label>Amount (₹)</label>
                <input type="number" placeholder="e.g. 1000" value={form.amount} onChange={e => setForm({...form, amount: e.target.value})} />
              </div>
              <div className="transfer-field">
                <label>Frequency</label>
                <select value={form.frequency} onChange={e => setForm({...form, frequency: e.target.value})}>
                  <option value="once">Once</option>
                  <option value="weekly">Weekly</option>
                  <option value="monthly">Monthly</option>
                </select>
              </div>
              <div className="transfer-field">
                <label>Next Run Date</label>
                <input type="date" value={form.next_run_date} onChange={e => setForm({...form, next_run_date: e.target.value})} />
              </div>
              <div className="transfer-field" style={{ gridColumn: "1 / -1" }}>
                <label>Description</label>
                <input placeholder="e.g. Monthly rent" value={form.description} onChange={e => setForm({...form, description: e.target.value})} />
              </div>
            </div>
            <button className="transfer-btn" onClick={handleAdd}>Schedule Payment</button>
          </div>
        )}

        <div className="transactions">
          <div className="section-head">{scheduled.length} scheduled payment{scheduled.length !== 1 ? "s" : ""}</div>
          {scheduled.length === 0
            ? <div className="empty-row">No scheduled payments. Add one above.</div>
            : scheduled.map(s => (
              <div key={s.id} className="scheduled-row">
                <div className="scheduled-info">
                  <div className="scheduled-name">{s.description || (s.payee_name || "General Payment")}</div>
                  <div className="payee-meta">Next: {new Date(s.next_run_date).toLocaleDateString()} · {freqBadge(s.frequency)}</div>
                </div>
                <div className="scheduled-right">
                  <div className="scheduled-amount">₹{Number(s.amount).toLocaleString("en-IN")}</div>
                  <button className="payee-btn del" onClick={() => handleDelete(s.id)}>Cancel</button>
                </div>
              </div>
            ))
          }
        </div>
      </div>
    </div>
  );
}
