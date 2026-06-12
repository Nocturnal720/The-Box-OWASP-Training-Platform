const express = require("express");
const cors    = require("cors");
const mysql   = require("mysql2");

const { handleSQLiLogin }   = require("./VulnMods/sqli");
const { addClient, removeClient, getRecentVulns, clearDisabledForScope } = require("./ModHelper/vulnState");
const { handleIDORBalance } = require("./VulnMods/idor");
const { generateFlag }      = require("./ModHelper/generateFlag");
const { getActiveVulnerabilities, markVulnAsCompleted, isUserVulnerableTo, bootstrapUserVulnerabilitySet, startNextVulnerabilitySession, VULN_TYPE_TO_ID } = require("./ModHelper/userVulnerabilityManager");
const { broadcastSuccess } = require("./ModHelper/successBroadcaster");
const { resolveUserIdFromToken, sendAuthError } = require("./ModHelper/authToken");


const app = express();
const sessionRotationLocks = new Set();

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || /localhost:(3000|3001)/.test(origin)) {
      callback(null, true);
    } else {
      callback(new Error('CORS not allowed'));
    }
  },
  credentials: true,
  allowedHeaders: ["Content-Type", "Authorization", "X-User-Id", "X-CSRF-Token", "X-Assigned-Vulns", "X-Lab-Token"]
}));
app.use(express.json());
const vulnContext = require("./middleware/vulnContext");
app.use(vulnContext);
app.use((req, res, next) => { res.setHeader("Cache-Control", "no-store"); next(); });


// Middleware VulnMods store vuln_info in res.locals — merge it into every res.json() automatically
app.use((req, res, next) => {
  const _json = res.json.bind(res);
  res.json = (data) => {
    if (res.locals.vuln_info && data && typeof data === 'object' && !data.vuln_info) {
      data.vuln_info = res.locals.vuln_info;
    }
    return _json(data);
  };
  next();
});

// ─── DB ───────────────────────────────────────────────────
const db = mysql.createConnection({
  host:     "localhost",
  user:     "root",
  password: "Rohan123",
  database: "owasp_app",
});

db.connect((err) => {
  if (err) console.error("DB connection failed:", err);
  else     console.log("Connected to MySQL (owasp_app)");
});

// ─── SECURITY LAB DB (FakeBank) ───────────────────────────
const bankDb = mysql.createConnection({
  host:     "localhost",
  user:     "root",
  password: "Rohan123",
  database: "security_lab",
});

bankDb.connect((err) => {
  if (err) console.error("Bank DB connection failed:", err);
  else     console.log("Connected to MySQL (security_lab)");
});

// ─── HELPERS ──────────────────────────────────────────────
const logActivity = (userId, action) => {
  bankDb.query(`INSERT INTO activity (user_id, action) VALUES (${userId}, '${action}')`);
};

const pushNotification = (userId, message) => {
  bankDb.query(`INSERT INTO notifications (user_id, message) VALUES (${userId}, '${message}')`);
};

const securityLabTransactions = [
  { id: 101, amount: 2500, hidden: false },
  { id: 102, amount: 4300, hidden: false },
  { id: 103, amount: 1800, hidden: false },
  { id: 999, amount: "ADMIN-SECRET", hidden: true }
];

// ─── VULN MODULES loaded BEFORE core routes ──
require("./VulnMods/idor_transactions")(app, bankDb);
require("./VulnMods/idor_account")(app, bankDb);
require("./VulnMods/idor_loan")(app, bankDb);
require("./VulnMods/idor_support")(app, bankDb);
require("./VulnMods/unauth_transfer")(app, bankDb);
require("./VulnMods/unauth_payee_add")(app, bankDb);
require("./VulnMods/delete_payee_idor.js")(app, bankDb);

