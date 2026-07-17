<template>
  <div class="oa-app">
    <!-- 顶部导航栏 -->
    <header class="oa-header">
      <div class="header-left">
        <div class="logo">
          <el-icon :size="20"><Document /></el-icon>
          <span class="logo-text">OA 审批系统</span>
        </div>
      </div>
      <div class="header-center">
        <el-menu mode="horizontal" :default-active="activeMenu" :ellipsis="false" @select="handleMenuSelect">
          <el-menu-item index="/oa/dashboard">
            <el-icon><Odometer /></el-icon>
            <span>工作台</span>
          </el-menu-item>
          <el-menu-item index="/oa/create">
            <el-icon><EditPen /></el-icon>
            <span>发起审批</span>
          </el-menu-item>
          <el-menu-item index="/oa/my">
            <el-icon><Tickets /></el-icon>
            <span>我的申请</span>
          </el-menu-item>
          <el-menu-item index="/oa/pending">
            <el-icon><Bell /></el-icon>
            <span>待我审批</span>
            <el-badge v-if="pendingCount > 0" :value="pendingCount" class="menu-badge" />
          </el-menu-item>
        </el-menu>
      </div>
      <div class="header-right">
        <el-badge :value="notifyCount" :hidden="notifyCount === 0" :max="99">
          <el-button :icon="Bell" circle size="small" />
        </el-badge>
        <el-dropdown>
          <div class="user-info">
            <el-avatar :size="28" :icon="UserFilled" />
            <span class="user-name">{{ userName }}</span>
          </div>
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item @click="handleLogout">退出登录</el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
      </div>
    </header>

    <!-- 主内容区 -->
    <main class="oa-main">
      <router-view />
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { 
  Document, Odometer, EditPen, Tickets, Bell, UserFilled 
} from '@element-plus/icons-vue'
import { fetchUnreadCount } from './api'

const router = useRouter()
const route = useRoute()
const pendingCount = ref(0)
const notifyCount = ref(0)

const activeMenu = computed(() => {
  const path = route.path
  if (path.startsWith('/oa/dashboard')) return '/oa/dashboard'
  if (path.startsWith('/oa/create')) return '/oa/create'
  if (path.startsWith('/oa/my')) return '/oa/my'
  if (path.startsWith('/oa/pending')) return '/oa/pending'
  return '/oa/dashboard'
})

const userName = computed(() => {
  try {
    const user = JSON.parse(localStorage.getItem('user') || '{}')
    return user.name || user.username || '用户'
  } catch { return '用户' }
})

function handleMenuSelect(index: string) {
  router.push(index)
}

function handleLogout() {
  localStorage.removeItem('token')
  localStorage.removeItem('user')
  window.location.reload()
}

onMounted(async () => {
  try {
    const count = await fetchUnreadCount()
    pendingCount.value = count || 0
    notifyCount.value = count || 0
  } catch (e) {}
})
</script>

<style>
* { margin: 0; padding: 0; box-sizing: border-box; }
html, body, #app { height: 100%; overflow: hidden; }

.oa-app {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: #f5f7fa;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', sans-serif;
}

/* 顶部导航 */
.oa-header {
  height: 56px;
  background: #fff;
  border-bottom: 1px solid #e8e8e8;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 24px;
  flex-shrink: 0;
  z-index: 100;
}

.header-left {
  display: flex;
  align-items: center;
}

.logo {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #1890ff;
}

.logo-text {
  font-size: 16px;
  font-weight: 600;
  color: #1a1a2e;
}

.header-center {
  flex: 1;
  display: flex;
  justify-content: center;
}

.header-center .el-menu {
  border-bottom: none;
  background: transparent;
}

.header-center .el-menu-item {
  height: 56px;
  line-height: 56px;
  font-size: 14px;
  color: #666;
  border-bottom: 2px solid transparent;
  transition: all 0.2s;
}

.header-center .el-menu-item:hover {
  color: #1890ff;
  background: transparent;
}

.header-center .el-menu-item.is-active {
  color: #1890ff;
  font-weight: 500;
  border-bottom-color: #1890ff;
}

.menu-badge {
  margin-left: 4px;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 16px;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  padding: 4px 8px;
  border-radius: 4px;
  transition: background 0.2s;
}

.user-info:hover {
  background: #f5f5f5;
}

.user-name {
  font-size: 14px;
  color: #333;
}

/* 主内容 */
.oa-main {
  flex: 1;
  overflow-y: auto;
  padding: 24px;
  background: #f5f7fa;
}
</style>
