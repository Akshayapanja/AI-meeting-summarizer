import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, '')
      }
    }
  },
  build: {
    chunkSizeWarningLimit: 1000, // Set to 1MB (1000KB) - warnings will be suppressed with proper chunking
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          // Split node_modules into separate chunks for better caching
          if (id.includes('node_modules')) {
            // React and React DOM together
            if (id.includes('react') || id.includes('react-dom')) {
              return 'react-vendor';
            }
            // PDF library separate
            if (id.includes('jspdf')) {
              return 'pdf-vendor';
            }
            // Vite and other build tools
            if (id.includes('vite') || id.includes('@vitejs')) {
              return 'vite-vendor';
            }
            // All other node_modules dependencies
            return 'vendor';
          }
          // Return undefined for non-node_modules to let Rollup handle automatically
          return undefined;
        },
        // Optimize chunk file names
        chunkFileNames: 'assets/js/[name]-[hash].js',
        entryFileNames: 'assets/js/[name]-[hash].js',
        assetFileNames: 'assets/[ext]/[name]-[hash].[ext]'
      }
    }
  }
})
