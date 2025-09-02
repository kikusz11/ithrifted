// vite.config.ts

import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { viteStaticCopy } from "vite-plugin-static-copy";
import path from "path";
import tailwindcss from "@tailwindcss/vite";
import tsconfigPaths from "vite-tsconfig-paths";

// A teljes konfigurációt a defineConfig-en belülre helyezzük
export default defineConfig({
  mode: "development",
  build: {
    outDir: "dist",
    emptyOutDir: true,
    sourcemap: true,
    minify: false,
    cssMinify: false,
    terserOptions: { compress: false, mangle: false },
  },
  define: { "process.env.NODE_ENV": "'development'" },
  esbuild: { jsx: "automatic", jsxImportSource: "react" },
  plugins: [
    react(),
    viteStaticCopy({
      targets: [
        { src: "./assets/*", dest: "assets" },
        {
          src: "./public/assets/{*,}",
          dest: path.join("dist", "public/assets"),
        },
        { src: "src/assets/*", dest: path.join("dist", "assets") },
      ],
      silent: true,
    }),
    tailwindcss(),
    // A plugineket közvetlenül a tömbbe tesszük
    tsconfigPaths({ projects: ['./tsconfig.app.json'] }),
  ],
  // Az üres resolve: {} objektum felesleges, a tsconfigPaths kezeli az útvonalakat
});