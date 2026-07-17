<template>
  <div class="my-applications">
    <!-- 页面标题 -->
    <div class="page-header">
      <div class="header-left">
        <h2>我的申请</h2>
        <p>查看所有发起的审批申请</p>
      </div>
      <div class="header-right">
        <el-button type="primary" @click="$router.push('/oa/create')">
          <el-icon><EditPen /></el-icon>
          发起审批
        </el-button>
      </div>
    </div>

    <!-- 筛选栏 -->
    <div class="filter-section">
      <div class="filter-left">
        <el-radio-group v-model="statusFilter" @change="loadData">
          <el-radio-button value="all">全部</el-radio-button>
          <el-radio-button value="pending">审批中</el-radio-button>
          <el-radio-button value="approved">已通过</el-radio-button>
          <el-radio-button value="rejected">已驳回</el-radio-button>
          <el-radio-button value="cancelled">已撤回</el-radio-button>
        </el-radio-group>
      </div>
      <div class="filter-right">
        <el-input
          v-model="searchKey"
          placeholder="搜索申请编号或原因"
          :prefix-icon="Search"
          clearable
          style="width: 240px"
        />
      </div>
    </div>

    <!-- 统计卡片 -->
    <div class="stats-row">
      <div class="mini-stat" v-for="stat in statusStats" :key="stat.label">
        <span class="stat-count" :class="stat.type">{{ stat.count }}</span>
        <span class="stat-label">{{ stat.label }}</span>
      </div>
    </div>

    <!-- 申请列表 -->
    <div class="section">
      <el-table 
        :data="filteredApps" 
        style="width: 100%"
        v-loading="loading"
        stripe
        highlight-current-row
      >
        <el-table-column prop="appNo" label="申请编号" width="180">
          <template #default="{ row }">
            <span class="app-no">{{ row.appNo }}</span>
          </template>
        </el-table-column>
        
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
        
        <el-table-column label="请假时间" width="200">
          <template #default="{ row }">
            <div class="time-range">
              <span>{{ row.startDate }}</span>
              <span class="time-separator">至</span>
              <span>{{ row.endDate }}</span>
            </div>
          </template>
        </el-table-column>
        
        <el-table-column prop="status" label="状态" width="100" align="center">
          <template #default="{ row }">
            <StatusBadge :status="row.status" />
          </template>
        </el-table-column>
        
        <el-table-column prop="createdAt" label="提交时间" width="160">
          <template #default="{ row }">
            <span class="time-text">{{ formatTime(row.createdAt) }}</span>
          </template>
        </el-table-column>
        
        <el-table-column label="操作" width="150" fixed="right" align="center">
          <template #default="{ row }">
            <div class="action-buttons">
              <el-button 
                v-if="row.status === 'pending'" 
                text 
                type="warning" 
                size="small"
                @click.stop="handleCancel(row)"
              >
                撤回
              </el-button>
              <el-button 
                text 
                type="primary" 
                size="small"
                @click.stop="$router.push(`/oa/detail/${row.id}`)"
              >
                详情
              </el-button>
            </div>
          </template>
        </el-table-column>
      </el-table>

      <el-empty v-if="!loading && filteredApps.length === 0" description="暂无申请记录">
        <el-button type="primary" @click="$router.push('/oa/create')">发起请假</el-button>
      </el-empty>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { EditPen, Search } from '@element-plus/icons-vue'
import { fetchMyApplications, cancelApplication } from '@/api'
import StatusBadge from '@/components/StatusBadge.vue'

const loading = ref(false)
const apps = ref<any[]>([])
const statusFilter = ref('all')
const searchKey = ref('')

const statusStats = computed(() => {
  const total = apps.value.length
  const pending = apps.value.filter(a => a.status === 'pending').length
  const approved = apps.value.filter(a => a.status === 'approved').length
  const rejected = apps.value.filter(a => a.status === 'rejected').length
  const cancelled = apps.value.filter(a => a.status === 'cancelled').length
  
  return [
    { label: '全部', count: total, type: 'default' },
    { label: '审批中', count: pending, type: 'warning' },
    { label: '已通过', count: approved, type: 'success' },
    { label: '已驳回', count: rejected, type: 'danger' },
    { label: '已撤回', count: cancelled, type: 'info' },
  ]
})

const filteredApps = computed(() => {
  let result = apps.value
  
  if (statusFilter.value !== 'all') {
    result = result.filter(a => a.status === statusFilter.value)
  }
  
  if (searchKey.value) {
    const key = searchKey.value.toLowerCase()
    result = result.filter(a => 
      a.appNo.toLowerCase().includes(key) || 
      a.reason.toLowerCase().includes(key)
    )
  }
  
  return result
})

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
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

async function loadData() {
  loading.value = true
  try {
    apps.value = await fetchMyApplications()
  } catch (e) {
    console.error('Failed to load applications:', e)
  } finally {
    loading.value = false
  }
}

async function handleCancel(row: any) {
  try {
    await ElMessageBox.confirm(
      `确认撤回申请 ${row.appNo}？撤回后需要重新提交。`,
      '确认撤回',
      { type: 'warning' }
    )
    await cancelApplication(row.id)
    ElMessage.success('申请已撤回')
    loadData()
  } catch (e: any) {
    if (e !== 'cancel') {
      ElMessage.error(e?.response?.data?.message || '撤回失败')
    }
  }
}

onMounted(loadData)
</script>

<style scoped>
.my-applications {
  max-width: 1200px;
  margin: 0 auto;
}

/* 页面标题 */
.page-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 24px;
}

.header-left h2 {
  font-size: 20px;
  font-weight: 600;
  color: #1a1a2e;
  margin-bottom: 4px;
}

.header-left p {
  font-size: 14px;
  color: #999;
}

/* 筛选栏 */
.filter-section {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

/* 统计行 */
.stats-row {
  display: flex;
  gap: 24px;
  margin-bottom: 20px;
  padding: 16px 20px;
  background: #fff;
  border-radius: 8px;
  border: 1px solid #e8e8e8;
}

.mini-stat {
  display: flex;
  align-items: center;
  gap: 8px;
}

.stat-count {
  font-size: 20px;
  font-weight: 700;
  line-height: 1;
}

.stat-count.default { color: #333; }
.stat-count.warning { color: #faad14; }
.stat-count.success { color: #52c41a; }
.stat-count.danger { color: #ff4d4f; }
.stat-count.info { color: #999; }

.stat-label {
  font-size: 13px;
  color: #666;
}

/* 区块 */
.section {
  background: #fff;
  border-radius: 8px;
  padding: 20px;
  border: 1px solid #e8e8e8;
}

/* 表格样式 */
.app-no {
  font-family: 'SF Mono', 'Monaco', 'Consolas', monospace;
  font-size: 13px;
  color: #1890ff;
}

.days-badge {
  background: #e6f7ff;
  color: #1890ff;
  padding: 2px 8px;
  border-radius: 4px;
  font-weight: 500;
  font-size: 13px;
}

.time-range {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 13px;
}

.time-separator {
  color: #999;
}

.time-text {
  font-size: 13px;
  color: #666;
}

.action-buttons {
  display: flex;
  gap: 8px;
  justify-content: center;
}
</style>
