import { loadConfig } from "./config.js";
import {
  openDatabase,
  purgeExpired,
  removeOrphans,
  purgeBackups,
} from "./database.js";
import { createApp } from "./app.js";
const config = loadConfig();
const db = openDatabase(config);
purgeBackups(config);
purgeExpired(db, config);
removeOrphans(db, config);
db.prepare("DELETE FROM sessions WHERE expires<?").run(Date.now());
const timer = setInterval(() => {
  try {
    purgeBackups(config);
    purgeExpired(db, config);
    removeOrphans(db, config);
    db.prepare("DELETE FROM sessions WHERE expires<?").run(Date.now());
  } catch {
    console.error(
      "Scheduled maintenance failed. Check filesystem permissions and disk space.",
    );
  }
}, 3600000);
timer.unref();
const app = createApp(config, db);
const server = app.listen(config.port, config.host, () =>
  console.log(`PFSA local server: http://${config.host}:${config.port}`),
);
function stop() {
  clearInterval(timer);
  server.close(() => {
    db.close();
    process.exit(0);
  });
  setTimeout(() => process.exit(1), 10000).unref();
}
process.on("SIGINT", stop);
process.on("SIGTERM", stop);
