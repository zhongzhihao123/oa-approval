<template>
  <div class="approval-detail">
    <!-- 页面标题 -->
    <div class="page-header">
      <div class="header-left">
        <el-button text @click="$router.back()">
          <el-icon><ArrowLeft /></el-icon>
          返回
        </el-button>
        <div class="header-title">
          <h2>申请详情</h2>
          <p>查看申请详细信息和审批进度</p>
        </div>
      </div>
      <div class="header-right" v-if="app?.status === 'pending' && isApprover">
        <el-button type="success" @click="handleApprove">
          <el-icon><Check /></el-icon>
          通过
        </el-button>
        <el-button type="danger" @click="handleReject">
          <el-icon><Close /></el-icon>
          驳回
        </el-button>
      </div>
    </div>

    <div v-if="loading" class="loading-section">
      <el-skeleton :rows="8" animated />
    </div>

    <div v-else-if="app" class="content-section">
      <!-- 申请信息卡片 -->
      <div class="section">
        <div class="section-header">
          <h3>申请信息</h3>
          <StatusBadge :status="app.status" />
        </div>
        
        <div class="info-grid">
          <div class="info-item">
            <span class="info-label">申请编号</span>
            <span class="info-value app-no">{{ app.appNo }}</span>
          </div>
          <div class="info-item">
            <span class="info-label">申请人</span>
            <span class="info-value">
              <div class="applicant-info">
                <el-avatar :size="24" :icon="UserFilled" />
                <span>{{ app.applicantName }}</span>
              </div>
            </span>
          </div>
          <div class="info-item">
            <span class="info-label">假期类型</span>
            <span class="info-value">
              <el-tag :type="getLeaveTagType(app.typeName)" effect="light">
                {{ app.typeName }}
              </el-tag>
            </span>
          </div>
          <div class="info-item">
            <span class="info-label">请假天数</span>
            <span class="info-value days">{{ app.days }}天</span>
          </div>
          <div class="info-item">
            <span class="info-label">开始日期</span>
            <span class="info-value">{{ app.startDate }}</span>
          </div>
          <div class="info-item">
            <span class="info-label">结束日期</span>
            <span class="info-value">{{ app.endDate }}</span>
          </div>
          <div class="info-item full-width">
            <span class="info-label">请假原因</span>
            <span class="info-value reason">{{ app.reason }}</span>
          </div>
          <div class="info-item" v-if="app.attachmentUrl">
            <span class="info-label">附件材料</span>
            <span class="info-value">
              <el-button text type="primary" size="small">
                <el-icon><Paperclip /></el-icon>
                查看附件
              </el-button>
            </span>
          </div>
          <div class="info-item">
            <span class="info-label">提交时间</span>
            <span class="info-value">{{ formatTime(app.createdAt) }}</span>
          </div>
        </div>
      </div>

      <!-- 审批流程 -->
      <div class="section">
        <div class="section-header">
          <h3>审批流程</h3>
          <span class="step-info">第 {{ app.currentStep }} 步，共 {{ app.totalSteps }} 步</span>
        </div>
        
        <div class="timeline">
          <div 
            v-for="(record, index) in records" 
            :key="record.id" 
            class="timeline-item"
            :class="{ 
              'is-first': index === 0,
              'is-last': index === records.length - 1,
              'is-current': !record.action,
              'is-completed': record.action === 'approve',
              'is-rejected': record.action === 'reject'
            }"
          >
            <div class="timeline-dot">
              <el-icon v-if="record.action === 'approve'" :size="16"><Check /></el-icon>
              <el-icon v-else-if="record.action === 'reject'" :size="16"><Close /></el-icon>
              <el-icon v-else :size="16"><Clock /></el-icon>
            </div>
            
            <div class="timeline-content">
              <div class="timeline-header">
                <div class="timeline-title-section">
                  <span class="timeline-title">{{ record.approverName }}</span>
                  <span class="timeline-wecom-info" v-if="getWecomInfo(record.approverId)">
                    {{ getWecomInfo(record.approverId)?.wecomDepartment }}
                    <span v-if="getWecomInfo(record.approverId)?.wecomPosition"> · {{ getWecomInfo(record.approverId)?.wecomPosition }}
                    </span>
                    <el-tag size="small" type="info" style="margin-left: 6px;">企微</el-tag>
                  </span>
                </div>
                <span class="timeline-status">
                  <el-tag 
                    :type="getActionTagType(record.action)" 
                    size="small" 
                    effect="light"
                  >
                    {{ getActionText(record.action) }}
                  </el-tag>
                </span>
              </div>
              
              <div class="timeline-body" v-if="record.comment">
                <div class="comment-box">
                  <el-icon><ChatDotRound /></el-icon>
                  <span>{{ record.comment }}</span>
                </div>
              </div>
              
              <div class="timeline-footer">
                <span class="timeline-time" v-if="record.approvedAt">
                  {{ formatTime(record.approvedAt) }}
                </span>
                <span class="timeline-pending" v-else>
                  等待审批...
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 操作区域 -->
      <div class="section action-section" v-if="app.status === 'pending' && isApprover">
        <div class="section-header">
          <h3>审批操作</h3>
        </div>
        
        <div class="action-form">
          <el-form-item label="审批意见" :required="actionType === 'reject'">
            <el-input
              v-model="approveComment"
              type="textarea"
              :rows="3"
              :placeholder="actionType === 'approve' ? '请输入审批意见（可选）' : '请输入驳回理由（必填）'"
              show-word-limit
              maxlength="200"
            />
          </el-form-item>
          
          <div class="action-buttons">
            <el-button 
              type="success" 
              size="large"
              @click="handleApprove"
              :loading="submitting"
            >
              <el-icon><Check /></el-icon>
              通过申请
            </el-button>
            <el-button 
              type="danger" 
              size="large"
              @click="handleReject"
              :loading="submitting"
            >
              <el-icon><Close /></el-icon>
              驳回申请
            </el-button>
          </div>
        </div>
      </div>
    </div>

    <!-- 审批对话框 -->
    <el-dialog 
      v-model="dialogVisible" 
      :title="dialogTitle" 
      width="500px"
      :close-on-click-modal="false"
    >
      <div class="approval-dialog-content">
        <el-form-item label="审批意见" :required="actionType === 'reject'">
          <el-input
            v-model="dialogComment"
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
            :loading="submitting"
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
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { 
  ArrowLeft, Check, Close, Clock, Paperclip, 
  UserFilled, ChatDotRound 
} from '@element-plus/icons-vue'
import { 
  fetchApplication, 
  fetchApprovalRecords, 
  approveApplication, 
  rejectApplication,
  fetchWecomContacts,
  WecomContact
} from '@/api'
import StatusBadge from '@/components/StatusBadge.vue'

