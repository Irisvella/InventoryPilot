import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from 'tailwindcss';

export default defineConfig({
  plugins: [
    react(),
    tailwindcss({
      config: './tailwind.config.cjs', // Explicitly specify the Tailwind config file
    }),
  ],
});