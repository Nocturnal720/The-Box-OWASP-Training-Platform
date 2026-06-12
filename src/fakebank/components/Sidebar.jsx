import "../styles/dashboard.css";
import { getNotifications, markNotificationsRead } from "../services/bankApi";
import { useEffect, useState } from "react";

const NAV = [
  { key: "dashboard",    icon: "🏠", label: "Dashboard" },
  { key: "transactions", icon: "📋", label: "Transactions" },
  { key: "transfer",     icon: "↗",  label: "Transfer" },
  { key: "payees",       icon: "👥", label: "Payees" },
  { key: "scheduled",    icon: "🗓", label: "Scheduled" },
  { key: "loans",        icon: "💰", label: "Loans" },
  { key: "support",      icon: "🎫", label: "Support" },
  { key: "profile",      icon: "👤", label: "Profile" },
  // { key: "flags",        icon: "🚩", label: "Flags" }, // Disabled - for bank use only
];

export default function Sidebar({ page, setPage, setUser, userId }) {
  const [unread, setUnread] = useState(0);

  useEffect(() => {
    if (!userId) return;
    getNotifications(userId)
      .then((n) => setUnread(n.filter((x) => !x.is_read).length))
      .catch(() => {});
  }, [page, userId]);

  const logout = () => {
    localStorage.removeItem("userId");
    localStorage.removeItem("token");
    if (setUser) setUser(null);
  };

  return (
    <div className="sidebar">
      <div>
        <h2>FakeBank</h2>
        <span className="sidebar-brand-tag">Personal Banking</span>
        <div className="menu">
          {NAV.map((item) => (
            <p key={item.key} className={page === item.key ? "active" : ""} onClick={() => setPage(item.key)}>
              <span className="nav-icon">{item.icon}</span>
              {item.label}
            </p>
          ))}
        </div>
      </div>
      <div className="sidebar-bottom">
        {unread > 0 && (
          <div className="notif-pill" onClick={() => { markNotificationsRead(userId); setUnread(0); }}>
            🔔 {unread} new
          </div>
        )}
        <button onClick={logout}>Sign out</button>
      </div>
    </div>
  );
}
