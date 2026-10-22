import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import {defineConfig} from 'vite';

// Served from https://aidemolab.github.io/aim-sales-lead-scoring-demo/
export default defineConfig({
  base: '/aim-sales-lead-scoring-demo/',
  plugins: [react(), tailwindcss()],
});
