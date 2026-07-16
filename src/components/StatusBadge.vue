<template>
  <span class="status-badge" :class="status">{{ label }}</span>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{ status: string }>()

const label = computed(() => {
  const map: Record<string, string> = {
    pending: '审批中', approved: '已通过', rejected: '已驳回', cancelled: '已撤回',
  }
  return map[props.status] || props.status
})
</script>

<style scoped>
.status-badge {
  display: inline-flex; align-items: center;
  padding: 2px 10px; border-radius: 4px;
  font-size: 12px; font-weight: 500;
}
.status-badge.pending { background: #fff7e6; color: #fa8c16; }
.status-badge.approved { background: #f6ffed; color: #52c41a; }
.status-badge.rejected { background: #fff2f0; color: #ff4d4f; }
.status-badge.cancelled { background: #f5f5f5; color: #999; }
</style>
