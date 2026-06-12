import { useEffect, useState } from "react";
import "../styles/dashboard.css";
import Sidebar from "../components/Sidebar";
import { getLoans, applyLoan, repayLoan, disburseLoan } from "../services/bankApi";

const PURPOSES = [
  "Home Renovation",
  "Medical Emergency",
  "Education",
  "Business Expansion",
  "Vehicle Purchase",
  "Personal / Other",
];

const statusColor = (s) => ({
  pending:  "#f59e0b",
  approved: "#22c55e",
  rejected: "#ef4444",
  closed:   "#6b7280",
}[s] || "#6b7280");

export default function Loans({ setPage, setUser }) {
  const userId = parseInt(localStorage.getItem("userId")) || 1;
  const [loans, setLoans]       = useState([]);
  const [applying, setApplying] = useState(false);
  const [repaying, setRepaying] = useState(null); // loan object
  const [form, setForm]         = useState({ amount: "", purpose: "" });
  const [repayAmt, setRepayAmt] = useState("");
  const [loading, setLoading]   = useState(true);

  const load = () => {
    setLoading(true);
    getLoans(userId).then(setLoans).catch(console.error).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const handleApply = async () => {
    if (!form.amount || !form.purpose) { alert("Fill in all fields"); return; }
    if (parseInt(form.amount) <= 0)    { alert("Enter a valid amount"); return; }
    try {
      await applyLoan({ user_id: userId, amount: parseInt(form.amount), purpose: form.purpose });
      setForm({ amount: "", purpose: "" });
      setApplying(false);
      load();
    } catch (err) { console.error(err); alert("Failed to apply for loan"); }
  };

  const handleRepay = async () => {
    if (!repayAmt || parseInt(repayAmt) <= 0) { alert("Enter a valid amount"); return; }
    try {
      await repayLoan({ loan_id: repaying.id, user_id: userId, amount: parseInt(repayAmt) });
      setRepaying(null);
      setRepayAmt("");
      load();
    } catch (err) { console.error(err); alert("Repayment failed"); }
  };

  const handleDisburse = async (loanId) => {
    if (!window.confirm("Disburse this loan? The amount will be credited to the account.")) return;
    try {
      await disburseLoan(loanId);
      load();
    } catch (err) { console.error(err); alert("Disburse failed"); }
  };

  const activeLoans   = loans.filter(l => l.status !== "closed" && l.status !== "rejected");
  const closedLoans   = loans.filter(l => l.status === "closed" || l.status === "rejected");

  return (
    <div className="dashboard">
      <Sidebar page="loans" setPage={setPage} setUser={setUser} userId={userId} />

      <div className="main">
        <div className="main-header">
          <h2>Loans</h2>
          <p>Apply for a loan or manage existing ones</p>
        </div>

        {/* Apply button */}
        <div className="section-action-bar">
          <button className="action-btn" onClick={() => setApplying(!applying)}>
            {applying ? "✕ Cancel" : "+ Apply for Loan"}
          </button>
        </div>

        {/* Application form */}
        {applying && (
          <div className="form-card">
            <div className="form-card-head">Loan Application</div>
            <div className="form-grid">
              <div className="transfer-field">
                <label>Loan Amount (₹)</label>
                <input
                  type="number"
                  placeholder="e.g. 50000"
                  value={form.amount}
                  onChange={e => setForm({ ...form, amount: e.target.value })}
                />
              </div>
              <div className="transfer-field">
                <label>Purpose</label>
                <select value={form.purpose} onChange={e => setForm({ ...form, purpose: e.target.value })}>
                  <option value="">— Select purpose —</option>
                  {PURPOSES.map(p => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>
            </div>
            <div className="loan-hint">
              💡 Loans are reviewed within 2–3 business days. Approved amounts are credited directly to your account.
            </div>
            <button className="transfer-btn" onClick={handleApply}>Submit Application →</button>
          </div>
        )}

        {/* Repay modal */}
        {repaying && (
          <div className="modal-overlay" onClick={() => setRepaying(null)}>
            <div className="modal-card" onClick={e => e.stopPropagation()}>
              <div className="modal-head">Repay Loan #{repaying.id}</div>
              <div className="modal-body">
                <p className="modal-meta">Outstanding: <strong>₹{Number(repaying.outstanding).toLocaleString("en-IN")}</strong></p>
                <div className="transfer-field" style={{ marginTop: 16 }}>
                  <label>Repayment Amount (₹)</label>
                  <input
                    type="number"
                    placeholder={`Max ₹${repaying.outstanding}`}
                    value={repayAmt}
                    onChange={e => setRepayAmt(e.target.value)}
                  />
                </div>
                <div style={{ display: "flex", gap: 10, marginTop: 16 }}>
                  <button className="transfer-btn" style={{ flex: 1 }} onClick={handleRepay}>Confirm Repayment</button>
                  <button className="payee-btn del" style={{ padding: "11px 20px" }} onClick={() => setRepaying(null)}>Cancel</button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Active loans */}
        {loading ? (
          <p style={{ color: "#aaa", fontSize: 14, padding: "16px 0" }}>Loading loans…</p>
        ) : (
          <>
            <div className="transactions" style={{ marginTop: 24 }}>
              <div className="section-head">
                Active Loans
                <span>{activeLoans.length} loan{activeLoans.length !== 1 ? "s" : ""}</span>
              </div>
              {activeLoans.length === 0 ? (
                <div className="empty-row">No active loans.</div>
              ) : (
                activeLoans.map(loan => (
                  <div key={loan.id} className="loan-row">
                    <div className="loan-left">
                      <div className="loan-id">Loan #{loan.id}</div>
                      <div className="loan-purpose">{loan.purpose || "General"}</div>
                      <div className="loan-dates">
                        Applied {new Date(loan.created_at).toLocaleDateString()}
                      </div>
                    </div>
                    <div className="loan-mid">
                      <div className="loan-amount">₹{Number(loan.amount).toLocaleString("en-IN")}</div>
                      <div className="loan-outstanding">
                        {loan.outstanding > 0
                          ? `₹${Number(loan.outstanding).toLocaleString("en-IN")} outstanding`
                          : "Fully repaid"}
                      </div>
                    </div>
                    <div className="loan-right">
                      <span className="loan-badge" style={{ background: statusColor(loan.status) + "22", color: statusColor(loan.status), border: `1px solid ${statusColor(loan.status)}44` }}>
                        {loan.status}
                      </span>
                      <div className="loan-actions">
                        {loan.status === "approved" && loan.disbursed === 0 && (
                          <button className="payee-btn send" onClick={() => handleDisburse(loan.id)}>Disburse</button>
                        )}
                        {loan.status === "approved" && loan.disbursed === 1 && loan.outstanding > 0 && (
                          <button className="payee-btn send" onClick={() => setRepaying(loan)}>Repay</button>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {closedLoans.length > 0 && (
              <div className="transactions" style={{ marginTop: 16 }}>
                <div className="section-head">
                  Past Loans
                  <span>{closedLoans.length} loan{closedLoans.length !== 1 ? "s" : ""}</span>
                </div>
                {closedLoans.map(loan => (
                  <div key={loan.id} className="loan-row" style={{ opacity: 0.6 }}>
                    <div className="loan-left">
                      <div className="loan-id">Loan #{loan.id}</div>
                      <div className="loan-purpose">{loan.purpose || "General"}</div>
                    </div>
                    <div className="loan-mid">
                      <div className="loan-amount">₹{Number(loan.amount).toLocaleString("en-IN")}</div>
                    </div>
                    <div className="loan-right">
                      <span className="loan-badge" style={{ background: statusColor(loan.status) + "22", color: statusColor(loan.status), border: `1px solid ${statusColor(loan.status)}44` }}>
                        {loan.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
