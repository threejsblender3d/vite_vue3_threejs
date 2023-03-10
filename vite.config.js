import glsl from 'vite-plugin-glsl'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// https://vitejs.dev/config/
export default defineConfig({
  server: {
    port: 1234
  },
  plugins: [
    glsl(),
    vue()
  ]
})