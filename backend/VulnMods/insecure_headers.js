const { generateFlag }              = require("../ModHelper/generateFlag");
const { isDisabled, disable, disableImmediate }       = require("../ModHelper/vulnState");
const { sendVulnResponse }          = require("../ModHelper/vulnResponse");
const { isVulnCompletedByUser, getVulnBlockMessage, VULN_TYPE_TO_ID } = require("../ModHelper/userVulnerabilityManager");
const { resolveUserIdFromToken, sendAuthError } = require("../ModHelper/authToken");
const TYPE = "INSECURE_HEADERS";
const VULN_ID = VULN_TYPE_TO_ID[TYPE];
const INFO = {
  name: "Insecure Headers",
  flag_type: TYPE,
  what: "The server response is missing all browser security headers, leaving the page vulnerable to clickjacking, MIME-type sniffing, and cross-site scripting attacks.",
  why: "Express does not set security headers by default. Developers must configure them explicitly â€” this step was skipped.",
  mitigation: "Use the 'helmet' npm package, which sets all critical security headers in one line. At minimum set: Content-Security-Policy, X-Frame-Options: DENY, X-Content-Type-Options: nosniff, Strict-Transport-Security, and Referrer-Policy."
};
module.exports = (app, db) => {
  app.get("/headers-test", (req, res) => {
    if (isDisabled(TYPE, req)) {
      return res.status(403).json({ error: "Already exploited" });
    }
    resolveUserIdFromToken(req, db, (authErr, uid) => {
      if (authErr) return sendAuthError(res, authErr);
      // Check persistence
      isVulnCompletedByUser(uid, TYPE, db, (err, isCompleted) => {
        if (isCompleted) {
          console.log(`ðŸ” [${TYPE}] User ${uid} already exploited - skipping`);
          return res.status(403).json({ error: getVulnBlockMessage(err) });
        }
        if (!isDisabled(TYPE, req)) {
          generateFlag(db, uid, TYPE, "missing_security", () => {});
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
            message: "Check the Response Headers tab in DevTools",
            missing_headers: ["Content-Security-Policy","X-Frame-Options","X-Content-Type-Options","Strict-Transport-Security","Referrer-Policy"]
          }, INFO);
        }
      });
    });
  });
};
