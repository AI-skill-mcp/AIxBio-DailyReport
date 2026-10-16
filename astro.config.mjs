import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';

// Custom-domain Pages is served from /; no repository-name base prefix is needed.
export default defineConfig({
  site: 'https://bioinformatic.tech',
  output: 'static',
  trailingSlash: 'always',
  vite: { plugins: [tailwindcss()] },
});
