const { generateFlag }              = require("../ModHelper/generateFlag");
const { isDisabled, disable }       = require("../ModHelper/vulnState");
const { sendVulnResponse }          = require("../ModHelper/vulnResponse");
const { isVulnCompletedByUser, getVulnBlockMessage, VULN_TYPE_TO_ID } = require("../ModHelper/userVulnerabilityManager");
const TYPE = "IDOR_TRANSACTIONS";
const VULN_ID = VULN_TYPE_TO_ID[TYPE];
const INFO = {
  name: "IDOR â€” Transaction History",
  flag_type: TYPE,
  what: "The transaction history endpoint returns any user's full history when their ID is placed in the URL. No ownership check is performed.",
  why: "Access control was only enforced on the frontend. The backend route trusts whatever ID is passed in the URL without verifying it against the session.",
  mitigation: "Extract the user's identity from their authenticated session token on the server. Compare it against the requested ID and return 403 Forbidden if they do not match."
};
module.exports = (app, db) => {
  app.get("/transactions/:userId", (req, res, next) => {
    console.log(`[${TYPE}] Request received - isDisabled=${isDisabled(TYPE, req)}`);
    if (isDisabled(TYPE, req)) {
      console.log(`[${TYPE}] âœ‹ BLOCKED - Vulnerability already exploited`);
      return res.status(403).json({ error: "Forbidden" });
    }
    const requestedId = String(req.params.userId);
    const token = req.headers.authorization;
    if (!token) return next();
    db.query(`SELECT user_id FROM sessions WHERE token = ?`, [token], (err, rows) => {
      if (err || !rows || !rows.length) return next();
      const loggedInId = rows[0].user_id;
      if (loggedInId !== parseInt(requestedId)) {
        // Check persistence
        isVulnCompletedByUser(loggedInId, TYPE, db, (err, isCompleted) => {
          if (isCompleted) {
            console.log(`ðŸ” [${TYPE}] User ${loggedInId} already exploited - skipping`);
            return res.status(403).json({ error: getVulnBlockMessage(err) });
          }
          if (!isDisabled(TYPE, req)) {
            generateFlag(db, loggedInId, TYPE, "view_other_txn", () => {});
            console.log(`ðŸ”” [BROADCAST] ${TYPE}`);
            disable(TYPE, INFO, req);
            // Mark complete
            db.query(`SELECT MAX(id) as session_id FROM sessions WHERE user_id = ?`, [loggedInId], (err, sessionResult) => {
              const sessionId = sessionResult && sessionResult[0] ? sessionResult[0].session_id : null;
              if (!sessionId) return;
              db.query(`UPDATE user_vulnerabilities SET is_completed = 1, completed_at = NOW() WHERE user_id = ? AND vuln_id = ? AND session_id = ?`, [loggedInId, VULN_ID, sessionId], (err) => {
                if (err) console.error(`âŒ [${TYPE}] Failed to mark complete:`, err);
              });
            });
            db.query(`SELECT * FROM transactions WHERE user_id = ? ORDER BY created_at DESC`, [requestedId], (err, result) => {
              if (err) return res.status(500).json({ error: err.message });
              sendVulnResponse(req, res, result || [], INFO);
            });
            return;
          }

          return next();
        });
        return;
      }
      next();
    });
  });
};
