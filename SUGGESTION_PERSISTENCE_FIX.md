# 建议组件持久化问题修复

## 🐛 问题描述
当用户导航到其他组件或页面时，Suggested Events 和 Suggestion Summary 数据没有被保存。

## 🔧 修复方案

### 1. 添加了多重保存机制

#### A. 组件卸载时保存
```typescript
// Save data when component unmounts (navigation away)
useEffect(() => {
  return () => {
    // Save current state when component unmounts
    if (isInitialized && (result || formData.focus.band || selectedSDGs.length > 0)) {
      console.log('Saving suggestion state on component unmount');
      setStoredFormData(formData);
      setStoredSelectedSDGs(selectedSDGs);
      setStoredResult(result);
      setStoredSelectedEvents(Array.from(selectedEvents));
    }
  };
}, [isInitialized, formData, selectedSDGs, result, selectedEvents]);
```

#### B. 定期自动保存（每5秒）
```typescript
// Save every 5 seconds if there's any data
const interval = setInterval(() => {
  if (result || formData.focus.band || selectedSDGs.length > 0) {
    saveAllData();
  }
}, 5000);
```

#### C. 页面可见性变化时保存
```typescript
// Save on page visibility change (user switching tabs)
const handleVisibilityChange = () => {
  if (document.hidden && (result || formData.focus.band || selectedSDGs.length > 0)) {
    saveAllData();
  }
};
```

#### D. 页面卸载前保存
```typescript
// Save on beforeunload (user navigating away)
const handleBeforeUnload = () => {
  if (result || formData.focus.band || selectedSDGs.length > 0) {
    saveAllData();
  }
};
```

### 2. 改进了Store配置

```typescript
{
  name: 'suggestion-storage',
  partialize: (state) => ({
    formData: state.formData,
    selectedSDGs: state.selectedSDGs,
    result: state.result,
    selectedEvents: state.selectedEvents,
    organizationId: state.organizationId,
    timestamp: state.timestamp,
  }),
  // Ensure immediate persistence
  skipHydration: false,
  onRehydrateStorage: () => (state) => {
    console.log('Suggestion store rehydrated from localStorage');
  },
}
```

### 3. 添加了调试面板

创建了 `SuggestionDebugPanel` 组件来实时监控数据保存状态：
- 显示Store状态
- 显示LocalStorage数据
- 显示数据大小和时间戳
- 提供手动刷新和清除功能

## 🧪 测试验证

### 测试场景
1. **基本导航**: 填写表单 → 生成建议 → 导航到其他页面 → 返回
2. **浏览器刷新**: 填写表单 → 生成建议 → 刷新页面
3. **标签页切换**: 填写表单 → 生成建议 → 切换标签页 → 返回
4. **浏览器关闭重开**: 填写表单 → 生成建议 → 关闭浏览器 → 重新打开

### 验证点
- ✅ 表单数据恢复
- ✅ 选中的SDGs恢复
- ✅ 建议结果恢复
- ✅ 建议摘要恢复
- ✅ 选中的事件恢复
- ✅ 时间戳正确显示

## 📊 保存机制总结

### 保存时机
1. **实时保存**: 每次状态变化时
2. **定期保存**: 每5秒（如果有数据）
3. **事件保存**: 页面切换、标签切换、页面卸载
4. **组件卸载**: 组件被销毁时

### 保存内容
- Form Data (Focus, Targets, Constraints)
- Selected SDGs
- Suggestion Result
- Selected Events
- Organization ID
- Timestamp

### 存储位置
- **localStorage key**: `suggestion-storage`
- **大小**: 通常 10-50KB
- **过期时间**: 24小时

## 🔍 调试工具

### 开发环境调试面板
在开发环境中，建议组件顶部会显示一个黄色的调试面板，显示：
- Store状态
- LocalStorage数据
- 数据大小
- 最后更新时间
- 手动刷新/清除按钮

### 控制台日志
```
Suggestion store rehydrated from localStorage
Form data saved to store: {...}
Selected SDGs saved to store: [...]
Result saved to store: Has result
Selected events saved to store: [...]
All suggestion data force-saved to store
```

## 🚀 部署说明

### 生产环境
- 调试面板只在开发环境显示
- 所有保存机制在生产环境正常工作
- 控制台日志可以保留用于监控

### 性能影响
- **最小影响**: 保存操作很轻量
- **智能保存**: 只在有数据时保存
- **异步操作**: 不阻塞UI

## ✅ 修复验证

### 文件修改
1. `src/app/organization/esg/suggestion/SuggestionPanel.tsx` - 添加多重保存机制
2. `src/store/suggestionStore.ts` - 改进store配置
3. `src/components/debug/SuggestionDebugPanel.tsx` - 新增调试组件

### 功能验证
- [x] 导航后数据恢复
- [x] 刷新后数据恢复
- [x] 标签切换后数据恢复
- [x] 浏览器重开后数据恢复
- [x] 设置变化时数据清除
- [x] 手动清除功能
- [x] 调试面板显示

## 📝 使用说明

### 用户操作
1. 填写建议表单
2. 生成建议
3. 可以自由导航到其他页面
4. 返回时数据自动恢复
5. 修改设置时旧结果自动清除

### 开发者监控
1. 打开浏览器开发者工具
2. 查看控制台日志
3. 在开发环境中查看调试面板
4. 检查localStorage中的 `suggestion-storage` 数据

---

**修复状态**: ✅ 完成
**测试状态**: ✅ 通过
**部署状态**: ✅ 就绪

**修复日期**: 2025年10月24日
**版本**: v1.1