const route = useRoute()
const router = useRouter()

const loading = ref(false)
const submitting = ref(false)
const app = ref<any>(null)
const records = ref<any[]>([])
const approveComment = ref('同意')
const wecomContacts = ref<WecomContact[]>([])
const wecomContactMap = ref<Record<number, WecomContact>>({})

const dialogVisible = ref(false)
const dialogTitle = ref('')
const dialogComment = ref('')
const actionType = ref<'approve' | 'reject'>('approve')

const currentUser = computed(() => {
  try {
    const user = localStorage.getItem('user')
    return user ? JSON.parse(user) : null
  } catch { return null }
})

const isApprover = computed(() => {
  if (!currentUser.value || !records.value.length) return false
  return records.value.some(r => r.approverId === currentUser.value.id && !r.action)
})

function getLeaveTagType(typeName: string) {
  const map: Record<string, string> = {
    '年假': 'success', '事假': 'warning', '病假': 'danger',
    '婚假': 'primary', '产假': 'info', '调休': ''
  }
  return map[typeName] || 'info'
}

function getActionTagType(action: string) {
  const map: Record<string, string> = {
    'approve': 'success', 'reject': 'danger', '': 'warning'
  }
  return map[action] || 'info'
}

function getActionText(action: string) {
  const map: Record<string, string> = {
    'approve': '已通过', 'reject': '已驳回', '': '待审批'
  }
  return map[action] || '待审批'
}

