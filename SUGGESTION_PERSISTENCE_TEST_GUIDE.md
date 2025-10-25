# 建议组件持久化测试指南

## 问题修复

### 原问题
当用户导航到其他组件或页面时，Suggested Events 和 Suggestion Summary 数据没有被保存。

### 修复内容
1. **添加了组件卸载时的数据保存**
2. **添加了定期自动保存（每5秒）**
3. **添加了页面可见性变化时的保存**
4. **添加了页面卸载前的保存**
5. **改进了store的持久化配置**

## 测试步骤

### 测试1: 基本导航测试
1. 打开建议组件页面
2. 填写表单（选择Focus Area, SDGs等）
3. 点击"Generate Suggestions"
4. 查看生成的建议结果
5. **导航到其他页面**（如Dashboard, Events等）
6. **返回建议组件页面**
7. **验证**: 数据应该被完整恢复

### 测试2: 浏览器刷新测试
1. 填写建议表单并生成结果
2. **刷新浏览器页面** (F5 或 Ctrl+R)
3. **验证**: 数据应该被完整恢复

### 测试3: 标签页切换测试
1. 填写建议表单并生成结果
2. **切换到其他浏览器标签页**
3. **切换回原标签页**
4. **验证**: 数据应该被完整恢复

### 测试4: 浏览器关闭重开测试
1. 填写建议表单并生成结果
2. **关闭浏览器**
3. **重新打开浏览器并导航到建议页面**
4. **验证**: 数据应该被完整恢复（24小时内）

### 测试5: 控制台日志验证
打开浏览器开发者工具的控制台，应该看到以下日志：

```
Suggestion store rehydrated from localStorage
Form data saved to store: {focus: {...}, targets: {...}, constraints: {...}}
Selected SDGs saved to store: ["SDG6", "SDG7"]
Result saved to store: Has result
Selected events saved to store: ["event-id-1", "event-id-2"]
All suggestion data force-saved to store
```

## 验证点

### ✅ 数据恢复验证
- [ ] 表单数据恢复（Focus Area, Targets, Constraints）
- [ ] 选中的SDGs恢复
- [ ] 建议结果恢复（Suggested Events列表）
- [ ] 建议摘要恢复（Suggestion Summary）
- [ ] 选中的事件恢复（复选框状态）

### ✅ 时间戳验证
- [ ] 恢复时显示正确的生成时间
- [ ] 蓝色信息横幅显示恢复时间

### ✅ 清理机制验证
- [ ] 修改Focus Area时，旧结果被清除
- [ ] 修改Targets时，旧结果被清除
- [ ] 修改Constraints时，旧结果被清除
- [ ] 点击"Clear Suggestions"按钮时，所有数据被清除

## 故障排除

### 如果数据仍然没有保存：

1. **检查浏览器控制台**
   - 查看是否有错误信息
   - 查看保存日志是否出现

2. **检查localStorage**
   - 打开开发者工具 → Application → Local Storage
   - 查找 `suggestion-storage` 键
   - 验证数据是否存在

3. **检查组织ID**
   - 确保在同一个组织下测试
   - 切换组织会清除数据

4. **检查时间戳**
   - 数据24小时后会过期
   - 检查timestamp字段

### 手动验证localStorage
```javascript
// 在浏览器控制台运行
const data = localStorage.getItem('suggestion-storage');
console.log('Stored data:', JSON.parse(data));
```

## 预期行为

### 正常情况
- 数据自动保存到localStorage
- 导航后数据完整恢复
- 控制台显示保存日志
- 蓝色横幅显示恢复信息

### 异常情况
- 数据过期（24小时后）
- 组织切换
- 浏览器禁用localStorage
- 存储空间不足

## 性能考虑

### 保存频率
- **实时保存**: 每次状态变化
- **定期保存**: 每5秒（如果有数据）
- **事件保存**: 页面切换、标签切换、页面卸载

### 存储大小
- 典型大小: 10-50KB
- 最大大小: 通常 < 100KB
- 清理机制: 24小时自动过期

## 成功标准

✅ **数据持久化**: 导航后数据完整恢复
✅ **性能良好**: 保存操作不影响用户体验
✅ **错误处理**: 优雅处理各种异常情况
✅ **用户反馈**: 清晰的视觉指示器
✅ **代码质量**: 无linting错误，类型安全

---

**测试状态**: 待验证
**修复版本**: v1.1
**测试日期**: 2025年10月24日
