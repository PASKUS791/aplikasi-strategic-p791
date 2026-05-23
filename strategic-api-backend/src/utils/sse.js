/*
 * Team DUKUN PASKUS 791 - SSE Helpers
 */

const clients = new Set();

function registerEventClient(res) {
  res.writeHead(200, {
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache, no-transform",
    Connection: "keep-alive",
  });
  res.write(": connected\n\n");
  clients.add(res);
}

function closeEventClient(res) {
  clients.delete(res);
}

function broadcastResourceEvent(resource) {
  const payload = JSON.stringify({
    resource,
    updatedAt: new Date().toISOString(),
  });

  for (const client of clients) {
    client.write(`data: ${payload}\n\n`);
  }
}

setInterval(() => {
  for (const client of clients) {
    client.write(": ping\n\n");
  }
}, 25000).unref();

module.exports = {
  broadcastResourceEvent,
  closeEventClient,
  registerEventClient,
};
