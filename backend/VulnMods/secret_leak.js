const { generateFlag }              = require("../ModHelper/generateFlag");
const { isDisabled, disable, disableImmediate }       = require("../ModHelper/vulnState");
const { sendVulnResponse }          = require("../ModHelper/vulnResponse");
const { isVulnCompletedByUser, getVulnBlockMessage, VULN_TYPE_TO_ID } = require("../ModHelper/userVulnerabilityManager");
const { resolveUserIdFromToken, sendAuthError } = require("../ModHelper/authToken");
const TYPE = "SECRET_LEAK";
const VULN_ID = VULN_TYPE_TO_ID[TYPE];
const INFO = {
  name: "Config / Secret Leak",
  flag_type: TYPE,
  what: "A /config endpoint returns hardcoded API keys and database credentials as plain JSON, accessible to anyone with the URL.",
  why: "Secrets were hardcoded into the source code and exposed through a route that was never removed or protected.",
  mitigation: "Never hardcode secrets in source code. Store them in environment variables or a secrets manager. No route should ever return credentials or keys in a response, even internal tools."
};
module.exports = (app, db) => {
  app.get("/config", (req, res) => {
    if (isDisabled(TYPE, req)) {
      return res.status(403).json({ error: "Already exploited" });
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
          generateFlag(db, uid, TYPE, "config", () => {});
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
          sendVulnResponse(req, res, { api_key: "SECRET_KEY_123", db_password: "root123" }, INFO);
        }
      });
    });
  });
};
