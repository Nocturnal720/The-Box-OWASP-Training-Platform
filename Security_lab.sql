-- 1. Payees (saved beneficiaries for transfers)
CREATE TABLE IF NOT EXISTS payees (
  id           INT AUTO_INCREMENT PRIMARY KEY,
  user_id      INT NOT NULL,
  name         VARCHAR(100),
  account_no   VARCHAR(30),
  ifsc         VARCHAR(20) DEFAULT NULL,
  nickname     VARCHAR(50),
  created_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Scheduled / recurring transactions
CREATE TABLE IF NOT EXISTS scheduled_payments (
  id             INT AUTO_INCREMENT PRIMARY KEY,
  user_id        INT NOT NULL,
  payee_id       INT,
  amount         INT NOT NULL,
  frequency      ENUM('once','weekly','monthly') DEFAULT 'once',
  next_run_date  DATE NOT NULL,
  description    VARCHAR(100),
  status         ENUM('active','paused','done') DEFAULT 'active',
  created_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. Support / help tickets
CREATE TABLE IF NOT EXISTS support_tickets (
  id           INT AUTO_INCREMENT PRIMARY KEY,
  user_id      INT NOT NULL,
  subject      VARCHAR(150),
  message      TEXT,
  status       ENUM('open','resolved') DEFAULT 'open',
  created_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 4. Notifications
CREATE TABLE IF NOT EXISTS notifications (
  id           INT AUTO_INCREMENT PRIMARY KEY,
  user_id      INT NOT NULL,
  message      TEXT,
  is_read      TINYINT(1) DEFAULT 0,
  created_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE user_vulnerabilities (
  id INT NOT NULL AUTO_INCREMENT,
  user_id INT NOT NULL,
  vuln_id INT NOT NULL,  -- Refers to vulnerability ID (1-20)
  is_completed TINYINT(1) DEFAULT 0,
  completed_at TIMESTAMP NULL,
  session_id INT DEFAULT 1,  -- Which session the vulnerability is assigned for
  PRIMARY KEY (id),
  UNIQUE KEY unique_assignment (user_id, vuln_id, session_id)
);

-- Table to track assignment sessions (when user starts a new round of 8 vulns)
CREATE TABLE user_sessions (
  id INT NOT NULL AUTO_INCREMENT,
  user_id INT NOT NULL,
  session_number INT NOT NULL,
  assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  completed_at TIMESTAMP NULL,
  is_completed TINYINT(1) DEFAULT 0,
  PRIMARY KEY (id),
  KEY idx_user_sessions_user_id (user_id)
);

-- Table mapping vulnerability IDs to names (reference table)
CREATE TABLE vulnerabilities (
  id INT NOT NULL AUTO_INCREMENT,
  name VARCHAR(100) NOT NULL,
  endpoint VARCHAR(100),
  description TEXT,
  difficulty VARCHAR(20),
  PRIMARY KEY (id)
);

INSERT INTO vulnerabilities (id, name, endpoint) VALUES
(1, 'SQL Injection', '/bank/login'),
(2, 'IDOR - Transactions', '/transactions/:userId'),
(3, 'IDOR - Account', '/account/:userId'),
(4, 'IDOR - Balance', '/balance/:userId'),
(5, 'IDOR - Loans', '/loans/:userId'),
(6, 'IDOR - Support', '/support/:userId'),
(7, 'Unauth - Payee Add', '/payees'),
(8, 'Unauth - Transfer', '/transfer'),
(9, 'Delete Payee IDOR', '/payees/:id'),
(10, 'Forced Browsing', '/admin'),
(11, 'Insecure Headers', '/*'),
(12, 'Mass Assignment', '/account/update'),
(13, 'Missing Auth Check', '/notifications/:userId'),
(14, 'Path Traversal', '/documents'),
(15, 'Profile Data Leak', '/profile/:userId'),
(16, 'Reflected XSS', '/search'),
(17, 'Reflected XSS 2', '/feedback'),
(18, 'Secret Leak', '/config'),
(19, 'Sensitive Param', '/detail?user=1&secret=abc'),
(20, 'Debug Endpoint', '/debug')
ON DUPLICATE KEY UPDATE
  name = VALUES(name),
  endpoint = VALUES(endpoint);

CREATE TABLE accounts (
  id INT NOT NULL AUTO_INCREMENT,
  user_id INT,
  balance INT DEFAULT 1000,
  account_number VARCHAR(20),
  ifsc VARCHAR(20),
  account_type VARCHAR(20),
  branch VARCHAR(50),
  PRIMARY KEY (id)
);

CREATE TABLE activity (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id INT NOT NULL,
  action TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY (user_id)
);

CREATE TABLE flags (
  id INT NOT NULL AUTO_INCREMENT,
  user_id INT,
  type TEXT,
  flag TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id)
);

CREATE TABLE loan_repayments (
  id INT NOT NULL AUTO_INCREMENT,
  loan_id INT NOT NULL,
  user_id INT NOT NULL,
  amount INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id)
);

CREATE TABLE loans (
  id INT NOT NULL AUTO_INCREMENT,
  user_id INT NOT NULL,
  amount INT NOT NULL,
  purpose VARCHAR(200),
  status VARCHAR(20) DEFAULT 'pending',
  approved_by INT,
  disbursed TINYINT(1) DEFAULT 0,
  outstanding INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id)
);

CREATE TABLE logs (
  id INT NOT NULL AUTO_INCREMENT,
  message TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id)
);