// ─── AUTH ─────────────────────────────────────────────────
app.post("/login", (req, res) => {
  const { username, password } = req.body;
  handleSQLiLogin(username, password, db, bankDb, generateFlag, (err, user) => {
    if (err) {
      if (err.status === 403) {
        return res.status(403).json({ success: false, message: err.message || "Forbidden" });
      }
      return res.status(500).send(err);
    }
    if (user) {
      const token = Math.random().toString(36).substring(2);
      const userId = user.user_id || user.id;
      
      // Create session FIRST (with callback), THEN get vulnerabilities to ensure session exists
      bankDb.query(`INSERT INTO sessions (user_id, token) VALUES (${userId}, '${token}')`, (err) => {
        if (err) console.error("Session creation error:", err);
        logActivity(userId, "Logged in");
        
        // ✅ GET ACTIVE VULNERABILITIES (respects completion lock - no auto-assignment)
        getActiveVulnerabilities(userId, bankDb, (err, result) => {
          if (err) {
            console.error("Error getting active vulns:", err);
            return res.status(500).json({ success: false, message: "Server error" });
          }

          const respondWithVulns = (vulnResult, message) => {
            const assignedVulns = vulnResult && vulnResult.vulnerabilities && vulnResult.vulnerabilities.length > 0
              ? vulnResult.vulnerabilities.map(v => v.id)
              : [];
            const { vuln_info: vi, ...safeUser } = user;

            res.json({
              success: true,
              user: safeUser,
              token,
              assignedVulns,
              sessionNumber: vulnResult?.session,
              ...(vi ? { vuln_info: vi } : {}),
              ...(message ? { message } : {})
            });
          };

          if (result?.allDone) {
            return startNextVulnerabilitySession(userId, bankDb, (rotationErr, nextRound) => {
              if (rotationErr) {
                console.error("Error rotating completed vuln session:", rotationErr);
                return respondWithVulns(result, "All vulnerabilities completed for this session. You are locked out.");
              }

              return respondWithVulns(nextRound, "Previous round completed. Assigned 8 new random vulnerabilities.");
            });
          }

          return respondWithVulns(result);
        });
      });
    } else {
      res.json({ success: false, message: "Invalid credentials" });
    }
  });
});


// ─── FAKEBANK LOGIN (queries security_lab.users for auth) ────────────
app.post("/bank/login", (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ success: false, message: "Username and password required" });
  }

  const isSqliAttempt =
    String(username).includes("'") ||
    String(username).includes("--") ||
    String(username).includes("#");

  const finishBankLogin = (err, user) => {
    if (err) {
      if (err.status === 403) {
        return res.status(403).json({ success: false, message: err.message || "Forbidden" });
      }
      return res.status(500).json({ success: false, message: "Server error" });
    }
    if (!user) return res.json({ success: false, message: "Invalid credentials" });

    const token = Math.random().toString(36).substring(2);
    const userId = user.id || user.user_id;
    
    // Create session FIRST (with callback), THEN get vulnerabilities
    bankDb.query(`INSERT INTO sessions (user_id, token) VALUES (${userId}, '${token}')`, (err) => {
      if (err) console.error("Session creation error:", err);
      
      getActiveVulnerabilities(userId, bankDb, (err, result) => {
        if (err) {
          console.error("Error getting active vulns:", err);
          return res.status(500).json({ success: false, message: "Server error" });
        }

        const respondWithVulns = (vulnResult, message) => {
          const assignedVulns = vulnResult && vulnResult.vulnerabilities && vulnResult.vulnerabilities.length > 0
            ? vulnResult.vulnerabilities.map(v => v.id)
            : [];
          const { vuln_info: vi } = user;

          res.json({
            success: true,
            token,
            assignedVulns,
            sessionNumber: vulnResult?.session,
            user: { id: userId, username: user.username },
            ...(vi ? { vuln_info: vi } : {}),
            ...(message ? { message } : {})
          });
        };

        if (result?.allDone) {
          return startNextVulnerabilitySession(userId, bankDb, (rotationErr, nextRound) => {
            if (rotationErr) {
              console.error("Error rotating completed bank vuln session:", rotationErr);
              return respondWithVulns(result, "All vulnerabilities completed for this session. You are locked out.");
            }

            return respondWithVulns(nextRound, "Previous round completed. Assigned 8 new random vulnerabilities.");
          });
        }

        return respondWithVulns(result);
      });
    });
  };

  const runBankLogin = (actorUserId = null, actorScope = null) => {
    if (actorUserId) {
      return handleSQLiLogin(
        username,
        password,
        bankDb,
        bankDb,
        generateFlag,
        { actorUserId, actorScope },
        finishBankLogin
      );
    }

    return handleSQLiLogin(username, password, bankDb, bankDb, generateFlag, finishBankLogin);
  };

  if (!isSqliAttempt) {
    return runBankLogin();
  }

  const attackerToken = req.headers.authorization;
  if (!attackerToken) {
    return res.status(401).json({ success: false, message: "Unauthorized: login as your lab user first" });
  }

  bankDb.query(
    `SELECT user_id FROM sessions WHERE token = ? ORDER BY id DESC LIMIT 1`,
    [attackerToken],
    (tokenErr, tokenRows) => {
      if (tokenErr) {
        console.error("[BANK LOGIN] Failed to resolve attacker token:", tokenErr);
        return res.status(500).json({ success: false, message: "Server error" });
      }

      const actorUserId = tokenRows && tokenRows.length > 0 ? tokenRows[0].user_id : null;
      if (!actorUserId) {
        return res.status(401).json({ success: false, message: "Unauthorized: invalid attacker session" });
      }

      return runBankLogin(actorUserId, attackerToken);
    }
  );
});

