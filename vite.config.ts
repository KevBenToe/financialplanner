import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

const repoName = process.env.GITHUB_REPOSITORY?.split('/')[1];
const basePath = process.env.VITE_BASE_PATH ?? (repoName ? `/${repoName}/` : '/');
const nodeMajor = Number(process.versions.node.split('.')[0]);
const enablePwa = nodeMajor >= 20;

// https://vitejs.dev/config/
export default defineConfig({
  base: basePath,
  plugins: [
    react(),
    ...(enablePwa
      ? [
          VitePWA({
            injectRegister: 'auto',
            registerType: 'autoUpdate',
            includeAssets: ['icons/icon-192.svg', 'icons/icon-512.svg'],
            manifest: {
              name: 'Finanz- und Sparplan-Simulator',
              short_name: 'Finanzplaner',
              description:
                'Clientseitiger Finanz- und Sparplan-Simulator mit Offline-Unterstuetzung.',
              theme_color: '#1f7a8c',
              background_color: '#f4f6f4',
              display: 'standalone',
              icons: [
                {
                  src: 'icons/icon-192.svg',
                  sizes: '192x192',
                  type: 'image/svg+xml',
                },
                {
                  src: 'icons/icon-512.svg',
                  sizes: '512x512',
                  type: 'image/svg+xml',
                },
              ],
            },
            workbox: {
              globPatterns: ['**/*.{js,css,html,png,svg,ico}'],
              runtimeCaching: [
                {
                  urlPattern: ({ request }) => request.destination === 'document',
                  handler: 'NetworkFirst',
                  options: {
                    cacheName: 'documents-cache',
                  },
                },
              ],
            },
          }),
        ]
      : []),
  ],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/tests/setup.ts'],
    include: ['src/tests/**/*.test.ts', 'src/tests/**/*.test.tsx'],
  },
});
