const { generateFlag }              = require("../ModHelper/generateFlag");
const { isDisabled, disable }       = require("../ModHelper/vulnState");
const { sendVulnResponse }          = require("../ModHelper/vulnResponse");
const { isVulnCompletedByUser, getVulnBlockMessage, VULN_TYPE_TO_ID } = require("../ModHelper/userVulnerabilityManager");
const TYPE = "IDOR_SUPPORT";
const VULN_ID = VULN_TYPE_TO_ID[TYPE];
const INFO = {
  name: "IDOR â€” Support Tickets",
  flag_type: TYPE,
  what: "Support tickets are private messages between a user and the bank. By changing the user ID in the URL, anyone can read another user's private support history.",
  why: "The endpoint accepts a user ID as a URL parameter and returns that user's tickets with no check that the caller is actually that user.",
  mitigation: "Never accept a user ID as a URL parameter for private data. Derive the user's identity from their authenticated session token and use that to scope all queries."
};

module.exports = (app, db) => {
  app.get("/support/:userId", (req, res, next) => {
    console.log(`ðŸ” /support/:userId called - Disabled=${isDisabled(TYPE, req)}, AsignedVulns=${req.assignedVulns}`);
    
    if (isDisabled(TYPE, req)) {
      console.log(`â­ï¸  Skipping - TYPE already disabled`);
      return res.status(403).json({ error: "Forbidden" });
    }

    const requestedId = String(req.params.userId);
    const token = req.headers.authorization;
    
    if (!token) {
      console.log(`â­ï¸  Skipping - No token`);
      return next();
    }

    db.query(`SELECT user_id FROM sessions WHERE token = ?`, [token], (err, rows) => {
      if (err || !rows || !rows.length) {
        console.log(`âš ï¸  No session found for IDOR_SUPPORT, error=${err ? err.message : 'none'}`);
        return next();
      }

      const loggedInId = rows[0].user_id;
      console.log(`ðŸ“Š loggedInId=${loggedInId}, requestedId=${requestedId}`);

      if (loggedInId !== parseInt(requestedId)) {
        // Check persistence
        isVulnCompletedByUser(loggedInId, TYPE, db, (err, isCompleted) => {
          if (isCompleted) {
            console.log(`ðŸ” [${TYPE}] User ${loggedInId} already exploited - skipping`);
            return res.status(403).json({ error: getVulnBlockMessage(err) });
          }
          if (!isDisabled(TYPE, req)) {
            console.log(`âœ… IDOR TRIGGERED - Different users!`);
            generateFlag(db, loggedInId, TYPE, "read_other_tickets", () => {});
            console.log(`ðŸ”” [BROADCAST] ${TYPE} - User: ${loggedInId}, Requested: ${requestedId}`);
            disable(TYPE, INFO, req);
            // Mark complete
            db.query(`SELECT MAX(id) as session_id FROM sessions WHERE user_id = ?`, [loggedInId], (err, sessionResult) => {
              const sessionId = sessionResult && sessionResult[0] ? sessionResult[0].session_id : null;
              if (!sessionId) return;
              db.query(`UPDATE user_vulnerabilities SET is_completed = 1, completed_at = NOW() WHERE user_id = ? AND vuln_id = ? AND session_id = ?`, [loggedInId, VULN_ID, sessionId], (err) => {
                if (err) console.error(`âŒ [${TYPE}] Failed to mark complete:`, err);
              });
            });
            db.query(`SELECT * FROM support_tickets WHERE user_id = ? ORDER BY id DESC`, [requestedId], (err, result) => {
              if (err) return res.status(500).json({ error: err.message });
              sendVulnResponse(req, res, result || [], INFO);
            });
            return;
          }

          return next();
        });
        return;
      }

      console.log(`â­ï¸  Same user - skipping`);
      next();
    });
  });
};
