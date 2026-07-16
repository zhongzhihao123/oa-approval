import { createRouter, createWebHistory } from 'vue-router'

const routes = [
  { path: '/', redirect: '/oa/dashboard' },
  { path: '/oa/dashboard', name: 'Dashboard', component: () => import('../views/Dashboard.vue') },
  { path: '/oa/create', name: 'CreateApply', component: () => import('../views/CreateApply.vue') },
  { path: '/oa/my', name: 'MyApplications', component: () => import('../views/MyApplications.vue') },
  { path: '/oa/pending', name: 'PendingApproval', component: () => import('../views/PendingApproval.vue') },
  { path: '/oa/detail/:id', name: 'ApprovalDetail', component: () => import('../views/ApprovalDetail.vue') },
]

const router = createRouter({
  history: createWebHistory('/'),
  routes,
})

export default router
