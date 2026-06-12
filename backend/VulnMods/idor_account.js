const { generateFlag }              = require("../ModHelper/generateFlag");
const { isDisabled, disable }       = require("../ModHelper/vulnState");
const { sendVulnResponse }          = require("../ModHelper/vulnResponse");
const { isVulnCompletedByUser, getVulnBlockMessage, VULN_TYPE_TO_ID } = require("../ModHelper/userVulnerabilityManager");

const TYPE = "IDOR_ACCOUNT";
const VULN_ID = VULN_TYPE_TO_ID[TYPE];
const INFO = {
  name: "IDOR â€” Account Details",
  flag_type: TYPE,
  what: "Full account details (account number, IFSC, balance) for any user are returned by changing the ID in the URL. No ownership verification is done.",
  why: "The route assumed only the correct user would ever request their own account, without enforcing that assumption server-side.",
  mitigation: "Validate that the user ID in the URL matches the authenticated user's session. Return 403 Forbidden for any mismatch."
};

module.exports = (app, db) => {
  app.get("/account/:userId", (req, res, next) => {
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
        // Check if this user already completed this vulnerability in their current session (persistent)
        isVulnCompletedByUser(loggedInId, TYPE, db, (err, isCompleted) => {
          if (isCompleted) {
            // Already exploited - return safe response (no flag, no popup)
            console.log(`ðŸ” [${TYPE}] User ${loggedInId} already exploited this - skipping`);
            return res.status(403).json({ error: getVulnBlockMessage(err) });
          }

          // First time exploitation - generate flag and mark complete
          if (!isDisabled(TYPE, req)) {
            generateFlag(db, loggedInId, TYPE, "view_other_account", () => {});
            console.log(`ðŸ”” [BROADCAST] ${TYPE}`);

            disable(TYPE, INFO, req);

            // Mark as completed in database for persistence
            db.query(
              `SELECT MAX(id) as session_id FROM sessions WHERE user_id = ?`,
              [loggedInId],
              (err, sessionResult) => {
                const sessionId = sessionResult && sessionResult[0] ? sessionResult[0].session_id : null;
                if (!sessionId) return;
                db.query(
                  `UPDATE user_vulnerabilities SET is_completed = 1, completed_at = NOW() 
                   WHERE user_id = ? AND vuln_id = ? AND session_id = ?`,
                  [loggedInId, VULN_ID, sessionId],
                  (err) => {
                    if (err) console.error(`âŒ [${TYPE}] Failed to mark complete:`, err);
                  }
                );
              }
            );

            db.query(`SELECT * FROM accounts WHERE user_id = ?`, [requestedId], (err, result) => {
              if (err) return res.status(500).json({ error: err.message });
              if (!result || !result.length) return res.status(404).json({ error: "Account not found" });
              sendVulnResponse(req, res, result[0], INFO);
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
