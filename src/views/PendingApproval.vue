<template>
  <div class="pending">
    <div class="page-header">
      <h2>⏳ 待我审批</h2>
      <span class="header-sub">需要您处理的审批申请</span>
    </div>

    <div class="section">
      <el-table :data="apps" style="width:100%" highlight-current-row>
        <el-table-column prop="appNo" label="编号" width="170" />
        <el-table-column prop="applicantName" label="申请人" width="100" />
        <el-table-column prop="typeName" label="类型" width="90">
          <template #default="{ row }">
            <el-tag size="small" effect="plain">{{ row.typeName }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="reason" label="原因" show-overflow-tooltip />
        <el-table-column prop="days" label="天数" width="70" align="center" />
        <el-table-column prop="startDate" label="开始" width="110" />
        <el-table-column prop="endDate" label="结束" width="110" />
        <el-table-column prop="createdAt" label="提交时间" width="160">
          <template #default="{ row }">{{ formatTime(row.createdAt) }}</template>
        </el-table-column>
        <el-table-column label="操作" width="220" fixed="right">
          <template #default="{ row }">
            <el-button type="success" size="small" @click.stop="handleApprove(row)">通过</el-button>
            <el-button type="danger" size="small" @click.stop="handleReject(row)">驳回</el-button>
            <el-button size="small" @click.stop="$router.push(`/oa/detail/${row.id}`)">详情</el-button>
          </template>
        </el-table-column>
      </el-table>
      <el-empty v-if="apps.length === 0" description="暂无待审批申请 🎉" />
    </div>

    <!-- Approve dialog -->
    <el-dialog v-model="dialogVisible" :title="dialogTitle" width="460px" :teleported="false">
      <el-input v-model="comment" type="textarea" :rows="3" placeholder="审批意见（可选）" />
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="confirmAction" :loading="loading">确认</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { fetchPendingApprovals, approveApplication, rejectApplication } from '@/api'

const apps = ref<any[]>([])
const dialogVisible = ref(false)
const comment = ref('')
const loading = ref(false)
const dialogTitle = ref('')
const currentRow = ref<any>(null)
const actionType = ref<'approve' | 'reject'>('approve')

async function loadData() {
  try { apps.value = await fetchPendingApprovals() } catch (e) {}
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
  loading.value = true
  try {
    if (actionType.value === 'approve') {
      await approveApplication(currentRow.value.id, comment.value)
      ElMessage.success('已通过')
    } else {
      if (!comment.value) { ElMessage.warning('请填写驳回理由'); loading.value = false; return }
      await rejectApplication(currentRow.value.id, comment.value)
      ElMessage.success('已驳回')
    }
    dialogVisible.value = false
    loadData()
  } catch (e: any) {
    ElMessage.error(e?.response?.data?.message || '操作失败')
  } finally {
    loading.value = false
  }
}

function formatTime(t: string) {
  if (!t) return ''
  const d = new Date(t)
  return `${d.getMonth()+1}/${d.getDate()} ${d.getHours()}:${String(d.getMinutes()).padStart(2,'0')} ${d.getFullYear()}`
}

onMounted(loadData)
</script>

<style scoped>
.pending { max-width: 1100px; }
.page-header { margin-bottom: 24px; }
.page-header h2 { font-size: 22px; color: #1a1a2e; margin-bottom: 4px; }
.header-sub { font-size: 13px; color: #999; }
.section { background: #fff; border-radius: 10px; padding: 20px 24px; border: 1px solid #f0f0f0; }
</style>
