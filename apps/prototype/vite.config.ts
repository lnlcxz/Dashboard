import { defineConfig } from 'vite';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [tailwindcss()],
  server: {
    port: 3000,
    cors: true,
  },
  build: {
    target: 'es2020',
    outDir: 'dist',
  },
});
