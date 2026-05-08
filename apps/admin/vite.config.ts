import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path"
import tailwindcss from "@tailwindcss/vite"

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  base: "/admin/",
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    // Proxy API requests to the backend in development
    // This makes frontend and API same-origin, enabling SameSite=Lax cookies
    proxy: {
      "/api": {
        target: "http://localhost:5010",
        changeOrigin: true,
        // Forward cookies
        cookieDomainRewrite: "localhost",
      },
    },
  },
});
