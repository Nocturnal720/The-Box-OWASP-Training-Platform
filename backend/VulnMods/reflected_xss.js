const { generateFlag }              = require("../ModHelper/generateFlag");
const { isDisabled, disable }       = require("../ModHelper/vulnState");
const { broadcastSuccess }          = require("../ModHelper/successBroadcaster");
const { isVulnCompletedByUser, getVulnBlockMessage, VULN_TYPE_TO_ID } = require("../ModHelper/userVulnerabilityManager");
const { resolveUserIdFromToken } = require("../ModHelper/authToken");
const TYPE = "REFLECTED_XSS_1";
const VULN_ID = VULN_TYPE_TO_ID[TYPE];
const INFO = {
  name: "Reflected XSS â€” Search",
  flag_type: TYPE,
  what: "User input from the URL is written directly into the HTML response without encoding. A script tag in the query parameter executes in the victim's browser.",
  why: "The developer used string interpolation to build the HTML response, trusting that user input would always be plain text.",
  mitigation: "Never interpolate user input directly into HTML. Encode special characters before inserting into HTML output. Implement a Content-Security-Policy header to block inline script execution."
};
module.exports = (app, db) => {
  app.get("/search", (req, res) => {
    res.setHeader("Content-Type", "text/html");
    if (isDisabled(TYPE, req)) {
      return res.status(403).send("<p style='font-family:sans-serif;padding:20px'>Forbidden: this vulnerability has already been exploited in this session.</p>");
    }

    const q = req.query.q || "";
    const isXSS = q.includes("<script>") || q.includes("onerror") || q.includes("<img");
    if (isXSS) {
      const token = req.headers.authorization || req.query.token;
      const authReq = { headers: { ...req.headers, authorization: token } };

      resolveUserIdFromToken(authReq, db, (authErr, uid) => {
        if (authErr) {
          return res.status(authErr.status || 401).send("<p style='font-family:sans-serif;padding:20px'>Unauthorized.</p>");
        }
        // Check persistence
        isVulnCompletedByUser(uid, TYPE, db, (err, isCompleted) => {
          if (isCompleted) {
            console.log(`ðŸ” [${TYPE}] User ${uid} already exploited - skipping`);
            const blockReason = getVulnBlockMessage(err);
            const text = blockReason === "Forbidden"
              ? "Forbidden: this vulnerability is not assigned in your current session."
              : "Forbidden: already exploited.";
            return res.status(403).send(`<p style='font-family:sans-serif;padding:20px'>${text}</p>`);
          }

          if (!isDisabled(TYPE, req)) {
            generateFlag(db, uid, TYPE, "search", () => {});
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

            broadcastSuccess(INFO);
            const infoJson = JSON.stringify(INFO);
            res.send(`<h2>Search results for: ${q}</h2><p>No results found.</p>
<script>
try{localStorage.setItem('pendingVulnInfo',JSON.stringify(${infoJson}));}catch(e){}
if(window.opener){try{window.opener.postMessage({vuln_info:${infoJson}},'http://localhost:3000');}catch(e){}}
setTimeout(()=>{window.location.href='http://localhost:3000/fakebank';},1500);
</script>`);
            return;
          }

          return res.status(403).send("<p style='font-family:sans-serif;padding:20px'>Forbidden: this vulnerability has already been exploited in this session.</p>");
        });
      });
      return;
    }

    res.send(`<h2>Search results for: ${q}</h2><p>No results found.</p>`);
  });
};
