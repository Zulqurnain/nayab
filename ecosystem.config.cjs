module.exports = {
  apps: [
    {
      name: "nayab",
      script: "/root/nayab/.next/standalone/server.js",
      cwd: "/root/nayab",
      exec_mode: "fork",
      instances: 1,
      uid: "webapp",
      gid: "webapp",
      env: {
        HOME: "/home/webapp",
        PORT: "3002",
        HOSTNAME: "127.0.0.1",
        NODE_ENV: "production",
      },
    },
    {
      name: "nayab-collab",
      script: "node scripts/collab-server.mjs",
      cwd: "/root/nayab",
      exec_mode: "fork",
      instances: 1,
      uid: "webapp",
      gid: "webapp",
      env: {
        HOME: "/home/webapp",
        PORT: "4000",
        HOSTNAME: "127.0.0.1",
        NODE_ENV: "production",
        COLLAB_PORT: "4000",
      },
    },
  ],
};
