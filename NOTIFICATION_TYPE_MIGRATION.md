# NotificationType 枚举迁移指南

## 问题描述

修复 "Grant Approval" 按钮的 "Internal server error" 错误。

## 根本原因

数据库 `NotificationType` 枚举缺失以下值：
- `CERTIFICATE_ISSUED`
- `RANK_UP`
- `EVENT_JOINED`
- `MONTHLY_REPORT`

## 修复内容

1. **Prisma Schema** - 已添加缺失的 enum 值
2. **Notification Service** - 已添加类型转换函数
3. **迁移文件** - 已创建安全的数据迁移

## 部署步骤

### 选项 1：自动迁移（推荐）

如果您有部署环境的数据库访问权限：

```bash
# 在您的部署环境（SSH 到服务器）执行：
cd /path/to/your/project
npx prisma migrate deploy
```

### 选项 2：手动执行 SQL（最安全）

在您的数据库管理控制台（Neon、AWS RDS 等）执行以下 SQL：

```sql
-- Add missing NotificationType enum values
ALTER TYPE "NotificationType" ADD VALUE IF NOT EXISTS 'CERTIFICATE_ISSUED';
ALTER TYPE "NotificationType" ADD VALUE IF NOT EXISTS 'RANK_UP';
ALTER TYPE "NotificationType" ADD VALUE IF NOT EXISTS 'EVENT_JOINED';
ALTER TYPE "NotificationType" ADD VALUE IF NOT EXISTS 'MONTHLY_REPORT';
```

### 选项 3：通过 Neon Console

1. 登录到 https://console.neon.tech
2. 选择您的数据库项目
3. 打开 SQL Editor
4. 复制粘贴上面的 SQL 代码
5. 点击运行

## 验证迁移

迁移成功后，验证数据库 enum 值：

```sql
SELECT enumlabel 
FROM pg_enum 
WHERE enumtypid = 'NotificationType'::regtype 
ORDER BY enumlabel;
```

您应该看到新添加的 4 个值。

## 重要提示

✅ **安全**: `IF NOT EXISTS` 确保即使重复运行也不会出错  
✅ **数据安全**: 只添加新值，不删除或修改现有数据  
✅ **向后兼容**: 现有通知不会受到影响

## 部署后

部署完成后，重启应用：
```bash
# Vercel 会自动重启，如果是其他平台：
pm2 restart all
# 或
systemctl restart your-app
```

## 测试

1. 登录到组织 admin 账户
2. 导航到活动详情页面（如 `organization/events/cmhenblf30009y4hli6mx71oq`）
3. 点击 "Grant Approval" 按钮
4. 应该成功发送并显示 success 消息

## 迁移文件位置

`prisma/migrations/20251103005606_add_notification_types/migration.sql`

