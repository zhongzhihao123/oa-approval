# OA 审批系统

## 📋 项目简介

企业级 OA 审批请假系统，基于 Vue3 + Element Plus 前端，Java Spring Boot 后端，集成企业微信机器人通知。支持请假申请、多级审批、审批流水追踪、统计仪表盘。作为微前端子应用运行在 qiankun 基座中。

## 🏗️ 架构设计

```
┌─────────────────────────────────────────────────────────────────┐
│                    qiankun 基座 (:3000)                          │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │                  OA 审批子应用 (:3008)                     │   │
│  │  ┌─────────┐ ┌──────────┐ ┌────────┐ ┌───────────┐     │   │
│  │  │ 工作台   │ │ 发起审批  │ │我的申请 │ │ 待我审批   │     │   │
│  │  └─────────┘ └──────────┘ └────────┘ └───────────┘     │   │
│  └──────────────────────────────────────────────────────────┘   │
│                           │ API 调用                             │
└───────────────────────────┼─────────────────────────────────────┘
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│                  Java Gateway (:8000)                            │
│               /api/oa/** → oa-service:8105                      │
└─────────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│                  oa-service (:8105)                              │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  OAController  →  OAService  →  JPA Repository            │   │
│  │                       │                                   │   │
│  │              WechatNotifyService                           │   │
│  │           (企业微信机器人 Webhook)                          │   │
│  └──────────────────────────────────────────────────────────┘   │
│                            │                                     │
│                     MySQL (:3307)                                │
└─────────────────────────────────────────────────────────────────┘
```

## 📊 数据库设计

| 表名 | 说明 | 核心字段 |
|------|------|----------|
| `oa_leave_types` | 假期类型 | id, name, icon, color, max_days_per_year, need_attachment |
| `oa_approval_flows` | 审批流程模板 | id, name, description, flow_steps(JSON) |
| `oa_applications` | 审批申请 | id, app_no, applicant_id, type_id, reason, start_date, end_date, days, status |
| `oa_approval_records` | 审批记录 | id, application_id, approver_id, step_order, action, comment |
| `oa_notifications` | 通知记录 | id, application_id, user_id, title, content, type, is_read |
| `oa_approvers` | 审批人配置 | id, user_id, approver_id, is_default |

## 🔌 API 接口

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/oa/leave-types` | 获取假期类型列表 |
| POST | `/api/oa/applications` | 提交请假申请 |
| GET | `/api/oa/applications` | 获取我的申请（支持 status 过滤） |
| GET | `/api/oa/applications/{id}` | 获取申请详情 |
| POST | `/api/oa/applications/{id}/approve` | 审批通过 |
| POST | `/api/oa/applications/{id}/reject` | 审批驳回 |
| POST | `/api/oa/applications/{id}/cancel` | 撤回申请 |
| GET | `/api/oa/applications/pending` | 获取待我审批 |
| GET | `/api/oa/applications/stats` | 审批统计 |
| GET | `/api/oa/applications/all` | 全部申请（管理员） |
| GET | `/api/oa/approval-records/{appId}` | 获取审批流水 |
| GET | `/api/oa/notifications` | 获取通知列表 |
| GET | `/api/oa/notifications/unread-count` | 未读通知数 |
| PUT | `/api/oa/notifications/{id}/read` | 标记已读 |
| PUT | `/api/oa/notifications/read-all` | 全部已读 |
| GET | `/api/oa/approvers` | 获取审批人配置 |
| GET | `/api/oa/dashboard` | 审批仪表盘 |
| POST | `/api/oa/notify/wechat` | 手动触发企业微信通知 |
| GET | `/api/oa/wecom/contacts` | 获取企业微信联系人列表 |
| GET | `/api/oa/wecom/approver` | 获取当前用户的审批人（含企微信息） |
| GET | `/api/oa/wecom/departments` | 获取企微部门列表 |
| GET | `/api/oa/wecom/members/{deptId}` | 获取企微部门成员 |
| POST | `/api/oa/wecom/test-notify` | 测试企微消息发送 |

## 📱 企业微信集成

### 功能特性
1. **通讯录同步**: 从企业微信获取部门和成员信息
2. **审批人展示**: 发起审批时自动显示审批人（含企微部门/职位）
3. **消息通知**: 审批事件通过企业微信应用消息 + 群机器人双通道通知
4. **联系人映射**: 系统用户与企业微信用户通过 `oa_wecom_contacts` 表关联

### 通知流程
- **提交申请** → 自动查找审批人 → 发送企微应用消息 + 群机器人 Webhook
- **审批通过/驳回** → 通知申请人企微消息

### 配置
在 `application.yml` 中配置企业微信：
```yaml
wecom:
  enabled: true                    # 启用企业微信集成
  corp-id: YOUR_CORP_ID           # 企业ID（管理后台获取）
  agent-id: YOUR_AGENT_ID         # 应用AgentId
  corp-secret: YOUR_CORP_SECRET   # 应用Secret
  webhook-url: https://qyapi.weixin.qq.com/cgi-bin/webhook/send?key=YOUR_KEY  # 群机器人
