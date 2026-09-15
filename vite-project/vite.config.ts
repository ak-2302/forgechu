import react, { reactCompilerPreset } from '@vitejs/plugin-react'
import babel from '@rolldown/plugin-babel'
import { defineConfig } from 'vite'
import { VitePWA } from "vite-plugin-pwa";


// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    babel({ presets: [reactCompilerPreset()] }),
    VitePWA({
      devOptions: { enabled: true },
      registerType: "autoUpdate",
      manifest: {
        name: "とりあえずメモ",
        icons: [
          {
            sizes: "192x192",
            src: "/favicon_192_test.png",
            type: "image/png",
          },
        ],
        screenshots: [
          {
            sizes: "720x1280",
            src: "/screenshot_720_1280_test.png",
            type: "image/png",
          },
        ],
      },
    }),
  ],
});
