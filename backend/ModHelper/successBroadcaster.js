// Success event broadcaster for SSE
// Uses the same clients registry as vulnState to broadcast via /vuln-events

const { getClients } = require("./vulnState");

const broadcastSuccess = (successInfo) => {
  const clients = getClients();
  const payload = `data: ${JSON.stringify(successInfo)}\n\n`;
  for (const res of clients) {
    try { res.write(payload); } catch (e) { }
  }
};

module.exports = { broadcastSuccess };
