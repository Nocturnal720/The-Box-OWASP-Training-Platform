-- OWASP App Database Setup
-- This creates the users table for the main authentication system
-- Matches the actual owasp_app database schema

CREATE DATABASE IF NOT EXISTS owasp_app;
USE owasp_app;

-- Users table for authentication
CREATE TABLE IF NOT EXISTS users (
  user_id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(50) NOT NULL UNIQUE,
  email VARCHAR(100) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_username (username),
  INDEX idx_email (email)
);

-- Sessions table for tracking active sessions
CREATE TABLE IF NOT EXISTS sessions (
  id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  token VARCHAR(100) NOT NULL UNIQUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
  INDEX idx_user_id (user_id),
  INDEX idx_token (token)
);

-- Activity log table
CREATE TABLE IF NOT EXISTS activity (
  id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  action VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
  INDEX idx_user_id (user_id),
  INDEX idx_created_at (created_at)
);

-- Notifications table
CREATE TABLE IF NOT EXISTS notifications (
  id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  message TEXT NOT NULL,
  read_status TINYINT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
  INDEX idx_user_id (user_id)
);

-- Flags table (for tracking found vulnerabilities)
CREATE TABLE IF NOT EXISTS flags (
  id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  type VARCHAR(100) NOT NULL,
  flag VARCHAR(255) NOT NULL,
  found_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
  UNIQUE KEY unique_user_flag (user_id, type),
  INDEX idx_user_id (user_id)
);

-- Test users for development/testing
INSERT IGNORE INTO users (username, email, password) VALUES
('admin', 'admin@owasp.local', 'admin123'),
('user1', 'user1@owasp.local', 'password1'),
('user2', 'user2@owasp.local', 'password2'),
('testuser', 'test@owasp.local', 'testpass123'),
('kenobi', 'kenobi@owasp.local', 'pass123');