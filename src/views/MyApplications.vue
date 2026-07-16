<template>
  <div class="my-apps">
    <div class="page-header">
      <h2>📄 我的申请</h2>
      <span class="header-sub">查看所有发起的审批申请</span>
    </div>

    <div class="section">
      <div class="toolbar">
        <el-radio-group v-model="filter" size="default">
          <el-radio-button value="all">全部</el-radio-button>
          <el-radio-button value="pending">审批中</el-radio-button>
          <el-radio-button value="approved">已通过</el-radio-button>
          <el-radio-button value="rejected">已驳回</el-radio-button>
          <el-radio-button value="cancelled">已撤回</el-radio-button>
        </el-radio-group>
        <el-button type="primary" @click="$router.push('/oa/create')">
          <el-icon><Plus /></el-icon> 发起审批
        </el-button>
      </div>

      <el-table :data="filteredApps" style="width:100%" @row-click="(row: any) => $router.push(`/oa/detail/${row.id}`)">
        <el-table-column prop="appNo" label="编号" width="170" />
        <el-table-column prop="typeName" label="类型" width="90">
          <template #default="{ row }">
            <el-tag size="small" effect="plain">{{ row.typeName }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="reason" label="原因" show-overflow-tooltip />
        <el-table-column prop="days" label="天数" width="70" />
        <el-table-column prop="startDate" label="开始" width="110" />
        <el-table-column prop="endDate" label="结束" width="110" />
        <el-table-column prop="status" label="状态" width="100">
          <template #default="{ row }">
            <StatusBadge :status="row.status" />
          </template>
        </el-table-column>
        <el-table-column label="操作" width="120" fixed="right">
          <template #default="{ row }">
            <el-button v-if="row.status === 'pending'" type="warning" size="small"
              @click.stop="handleCancel(row)">撤回</el-button>
            <el-button size="small" @click.stop="$router.push(`/oa/detail/${row.id}`)">详情</el-button>
          </template>
        </el-table-column>
      </el-table>

      <el-empty v-if="filteredApps.length === 0" description="暂无申请" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus } from '@element-plus/icons-vue'
import { fetchMyApplications, cancelApplication } from '@/api'
import StatusBadge from '@/components/StatusBadge.vue'

const filter = ref('all')
const apps = ref<any[]>([])

const filteredApps = computed(() => {
  if (filter.value === 'all') return apps.value
  return apps.value.filter(a => a.status === filter.value)
})

async function loadData() {
  try { apps.value = await fetchMyApplications() } catch (e) {}
}

async function handleCancel(row: any) {
  try {
    await ElMessageBox.confirm('确认撤回该申请？', '提示', { type: 'warning' })
    await cancelApplication(row.id)
    ElMessage.success('已撤回')
    loadData()
  } catch (e) {}
}

onMounted(loadData)
</script>

<style scoped>
.my-apps { max-width: 1100px; }
.page-header { margin-bottom: 24px; }
.page-header h2 { font-size: 22px; color: #1a1a2e; margin-bottom: 4px; }
.header-sub { font-size: 13px; color: #999; }
.section { background: #fff; border-radius: 10px; padding: 20px 24px; border: 1px solid #f0f0f0; }
.toolbar { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }
</style>
