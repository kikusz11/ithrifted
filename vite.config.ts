// vite.config.js vagy vite.config.ts

import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  // Alap URL a buildelt applikáció számára.
  // Ez kulcsfontosságú a GitHub Pages-hez, mert az app egy alútvonalon fut majd.
  // Cseréld le 'ithrifted' (az én tippem) a te GitHub repositoryd VALÓDI nevére!
  base: '/ithrifted/', 
});