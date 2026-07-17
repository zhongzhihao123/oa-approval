<template>
  <div class="dashboard">
    <!-- 欢迎区域 -->
    <div class="welcome-section">
      <div class="welcome-text">
        <h1>欢迎回来，{{ userName }}</h1>
        <p>今天是 {{ today }}，祝您工作愉快！</p>
      </div>
      <div class="welcome-actions">
        <el-button type="primary" size="large" @click="$router.push('/oa/create')">
          <el-icon><EditPen /></el-icon>
          发起请假
        </el-button>
      </div>
    </div>

    <!-- 统计卡片 -->
    <div class="stats-grid">
      <div class="stat-card" v-for="stat in stats" :key="stat.title">
        <div class="stat-icon" :class="stat.type">
          <el-icon :size="24"><component :is="stat.icon" /></el-icon>
        </div>
        <div class="stat-content">
          <div class="stat-value">{{ stat.value }}</div>
          <div class="stat-title">{{ stat.title }}</div>
        </div>
        <div class="stat-trend" v-if="stat.trend">
          <span :class="stat.trend > 0 ? 'up' : 'down'">
            {{ stat.trend > 0 ? '↑' : '↓' }} {{ Math.abs(stat.trend) }}%
          </span>
          <span class="trend-label">较上月</span>
        </div>
      </div>
    </div>

    <!-- 快捷入口 -->
    <div class="section">
      <div class="section-header">
        <h3>快捷入口</h3>
      </div>
      <div class="quick-grid">
        <div class="quick-item" v-for="item in quickActions" :key="item.title" @click="$router.push(item.path)">
          <div class="quick-icon" :class="item.type">
            <el-icon :size="20"><component :is="item.icon" /></el-icon>
          </div>
          <div class="quick-info">
            <div class="quick-title">{{ item.title }}</div>
            <div class="quick-desc">{{ item.desc }}</div>
          </div>
        </div>
      </div>
    </div>

    <!-- 最近申请 -->
    <div class="section">
      <div class="section-header">
        <h3>最近申请</h3>
        <el-button text type="primary" @click="$router.push('/oa/my')">查看全部</el-button>
      </div>
      
      <el-table :data="recentApps" style="width: 100%" v-loading="loading" stripe>
        <el-table-column prop="appNo" label="申请编号" width="180" />
        <el-table-column prop="typeName" label="假期类型" width="120">
          <template #default="{ row }">
            <el-tag :type="getLeaveTagType(row.typeName)" size="small" effect="light">
              {{ row.typeName }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="reason" label="请假原因" min-width="200" show-overflow-tooltip />
        <el-table-column prop="days" label="天数" width="80" align="center">
          <template #default="{ row }">
            <span class="days-badge">{{ row.days }}天</span>
          </template>
        </el-table-column>
        <el-table-column prop="startDate" label="开始日期" width="120" />
        <el-table-column prop="endDate" label="结束日期" width="120" />
        <el-table-column prop="status" label="状态" width="100" align="center">
          <template #default="{ row }">
            <StatusBadge :status="row.status" />
          </template>
        </el-table-column>
        <el-table-column label="操作" width="100" align="center">
          <template #default="{ row }">
            <el-button text type="primary" size="small" @click="$router.push(`/oa/detail/${row.id}`)">
              查看详情
            </el-button>
          </template>
        </el-table-column>
      </el-table>
      
      <el-empty v-if="!loading && recentApps.length === 0" description="暂无申请记录" />
    </div>

    <!-- 通知消息 -->
    <div class="section" v-if="notifies.length > 0">
      <div class="section-header">
        <h3>最新通知</h3>
        <el-button text type="primary" @click="$router.push('/oa/notifications')">查看全部</el-button>
      </div>
      <div class="notify-list">
        <div 
          v-for="n in notifies" 
          :key="n.id" 
          class="notify-item" 
          :class="{ unread: !n.isRead }"
          @click="n.applicationId && $router.push(`/oa/detail/${n.applicationId}`)"
        >
          <div class="notify-dot" v-if="!n.isRead"></div>
          <div class="notify-content">
            <div class="notify-title">{{ n.title }}</div>
            <div class="notify-text">{{ n.content }}</div>
          </div>
          <div class="notify-time">{{ formatTime(n.createdAt) }}</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { 
  EditPen, Clock, Document, Bell, 
  Calendar, Check, Warning 
} from '@element-plus/icons-vue'
import { fetchDashboard } from '@/api'
import StatusBadge from '@/components/StatusBadge.vue'

const loading = ref(false)
const recentApps = ref<any[]>([])
const notifies = ref<any[]>([])

const userName = computed(() => {
  try {
    const user = JSON.parse(localStorage.getItem('user') || '{}')
    return user.name || user.username || '用户'
  } catch { return '用户' }
})

const today = computed(() => {
  const d = new Date()
  const weekDays = ['日', '一', '二', '三', '四', '五', '六']
  return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日 星期${weekDays[d.getDay()]}`
})

const stats = ref([
  { title: '待处理', value: 0, icon: Clock, type: 'warning', trend: null },
  { title: '本月请假', value: 0, icon: Calendar, type: 'primary', trend: null },
  { title: '已通过', value: 0, icon: Check, type: 'success', trend: null },
  { title: '未读通知', value: 0, icon: Bell, type: 'info', trend: null },
])

const quickActions = [
  { title: '年假申请', desc: '带薪年假，每年10天', icon: Calendar, path: '/oa/create', type: 'primary' },
  { title: '事假申请', desc: '因私事需要请假', icon: Document, path: '/oa/create', type: 'warning' },
  { title: '病假申请', desc: '因病需要休息', icon: Warning, path: '/oa/create', type: 'danger' },
  { title: '调休申请', desc: '使用加班调休', icon: Clock, path: '/oa/create', type: 'success' },
]

function getLeaveTagType(typeName: string) {
  const map: Record<string, string> = {
    '年假': 'success', '事假': 'warning', '病假': 'danger', 
    '婚假': 'primary', '产假': 'info', '调休': ''
  }
  return map[typeName] || 'info'
}

function formatTime(t: string) {
  if (!t) return ''
  const d = new Date(t)
  const now = new Date()
  const diff = now.getTime() - d.getTime()
  const minutes = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)
  
  if (minutes < 1) return '刚刚'
  if (minutes < 60) return `${minutes}分钟前`
  if (hours < 24) return `${hours}小时前`
  if (days < 7) return `${days}天前`
  return `${d.getMonth() + 1}/${d.getDate()}`
}

onMounted(async () => {
  loading.value = true
  try {
    const data = await fetchDashboard()
    stats.value[0].value = data.pendingCount || 0
    stats.value[1].value = data.monthLeaveDays || 0
    stats.value[2].value = data.approvedCount || 0
    stats.value[3].value = data.unreadNotifyCount || 0
    recentApps.value = data.recentApplications || []
    notifies.value = data.recentNotifications || []
  } catch (e) {
    console.error('Dashboard load error:', e)
  } finally {
    loading.value = false
  }
})
</script>

<style scoped>
.dashboard {
  max-width: 1200px;
  margin: 0 auto;
}

/* 欢迎区域 */
.welcome-section {
  background: linear-gradient(135deg, #1890ff 0%, #096dd9 100%);
  border-radius: 8px;
  padding: 32px;
  margin-bottom: 24px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  color: #fff;
}

.welcome-text h1 {
  font-size: 24px;
  font-weight: 600;
  margin-bottom: 8px;
}

.welcome-text p {
  font-size: 14px;
  opacity: 0.85;
}

/* 统计卡片 */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
  margin-bottom: 24px;
}

.stat-card {
  background: #fff;
  border-radius: 8px;
  padding: 20px;
  display: flex;
  align-items: center;
  gap: 16px;
  border: 1px solid #e8e8e8;
  transition: all 0.2s;
}

.stat-card:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
  transform: translateY(-2px);
}

.stat-icon {
  width: 48px;
  height: 48px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
}

.stat-icon.warning { background: linear-gradient(135deg, #faad14, #d48806); }
.stat-icon.primary { background: linear-gradient(135deg, #1890ff, #096dd9); }
.stat-icon.success { background: linear-gradient(135deg, #52c41a, #389e0d); }
.stat-icon.info { background: linear-gradient(135deg, #722ed1, #531dab); }

.stat-content {
  flex: 1;
}

.stat-value {
  font-size: 28px;
  font-weight: 700;
  color: #1a1a2e;
  line-height: 1;
  margin-bottom: 4px;
}

.stat-title {
  font-size: 13px;
  color: #999;
}

.stat-trend {
  font-size: 12px;
  text-align: right;
}

.stat-trend .up {
  color: #52c41a;
}

.stat-trend .down {
  color: #ff4d4f;
}

.trend-label {
  display: block;
  color: #999;
  font-size: 11px;
  margin-top: 2px;
}

/* 区块 */
.section {
  background: #fff;
  border-radius: 8px;
  padding: 20px 24px;
  margin-bottom: 20px;
  border: 1px solid #e8e8e8;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding-bottom: 12px;
  border-bottom: 1px solid #f0f0f0;
}

.section-header h3 {
  font-size: 16px;
  font-weight: 600;
  color: #1a1a2e;
}

/* 快捷入口 */
.quick-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
}

.quick-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px;
  background: #fafafa;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s;
  border: 1px solid transparent;
}

.quick-item:hover {
  background: #fff;
  border-color: #1890ff;
  box-shadow: 0 2px 8px rgba(24, 144, 255, 0.1);
}

.quick-icon {
  width: 40px;
  height: 40px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
}

.quick-icon.primary { background: #1890ff; }
.quick-icon.warning { background: #faad14; }
.quick-icon.danger { background: #ff4d4f; }
.quick-icon.success { background: #52c41a; }

.quick-info {
  flex: 1;
}

.quick-title {
  font-size: 14px;
  font-weight: 500;
  color: #333;
  margin-bottom: 2px;
}

.quick-desc {
  font-size: 12px;
  color: #999;
}

/* 表格 */
.days-badge {
  background: #e6f7ff;
  color: #1890ff;
  padding: 2px 8px;
  border-radius: 4px;
  font-weight: 500;
}

/* 通知列表 */
.notify-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.notify-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  background: #fafafa;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s;
}

.notify-item:hover {
  background: #e6f7ff;
}

.notify-item.unread {
  background: #fff7e6;
  border-left: 3px solid #faad14;
}

.notify-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #faad14;
  flex-shrink: 0;
}

.notify-content {
  flex: 1;
  min-width: 0;
}

.notify-title {
  font-size: 14px;
  font-weight: 500;
  color: #333;
  margin-bottom: 4px;
}

.notify-text {
  font-size: 13px;
  color: #666;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.notify-time {
  font-size: 12px;
  color: #999;
  flex-shrink: 0;
}
</style>
