// vite.config.ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc'; // Using SWC for faster compilation
// If you chose the standard TypeScript template without SWC, it might be:
// import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
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
        // For example, if frontend calls '/api/farm-stands' but backend listens on '/farm-stands'
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
  // define: {
  //   // Example: Make an environment variable available (ensure it's prefixed with VITE_)
  //   'process.env.VITE_APP_TITLE': JSON.stringify('PhreshPhoods Finder'),
  //   // You would access this in your code as import.meta.env.VITE_APP_TITLE
  // },
});