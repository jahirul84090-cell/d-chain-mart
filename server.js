process.env.LANG = "en_US.UTF-8";
process.env.LC_ALL = "en_US.UTF-8";
process.env.NODE_ENV = process.env.NODE_ENV || "production";

const http = require("http");
const next = require("next");

const dev = process.env.NODE_ENV !== "production";
const hostname = "0.0.0.0";
const port = process.env.PORT || 30000;

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

let server;

async function startServer() {
  try {
    await app.prepare();

    server = http.createServer(async (req, res) => {
      try {
        await handle(req, res);
      } catch (err) {
        console.error("Request error:", req.url, err);
        res.statusCode = 500;
        res.end("Internal Server Error");
      }
    });

    server.listen(port, hostname, () => {
      console.log(`✅ Server running at http://${hostname}:${port}`);
      console.log(`✅ NODE_ENV = ${process.env.NODE_ENV}`);
    });
  } catch (err) {
    console.error("❌ Failed to start server:", err);
    process.exit(1);
  }
}

startServer();

/**
 * Graceful shutdown
 * ❗ DO NOT disconnect Prisma on runtime errors
 */
function shutdown(signal) {
  console.log(`\n🛑 Received ${signal}, shutting down...`);

  if (server) {
    server.close(() => {
      console.log("✅ HTTP server closed");
      process.exit(0);
    });
  } else {
    process.exit(0);
  }
}

process.on("SIGTERM", shutdown);
process.on("SIGINT", shutdown);