app.post("/logout", (req, res) => {
  const { user_id } = req.body || {};
  const rawToken = req.headers.authorization || req.headers["x-lab-token"] || "";
  const token = String(rawToken).replace(/^Bearer\s+/i, "").trim();
  const resolvedUserId = Number(user_id);

  const logAndRespond = () => {
    if (Number.isFinite(resolvedUserId) && resolvedUserId > 0) {
      bankDb.query(
        `INSERT INTO activity (user_id, action) VALUES (?, 'Logged out')`,
        [resolvedUserId],
        () => res.json({ success: true })
      );
      return;
    }

    res.json({ success: true });
  };

  if (token) {
    bankDb.query(`DELETE FROM sessions WHERE token = ?`, [token], (err) => {
      if (err) console.error("Logout session cleanup error:", err);
      logAndRespond();
    });
    return;
  }

  if (Number.isFinite(resolvedUserId) && resolvedUserId > 0) {
    bankDb.query(`DELETE FROM sessions WHERE user_id = ?`, [resolvedUserId], (err) => {
      if (err) console.error("Logout session cleanup error:", err);
      logAndRespond();
    });
    return;
  }

  logAndRespond();
});

// ─── REGISTER ──
app.post("/register", (req, res) => {
  const { username, email, password } = req.body;
  if (!username || !email || !password) return res.status(400).json({ error: "username, email and password required" });

  // Registration is scoped to owasp_app auth users only.
  db.query(
    "INSERT INTO users (username, email, password) VALUES (?, ?, ?)",
    [username, email, password],
    (err, result) => {
      if (err) return res.status(500).json({ error: err.message });

      const newUserId = result.insertId;
      bootstrapUserVulnerabilitySet(newUserId, bankDb, (assignmentErr, assignmentData) => {
        if (assignmentErr) {
          console.error(`❌ [REGISTER] Failed to assign vulnerabilities for user ${newUserId}:`, assignmentErr);

          // Keep auth and vulnerability state consistent if assignment bootstrap fails.
          return db.query("DELETE FROM users WHERE user_id = ?", [newUserId], (rollbackErr) => {
            if (rollbackErr) {
              console.error(`❌ [REGISTER] Rollback failed for user ${newUserId}:`, rollbackErr);
            }
            return res.status(500).json({ error: "Registration failed while assigning vulnerabilities" });
          });
        }

        const assignedVulns = assignmentData?.vulnerabilities?.map((v) => v.id) || [];
        res.json({ success: true, id: newUserId, assignedVulns });
      });
    }
  );
});

