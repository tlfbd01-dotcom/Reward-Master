import app from "./app";
import { logger } from "./lib/logger";
import { syncAllEnabledNetworks } from "./services/offer-sync";

const rawPort = process.env["PORT"];

if (!rawPort) {
  throw new Error(
    "PORT environment variable is required but was not provided.",
  );
}

const port = Number(rawPort);

if (Number.isNaN(port) || port <= 0) {
  throw new Error(`Invalid PORT value: "${rawPort}"`);
}

app.listen(port, (err) => {
  if (err) {
    logger.error({ err }, "Error listening on port");
    process.exit(1);
  }

  logger.info({ port }, "Server listening");

  // Auto-sync enabled networks every 15 minutes
  const SYNC_INTERVAL_MS = 15 * 60 * 1000;
  const runSync = async () => {
    try {
      await syncAllEnabledNetworks();
    } catch (err) {
      logger.error({ err }, "Offer auto-sync failed");
    }
  };
  // First sync 30 s after boot, then every 15 min
  setTimeout(() => {
    void runSync();
    setInterval(() => void runSync(), SYNC_INTERVAL_MS);
  }, 30_000);
});
