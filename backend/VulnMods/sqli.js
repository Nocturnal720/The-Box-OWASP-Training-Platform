const { disable } = require("../ModHelper/vulnState");
const { isUserVulnerableTo, VULN_TYPE_TO_ID } = require("../ModHelper/userVulnerabilityManager");
const TYPE = "SQLI";
const VULN_ID = VULN_TYPE_TO_ID[TYPE];
const INFO = {
  name: "SQL Injection — Login Bypass",
  flag_type: TYPE,
  what: "The login query is built by concatenating raw user input into a SQL string. Injecting admin' OR '1'='1 manipulates the query logic and bypasses the password check entirely.",
  why: "String interpolation was used to build SQL queries instead of parameterised queries. The database receives executable SQL crafted by the attacker.",
  mitigation: "Always use parameterised queries: db.query('SELECT * FROM users WHERE username = ? AND password = ?', [username, password]). An ORM like Sequelize or Prisma also prevents this by default."
};

const getRowUserId = (row) => {
  if (!row || typeof row !== "object") return null;
  return row.user_id || row.id || null;
};

const resolveSqliUser = (db, rawUsername, callback) => {
  const candidate = String(rawUsername || "").split(/[\'\"#\s]/)[0].trim();

  if (!candidate) {
    return callback(null, null, null);
  }

  db.query(
    "SELECT * FROM users WHERE username = ? LIMIT 1",
    [candidate],
    (err, rows) => {
      if (err) {
        return callback(err, null, null);
      }

      if (rows && rows.length > 0) {
        const resolvedId = getRowUserId(rows[0]);
        const resolvedName = rows[0].username || null;
        return callback(null, resolvedId, resolvedName);
      }

      return callback(null, null, null);
    }
  );
};

const markSqliCompletedInLatestAssignment = (assignmentDb, userId, callback) => {
  if (!assignmentDb) return callback(null);

  assignmentDb.query(
    `SELECT MAX(session_id) AS latest_assignment_session_id
     FROM user_vulnerabilities
     WHERE user_id = ? AND vuln_id = ?`,
    [userId, VULN_ID],
    (err, rows) => {
      if (err) return callback(err);

      const sessionId = rows && rows.length > 0 ? rows[0].latest_assignment_session_id : null;
      if (!sessionId) {
        return callback(new Error(`No assignment session found for SQLI user ${userId}`));
      }

      assignmentDb.query(
        `UPDATE user_vulnerabilities
         SET is_completed = 1, completed_at = NOW()
         WHERE user_id = ? AND vuln_id = ? AND session_id = ?`,
        [userId, VULN_ID, sessionId],
        (updateErr) => {
          if (updateErr) return callback(updateErr);
          return callback(null);
        }
      );
    }
  );
};

const canExploitSqliForUser = (assignmentDb, userId, callback) => {
  if (!assignmentDb) {
    return callback(null, true);
  }

  return isUserVulnerableTo(userId, VULN_ID, assignmentDb, (err, isVulnerable) => {
    if (err) return callback(err, false);
    return callback(null, Boolean(isVulnerable));
  });
};

const getSqliAssignmentState = (assignmentDb, userId, callback) => {
  if (!assignmentDb) return callback(null, null);

  assignmentDb.query(
    `SELECT MAX(id) AS current_session_id FROM sessions WHERE user_id = ?`,
    [userId],
    (sessionErr, sessionRows) => {
      if (sessionErr) return callback(sessionErr, null);

      const currentSessionId = sessionRows && sessionRows.length > 0
        ? sessionRows[0].current_session_id
        : null;

      if (!currentSessionId) return callback(null, null);

      assignmentDb.query(
        `SELECT is_completed
         FROM user_vulnerabilities
         WHERE user_id = ? AND vuln_id = ? AND session_id = ?
         LIMIT 1`,
        [userId, VULN_ID, currentSessionId],
        (err, rows) => {
          if (err) return callback(err, null);
          if (!rows || !rows.length) return callback(null, null);
          return callback(null, rows[0]);
        }
      );
    }
  );
};

const normalizeOptions = (value) => {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  return value;
};

const handleSQLiLogin = (
  username,
  password,
  db,
  assignmentDbOrGenerateFlag,
  generateFlagOrCallback,
  maybeOptionsOrCallback,
  maybeCallback
) => {
  const hasAssignmentDb =
    assignmentDbOrGenerateFlag &&
    typeof assignmentDbOrGenerateFlag.query === "function" &&
    typeof generateFlagOrCallback === "function";

  const assignmentDb = hasAssignmentDb ? assignmentDbOrGenerateFlag : null;
  const generateFlag = hasAssignmentDb ? generateFlagOrCallback : assignmentDbOrGenerateFlag;
  const options = hasAssignmentDb
    ? (typeof maybeCallback === "function" ? normalizeOptions(maybeOptionsOrCallback) : {})
    : (typeof maybeCallback === "function" ? normalizeOptions(generateFlagOrCallback) : {});
  const callback = hasAssignmentDb
    ? (typeof maybeCallback === "function" ? maybeCallback : maybeOptionsOrCallback)
    : (typeof maybeCallback === "function" ? maybeCallback : generateFlagOrCallback);
  const persistenceDb = assignmentDb || db;
  const actorUserId = Number(options.actorUserId) > 0 ? Number(options.actorUserId) : null;

  const isSQLi = username.includes("'") || username.includes("--") || username.includes("#");
  const query  = `SELECT * FROM users WHERE username = '${username}' AND password = '${password}'`;

  const rejectForbidden = (message = "Forbidden") => callback({ status: 403, message }, null);

  const processSqliAttempt = () => {
    resolveSqliUser(db, username, (resolveErr, resolvedUserId, resolvedUsername) => {
      if (resolveErr) {
        console.error(`❌ [${TYPE}] Failed to resolve SQLI user from payload:`, resolveErr);
        return callback(null, null);
      }

      const continueWithUser = (targetUserId, targetUsername) => {
        const scoringUserId = actorUserId || targetUserId;
        const disableScope = options.actorScope || `user-${scoringUserId}`;

        canExploitSqliForUser(assignmentDb, scoringUserId, (assignmentErr, isVulnerable) => {
          if (assignmentErr) {
            console.error(`❌ [${TYPE}] Assignment lookup failed for user ${scoringUserId}:`, assignmentErr);
            return callback(null, null);
          }

          if (!isVulnerable) {
            return getSqliAssignmentState(assignmentDb, scoringUserId, (stateErr, assignmentState) => {
              if (stateErr) {
                console.error(`❌ [${TYPE}] Failed to inspect SQLI assignment state for user ${scoringUserId}:`, stateErr);
                return callback(null, null);
              }

              if (assignmentState && Number(assignmentState.is_completed) === 1) {
                console.log(`🔐 [${TYPE}] User ${scoringUserId} already completed SQLI in assignment state`);
                return rejectForbidden("Already exploited");
              }

              console.log(`🚫 [${TYPE}] User ${scoringUserId} is not assigned SQLI in current session`);
              return rejectForbidden("Forbidden");
            });
          }

          // Do not allow SQLi success if persistence cannot be saved.
          generateFlag(persistenceDb, scoringUserId, TYPE, username + password, (flagErr) => {
            if (flagErr) {
              console.error(`❌ [${TYPE}] Failed to persist SQLi completion for user ${scoringUserId}:`, flagErr);
              return callback(null, null);
            }

            return markSqliCompletedInLatestAssignment(assignmentDb, scoringUserId, (markErr) => {
              if (markErr) {
                console.error(`❌ [${TYPE}] Failed to mark SQLI complete for user ${scoringUserId}:`, markErr);
                return callback(null, null);
              }

              disable(TYPE, INFO, disableScope);
              return callback(null, {
                id: targetUserId,
                user_id: targetUserId,
                username: targetUsername,
                vuln_info: INFO
              });
            });
          });
        });
      };

      if (resolvedUserId) {
        return continueWithUser(resolvedUserId, resolvedUsername);
      }

      console.log(`🚫 [${TYPE}] Could not resolve injected username from payload: ${username}`);
      return rejectForbidden("Forbidden: SQLi payload must start with a valid username");
    });
  };

  db.query(query, (err, result) => {
    if (err) {
      if (isSQLi) {
        return processSqliAttempt();
      }
      return callback(null, null);
    }

    if (isSQLi) {
      return processSqliAttempt();
    }

    if (result && result.length) {
      const resolvedUserId = getRowUserId(result[0]);
      return callback(null, { id: resolvedUserId, user_id: resolvedUserId, username: result[0].username });
    }
    return callback(null, null);
  });
};
module.exports = { handleSQLiLogin };
