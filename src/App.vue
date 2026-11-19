<script setup>
import { ref } from 'vue'

const count = ref(0)
const year = new Date().getFullYear()

const features = [
  { icon: '⚡', title: 'Vite 构建', desc: '极速启动与热更新，开发体验流畅。' },
  { icon: '🧩', title: 'Vue 3 组合式 API', desc: '使用 <script setup> 编写更简洁的组件逻辑。' },
  { icon: '🚀', title: '自动部署', desc: '推送到 main 分支即可自动发布到 GitHub Pages。' },
]
</script>

<template>
  <div class="page">
    <header class="nav">
      <a class="brand" href="#top">
        <span class="brand-mark">J</span>
        <span>jcmy888</span>
      </a>
      <nav>
        <a href="#features">特性</a>
        <a href="https://github.com/xh-bug/jcmy888" target="_blank" rel="noreferrer">GitHub</a>
      </nav>
    </header>

    <main id="top">
      <section class="hero">
        <span class="badge">Vue 3 · Vite · GitHub Pages</span>
        <h1>你好，欢迎来到我的项目主页</h1>
        <p class="subtitle">这是一个基于 Vue 3 的静态站点，代码托管在 GitHub，推送后自动上线。</p>

        <div class="demo" aria-label="计数器示例">
          <span class="demo-label">Vue 响应式计数器</span>
          <div class="counter">
            <button type="button" @click="count--" aria-label="减少">−</button>
            <strong>{{ count }}</strong>
            <button type="button" @click="count++" aria-label="增加">+</button>
          </div>
        </div>

        <a class="cta" href="#features">看看它包含什么 ↓</a>
      </section>

      <section id="features" class="features">
        <article v-for="item in features" :key="item.title" class="card">
          <span class="card-icon">{{ item.icon }}</span>
          <h2>{{ item.title }}</h2>
          <p>{{ item.desc }}</p>
        </article>
      </section>
    </main>

    <footer>
      <p>© {{ year }} jcmy888 · 使用 Vue 3 构建</p>
    </footer>
  </div>
</template>
