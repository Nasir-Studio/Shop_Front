import { defineConfig } from 'astro/config';

export default defineConfig({
  output: 'static',
  site: 'https://shop.nsir.uk',
  trailingSlash: 'always',
  vite: {
    css: {
      preprocessorOptions: {},
    },
  },
});
