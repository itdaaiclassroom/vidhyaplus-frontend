import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";



// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  
  server: {
    host: "::",
    port: 8080,
    hmr: {
      overlay: false,
    },
  },
  plugins: [react()].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
      "pptxviewjs": path.resolve(__dirname, "node_modules/pptxviewjs/dist/PptxViewJS.es.js"),
    },
  },
  optimizeDeps: {
    include: ["pptxviewjs", "jszip"],
  },
  build: {
    outDir: path.resolve(__dirname, "dist"),
    emptyOutDir: true,
  },
  base: "/",
}));
