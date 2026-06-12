const { generateFlag }              = require("../ModHelper/generateFlag");
const { isDisabled, disable, disableImmediate }       = require("../ModHelper/vulnState");
const { sendVulnResponse }          = require("../ModHelper/vulnResponse");
const { isVulnCompletedByUser, getVulnBlockMessage, VULN_TYPE_TO_ID } = require("../ModHelper/userVulnerabilityManager");
const { resolveUserIdFromToken, sendAuthError } = require("../ModHelper/authToken");
const TYPE = "DEBUG";
const VULN_ID = VULN_TYPE_TO_ID[TYPE];
const INFO = {
  name: "Debug Endpoint Exposed",
  flag_type: TYPE,
  what: "A debug route left open in production returns the full process.env object, exposing database passwords, API keys, and internal configuration to anyone who visits the URL.",
  why: "Debug endpoints are added during development for convenience and are frequently forgotten when deploying to production.",
  mitigation: "Remove all debug routes before deploying. Use environment-specific config so debug tooling only exists in development. Never expose process.env or internal server state to any client."
};
module.exports = (app, db) => {
  app.get("/debug", (req, res) => {
    console.log(`ðŸ” /debug endpoint called - isDisabled=${isDisabled(TYPE, req)}`);
    
    if (isDisabled(TYPE, req)) {
      return res.status(403).json({ error: "Vulnerability already exploited" });
    }
    
    if (isDisabled(TYPE, req)) {
      return res.status(403).json({ error: "User not vulnerable to this exploit" });
    }

    resolveUserIdFromToken(req, db, (authErr, uid) => {
      if (authErr) return sendAuthError(res, authErr);
      // Check persistence
      isVulnCompletedByUser(uid, TYPE, db, (err, isCompleted) => {
        if (isCompleted) {
          console.log(`ðŸ” [${TYPE}] User ${uid} already exploited - skipping`);
          return res.status(403).json({ error: getVulnBlockMessage(err) });
        }
        if (!isDisabled(TYPE, req)) {
          generateFlag(db, uid, TYPE, "endpoint", () => {});
          console.log(`ðŸ”” [BROADCAST] ${TYPE} - Broadcasting to all SSE clients`);
          disable(TYPE, INFO, req);
          // Mark complete
          db.query(`SELECT MAX(id) as session_id FROM sessions WHERE user_id = ?`, [uid], (err, sessionResult) => {
            const sessionId = sessionResult && sessionResult[0] ? sessionResult[0].session_id : null;
            if (!sessionId) return;
            db.query(`UPDATE user_vulnerabilities SET is_completed = 1, completed_at = NOW() WHERE user_id = ? AND vuln_id = ? AND session_id = ?`, [uid, VULN_ID, sessionId], (err) => {
              if (err) console.error(`âŒ [${TYPE}] Failed to mark complete:`, err);
            });
          });
          sendVulnResponse(req, res, { env: process.env, status: "debug mode active" }, INFO);
        }
      });
    });
  });
};
