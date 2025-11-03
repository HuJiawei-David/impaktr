# 手动执行 SQL 迁移指南

## 🎯 目标
在 Neon 数据库控制台手动执行 SQL，添加缺失的 NotificationType 枚举值。

## 📝 具体操作步骤

### 第一步：访问 Neon Console

1. **打开浏览器**，访问：https://console.neon.tech
2. **登录您的账户**（使用 GitHub、Google 或其他方式）
3. **找到您的项目**（应该叫 impaktr 或类似的名字）
4. **点击项目**进入详情页

### 第二步：打开 SQL Editor

1. 在左侧菜单栏找到 **"SQL Editor"** 或 **"Query"** 按钮
2. 点击进入 SQL 编辑器
3. 您应该看到一个代码编辑框（类似代码编辑器）

### 第三步：复制粘贴 SQL 代码

**请复制以下 4 行 SQL 代码：**

```sql
ALTER TYPE "NotificationType" ADD VALUE IF NOT EXISTS 'CERTIFICATE_ISSUED';
ALTER TYPE "NotificationType" ADD VALUE IF NOT EXISTS 'RANK_UP';
ALTER TYPE "NotificationType" ADD VALUE IF NOT EXISTS 'EVENT_JOINED';
ALTER TYPE "NotificationType" ADD VALUE IF NOT EXISTS 'MONTHLY_REPORT';
```

**然后：**
1. 将这些代码粘贴到 SQL Editor 的编辑框中
2. 确保代码完整（4 行）

### 第四步：执行 SQL

1. 找到 **"Run"** 或 **"Execute"** 或 **"▶"** 按钮
2. 点击按钮执行 SQL
3. 等待几秒钟，应该看到成功消息（类似 "Query executed successfully" 或 "Success"）

### 第五步：验证迁移成功

在同一个 SQL Editor 中，执行以下验证查询：

```sql
SELECT enumlabel 
FROM pg_enum 
WHERE enumtypid = 'NotificationType'::regtype 
ORDER BY enumlabel;
```

**预期结果：** 您应该看到至少包含这 4 个新值的列表：
- CERTIFICATE_ISSUED
- RANK_UP
- EVENT_JOINED
- MONTHLY_REPORT

## ✅ 完成！

完成后，您的数据库就更新好了。现在可以：

1. 等待 Vercel 自动重新部署（如果您推送了代码到 GitHub）
2. 或者手动触发 Vercel 重新部署
3. 然后测试 "Grant Approval" 功能

## ⚠️ 重要提示

✅ **安全操作**：使用 `IF NOT EXISTS`，即使重复执行也不会出错  
✅ **不会丢失数据**：只添加新值，不删除任何现有数据  
✅ **不影响现有通知**：所有现有的通知都保持不变

## 🤔 如果遇到问题

### 问题 1：找不到 Neon Console
- **解决方案**：直接访问 https://console.neon.tech 登录

### 问题 2：找不到 SQL Editor
- **解决方案**：可能在左侧菜单栏，名称可能是 "SQL Editor"、"Query"、"Database"、"Tables" 等

### 问题 3：报错说 "Permission denied"
- **解决方案**：确保您使用的是有权限的账户登录

### 问题 4：找不到 "NotificationType" 类型
- **解决方案**：可能数据库还没有创建这个类型，先运行其他必要的迁移

### 问题 5：不确定使用的是哪个数据库
- **解决方案**：在 Vercel 的环境变量中找到 `DATABASE_URL`，看看是否是 Neon 的地址

## 📸 Neon Console 界面参考

```
Neon Dashboard
├── Projects
│   └── Your Project Name
│       ├── Dashboard
│       ├── **SQL Editor** ← 点击这个！
│       ├── Tables
│       ├── Branches
│       └── Settings
```

在 SQL Editor 中：
```
┌─────────────────────────────────────────┐
│ SQL Editor                              │
├─────────────────────────────────────────┤
│                                         │
│  [粘贴 SQL 代码到这里]                  │
│  ALTER TYPE "NotificationType"...       │
│                                         │
├─────────────────────────────────────────┤
│  [Run] [Format] [Clear]  ← 点击 Run    │
└─────────────────────────────────────────┘
```

## 🎉 完成后

执行成功后，您就可以推送代码到 GitHub，Vercel 会自动重新部署并应用新的代码。

测试时记得：
1. 登录组织 admin 账户
2. 找到活动详情页面
3. 点击 "Grant Approval" 按钮
4. 应该成功，不再报错了！✨

