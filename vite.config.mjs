import { defineConfig } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';
import path from 'path';

export default defineConfig({
  esbuild: {
    /**
     * Prevents ESBuild to throw when using a feature not supported by the
     * list of supported browsers coming from the `browserslist` file.
     */
    supported: {
      'top-level-await': true,
    },
  },
  // the local real-data proxy lives outside dashboard/ and loads only when asked for, so a
  // production build never resolves it (scripts/dev-local.ps1)
  plugins: [svelte(), ...(process.env.VITE_LOCAL_DATA
    ? [(await import(new URL('../scripts/local-graph.mjs', import.meta.url).href)).default()]
    : [])],
  build: {
    outDir: 'build', // output to build to conform to existing build scripts
    rollupOptions: {
      output: {
        manualChunks(id) {
          // Put node_modules into their own chunks
          if (id.includes('node_modules')) {
            const packageName = id.split('node_modules/')[1].split('/')[0];
            return `vendor.${packageName}`;
          }

          // Chunk all code in /src/lib into a "lib" chunk
          if (id.includes(path.normalize('/src/lib/'))) {
            return 'lib';
          }

          // Chunk all code in each folder under /src/routes into their own chunk
          const routesMatch = id.match(/src[\\/]routes[\\/](\w+)[\\/]/);
          if (routesMatch) {
            return `routes.${routesMatch[1]}`;
          }
        },
      },
    },
  },
  server: {
    port: 8080, // mock mode only. real mode (SSO) must run on localhost:3000, see docs/development.md
  },
  resolve: {
    alias: {
      '$lib': path.resolve(__dirname, 'src/lib'),
      // Mock fixtures are pulled in by ALIAS, not by a runtime/tree-shake condition: only a
      // mock build resolves the loader that globs /mocks, so a production bundle can never
      // embed fixture data even though the mocks/ dir exists in this repo (#46).
      '$fixtures': path.resolve(
        __dirname,
        process.env.VITE_USE_MOCK ? 'src/lib/fixtures.mock.js' : 'src/lib/fixtures.empty.js',
      ),
    },
  },
});
