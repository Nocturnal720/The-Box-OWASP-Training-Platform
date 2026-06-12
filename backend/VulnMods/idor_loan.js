const { generateFlag }              = require("../ModHelper/generateFlag");
const { isDisabled, disable }       = require("../ModHelper/vulnState");
const { sendVulnResponse }          = require("../ModHelper/vulnResponse");
const { isVulnCompletedByUser, getVulnBlockMessage, VULN_TYPE_TO_ID } = require("../ModHelper/userVulnerabilityManager");
const TYPE = "IDOR_LOAN";
const VULN_ID = VULN_TYPE_TO_ID[TYPE];
const INFO = {
  name: "IDOR â€” Loan Details",
  flag_type: TYPE,
  what: "Any loan record can be accessed by changing the loan ID in the URL. The server returns the full loan regardless of who owns it.",
  why: "The endpoint only looks up the loan by ID â€” it never checks whether the requesting user is the owner.",
  mitigation: "After fetching the loan, compare its user_id against the authenticated user's session ID. If they don't match, return 403 Forbidden."
};

module.exports = (app, db) => {
  app.get("/loan/:id", (req, res, next) => {
    console.log(`\nðŸ” /loan/:id called with ID=${req.params.id}, Disabled=${isDisabled(TYPE, req)}`);
    
    if (isDisabled(TYPE, req)) {
      console.log(`â­ï¸  Skipping - disabled or not vulnerable`);
      return res.status(403).json({ error: "Forbidden" });
    }
    
    const token = req.headers.authorization;
    if (!token) {
      console.log(`â­ï¸  No token`);
      return next();
    }
    
    db.query("SELECT * FROM loans WHERE id = ?", [req.params.id], (err, result) => {
      if (err) {
        console.log(`âŒ Loan query error: ${err.message}`);
        return next();
      }
      if (!result || !result.length) {
        console.log(`âŒ No loan found with ID ${req.params.id}`);
        return next();
      }
      
      db.query(`SELECT user_id FROM sessions WHERE token = ?`, [token], (err2, rows) => {
        if (err2 || !rows || !rows.length) {
          console.log(`âŒ Session error`);
          return next();
        }
        
        const loggedInId = rows[0].user_id;
        const ownerId = result[0].user_id;
        console.log(`ðŸ“Š loggedInId=${loggedInId}, ownerId=${ownerId}`);
        
        if (loggedInId !== ownerId) {
          // Check persistence
          isVulnCompletedByUser(loggedInId, TYPE, db, (err, isCompleted) => {
            if (isCompleted) {
              console.log(`ðŸ” [${TYPE}] User ${loggedInId} already exploited - skipping`);
              return res.status(403).json({ error: getVulnBlockMessage(err) });
            }
            console.log(`âœ… IDOR TRIGGERED!`);
            generateFlag(db, loggedInId, TYPE, "view_other_loan", () => {});
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
            sendVulnResponse(req, res, result[0], INFO);
          });
          return;
        }
        console.log(`â­ï¸  Same owner - skipping`);
        next();
      });
    });
  });
};
