# 建议组件持久化测试指南

## 🧪 测试步骤

### 步骤1: 生成建议
1. 打开建议组件页面
2. 选择 Focus Area (例如: Environmental)
3. 选择一些 SDGs
4. 填写 Targets (例如: 500 hours, 100 participants)
5. 点击 "Generate Suggestions"
6. **验证**: 应该看到建议结果和摘要

### 步骤2: 导航离开
1. 点击导航栏中的其他页面 (例如: Dashboard, Events)
2. **验证**: 页面应该正常切换

### 步骤3: 返回建议页面
1. 点击导航栏中的 "Suggestion" 或 "ESG" 页面
2. **验证**: 应该看到以下内容：
   - 表单数据恢复 (Focus Area, SDGs, Targets)
   - 建议结果恢复 (Suggested Events 列表)
   - 建议摘要恢复 (Suggestion Summary)
   - 蓝色横幅显示恢复时间

### 步骤4: 检查控制台日志
打开浏览器开发者工具的控制台，应该看到：
```
Restored suggestion state from storage: {hasResult: true, selectedSDGs: 16, selectedEvents: 0}
```

## 🔍 验证点

### ✅ 数据恢复验证
- [ ] Focus Area 选择恢复
- [ ] SDGs 选择恢复  
- [ ] Targets 数值恢复
- [ ] Constraints 设置恢复
- [ ] Suggested Events 列表显示
- [ ] Suggestion Summary 显示
- [ ] 蓝色恢复横幅显示

### ✅ 控制台日志验证
- [ ] 看到 "Restored suggestion state from storage" 日志
- [ ] 看到 "Suggestion result saved to store" 日志
- [ ] 日志显示正确的数据状态

### ✅ 功能验证
- [ ] 可以继续选择事件
- [ ] 可以创建草稿事件
- [ ] 可以添加到收藏夹
- [ ] 修改设置时旧结果被清除

## 🐛 故障排除

### 如果数据没有恢复：

1. **检查控制台日志**
   - 查看是否有错误信息
   - 查看恢复日志是否出现

2. **检查 localStorage**
   - 打开开发者工具 → Application → Local Storage
   - 查找 `suggestion-storage` 键
   - 检查 `result` 字段是否为 `null`

3. **手动检查数据**
   ```javascript
   // 在浏览器控制台运行
   const data = localStorage.getItem('suggestion-storage');
   const parsed = JSON.parse(data);
   console.log('Stored result:', parsed.state.result);
   console.log('Has result:', !!parsed.state.result);
   ```

### 如果仍然有问题：

1. **清除存储并重试**
   ```javascript
   // 在浏览器控制台运行
   localStorage.removeItem('suggestion-storage');
   location.reload();
   ```

2. **检查组织ID**
   - 确保在同一个组织下测试
   - 切换组织会清除数据

3. **检查时间戳**
   - 数据24小时后会过期
   - 检查 `timestamp` 字段

## 📊 预期结果

### 成功情况
- 导航后所有数据完整恢复
- 控制台显示正确的恢复日志
- 蓝色横幅显示恢复时间
- 功能正常工作

### 失败情况
- 数据没有恢复
- 控制台显示错误
- 功能异常

## 🎯 测试场景

### 场景1: 基本导航
1. 生成建议 → 导航到其他页面 → 返回
2. **预期**: 数据完整恢复

### 场景2: 浏览器刷新
1. 生成建议 → 刷新页面 (F5)
2. **预期**: 数据完整恢复

### 场景3: 标签页切换
1. 生成建议 → 切换标签页 → 返回
2. **预期**: 数据完整恢复

### 场景4: 设置修改
1. 生成建议 → 修改 Focus Area → 查看结果
2. **预期**: 旧结果被清除，需要重新生成

## ✅ 成功标准

- [ ] 建议结果正确保存和恢复
- [ ] 建议摘要正确保存和恢复
- [ ] 表单数据正确保存和恢复
- [ ] 控制台日志正确显示
- [ ] 功能正常工作
- [ ] 用户体验良好

---

**测试状态**: 待验证
**修复版本**: v1.2
**测试日期**: 2025年10月24日
