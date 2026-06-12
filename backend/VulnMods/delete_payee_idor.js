const { generateFlag }              = require("../ModHelper/generateFlag");
const { isDisabled, disable, disableImmediate }       = require("../ModHelper/vulnState");
const { sendVulnResponse }          = require("../ModHelper/vulnResponse");
const { isVulnCompletedByUser, getVulnBlockMessage, VULN_TYPE_TO_ID } = require("../ModHelper/userVulnerabilityManager");
const TYPE = "DELETE_PAYEE_IDOR";
const VULN_ID = VULN_TYPE_TO_ID[TYPE];
const INFO = {
  name: "IDOR â€” Delete Anyone's Payee",
  flag_type: TYPE,
  what: "The delete payee endpoint accepts any payee ID and deletes it without checking whether the requesting user owns that payee.",
  why: "The developer checked that the payee exists, but not that it belongs to the user making the request. Ownership was assumed, not enforced.",
  mitigation: "Before deleting, fetch the payee and compare its user_id to the authenticated user's session ID. Reject with 403 Forbidden if they do not match."
};
module.exports = (app, db) => {
  app.post("/payee-delete/:id", (req, res) => {
    if (isDisabled(TYPE, req)) {
      return res.status(403).json({ error: "Already exploited" });
    }
    const payeeId = req.params.id;
    const token   = req.headers.authorization;
    if (!token) return res.status(401).json({ error: "Unauthorized" });
    db.query("SELECT id, user_id FROM payees WHERE id = ?", [payeeId], (err, result) => {
      if (err || !result || !result.length) return res.status(404).json({ error: "Payee not found" });
      db.query(`SELECT user_id FROM sessions WHERE token = ?`, [token], (err2, rows) => {
        if (err2 || !rows || !rows.length) return res.status(401).json({ error: "Unauthorized" });
        const loggedInId = rows[0].user_id;
        const ownerId    = result[0].user_id;
        if (loggedInId !== ownerId) {
          // Check persistence
          isVulnCompletedByUser(loggedInId, TYPE, db, (err, isCompleted) => {
            if (isCompleted) {
              console.log(`ðŸ” [${TYPE}] User ${loggedInId} already exploited - skipping`);
              return res.status(403).json({ error: getVulnBlockMessage(err) });
            }
            if (!isDisabled(TYPE, req)) {
              generateFlag(db, loggedInId, TYPE, "payee_delete", () => {});
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
              db.query("DELETE FROM payees WHERE id = ?", [payeeId], (err) => {
                if (err) return res.status(500).json({ error: err.message });
                sendVulnResponse(req, res, { success: true, deleted_payee: payeeId, warning: "Deleted ANOTHER user's payee with NO ownership check!" }, INFO);
              });
            }
          });
          return;
        }
        res.status(403).json({ error: "Forbidden" });
      });
    });
  });
};
