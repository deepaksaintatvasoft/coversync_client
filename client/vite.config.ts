import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      "@assets": path.resolve(__dirname, "../attached_assets"),
      "@shared": path.resolve(__dirname, "./src/shared"),
    },
  },
  server: {
    host: "0.0.0.0",
    port: 5000,
    allowedHosts: [
      "localhost",
      ".replit.dev",
      ".replit.app", 
      ".pike.replit.dev",
      /^.*\.pike\.replit\.dev$/,
      /^.*\.replit\.dev$/,
      /^.*\.replit\.app$/
    ],
    hmr: {
      port: 443,
      clientPort: 443,
    },
  },
  build: {
    outDir: "../dist",
  },
});