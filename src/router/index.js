import { createRouter, createWebHashHistory } from 'vue-router'
import Home from '../views/Home.vue'

const router = createRouter({
  // hash 模式：GitHub Pages 项目站点无需服务器重写规则
  history: createWebHashHistory(),
  routes: [
    { path: '/', name: 'home', component: Home },
    { path: '/account', name: 'account', component: () => import('../views/AccountParser.vue') },
  ],
  scrollBehavior() {
    return { top: 0 }
  },
})

export default router
