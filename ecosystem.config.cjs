module.exports = {
  apps: [{
    name: "nayab",
    script: ".next/standalone/server.js",
    cwd: "/root/nayab",
    instances: 1,
    autorestart: true,
    max_restarts: 10,
    restart_delay: 3000,
    env: {
      NODE_ENV: "production",
      PORT: "3002",
      HOSTNAME: "127.0.0.1",
      OFFLLAMA_URL: "http://127.0.0.1:8080",
      OFFLLAMA_API_KEY: "",
      NEXT_PUBLIC_APP_URL: "https://chat.zulqurnainj.com",
      // OPENAI_API_KEY, ANTHROPIC_API_KEY, GUMROAD_PRODUCT_ID — set these in .env.local on server
    },
  }],
};
