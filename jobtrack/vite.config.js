import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
	server: {
		host: "0.0.0.0",
		port: 3000,
	},


  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["icon-192.png", "icon-512.png"],
      manifest: {
        name: "JobTrack",
        short_name: "JobTrack",
        description: "Job Application & Career Outreach Tracker",
        theme_color: "#12211D",
        background_color: "#F6F7F5",
        display: "standalone",
        start_url: "/",
        icons: [
          { src: "icon-192.png", sizes: "192x192", type: "image/png" },
          { src: "icon-512.png", sizes: "512x512", type: "image/png" }
        ]
      },
      workbox: {
        // App shell + assets are cached for offline use. Data itself lives in
        // Supabase, so offline mode lets you open the app and browse the last
        // synced data, but writes need a connection to reach the database.
        globPatterns: ["**/*.{js,css,html,png,svg,ico}"]
      }
    })
  ]
});
