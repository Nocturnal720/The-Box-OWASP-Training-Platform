const fs   = require("fs");
const path = require("path");
const { generateFlag }              = require("../ModHelper/generateFlag");
const { isDisabled, disable, disableImmediate }       = require("../ModHelper/vulnState");
const { sendVulnResponse }          = require("../ModHelper/vulnResponse");
const { isVulnCompletedByUser, getVulnBlockMessage, VULN_TYPE_TO_ID } = require("../ModHelper/userVulnerabilityManager");
const { resolveUserIdFromToken, sendAuthError } = require("../ModHelper/authToken");
const TYPE = "PATH_TRAVERSAL";
const VULN_ID = VULN_TYPE_TO_ID[TYPE];
const INFO = {
  name: "Path Traversal",
  flag_type: TYPE,
  what: "The file download endpoint joins a user-supplied filename to a base directory without sanitizing ../ sequences, allowing an attacker to escape the intended folder and read any file on the server.",
  why: "path.join() was used assuming it would restrict paths, but it resolves ../ literally without enforcing boundaries.",
  mitigation: "After joining the path, use path.resolve() and verify the result starts with the intended base directory. Whitelist allowed filenames. Never pass raw user input to any filesystem function."
};
const BASE_DIR = path.join(__dirname, "..");
module.exports = (app, db) => {
  app.get("/download", (req, res) => {
    if (isDisabled(TYPE, req)) {
      return res.status(403).json({ error: "Already exploited" });
    }
    const file = req.query.file;
    if (!file) return res.status(400).json({ error: "file param required. Try: /download?file=../../backend/server.js" });
    const hasTraversal = file.includes("../") || file.includes("..\\");
    const target = path.join(BASE_DIR, file);
    fs.readFile(target, "utf8", (err, data) => {
      const payload = err
        ? { error: "File not found", attempted_path: target, flag_earned: hasTraversal }
        : { file: target, content: data.substring(0, 2000), truncated: data.length > 2000, flag_earned: hasTraversal };
      if (hasTraversal) {
        resolveUserIdFromToken(req, db, (authErr, uid) => {
          if (authErr) return sendAuthError(res, authErr);
          // Check persistence
          isVulnCompletedByUser(uid, TYPE, db, (err, isCompleted) => {
            if (isCompleted) {
              console.log(`ðŸ” [${TYPE}] User ${uid} already exploited - skipping`);
              return res.status(403).json({ error: getVulnBlockMessage(err) });
            }
            if (!isDisabled(TYPE, req)) {
              generateFlag(db, uid, TYPE, "directory_escape", () => {});
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
              sendVulnResponse(req, res, payload, INFO);
            }
          });
        });
        return;
      }
      res.json(payload);
    });
  });
};
