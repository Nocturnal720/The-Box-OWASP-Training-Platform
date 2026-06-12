# Vulnerability Persistence Testing Guide

## What's New
✅ Vulnerabilities now lock permanently after first exploitation
✅ Locked state persists across backend restarts
✅ Once a user completes all 8 assigned vulns, they're locked for that session
✅ Next login will assign a fresh set of 8 new vulnerabilities

---

## Test 1: Verify Single Exploit Persists

### Before Restart
1. Login: `testacc` / `123456`
2. Go to FakeBank page
3. Open Console (F12)
4. Try **SQLi** (endpoint #20):
   ```javascript
   fetch('http://localhost:5000/bank/login', {
     method: 'POST',
     headers: { 'Content-Type': 'application/json' },
     body: JSON.stringify({ username: "admin' OR '1'='1", password: "anything" })
   }).then(r => r.json()).then(d => console.log(d))
   ```
5. **Expect**: Popup appears, flag generated, added to Flags page ✅

### After Backend Restart
1. **Restart backend**: `taskkill /IM node.exe /F; .\start.bat` (or use start.bat directly)
2. Refresh browser (http://localhost:3001/fakebank)
3. Try **same SQLi again** in console
4. **Expected behavior**:
   - ❌ NO popup appears
   - ❌ NO new flag generated
   - ✅ Same flag from before still displays on Flags page
   - ✅ Response returns normal error message

---

## Test 2: Verify Multiple Exploits Lock Permanently

### Setup
1. Fresh login as `testacc`
2. Exploit different vulnerabilities:
   - **Endpoint #1** (IDOR_ACCOUNT): `/account/2`
   - **Endpoint #2** (IDOR_TRANSACTIONS): `/transactions/2`
   - **Endpoint #3** (IDOR_LOAN): `/loan/9`

### Each should:
1. **First time**: Popup appears, flag added
2. **Second time in same session**: Still shows popup (in-memory dedup)
3. **After backend restart**: No popup, safe response returned

### Console test template:
```javascript
// Replace ENDPOINT and ID
fetch('http://localhost:5000/ENDPOINT/ID', {
  headers: { 
    'Authorization': localStorage.getItem('token'),
    'X-Assigned-Vulns': localStorage.getItem('assignedVulns')
  }
}).then(r => r.json()).then(d => console.log(d))
```

---

## Test 3: Check Database State

### View which exploits are locked
```bash
# SSH to MySQL
mysql -u root -p security_lab

# Check which vulnerabilities are complete for user
SELECT uv.vuln_id, v.name, uv.is_completed, uv.completed_at
FROM user_vulnerabilities uv
JOIN vulnerabilities v ON uv.vuln_id = v.id
WHERE uv.user_id = (SELECT id FROM users WHERE username = 'testacc')
ORDER BY uv.completed_at DESC;
```

### Expected output (after exploiting 3 vulns):
```
vuln_id | name                    | is_completed | completed_at
--------|-------------------------|--------------|---------------------
14      | IDOR Transactions       | 1            | 2025-04-15 10:23:45
11      | IDOR Account            | 1            | 2025-04-15 10:22:10
13      | IDOR Loan               | 1            | 2025-04-15 10:20:55
4       | IDOR Balance            | 0            | NULL
```

---

## Test 4: Complete All 8 & Get New Challenge

### After exploiting all 8 assigned vulnerabilities:
1. **Current state**: All 8 have `is_completed = 1`
2. **Logout** and **Login again**
3. **Backend logic**: 
   - Detects all 8 completed
   - Creates `assignment_session = 2`
   - Assigns 8 NEW random vulnerabilities
4. **Result**: Fresh challenge with different vulnerabilities!

---

## Troubleshooting

**Popup still appears after restart?**
- Clear browser cache/localStorage
- Logout and login again
- Check browser console for errors

**Flag appears twice in Flags page?**
- Database insertion has UNIQUE constraint on (user_id, type, vuln_id)
- Should be prevented automatically

**Backend won't start?**
- Check for port conflicts: `netstat -ano | findstr 5000`
- Check MySQL connection
- Review terminal output for errors

**Session number mismatch?**
- Each user has sessions (assignment_session = 1, 2, 3...)
- When you complete session 1, session 2 starts automatically
- Vulnerabilities only lock within their session

---

## Success Criteria ✅

- [ ] SQLi exploitable once, then locked
- [ ] IDOR exploits show popup first time, no popup after restart
- [ ] Flags don't duplicate in FLAGS page
- [ ] Database shows `is_completed = 1` for exploited vulns
- [ ] After completing all 8, next login has new assignments
- [ ] Console shows `🔐 [TYPE] User X already exploited - skipping` for locked vulns

