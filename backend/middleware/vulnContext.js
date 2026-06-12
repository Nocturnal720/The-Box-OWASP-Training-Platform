const { runWithRequestContext } = require("../ModHelper/vulnState");

// Middleware to initialize vulnerability context for each request
module.exports = (req, res, next) => {
  const tokenScope =
    req.headers["x-lab-token"] ||
    req.headers["X-Lab-Token"] ||
    req.headers.authorization ||
    null;
  const userHeaderScope = req.headers["x-user-id"] ? `uid:${req.headers["x-user-id"]}` : null;
  const scope = tokenScope || userHeaderScope;

  runWithRequestContext({ scope }, () => {
    // Initialize vulnerability info storage on response locals
    res.locals.vuln_info = null;
    
    // Parse X-Assigned-Vulns header to determine which vulns the user can trigger
    req.assignedVulns = [];
    const vulnHeader = req.headers['x-assigned-vulns'];
    if (vulnHeader) {
      try {
        req.assignedVulns = JSON.parse(vulnHeader);
      } catch (e) {
        // Silently ignore malformed headers
      }
    }
    
    next();
  });
};
