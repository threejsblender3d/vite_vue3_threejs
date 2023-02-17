import { createRouter, createWebHashHistory, RouteRecordRaw } from 'vue-router'
const routes: Array<RouteRecordRaw> = [
  { path: '/', meta: { hideTabBar: true, title: '元宇宙产品' }, component: () => import('../views/ScrollStar.vue') },
  { path: '/crosswire', meta: { hideTabBar: true, title: '动画' }, component: () => import('../views/CrossWire.vue') },
  { path: '/train', meta: { hideTabBar: true, title: '动画' }, component: () => import('../views/Train.vue') },
  { path: '/wall', meta: { hideTabBar: true, title: '平遥古城' }, component: () => import('../views/Wall.vue') },
]

const router = createRouter({
  history: createWebHashHistory(),
  routes
})

router.beforeEach((to, from, next) => {
  if (to.meta.title) {
      document.title = to.meta.title + ''
  }
  next()
})
export default router
