<template>
  <div class="create-apply">
    <!-- 页面标题 -->
    <div class="page-header">
      <div class="header-left">
        <el-button text @click="$router.back()">
          <el-icon><ArrowLeft /></el-icon>
          返回
        </el-button>
        <div class="header-title">
          <h2>发起请假申请</h2>
          <p>选择假期类型，填写请假信息</p>
        </div>
      </div>
    </div>

    <!-- 步骤条 -->
    <div class="steps-section">
      <el-steps :active="currentStep" finish-status="success" align-center>
        <el-step title="选择假期类型" description="选择请假类型" />
        <el-step title="填写申请信息" description="填写详细信息" />
        <el-step title="提交申请" description="等待审批" />
      </el-steps>
    </div>

    <!-- 步骤1: 选择假期类型 -->
    <div class="section" v-if="currentStep === 1">
      <div class="section-header">
        <h3>选择假期类型</h3>
        <p>请选择您需要申请的假期类型</p>
      </div>
      
      <div class="type-grid">
        <div 
          v-for="item in leaveTypes" 
          :key="item.id" 
          class="type-card"
          :class="{ selected: selectedType?.id === item.id }"
          @click="selectType(item)"
        >
          <div class="type-icon" :class="getTypeClass(item.name)">
            <el-icon :size="24"><component :is="getTypeIcon(item.name)" /></el-icon>
          </div>
          <div class="type-info">
            <div class="type-name">{{ item.name }}</div>
            <div class="type-desc">
              <span v-if="item.maxDaysPerYear > 0">每年{{ item.maxDaysPerYear }}天</span>
              <span v-else>不限天数</span>
            </div>
            <div class="type-limit" v-if="item.needAttachment">
              <el-icon><Paperclip /></el-icon>
              需要附件证明
            </div>
          </div>
          <el-icon v-if="selectedType?.id === item.id" class="type-check" :size="20"><CircleCheck /></el-icon>
        </div>
      </div>
    </div>

    <!-- 步骤2: 填写表单 -->
    <div class="section" v-if="currentStep === 2">
      <div class="section-header">
        <h3>填写申请信息</h3>
        <p>请如实填写请假信息</p>
      </div>

      <div class="form-wrapper">
        <el-form 
          ref="formRef" 
          :model="form" 
          :rules="rules" 
          label-width="100px" 
          label-position="top"
          size="large"
        >
          <!-- 已选类型显示 -->
          <div class="selected-type-info">
            <el-tag :type="getTypeTagType(selectedType?.name || '')" size="large" effect="light">
              {{ selectedType?.name }}
            </el-tag>
            <span v-if="selectedType?.maxDaysPerYear" class="type-limit-text">
              年度额度: {{ selectedType.maxDaysPerYear }}天
            </span>
          </div>

          <el-row :gutter="24">
            <el-col :span="12">
              <el-form-item label="开始日期" prop="startDate">
                <el-date-picker
                  v-model="form.startDate"
                  type="date"
                  placeholder="请选择开始日期"
                  style="width: 100%"
                  :disabled-date="disabledStartDate"
                  format="YYYY-MM-DD"
                  value-format="YYYY-MM-DD"
                />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="结束日期" prop="endDate">
                <el-date-picker
                  v-model="form.endDate"
                  type="date"
                  placeholder="请选择结束日期"
                  style="width: 100%"
                  :disabled-date="disabledEndDate"
                  format="YYYY-MM-DD"
                  value-format="YYYY-MM-DD"
                />
              </el-form-item>
            </el-col>
          </el-row>

          <el-form-item label="请假天数">
            <div class="days-display">
              <span class="days-number">{{ computedDays }}</span>
              <span class="days-unit">天</span>
            </div>
          </el-form-item>

          <el-form-item label="请假原因" prop="reason">
            <el-input
              v-model="form.reason"
              type="textarea"
              :rows="4"
              placeholder="请详细说明请假原因，如：家中有事需要处理、身体不适需要就医等"
              show-word-limit
              maxlength="500"
            />
          </el-form-item>

          <el-form-item label="附件材料" v-if="selectedType?.needAttachment">
            <el-upload
              class="upload-area"
              drag
              action="#"
              :auto-upload="false"
              :limit="3"
              :on-exceed="handleExceed"
            >
              <el-icon class="el-icon--upload"><Upload /></el-icon>
              <div class="el-upload__text">
                将文件拖到此处，或<em>点击上传</em>
              </div>
              <template #tip>
                <div class="el-upload__tip">
                  {{ selectedType?.name }}需要提供证明材料（如病历、结婚证等）
                </div>
              </template>
            </el-upload>
          </el-form-item>

          <!-- 审批人信息 -->
          <div class="approver-section" v-if="myApprover">
            <div class="approver-label">
              <el-icon><User /></el-icon>
              <span>审批人</span>
            </div>
            <div class="approver-card">
              <el-avatar :size="40" :src="myApprover.wecomAvatar || undefined" :icon="UserFilled" />
              <div class="approver-info">
                <div class="approver-name">{{ myApprover.approverName }}</div>
                <div class="approver-detail">
                  <span v-if="myApprover.wecomDepartment">{{ myApprover.wecomDepartment }}</span>
                  <span v-if="myApprover.wecomPosition"> · {{ myApprover.wecomPosition }}</span>
                </div>
              </div>
              <div class="approver-tag">
                <el-tag size="small" type="info">企微联系人</el-tag>
              </div>
            </div>
            <div class="approver-notify-tip">
              <el-icon><Bell /></el-icon>
              提交后将通过企业微信通知审批人
            </div>
          </div>
        </el-form>
      </div>
    </div>

    <!-- 步骤3: 确认提交 -->
    <div class="section" v-if="currentStep === 3">
      <div class="section-header">
        <h3>确认申请信息</h3>
        <p>请核对以下信息无误后提交</p>
      </div>

      <div class="confirm-card">
        <div class="confirm-header">
          <el-tag :type="getTypeTagType(selectedType?.name || '')" size="large" effect="light">
            {{ selectedType?.name }}
          </el-tag>
          <span class="confirm-days">{{ computedDays }}天</span>
        </div>
        
        <el-descriptions :column="2" border>
          <el-descriptions-item label="假期类型">{{ selectedType?.name }}</el-descriptions-item>
          <el-descriptions-item label="请假天数">{{ computedDays }}天</el-descriptions-item>
          <el-descriptions-item label="开始日期">{{ form.startDate }}</el-descriptions-item>
          <el-descriptions-item label="结束日期">{{ form.endDate }}</el-descriptions-item>
          <el-descriptions-item label="请假原因" :span="2">{{ form.reason }}</el-descriptions-item>
          <el-descriptions-item label="审批人" :span="2" v-if="myApprover">
            <div style="display: flex; align-items: center; gap: 8px;">
              <el-avatar :size="24" :icon="UserFilled" />
              <span>{{ myApprover.approverName }}</span>
              <span v-if="myApprover.wecomDepartment" style="color: #999; font-size: 12px;">
                {{ myApprover.wecomDepartment }}{{ myApprover.wecomPosition ? ' · ' + myApprover.wecomPosition : '' }}
              </span>
            </div>
          </el-descriptions-item>
        </el-descriptions>

        <div class="confirm-actions">
          <el-button @click="currentStep = 2">上一步</el-button>
          <el-button type="primary" @click="submitApply" :loading="submitting">
            <el-icon><Check /></el-icon>
            提交申请
          </el-button>
        </div>
      </div>
    </div>

    <!-- 底部按钮 -->
    <div class="form-actions" v-if="currentStep < 3">
      <el-button v-if="currentStep > 1" @click="currentStep--">上一步</el-button>
      <el-button type="primary" @click="nextStep" :disabled="!canNext">
        {{ currentStep === 2 ? '下一步' : '下一步' }}
        <el-icon><ArrowRight /></el-icon>
      </el-button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { 
  ArrowLeft, ArrowRight, Check, Upload, Paperclip, 
  CircleCheck, Calendar, Clock, Warning, Document, User, UserFilled, Bell
} from '@element-plus/icons-vue'
import { fetchLeaveTypes, createApplication, fetchMyApprover, LeaveType, MyApprover } from '@/api'
import dayjs from 'dayjs'

