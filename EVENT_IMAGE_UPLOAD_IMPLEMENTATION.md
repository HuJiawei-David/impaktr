# Event Image Upload & Display Implementation

## 概述 (Overview)

实现了在活动创建页面上传图片，并在活动列表页面显示这些图片的功能。如果活动没有上传图片，系统会自动显示默认的占位图片。

## 实现的功能 (Implemented Features)

### 1. 图片上传功能 (Image Upload)
- ✅ 在 `/organization/events/create` 页面上传最多5张图片
- ✅ 图片自动上传到AWS S3存储
- ✅ 第一张图片作为活动封面图
- ✅ 所有图片保存到 `event_images` 数据表

### 2. 图片显示功能 (Image Display)
- ✅ 在 `/organization/events` 列表页显示活动封面图
- ✅ 如果没有图片，显示系统默认的占位图
- ✅ 图片加载失败时自动回退到默认图片
- ✅ 卡片设计改进，包含图片区域和覆盖层标签

### 3. 默认占位图 (Default Placeholder)
- ✅ 创建了美观的SVG默认图片：`/public/default-event-cover.svg`
- ✅ 使用渐变色（蓝色到紫色）的设计
- ✅ 包含"Event Image"文字标识

## 修改的文件 (Modified Files)

### 1. `/src/app/api/organization/events/route.ts`
**修改内容：**
- 导入 `uploadToS3` 函数
- POST方法支持FormData和JSON两种格式
- 处理图片文件上传到S3
- 保存图片URL到 `event.imageUrl` 字段
- 创建 `EventImage` 记录关联到活动
- GET方法包含活动的封面图片
- 添加 `coverImage` 字段到返回数据

**关键代码：**
```typescript
// 上传图片到S3
const imageUrls: string[] = [];
for (let i = 0; i < imageFiles.length; i++) {
  const file = imageFiles[i];
  const buffer = Buffer.from(await file.arrayBuffer());
  const fileName = `events/${organizationId}/${Date.now()}-${i}-${file.name}`;
  const url = await uploadToS3(buffer, fileName, file.type);
  imageUrls.push(url);
}

// 设置第一张图片为封面
imageUrl: imageUrls.length > 0 ? imageUrls[0] : null

// 创建EventImage记录
if (imageUrls.length > 0) {
  await Promise.all(
    imageUrls.map((url, index) =>
      prisma.eventImage.create({
        data: {
          url,
          eventId: event.id,
          userId: user.id,
          category: index === 0 ? 'cover' : 'general',
        },
      })
    )
  );
}
```

### 2. `/src/app/organization/events/create/page.tsx`
**修改内容：**
- 修改 `onSubmit` 函数以支持FormData
- 当有图片时使用FormData，否则使用JSON
- 添加详细的调试日志
- 确保正确构建和发送FormData

**关键代码：**
```typescript
if (eventImages.length > 0) {
  const formData = new FormData();
  formData.append('eventData', JSON.stringify(eventData));
  
  eventImages.forEach((image, index) => {
    formData.append(`image_${index}`, image);
  });

  response = await fetch('/api/organization/events', {
    method: 'POST',
    body: formData,
  });
}
```

### 3. `/src/app/organization/events/page.tsx`
**修改内容：**
- 更新 `Event` 接口，添加 `coverImage` 和 `imageUrl` 字段
- 重新设计活动卡片，添加图片区域
- 实现图片显示逻辑和错误处理
- 将状态标签和操作菜单移到图片覆盖层

**关键代码：**
```typescript
const eventImageUrl = event.coverImage || event.imageUrl || '/default-event-cover.svg';

<div className="relative w-full h-48 bg-gradient-to-br from-blue-500 to-purple-600">
  <img
    src={eventImageUrl}
    alt={event.title}
    className="w-full h-full object-cover"
    onError={(e) => {
      const target = e.target as HTMLImageElement;
      target.src = '/default-event-cover.svg';
    }}
  />
  {/* 覆盖层标签 */}
</div>
```

### 4. `/public/default-event-cover.svg` (新建)
创建了一个美观的SVG占位图，包含：
- 渐变背景（蓝色到紫色）
- 抽象的图标设计
- "Event Image" 文字

## 数据库结构 (Database Schema)

### Event 表
- `imageUrl`: 活动封面图片URL（存储第一张上传的图片）

### EventImage 表
```sql
CREATE TABLE "event_images" (
  "id" TEXT PRIMARY KEY,
  "eventId" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "url" TEXT NOT NULL,
  "caption" TEXT,
  "category" TEXT DEFAULT 'general',
  "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP,
  FOREIGN KEY ("eventId") REFERENCES "events"("id"),
  FOREIGN KEY ("userId") REFERENCES "users"("id")
);
```

## 工作流程 (Workflow)

### 创建活动时上传图片：
1. 用户在创建活动页面选择图片（最多5张）
2. 提交时，前端将图片和活动数据打包成FormData
3. 后端接收FormData，提取eventData和图片文件
4. 将每张图片上传到S3，获取URL
5. 创建Event记录，设置第一张图片为封面（imageUrl字段）
6. 为每张图片创建EventImage记录

### 显示活动列表：
1. GET API查询活动时包含第一张图片（通过images关系）
2. 构建返回数据，添加coverImage字段
3. 前端接收数据，优先使用coverImage，其次imageUrl
4. 如果都没有，使用默认占位图
5. 如果图片加载失败，onError回退到默认图片

## 错误处理 (Error Handling)

### 后端
- ✅ 支持FormData和JSON两种请求格式
- ✅ FormData解析失败时自动回退到JSON
- ✅ 图片上传失败不影响其他图片
- ✅ 详细的日志记录便于调试

### 前端
- ✅ 图片加载失败时显示默认图片
- ✅ FormData构建时的日志记录
- ✅ API错误时的友好提示

## 使用说明 (Usage)

### 创建带图片的活动：
1. 访问 `/organization/events/create`
2. 填写活动信息
3. 在"Event Images"部分上传图片（可选）
4. 提交创建活动

### 查看活动列表：
1. 访问 `/organization/events`
2. 每个活动卡片顶部显示封面图
3. 点击卡片查看活动详情

## 技术细节 (Technical Details)

### S3上传配置
- 文件路径格式：`events/{organizationId}/{timestamp}-{index}-{filename}`
- ACL设置：`public-read`
- 自动设置正确的Content-Type

### 图片处理
- 支持的格式：JPG, PNG, WebP等浏览器支持的格式
- 最大数量：5张
- 第一张自动设为封面

### API兼容性
- 向后兼容：没有图片时可以正常创建活动（纯JSON请求）
- 有图片时使用FormData请求

## 调试信息 (Debugging)

### 查看日志
前端日志（浏览器控制台）：
- FormData构建信息
- 图片数量和大小
- API请求结果

后端日志（服务器）：
- 请求格式检测
- 图片接收数量
- 上传结果

### 常见问题
1. **图片不显示**: 检查S3配置和URL是否正确
2. **上传失败**: 检查文件大小和格式
3. **默认图片不显示**: 确保`/public/default-event-cover.svg`文件存在

## 改进建议 (Future Improvements)

- [ ] 添加图片压缩和尺寸优化
- [ ] 支持图片编辑（裁剪、旋转）
- [ ] 图片懒加载优化性能
- [ ] 添加图片预览和管理功能
- [ ] 支持从URL添加图片
- [ ] 添加图片标题和描述

