const { generateFlag }              = require("../ModHelper/generateFlag");
const { isDisabled, disable, disableImmediate }       = require("../ModHelper/vulnState");
const { sendVulnResponse }          = require("../ModHelper/vulnResponse");
const { isVulnCompletedByUser, getVulnBlockMessage, VULN_TYPE_TO_ID } = require("../ModHelper/userVulnerabilityManager");
const { resolveUserIdFromToken, sendAuthError } = require("../ModHelper/authToken");
const TYPE = "MASS_ASSIGNMENT";
const VULN_ID = VULN_TYPE_TO_ID[TYPE];
const INFO = {
  name: "Mass Assignment",
  flag_type: TYPE,
  what: "The user profile endpoint accepts any field in the request body without filtering. An attacker can set admin=true or other sensitive fields.",
  why: "The developer used direct object assignment without validating which fields are allowed to be updated.",
  mitigation: "Maintain a whitelist of updatable fields. Filter the request to only those fields before persisting. Use an ORM that supports field-level access control."
};

module.exports = (app, db) => {
  app.post("/profile/update", (req, res) => {
    if (isDisabled(TYPE, req)) {
      return res.status(403).json({ error: "Already exploited" });
    }

    resolveUserIdFromToken(req, db, (authErr, uid) => {
      if (authErr) return sendAuthError(res, authErr);
      // Check if attacker tried to set admin=true or role field
      if (req.body.admin === true || req.body.role === 'admin' || req.body.is_admin) {
        // Check persistence
        isVulnCompletedByUser(uid, TYPE, db, (err, isCompleted) => {
          if (isCompleted) {
            console.log(`ðŸ” [${TYPE}] User ${uid} already exploited - skipping`);
            return res.status(403).json({ error: getVulnBlockMessage(err) });
          }
          if (!isDisabled(TYPE, req)) {
            generateFlag(db, uid, TYPE, "set_admin_field", () => {});
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
            sendVulnResponse(req, res, { success: true, message: "Profile fields accepted", user: req.body }, INFO);
          }
        });
      } else {
        res.json({ success: false, error: "To exploit, try: {\"admin\": true}" });
      }
    });
  });
};