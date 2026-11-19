import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// GitHub Pages 项目站点路径：https://<用户名>.github.io/<仓库名>/
// 若仓库改名为个人主页仓库（<用户名>.github.io），把 base 改成 '/' 即可
export default defineConfig({
  base: '/jcmy888/',
  plugins: [vue()],
})
