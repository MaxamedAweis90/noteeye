import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig, type Plugin } from "vite";
import { VitePWA } from "vite-plugin-pwa";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/**
 * Custom Vite plugin to strip any static manifest <link> tag injected into index.html.
 * This guarantees that the marketing domain (noteeye.vercel.app) never advertises a manifest,
 * and PWA manifest linkage is dynamically activated strictly on the app workspace (app-noteeye.vercel.app).
 */
function stripStaticPWAManifestPlugin(): Plugin {
  return {
    name: "strip-static-pwa-manifest",
    enforce: "post",
    transformIndexHtml: {
      order: "post",
      handler(html) {
        return html.replace(/<link rel="manifest"[^>]*>\s*/gi, "");
      },
    },
    closeBundle() {
      const distIndexPath = path.resolve(__dirname, "dist/index.html");
      if (fs.existsSync(distIndexPath)) {
        const content = fs.readFileSync(distIndexPath, "utf-8");
        const cleaned = content.replace(/<link rel="manifest"[^>]*>\s*/gi, "");
        fs.writeFileSync(distIndexPath, cleaned, "utf-8");
      }
    },
  };
}

// https://vite.dev/config/
export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  plugins: [
    tailwindcss(),
    react(),
    VitePWA({
      registerType: "autoUpdate",
      injectRegister: null, // Managed conditionally in src/pwa/registerSW.ts
      manifestFilename: "manifest.webmanifest",
      devOptions: {
        enabled: true,
      },
      includeAssets: [
        "favicon.ico",
        "favicon-16x16.png",
        "favicon-32x32.png",
        "apple-touch-icon.png",
        "pwa-192x192.png",
        "pwa-512x512.png",
        "pwa-512x512-maskable.png",
      ],
      manifest: {
        name: "Noteeye — Calm Notes & Ideas",
        short_name: "Noteeye",
        description: "Minimalist productivity workspace for notes, checklists, and ideas.",
        start_url: "/",
        scope: "/",
        display: "standalone",
        background_color: "#080C15",
        theme_color: "#080C15",
        orientation: "portrait",
        icons: [
          {
            src: "/pwa-192x192.png",
            sizes: "192x192",
            type: "image/png",
            purpose: "any",
          },
          {
            src: "/pwa-512x512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "any",
          },
          {
            src: "/pwa-512x512-maskable.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "maskable",
          },
        ],
      },
      workbox: {
        maximumFileSizeToCacheInBytes: 4 * 1024 * 1024,
        globPatterns: ["**/*.{js,css,html,ico,png,svg,webp}"],
        runtimeCaching: [
          {
            // Cache Google Fonts stylesheets
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: "StaleWhileRevalidate",
            options: {
              cacheName: "google-fonts-stylesheets",
            },
          },
          {
            // Cache Google Fonts webfonts (Outfit, Sora, Caveat, Inter, Material Symbols)
            urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
            handler: "CacheFirst",
            options: {
              cacheName: "google-fonts-webfonts",
              expiration: {
                maxEntries: 30,
                maxAgeSeconds: 60 * 60 * 24 * 30, // 30 Days
              },
              cacheableResponse: {
                statuses: [0, 200],
              },
            },
          },
          {
            // Cache static assets (.js, .css, .svg, .png, etc.)
            urlPattern: /\.(?:js|css|svg|png|jpg|jpeg|webp|gif|ico)$/i,
            handler: "StaleWhileRevalidate",
            options: {
              cacheName: "static-assets-cache",
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 60 * 60 * 24 * 7, // 7 Days
              },
            },
          },
          {
            // Network-first strategy for dynamic note and folder API requests (/api/*)
            urlPattern: /\/api\/.*/i,
            handler: "NetworkFirst",
            options: {
              cacheName: "api-cache",
              networkTimeoutSeconds: 5,
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 60 * 60 * 24, // 24 Hours
              },
              cacheableResponse: {
                statuses: [0, 200],
              },
            },
          },
        ],
      },
    }),
    stripStaticPWAManifestPlugin(),
  ],
  server: {
    port: 5173,
    strictPort: true,
  },
});