CREATE TABLE sessions (
  id INT NOT NULL AUTO_INCREMENT,
  user_id INT,
  token VARCHAR(100),
  PRIMARY KEY (id)
);

CREATE TABLE transactions (
  id INT NOT NULL AUTO_INCREMENT,
  user_id INT,
  amount INT,
  type VARCHAR(20),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id)
);

CREATE TABLE transfers (
  id INT NOT NULL AUTO_INCREMENT,
  from_user INT,
  to_user INT,
  amount INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id)
);

CREATE TABLE users (
  id INT NOT NULL AUTO_INCREMENT,
  username VARCHAR(50),
  password VARCHAR(50),
  flag VARCHAR(100),
  PRIMARY KEY (id)
);

-- Realistic fake bank users (kept separate from owasp_app auth users)
INSERT IGNORE INTO users (id, username, password, flag) VALUES
(1, 'ava.thompson', 'Ava@2026', NULL),
(2, 'liam.carter', 'Liam@2026', NULL),
(3, 'noah.bennett', 'Noah@2026', NULL),
(4, 'mia.patel', 'Mia@2026', NULL),
(5, 'oliver.reed', 'Oliver@2026', NULL);

-- Test data for loans
INSERT IGNORE INTO loans (id, user_id, amount, purpose, status, outstanding) VALUES
(1, 1, 50000, 'Car Purchase', 'approved', 40000),
(2, 2, 100000, 'Home Renovation', 'approved', 80000),
(3, 1, 25000, 'Education', 'pending', 25000),
(4, 2, 75000, 'Business Startup', 'approved', 50000),
(5, 3, 30000, 'Personal', 'approved', 15000),
(6, 4, 60000, 'Vehicle Loan', 'approved', 45000),
(7, 5, 120000, 'Home Loan', 'approved', 100000),
(8, 4, 35000, 'Education Loan', 'pending', 35000);

-- Test data for support tickets
INSERT IGNORE INTO support_tickets (id, user_id, subject, message, status) VALUES
(1, 1, 'Loan Inquiry', 'I want to know about loan options', 'open'),
(2, 2, 'Card Replacement', 'My card is lost', 'open'),
(3, 1, 'Balance Issue', 'Balance seems incorrect', 'open'),
(4, 2, 'Transfer Failed', 'My recent transfer failed', 'open'),
(5, 3, 'Account Access', 'Cannot access my account', 'resolved'),
(6, 4, 'Loan Status', 'Can I get information about my loan status?', 'open'),
(7, 5, 'Transaction Query', 'I see an unauthorized transaction', 'open'),
(8, 4, 'Account Help', 'Help with my account settings', 'open');

-- Test data for payees
INSERT IGNORE INTO payees (id, user_id, name, account_no, ifsc, nickname) VALUES
(1, 1, 'John Doe', '1234567890123', 'SBIN0001', 'JD Account'),
(2, 2, 'Jane Smith', '9876543210987', 'HDFC001', 'JS Main'),
(3, 1, 'Bob Wilson', '5555555555555', 'ICIC0001', 'Bob Personal'),
(4, 2, 'Alice Johnson', '1111111111111', 'AXIS0001', 'AJ Work'),
(5, 4, 'Rina Patel', '2222222222222', 'SBIN0001', 'Family'),
(6, 5, 'Ethan Reed', '3333333333333', 'HDFC001', 'Sibling'),
(7, 5, 'Northwind Payroll', '4444444444444', 'ICIC0001', 'Work');