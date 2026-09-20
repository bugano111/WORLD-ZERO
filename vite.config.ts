import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
export default defineConfig({
  plugins: [react(), tailwindcss()],
  base: "/WORLD-ZERO/",
  build: {
    rollupOptions: {
      output: {
        entryFileNames: "assets/world-zero-r43-[hash].js",
        chunkFileNames: "assets/world-zero-r43-[hash].js",
        assetFileNames: "assets/world-zero-r43-[hash][extname]"
      }
    }
  }
});