// ─── LEARNING LAB APIs ───────────────────────────────────
app.get("/api/security_lab/search", (req, res) => {
  const rawQuery = String(req.query.query || "").trim();

  if (!rawQuery) {
    return res.json({ data: [], message: "Enter a transaction ID to search." });
  }

  // Intentional training flaw: simple pattern check to emulate SQLi exposure.
  const isInjectionPayload = /('|--|#|;|\/\*|\b(or|union|select)\b)/i.test(rawQuery);
  if (isInjectionPayload) {
    return res.json({
      data: securityLabTransactions.map(({ id, amount }) => ({ id, amount })),
      message: "Input interpreted as SQL expression. Hidden rows were exposed.",
      flag: "FLAG{INPUT_INTERPRETATION_SQLI}"
    });
  }

  const transactionId = Number.parseInt(rawQuery, 10);
  if (!Number.isFinite(transactionId)) {
    return res.json({ data: [], message: "No records found." });
  }

  const data = securityLabTransactions
    .filter((row) => row.id === transactionId && !row.hidden)
    .map(({ id, amount }) => ({ id, amount }));

  return res.json({
    data,
    message: data.length ? "Record found." : "No records found."
  });
});

app.get("/api/security_lab/calculate", (req, res) => {
  const quantity = Number(req.query.quantity);
  const price = Number(req.query.price);

  if (!Number.isFinite(quantity) || !Number.isFinite(price) || quantity <= 0 || price <= 0) {
    return res.status(400).json({ message: "Quantity and price must be valid positive numbers." });
  }

  // Intentional training flaw: server trusts client-supplied unit price.
  const total = Number((quantity * price).toFixed(2));
  const manipulated = quantity >= 100 && price <= 0.01;

  return res.json({
    total,
    message: manipulated
      ? "Business logic bypass detected: server accepted manipulated client price."
      : "Total calculated from client-supplied values.",
    ...(manipulated ? { flag: "FLAG{SYSTEM_ARCHITECTURE_LOGIC_BYPASS}" } : {})
  });
});

// ─── BALANCE (IDOR module) ────────────────────────────────
app.get("/balance/:userId", (req, res) => {
  handleIDORBalance(req, res, bankDb, generateFlag, (err, result) => {
    if (err) return res.status(500).send(err);
    if (result) res.json(result); // only fires for the non-exploit path
  });
});

// ─── ACCOUNT ──────────────────────────────────────────────
app.get("/account/:userId", (req, res) => {
  const userId = req.params.userId;
  bankDb.query(`SELECT * FROM accounts WHERE user_id = ${userId}`, (err, result) => {
    if (err) return res.status(500).send(err);
    res.json(result[0]);
  });
});

// ─── TRANSACTIONS ─────────────────────────────────────────
app.get("/transactions/:userId", (req, res) => {
  const userId = req.params.userId;
  bankDb.query(
    `SELECT * FROM transactions WHERE user_id = ${userId} ORDER BY created_at DESC`,
    (err, result) => {
      if (err) return res.status(500).send(err);
      res.json(result);
    }
  );
});

app.post("/transaction", (req, res) => {
  const { user_id, amount, type } = req.body;
  bankDb.query(
    `INSERT INTO transactions (user_id, amount, type) VALUES (${user_id}, ${amount}, '${type}')`,
    (err) => {
      if (err) return res.status(500).send(err);
      const updateQuery = type === "deposit"
        ? `UPDATE accounts SET balance = balance + ${amount} WHERE user_id = ${user_id}`
        : `UPDATE accounts SET balance = balance - ${amount} WHERE user_id = ${user_id}`;
      bankDb.query(updateQuery);
      const action = type === "deposit" ? `Deposited ₹${amount}` : `Withdrew ₹${amount}`;
      logActivity(user_id, action);
      pushNotification(user_id, `${type === "deposit" ? "✅ Credited" : "🔴 Debited"} ₹${amount} — ${type}`);
      res.json({ message: "Transaction added" });
    }
  );
});

// ─── TRANSFERS ────────────────────────────────────────────
app.post("/transfer", (req, res) => {
  const { from_user, to_user, amount } = req.body;
  bankDb.query(
    `UPDATE accounts SET balance = balance - ${amount} WHERE user_id = ${from_user}`,
    (err) => {
      if (err) return res.status(500).send(err);
      bankDb.query(
        `UPDATE accounts SET balance = balance + ${amount} WHERE user_id = ${to_user}`,
        (err) => {
          if (err) return res.status(500).send(err);
          bankDb.query(`INSERT INTO transfers (from_user, to_user, amount) VALUES (${from_user}, ${to_user}, ${amount})`);
          bankDb.query(`INSERT INTO transactions (user_id, amount, type) VALUES (${from_user}, ${amount}, 'transfer')`);
          bankDb.query(`INSERT INTO transactions (user_id, amount, type) VALUES (${to_user},   ${amount}, 'transfer')`);
          logActivity(from_user, `Transferred ₹${amount} to user ${to_user}`);
          logActivity(to_user,   `Received ₹${amount} from user ${from_user}`);
          pushNotification(from_user, `↗ You sent ₹${amount} to User #${to_user}`);
          pushNotification(to_user,   `↙ You received ₹${amount} from User #${from_user}`);
          res.json({ success: true });
        }
      );
    }
  );
});

// ─── ACTIVITY ─────────────────────────────────────────────
app.get("/activity/:userId", (req, res) => {
  const userId = req.params.userId;
  bankDb.query(
    `SELECT * FROM activity WHERE user_id = ${userId} ORDER BY created_at DESC LIMIT 10`,
    (err, result) => {
      if (err) return res.status(500).send(err);
      res.json(result);
    }
  );
});

// ─── PAYEES ───────────────────────────────────────────────
app.get("/payees/:userId", (req, res) => {
  const userId = req.params.userId;
  bankDb.query(
    `SELECT * FROM payees WHERE user_id = ${userId} ORDER BY created_at DESC`,
    (err, result) => {
      if (err) return res.status(500).send(err);
      res.json(result);
    }
  );
});

app.post("/payees", (req, res) => {
  const { user_id, name, account_no, ifsc, nickname } = req.body;
  bankDb.query(
    `INSERT INTO payees (user_id, name, account_no, ifsc, nickname)
     VALUES (${user_id}, '${name}', '${account_no}', '${ifsc}', '${nickname}')`,
    (err, result) => {
      if (err) return res.status(500).send(err);
      logActivity(user_id, `Added payee: ${name}`);
      res.json({ success: true, id: result.insertId });
    }
  );
});

app.delete("/payees/:id", (req, res) => {
  const id = req.params.id;
  bankDb.query(`DELETE FROM payees WHERE id = ${id}`, (err) => {
    if (err) return res.status(500).send(err);
    res.json({ success: true });
  });
});

app.post("/transfer/payee", (req, res) => {
  const { from_user, payee_id, amount } = req.body;
  bankDb.query(`SELECT * FROM payees WHERE id = ${payee_id}`, (err, result) => {
    if (err || !result[0]) return res.status(404).json({ error: "Payee not found" });
    const payee = result[0];
    bankDb.query(
      `UPDATE accounts SET balance = balance - ${amount} WHERE user_id = ${from_user}`,
      (err) => {
        if (err) return res.status(500).send(err);
        bankDb.query(`INSERT INTO transfers (from_user, to_user, amount) VALUES (${from_user}, ${payee.user_id || 0}, ${amount})`);
        bankDb.query(`INSERT INTO transactions (user_id, amount, type) VALUES (${from_user}, ${amount}, 'transfer')`);
        logActivity(from_user, `Sent ₹${amount} to ${payee.name} (${payee.account_no})`);
        pushNotification(from_user, `↗ Sent ₹${amount} to ${payee.nickname || payee.name}`);
        res.json({ success: true });
      }
    );
  });
});

// ─── SCHEDULED PAYMENTS ───────────────────────────────────
app.get("/scheduled/:userId", (req, res) => {
  const userId = req.params.userId;
  bankDb.query(
    `SELECT s.*, p.name as payee_name, p.nickname as payee_nick
     FROM scheduled_payments s
     LEFT JOIN payees p ON s.payee_id = p.id
     WHERE s.user_id = ${userId}
     ORDER BY s.next_run_date ASC`,
    (err, result) => {
      if (err) return res.status(500).send(err);
      res.json(result);
    }
  );
});

app.post("/scheduled", (req, res) => {
  const { user_id, payee_id, amount, frequency, next_run_date, description } = req.body;
  bankDb.query(
    `INSERT INTO scheduled_payments (user_id, payee_id, amount, frequency, next_run_date, description)
     VALUES (${user_id}, ${payee_id || "NULL"}, ${amount}, '${frequency}', '${next_run_date}', '${description}')`,
    (err, result) => {
      if (err) return res.status(500).send(err);
      logActivity(user_id, `Scheduled ₹${amount} payment — ${frequency}`);
      res.json({ success: true, id: result.insertId });
    }
  );
});

app.delete("/scheduled/:id", (req, res) => {
  const id = req.params.id;
  bankDb.query(`DELETE FROM scheduled_payments WHERE id = ${id}`, (err) => {
    if (err) return res.status(500).send(err);
    res.json({ success: true });
  });
});

// ─── NOTIFICATIONS ────────────────────────────────────────
app.get("/notifications/:userId", (req, res) => {
  const userId = req.params.userId;
  bankDb.query(
    `SELECT * FROM notifications WHERE user_id = ${userId} ORDER BY created_at DESC LIMIT 20`,
    (err, result) => {
      if (err) return res.status(500).send(err);
      res.json(result);
    }
  );
});

app.post("/notifications/read/:userId", (req, res) => {
  const userId = req.params.userId;
  bankDb.query(`UPDATE notifications SET is_read = 1 WHERE user_id = ${userId}`, (err) => {
    if (err) return res.status(500).send(err);
    res.json({ success: true });
  });
});

// ─── SUPPORT TICKETS ──────────────────────────────────────
app.get("/support/:userId", (req, res) => {
  const userId = req.params.userId;
  bankDb.query(
    `SELECT * FROM support_tickets WHERE user_id = ${userId} ORDER BY created_at DESC`,
    (err, result) => {
      if (err) return res.status(500).send(err);
      res.json(result);
    }
  );
});

app.post("/support", (req, res) => {
  const { user_id, subject, message } = req.body;
  bankDb.query(
    `INSERT INTO support_tickets (user_id, subject, message) VALUES (${user_id}, '${subject}', '${message}')`,
    (err, result) => {
      if (err) return res.status(500).send(err);
      logActivity(user_id, `Raised support ticket: ${subject}`);
      pushNotification(user_id, `🎫 Your support ticket "${subject}" has been received.`);
      res.json({ success: true, id: result.insertId });
    }
  );
});

// ─── LOANS ────────────────────────────────────────────────
app.get("/loans/:userId", (req, res) => {
  const userId = req.params.userId;
  bankDb.query(
    `SELECT * FROM loans WHERE user_id = ${userId} ORDER BY created_at DESC`,
    (err, result) => {
      if (err) return res.status(500).send(err);
      res.json(result);
    }
  );
});

app.get("/loan/:id", (req, res) => {
  const id = req.params.id;
  bankDb.query(`SELECT * FROM loans WHERE id = ${id}`, (err, result) => {
    if (err) return res.status(500).send(err);
    if (!result[0]) return res.status(404).json({ error: "Loan not found" });
    res.json(result[0]);
  });
});

app.post("/loan", (req, res) => {
  const { user_id, amount, purpose, status } = req.body;
  const loanStatus = status || "pending";
  bankDb.query(
    `INSERT INTO loans (user_id, amount, purpose, status, outstanding)
     VALUES (${user_id}, ${amount}, '${purpose}', '${loanStatus}', ${amount})`,
    (err, result) => {
      if (err) return res.status(500).send(err);
      logActivity(user_id, `Applied for loan of ₹${amount}`);
      pushNotification(user_id, `📋 Loan application for ₹${amount} submitted. Status: ${loanStatus}`);
      res.json({ success: true, id: result.insertId, status: loanStatus });
    }
  );
});

app.post("/loan/disburse/:id", (req, res) => {
  const id = req.params.id;
  bankDb.query(`SELECT * FROM loans WHERE id = ${id}`, (err, result) => {
    if (err || !result[0]) return res.status(404).json({ error: "Loan not found" });
    const loan = result[0];
    if (loan.disbursed) return res.json({ message: "Already disbursed" });
    bankDb.query(`UPDATE accounts SET balance = balance + ${loan.amount} WHERE user_id = ${loan.user_id}`);
    bankDb.query(`UPDATE loans SET disbursed = 1, status = 'approved' WHERE id = ${id}`);
    bankDb.query(`INSERT INTO transactions (user_id, amount, type) VALUES (${loan.user_id}, ${loan.amount}, 'loan_credit')`);
    logActivity(loan.user_id, `Loan #${id} disbursed — ₹${loan.amount} credited`);
    pushNotification(loan.user_id, `✅ Your loan of ₹${loan.amount} has been approved and credited.`);
    res.json({ success: true });
  });
});

app.post("/loan/repay", (req, res) => {
  const { loan_id, user_id, amount } = req.body;
  bankDb.query(`SELECT * FROM loans WHERE id = ${loan_id}`, (err, result) => {
    if (err || !result[0]) return res.status(404).json({ error: "Loan not found" });
    const loan = result[0];
    const repay = parseInt(amount);
    const newOutstanding = Math.max(0, loan.outstanding - repay);
    const newStatus = newOutstanding === 0 ? "closed" : loan.status;
    bankDb.query(`UPDATE accounts SET balance = balance - ${repay} WHERE user_id = ${user_id}`);
    bankDb.query(`UPDATE loans SET outstanding = ${newOutstanding}, status = '${newStatus}' WHERE id = ${loan_id}`);
    bankDb.query(`INSERT INTO loan_repayments (loan_id, user_id, amount) VALUES (${loan_id}, ${user_id}, ${repay})`);
    bankDb.query(`INSERT INTO transactions (user_id, amount, type) VALUES (${user_id}, ${repay}, 'loan_repay')`);
    logActivity(user_id, `Repaid ₹${repay} on loan #${loan_id}`);
    pushNotification(user_id, `💳 Loan repayment of ₹${repay} recorded. Outstanding: ₹${newOutstanding}`);
    res.json({ success: true, outstanding: newOutstanding, status: newStatus });
  });
});

// ─── FLAGS ────────────────────────────────────────────────
app.get("/flags/:userId", (req, res) => {
  const userId = req.params.userId;
  console.log(`📡 [FLAGS API] Request for user_id=${userId}`);
  bankDb.query(`SELECT type, flag FROM flags WHERE user_id = ${userId}`, (err, result) => {
    if (err) {
      console.error(`❌ [FLAGS API] Query error:`, err);
      return res.status(500).send(err);
    }
    console.log(`📡 [FLAGS API] Returning ${result.length} flags for user_id=${userId}`);
    res.json(result);
  });
});

// ─── MINI STATEMENT ───────────────────────────────────────
app.get("/mini-statement/:userId", (req, res) => {
  const userId = req.params.userId;
  bankDb.query(
    `SELECT t.*, a.balance as current_balance
     FROM transactions t
     JOIN accounts a ON a.user_id = t.user_id
     WHERE t.user_id = ${userId}
     ORDER BY t.created_at DESC LIMIT 5`,
    (err, result) => {
      if (err) return res.status(500).send(err);
      res.json(result);
    }
  );
});

// ─── VULN EVENTS (SSE) ───────────────────────────────────
// React app connects here once; backend pushes vuln_info the instant any
// exploit fires — works for console fetch, URL-bar, and in-app calls alike.
app.get("/vuln-events", (req, res) => {
  console.log("🔌 [SSE] New client connecting to /vuln-events");
  res.setHeader("Content-Type",  "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection",    "keep-alive");
  res.flushHeaders();
  res.write(": connected\n\n"); // initial heartbeat
  addClient(res);
  console.log("✅ [SSE] Client registered");
  req.on("close", () => {
    console.log("❌ [SSE] Client disconnected");
    removeClient(res);
  });
});

// ─── VULN POLLING (Fallback if SSE fails) ────────────────────
// Frontend can poll this to get recently triggered vulnerabilities
app.get("/api/recent-vulns", (req, res) => {
  const since = parseInt(req.query.since) || 0;
  const vulns = getRecentVulns(since);
  console.log(`📊 [POLLING] Returning ${vulns.length} recent vulns since ${since}`);
  res.json({ vulns, timestamp: Date.now() });
});

// ─── DEBUG: Check recent vulns ────────────────
app.get("/api/debug/recent-vulns", (req, res) => {
  const allVulns = getRecentVulns(0); // Get all
  res.json({ total: allVulns.length, vulns: allVulns });
});

// ─── USER VULNERABILITY MANAGEMENT API ────────────────────
// ─── GET USER'S ACTIVE VULNERABILITIES ─────────────────────
app.get("/api/user-vulnerabilities/:userId", (req, res) => {
  const userId = req.params.userId;
  
  getActiveVulnerabilities(userId, bankDb, (err, data) => {
    if (err) return res.status(500).json({ error: err.message });
    
    res.json({
      success: true,
      vulnerabilities: data.vulnerabilities,
      session: data.session,
      completed: data.completed,
      total: data.total,
      allDone: data.allDone
    });
  });
});

// ─── MARK VULNERABILITY AS COMPLETED ──────────────────────
app.post("/api/vuln-completed", (req, res) => {
  const { user_id, vuln_id, vuln_type } = req.body;
  const normalizedUserId = Number(user_id);

  let resolvedVulnId = Number(vuln_id);
  if ((!resolvedVulnId || Number.isNaN(resolvedVulnId)) && vuln_type) {
    resolvedVulnId = VULN_TYPE_TO_ID[String(vuln_type).trim()];
  }

  if (!resolvedVulnId) {
    return res.status(400).json({ error: "vuln_id (or vuln_type) required" });
  }

  const handleCompletion = (effectiveUserId) => {
    markVulnAsCompleted(effectiveUserId, resolvedVulnId, bankDb, (err, result) => {
    if (err) return res.status(500).json({ error: err.message });

    if (!result.allCompleted) {
      return res.json({
        success: true,
        allCompleted: false,
        completed: result.completed,
        total: result.total,
        session: result.session
      });
    }

    if (sessionRotationLocks.has(effectiveUserId)) {
      return res.json({
        success: true,
        allCompleted: true,
        completed: result.completed,
        total: result.total,
        session: result.session,
        rotating: true
      });
    }

    sessionRotationLocks.add(effectiveUserId);

    startNextVulnerabilitySession(effectiveUserId, bankDb, (assignmentErr, nextRound) => {
      sessionRotationLocks.delete(effectiveUserId);

      if (assignmentErr) {
        console.error("❌ [VULN-COMPLETE] Failed to rotate vulnerability session:", assignmentErr);
        return res.status(500).json({
          error: "Completed current session, but failed to assign next round"
        });
      }

      clearDisabledForScope(req);

      const nextAssignedVulns = nextRound?.vulnerabilities?.map((v) => v.id) || [];
      const successPayload = {
        isSuccess: true,
        allCompleted: true,
        completed: result.completed || 8,
        total: result.total || 8,
        session: result.session,
        nextSession: nextRound?.session,
        nextAssignedVulns,
        message: "Round complete. You have been assigned 8 new random vulnerabilities."
      };

      broadcastSuccess(successPayload);

      return res.json({
        success: true,
        allCompleted: true,
        completed: result.completed,
        total: result.total,
        session: result.session,
        nextSession: nextRound?.session,
        nextAssignedVulns
      });
    });
    });
  };

  if (normalizedUserId && !Number.isNaN(normalizedUserId)) {
    return handleCompletion(normalizedUserId);
  }

  return resolveUserIdFromToken(req, bankDb, (authErr, tokenUserId) => {
    if (authErr) {
      return sendAuthError(res, authErr);
    }

    return handleCompletion(Number(tokenUserId));
  });
});

// ─── ASSIGN OR REUSE NEXT VULNERABILITY ROUND ───────────
app.post("/api/vuln-next-round", (req, res) => {
  const normalizedUserId = Number(req.body?.user_id);

  const respondWithAssignment = (effectiveUserId, assignment, reassigned, message) => {
    const assignedVulns = Array.isArray(assignment?.vulnerabilities)
      ? assignment.vulnerabilities.map((v) => v.id)
      : [];

    return res.json({
      success: true,
      userId: effectiveUserId,
      reassigned,
      session: assignment?.session || null,
      assignedVulns,
      completed: Number(assignment?.completed || 0),
      total: Number(assignment?.total || assignedVulns.length),
      allDone: Boolean(assignment?.allDone),
      ...(message ? { message } : {})
    });
  };

  const ensureNextRound = (effectiveUserId) => {
    getActiveVulnerabilities(effectiveUserId, bankDb, (err, current) => {
      if (err) return res.status(500).json({ error: err.message });

      const hasActiveRound =
        Array.isArray(current?.vulnerabilities) &&
        current.vulnerabilities.length > 0 &&
        !current.allDone;

      if (hasActiveRound) {
        return respondWithAssignment(
          effectiveUserId,
          current,
          false,
          "Existing active round found. Reusing assigned vulnerabilities."
        );
      }

      startNextVulnerabilitySession(effectiveUserId, bankDb, (assignmentErr, nextRound) => {
        if (assignmentErr) {
          console.error("❌ [VULN-NEXT] Failed to assign next vulnerability round:", assignmentErr);
          return res.status(500).json({ error: "Failed to assign next vulnerability round" });
        }

        clearDisabledForScope(req);

        return respondWithAssignment(
          effectiveUserId,
          nextRound,
          true,
          "Assigned 8 new random vulnerabilities."
        );
      });
    });
  };

  if (normalizedUserId && !Number.isNaN(normalizedUserId)) {
    return ensureNextRound(normalizedUserId);
  }

  return resolveUserIdFromToken(req, bankDb, (authErr, tokenUserId) => {
    if (authErr) {
      return sendAuthError(res, authErr);
    }

    return ensureNextRound(Number(tokenUserId));
  });
});

// ─── CHECK IF USER IS VULNERABLE TO SPECIFIC VULN ─────────
app.get("/api/is-vulnerable/:userId/:vulnId", (req, res) => {
  const userId = req.params.userId;
  const vulnId = req.params.vulnId;
  
  isUserVulnerableTo(userId, vulnId, bankDb, (err, isVulnerable) => {
    if (err) return res.status(500).json({ error: err.message });
    
    res.json({
      success: true,
      vulnerable: isVulnerable
    });
  });
});

// ─── GET USER'S VULNERABILITY SESSION INFO ─────────────────
app.get("/api/user-vuln-stats/:userId", (req, res) => {
  const userId = req.params.userId;
  
  bankDb.query(
    `SELECT 
       us.id as session_number,
       COUNT(uv.id) as total_vulns,
       SUM(uv.is_completed) as completed_vulns,
       CASE
         WHEN COUNT(uv.id) > 0 AND SUM(uv.is_completed) = COUNT(uv.id) THEN 1
         ELSE 0
       END as is_completed
     FROM sessions us
     LEFT JOIN user_vulnerabilities uv ON us.user_id = uv.user_id AND us.id = uv.session_id
     WHERE us.user_id = ?
     GROUP BY us.id
     ORDER BY us.id DESC`,
    [userId],
    (err, stats) => {
      if (err) return res.status(500).json({ error: err.message });
      
      res.json({
        success: true,
        stats: stats,
        totalSessions: stats.length,
        completedSessions: stats.filter(s => s.is_completed).length
      });
    }
  );
});

app.listen(5000, () => { console.log("Server running on port 5000"); });

// ─── REMAINING OWASP VULN MODULES (route-based, loaded after core routes) ──
require("./VulnMods/reflected_xss")(app, bankDb);
require("./VulnMods/reflected_xss_2")(app, bankDb);
require("./VulnMods/secret_leak")(app, bankDb);
require("./VulnMods/debug")(app, bankDb);
require("./VulnMods/forced_browsing")(app, bankDb);
require("./VulnMods/mass_assignment")(app, bankDb);
require("./VulnMods/profile_data_leak")(app, bankDb);
require("./VulnMods/missing_auth_check")(app, bankDb);
require("./VulnMods/insecure_headers")(app, bankDb);
require("./VulnMods/path_traversal")(app, bankDb);

require("./VulnMods/sensitive_get_param")(app, bankDb);
