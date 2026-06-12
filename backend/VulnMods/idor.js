const { isDisabled, disable, disableImmediate } = require("../ModHelper/vulnState");
const { sendVulnResponse }    = require("../ModHelper/vulnResponse");
const { isVulnCompletedByUser, getVulnBlockMessage, VULN_TYPE_TO_ID } = require("../ModHelper/userVulnerabilityManager");
const TYPE = "IDOR_BALANCE";
const VULN_ID = VULN_TYPE_TO_ID[TYPE];
const INFO = {
  name: "IDOR â€” Access Another User's Balance",
  flag_type: TYPE,
  what: "The balance endpoint returns any user's balance when their ID is placed in the URL. There is no check that the requester owns the account they are querying.",
  why: "The developer secured the frontend navigation only, assuming users would always request their own ID. The backend performs no ownership verification.",
  mitigation: "Compare the ID in the URL against the authenticated user's ID from their session token on every request. Reject with 403 Forbidden if they do not match."
};

module.exports.handleIDORBalance = (req, res, db, generateFlag, callback) => {

  const requestedId    = parseInt(req.params.userId);
  const token          = req.headers.authorization;
  let   loggedInUserId = null;

  // Try to get user ID from request (middleware might set it)
  if (req.userId) {
    loggedInUserId = req.userId;
  }

  const processRequest = () => {
    if (Number.isNaN(requestedId)) {
      return callback(null, { error: "Invalid user or account id" });
    }

    const handleResolvedAccount = (accountRow) => {
      if (!accountRow) {
        return callback(null, { error: "User not found" });
      }

      const balance = accountRow.balance;
      const targetUserId = Number(accountRow.user_id);
      
      // Fire IDOR only when a valid authenticated user accesses another user's balance.
      if (loggedInUserId !== null && loggedInUserId !== targetUserId) {
        // Check persistence first
        isVulnCompletedByUser(loggedInUserId, TYPE, db, (err, isCompleted) => {
          if (isCompleted) {
            // Already exploited - deny access completely
            console.log(`ðŸ” [${TYPE}] User ${loggedInUserId} already exploited - denying access`);
            return callback(null, { error: getVulnBlockMessage(err) });
          }
          if (!isDisabled(TYPE, req)) {
            const uid = loggedInUserId;
            generateFlag(db, uid, TYPE, "", (err, flag) => {
              if (err) return callback(err);
              console.log(`ðŸ”” [BROADCAST] ${TYPE} - User: ${uid}, Requested: ${requestedId}, TargetOwner: ${targetUserId}`);
              disable(TYPE, INFO, req);
              // Mark complete
              db.query(`SELECT MAX(id) as session_id FROM sessions WHERE user_id = ?`, [uid], (err, sessionResult) => {
                const sessionId = sessionResult && sessionResult[0] ? sessionResult[0].session_id : null;
                if (!sessionId) return;
                db.query(`UPDATE user_vulnerabilities SET is_completed = 1, completed_at = NOW() WHERE user_id = ? AND vuln_id = ? AND session_id = ?`, [uid, VULN_ID, sessionId], (err) => {
                  if (err) console.error(`âŒ [${TYPE}] Failed to mark complete:`, err);
                });
              });
              sendVulnResponse(req, res, { balance, target_user_id: targetUserId, message: "IDOR Exploited", flag }, INFO);
            });
          } else {
            callback(null, { error: "Access denied" });
          }
        });
      } else {
        callback(null, { balance, target_user_id: targetUserId });
      }
    };

    // Primary path: treat path segment as user_id.
    db.query(
      `SELECT id, user_id, balance FROM accounts WHERE user_id = ? ORDER BY id DESC LIMIT 1`,
      [requestedId],
      (userErr, userRows) => {
        if (userErr) return callback(userErr);
        if (userRows && userRows.length > 0) {
          return handleResolvedAccount(userRows[0]);
        }

        // Fallback path: many seeds use account ids that do not match user_id values.
        db.query(
          `SELECT id, user_id, balance FROM accounts WHERE id = ? LIMIT 1`,
          [requestedId],
          (accountErr, accountRows) => {
            if (accountErr) return callback(accountErr);
            return handleResolvedAccount(accountRows && accountRows.length > 0 ? accountRows[0] : null);
          }
        );
      }
    );
  };

  if (token) {
    db.query(`SELECT user_id FROM sessions WHERE token = ? ORDER BY id DESC LIMIT 1`, [token], (err, rows) => {
      if (!err && rows && rows.length) {
        loggedInUserId = rows[0].user_id;
        console.log(`âœ… Session found for token: user_id=${loggedInUserId}`);
      } else {
        console.log(`âš ï¸  No session found for token, error=${err ? err.message : 'none'}`);
      }
      processRequest();
    });
  } else {
    processRequest();
  }
};
