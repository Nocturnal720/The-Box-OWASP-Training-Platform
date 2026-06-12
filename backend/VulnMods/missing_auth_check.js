const { generateFlag }              = require("../ModHelper/generateFlag");
const { isDisabled, disable }       = require("../ModHelper/vulnState");
const { sendVulnResponse }          = require("../ModHelper/vulnResponse");
const { isVulnCompletedByUser, getVulnBlockMessage, VULN_TYPE_TO_ID } = require("../ModHelper/userVulnerabilityManager");
const { resolveUserIdFromToken, sendAuthError } = require("../ModHelper/authToken");
const TYPE = "MISSING_AUTH";
const VULN_ID = VULN_TYPE_TO_ID[TYPE];
const INFO = {
  name: "Missing Authentication Check",
  flag_type: TYPE,
  what: "The admin delete-user endpoint has no authentication or role check. Any anonymous request can delete any user account.",
  why: "The route was built quickly without wiring up the authentication middleware that protects other admin routes.",
  mitigation: "Every admin endpoint must verify: (1) the request carries a valid session token, and (2) that token belongs to an admin-role user. Reject anything that fails either check with 401 or 403."
};
module.exports = (app, db) => {
  app.post("/user/delete/:userId", (req, res) => {
    if (isDisabled(TYPE, req)) {
      return res.status(403).json({ error: "Already exploited" });
    }
    const userId = req.params.userId;
    if (String(userId) === "1") return res.status(403).json({ error: "Cannot delete user 1 in demo mode â€” try user_id: 2" });
    // Derive actual caller from session for flag attribution
    resolveUserIdFromToken(req, db, (authErr, uid) => {
      if (authErr) return sendAuthError(res, authErr);
      // Check persistence
      isVulnCompletedByUser(uid, TYPE, db, (err, isCompleted) => {
        if (isCompleted) {
          console.log(`ðŸ” [${TYPE}] User ${uid} already exploited - skipping`);
          return res.status(403).json({ error: getVulnBlockMessage(err) });
        }

        if (!isDisabled(TYPE, req)) {
          const targetUserId = parseInt(userId, 10);

          // Remove dependent rows first, then delete the user record itself.
          db.query(`DELETE FROM user_vulnerabilities WHERE user_id = ?`, [targetUserId], (err) => {
            if (err) return res.status(500).json({ error: err.message });

            db.query(`DELETE FROM user_sessions WHERE user_id = ?`, [targetUserId], (err) => {
              if (err) return res.status(500).json({ error: err.message });

              db.query(`DELETE FROM sessions WHERE user_id = ?`, [targetUserId], (err) => {
                if (err) return res.status(500).json({ error: err.message });

                db.query(`DELETE FROM users WHERE id = ?`, [targetUserId], (err, deleteResult) => {
                  if (err) return res.status(500).json({ error: err.message });
                  if (!deleteResult || deleteResult.affectedRows === 0) {
                    return res.status(404).json({ error: "User not found" });
                  }

                  generateFlag(db, uid, TYPE, "delete_user", () => {});
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

                  sendVulnResponse(req, res, {
                    success: true,
                    deleted_user_id: targetUserId,
                    warning: "Deleted user with NO auth check!"
                  }, INFO);
                });
              });
            });
          });
          return;
        }

        return res.status(403).json({ error: "Forbidden" });
      });
    });
  });
};
