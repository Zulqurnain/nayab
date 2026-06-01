/**
 * Layer 6: PM2 ecosystem config — cluster mode, 2 instances, memory limits, log paths.
 * Reads secrets from .env.local so they don't need to be in this file.
 */
const fs = require("fs");
const path = require("path");

// Parse .env.local into an object (simple key=value parser)
function loadEnvFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, "utf-8");
    const env = {};
    for (const line of content.split("\n")) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const idx = trimmed.indexOf("=");
      if (idx < 0) continue;
      const key = trimmed.slice(0, idx).trim();
      const val = trimmed.slice(idx + 1).trim();
      env[key] = val;
    }
    return env;
  } catch {
    return {};
  }
}

const localEnv = loadEnvFile(path.join(__dirname, ".env.local"));

module.exports = {
  apps: [{
    name: "nayab",
    script: ".next/standalone/server.js",
    cwd: "/root/nayab",
    instances: 2,               // Layer 11: 2 workers matching nginx upstream
    exec_mode: "cluster",       // Layer 6: cluster mode for zero-downtime reloads
    max_memory_restart: "400M", // Layer 6: restart if process exceeds 400MB
    autorestart: true,
    max_restarts: 10,
    restart_delay: 3000,
    // Layer 12: Log file paths
    out_file: "/var/log/nayab/pm2-out.log",
    error_file: "/var/log/nayab/pm2-error.log",
    merge_logs: true,           // Merge logs from all cluster instances
    log_date_format: "YYYY-MM-DD HH:mm:ss Z",
    env: {
      NODE_ENV: "production",
      PORT: "3002",
      HOSTNAME: "127.0.0.1",
      OFFLLAMA_URL: "http://127.0.0.1:8080",
      OFFLLAMA_API_KEY: "",
      DB_PATH: "/var/data/nayab.db",
      LOG_DIR: "/var/log/nayab",
      // Secrets loaded from .env.local (not committed to git)
      ...localEnv,
    },
  }],
};
