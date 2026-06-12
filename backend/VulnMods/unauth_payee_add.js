const { generateFlag }              = require("../ModHelper/generateFlag");
const { isDisabled, disable, disableImmediate }       = require("../ModHelper/vulnState");
const { sendVulnResponse }          = require("../ModHelper/vulnResponse");
const { isVulnCompletedByUser, getVulnBlockMessage, VULN_TYPE_TO_ID } = require("../ModHelper/userVulnerabilityManager");
const { resolveUserIdFromToken, sendAuthError } = require("../ModHelper/authToken");
const TYPE = "UNAUTH_PAYEE_ADD";
const VULN_ID = VULN_TYPE_TO_ID[TYPE];
const INFO = {
  name: "Unauthorized Payee Add",
  flag_type: TYPE,
  what: "The add-payee endpoint never verifies that the user_id in the request body belongs to the logged-in user. An attacker can add payees to any account by changing that field.",
  why: "The server trusted the user_id from the client request body instead of reading it from the authenticated session.",
  mitigation: "Ignore user_id from the request body entirely. Always derive the account owner from the server-side session token. The client should never specify which account they are acting on."
};
module.exports = (app, db) => {
  app.post("/payee-exploit", (req, res) => {
    if (isDisabled(TYPE, req)) {
      return res.status(403).json({ error: "Already exploited" });
    }
    const { user_id, payee_name, payee_account } = req.body || {};
    if (!user_id || !payee_name || !payee_account) return res.status(400).json({ error: "Missing fields" });
    resolveUserIdFromToken(req, db, (authErr, uid) => {
      if (authErr) return sendAuthError(res, authErr);
      // Check persistence
      isVulnCompletedByUser(uid, TYPE, db, (err, isCompleted) => {
        if (isCompleted) {
          console.log(`ðŸ” [${TYPE}] User ${uid} already exploited - skipping`);
          return res.status(403).json({ error: getVulnBlockMessage(err) });
        }
        if (!isDisabled(TYPE, req)) {
          generateFlag(db, uid, TYPE, "payee_added_to_other_account", () => {});
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
          db.query(`INSERT INTO payees (user_id, name, account_no, ifsc) VALUES (?, ?, ?, ?)`, [user_id, payee_name, payee_account, 'UNKNOWN'], (err) => {
            if (err) return res.status(500).json({ error: err.message });
            sendVulnResponse(req, res, { success: true, payee: { user: user_id, name: payee_name, account: payee_account }, warning: "Added to OTHER user account with NO auth!" }, INFO);
          });
        }
      });
    });
  });
};
