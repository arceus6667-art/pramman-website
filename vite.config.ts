import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { resolve } from "node:path";
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  return {
    plugins: [react(), tailwindcss()],
    server: {
      allowedHosts: ["terminal.local"],
      proxy: { "/api": "http://127.0.0.1:3001" },
      fs: {
        deny: [
          ".env",
          ".env.*",
          "**/.git/**",
          "**/*.sqlite*",
          "**/*.db*",
          "**/data/**",
          "**/uploads/**",
          "**/backend/**",
          `${resolve(env.DATA_DIR || "data")}/**`,
          `${resolve(env.UPLOADS_DIR || "uploads")}/**`,
        ],
      },
    },
  };
});