const router = useRouter()
const currentStep = ref(1)
const selectedType = ref<LeaveType | null>(null)
const leaveTypes = ref<LeaveType[]>([])
const submitting = ref(false)
const formRef = ref()

const form = ref({
  startDate: '',
  endDate: '',
  reason: ''
})

const myApprover = ref<MyApprover | null>(null)

const rules = {
  startDate: [{ required: true, message: '请选择开始日期', trigger: 'change' }],
  endDate: [{ required: true, message: '请选择结束日期', trigger: 'change' }],
  reason: [
    { required: true, message: '请填写请假原因', trigger: 'blur' },
    { min: 10, message: '请假原因至少10个字符', trigger: 'blur' }
  ]
}

const computedDays = computed(() => {
  if (!form.value.startDate || !form.value.endDate) return 0
  const start = dayjs(form.value.startDate)
  const end = dayjs(form.value.endDate)
  if (end.isBefore(start)) return 0
  return end.diff(start, 'day') + 1
})

const canNext = computed(() => {
  if (currentStep.value === 1) return !!selectedType.value
  if (currentStep.value === 2) {
    return form.value.startDate && form.value.endDate && form.value.reason && computedDays.value > 0
  }
  return false
})

function selectType(item: LeaveType) {
  selectedType.value = item
}

