import { useEffect, useRef, useState } from "react";
import "./VulnPopup.css";

const STORAGE_KEY = "pendingVulnInfo";

export default function VulnPopup() {
  const [popup,   setPopup]   = useState(null);
  const [visible, setVisible] = useState(false);
  const inFlightCompletions = useRef(new Set());
  const pendingCompletionInfo = useRef(null);

  const resolveUserId = () => {
    const directId = Number(localStorage.getItem("labUserId") || 0);
    if (directId) return directId;

    try {
      const user = JSON.parse(localStorage.getItem("user") || "{}");
      const parsed = Number(user.user_id || user.id || 0);
      if (parsed) {
        localStorage.setItem("labUserId", String(parsed));
      }
      return parsed || 0;
    } catch (_) {
      return 0;
    }
  };

  const notifyCompletion = async (info) => {
    const vulnType = info?.flag_type;
    const userId = resolveUserId();
    const labToken = localStorage.getItem("labToken") || "";
    const authToken = labToken || localStorage.getItem("token") || localStorage.getItem("bankToken") || "";

    if (!vulnType || !authToken) return;

    const dedupeIdentity = userId ? `lab-user-${String(userId)}` : authToken;
    const dedupeKey = `${dedupeIdentity}:${vulnType}`;
    if (inFlightCompletions.current.has(dedupeKey)) return;
    inFlightCompletions.current.add(dedupeKey);

    const headers = {
      "Content-Type": "application/json",
      Authorization: authToken,
      "X-Assigned-Vulns": localStorage.getItem("bankAssignedVulns") || localStorage.getItem("assignedVulns") || "[]"
    };

    if (labToken) headers["X-Lab-Token"] = labToken;

    try {
      const body = userId ? { user_id: userId, vuln_type: vulnType } : { vuln_type: vulnType };

      const resp = await fetch("http://localhost:5000/api/vuln-completed", {
        method: "POST",
        headers,
        body: JSON.stringify(body)
      });

      if (!resp.ok) {
        console.error("❌ VulnPopup: completion API failed", await resp.text());
      }
    } catch (err) {
      console.error("❌ VulnPopup: failed to notify completion", err);
    } finally {
      setTimeout(() => {
        inFlightCompletions.current.delete(dedupeKey);
      }, 1500);
    }
  };

  const show = (info) => {
    if (!info || info.isSuccess) return;
    pendingCompletionInfo.current = info;
    setPopup(info);
    setVisible(true);
  };

  const checkStorage = () => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) { localStorage.removeItem(STORAGE_KEY); show(JSON.parse(raw)); }
    } catch (e) {}
  };

  useEffect(() => {
    // ── SSE: backend pushes vuln_info the instant ANY exploit fires ──────────
    // This catches console fetch(), in-app calls, and everything in between.
    const es = new EventSource("http://localhost:5000/vuln-events");
    console.log("🔌 VulnPopup: Connecting to SSE /vuln-events");
    
    es.onopen = () => {
      console.log("✅ VulnPopup: SSE connected!");
    };
    
    es.onmessage = (e) => {
      console.log("📨 VulnPopup: Received SSE message:", e.data);
      try { show(JSON.parse(e.data)); } catch (err) {
        console.error("❌ VulnPopup: Failed to parse SSE data:", err);
      }
    };
    
    es.onerror = (err) => {
      console.error("❌ VulnPopup: SSE error:", err);
    };

    // ── postMessage: XSS pages redirect back and postMessage ─────────────────
    const onMessage = (e) => {
      if (e.origin === "http://localhost:5000" && e.data?.vuln_info) show(e.data.vuln_info);
    };

    // ── localStorage: URL-bar exploit pages write here; picked up on focus ───
    const onFocus = () => checkStorage();
    checkStorage(); // catch anything pending from before mount

    window.addEventListener("message",          onMessage);
    window.addEventListener("focus",            onFocus);
    window.addEventListener("visibilitychange", onFocus);

    return () => {
      es.close();
      window.removeEventListener("message",          onMessage);
      window.removeEventListener("focus",            onFocus);
      window.removeEventListener("visibilitychange", onFocus);
    };
  }, []);

  const close = () => {
    const infoToComplete = pendingCompletionInfo.current;
    pendingCompletionInfo.current = null;

    setVisible(false);
    if (infoToComplete) {
      notifyCompletion(infoToComplete);
    }
  };
  if (!visible || !popup) return null;

  return (
    <div className="vp-overlay" onClick={close}>
      <div className="vp-modal" onClick={(e) => e.stopPropagation()}>

        <div className="vp-header">
          <div className="vp-badge">
            <span className="vp-badge-icon">⚠</span>
            <span className="vp-badge-label">Vulnerability Exploited</span>
          </div>
          <button className="vp-close" onClick={close}>✕</button>
        </div>

        <div className="vp-title">{popup.name}</div>
        <div className="vp-chip">FLAG TYPE: {popup.flag_type}</div>

        <div className="vp-section">
          <div className="vp-section-head">What happened</div>
          <div className="vp-section-body">{popup.what}</div>
        </div>

        <div className="vp-section">
          <div className="vp-section-head">Why it exists</div>
          <div className="vp-section-body">{popup.why}</div>
        </div>

        <div className="vp-section vp-section-fix">
          <div className="vp-section-head">How to fix it</div>
          <div className="vp-section-body">{popup.mitigation}</div>
        </div>

        <div className="vp-disabled">🔒 This vulnerability has been disabled for this session.</div>

        <button className="vp-btn" onClick={close}>Got it</button>
      </div>
    </div>
  );
}
