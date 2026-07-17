<template>
  <div class="pending-approval">
    <!-- 页面标题 -->
    <div class="page-header">
      <div class="header-left">
        <h2>待我审批</h2>
        <p>需要您处理的审批申请</p>
      </div>
      <div class="header-right">
        <el-badge :value="pendingCount" :hidden="pendingCount === 0">
          <el-button type="primary" plain>
            <el-icon><Bell /></el-icon>
            待处理
          </el-button>
        </el-badge>
      </div>
    </div>

    <!-- 统计卡片 -->
    <div class="stats-section">
      <div class="stat-card">
        <div class="stat-icon warning">
          <el-icon :size="24"><Clock /></el-icon>
        </div>
        <div class="stat-content">
          <div class="stat-value">{{ pendingCount }}</div>
          <div class="stat-label">待审批</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon success">
          <el-icon :size="24"><Check /></el-icon>
        </div>
        <div class="stat-content">
          <div class="stat-value">{{ approvedToday }}</div>
          <div class="stat-label">今日已审</div>
        </div>
      </div>
    </div>

    <!-- 筛选栏 -->
    <div class="filter-section">
      <el-input
        v-model="searchKey"
        placeholder="搜索申请编号、申请人或原因"
        :prefix-icon="Search"
        clearable
        style="width: 300px"
      />
      <el-select v-model="typeFilter" placeholder="假期类型" clearable style="width: 120px">
        <el-option label="全部" value="" />
        <el-option label="年假" value="年假" />
        <el-option label="事假" value="事假" />
        <el-option label="病假" value="病假" />
        <el-option label="婚假" value="婚假" />
        <el-option label="产假" value="产假" />
        <el-option label="调休" value="调休" />
      </el-select>
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
        
        <el-table-column prop="applicantName" label="申请人" width="160">
          <template #default="{ row }">
            <div class="applicant-cell">
              <el-avatar :size="24" :icon="UserFilled" />
              <div class="applicant-info">
                <span class="applicant-name">{{ row.applicantName }}</span>
                <span class="applicant-wecom" v-if="getWecomInfo(row.applicantId)">
                  {{ getWecomInfo(row.applicantId)?.wecomDepartment }}
                </span>
              </div>
            </div>
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
        
        <el-table-column prop="createdAt" label="提交时间" width="160">
          <template #default="{ row }">
            <span class="time-text">{{ formatTime(row.createdAt) }}</span>
          </template>
        </el-table-column>
        
        <el-table-column label="操作" width="200" fixed="right" align="center">
          <template #default="{ row }">
            <div class="action-buttons">
              <el-button 
                type="success" 
                size="small"
                @click.stop="handleApprove(row)"
              >
                <el-icon><Check /></el-icon>
                通过
              </el-button>
              <el-button 
                type="danger" 
                size="small"
                @click.stop="handleReject(row)"
              >
                <el-icon><Close /></el-icon>
                驳回
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

      <el-empty v-if="!loading && filteredApps.length === 0" description="暂无待审批申请">
        <el-icon :size="48" color="#52c41a"><CircleCheck /></el-icon>
        <p style="margin-top: 12px; color: #999;">所有申请已处理完毕</p>
      </el-empty>
    </div>

    <!-- 审批对话框 -->
    <el-dialog 
      v-model="dialogVisible" 
      :title="dialogTitle" 
      width="500px"
      :close-on-click-modal="false"
    >
      <div class="approval-dialog-content">
        <!-- 申请信息摘要 -->
        <div class="app-summary" v-if="currentRow">
          <div class="summary-header">
            <el-tag :type="getLeaveTagType(currentRow.typeName)" effect="light">
              {{ currentRow.typeName }}
            </el-tag>
            <span class="summary-days">{{ currentRow.days }}天</span>
          </div>
          <div class="summary-info">
            <div class="info-item">
              <span class="info-label">申请人:</span>
              <span class="info-value">{{ currentRow.applicantName }}</span>
            </div>
            <div class="info-item">
              <span class="info-label">请假时间:</span>
              <span class="info-value">{{ currentRow.startDate }} 至 {{ currentRow.endDate }}</span>
            </div>
            <div class="info-item">
              <span class="info-label">请假原因:</span>
              <span class="info-value">{{ currentRow.reason }}</span>
            </div>
          </div>
        </div>

        <!-- 审批意见 -->
        <el-form-item label="审批意见" :required="actionType === 'reject'">
          <el-input
            v-model="comment"
            type="textarea"
            :rows="3"
            :placeholder="actionType === 'approve' ? '请输入审批意见（可选）' : '请输入驳回理由（必填）'"
            show-word-limit
            maxlength="200"
          />
        </el-form-item>
      </div>

      <template #footer>
        <div class="dialog-footer">
          <el-button @click="dialogVisible = false">取消</el-button>
          <el-button 
            :type="actionType === 'approve' ? 'success' : 'danger'"
            @click="confirmAction" 
            :loading="loading"
          >
            {{ actionType === 'approve' ? '确认通过' : '确认驳回' }}
          </el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { 
  Bell, Clock, Check, Close, Search, 
  UserFilled, CircleCheck 
} from '@element-plus/icons-vue'
import { fetchPendingApprovals, approveApplication, rejectApplication, fetchWecomContacts, WecomContact } from '@/api'

