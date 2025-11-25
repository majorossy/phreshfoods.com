// vite.config.ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc'; // Using SWC for faster compilation
import { visualizer } from 'rollup-plugin-visualizer';
import { VitePWA } from 'vite-plugin-pwa';
import viteImagemin from 'vite-plugin-imagemin';
// If you chose the standard TypeScript template without SWC, it might be:
// import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  plugins: [
    react(),
    // Image optimization plugin - converts to WebP and optimizes other formats
    viteImagemin({
      gifsicle: {
        optimizationLevel: 7,
        interlaced: false,
      },
      mozjpeg: {
        quality: 85,
        progressive: true,
      },
      pngquant: {
        quality: [0.8, 0.9],
        speed: 4,
      },
      svgo: {
        plugins: [
          {
            name: 'removeViewBox',
            active: false,
          },
          {
            name: 'removeEmptyAttrs',
            active: false,
          },
        ],
      },
      webp: {
        quality: 85,
        method: 4, // 0-6, higher = slower but better compression
        lossless: false,
      },
    }),
    // Bundle analyzer - generates stats.html after build (only in analyze mode)
    mode === 'analyze' && visualizer({
      open: true, // Auto-open after build in analyze mode
      filename: 'dist/stats.html',
      gzipSize: true,
      brotliSize: true,
    }) as any,
    // PWA plugin for offline support and installability
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'images/**/*', 'robots.txt'],
      manifest: {
        name: 'Farm Stand Finder - Maine',
        short_name: 'Farm Stands',
        description: 'Find local farm stands selling fresh produce, meat, and more across Maine',
        theme_color: '#e8dcc3',
        background_color: '#ffffff',
        display: 'standalone',
        scope: '/',
        start_url: '/',
        orientation: 'portrait-primary',
        icons: [
          {
            src: '/images/flag.png',
            sizes: 'any',
            type: 'image/png',
            purpose: 'any maskable'
          }
        ]
      },
      workbox: {
        // Cache location data
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/.*\/api\/locations$/,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'location-data-cache',
              expiration: {
                maxEntries: 1,
                maxAgeSeconds: 60 * 60 * 4, // 4 hours
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          },
          {
            urlPattern: /^https:\/\/maps\.googleapis\.com\/.*/,
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'google-maps-cache',
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 60 * 60 * 24 * 7, // 1 week
              }
            }
          },
          {
            urlPattern: /\.(png|jpg|jpeg|svg|gif)$/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'image-cache',
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 60 * 60 * 24 * 30, // 30 days
              }
            }
          }
        ]
      }
    }),
  ].filter(Boolean),
  build: {
    // Enable source maps for better debugging (can disable for production)
    sourcemap: false,
    // Optimize chunk splitting
    rollupOptions: {
      output: {
        manualChunks: {
          // Separate vendor chunks for better caching
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          // Google Maps and related utilities in separate chunk
          'maps-vendor': [],
        },
      },
    },
    // Increase chunk size warning limit (default is 500kb)
    chunkSizeWarningLimit: 1000,
  },
  server: {
    // Port for the Vite development server (optional, Vite will pick one if not set)
    // port: 5173, // Example, default is often 5173

    // Proxy API requests to your backend server
    proxy: {
      // Any request to your Vite dev server that starts with '/api'
      // will be forwarded to the target.
      '/api': {
        target: 'http://localhost:3000', // Your backend Express server's address
        changeOrigin: true, // Recommended, especially for virtual hosted sites or if backend is on a different domain
        // secure: false, // Set to false if your backend target is HTTP and you encounter SSL issues (usually not needed for localhost)

        // Optional: Rewrite the path if your backend API routes don't include '/api'
        // For example, if frontend calls '/api/locations' but backend listens on '/locations'
        // rewrite: (path) => path.replace(/^\/api/, ''),

        // Optional: Configure WebSocket proxying if your backend uses WebSockets
        // ws: true,

        // Optional: Listen to proxy events for debugging
        // onProxyReq(proxyReq, req, res) {
        //   console.log(`[Vite Proxy] Request: ${req.method} ${req.originalUrl} -> ${proxyReq.host}${proxyReq.path}`);
        // },
        // onProxyRes(proxyRes, req, res) {
        //   console.log(`[Vite Proxy] Response: ${req.method} ${req.originalUrl} <- ${proxyRes.statusCode}`);
        // },
        // onError(err, req, res) {
        //   console.error(`[Vite Proxy] Error: ${err.message} for ${req.method} ${req.originalUrl}`);
        // }
      },
      // Proxy sitemap.xml to backend
      '/sitemap.xml': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
      // You can add more proxy rules if needed for other paths or targets
      // '/another-api': {
      //   target: 'http://some-other-service.com',
      //   changeOrigin: true,
      // }
    },
  },
  // Optional: Configure build output directory (default is 'dist')
  // build: {
  //   outDir: 'dist',
  // },
  // Optional: Define global constants available in your client-side code
}));