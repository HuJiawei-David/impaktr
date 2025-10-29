# 组织选择下拉菜单修复

## 问题描述

在 `/organization/events/create` 页面的"Create for Organization (Optional)"下拉菜单中，只显示"Create as Individual"选项，没有显示用户所属的组织。

## 根本原因

**缺失的 API 端点**: 前端代码调用 `/api/users/organizations` 端点来获取用户所属的组织列表，但这个 API 端点不存在，导致 `organizations` 数组始终为空。

## 修复内容

### 1. 创建缺失的 API 端点

**新建文件**: `src/app/api/users/organizations/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-config';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user with organization memberships
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: {
        organizationMemberships: {
          include: {
            organization: {
              select: {
                id: true,
                name: true,
                logo: true,
                type: true,
                description: true,
              }
            }
          }
        }
      }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Filter organizations where user has admin or owner role
    const adminOrganizations = user.organizationMemberships
      .filter(membership => 
        membership.role === 'admin' || membership.role === 'owner'
      )
      .map(membership => ({
        id: membership.organization.id,
        name: membership.organization.name,
        logo: membership.organization.logo,
        type: membership.organization.type,
        description: membership.organization.description,
        role: membership.role,
      }));

    return NextResponse.json({
      organizations: adminOrganizations,
      total: adminOrganizations.length,
    });

  } catch (error) {
    console.error('Error fetching user organizations:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
```

**功能说明**:
- 获取当前登录用户的所有组织成员身份
- 只返回用户具有 `admin` 或 `owner` 角色的组织
- 返回组织的基本信息（ID、名称、Logo、类型等）

### 2. 改进前端组织选择组件

**文件**: `src/app/organization/events/create/page.tsx`

#### 2.1 添加加载状态
```typescript
const [isLoadingOrganizations, setIsLoadingOrganizations] = useState(false);
```

#### 2.2 改进 API 调用逻辑
```typescript
const fetchUserOrganizations = async () => {
  setIsLoadingOrganizations(true);
  try {
    console.log('Fetching user organizations...');
    const response = await fetch('/api/users/organizations');
    console.log('Organizations API response status:', response.status);
    
    if (response.ok) {
      const data = await response.json();
      console.log('Organizations data:', data);
      setOrganizations(data.organizations || []);
    } else {
      const errorData = await response.json();
      console.error('Organizations API error:', errorData);
      toast.error('Failed to load organizations');
    }
  } catch (error) {
    console.error('Error fetching organizations:', error);
    toast.error('Failed to load organizations');
  } finally {
    setIsLoadingOrganizations(false);
  }
};
```

#### 2.3 改进下拉菜单 UI
```typescript
<Select onValueChange={(value) => setValue('organizationId', value === 'individual' ? undefined : value)}>
  <SelectTrigger>
    <SelectValue placeholder={
      isLoadingOrganizations 
        ? "Loading organizations..." 
        : "Select organization or create as individual"
    } />
  </SelectTrigger>
  <SelectContent>
    <SelectItem value="individual">Create as Individual</SelectItem>
    {isLoadingOrganizations ? (
      <SelectItem value="loading" disabled>
        <div className="flex items-center space-x-2">
          <LoadingSpinner size="sm" />
          <span>Loading organizations...</span>
        </div>
      </SelectItem>
    ) : organizations.length > 0 ? (
      organizations.map((org) => (
        <SelectItem key={org.id} value={org.id}>
          <div className="flex items-center space-x-2">
            <Building2 className="w-4 h-4" />
            <span>{org.name}</span>
          </div>
        </SelectItem>
      ))
    ) : (
      <SelectItem value="no-orgs" disabled>
        <div className="flex items-center space-x-2">
          <Building2 className="w-4 h-4" />
          <span>No organizations found</span>
        </div>
      </SelectItem>
    )}
  </SelectContent>
</Select>
{organizations.length === 0 && !isLoadingOrganizations && (
  <p className="text-sm text-muted-foreground mt-1">
    You need to be an admin or owner of an organization to create organization events.
  </p>
)}
```

## 改进点

1. **加载状态**: 显示加载指示器，让用户知道正在获取组织列表
2. **错误处理**: 添加错误提示，当 API 调用失败时显示 toast 消息
3. **调试信息**: 添加 console.log 帮助调试
4. **用户反馈**: 当没有组织时显示说明文字
5. **权限过滤**: 只显示用户有管理权限的组织

## 测试步骤

### 1. 启动开发服务器
```bash
npm run dev
```

### 2. 测试场景

#### 场景 A: 用户是组织管理员
1. 登录一个有组织管理员权限的用户
2. 访问 `/organization/events/create`
3. 在 "Create for Organization" 下拉菜单中应该看到：
   - "Create as Individual"
   - 用户管理的组织名称

#### 场景 B: 用户不是组织管理员
1. 登录一个普通用户（不是任何组织的管理员）
2. 访问 `/organization/events/create`
3. 在 "Create for Organization" 下拉菜单中应该看到：
   - "Create as Individual"
   - "No organizations found" (禁用状态)
   - 下方显示说明文字

#### 场景 C: API 错误
1. 如果 API 调用失败，应该显示 toast 错误消息
2. 控制台应该显示详细的错误信息

## 权限要求

用户必须满足以下条件才能在组织选择下拉菜单中看到组织：

1. **已登录**: 用户必须有有效的 session
2. **组织成员**: 用户必须是至少一个组织的成员
3. **管理权限**: 用户在组织中必须有 `admin` 或 `owner` 角色

## 相关 API 端点

- `GET /api/users/organizations` - 获取用户有管理权限的组织列表
- `POST /api/organization/events` - 创建事件（需要组织管理员权限）

## 数据库查询

API 端点执行以下 Prisma 查询：

```typescript
const user = await prisma.user.findUnique({
  where: { email: session.user.email },
  include: {
    organizationMemberships: {
      include: {
        organization: {
          select: {
            id: true,
            name: true,
            logo: true,
            type: true,
            description: true,
          }
        }
      }
    }
  }
});
```

然后过滤出用户有 `admin` 或 `owner` 角色的组织。

## 后续改进建议

1. **缓存**: 可以考虑缓存组织列表，避免每次页面加载都调用 API
2. **实时更新**: 当用户加入新组织或角色变更时，实时更新下拉菜单
3. **搜索**: 如果组织很多，可以添加搜索功能
4. **组织创建**: 添加"创建新组织"选项，让用户可以直接创建组织

## 故障排除

如果组织仍然不显示，请检查：

1. **用户权限**: 确保用户是组织的 `admin` 或 `owner`
2. **API 响应**: 查看浏览器控制台的 API 响应
3. **数据库**: 确保 `OrganizationMember` 表中的数据正确
4. **Session**: 确保用户已正确登录

使用以下命令检查用户权限：
```bash
node check-event-create-permission.js <user-email>
```
