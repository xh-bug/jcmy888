<script setup>
import { ref, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()

// 按钮入口配置：以后新增页面只需加一项，填 path 做站内跳转，填 url 做外链
// 两者都留空时视为“预留口子”，点击只给出提示
const entries = [
  { label: '账号解析页', path: '/account', url: '', tip: '' },
  { label: 'GitHub', path: '', url: 'https://github.com/xh-bug/jcmy888', tip: '' },
  { label: '更多页面', path: '', url: '', tip: '更多功能即将上线，敬请期待' },
]

const tip = ref('')
let timer

function open(entry) {
  if (entry.path) {
    router.push(entry.path)
    return
  }
  if (entry.url) {
    window.open(entry.url, '_blank', 'noopener,noreferrer')
    return
  }
  tip.value = entry.tip
  clearTimeout(timer)
  timer = setTimeout(() => { tip.value = '' }, 2200)
}

onUnmounted(() => clearTimeout(timer))
</script>

<template>
  <div class="page">
    <main class="panel">
      <h1>佳成贸易</h1>

      <div class="actions">
        <button
          v-for="(entry, index) in entries"
          :key="entry.label"
          type="button"
          class="action"
          :class="{ primary: index === 1, soon: !entry.path && !entry.url }"
          @click="open(entry)"
        >
          <span>{{ entry.label }}</span>
          <span class="mark">{{ entry.path ? '→' : (entry.url ? '↗' : '·') }}</span>
        </button>
      </div>

      <p class="hint">更多页面正在规划中</p>

      <div v-if="tip" class="toast">{{ tip }}</div>
    </main>
  </div>
</template>

<style scoped>
.page {
  min-height: 100vh;
  display: grid;
  place-items: center;
  padding: 40px 20px;
  background:
    radial-gradient(800px 500px at 20% 0%, rgba(99, 102, 241, .16), transparent 60%),
    radial-gradient(700px 500px at 85% 100%, rgba(14, 165, 233, .14), transparent 60%),
    #f8fafc;
}

.panel { width: 100%; text-align: center; position: relative; }

h1 {
  margin: 0 0 48px;
  font-size: clamp(44px, 11vw, 76px);
  font-weight: 700;
  letter-spacing: .16em;
  text-indent: .16em;
  line-height: 1.2;
  background: linear-gradient(135deg, #312e81, #4f46e5 55%, #0284c7);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
}

.actions {
  display: flex;
  flex-direction: column;
  gap: 14px;
  width: min(300px, 100%);
  margin: 0 auto;
}

.action {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  padding: 16px 22px;
  border: 1px solid rgba(148, 163, 184, .35);
  border-radius: 14px;
  background: rgba(255, 255, 255, .85);
  color: #334155;
  font-size: 16px;
  font-family: inherit;
  cursor: pointer;
  box-shadow: 0 8px 24px rgba(15, 23, 42, .05);
  transition: transform .18s, box-shadow .18s, background .18s;
}

.action:hover {
  transform: translateY(-2px);
  box-shadow: 0 12px 28px rgba(79, 70, 229, .16);
}

.action.primary {
  background: linear-gradient(135deg, #4f46e5, #0284c7);
  border-color: transparent;
  color: #fff;
  box-shadow: 0 12px 28px rgba(79, 70, 229, .25);
}

.action.soon { color: #64748b; }
.mark { font-size: 18px; opacity: .75; }

.hint {
  margin: 30px 0 0;
  font-size: 13px;
  color: #94a3b8;
}

.toast {
  position: fixed;
  left: 50%;
  bottom: 40px;
  transform: translateX(-50%);
  padding: 10px 20px;
  border-radius: 999px;
  background: rgba(15, 23, 42, .9);
  color: #fff;
  font-size: 14px;
  white-space: nowrap;
  box-shadow: 0 10px 30px rgba(15, 23, 42, .2);
}
</style>
