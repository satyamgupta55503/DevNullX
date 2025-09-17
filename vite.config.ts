import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { visualizer } from 'rollup-plugin-visualizer';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    // Generates a bundle report after build
    visualizer({
      filename: './dist/bundle-report.html',
      open: true,
      gzipSize: true,
      brotliSize: true,
    }),
  ],
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          // Split react and react-dom into separate chunk
          react: ['react', 'react-dom'],
          lucide: ['lucide-react'],
          // Add other large libraries here as needed
        },
      },
    },
    chunkSizeWarningLimit: 1000, // Increase if necessary
  },
});