```

### Mock 模式
当 `wecom.enabled: false` 时，系统使用模拟数据：
- 通讯录返回系统内置用户
- 消息通知仅打印日志
- 适合本地开发和演示

### 数据库表
```sql
CREATE TABLE oa_wecom_contacts (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  user_id BIGINT NOT NULL,          -- 系统用户ID
  wecom_userid VARCHAR(100),         -- 企微userid
  wecom_name VARCHAR(50),            -- 企微姓名
  wecom_department VARCHAR(100),     -- 企微部门
  wecom_position VARCHAR(100),       -- 企微职位
  wecom_mobile VARCHAR(20),          -- 手机号
  wecom_email VARCHAR(100),          -- 邮箱
  wecom_avatar VARCHAR(500),         -- 头像URL
  is_active TINYINT DEFAULT 1,
  UNIQUE KEY uk_user (user_id),
  UNIQUE KEY uk_wecom_userid (wecom_userid)
);
```

## 🚀 快速启动

### 1. 数据库
```bash
cd /Users/zhongzhihao/Desktop/java-spring-project
python3 /tmp/create_oa_tables.py
```

### 2. 后端
```bash
cd /Users/zhongzhihao/Desktop/java-spring-project
./mvnw clean package -pl oa-service -am -DskipTests
java -jar oa-service/target/oa-service-1.0.0-SNAPSHOT.jar
```

### 3. 前端
```bash
cd /Users/zhongzhihao/Desktop/oa-approval
npm install
npm run dev
```

### 4. 访问
- OA 子应用: `http://localhost:3008`
- 基座桌面: `http://localhost:3000`（点击 📋 OA 审批图标）

## 📁 项目结构

```
Desktop/
├── oa-approval/                          # 前端子应用
│   ├── src/
│   │   ├── views/
│   │   │   ├── Dashboard.vue             # 工作台仪表盘
│   │   │   ├── CreateApply.vue           # 发起审批（两步：选类型→填表单）
│   │   │   ├── MyApplications.vue        # 我的申请列表
│   │   │   ├── PendingApproval.vue       # 待我审批列表
│   │   │   └── ApprovalDetail.vue        # 审批详情（信息+时间线+操作）
│   │   ├── components/
│   │   │   └── StatusBadge.vue           # 状态标签组件
│   │   ├── api/index.ts                  # API 封装
│   │   ├── router/index.ts              # 路由配置
│   │   ├── App.vue                       # 主布局（企业级侧边栏）
│   │   └── main.ts                       # qiankun 入口
│   ├── index.html
│   ├── package.json
│   ├── vite.config.ts
│   └── tsconfig.json
│
└── java-spring-project/
    └── oa-service/                        # Java 后端模块
        ├── src/main/java/com/aiplatform/oa/
        │   ├── controller/
        │   │   └── OAController.java      # REST API (18个接口)
        │   ├── service/
        │   │   ├── OAService.java         # 审批业务逻辑
        │   │   └── WechatNotifyService.java # 企业微信通知
        │   ├── entity/
        │   │   ├── LeaveType.java
        │   │   ├── Application.java
        │   │   ├── ApprovalRecord.java
        │   │   ├── Notification.java
        │   │   ├── Approver.java
        │   │   └── ApprovalFlow.java
        │   ├── repository/                # 6个 JPA Repository
        │   └── OAApplication.java
        ├── src/main/resources/
        │   └── application.yml
        └── pom.xml
```

## 🔒 权限模型

- `app_permissions` 表: `app_key = 'oa'`
- `user_permissions` 表: 用户-权限关联
- 基座按权限过滤桌面图标显示
- 所有用户可发起审批，但"待我审批"仅显示分配给当前用户的

## 👥 测试账号

| 用户 | 角色 | OA 权限 | 直属领导 |
|------|------|---------|----------|
| admin (管理员) | admin | ✅ | 张三 |
| zhangsan (张三) | user | ✅ | 管理员 |
| lisi (李四) | user | ✅ | 张三 |
| wangwu (王五) | user | ✅ | 管理员 |
| zhaoliu (赵六) | user | ✅ | 李四 |

## 📝 假期类型

| 类型 | 图标 | 每年上限 | 需附件 |
|------|------|----------|--------|
| 年假 | 🏖️ | 10天 | ❌ |
| 事假 | 📝 | 不限 | ❌ |
| 病假 | 🏥 | 不限 | ✅ |
| 婚假 | 💍 | 10天 | ❌ |
| 产假 | 👶 | 90天 | ❌ |
| 调休 | ⏰ | 不限 | ❌ |

## 🎨 技术栈

- **前端**: Vue3 + TypeScript + Element Plus + Vite + vite-plugin-qiankun
- **后端**: Java Spring Boot 3.2 + Spring Data JPA
- **数据库**: MySQL 8.0
- **消息通知**: 企业微信机器人 Webhook（模拟模式）
- **微前端**: qiankun
- **构建**: Maven
