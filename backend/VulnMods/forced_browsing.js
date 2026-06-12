const { generateFlag }              = require("../ModHelper/generateFlag");
const { isDisabled, disable }       = require("../ModHelper/vulnState");
const { sendVulnResponse }          = require("../ModHelper/vulnResponse");
const { isVulnCompletedByUser, getVulnBlockMessage, VULN_TYPE_TO_ID } = require("../ModHelper/userVulnerabilityManager");
const { resolveUserIdFromToken, sendAuthError } = require("../ModHelper/authToken");
const TYPE = "FORCED_BROWSING";
const VULN_ID = VULN_TYPE_TO_ID[TYPE];
const INFO = {
  name: "Forced Browsing",
  flag_type: TYPE,
  what: "An admin-only endpoint is publicly accessible because the route has no authentication check. Anyone who knows or guesses the URL can access sensitive data without logging in.",
  why: "The developer relied on 'security through obscurity' â€” assuming users wouldn't find the URL â€” instead of enforcing access control on the server.",
  mitigation: "Add an authentication middleware to every sensitive route that verifies a valid session token. Admin routes must also verify the token belongs to a user with an admin role before returning any data."
};
module.exports = (app, db) => {
  app.get("/admin/export-users", (req, res) => {
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
          db.query("SELECT id AS user_id, username FROM users", (err, result) => {
            if (err) return res.status(500).json({ error: err.message });
            generateFlag(db, uid, TYPE, "export", () => {});
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
            sendVulnResponse(req, res, { warning: "Admin endpoint accessed with no auth!", users: result }, INFO);
          });
          return;
        }

        return res.status(403).json({ error: "Forbidden" });
      });
    });
  });
};
