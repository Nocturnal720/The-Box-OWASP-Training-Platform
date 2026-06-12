/**
 * MINIMAL Vulnerability Randomization Helper
 * 
 * Simple check: is this vulnerability assigned to this user?
 * 
 * Usage:
 *   const assigned = req.assignedVulns || [];
 *   if (isVulnerable(req, "SQLI")) {
 *     // existing vulnerable code
 *   } else {
 *     // safe fallback
 *   }
 */

const vulnMap = {
  "FORCED_BROWSING": 1,
  "DEBUG": 2,
  "SECRET_LEAK": 3,
  "IDOR_BALANCE": 4,
  "PROFILE_LEAK": 5,
  "REFLECTED_XSS_1": 6,
  "REFLECTED_XSS_2": 7,
  "INSECURE_HEADERS": 8,
  "PATH_TRAVERSAL": 9,
  "IDOR_TRANSACTIONS": 10,
  "IDOR_ACCOUNT": 11,
  "IDOR_DETAILS": 12,
  "IDOR_LOAN": 13,
  "IDOR_SUPPORT": 14,
  "DELETE_PAYEE_IDOR": 15,
  "MISSING_AUTH": 16,
  "MASS_ASSIGNMENT": 17,
  "UNAUTH_TRANSFER": 18,
  "UNAUTH_PAYEE": 19,
  "SQLI": 20
};

/**
 * Check if vulnerability is assigned to user
 * req.assignedVulns is set by middleware after parsing x-assigned-vulns header
 */
function isVulnerable(req, vulnName) {
  const assigned = req.assignedVulns || [];
  const vulnId = vulnMap[vulnName.toUpperCase()];
  
  if (!vulnId) {
    console.warn(`⚠️  Unknown vuln: ${vulnName}`);
    return false;
  }
  
  return assigned.includes(vulnId);
}

/**
 * Middleware: Parse x-assigned-vulns header and attach to request
 */
function vulnMiddleware(req, res, next) {
  req.assignedVulns = [];
  
  if (req.headers['x-assigned-vulns']) {
    try {
      req.assignedVulns = JSON.parse(req.headers['x-assigned-vulns']);
    } catch (e) {
      console.error("Error parsing x-assigned-vulns header:", e);
    }
  }
  
  next();
}

module.exports = { isVulnerable, vulnMiddleware, vulnMap };
