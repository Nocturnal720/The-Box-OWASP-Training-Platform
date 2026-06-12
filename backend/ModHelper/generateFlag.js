const crypto = require("crypto");

const generateFlag = (db, userId, type, input = "", callback) => {
  const selectQuery = "SELECT flag FROM flags WHERE user_id = ? AND type = ?";

  db.query(selectQuery, [userId, type], (err, existing) => {
    if (err) {
      if (callback) return callback(err);
      return;
    }

    // already exists
    if (existing.length > 0) {
      if (callback) return callback(null, existing[0].flag);
      return;
    }

    // stronger randomness
    const hash = crypto
      .createHash("sha256")
      .update(type + input + Date.now() + Math.random())
      .digest("hex");

    const flag = `FLAG{${hash}}`;

    const insertQuery =
      "INSERT INTO flags (user_id, type, flag) VALUES (?, ?, ?)";

    db.query(insertQuery, [userId, type, flag], (err2) => {
      if (err2) {
        if (callback) return callback(err2);
        return;
      }

      console.log("FLAG GENERATED:", type, flag);

      if (callback) return callback(null, flag);
    });
  });
};

module.exports = { generateFlag };