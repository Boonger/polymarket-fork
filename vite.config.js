import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// base: './' делает сборку переносимой — работает и на GitHub Pages
// (user.github.io/repo-name/), и локально через `npm run preview`,
// без необходимости хардкодить имя репозитория.
export default defineConfig({
  plugins: [react()],
  base: './',
})