function getTypeClass(name: string) {
  const map: Record<string, string> = {
    '年假': 'primary', '事假': 'warning', '病假': 'danger',
    '婚假': 'success', '产假': 'info', '调休': 'default'
  }
  return map[name] || 'default'
}

function getTypeIcon(name: string) {
  const map: Record<string, any> = {
    '年假': Calendar, '事假': Document, '病假': Warning,
    '婚假': CircleCheck, '产假': Clock, '调休': Clock
  }
  return map[name] || Calendar
}

function getTypeTagType(name: string) {
  const map: Record<string, string> = {
    '年假': 'success', '事假': 'warning', '病假': 'danger',
    '婚假': 'primary', '产假': 'info', '调休': ''
  }
  return map[name] || 'info'
}

function disabledStartDate(date: Date) {
  return dayjs(date).isBefore(dayjs().subtract(1, 'day'), 'day')
}

function disabledEndDate(date: Date) {
  if (!form.value.startDate) return dayjs(date).isBefore(dayjs().subtract(1, 'day'), 'day')
  return dayjs(date).isBefore(dayjs(form.value.startDate), 'day')
}

function handleExceed() {
  ElMessage.warning('最多只能上传3个附件')
}

async function nextStep() {
  if (currentStep.value === 2) {
    try {
      await formRef.value?.validate()
      currentStep.value = 3
    } catch (e) {
      return
    }
  } else {
    currentStep.value++
  }
}

async function submitApply() {
  if (!selectedType.value) return
  
  try {
    await ElMessageBox.confirm(
      '确认提交请假申请？提交后将无法修改。',
      '确认提交',
      { type: 'warning' }
    )
  } catch {
    return
  }

  submitting.value = true
  try {
    await createApplication({
      typeId: selectedType.value.id,
      typeName: selectedType.value.name,
      startDate: form.value.startDate,
      endDate: form.value.endDate,
      days: computedDays.value,
      reason: form.value.reason,
      attachmentUrl: null
    })
    
    ElMessage.success('申请提交成功！')
    router.push('/oa/my')
  } catch (e: any) {
    ElMessage.error(e?.response?.data?.message || '提交失败，请重试')
  } finally {
    submitting.value = false
  }
}

onMounted(async () => {
  try {
    leaveTypes.value = await fetchLeaveTypes()
  } catch (e) {
    console.error('Failed to load leave types:', e)
  }
  
  // 获取我的审批人
  try {
    const approverData = await fetchMyApprover()
    myApprover.value = approverData
  } catch (e) {
    console.error('Failed to load approver:', e)
  }
})
</script>

