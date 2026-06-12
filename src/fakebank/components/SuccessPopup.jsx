import { useEffect, useState } from "react";
import "./SuccessPopup.css";

const SUCCESS_STORAGE_KEY = "pendingSuccessInfo";

export default function SuccessPopup() {
  const [popup, setPopup] = useState(null);
  const [visible, setVisible] = useState(false);
  const [isAssigning, setIsAssigning] = useState(false);

  const resolveUserId = () => {
    const directId = Number(localStorage.getItem("labUserId") || 0);
    if (directId) return directId;

    try {
      const user = JSON.parse(localStorage.getItem("user") || "{}");
      const parsed = Number(user.user_id || user.id || 0) || 0;
      if (parsed) {
        localStorage.setItem("labUserId", String(parsed));
      }
      return parsed;
    } catch (_) {
      return 0;
    }
  };

  const getAssignedFromPayload = (info) => {
    if (Array.isArray(info?.nextAssignedVulns)) return info.nextAssignedVulns;
    if (Array.isArray(info?.assignedVulns)) return info.assignedVulns;
    return null;
  };

  const syncAssignedVulns = (info) => {
    const assigned = getAssignedFromPayload(info);
    if (!assigned) return;

    const serialized = JSON.stringify(assigned);

    localStorage.setItem("bankAssignedVulns", serialized);
    localStorage.setItem("assignedVulns", serialized);
    if (localStorage.getItem("labToken")) {
      localStorage.setItem("labAssignedVulns", serialized);
    }
  };

  const show = (info) => {
    if (info) {
      syncAssignedVulns(info);
      setPopup(info);
      setVisible(true);
    }
  };

  useEffect(() => {
    // Listen for success events from SSE
    const es = new EventSource("http://localhost:5000/vuln-events");
    
    es.onmessage = (e) => {
      try {
        const data = JSON.parse(e.data);
        if (data.isSuccess && data.allCompleted) {
          show(data);
        }
      } catch (_) {}
    };

    es.onerror = () => {};

    // Also check localStorage for any pending success
    const checkStorage = () => {
      try {
        const raw = localStorage.getItem(SUCCESS_STORAGE_KEY);
        if (raw) {
          localStorage.removeItem(SUCCESS_STORAGE_KEY);
          show(JSON.parse(raw));
        }
      } catch (e) {}
    };

    const onFocus = () => checkStorage();
    checkStorage();

    window.addEventListener("focus", onFocus);
    window.addEventListener("visibilitychange", onFocus);

    return () => {
      es.close();
      window.removeEventListener("focus", onFocus);
      window.removeEventListener("visibilitychange", onFocus);
    };
  }, []);

  const close = () => setVisible(false);

  const ensureNextRoundAssigned = async () => {
    const labToken = localStorage.getItem("labToken") || "";
    const authToken =
      labToken ||
      localStorage.getItem("token") ||
      localStorage.getItem("bankToken") ||
      "";

    if (!authToken) return;

    const headers = {
      "Content-Type": "application/json",
      Authorization: authToken,
      "X-Assigned-Vulns":
        localStorage.getItem("bankAssignedVulns") ||
        localStorage.getItem("assignedVulns") ||
        "[]"
    };

    if (labToken) headers["X-Lab-Token"] = labToken;

    const userId = resolveUserId();
    const body = userId ? { user_id: userId } : {};

    const resp = await fetch("http://localhost:5000/api/vuln-next-round", {
      method: "POST",
      headers,
      body: JSON.stringify(body)
    });

    if (!resp.ok) {
      throw new Error(await resp.text());
    }

    const data = await resp.json();
    syncAssignedVulns(data);
  };

  const handleBackToMain = async () => {
    if (isAssigning) return;
    setIsAssigning(true);

    try {
      await ensureNextRoundAssigned();
    } catch (err) {
      console.error("❌ SuccessPopup: failed to refresh next round assignment", err);
    }

    setVisible(false);
    setTimeout(() => {
      window.location.href = "/dashboard";
    }, 300);
  };

  if (!visible || !popup) return null;

  return (
    <div className="sp-overlay" onClick={close}>
      <div className="sp-modal" onClick={(e) => e.stopPropagation()}>
        
        <div className="sp-header">
          <div className="sp-badge">
            <span className="sp-badge-icon">✓</span>
            <span className="sp-badge-label">Session Complete</span>
          </div>
          <button className="sp-close" onClick={close}>✕</button>
        </div>

        <div className="sp-title">🎉 All Vulnerabilities Secured!</div>
        <div className="sp-subtitle">
          You've successfully completed {popup.completed || 8} out of {popup.total || 8} vulnerabilities in this session.
        </div>

        <div className="sp-stats">
          <div className="sp-stat-item">
            <div className="sp-stat-number">{popup.session || 1}</div>
            <div className="sp-stat-label">Session</div>
          </div>
          <div className="sp-stat-item">
            <div className="sp-stat-number">{popup.completed || 8}/{popup.total || 8}</div>
            <div className="sp-stat-label">Completed</div>
          </div>
        </div>

        <div className="sp-section">
          <div className="sp-section-head">What's Next?</div>
          <div className="sp-section-body">
            A new set of 8 random vulnerabilities has been assigned to your account.
            Continue from the main page to start your next round.
          </div>
        </div>

        <div className="sp-buttons">
          <button className="sp-btn sp-btn-primary" onClick={handleBackToMain} disabled={isAssigning}>
            {isAssigning ? "Preparing Next Round..." : "Back to Main Page"}
          </button>
          <button className="sp-btn sp-btn-secondary" onClick={close}>
            Close
          </button>
        </div>

      </div>
    </div>
  );
}

