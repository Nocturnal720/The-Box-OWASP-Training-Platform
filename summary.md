# Project Summary: OWASP Security Lab

## Overview
This is an **interactive security training application** called **"FakeBank"** that teaches OWASP (Open Web Application Security Project) vulnerabilities through hands-on exploitation and remediation. It's designed as a learning platform where users can practice identifying and fixing real security vulnerabilities in a safe, educational environment.

---

## Tech Stack

**Frontend:**
- React 19 with React Router for navigation
- Supabase for authentication integration
- Real-time notifications via SSE (Server-Sent Events)
- Styling with custom CSS and theme system

**Backend:**
- Node.js with Express.js framework
- MySQL databases (authentication + vulnerable data separation)
- Custom middleware for vulnerability management

**Architecture:**
- Dual database setup:
  - `owasp_app`: User authentication and session management
  - `security_lab`: FakeBank simulated banking data + vulnerability tracking

---

## Core Features

### 1. **20 Vulnerability Modules** (VulnMods)
The app demonstrates 20 different OWASP Top 10 vulnerabilities across categories:

**Broken Access Control (IDORs):**
- Account details access
- Transaction history viewing
- Loan records viewing
- Support ticket access
- Account balance exposure

**Authorization Bypass:**
- Missing authentication checks
- Mass assignment (privilege escalation)
- Unauthorized transfers
- Unauthorized payee additions
- Payee deletion without authorization

**Information Disclosure:**
- Profile data leaks
- Secret/API key exposure
- Debug mode information
- Sensitive GET parameters
- Admin panel access

**Injection Attacks:**
- Path traversal
- SQL Injection
- Reflected XSS (2 variants)

**Security Misconfiguration:**
- Insecure security headers

### 2. **FakeBank Interface**
Realistic banking UI with:
- Dashboard with balance and transaction history
- Transfer money functionality
- Loan management
- Payee management
- Support ticket system
- Transaction scheduling

### 3. **Dynamic Vulnerability Assignment**
- Each user receives **8 random vulnerabilities** per session
- Persistence: If vulnerabilities aren't completed, the same set is assigned on next login
- Tracked in database via `user_vulnerabilities` table

### 4. **Exploitation Prevention System** (Recent Fix)
- **Single exploitation per vulnerability**: Once a user exploits a vulnerability, it's disabled for the rest of the session
- **Two-layer protection**:
  - In-memory lock via `disableImmediate()` (synchronous, prevents race conditions)
  - Database persistence via `is_completed` flag (survives backend restarts)
- **Root cause fixed**: Async race condition where concurrent requests could bypass protection

### 5. **Real-time Notifications**
- SSE-based broadcasting to notify users of successful exploitations
- Popup notifications with vulnerability names and captured flags
- Success dialogs confirming exploitation

---

## How It Works

1. **User Login** → System assigns 8 random OWASP vulnerabilities
2. **User Navigates FakeBank** → Interacts with vulnerable features
3. **Exploitation** → User discovers and exploits assigned vulnerabilities via:
   - Direct API calls (console commands provided)
   - Or through the UI vulnerabilities expose
4. **Flag Captured** → System validates exploitation, generates flag, broadcasts success
5. **Vulnerability Disabled** → Same vulnerability can't be exploited again in session
6. **Learning** → Users can view vulnerability info & mitigation strategies

---

## Key Technical Implementations

**Vulnerability Randomizer:**
- `vulnRandomizer.js`: Assigns 8 random vulns per user, tracks completion

**Vulnerability Modules Architecture:**
- Each VulnMod checks if it's enabled before executing
- Generates flags on successful exploitation
- Tracks completion in database
- Broadcasts via SSE to frontend

**Race Condition Fix** (Recent):
- Added `disableImmediate()` function for synchronous locking
- All VulnMods now check `!isDisabled(TYPE)` before generateFlag()
- Prevents multiple exploitations of same vulnerability in concurrent requests

---

## Project Structure

```
backend/
  ├── server.js (Express setup + authentication)
  ├── middleware/
  │   └── vulnContext.js
  ├── ModHelper/ (Helper utilities)
  │   ├── vulnRandomizer.js (Assign random vulns)
  │   ├── vulnState.js (Track enabled/disabled state)
  │   ├── generateFlag.js (Flag generation)
  │   ├── successBroadcaster.js (SSE notifications)
  │   └── userVulnerabilityManager.js (Database tracking)
  └── VulnMods/ (20 vulnerability implementations)

src/fakebank/ (React frontend)
  ├── pages/ (Dashboard, Transactions, Transfers, Loans, etc.)
  ├── services/bankApi.js (API communication)
  └── components/ (UI components, popups)
```

---

## Current Status
✅ **Fully Operational**
- All 20 VulnMods have correct syntax
- Race condition fix deployed across all modules
- Dual-layer protection ("single exploitation per session" + database persistence)
- Backend: Running on port 5000
- Frontend: Running on port 3001

**Ready for:**
- Student training and practice
- Vulnerability assessment exercises
- Security awareness education

---

## Testing
Pre-built console commands available in `CONSOLE_COMMANDS.md` for testing all 20 vulnerabilities with proper authentication headers.

**Quick Start:**
1. Login at http://localhost:3001/fakebank with: `testacc` / `123456`
2. Open browser DevTools (F12) → Console tab
3. Use commands from CONSOLE_COMMANDS.md to test vulnerabilities
4. Watch for popup notifications and flags captured

---

## Vulnerability List Reference

| # | Category | Vulnerability |
|---|----------|---------------|
| 1-5 | Broken Access Control | IDOR (Account, Transactions, Loan, Support, Balance) |
| 6-10 | Authorization Bypass | Auth Bypass, Mass Assignment, Transfers, Payee Management |
| 11-15 | Information Disclosure | Profile Leak, Secret Leak, Debug, Sensitive Params, Forced Browsing |
| 16-18 | Injection Attacks | Path Traversal, XSS (2 variants), SQL Injection |
| 19 | Security Misconfiguration | Insecure Headers |

---

## Database Schema Overview

**owasp_app** (Authentication):
- `users`: username, email, password
- `sessions`: user sessions and tokens
- `activity`: user activity logs
- `flags`: captured exploitations

**security_lab** (FakeBank):
- `users`: FakeBank user accounts
- `accounts`: account details
- `transactions`: transaction history
- `payees`: saved beneficiaries
- `loans`: loan records
- `support_tickets`: support inquiries
- `vulnerabilities`: 20 vulnerability definitions
- `user_vulnerabilities`: tracks per-user vulnerability assignments
- `user_sessions`: tracks exploitation rounds
