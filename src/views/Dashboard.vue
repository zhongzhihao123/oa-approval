<template>
  <div class="dashboard">
    <div class="page-header">
      <h2>📊 工作台</h2>
      <span class="header-sub">OA 审批概览</span>
    </div>

    <!-- Stats cards -->
    <div class="stats-row">
      <div class="stat-card" v-for="s in stats" :key="s.label" @click="s.link && $router.push(s.link)">
        <div class="stat-icon" :style="{ background: s.bg }">{{ s.icon }}</div>
        <div class="stat-info">
          <div class="stat-value">{{ s.value }}</div>
          <div class="stat-label">{{ s.label }}</div>
        </div>
      </div>
    </div>

    <!-- Quick actions -->
    <div class="section">
      <h3>快捷入口</h3>
      <div class="quick-actions">
        <el-button type="primary" size="large" @click="$router.push('/oa/create')">
          <el-icon><Plus /></el-icon> 发起请假
        </el-button>
        <el-button size="large" @click="$router.push('/oa/pending')">
          <el-icon><Clock /></el-icon> 待我审批
        </el-button>
        <el-button size="large" @click="$router.push('/oa/my')">
          <el-icon><Document /></el-icon> 我的申请
        </el-button>
      </div>
    </div>

    <!-- Recent applications -->
    <div class="section">
      <h3>最近申请</h3>
      <el-table :data="recentApps" style="width:100%" @row-click="(row: any) => $router.push(`/oa/detail/${row.id}`)">
        <el-table-column prop="appNo" label="编号" width="160" />
        <el-table-column prop="typeName" label="类型" width="100">
          <template #default="{ row }">
            <el-tag :color="getLeaveColor(row.typeName)" size="small" effect="plain">{{ row.typeName }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="reason" label="原因" show-overflow-tooltip />
        <el-table-column prop="days" label="天数" width="80" />
        <el-table-column prop="startDate" label="开始日期" width="120" />
        <el-table-column prop="endDate" label="结束日期" width="120" />
        <el-table-column prop="status" label="状态" width="100">
          <template #default="{ row }">
            <StatusBadge :status="row.status" />
          </template>
        </el-table-column>
      </el-table>
      <el-empty v-if="recentApps.length === 0" description="暂无申请记录" />
    </div>

    <!-- Notifications -->
    <div class="section" v-if="notifies.length > 0">
      <h3>通知消息</h3>
      <div class="notify-list">
        <div v-for="n in notifies" :key="n.id" class="notify-item" :class="{ unread: !n.isRead }"
          @click="n.applicationId && $router.push(`/oa/detail/${n.applicationId}`)">
          <span class="notify-dot" v-if="!n.isRead"></span>
          <div class="notify-content">
            <div class="notify-title">{{ n.title }}</div>
            <div class="notify-text">{{ n.content }}</div>
          </div>
          <span class="notify-time">{{ formatTime(n.createdAt) }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { Plus, Clock, Document } from '@element-plus/icons-vue'
import { fetchDashboard } from '@/api'
import StatusBadge from '@/components/StatusBadge.vue'

const stats = ref([
  { icon: '⏳', label: '待处理', value: 0, bg: '#fff7e6', link: '/oa/pending' },
  { icon: '📋', label: '我的申请', value: 0, bg: '#e6f7ff', link: '/oa/my' },
  { icon: '✅', label: '已使用年假', value: '0天', bg: '#f6ffed' },
  { icon: '📬', label: '未读通知', value: 0, bg: '#f0f5ff' },
])
const recentApps = ref<any[]>([])
const notifies = ref<any[]>([])

onMounted(async () => {
  try {
    const data = await fetchDashboard()
    stats.value[0].value = data.pendingCount || 0
    stats.value[2].value = (data.yearLeaveUsed || 0) + '天'
    stats.value[3].value = data.unreadNotifyCount || 0
    recentApps.value = data.recentApplications || []
    notifies.value = data.recentNotifications || []
  } catch (e) {
    console.error('Dashboard load error:', e)
  }
})

function getLeaveColor(name: string) {
  const map: Record<string, string> = { '年假': '#52c41a', '事假': '#fa8c16', '病假': '#ff4d4f', '婚假': '#eb2f96', '产假': '#722ed1', '调休': '#1890ff' }
  return map[name] || '#999'
}

function formatTime(t: string) {
  if (!t) return ''
  const d = new Date(t)
  return `${d.getMonth()+1}/${d.getDate()} ${d.getHours()}:${String(d.getMinutes()).padStart(2,'0')}`
}
</script>

<style scoped>
.dashboard { max-width: 1100px; }
.page-header { margin-bottom: 24px; }
.page-header h2 { font-size: 22px; color: #1a1a2e; margin-bottom: 4px; }
.header-sub { font-size: 13px; color: #999; }

.stats-row { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; margin-bottom: 28px; }
.stat-card {
  background: #fff; border-radius: 10px; padding: 20px;
  display: flex; align-items: center; gap: 14px;
  cursor: pointer; transition: box-shadow 0.2s;
  border: 1px solid #f0f0f0;
}
.stat-card:hover { box-shadow: 0 4px 12px rgba(0,0,0,0.06); }
.stat-icon {
  width: 48px; height: 48px; border-radius: 10px;
  display: flex; align-items: center; justify-content: center;
  font-size: 22px;
}
.stat-value { font-size: 24px; font-weight: 700; color: #1a1a2e; }
.stat-label { font-size: 13px; color: #999; margin-top: 2px; }

.section { background: #fff; border-radius: 10px; padding: 20px 24px; margin-bottom: 20px; border: 1px solid #f0f0f0; }
.section h3 { font-size: 15px; color: #333; margin-bottom: 16px; }

.quick-actions { display: flex; gap: 12px; }

.notify-list { display: flex; flex-direction: column; gap: 4px; }
.notify-item {
  display: flex; align-items: center; gap: 10px; padding: 10px 12px;
  border-radius: 6px; cursor: pointer; transition: background 0.2s;
}
.notify-item:hover { background: #f5f7fa; }
.notify-item.unread { background: #fafafa; }
.notify-dot { width: 8px; height: 8px; border-radius: 50%; background: #1890ff; flex-shrink: 0; }
.notify-content { flex: 1; min-width: 0; }
.notify-title { font-size: 13px; font-weight: 600; color: #333; }
.notify-text { font-size: 12px; color: #999; margin-top: 2px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.notify-time { font-size: 12px; color: #bbb; flex-shrink: 0; }
</style>
