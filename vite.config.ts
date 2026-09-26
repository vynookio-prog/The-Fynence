import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import path from 'path';

export default defineConfig({
  plugins: [
    tailwindcss(),
    react(),
  ],
  resolve: {
    alias: {
      '@': path.resolve(import.meta.dirname, './src'),
      'next/link': path.resolve(import.meta.dirname, './src/shims/next-link.tsx'),
      'next/navigation': path.resolve(import.meta.dirname, './src/shims/next-navigation.ts'),
      'next/dynamic': path.resolve(import.meta.dirname, './src/shims/next-dynamic.tsx'),
      'next/image': path.resolve(import.meta.dirname, './src/shims/next-image.tsx'),
      'next/headers': path.resolve(import.meta.dirname, './src/shims/next-headers.ts'),
      'server-only': path.resolve(import.meta.dirname, './src/shims/server-only.ts'),
    },
  },
  define: {
    'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'development'),
    'process.env.NEXT_PUBLIC_INSFORGE_URL': JSON.stringify(
      process.env.NEXT_PUBLIC_INSFORGE_URL || 'https://z626btzz.ap-southeast.insforge.app'
    ),
    'process.env.NEXT_PUBLIC_INSFORGE_ANON_KEY': JSON.stringify(
      process.env.NEXT_PUBLIC_INSFORGE_ANON_KEY ||
        process.env.NEXT_PUBLIC_INSFORGE_KEY ||
        'anon_2d4e7e73c22808008043d027586461edc5dbfcaa4df5c12d45e133541cf44316'
    ),
    'process.env.NEXT_PUBLIC_INSFORGE_KEY': JSON.stringify(
      process.env.NEXT_PUBLIC_INSFORGE_KEY ||
        'anon_2d4e7e73c22808008043d027586461edc5dbfcaa4df5c12d45e133541cf44316'
    ),
    'process.env.GEMINI_API_KEY': JSON.stringify(
      process.env.GEMINI_API_KEY || ''
    ),
  },
  envPrefix: ['VITE_', 'NEXT_PUBLIC_'],
  server: {
    port: 3000,
    host: true,
    allowedHosts: true,
  },
});
