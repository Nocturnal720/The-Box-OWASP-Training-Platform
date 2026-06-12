import { useEffect, useState } from "react";
import "../styles/dashboard.css";
import Sidebar from "../components/Sidebar";
import { getTickets, submitTicket } from "../services/bankApi";

const SUBJECTS = [
  "Transaction not reflecting",
  "Account locked / access issue",
  "Transfer failed but amount debited",
  "Update account details",
  "Report unauthorized activity",
  "Other",
];

export default function Support({ setPage, setUser }) {
  const userId = parseInt(localStorage.getItem("userId")) || 1;
  const [tickets, setTickets]   = useState([]);
  const [form, setForm]         = useState({ subject: "", message: "" });
  const [submitting, setSubmitting] = useState(false);

  const load = () => getTickets(userId).then(setTickets).catch(console.error);
  useEffect(() => { load(); }, []);

  const handleSubmit = async () => {
    if (!form.subject || !form.message) { alert("Please fill in all fields"); return; }
    try {
      setSubmitting(true);
      await submitTicket({ user_id: userId, ...form });
      setForm({ subject: "", message: "" });
      load();
    } catch (err) { console.error(err); alert("Failed to submit ticket"); }
    finally { setSubmitting(false); }
  };

  return (
    <div className="dashboard">
      <Sidebar page="support" setPage={setPage} setUser={setUser} userId={userId} />
      <div className="main">
        <div className="main-header">
          <h2>Support</h2>
          <p>Raise a ticket and we'll look into it</p>
        </div>

        <div className="support-grid">
          <div className="form-card">
            <div className="form-card-head">New Ticket</div>
            <div className="transfer-field">
              <label>Subject</label>
              <select value={form.subject} onChange={e => setForm({...form, subject: e.target.value})}>
                <option value="">— Select a subject —</option>
                {SUBJECTS.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div className="transfer-field">
              <label>Message</label>
              <textarea
                rows={5}
                placeholder="Describe your issue in detail…"
                value={form.message}
                onChange={e => setForm({...form, message: e.target.value})}
                style={{ width: "100%", padding: "12px 14px", borderRadius: 9, border: "1.5px solid #e8eaf0", background: "#f8f9fb", fontFamily: "Sora, sans-serif", fontSize: 14, resize: "vertical", outline: "none", color: "#1a1a2e" }}
              />
            </div>
            <button className="transfer-btn" onClick={handleSubmit} disabled={submitting}>
              {submitting ? "Submitting…" : "Submit Ticket"}
            </button>
          </div>

          <div>
            <div className="transactions">
              <div className="section-head">My Tickets</div>
              {tickets.length === 0
                ? <div className="empty-row">No tickets yet</div>
                : tickets.map(t => (
                  <div key={t.id} className="ticket-row">
                    <div>
                      <div className="ticket-subject">{t.subject}</div>
                      <div className="tx-date">{new Date(t.created_at).toLocaleString()}</div>
                    </div>
                    <span className={`ticket-badge ${t.status}`}>{t.status}</span>
                  </div>
                ))
              }
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