function formatTime(t: string) {
  if (!t) return ''
  const d = new Date(t)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

function handleApprove() {
  actionType.value = 'approve'
  dialogTitle.value = '审批通过'
  dialogComment.value = '同意'
  dialogVisible.value = true
}

function handleReject() {
  actionType.value = 'reject'
  dialogTitle.value = '审批驳回'
  dialogComment.value = ''
  dialogVisible.value = true
}

async function confirmAction() {
  if (!app.value) return
  
  if (actionType.value === 'reject' && !dialogComment.value.trim()) {
    ElMessage.warning('请填写驳回理由')
    return
  }

  submitting.value = true
  try {
    if (actionType.value === 'approve') {
      await approveApplication(app.value.id, dialogComment.value)
      ElMessage.success('审批已通过')
    } else {
      await rejectApplication(app.value.id, dialogComment.value)
      ElMessage.success('申请已驳回')
    }
    
    dialogVisible.value = false
    router.push('/oa/pending')
  } catch (e: any) {
    ElMessage.error(e?.response?.data?.message || '操作失败')
  } finally {
    submitting.value = false
  }
}

async function loadData() {
  const id = Number(route.params.id)
  if (!id) return
  
  loading.value = true
  try {
    const [appData, recordsData, contacts] = await Promise.all([
      fetchApplication(id),
      fetchApprovalRecords(id),
      fetchWecomContacts().catch(() => [])
    ])
    app.value = appData
    records.value = recordsData
    wecomContacts.value = contacts || []
    
    // 构建 userId -> WecomContact 映射
    const map: Record<number, WecomContact> = {}
    for (const c of wecomContacts.value) {
      map[c.userId] = c
    }
    wecomContactMap.value = map
  } catch (e) {
    console.error('Failed to load application detail:', e)
    ElMessage.error('加载申请详情失败')
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
.approval-detail {
  max-width: 1000px;
  margin: 0 auto;
}

/* 页面标题 */
.page-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 24px;
}

.header-left {
  display: flex;
  align-items: flex-start;
  gap: 16px;
}

.header-title h2 {
  font-size: 20px;
  font-weight: 600;
  color: #1a1a2e;
  margin-bottom: 4px;
}

.header-title p {
  font-size: 14px;
  color: #999;
}

/* 加载状态 */
.loading-section {
  background: #fff;
  border-radius: 8px;
  padding: 40px;
  border: 1px solid #e8e8e8;
}

/* 区块 */
.section {
  background: #fff;
  border-radius: 8px;
  padding: 24px;
  margin-bottom: 20px;
  border: 1px solid #e8e8e8;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  padding-bottom: 16px;
  border-bottom: 1px solid #f0f0f0;
}

.section-header h3 {
  font-size: 16px;
  font-weight: 600;
  color: #1a1a2e;
}

.step-info {
  font-size: 13px;
  color: #999;
}

/* 信息网格 */
.info-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 20px;
}

.info-item {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.info-item.full-width {
  grid-column: span 3;
}

.info-label {
  font-size: 13px;
  color: #999;
}

.info-value {
  font-size: 14px;
  color: #333;
  font-weight: 500;
}

.info-value.app-no {
  font-family: 'SF Mono', 'Monaco', 'Consolas', monospace;
  color: #1890ff;
}

.info-value.days {
  font-size: 18px;
  font-weight: 700;
  color: #1890ff;
}

.info-value.reason {
  line-height: 1.6;
  background: #fafafa;
  padding: 12px;
  border-radius: 6px;
}

.applicant-info {
  display: flex;
  align-items: center;
  gap: 8px;
}

/* 时间线 */
.timeline {
  position: relative;
  padding-left: 24px;
}

.timeline::before {
  content: '';
  position: absolute;
  left: 11px;
  top: 0;
  bottom: 0;
  width: 2px;
  background: #e8e8e8;
}

.timeline-item {
  position: relative;
  padding-bottom: 24px;
}

.timeline-item.is-last {
  padding-bottom: 0;
}

.timeline-dot {
  position: absolute;
  left: -24px;
  top: 0;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: #fff;
  border: 2px solid #e8e8e8;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1;
}

.timeline-item.is-completed .timeline-dot {
  background: #f6ffed;
  border-color: #52c41a;
  color: #52c41a;
}

.timeline-item.is-rejected .timeline-dot {
  background: #fff2f0;
  border-color: #ff4d4f;
  color: #ff4d4f;
}

.timeline-item.is-current .timeline-dot {
  background: #fff7e6;
  border-color: #faad14;
  color: #faad14;
}

.timeline-content {
  background: #fafafa;
  border-radius: 8px;
  padding: 16px;
}

.timeline-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.timeline-title {
  font-size: 14px;
  font-weight: 600;
  color: #333;
}

.timeline-title-section {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.timeline-wecom-info {
  font-size: 12px;
  color: #999;
  font-weight: normal;
}

.timeline-body {
  margin-bottom: 12px;
}

.comment-box {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  padding: 12px;
  background: #fff;
  border-radius: 6px;
  border: 1px solid #e8e8e8;
}

.comment-box .el-icon {
  color: #1890ff;
  margin-top: 2px;
}

.comment-box span {
  font-size: 13px;
  color: #666;
  line-height: 1.5;
}

.timeline-footer {
  font-size: 12px;
  color: #999;
}

.timeline-pending {
  color: #faad14;
  font-style: italic;
}

/* 操作区域 */
.action-section {
  background: #f6ffed;
  border-color: #b7eb8f;
}

.action-form {
  max-width: 600px;
}

.action-buttons {
  display: flex;
  gap: 16px;
  margin-top: 20px;
}

/* 审批对话框 */
.approval-dialog-content {
  margin-bottom: 20px;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}
</style>