const loading = ref(false)
const apps = ref<any[]>([])
const searchKey = ref('')
const typeFilter = ref('')
const wecomContactMap = ref<Record<number, WecomContact>>({})

const dialogVisible = ref(false)
const dialogTitle = ref('')
const currentRow = ref<any>(null)
const actionType = ref<'approve' | 'reject'>('approve')
const comment = ref('')

const pendingCount = computed(() => apps.value.length)
const approvedToday = ref(0) // 这个需要从后端获取

const filteredApps = computed(() => {
  let result = apps.value
  
  if (typeFilter.value) {
    result = result.filter(a => a.typeName === typeFilter.value)
  }
  
  if (searchKey.value) {
    const key = searchKey.value.toLowerCase()
    result = result.filter(a => 
      a.appNo.toLowerCase().includes(key) || 
      a.applicantName.toLowerCase().includes(key) ||
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
  const now = new Date()
  const diff = now.getTime() - d.getTime()
  const minutes = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)
  
  if (minutes < 1) return '刚刚'
  if (minutes < 60) return `${minutes}分钟前`
  if (hours < 24) return `${hours}小时前`
  if (days < 7) return `${days}天前`
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function handleApprove(row: any) {
  currentRow.value = row
  actionType.value = 'approve'
  dialogTitle.value = '审批通过'
  comment.value = '同意'
  dialogVisible.value = true
}

function handleReject(row: any) {
  currentRow.value = row
  actionType.value = 'reject'
  dialogTitle.value = '审批驳回'
  comment.value = ''
  dialogVisible.value = true
}

async function confirmAction() {
  if (!currentRow.value) return
  
  if (actionType.value === 'reject' && !comment.value.trim()) {
    ElMessage.warning('请填写驳回理由')
    return
  }

  loading.value = true
  try {
    if (actionType.value === 'approve') {
      await approveApplication(currentRow.value.id, comment.value)
      ElMessage.success('审批已通过')
    } else {
      await rejectApplication(currentRow.value.id, comment.value)
      ElMessage.success('申请已驳回')
    }
    
    dialogVisible.value = false
    await loadData()
  } catch (e: any) {
    ElMessage.error(e?.response?.data?.message || '操作失败')
  } finally {
    loading.value = false
  }
}

async function loadData() {
  loading.value = true
  try {
    const [pendingApps, contacts] = await Promise.all([
      fetchPendingApprovals(),
      fetchWecomContacts().catch(() => [])
    ])
    apps.value = pendingApps || []
    
    // 构建 userId -> WecomContact 映射
    const map: Record<number, WecomContact> = {}
    for (const c of (contacts || [])) {
      map[c.userId] = c
    }
    wecomContactMap.value = map
  } catch (e) {
    console.error('Failed to load pending approvals:', e)
  } finally {
    loading.value = false
  }
}

function getWecomInfo(userId: number) {
  return wecomContactMap.value[userId] || null
}

onMounted(loadData)
</script>

<style scoped>
.pending-approval {
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

/* 统计卡片 */
.stats-section {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
  margin-bottom: 20px;
}

.stat-card {
  background: #fff;
  border-radius: 8px;
  padding: 20px;
  display: flex;
  align-items: center;
  gap: 16px;
  border: 1px solid #e8e8e8;
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
.stat-icon.success { background: linear-gradient(135deg, #52c41a, #389e0d); }

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

.stat-label {
  font-size: 13px;
  color: #999;
}

/* 筛选栏 */
.filter-section {
  display: flex;
  gap: 16px;
  margin-bottom: 20px;
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

.applicant-cell {
  display: flex;
  align-items: center;
  gap: 8px;
}

.applicant-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.applicant-name {
  font-size: 14px;
  color: #333;
}

.applicant-wecom {
  font-size: 11px;
  color: #999;
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

/* 审批对话框 */
.approval-dialog-content {
  margin-bottom: 20px;
}

.app-summary {
  background: #fafafa;
  border-radius: 8px;
  padding: 16px;
  margin-bottom: 20px;
}

.summary-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
}

.summary-days {
  font-size: 18px;
  font-weight: 700;
  color: #1890ff;
}

.summary-info {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.info-item {
  display: flex;
  gap: 8px;
}

.info-label {
  font-size: 13px;
  color: #999;
  min-width: 70px;
}

.info-value {
  font-size: 13px;
  color: #333;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}
</style>
