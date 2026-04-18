import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '.'),
    },
  },
  test: {
    projects: [
      // Unit tests — pure logic, no server/CF bindings
      {
        plugins: [react()],
        resolve: {
          alias: { '@': path.resolve(__dirname, '.') },
        },
        test: {
          name: 'unit',
          include: ['lib/**/*.test.ts', 'lib/**/*.test.tsx', 'components/**/*.test.tsx'],
          environment: 'jsdom',
          globals: true,
          setupFiles: ['./tests/setup.ts'],
        },
      },
      // Integration tests — API routes with mocked Cloudflare bindings
      {
        test: {
          name: 'integration',
          include: ['app/api/**/*.integration.test.ts'],
          environment: 'node',
          globals: true,
        },
      },
    ],
  },
});
