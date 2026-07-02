import { Server } from "@hocuspocus/server";
import { Logger } from "../src/lib/logger";

const logger = new Logger("collab-server");

const server = Server.configure({
  port: Number(process.env.COLLAB_PORT ?? 4000),
  hostname: process.env.COLLAB_HOST ?? "0.0.0.0",

  async onAuthenticate(data) {
    // Token validation for Nayab users. For now accept token-only; extend
    // to PocketBase user lookup once API keys are wired.
    const token = data.token;
    if (!token) {
      logger.warn("collab_auth_rejected", { token: "missing" });
      throw new Error("Missing auth token");
    }
    logger.info("collab_auth_accepted", { hasToken: !!token });
    return;
  },

  async onStoreDocument({ documentName, update: binaryUpdate }) {
    // Persist Yjs binary update to SQLite via PocketBase
    const PB = process.env.POCKETBASE_URL ?? "http://127.0.0.1:8090";
    const PB_TOKEN = process.env.PB_ADMIN_TOKEN;
    if (!PB_TOKEN) return;

    // Store as base64 to avoid binary JSON issues
    const buf = Buffer.from(binaryUpdate).toString("base64");
    await fetch(`${PB}/api/collections/ny_docs/records`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: PB_TOKEN,
      },
      body: JSON.stringify({
        id: documentName,
        payload: buf,
        updatedAt: new Date().toISOString(),
      }),
    }).catch((err) => logger.error("persist_failed", { error: err.message }));
  },

  async onLoadDocument({ documentName }) {
    const PB = process.env.POCKETBASE_URL ?? "http://127.0.0.1:8090";
    const PB_TOKEN = process.env.PB_ADMIN_TOKEN;
    if (!PB_TOKEN) return;

    const res = await fetch(
      `${PB}/api/collections/ny_docs/records/${encodeURIComponent(documentName)}`,
      {
        headers: { Authorization: PB_TOKEN },
      }
    );
    if (!res.ok) return;
    const doc = (await res.json()) as { payload?: string };
    if (!doc?.payload) return;
    return Buffer.from(doc.payload, "base64");
  },

  async onDisconnect({ documentName }) {
    logger.info("collab_disconnect", { documentName });
  },
});

server.listen().then(() => {
  logger.info("collab_server_started", {
    port: Number(process.env.COLLAB_PORT ?? 4000),
  });
});
