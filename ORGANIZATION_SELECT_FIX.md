# Organization Selection Dropdown Fix

## Problem Description

On the `/organization/events/create` page, the "Create for Organization (Optional)" dropdown menu only shows "Create as Individual" option and does not display the organizations the user belongs to.

## Root Cause

**Missing API Endpoint**: The frontend code calls the `/api/users/organizations` endpoint to get the list of organizations the user belongs to, but this API endpoint does not exist, causing the `organizations` array to always be empty.

## Fix Implementation

### 1. Create Missing API Endpoint

**New File**: `src/app/api/users/organizations/route.ts`

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

**Function Description**:
- Gets all organization memberships for the currently logged-in user
- Only returns organizations where the user has `admin` or `owner` role
- Returns basic organization information (ID, name, Logo, type, etc.)

### 2. Improve Frontend Organization Selection Component

**File**: `src/app/organization/events/create/page.tsx`

#### 2.1 Add Loading State
```typescript
const [isLoadingOrganizations, setIsLoadingOrganizations] = useState(false);
```

#### 2.2 Improve API Call Logic
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

#### 2.3 Improve Dropdown Menu UI
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

## Improvements

1. **Loading State**: Shows loading indicator so users know the organization list is being fetched
2. **Error Handling**: Added error notifications that display toast messages when API calls fail
3. **Debug Information**: Added console.log to help with debugging
4. **User Feedback**: Shows explanatory text when no organizations are found
5. **Permission Filtering**: Only shows organizations where user has admin privileges

## Testing Steps

### 1. Start Development Server
```bash
npm run dev
```

### 2. Test Scenarios

#### Scenario A: User is Organization Admin
1. Log in as a user with organization admin privileges
2. Visit `/organization/events/create`
3. In the "Create for Organization" dropdown menu, you should see:
   - "Create as Individual"
   - Names of organizations managed by the user

#### Scenario B: User is Not Organization Admin
1. Log in as a regular user (not an admin of any organization)
2. Visit `/organization/events/create`
3. In the "Create for Organization" dropdown menu, you should see:
   - "Create as Individual"
   - "No organizations found" (disabled state)
   - Explanatory text displayed below

#### Scenario C: API Error
1. If the API call fails, a toast error message should be displayed
2. The console should display detailed error information

## Permission Requirements

Users must meet the following conditions to see organizations in the organization selection dropdown:

1. **Logged In**: User must have a valid session
2. **Organization Member**: User must be a member of at least one organization
3. **Admin Privileges**: User must have `admin` or `owner` role in the organization

## Related API Endpoints

- `GET /api/users/organizations` - Get list of organizations where user has admin privileges
- `POST /api/organization/events` - Create event (requires organization admin privileges)

## Database Query

The API endpoint executes the following Prisma query:

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

Then filters out organizations where the user has `admin` or `owner` role.

## Future Improvement Suggestions

1. **Caching**: Consider caching the organization list to avoid API calls on every page load
2. **Real-time Updates**: Update the dropdown menu in real-time when users join new organizations or roles change
3. **Search**: If there are many organizations, add search functionality
4. **Organization Creation**: Add "Create New Organization" option to allow users to create organizations directly

## Troubleshooting

If organizations still don't display, check:

1. **User Permissions**: Ensure the user is an `admin` or `owner` of the organization
2. **API Response**: Check the API response in the browser console
3. **Database**: Ensure data in the `OrganizationMember` table is correct
4. **Session**: Ensure the user is properly logged in

Use the following command to check user permissions:
```bash
node check-event-create-permission.js <user-email>
```
