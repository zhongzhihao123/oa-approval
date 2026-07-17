<template>
  <span class="status-badge" :class="status">
    <span class="status-dot"></span>
    <span class="status-text">{{ label }}</span>
  </span>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{ status: string }>()

const label = computed(() => {
  const map: Record<string, string> = {
    pending: '审批中',
    approved: '已通过',
    rejected: '已驳回',
    cancelled: '已撤回'
  }
  return map[props.status] || props.status
})
</script>

<style scoped>
.status-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px 10px;
  border-radius: 4px;
  font-size: 13px;
  font-weight: 500;
  line-height: 1;
}

.status-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  flex-shrink: 0;
}

.status-text {
  white-space: nowrap;
}

/* 审批中 */
.status-badge.pending {
  background: #fff7e6;
  color: #fa8c16;
}

.status-badge.pending .status-dot {
  background: #fa8c16;
}

/* 已通过 */
.status-badge.approved {
  background: #f6ffed;
  color: #52c41a;
}

.status-badge.approved .status-dot {
  background: #52c41a;
}

/* 已驳回 */
.status-badge.rejected {
  background: #fff2f0;
  color: #ff4d4f;
}

.status-badge.rejected .status-dot {
  background: #ff4d4f;
}

/* 已撤回 */
.status-badge.cancelled {
  background: #f5f5f5;
  color: #999;
}

.status-badge.cancelled .status-dot {
  background: #999;
}
</style>
