# Event Creation Page Fix

## 问题诊断

在 `/organization/events/create` 页面创建事件时失败的根本原因：

### 1. **API Schema 处理 Optional 字段的问题**
- 原始的 Zod schema 使用了 `.transform().optional().or(z.null()).transform()` 的复杂链式调用
- 当前端发送 `undefined` 或空字符串时，会导致验证失败
- 例如：`z.string().transform((str) => new Date(str))` 无法正确处理 `undefined` 或 `""`

### 2. **前端字段验证不一致**
- `registrationDeadline` 在前端标记为必填，但类型定义为可选
- 没有在提交前进行完整的客户端验证
- 空值处理不当（使用 `|| undefined` 可能会将空字符串转为 undefined）

### 3. **Location City 字段问题**
- 对于虚拟事件，city 字段可能为空
- 但在非虚拟事件中，city 是必需的

## 修复内容

### 1. API Route 修复 (`src/app/api/organization/events/route.ts`)

**修复前:**
```typescript
registrationDeadline: z.string().transform((str) => new Date(str)).optional().or(z.null()).transform(val => val === null ? undefined : val),
```

**修复后:**
```typescript
registrationDeadline: z.union([
  z.string().min(1).transform((str) => new Date(str)),
  z.undefined(),
  z.null()
]).optional().transform(val => {
  if (!val || val === null) return undefined;
  return val instanceof Date ? val : new Date(val);
}),
```

**改进点：**
- 使用 `z.union()` 明确处理三种情况：有效字符串、undefined、null
- 添加 `.min(1)` 确保字符串不为空
- 更清晰的转换逻辑
- 同样应用到 `endDate` 和 `maxParticipants` 字段
- 为必填字段添加错误消息

### 2. 前端提交逻辑修复 (`src/app/organization/events/create/page.tsx`)

**新增验证：**
```typescript
// Validate required fields
if (!data.title || !data.description || !data.startDate) {
  toast.error('Please fill in all required fields');
  return;
}

// Validate registrationDeadline
if (!data.registrationDeadline) {
  toast.error('Registration deadline is required');
  return;
}

// Validate location for non-virtual events
if (!data.location.isVirtual && !data.location.city) {
  toast.error('City is required for non-virtual events');
  return;
}

// Validate SDG selection
if (selectedSDGs.length === 0) {
  toast.error('Please select at least one SDG');
  return;
}
```

**改进的数据处理：**
```typescript
const eventData = {
  title: data.title.trim(),
  description: data.description.trim(),
  startDate: data.startDate,
  endDate: data.endDate && data.endDate.trim() ? data.endDate : undefined,
  registrationDeadline: data.registrationDeadline && data.registrationDeadline.trim() ? data.registrationDeadline : undefined,
  location: {
    address: data.location.address ? data.location.address.trim() : '',
    city: data.location.city ? data.location.city.trim() : '',
    coordinates: data.location.coordinates || undefined,
    isVirtual: data.location.isVirtual || false,
  },
  // ... 其他字段
};
```

**改进点：**
- 在提交前进行完整的客户端验证
- 使用 `.trim()` 清理字符串输入
- 更安全的空值检查（`data.endDate && data.endDate.trim() ?` 而不是 `data.endDate ||`）
- 提供用户友好的错误消息
- 验证 SDG 至少选择一个

## 现在的流程

1. **用户填写表单** → 所有必填字段都有标记
2. **点击 Create Event** → 触发客户端验证
3. **客户端验证通过** → 数据被正确格式化（trim、处理空值）
4. **发送到 API** → Zod schema 验证数据
5. **API 验证通过** → 创建事件并保存到数据库
6. **成功响应** → 显示成功消息，重定向到事件列表

## 测试建议

测试以下场景以确保修复有效：

### 场景 1: 完整填写所有字段
- 填写所有必填和可选字段
- 应该成功创建事件

### 场景 2: 只填写必填字段
- Title, Description, Start Date, Registration Deadline, Location (city), 至少一个 SDG
- 应该成功创建事件

### 场景 3: 虚拟事件
- 勾选 "This is a virtual event"
- City 字段可以为空
- 应该成功创建事件

### 场景 4: 缺少必填字段
- 尝试提交时缺少 Title / Description / Start Date / Registration Deadline
- 应该显示错误消息，不发送请求

### 场景 5: 未选择 SDG
- 所有其他字段都填写，但没有选择 SDG
- 应该显示 "Please select at least one SDG" 错误

### 场景 6: 非虚拟事件但没有 City
- 不勾选虚拟事件，但 City 字段为空
- 应该显示 "City is required for non-virtual events" 错误

## 额外改进

如果仍然遇到问题，可以检查：

1. **浏览器控制台** - 查看是否有 JavaScript 错误
2. **Network 标签** - 查看实际发送的 API 请求数据
3. **服务器日志** - 查看 API 端的详细错误信息

## 可能的其他问题

如果修复后仍然失败，可能是：

1. **数据库 Schema 不匹配** - 确保 Prisma schema 中的 Event 模型字段正确
2. **用户权限问题** - 确保用户是组织的 admin 或 owner
3. **数据库连接问题** - 确保数据库正常运行
4. **图片上传问题** - 目前代码中图片只存储在前端，没有实际上传到服务器

## 下一步

修复完成后，请尝试创建一个测试事件。如果仍然遇到错误，请查看：
- 浏览器控制台的错误消息
- Network 请求的响应内容
- 服务器端的日志输出

这将帮助我们进一步诊断问题。

