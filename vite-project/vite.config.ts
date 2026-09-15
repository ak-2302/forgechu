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
      manifest: {
        name: "とりあえずメモ",
        /*icons: [
          {
            sizes: "192x192",
            src: "icon-192x192.png",
            type: "image/png",
          },
          {
            sizes: "512x512",
            src: "icon-512x512.png",
            type: "image/png",
          },
          {
            sizes: "512x512",
            src: "icon-512x512.png",
            type: "image/png",
            purpose: "maskable",
          },
        ],*/
      },
    }),
  ],
});
