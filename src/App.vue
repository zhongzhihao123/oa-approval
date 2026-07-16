<template>
  <div class="oa-app">
    <aside class="oa-sidebar">
      <div class="sidebar-logo">
        <span class="logo-icon">📋</span>
        <div class="logo-text">
          <span class="logo-title">OA 审批</span>
          <span class="logo-sub">企业审批平台</span>
        </div>
      </div>
      <nav class="sidebar-nav">
        <router-link v-for="item in menuItems" :key="item.path" :to="item.path"
          class="nav-item" :class="{ active: $route.path === item.path || $route.path.startsWith(item.match) }">
          <span class="nav-icon">{{ item.icon }}</span>
          <span class="nav-label">{{ item.label }}</span>
          <el-badge v-if="item.badge && item.badge > 0" :value="item.badge" class="nav-badge" />
        </router-link>
      </nav>
      <div class="sidebar-footer">
        <div class="footer-stat">
          <span class="stat-dot" :class="pendingCount > 0 ? 'has-pending' : ''"></span>
          <span>{{ pendingCount }} 条待处理</span>
        </div>
      </div>
    </aside>
    <main class="oa-main">
      <router-view />
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { fetchUnreadCount } from './api'
import { useRouter } from 'vue-router'

const router = useRouter()
const pendingCount = ref(0)
const notifyCount = ref(0)

const menuItems = [
  { path: '/oa/dashboard', match: '/oa/dash', icon: '📊', label: '工作台', badge: 0 },
  { path: '/oa/create', match: '/oa/create', icon: '✍️', label: '发起审批', badge: 0 },
  { path: '/oa/my', match: '/oa/my', icon: '📄', label: '我的申请', badge: 0 },
  { path: '/oa/pending', match: '/oa/pending', icon: '⏳', label: '待我审批', badge: 0 },
]

onMounted(async () => {
  try {
    const count = await fetchUnreadCount()
    pendingCount.value = count || 0
    menuItems[3].badge = pendingCount.value
  } catch (e) {}
})
</script>

<style>
* { margin: 0; padding: 0; box-sizing: border-box; }
html, body, #app { height: 100%; overflow: hidden; }
.oa-app {
  display: flex; height: 100%; background: #f5f7fa;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

/* Sidebar */
.oa-sidebar {
  width: 220px; background: #fff; border-right: 1px solid #e8e8e8;
  display: flex; flex-direction: column; flex-shrink: 0;
}
.sidebar-logo {
  padding: 20px 16px; border-bottom: 1px solid #f0f0f0;
  display: flex; align-items: center; gap: 10px;
}
.logo-icon { font-size: 28px; }
.logo-text { display: flex; flex-direction: column; }
.logo-title { font-size: 15px; font-weight: 700; color: #1a1a2e; }
.logo-sub { font-size: 11px; color: #999; margin-top: 2px; }

.sidebar-nav { flex: 1; padding: 8px; }
.nav-item {
  display: flex; align-items: center; gap: 10px;
  padding: 10px 12px; border-radius: 8px;
  text-decoration: none; color: #555;
  font-size: 14px; transition: all 0.2s;
  margin-bottom: 2px; position: relative;
}
.nav-item:hover { background: #f5f7fa; color: #333; }
.nav-item.active { background: #e6f7ff; color: #1890ff; font-weight: 600; }
.nav-icon { font-size: 18px; width: 24px; text-align: center; }
.nav-label { flex: 1; }
.nav-badge { margin-left: auto; }

.sidebar-footer {
  padding: 12px 16px; border-top: 1px solid #f0f0f0;
}
.footer-stat { display: flex; align-items: center; gap: 6px; font-size: 12px; color: #999; }
.stat-dot { width: 8px; height: 8px; border-radius: 50%; background: #d9d9d9; }
.stat-dot.has-pending { background: #fa8c16; animation: pulse 2s infinite; }
@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

/* Main */
.oa-main { flex: 1; overflow-y: auto; padding: 24px; }
</style>
