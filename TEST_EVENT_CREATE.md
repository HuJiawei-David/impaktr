# 测试事件创建功能指南

## 快速测试步骤

### 1. 启动开发服务器
```bash
npm run dev
```

### 2. 导航到事件创建页面
打开浏览器访问：`http://localhost:3000/organization/events/create`

### 3. 填写表单并测试

#### 测试用例 1: 完整填写（应该成功）
1. **Step 1 - Basic Information:**
   - Event Title: `社区环境清洁活动`
   - Description: `一起为社区环境做贡献，清理公园和街道`
   - Organization: 选择你的组织（或选择 "Create as Individual"）
   - SDG Focus Areas: 选择至少一个 SDG（如 SDG 11, 13, 15）
   - Event Images: 可选择上传 1-5 张图片

2. **Step 2 - Date and Time:**
   - Start Date: 选择未来的日期和时间（如 `2025-11-15 09:00`）
   - End Date: 选择结束时间（如 `2025-11-15 17:00`）
   - Registration Deadline: 选择注册截止时间（如 `2025-11-14 23:59`）
   - Location: 
     - 不勾选虚拟事件
     - City: `Kuala Lumpur`
     - Address: `Central Park, Jalan Sultan Ismail`
   - Max Participants: `50`
   - 勾选 "Public event"

3. **Step 3 - Skills and Requirements:**
   - Skills: 选择相关技能（如 "Event Planning", "Gardening"）
   - Intensity Level: 选择 `Medium (1.0x)`
   - Verification Method: 选择 `Organizer Verification`

4. **Step 4 - Advanced:**
   - Certificate Template: 选择 `Default Impaktr Certificate`
   - 点击 "Create Event"

**预期结果:** 
- 显示 "Event created successfully!" 成功消息
- 自动跳转到 `/organization/events` 页面
- 新创建的事件显示在列表中

---

#### 测试用例 2: 虚拟事件（应该成功）
1. **Step 1:** 填写基本信息和 SDG
2. **Step 2:** 
   - 填写日期和时间
   - **勾选 "This is a virtual event"**
   - City 字段应该可以为空
   - 不需要填写地址
3. **Step 3-4:** 正常填写
4. 点击 "Create Event"

**预期结果:** 成功创建虚拟事件

---

#### 测试用例 3: 缺少必填字段（应该显示错误）

**测试 3a: 缺少 Title**
- 跳过 Event Title
- 直接点击 "Continue" 或 "Create Event"
- **预期:** 显示 "Please fill in all required fields"

**测试 3b: 缺少 Registration Deadline**
- 填写其他所有字段
- 但不填写 Registration Deadline
- 点击 "Create Event"
- **预期:** 显示 "Registration deadline is required"

**测试 3c: 非虚拟事件但没有 City**
- 不勾选虚拟事件
- 但不填写 City
- 点击 "Create Event"
- **预期:** 显示 "City is required for non-virtual events"

**测试 3d: 没有选择 SDG**
- 填写所有其他字段
- 但不选择任何 SDG
- 点击 "Create Event"
- **预期:** 显示 "Please select at least one SDG"

---

## 调试指南

如果创建事件仍然失败，请按以下步骤调试：

### 1. 打开浏览器开发者工具
- Chrome/Edge: 按 `F12` 或 `Cmd+Option+I` (Mac)
- 切换到 "Console" 标签

### 2. 查看控制台错误
尝试创建事件，查看控制台是否有红色错误消息。常见错误：
- `Unauthorized` → 用户未登录或 session 过期
- `No organization admin access` → 用户不是任何组织的管理员
- `Validation failed` → 数据验证失败
- `Internal server error` → 服务器端错误

### 3. 查看网络请求
- 切换到 "Network" 标签
- 点击 "Create Event"
- 找到 `/api/organization/events` 的 POST 请求
- 点击查看请求详情：
  - **Request Payload:** 查看发送的数据
  - **Response:** 查看服务器返回的错误消息

### 4. 常见错误及解决方法

#### 错误: "Unauthorized" (401)
**原因:** 用户未登录  
**解决:** 确保已登录，检查 session 是否有效

#### 错误: "No organization admin access" (403)
**原因:** 用户不是任何组织的管理员或所有者  
**解决:** 
1. 创建一个组织
2. 或者将用户添加为现有组织的管理员
3. 使用以下脚本添加用户到组织：
```bash
node add-to-organization.js
```

#### 错误: "Invalid data" 或 "Validation failed" (400)
**原因:** 数据格式不正确  
**解决:** 
1. 检查 Response 中的 `details` 字段，查看具体哪个字段验证失败
2. 常见问题：
   - 日期格式不正确
   - 必填字段为空
   - 数字字段为负数或非法值
   - SDG 数组超出范围（必须 1-17）

#### 错误: "Internal server error" (500)
**原因:** 服务器端错误  
**解决:** 
1. 查看服务器控制台日志
2. 可能的原因：
   - 数据库连接失败
   - Prisma schema 不匹配
   - 数据库字段类型不匹配

### 5. 查看服务器日志
在运行 `npm run dev` 的终端窗口中查看输出：
```
Received event data: { ... }  # 接收到的数据
Validation error: [ ... ]      # Zod 验证错误（如果有）
Error creating event: ...      # 创建事件时的错误
```

---

## 数据格式参考

### 正确的 API 请求数据格式：
```json
{
  "title": "社区环境清洁活动",
  "description": "一起为社区环境做贡献",
  "startDate": "2025-11-15T09:00",
  "endDate": "2025-11-15T17:00",
  "registrationDeadline": "2025-11-14T23:59",
  "location": {
    "address": "Central Park",
    "city": "Kuala Lumpur",
    "isVirtual": false
  },
  "maxParticipants": 50,
  "sdgTags": [11, 13, 15],
  "skills": ["Event Planning", "Gardening"],
  "intensity": 1.0,
  "verificationType": "ORGANIZER",
  "eventInstructions": "",
  "materialsNeeded": [],
  "emergencyContact": null,
  "autoIssueCertificates": true,
  "requiresApproval": false
}
```

### 日期格式说明
- 使用 `datetime-local` 格式：`YYYY-MM-DDTHH:mm`
- 例如：`2025-11-15T09:00`
- 不需要时区信息

### SDG 数组
- 数字数组，每个数字范围：1-17
- 例如：`[1, 3, 4, 11, 13]`
- 最多选择 5 个

---

## 成功创建后的检查

创建成功后，检查以下内容：

1. **事件列表页面** (`/organization/events`)
   - 新事件应该显示在列表中
   - 状态应该是 "DRAFT"

2. **数据库检查**
   ```bash
   # 使用 Prisma Studio 查看
   npx prisma studio
   ```
   - 打开 `Event` 表
   - 找到新创建的事件
   - 验证所有字段都正确保存

3. **事件详情页面**
   - 点击事件查看详情
   - 确认所有信息显示正确

---

## 需要帮助？

如果按照以上步骤仍然无法创建事件，请提供以下信息：

1. **浏览器控制台的错误消息**（Console 标签）
2. **网络请求的响应内容**（Network 标签 → Response）
3. **服务器日志输出**（终端窗口）
4. **你填写的数据示例**

这将帮助进一步诊断问题。

