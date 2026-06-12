const { generateFlag }              = require("../ModHelper/generateFlag");
const { isDisabled, disable, disableImmediate }       = require("../ModHelper/vulnState");
const { sendVulnResponse }          = require("../ModHelper/vulnResponse");
const { isVulnCompletedByUser, getVulnBlockMessage, VULN_TYPE_TO_ID } = require("../ModHelper/userVulnerabilityManager");
const { resolveUserIdFromToken, sendAuthError } = require("../ModHelper/authToken");
const TYPE = "UNAUTH_TRANSFER";
const VULN_ID = VULN_TYPE_TO_ID[TYPE];
const INFO = {
  name: "Unauthorized Transfer",
  flag_type: TYPE,
  what: "The transfer endpoint moves money between accounts with no authentication. By changing the from_user field, anyone can drain any account.",
  why: "The endpoint trusts the from_user value supplied by the client rather than deriving it from the server-side session.",
  mitigation: "Never accept the source account as a client-supplied value. Read the user's identity exclusively from their authenticated session token and use that as from_user. Reject any request where the session user differs from the intended sender."
};
module.exports = (app, db) => {
  app.post("/transfer-exploit", (req, res) => {
    if (isDisabled(TYPE, req)) {
      return res.status(403).json({ error: "Already exploited" });
    }
    const { from_user, to_user, amount } = req.body || {};
    if (!from_user || !to_user || !amount) return res.status(400).json({ error: "Missing fields" });
    resolveUserIdFromToken(req, db, (authErr, uid) => {
      if (authErr) return sendAuthError(res, authErr);
      // Check persistence
      isVulnCompletedByUser(uid, TYPE, db, (err, isCompleted) => {
        if (isCompleted) {
          console.log(`ðŸ” [${TYPE}] User ${uid} already exploited - skipping`);
          return res.status(403).json({ error: getVulnBlockMessage(err) });
        }
        if (!isDisabled(TYPE, req)) {
          generateFlag(db, uid, TYPE, "transfer_without_auth", () => {});
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
          sendVulnResponse(req, res, { success: true, message: "Transfer executed with NO auth check!", from: from_user, to: to_user, amount }, INFO);
        }
      });
    });
  });
};
