<template>
  <div class="detail">
    <div class="page-header">
      <el-button @click="$router.back()" text>← 返回</el-button>
      <h2>{{ app?.typeName }}申请详情</h2>
    </div>

    <div v-if="app" class="content">
      <!-- Info card -->
      <div class="section info-card">
        <div class="info-grid">
          <div class="info-item"><label>申请编号</label><span>{{ app.appNo }}</span></div>
          <div class="info-item"><label>申请人</label><span>{{ app.applicantName }}</span></div>
          <div class="info-item"><label>假期类型</label>
            <el-tag size="small" effect="plain">{{ app.typeName }}</el-tag>
          </div>
          <div class="info-item"><label>天数</label><span class="days">{{ app.days }} 天</span></div>
          <div class="info-item"><label>日期</label><span>{{ app.startDate }} ~ {{ app.endDate }}</span></div>
          <div class="info-item"><label>当前状态</label><StatusBadge :status="app.status" /></div>
        </div>
        <div class="info-reason">
          <label>请假原因</label>
          <p>{{ app.reason }}</p>
        </div>
      </div>

      <!-- Approval Timeline -->
      <div class="section timeline-section">
        <h3>📋 审批流程</h3>
        <div class="timeline">
          <div v-for="(r, i) in records" :key="r.id" class="tl-node">
            <div class="tl-line" v-if="i > 0"></div>
            <div class="tl-icon" :class="r.action || 'pending'">
              <span v-if="r.action === 'approve'">✓</span>
              <span v-else-if="r.action === 'reject'">✕</span>
              <span v-else>○</span>
            </div>
            <div class="tl-content">
              <div class="tl-title">{{ r.approverName }}</div>
              <div class="tl-sub">{{ r.action === 'approve' ? '已通过' : r.action === 'reject' ? '已驳回' : '待审批' }}</div>
              <div class="tl-comment" v-if="r.comment">{{ r.comment }}</div>
              <div class="tl-time" v-if="r.approvedAt">{{ formatTime(r.approvedAt) }}</div>
            </div>
          </div>
        </div>
      </div>

      <!-- Actions -->
      <div class="section actions-section" v-if="app.status === 'pending' && isApprover">
        <h3>操作</h3>
        <div class="action-buttons">
          <el-input v-model="approveComment" placeholder="审批意见" type="textarea" :rows="2" style="max-width:400px" />
          <div style="display:flex;gap:12px;">
            <el-button type="success" size="large" @click="handleApprove" :loading="loading">
              <el-icon><Check /></el-icon> 通过
            </el-button>
            <el-button type="danger" size="large" @click="handleReject" :loading="loading">
              <el-icon><Close /></el-icon> 驳回
            </el-button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { Check, Close } from '@element-plus/icons-vue'
import { fetchApplication, fetchApprovalRecords, approveApplication, rejectApplication } from '@/api'
import StatusBadge from '@/components/StatusBadge.vue'

const route = useRoute()
const router = useRouter()
const app = ref<any>(null)
const records = ref<any[]>([])
const approveComment = ref('同意')
const loading = ref(false)

const currentUser = computed(() => {
  const u = localStorage.getItem('user')
  return u ? JSON.parse(u) : null
})

const isApprover = computed(() => {
  if (!currentUser.value || !records.value.length) return false
  return records.value.some(r => r.approverId === currentUser.value.id && !r.action)
})

onMounted(async () => {
  const id = Number(route.params.id)
  try {
    app.value = await fetchApplication(id)
    records.value = await fetchApprovalRecords(id)
  } catch (e) { console.error(e) }
})

async function handleApprove() {
  loading.value = true
  try {
    await approveApplication(app.value.id, approveComment.value)
    ElMessage.success('审批通过')
    router.push('/oa/pending')
  } catch (e: any) { ElMessage.error(e?.response?.data?.message || '操作失败') }
  finally { loading.value = false }
}

async function handleReject() {
  if (!approveComment.value) { ElMessage.warning('请填写驳回理由'); return }
  loading.value = true
  try {
    await rejectApplication(app.value.id, approveComment.value)
    ElMessage.success('已驳回')
    router.push('/oa/pending')
  } catch (e: any) { ElMessage.error(e?.response?.data?.message || '操作失败') }
  finally { loading.value = false }
}

function formatTime(t: string) {
  if (!t) return ''
  const d = new Date(t)
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')} ${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`
}
</script>

<style scoped>
.detail { max-width: 800px; }
.page-header { margin-bottom: 24px; display: flex; align-items: center; gap: 12px; }
.page-header h2 { font-size: 20px; color: #1a1a2e; }

.section { background: #fff; border-radius: 10px; padding: 24px; margin-bottom: 20px; border: 1px solid #f0f0f0; }
.section h3 { font-size: 15px; color: #333; margin-bottom: 16px; }

.info-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; margin-bottom: 16px; }
.info-item { display: flex; flex-direction: column; gap: 4px; }
.info-item label { font-size: 12px; color: #999; }
.info-item span { font-size: 14px; color: #333; font-weight: 500; }
.info-item .days { font-size: 18px; font-weight: 700; color: #1890ff; }
.info-reason { border-top: 1px solid #f0f0f0; padding-top: 16px; }
.info-reason label { font-size: 12px; color: #999; display: block; margin-bottom: 4px; }
.info-reason p { font-size: 14px; color: #333; line-height: 1.6; }

/* Timeline */
.timeline { position: relative; }
.tl-node { display: flex; gap: 14px; position: relative; }
.tl-icon {
  width: 28px; height: 28px; border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  font-size: 14px; font-weight: 700; flex-shrink: 0;
  background: #f0f0f0; color: #999; z-index: 1;
}
.tl-icon.approve { background: #f6ffed; color: #52c41a; }
.tl-icon.reject { background: #fff2f0; color: #ff4d4f; }
.tl-content { flex: 1; padding-bottom: 20px; }
.tl-title { font-size: 14px; font-weight: 600; color: #333; }
.tl-sub { font-size: 12px; color: #999; margin-top: 2px; }
.tl-comment { font-size: 13px; color: #666; margin-top: 4px; background: #fafafa; padding: 6px 10px; border-radius: 4px; }
.tl-time { font-size: 12px; color: #bbb; margin-top: 4px; }

.actions-section .action-buttons { display: flex; flex-direction: column; gap: 12px; }
</style>
