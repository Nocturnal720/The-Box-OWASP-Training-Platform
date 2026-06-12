const { generateFlag }              = require("../ModHelper/generateFlag");
const { isDisabled, disable, disableImmediate }       = require("../ModHelper/vulnState");
const { sendVulnResponse }          = require("../ModHelper/vulnResponse");
const { isVulnCompletedByUser, getVulnBlockMessage, VULN_TYPE_TO_ID } = require("../ModHelper/userVulnerabilityManager");
const { resolveUserIdFromToken, sendAuthError } = require("../ModHelper/authToken");
const TYPE = "PROFILE_DATA_LEAK";
const VULN_ID = VULN_TYPE_TO_ID[TYPE];
const INFO = {
  name: "Profile Data Leak",
  flag_type: TYPE,
  what: "An unprotected endpoint dumps every column of any user's database row â€” including their password â€” by simply changing the ID in the URL.",
  why: "The endpoint was built for internal debugging using SELECT * with no field filtering or authentication check.",
  mitigation: "Never use SELECT * in API responses. Explicitly select only the fields the client needs. Require authentication and verify the requester owns the profile before returning any data."
};
module.exports = (app, db) => {
  app.get("/profile/leak/:id", (req, res) => {
    if (isDisabled(TYPE, req)) {
      return res.status(403).json({ error: "Already exploited" });
    }

    const id = req.params.id;
    resolveUserIdFromToken(req, db, (authErr, uid) => {
      if (authErr) return sendAuthError(res, authErr);
      // Check persistence
      isVulnCompletedByUser(uid, TYPE, db, (err, isCompleted) => {
        if (isCompleted) {
          console.log(`ðŸ” [${TYPE}] User ${uid} already exploited - skipping`);
          return res.status(403).json({ error: getVulnBlockMessage(err) });
        }

        if (!isDisabled(TYPE, req)) {
          console.log(`ðŸ”” [BROADCAST] ${TYPE}`);
          disable(TYPE, INFO, req);
          generateFlag(db, uid, TYPE, "full_profile", () => {});

          // Mark complete
          db.query(`SELECT MAX(id) as session_id FROM sessions WHERE user_id = ?`, [uid], (err, sessionResult) => {
            const sessionId = sessionResult && sessionResult[0] ? sessionResult[0].session_id : null;
            if (!sessionId) return;
            db.query(`UPDATE user_vulnerabilities SET is_completed = 1, completed_at = NOW() WHERE user_id = ? AND vuln_id = ? AND session_id = ?`, [uid, VULN_ID, sessionId], (err) => {
              if (err) console.error(`âŒ [${TYPE}] Failed to mark complete:`, err);
            });
          });

          db.query(`SELECT * FROM users WHERE id = ${id}`, (err, result) => {
            if (err) return res.status(500).json({ error: err.message });
            if (!result || result.length === 0) return res.status(404).json({ error: "User not found" });
            sendVulnResponse(req, res, result[0], INFO);
          });
          return;
        }

        return res.status(403).json({ error: "Forbidden" });
      });
    });
  });
};
