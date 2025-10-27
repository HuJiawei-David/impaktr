# ESG页面"New Data Entry"按钮修复

## 问题描述
在ESG页面的Data Collection标签页中，点击"New Data Entry"按钮没有任何反应，按钮缺少点击处理器。

## 问题原因
ESG页面 (`/src/app/organization/esg/page.tsx`) 中的"New Data Entry"按钮没有绑定点击事件处理器，导致点击时没有响应。

## 修复方案

### ✅ 1. 修复"New Data Entry"按钮
**位置**: `/src/app/organization/esg/page.tsx` 第611-617行

**修复前**:
```tsx
<Button className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700">
  <Plus className="w-4 h-4 mr-2" />
  New Data Entry
</Button>
```

**修复后**:
```tsx
<Button 
  onClick={() => router.push('/organization/esg/data-entry')}
  className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
>
  <Plus className="w-4 h-4 mr-2" />
  New Data Entry
</Button>
```

### ✅ 2. 增强分类按钮功能
**位置**: `/src/app/organization/esg/page.tsx` 第622-647行

为三个分类按钮添加点击处理器，支持直接导航到对应的数据录入标签页：

**Environmental Data按钮**:
```tsx
<Button 
  variant="outline" 
  className="h-24 flex flex-col items-center justify-center hover:bg-green-50 hover:border-green-300"
  onClick={() => router.push('/organization/esg/data-entry?tab=environmental')}
>
  <Droplets className="w-8 h-8 mb-2 text-green-500" />
  <span>Environmental Data</span>
</Button>
```

**Social Data按钮**:
```tsx
<Button 
  variant="outline" 
  className="h-24 flex flex-col items-center justify-center hover:bg-blue-50 hover:border-blue-300"
  onClick={() => router.push('/organization/esg/data-entry?tab=social')}
>
  <Heart className="w-8 h-8 mb-2 text-blue-500" />
  <span>Social Data</span>
</Button>
```

**Governance Data按钮**:
```tsx
<Button 
  variant="outline" 
  className="h-24 flex flex-col items-center justify-center hover:bg-purple-50 hover:border-purple-300"
  onClick={() => router.push('/organization/esg/data-entry?tab=governance')}
>
  <Shield className="w-8 h-8 mb-2 text-purple-500" />
  <span>Governance Data</span>
</Button>
```

### ✅ 3. 数据录入页面URL参数支持
**位置**: `/src/app/organization/esg/data-entry/page.tsx` 第56-65行

修改数据录入页面以支持URL参数自动选择标签页：

**添加导入**:
```tsx
import { useRouter, useSearchParams } from 'next/navigation';
```

**修改组件逻辑**:
```tsx
export default function ESGDataEntryPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const isLoading = status === 'loading';
  
  // Get tab from URL search params
  const initialTab = searchParams.get('tab') || 'environmental';
  
  const [activeTab, setActiveTab] = useState(initialTab);
  // ... rest of component
}
```

## 功能增强

### 🎯 智能导航
- **New Data Entry**: 导航到数据录入页面默认标签页
- **Environmental Data**: 直接打开Environmental标签页
- **Social Data**: 直接打开Social标签页  
- **Governance Data**: 直接打开Governance标签页

### 🎨 视觉改进
- 添加悬停效果 (`hover:bg-green-50 hover:border-green-300`)
- 统一颜色主题 (Environmental: 绿色, Social: 蓝色, Governance: 紫色)
- 保持一致的视觉风格

### 🔗 URL参数支持
- 支持 `?tab=environmental` 参数
- 支持 `?tab=social` 参数
- 支持 `?tab=governance` 参数
- 支持 `?tab=batch` 参数 (批量上传)

## 测试验证

### ✅ 测试场景
1. **点击"New Data Entry"按钮** → 应该导航到 `/organization/esg/data-entry`
2. **点击"Environmental Data"按钮** → 应该导航到 `/organization/esg/data-entry?tab=environmental`
3. **点击"Social Data"按钮** → 应该导航到 `/organization/esg/data-entry?tab=social`
4. **点击"Governance Data"按钮** → 应该导航到 `/organization/esg/data-entry?tab=governance`

### ✅ 预期结果
- 所有按钮都应该有响应
- 导航应该正确跳转到数据录入页面
- URL参数应该正确设置对应的标签页
- 数据录入页面应该自动选择正确的标签页

## 修复完成

现在ESG页面的所有数据录入相关按钮都有正确的点击处理器，用户可以：

1. **快速访问**: 通过"New Data Entry"按钮快速进入数据录入页面
2. **分类导航**: 通过分类按钮直接进入对应的数据录入标签页
3. **无缝体验**: 从ESG概览页面无缝跳转到数据录入功能

修复已完成，所有按钮现在都能正常工作！
