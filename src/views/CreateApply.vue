<template>
  <div class="create-apply">
    <div class="page-header">
      <h2>✍️ 发起审批</h2>
      <span class="header-sub">选择假期类型，填写请假信息</span>
    </div>

    <!-- Step 1: Choose leave type -->
    <div class="section" v-if="step === 1">
      <h3>选择假期类型</h3>
      <div class="type-grid">
        <div v-for="t in leaveTypes" :key="t.id" class="type-card"
          :class="{ selected: selectedType?.id === t.id }"
          @click="selectedType = t">
          <span class="type-icon">{{ t.icon }}</span>
          <span class="type-name">{{ t.name }}</span>
          <span v-if="t.maxDaysPerYear > 0" class="type-limit">每年{{ t.maxDaysPerYear }}天</span>
        </div>
      </div>
      <el-button type="primary" size="large" :disabled="!selectedType" @click="step = 2" style="margin-top:20px">
        下一步 → 填写信息
      </el-button>
    </div>

    <!-- Step 2: Fill form -->
    <div class="section form-section" v-if="step === 2">
      <div class="form-header">
        <el-button @click="step = 1" text>← 返回选择类型</el-button>
        <span class="selected-type-badge" v-if="selectedType">{{ selectedType.icon }} {{ selectedType.name }}</span>
      </div>
      <el-form ref="formRef" :model="form" :rules="rules" label-width="100px" size="large" style="max-width:600px">
        <el-form-item label="开始日期" prop="startDate">
          <el-date-picker v-model="form.startDate" type="date" placeholder="选择开始日期" style="width:100%"
            :disabled-date="disabledPastDate" />
        </el-form-item>
        <el-form-item label="结束日期" prop="endDate">
          <el-date-picker v-model="form.endDate" type="date" placeholder="选择结束日期" style="width:100%"
            :disabled-date="disabledPastDate" />
        </el-form-item>
        <el-form-item label="请假天数">
          <span class="days-display">{{ computedDays }} 天</span>
        </el-form-item>
        <el-form-item label="请假原因" prop="reason">
          <el-input v-model="form.reason" type="textarea" :rows="3" placeholder="请详细说明请假原因" />
        </el-form-item>
        <el-form-item label="附件" v-if="selectedType?.needAttachment">
          <el-upload action="#" :auto-upload="false" :limit="3">
            <el-button type="primary" plain>上传附件</el-button>
            <template #tip><div class="el-upload__tip">{{ selectedType?.name }}需要提供证明材料</div></template>
          </el-upload>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="submitApply" :loading="submitting" size="large">提交申请</el-button>
          <el-button @click="step = 1">取消</el-button>
        </el-form-item>
      </el-form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { fetchLeaveTypes, createApplication, LeaveType } from '@/api'
import dayjs from 'dayjs'

const router = useRouter()
const step = ref(1)
const selectedType = ref<LeaveType | null>(null)
const leaveTypes = ref<LeaveType[]>([])
const submitting = ref(false)

const form = ref({ startDate: '', endDate: '', reason: '' })

const rules = {
  startDate: [{ required: true, message: '请选择开始日期', trigger: 'change' }],
  endDate: [{ required: true, message: '请选择结束日期', trigger: 'change' }],
  reason: [{ required: true, message: '请填写请假原因', trigger: 'blur' }],
}

const computedDays = computed(() => {
  if (!form.value.startDate || !form.value.endDate) return 0
  const s = dayjs(form.value.startDate), e = dayjs(form.value.endDate)
  if (e.isBefore(s)) return 0
  return e.diff(s, 'day') + 1
})

function disabledPastDate(date: Date) {
  return dayjs(date).isBefore(dayjs(), 'day')
}

async function submitApply() {
  if (!selectedType.value) return
  submitting.value = true
  try {
    const data = {
      typeId: selectedType.value.id,
      typeName: selectedType.value.name,
      startDate: dayjs(form.value.startDate).format('YYYY-MM-DD'),
      endDate: dayjs(form.value.endDate).format('YYYY-MM-DD'),
      days: computedDays.value,
      reason: form.value.reason,
      attachmentUrl: null,
    }
    await createApplication(data)
    ElMessage.success('申请提交成功！')
    router.push('/oa/my')
  } catch (e: any) {
    ElMessage.error(e?.response?.data?.message || '提交失败')
  } finally {
    submitting.value = false
  }
}

onMounted(async () => {
  try {
    leaveTypes.value = await fetchLeaveTypes()
  } catch (e) { console.error(e) }
})
</script>

<style scoped>
.create-apply { max-width: 800px; }
.page-header { margin-bottom: 24px; }
.page-header h2 { font-size: 22px; color: #1a1a2e; margin-bottom: 4px; }
.header-sub { font-size: 13px; color: #999; }

.section { background: #fff; border-radius: 10px; padding: 24px; border: 1px solid #f0f0f0; }
.section h3 { font-size: 15px; color: #333; margin-bottom: 16px; }

.type-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; }
.type-card {
  display: flex; flex-direction: column; align-items: center; gap: 8px;
  padding: 20px 12px; border: 2px solid #f0f0f0; border-radius: 10px;
  cursor: pointer; transition: all 0.2s;
}
.type-card:hover { border-color: #b3d8ff; }
.type-card.selected { border-color: #1890ff; background: #e6f7ff; }
.type-icon { font-size: 32px; }
.type-name { font-size: 14px; font-weight: 600; color: #333; }
.type-limit { font-size: 12px; color: #999; }

.form-section { margin-top: 0; }
.form-header { margin-bottom: 24px; display: flex; align-items: center; gap: 12px; }
.selected-type-badge {
  font-size: 14px; font-weight: 600; color: #1890ff;
  background: #e6f7ff; padding: 4px 12px; border-radius: 6px;
}
.days-display {
  font-size: 18px; font-weight: 700; color: #1890ff;
  background: #e6f7ff; padding: 4px 16px; border-radius: 6px;
}
</style>
