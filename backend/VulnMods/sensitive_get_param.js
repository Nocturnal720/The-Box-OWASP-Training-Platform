const { generateFlag }              = require("../ModHelper/generateFlag");
const { isDisabled, disable }       = require("../ModHelper/vulnState");
const { sendVulnResponse }          = require("../ModHelper/vulnResponse");
const { isVulnCompletedByUser, getVulnBlockMessage, VULN_TYPE_TO_ID } = require("../ModHelper/userVulnerabilityManager");
const { resolveUserIdFromToken, sendAuthError } = require("../ModHelper/authToken");
const TYPE = "SENSITIVE_GET_PARAM";
const VULN_ID = VULN_TYPE_TO_ID[TYPE];
const INFO = {
  name: "Sensitive GET Parameter",
  flag_type: TYPE,
  what: "User profile data is returned by passing a user_id in the URL query string with no authentication. The ID and full response appear in browser history, server logs, and any proxy in between.",
  why: "The endpoint was built for convenience without considering that URL parameters are logged everywhere, and no access control was added.",
  mitigation: "Never pass sensitive identifiers as GET parameters. Require authentication and derive the user's identity from their session token. Sensitive lookups should never accept a user ID from the client at all."
};
module.exports = (app, db) => {
  app.get("/user/details", (req, res) => {
    if (isDisabled(TYPE, req)) {
      return res.status(403).json({ error: "Already exploited" });
    }
    const userId = req.query.user_id;
    if (!userId) return res.status(400).json({ error: "user_id required", hint: "Try: /user/details?user_id=1" });

    resolveUserIdFromToken(req, db, (authErr, uid) => {
      if (authErr) return sendAuthError(res, authErr);
      // Check persistence
      isVulnCompletedByUser(uid, TYPE, db, (err, isCompleted) => {
        if (isCompleted) {
          console.log(`ðŸ” [${TYPE}] User ${uid} already exploited - skipping`);
          return res.status(403).json({ error: getVulnBlockMessage(err) });
        }
        if (!isDisabled(TYPE, req)) {
          generateFlag(db, uid, TYPE, "data_in_url", () => {});
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

          db.query("SELECT id AS user_id, username, password FROM users WHERE id = ?", [userId], (err, result) => {
            if (err) return res.status(500).json({ error: err.message });
            if (!result || result.length === 0) return res.status(404).json({ error: "User not found" });
            sendVulnResponse(req, res, { warning: "Sensitive data exposed via URL param!", user: result[0] }, INFO);
          });
          return;
        }

        return res.status(403).json({ error: "Forbidden" });
      });
    });
  });
};
