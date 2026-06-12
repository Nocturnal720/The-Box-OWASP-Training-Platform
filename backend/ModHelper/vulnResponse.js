// Smart responder: serves a styled HTML page for address-bar visits,
// plain JSON (with vuln_info merged) for fetch() calls.
// Also writes vuln_info to localStorage via an injected script so the
// React app can show the popup when the user returns to localhost:3000.

const { broadcastSuccess } = require("./successBroadcaster");

const buildHtmlPage = (data, info) => {
  const dataStr = JSON.stringify(data, null, 2)
    .replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;");
  const infoJson = JSON.stringify(info);

  return `<!DOCTYPE html><html lang="en">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>⚠ ${info.name} — Exploited</title>
<link href="https://fonts.googleapis.com/css2?family=Sora:wght@300;400;500;600&family=DM+Mono:wght@400;500&display=swap" rel="stylesheet"/>
<style>
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:'Sora',sans-serif;background:#f0f2f5;color:#1a1a2e;min-height:100vh;display:flex;align-items:flex-start;justify-content:center;padding:40px 16px 60px}
.wrap{width:100%;max-width:560px;display:flex;flex-direction:column;gap:16px}
.card{background:#fff;border-radius:14px;border:1px solid #e8eaf0;overflow:hidden}
.badge-row{display:flex;align-items:center;gap:10px;padding:16px 20px;border-bottom:1px solid #f0f2f5}
.badge-icon{width:32px;height:32px;background:#fff3cd;border:1.5px solid #ffc107;border-radius:8px;display:flex;align-items:center;justify-content:center;font-size:15px;flex-shrink:0}
.badge-label{font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:.1em;color:#e09000}
.vuln-title{font-size:20px;font-weight:600;letter-spacing:-.02em;padding:16px 20px 6px}
.flag-chip{margin:0 20px 16px;display:inline-block;font-size:10px;font-weight:600;letter-spacing:.12em;text-transform:uppercase;color:#1a1a2e;background:#f0f2f5;border-radius:6px;padding:4px 10px}
.section{margin:0 20px 14px;border:1px solid #e8eaf0;border-radius:10px;overflow:hidden}
.section-label{font-size:10px;font-weight:600;text-transform:uppercase;letter-spacing:.1em;color:#aaa;background:#f8f9fb;padding:8px 14px;border-bottom:1px solid #e8eaf0}
.section-body{font-size:13.5px;color:#444;line-height:1.65;padding:12px 14px}
.fix .section-label{color:#1a8a4a;background:#f0faf4;border-bottom-color:#d4edda}
.fix{border-color:#d4edda}
.disabled-notice{margin:0 20px 18px;font-size:12px;color:#888;background:#f8f9fb;border-radius:8px;padding:10px 14px;border:1px solid #e8eaf0}
.back-btn{display:block;width:calc(100% - 40px);margin:0 20px 20px;padding:13px;background:#1a1a2e;color:#fff;border:none;border-radius:10px;font-size:14px;font-weight:500;font-family:'Sora',sans-serif;cursor:pointer;text-align:center;text-decoration:none;transition:background .15s}
.back-btn:hover{background:#2d2d4e}
.data-card{background:#fff;border-radius:14px;border:1px solid #e8eaf0;overflow:hidden}
.data-head{font-size:10px;font-weight:600;text-transform:uppercase;letter-spacing:.1em;color:#aaa;background:#f8f9fb;padding:10px 16px;border-bottom:1px solid #e8eaf0}
pre{font-family:'DM Mono',monospace;font-size:12px;color:#1a1a2e;padding:16px;overflow-x:auto;line-height:1.6;white-space:pre-wrap;word-break:break-all}
</style>
</head>
<body>
<div class="wrap">
  <div class="card">
    <div class="badge-row">
      <div class="badge-icon">⚠</div>
      <div class="badge-label">Vulnerability Exploited</div>
    </div>
    <div class="vuln-title">${info.name}</div>
    <div class="flag-chip">FLAG TYPE: ${info.flag_type}</div>
    <div class="section"><div class="section-label">What happened</div><div class="section-body">${info.what}</div></div>
    <div class="section"><div class="section-label">Why it exists</div><div class="section-body">${info.why}</div></div>
    <div class="section fix"><div class="section-label">How to fix it</div><div class="section-body">${info.mitigation}</div></div>
    <div class="disabled-notice">🔒 This vulnerability has been disabled for this session.</div>
    <a class="back-btn" href="http://localhost:3000/fakebank">← Back to FakeBank</a>
  </div>
  <div class="data-card">
    <div class="data-head">Response Data</div>
    <pre>${dataStr}</pre>
  </div>
</div>
<script>
  try { localStorage.setItem('pendingVulnInfo', ${infoJson.replace(/\\/g,'\\\\').replace(/`/g,'\\`')}); } catch(e){}
  if (window.opener) { try { window.opener.postMessage({ vuln_info: ${infoJson} }, 'http://localhost:3000'); } catch(e){} }
</script>
</body></html>`;
};

// Detects address-bar (Accept: text/html) vs fetch (Accept: application/json or */*)
const sendVulnResponse = (req, res, data, info) => {
  // Broadcast to all SSE clients to trigger popup
  // Send the vuln_info directly (not wrapped) - VulnPopup expects name, flag_type, what, why, mitigation
  broadcastSuccess(info);

  const accept = req.headers.accept || "";
  if (accept.includes("text/html")) {
    res.setHeader("Content-Type", "text/html");
    return res.send(buildHtmlPage(data, info));
  }
  return res.json({ ...data, vuln_info: info });
};

module.exports = { sendVulnResponse };
