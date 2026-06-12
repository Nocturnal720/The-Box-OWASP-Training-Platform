const { generateFlag }              = require("../ModHelper/generateFlag");
const { isDisabled, disable }       = require("../ModHelper/vulnState");
const { broadcastSuccess }          = require("../ModHelper/successBroadcaster");
const { isVulnCompletedByUser, getVulnBlockMessage, VULN_TYPE_TO_ID } = require("../ModHelper/userVulnerabilityManager");
const { resolveUserIdFromToken } = require("../ModHelper/authToken");
const TYPE = "REFLECTED_XSS_2";
const VULN_ID = VULN_TYPE_TO_ID[TYPE];
const INFO = {
  name: "Reflected XSS â€” Profile Name",
  flag_type: TYPE,
  what: "The name parameter is reflected into the HTML response without encoding. Injecting a script tag causes it to execute in the browser.",
  why: "Same root cause as XSS #1 â€” user-controlled input placed directly into an HTML template without sanitization.",
  mitigation: "Encode all user input before rendering it in HTML. Apply a strict Content-Security-Policy to prevent inline script execution. Treat every URL parameter as untrusted input."
};
module.exports = (app, db) => {
  app.get("/profile", (req, res) => {
    res.setHeader("Content-Type", "text/html");
    if (isDisabled(TYPE, req)) {
      return res.status(403).send("<p style='font-family:sans-serif;padding:20px'>Forbidden: this vulnerability has already been exploited in this session.</p>");
    }
    const name = req.query.name || "";
    const isXSS = name.includes("<script>") || name.includes("onerror") || name.includes("<img");
    if (isXSS) {
      const token = req.headers.authorization || req.query.token;
      const authReq = { headers: { ...req.headers, authorization: token } };
      resolveUserIdFromToken(authReq, db, (authErr, uid) => {
        if (authErr) {
          return res.status(authErr.status || 401).send("<p style='font-family:sans-serif;padding:20px'>Unauthorized.</p>");
        }
        // Check persistence
        isVulnCompletedByUser(uid, TYPE, db, (err, isCompleted) => {
          if (isCompleted) {
            console.log(`ðŸ” [${TYPE}] User ${uid} already exploited - skipping`);
            const blockReason = getVulnBlockMessage(err);
            const text = blockReason === "Forbidden"
              ? "Forbidden: this vulnerability is not assigned in your current session."
              : "Forbidden: already exploited.";
            return res.status(403).send(`<p style='font-family:sans-serif;padding:20px'>${text}</p>`);
          }
          if (!isDisabled(TYPE, req)) {
            generateFlag(db, uid, TYPE, "profile", () => {});
            console.log(`ðŸ”” [BROADCAST] ${TYPE}`);
            disable(TYPE, INFO, req);
            // Mark complete
            db.query(`SELECT MAX(id) as session_id FROM sessions WHERE user_id = ?`, [uid], (err, sessionResult) => {
              const sessionId = sessionResult && sessionResult[0] ? sessionResult[0].session_id : null;
              if (!sessionId) return;
              db.query(`UPDATE user_vulnerabilities SET is_completed = 1, completed_at = NOW() WHERE user_id = ? AND vuln_id = ? AND session_id = ?`, [uid, VULN_ID, sessionId], (err) => {
                if (err) console.error(`âŒ [${TYPE}] Failed to mark complete:`, err);
              });
            });
            broadcastSuccess(INFO);
            const infoJson = JSON.stringify(INFO);
            res.send(`<h1>Welcome ${name}</h1>
<script>
try{localStorage.setItem('pendingVulnInfo',JSON.stringify(${infoJson}));}catch(e){}
if(window.opener){try{window.opener.postMessage({vuln_info:${infoJson}},'http://localhost:3000');}catch(e){}}
setTimeout(()=>{window.location.href='http://localhost:3000/fakebank';},1500);
</script>`);
            return;
          }

          return res.status(403).send("<p style='font-family:sans-serif;padding:20px'>Forbidden: this vulnerability has already been exploited in this session.</p>");
        });
      });
      return;
    }
    res.send(`<h1>Welcome ${name}</h1>`);
  });
};
