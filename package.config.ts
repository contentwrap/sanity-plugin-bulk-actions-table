import { defineConfig } from '@sanity/pkg-utils';

export default defineConfig({
  dist: 'dist',
  tsconfig: 'tsconfig.dist.json',
  
  // Exclude source maps from production build
  sourcemap: false,
  
  // Bundle optimizations
  minify: true,
  
  // External dependencies (don't bundle these)
  external: [
    'react',
    'react-dom',
    'sanity',
    '@sanity/ui',
    '@sanity/icons',
    'styled-components'
  ]
  
  // Tree shaking is enabled by default in modern bundlers
});
