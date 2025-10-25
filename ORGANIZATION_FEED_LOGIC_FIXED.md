# 🔧 Organization Feed Logic - Fixed!

## Issue Identified
The "Create Post" interface was showing for ALL users viewing an organization's page, even non-members. This was incorrect!

## ✅ Correct Flow & Logic

### **1. Individual User Dashboard** (`/dashboard`)
- **Feed Type**: `type="all"` (shows both user achievements AND organization posts)
- **Create Post**: ❌ **NOT SHOWN** - Individual users cannot create posts from their personal dashboard
- **Purpose**: View a unified social feed of achievements and organization updates

### **2. Organization Profile Page** (`/organizations/[id]`)
- **Feed Tab**: Shows organization's posts only (`type="organizations"`)
- **Create Post**: ✅ **SHOWN ONLY IF**:
  - User is a **member** of the organization
  - User has **admin** or **owner** role
- **Purpose**: Organization admins can create posts about their organization

### **3. Organization Dashboard** (Future - `/organization/dashboard`)
- **Feed Type**: Organization's own posts
- **Create Post**: ✅ **SHOWN** for all organization admins
- **Purpose**: Internal dashboard for organization management

## 🔐 Permission Check Logic

### **Frontend Check** (`/src/app/organizations/[id]/page.tsx`):
```typescript
// 1. Fetch organization data including members
const data = await response.json();
setOrganization(data.organization);

// 2. Check if current user is admin/owner
if (session?.user?.id && data.organization.members) {
  const currentUserMembership = data.organization.members.find(
    (m: any) => m.userId === session.user.id || m.email === session.user.email
  );
  setIsAdmin(currentUserMembership?.role === 'admin' || currentUserMembership?.role === 'owner');
}

// 3. Pass isAdmin flag to UnifiedFeed component
<UnifiedFeed 
  type="organizations" 
  limit={10} 
  showCreatePost={isAdmin}  // Only true if user is admin/owner
  organizationId={orgId}
  isOrganizationAdmin={isAdmin}
/>
```

### **Component Logic** (`/src/components/dashboard/UnifiedFeed.tsx`):
```typescript
// Only show create post if ALL conditions are met:
// 1. showCreatePost prop is true
// 2. organizationId is provided
// 3. isOrganizationAdmin is true
{showCreatePost && organizationId && isOrganizationAdmin && (
  <CreatePost 
    organizationId={organizationId}
    onPostCreated={() => fetchFeed()}
  />
)}
```

### **Backend Check** (`/src/app/api/organizations/posts/route.ts`):
```typescript
// Double verification on POST request
const membership = await prisma.organizationMember.findFirst({
  where: {
    organizationId,
    userId: session.user.id,
    status: 'active',
    role: { in: ['admin', 'owner'] }
  }
});

if (!membership) {
  return NextResponse.json(
    { error: 'Not authorized to post for this organization' },
    { status: 403 }
  );
}
```

## 🎯 User Roles & Permissions

| Role | Can View Organization | Can View Posts | Can Create Posts | Can Edit Posts | Can Delete Posts |
|------|---------------------|----------------|------------------|----------------|------------------|
| **Visitor** | ✅ Yes | ✅ Yes | ❌ No | ❌ No | ❌ No |
| **Follower** | ✅ Yes | ✅ Yes | ❌ No | ❌ No | ❌ No |
| **Member** | ✅ Yes | ✅ Yes | ❌ No | ❌ No | ❌ No |
| **Admin** | ✅ Yes | ✅ Yes | ✅ Yes | ✅ Yes (all) | ✅ Yes (all) |
| **Owner** | ✅ Yes | ✅ Yes | ✅ Yes | ✅ Yes (all) | ✅ Yes (all) |

## 📊 API Data Flow

### **API Response Structure**:
```json
{
  "organization": {
    "id": "org123",
    "name": "Green Earth Foundation",
    "members": [
      {
        "id": "mem1",
        "userId": "user123",  // ← Used to match current user
        "email": "user@example.com",
        "role": "admin",      // ← Used to check permissions
        "name": "John Doe"
      }
    ]
  }
}
```

## 🔄 Complete Flow Diagram

```
Individual User Visits Organization Page
    ↓
Fetch Organization Data (includes members list)
    ↓
Check if user.id matches any member.userId
    ↓
    ├─ NO MATCH → Regular visitor
    │     ↓
    │  Show: Feed (read-only)
    │  Hide: Create Post button
    │
    └─ MATCH FOUND → Check member.role
          ↓
          ├─ role = "member" → Regular member
          │     ↓
          │  Show: Feed (read-only)
          │  Hide: Create Post button
          │
          └─ role = "admin" OR "owner" → Organization admin
                ↓
             Show: Feed + Create Post interface
             Can: Create, Edit, Delete posts
```

## ✅ Testing Checklist

- [x] Individual user dashboard shows unified feed (no create post)
- [x] Non-member viewing org page sees feed only (no create post)
- [x] Regular member viewing org page sees feed only (no create post)
- [x] Admin viewing org page sees feed + create post interface
- [x] Owner viewing org page sees feed + create post interface
- [x] Backend validates admin/owner role before allowing post creation
- [x] API returns userId in members array for frontend verification

## 🎉 Result

Now the system correctly:
1. ✅ Shows create post ONLY to organization admins/owners
2. ✅ Validates permissions on both frontend and backend
3. ✅ Maintains separate feeds for different contexts
4. ✅ Provides clear visual hierarchy of permissions

**The organization feed logic is now properly secured and user-friendly!**

