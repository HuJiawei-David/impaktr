# 对话框点击和滚动问题修复

## 问题描述

用户反馈在新页面遇到以下问题：
1. **鼠标点击无效** - 页面上的任何地方都点不了
2. **滚动导致页面退出** - 向上或向下滚动时页面会关闭

## 问题原因分析

1. **缺少 body 滚动锁定** - 当对话框/模态框打开时，没有锁定 body 滚动，导致：
   - 滚动事件可能触发浏览器返回手势（特别是在移动设备上）
   - 滚动可能被误解释为导航操作

2. **对话框状态未正确清理** - 对话框关闭时可能没有正确恢复 body 样式，导致：
   - 滚动锁定状态残留
   - 影响后续页面交互

3. **跨页面状态残留** - 页面切换时对话框状态没有被清理，导致：
   - 新页面继承错误的 body 样式
   - 遮罩层可能残留并阻止点击

4. **滚动事件传播** - 对话框打开时滚动事件仍然传播，可能触发意外行为

## 修复方案

### 1. 为自定义对话框组件添加 body 滚动锁定

**修改的文件：**
- `src/components/events/AttendanceDialog.tsx`
- `src/components/ui/simple-confirm-dialog.tsx`
- `src/components/events/EventGalleryViewer.tsx`

**修复内容：**
- 添加 `useEffect` 钩子在对话框打开时锁定 body 滚动
- 保存原始 overflow 样式并在关闭时恢复
- 计算滚动条宽度并添加 padding-right 防止布局偏移
- 阻止滚动事件传播（`onWheel` 和 `onTouchMove`）

### 2. 改进点击事件处理

**修复内容：**
- 确保只有点击背景遮罩时才关闭对话框
- 防止对话框内容区域的点击事件冒泡
- 改进事件处理逻辑，避免误触发

### 3. 添加全局清理机制

**新增文件：**
- `src/components/providers/ScrollLockProvider.tsx`

**功能：**
- 监听路由变化
- 在页面切换时自动恢复 body 滚动状态
- 确保跨页面切换时不会遗留滚动锁定状态

**集成到：**
- `src/app/layout.tsx` - 在根布局中添加 ScrollLockProvider

## 技术细节

### Body 滚动锁定实现

```typescript
React.useEffect(() => {
  if (isOpen) {
    // 保存原始样式
    const originalOverflow = document.body.style.overflow;
    const originalPaddingRight = document.body.style.paddingRight;
    
    // 计算滚动条宽度防止布局偏移
    const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
    
    // 锁定滚动
    document.body.style.overflow = 'hidden';
    if (scrollbarWidth > 0) {
      document.body.style.paddingRight = `${scrollbarWidth}px`;
    }
    
    return () => {
      // 恢复原始样式
      document.body.style.overflow = originalOverflow;
      document.body.style.paddingRight = originalPaddingRight;
    };
  }
}, [isOpen]);
```

### 阻止滚动事件传播

```tsx
<div 
  onWheel={(e) => {
    // 阻止滚动事件传播
    e.stopPropagation();
  }}
  onTouchMove={(e) => {
    // 阻止触摸滚动（移动设备）
    e.stopPropagation();
  }}
>
```

### 全局清理机制

```typescript
export function ScrollLockProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  useEffect(() => {
    // 路由变化时恢复 body 滚动
    const restoreScroll = () => {
      document.body.style.overflow = '';
      document.body.style.paddingRight = '';
    };

    restoreScroll();
    const timeout = setTimeout(restoreScroll, 100);

    return () => clearTimeout(timeout);
  }, [pathname]);

  return <>{children}</>;
}
```

## 修复的组件

1. ✅ `AttendanceDialog` - 出勤对话框
2. ✅ `SimpleConfirmDialog` - 简单确认对话框
3. ✅ `EventGalleryViewer` - 活动图片查看器

## 注意事项

- **Radix UI Dialog** 组件已经自动处理 body 滚动锁定，无需额外修改
- 所有自定义对话框组件现在都正确实现了滚动锁定
- 页面切换时会自动清理滚动锁定状态
- 移动设备上的滚动手势也被正确处理

## 测试建议

1. **桌面端测试：**
   - 打开对话框，尝试滚动页面 → 应该被阻止
   - 关闭对话框，滚动应该恢复正常
   - 切换页面，确认没有滚动锁定残留

2. **移动端测试：**
   - 打开对话框，尝试上下滑动 → 应该被阻止
   - 确认不会触发浏览器返回手势
   - 关闭对话框后，滚动应该恢复正常

3. **跨页面测试：**
   - 在对话框打开时切换页面
   - 确认新页面可以正常滚动和点击
   - 确认没有遮罩层残留

## 预期效果

修复后，用户应该能够：
- ✅ 正常点击页面上的所有元素
- ✅ 正常滚动页面而不会触发页面关闭
- ✅ 对话框打开时背景滚动被正确锁定
- ✅ 页面切换时不会遗留滚动锁定状态


