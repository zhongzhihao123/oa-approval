import axios from 'axios'

const api = axios.create({
  baseURL: '/api/oa',
  timeout: 15000,
})

// 请求拦截器 - 动态添加认证头
api.interceptors.request.use(
  (config) => {
    // 基座用 jwt_token，兼容 token
    const token = localStorage.getItem('jwt_token') || localStorage.getItem('token')
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`
    }
    
    // 基座用 user_info，兼容 user
    const userStr = localStorage.getItem('user_info') || localStorage.getItem('user')
    if (userStr) {
      try {
        const user = JSON.parse(userStr)
        config.headers['X-User-Id'] = user.id
        config.headers['X-User-Name'] = user.name || user.username
      } catch (e) {
        console.error('Failed to parse user info:', e)
      }
    }
    
    return config
  },
  (error) => Promise.reject(error)
)

api.interceptors.response.use(
  (res) => {
    const body = res.data
    return body.code === 200 ? body.data : body
  },
  (err) => Promise.reject(err)
)

export interface LeaveType {
  id: number; name: string; icon: string; color: string
  maxDaysPerYear: number; needAttachment: boolean; status: string
}

export interface Application {
  id: number; appNo: string; applicantId: number; applicantName: string
  typeId: number; typeName: string; flowId: number
  reason: string; startDate: string; endDate: string; days: number
  attachmentUrl: string | null; status: string
  currentStep: number; totalSteps: number
  createdAt: string; updatedAt: string
}

export interface ApprovalRecord {
  id: number; applicationId: number; approverId: number; approverName: string
  stepOrder: number; action: string; comment: string | null
  approvedAt: string; createdAt: string
}

export interface Notification {
  id: number; applicationId: number | null; userId: number
  title: string; content: string; type: string; isRead: boolean
  readAt: string | null; createdAt: string
}

export interface Approver {
  id: number; userId: number; userName: string
  approverId: number; approverName: string; isDefault: boolean
}

export interface WecomContact {
  id: number; userId: number; username: string
  wecomUserid: string; wecomName: string; wecomDepartment: string
  wecomPosition: string; wecomMobile: string; wecomEmail: string
  wecomAvatar: string | null; isActive: boolean
}

export interface MyApprover {
  approverId: number; approverName: string
  wecomName?: string; wecomDepartment?: string
  wecomPosition?: string; wecomAvatar?: string | null
}

// Leave types
export const fetchLeaveTypes = () => api.get<any, LeaveType[]>('/leave-types')

// Applications
export const createApplication = (data: any) => api.post<any, Application>('/applications', data)
export const fetchMyApplications = (status?: string) => api.get<any, Application[]>('/applications', { params: { status } })
export const fetchApplication = (id: number) => api.get<any, Application>(`/applications/${id}`)
export const approveApplication = (id: number, comment: string) => api.post<any, Application>(`/applications/${id}/approve`, { comment })
export const rejectApplication = (id: number, comment: string) => api.post<any, Application>(`/applications/${id}/reject`, { comment })
export const cancelApplication = (id: number) => api.post<any, Application>(`/applications/${id}/cancel`)
export const fetchPendingApprovals = () => api.get<any, Application[]>('/applications/pending')
export const fetchStats = () => api.get<any, { pendingCount: number; unreadNotifyCount: number; yearLeaveUsed: number }>('/applications/stats')

// Approval records
export const fetchApprovalRecords = (appId: number) => api.get<any, ApprovalRecord[]>(`/approval-records/${appId}`)

// Notifications
export const fetchNotifications = () => api.get<any, Notification[]>('/notifications')
export const fetchUnreadCount = () => api.get<any, number>('/notifications/unread-count')
export const markAsRead = (id: number) => api.put(`/notifications/${id}/read`)
export const markAllAsRead = () => api.put('/notifications/read-all')

// Approvers
export const fetchApprovers = () => api.get<any, Approver[]>('/approvers')

// Dashboard
export const fetchDashboard = () => api.get<any, any>('/dashboard')

// WeCom Integration
export const fetchWecomContacts = () => api.get<any, WecomContact[]>('/wecom/contacts')
export const fetchMyApprover = () => api.get<any, MyApprover>('/wecom/approver')
export const fetchWecomDepartments = () => api.get<any, any[]>('/wecom/departments')
export const fetchWecomMembers = (departmentId: number) => api.get<any, any[]>(`/wecom/members/${departmentId}`)
export const testWecomNotify = (userId: string, title?: string, content?: string) => 
  api.post<any, string>('/wecom/test-notify', { userId, title, content })
