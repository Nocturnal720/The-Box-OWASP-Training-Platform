const BASE = "http://localhost:5000";

const authHeaders = () => {
  const bankToken = localStorage.getItem("bankToken") || localStorage.getItem("token") || "";
  const bankAssigned = localStorage.getItem("bankAssignedVulns") || localStorage.getItem("assignedVulns") || "[]";
  const labToken = localStorage.getItem("labToken") || "";

  return {
    "Content-Type": "application/json",
    Authorization: bankToken,
    "x-assigned-vulns": bankAssigned,
    ...(labToken ? { "x-lab-token": labToken } : {}),
  };
};

const fireIfVuln = (data) => {
  if (data && data.vuln_info) {
    window.dispatchEvent(new CustomEvent("vulnExploited", { detail: data.vuln_info }));
  }
  return data;
};

const handle = async (res) => {
  if (!res.ok) { const e = await res.text(); throw new Error(e || "Error"); }
  return res.json().then(fireIfVuln);
};

// ── Auth ──────────────────────────────────────────────────
export const loginUser       = (u, p) => fetch(`${BASE}/bank/login`, { method:"POST", headers: authHeaders(), body: JSON.stringify({ username:u, password:p }) }).then(handle);
export const logoutUser      = (id) => fetch(`${BASE}/logout`, { method:"POST", headers: authHeaders(), body: JSON.stringify({ user_id:id }) }).then(handle);

// ── Account ───────────────────────────────────────────────
export const getBalance      = async (id) => { const r = await fetch(`${BASE}/balance/${id}`, { cache:"no-store", headers: authHeaders() }); const t = await r.text(); const d = t ? JSON.parse(t) : {}; return fireIfVuln(d); };
export const getAccountDetails = (id) => fetch(`${BASE}/account/${id}`, { cache:"no-store", headers: authHeaders() }).then(handle);

// ── Transactions ──────────────────────────────────────────
export const getTransactions = (id) => fetch(`${BASE}/transactions/${id}`, { cache:"no-store", headers: authHeaders() }).then(handle);
export const addTransaction  = (data) => fetch(`${BASE}/transaction`, { method:"POST", headers: authHeaders(), body: JSON.stringify(data) }).then(handle);
export const getMiniStatement= (id) => fetch(`${BASE}/mini-statement/${id}`, { cache:"no-store", headers: authHeaders() }).then(handle);

// ── Transfers ─────────────────────────────────────────────
export const transferMoney   = (data) => fetch(`${BASE}/transfer`, { method:"POST", headers: authHeaders(), body: JSON.stringify(data) }).then(handle);
export const transferToPayee = (data) => fetch(`${BASE}/transfer/payee`, { method:"POST", headers: authHeaders(), body: JSON.stringify(data) }).then(handle);

// ── Payees ────────────────────────────────────────────────
export const getPayees       = (id) => fetch(`${BASE}/payees/${id}`, { cache:"no-store", headers: authHeaders() }).then(handle);
export const addPayee        = (data) => fetch(`${BASE}/payees`, { method:"POST", headers: authHeaders(), body: JSON.stringify(data) }).then(handle);
export const deletePayee     = (id) => fetch(`${BASE}/payees/${id}`, { method:"DELETE", headers: authHeaders() }).then(handle);

// ── Scheduled Payments ────────────────────────────────────
export const getScheduled    = (id) => fetch(`${BASE}/scheduled/${id}`, { cache:"no-store", headers: authHeaders() }).then(handle);
export const addScheduled    = (data) => fetch(`${BASE}/scheduled`, { method:"POST", headers: authHeaders(), body: JSON.stringify(data) }).then(handle);
export const deleteScheduled = (id) => fetch(`${BASE}/scheduled/${id}`, { method:"DELETE", headers: authHeaders() }).then(handle);

// ── Notifications ─────────────────────────────────────────
export const getNotifications  = (id) => fetch(`${BASE}/notifications/${id}`, { cache:"no-store", headers: authHeaders() }).then(handle);
export const markNotificationsRead = (id) => fetch(`${BASE}/notifications/read/${id}`, { method:"POST", headers: authHeaders() }).then(handle);

// ── Support ───────────────────────────────────────────────
export const getTickets      = (id) => fetch(`${BASE}/support/${id}`, { cache:"no-store", headers: authHeaders() }).then(handle);
export const submitTicket    = (data) => fetch(`${BASE}/support`, { method:"POST", headers: authHeaders(), body: JSON.stringify(data) }).then(handle);

// ── Activity ──────────────────────────────────────────────
export const getActivity     = (id) => fetch(`${BASE}/activity/${id}`, { cache:"no-store", headers: authHeaders() }).then(handle);

// ── Loans ─────────────────────────────────────────────────
export const getLoans     = (id)   => fetch(`${BASE}/loans/${id}`, { cache:"no-store", headers: authHeaders() }).then(handle);
export const getLoan      = (id)   => fetch(`${BASE}/loan/${id}`,  { cache:"no-store", headers: authHeaders() }).then(handle);
export const applyLoan    = (data) => fetch(`${BASE}/loan`,        { method:"POST", headers: authHeaders(), body: JSON.stringify(data) }).then(handle);
export const disburseLoan = (id)   => fetch(`${BASE}/loan/disburse/${id}`, { method:"POST", headers: authHeaders() }).then(handle);
export const repayLoan    = (data) => fetch(`${BASE}/loan/repay`,  { method:"POST", headers: authHeaders(), body: JSON.stringify(data) }).then(handle);

// ── Flags ─────────────────────────────────────────────────
export const getFlags     = (id)   => fetch(`${BASE}/flags/${id}`, { cache:"no-store", headers: authHeaders() }).then(handle);