<style scoped>
.create-apply {
  max-width: 900px;
  margin: 0 auto;
}

/* 页面标题 */
.page-header {
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

/* 步骤条 */
.steps-section {
  background: #fff;
  border-radius: 8px;
  padding: 24px;
  margin-bottom: 24px;
  border: 1px solid #e8e8e8;
}

/* 区块 */
.section {
  background: #fff;
  border-radius: 8px;
  padding: 24px;
  margin-bottom: 24px;
  border: 1px solid #e8e8e8;
}

.section-header {
  margin-bottom: 24px;
}

.section-header h3 {
  font-size: 16px;
  font-weight: 600;
  color: #1a1a2e;
  margin-bottom: 4px;
}

.section-header p {
  font-size: 13px;
  color: #999;
}

/* 假期类型选择 */
.type-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
}

.type-card {
  position: relative;
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 20px;
  background: #fafafa;
  border: 2px solid transparent;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
}

.type-card:hover {
  background: #fff;
  border-color: #91caff;
}

.type-card.selected {
  background: #e6f7ff;
  border-color: #1890ff;
}

.type-icon {
  width: 48px;
  height: 48px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
}

.type-icon.primary { background: #1890ff; }
.type-icon.warning { background: #faad14; }
.type-icon.danger { background: #ff4d4f; }
.type-icon.success { background: #52c41a; }
.type-icon.info { background: #722ed1; }
.type-icon.default { background: #d9d9d9; }

.type-info {
  flex: 1;
}

.type-name {
  font-size: 15px;
  font-weight: 600;
  color: #333;
  margin-bottom: 4px;
}

.type-desc {
  font-size: 13px;
  color: #666;
  margin-bottom: 4px;
}

.type-limit {
  font-size: 12px;
  color: #999;
  display: flex;
  align-items: center;
  gap: 4px;
}

.type-check {
  color: #1890ff;
}

/* 表单 */
.form-wrapper {
  max-width: 600px;
}

.selected-type-info {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 24px;
  padding: 12px 16px;
  background: #f0f5ff;
  border-radius: 6px;
}

.type-limit-text {
  font-size: 13px;
  color: #666;
}

.days-display {
  display: flex;
  align-items: baseline;
  gap: 4px;
  padding: 8px 16px;
  background: #f6ffed;
  border-radius: 6px;
}

.days-number {
  font-size: 32px;
  font-weight: 700;
  color: #52c41a;
  line-height: 1;
}

.days-unit {
  font-size: 14px;
  color: #666;
}

.upload-area {
  width: 100%;
}

/* 确认信息 */
.confirm-card {
  background: #fafafa;
  border-radius: 8px;
  padding: 24px;
}

.confirm-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 20px;
}

.confirm-days {
  font-size: 24px;
  font-weight: 700;
  color: #1890ff;
}

.confirm-actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 24px;
  padding-top: 24px;
  border-top: 1px solid #e8e8e8;
}

/* 审批人区域 */
.approver-section {
  margin-top: 24px;
  padding-top: 20px;
  border-top: 1px solid #f0f0f0;
}

.approver-label {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 14px;
  color: #666;
  margin-bottom: 12px;
}

.approver-card {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px;
  background: #f6ffed;
  border: 1px solid #b7eb8f;
  border-radius: 8px;
}

.approver-info {
  flex: 1;
}

.approver-name {
  font-size: 15px;
  font-weight: 600;
  color: #333;
}

.approver-detail {
  font-size: 13px;
  color: #666;
  margin-top: 2px;
}

.approver-tag {
  flex-shrink: 0;
}

.approver-notify-tip {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-top: 10px;
  padding: 8px 12px;
  background: #e6f7ff;
  border-radius: 6px;
  font-size: 12px;
  color: #1890ff;
}

/* 底部按钮 */
.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding: 24px;
  background: #fff;
  border-radius: 8px;
  border: 1px solid #e8e8e8;
}
</style>
