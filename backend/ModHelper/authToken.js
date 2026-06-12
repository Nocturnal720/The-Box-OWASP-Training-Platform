const resolveUserIdFromToken = (req, db, callback) => {
  const rawToken =
    req.headers["x-lab-token"] ||
    req.headers["X-Lab-Token"] ||
    req.headers.authorization ||
    "";
  const token = String(rawToken).replace(/^Bearer\s+/i, "").trim();

  if (!token) {
    return callback({ status: 401, code: "AUTH_REQUIRED", message: "Unauthorized" }, null);
  }

  db.query(
    `SELECT user_id FROM sessions WHERE token = ? ORDER BY id DESC LIMIT 1`,
    [token],
    (err, rows) => {
      if (err) {
        return callback({ status: 500, code: "AUTH_LOOKUP_FAILED", message: "Server error" }, null);
      }

      if (!rows || !rows.length || rows[0].user_id === null || rows[0].user_id === undefined) {
        return callback({ status: 401, code: "INVALID_TOKEN", message: "Unauthorized" }, null);
      }

      return callback(null, rows[0].user_id);
    }
  );
};

const sendAuthError = (res, err) => {
  const status = err && err.status ? err.status : 401;
  const message = err && err.message ? err.message : "Unauthorized";
  return res.status(status).json({ error: message });
};

module.exports = {
  resolveUserIdFromToken,
  sendAuthError
};
