import {defineConfig} from 'vite';

export default defineConfig(({mode})=>({
  base:mode==='pages'?'/theboard/':'/',
  build:{outDir:mode==='pages'?'dist-pages':'dist'},
}));
