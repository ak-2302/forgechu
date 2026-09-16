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
        name: "ぎもんNOTE",
        short_name: "ぎもんNOTE",
        description: "調べたいことを気軽にメモしてリマインダー",
        icons: [
          {
            sizes: "192x192",
            src: "/favicon_192.png",
            type: "image/png",
          },
        ],
        screenshots: [
          {
            src: "/screenshot_1280_720_test.png",
            sizes: "1280x720",
            type: "image/png",
            form_factor: "wide",
          },
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
