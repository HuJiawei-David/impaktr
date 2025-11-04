'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { 
  Building2, 
  UserPlus,
  Shield,
  Key,
  Users,
  Mail,
  Plus,
  Edit,
  Trash2,
  Search,
  X,
  CheckCircle,
  XCircle,
  MoreVertical,
  UserCheck
} from 'lucide-react';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { toast } from 'react-hot-toast';
import { useConfirmDialog } from '@/components/ui/simple-confirm-dialog';

interface Department {
  id: string;
  name: string;
  email: string;
  createdAt: string;
  activeAccesses: number;
}

interface DepartmentAccess {
  id: string;
  individualUser: {
    id: string;
    name: string;
    email: string;
    image: string | null;
  };
  permissions: string[] | null;
  grantedAt: string;
  grantedBy: {
    name: string;
  };
}

interface OrganizationData {
  id: string;
  name: string;
}

export default function OrganizationDepartmentsPage() {
  const { data: session, status } = useSession();
  const user = session?.user;
  const isLoading = status === 'loading';
  const router = useRouter();
  
  const [organizationData, setOrganizationData] = useState<OrganizationData | null>(null);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Create department dialog
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [createFormData, setCreateFormData] = useState({
    name: '',
    email: '',
  });
  const [creating, setCreating] = useState(false);
  
  // Edit department dialog
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingDepartment, setEditingDepartment] = useState<Department | null>(null);
  const [editFormData, setEditFormData] = useState({
    name: '',
    email: '',
  });
  const [updating, setUpdating] = useState(false);
  
  // Access management dialog
  const [accessDialogOpen, setAccessDialogOpen] = useState(false);
  const [selectedDepartment, setSelectedDepartment] = useState<Department | null>(null);
  const [departmentAccesses, setDepartmentAccesses] = useState<DepartmentAccess[]>([]);
  const [loadingAccesses, setLoadingAccesses] = useState(false);
  
  // Grant access dialog
  const [grantAccessDialogOpen, setGrantAccessDialogOpen] = useState(false);
  const [userSearchQuery, setUserSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [selectedUser, setSelectedUser] = useState<any | null>(null);
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>(['CREATE_EVENTS', 'POST_OPPORTUNITIES']);
  const [granting, setGranting] = useState(false);
  
  const { showConfirm, ConfirmDialog } = useConfirmDialog();

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/signin');
      return;
    }

    if (user) {
      fetchOrganizationData();
    }
  }, [isLoading, user, router]);

  const fetchOrganizationData = async () => {
    try {
      const response = await fetch('/api/organizations/dashboard');
      
      if (response.status === 401) {
        router.push('/signin');
        return;
      }

      if (response.status === 404) {
        router.push('/dashboard');
        return;
      }

      if (!response.ok) {
        throw new Error('Failed to fetch organization data');
      }

      const data = await response.json();
      setOrganizationData(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      console.error('Error fetching organization data:', err);
    }
  };

  const fetchDepartments = async () => {
    if (!organizationData?.id) return;
    
    try {
      setLoading(true);
      const response = await fetch(`/api/organization/departments?organizationId=${organizationData.id}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch departments');
      }

      const data = await response.json();
      setDepartments(data.departments || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      console.error('Error fetching departments:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (organizationData?.id) {
      fetchDepartments();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [organizationData?.id]);

  const handleCreateDepartment = async () => {
    if (!organizationData?.id) return;
    
    try {
      setCreating(true);
      const response = await fetch('/api/organization/departments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: createFormData.name,
          email: createFormData.email,
          organizationId: organizationData.id,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create department');
      }

      toast.success('Department account created successfully');
      setCreateDialogOpen(false);
      setCreateFormData({ name: '', email: '' });
      fetchDepartments();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to create department');
    } finally {
      setCreating(false);
    }
  };

  const handleEditDepartment = async () => {
    if (!editingDepartment) return;
    
    try {
      setUpdating(true);
      const response = await fetch('/api/organization/departments', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          departmentId: editingDepartment.id,
          name: editFormData.name,
          email: editFormData.email,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update department');
      }

      toast.success('Department updated successfully');
      setEditDialogOpen(false);
      setEditingDepartment(null);
      setEditFormData({ name: '', email: '' });
      fetchDepartments();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to update department');
    } finally {
      setUpdating(false);
    }
  };

  const handleDeleteDepartment = (department: Department) => {
    showConfirm({
      title: 'Delete Department Account',
      message: `Are you sure you want to delete the department account "${department.name}"? This will revoke all access grants and cannot be undone.`,
      confirmText: 'Delete',
      cancelText: 'Cancel',
      type: 'delete',
      onConfirm: async () => {
        try {
          const response = await fetch(`/api/organization/departments?departmentId=${department.id}`, {
            method: 'DELETE',
          });

          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Failed to delete department');
          }

          toast.success('Department account deleted successfully');
          fetchDepartments();
        } catch (err) {
          toast.error(err instanceof Error ? err.message : 'Failed to delete department');
        }
      }
    });
  };

  const openAccessDialog = async (department: Department) => {
    setSelectedDepartment(department);
    setAccessDialogOpen(true);
    await fetchDepartmentAccesses(department.id);
  };

  const fetchDepartmentAccesses = async (departmentId: string) => {
    try {
      setLoadingAccesses(true);
      const response = await fetch(`/api/organization/departments/access?departmentAccountId=${departmentId}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch department accesses');
      }

      const data = await response.json();
      setDepartmentAccesses(data.accesses || []);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to fetch accesses');
      console.error('Error fetching department accesses:', err);
    } finally {
      setLoadingAccesses(false);
    }
  };

  const handleSearchUsers = async (query: string) => {
    if (query.length < 2) {
      setSearchResults([]);
      return;
    }

    try {
      const response = await fetch(`/api/users/search?q=${encodeURIComponent(query)}&limit=10`);
      
      if (response.ok) {
        const data = await response.json();
        setSearchResults(data.users || []);
      } else {
        setSearchResults([]);
      }
    } catch (err) {
      console.error('Error searching users:', err);
      setSearchResults([]);
    }
  };

  const handleGrantAccess = async () => {
    if (!selectedDepartment || !selectedUser) return;
    
    try {
      setGranting(true);
      const response = await fetch('/api/organization/departments/access', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          departmentAccountId: selectedDepartment.id,
          individualUserId: selectedUser.id,
          permissions: selectedPermissions,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to grant access');
      }

      toast.success(`Access granted to ${selectedUser.name}`);
      setGrantAccessDialogOpen(false);
      setSelectedUser(null);
      setUserSearchQuery('');
      setSelectedPermissions(['CREATE_EVENTS', 'POST_OPPORTUNITIES']);
      await fetchDepartmentAccesses(selectedDepartment.id);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to grant access');
    } finally {
      setGranting(false);
    }
  };

  const handleRevokeAccess = (access: DepartmentAccess) => {
    if (!selectedDepartment) return;
    
    showConfirm({
      title: 'Revoke Access',
      message: `Are you sure you want to revoke ${access.individualUser.name}'s access to this department account?`,
      confirmText: 'Revoke',
      cancelText: 'Cancel',
      type: 'warning',
      onConfirm: async () => {
        try {
          const response = await fetch('/api/organization/departments/access', {
            method: 'DELETE',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              departmentAccountId: selectedDepartment.id,
              individualUserId: access.individualUser.id,
            }),
          });

          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Failed to revoke access');
          }

          toast.success('Access revoked successfully');
          await fetchDepartmentAccesses(selectedDepartment.id);
        } catch (err) {
          toast.error(err instanceof Error ? err.message : 'Failed to revoke access');
        }
      }
    });
  };

  const togglePermission = (permission: string) => {
    setSelectedPermissions(prev => 
      prev.includes(permission)
        ? prev.filter(p => p !== permission)
        : [...prev, permission]
    );
  };

  const filteredDepartments = departments.filter(dept =>
    dept.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    dept.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (isLoading || loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card>
          <CardContent className="pt-6">
            <p className="text-red-500">{error}</p>
            <Button onClick={() => router.push('/organization/settings')} className="mt-4">
              Back to Settings
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold">Department Accounts</h1>
            <p className="text-muted-foreground">
              Create and manage department accounts for delegated access
            </p>
          </div>
          <Button
            onClick={() => setCreateDialogOpen(true)}
            className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
          >
            <Plus className="w-4 h-4 mr-2" />
            Create Department
          </Button>
        </div>

        {/* Search */}
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <Input
              placeholder="Search departments..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Departments List */}
        <div className="grid gap-4">
          {filteredDepartments.length === 0 ? (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center py-12">
                  <Building2 className="w-16 h-16 mx-auto text-gray-400 mb-4" />
                  <p className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                    No department accounts
                  </p>
                  <p className="text-gray-500 dark:text-gray-400 mb-6">
                    Create your first department account to enable delegated access
                  </p>
                  <Button onClick={() => setCreateDialogOpen(true)}>
                    <Plus className="w-4 h-4 mr-2" />
                    Create Department
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            filteredDepartments.map((department) => (
              <Card key={department.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                        <Building2 className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <CardTitle>{department.name}</CardTitle>
                        <CardDescription className="flex items-center space-x-2 mt-1">
                          <Mail className="w-4 h-4" />
                          <span>{department.email}</span>
                        </CardDescription>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge variant="outline" className="flex items-center space-x-1">
                        <Users className="w-3 h-3" />
                        <span>{department.activeAccesses} access{department.activeAccesses !== 1 ? 'es' : ''}</span>
                      </Badge>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreVertical className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => openAccessDialog(department)}>
                            <Key className="w-4 h-4 mr-2" />
                            Manage Access
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => {
                              setEditingDepartment(department);
                              setEditFormData({ name: department.name, email: department.email });
                              setEditDialogOpen(true);
                            }}
                          >
                            <Edit className="w-4 h-4 mr-2" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => handleDeleteDepartment(department)}
                            className="text-red-600"
                          >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
                    <span>Created {new Date(department.createdAt).toLocaleDateString()}</span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openAccessDialog(department)}
                    >
                      <UserCheck className="w-4 h-4 mr-2" />
                      View Accesses
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        {/* Create Department Dialog */}
        <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Department Account</DialogTitle>
              <DialogDescription>
                Create a new department account that can be used for delegated access
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="name">Department Name</Label>
                <Input
                  id="name"
                  value={createFormData.name}
                  onChange={(e) => setCreateFormData({ ...createFormData, name: e.target.value })}
                  placeholder="e.g., Marketing, HR, Operations"
                />
              </div>
              <div>
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  value={createFormData.email}
                  onChange={(e) => setCreateFormData({ ...createFormData, email: e.target.value })}
                  placeholder="department@example.com"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>
                Cancel
              </Button>
              <Button
                onClick={handleCreateDepartment}
                disabled={creating || !createFormData.name || !createFormData.email}
              >
                {creating ? 'Creating...' : 'Create'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Edit Department Dialog */}
        <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Department Account</DialogTitle>
              <DialogDescription>
                Update the department account details
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="edit-name">Department Name</Label>
                <Input
                  id="edit-name"
                  value={editFormData.name}
                  onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="edit-email">Email Address</Label>
                <Input
                  id="edit-email"
                  type="email"
                  value={editFormData.email}
                  onChange={(e) => setEditFormData({ ...editFormData, email: e.target.value })}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
                Cancel
              </Button>
              <Button
                onClick={handleEditDepartment}
                disabled={updating || !editFormData.name || !editFormData.email}
              >
                {updating ? 'Updating...' : 'Update'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Access Management Dialog */}
        <Dialog open={accessDialogOpen} onOpenChange={setAccessDialogOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Manage Access - {selectedDepartment?.name}</DialogTitle>
              <DialogDescription>
                Grant or revoke access to individual users for this department account
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-medium">Current Accesses</h3>
                <Button
                  size="sm"
                  onClick={() => {
                    setGrantAccessDialogOpen(true);
                  }}
                >
                  <UserPlus className="w-4 h-4 mr-2" />
                  Grant Access
                </Button>
              </div>
              
              {loadingAccesses ? (
                <div className="flex justify-center py-8">
                  <LoadingSpinner />
                </div>
              ) : departmentAccesses.length === 0 ? (
                <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                  No access grants yet. Click "Grant Access" to add users.
                </div>
              ) : (
                <div className="space-y-2">
                  {departmentAccesses.map((access) => (
                    <div
                      key={access.id}
                      className="flex items-center justify-between p-3 border rounded-lg"
                    >
                      <div className="flex items-center space-x-3">
                        <Avatar>
                          <AvatarImage src={access.individualUser.image || undefined} />
                          <AvatarFallback>
                            {access.individualUser.name.charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">{access.individualUser.name}</p>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            {access.individualUser.email}
                          </p>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {Array.isArray(access.permissions) && access.permissions.length > 0 ? (
                              access.permissions.map((perm: string) => (
                                <Badge key={perm} variant="secondary" className="text-xs">
                                  {perm.replace(/_/g, ' ')}
                                </Badge>
                              ))
                            ) : (
                              <span className="text-xs text-gray-400">No permissions</span>
                            )}
                          </div>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRevokeAccess(access)}
                      >
                        <XCircle className="w-4 h-4 text-red-500" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setAccessDialogOpen(false)}>
                Close
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Grant Access Dialog */}
        <Dialog open={grantAccessDialogOpen} onOpenChange={setGrantAccessDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Grant Access</DialogTitle>
              <DialogDescription>
                Search for a user and grant them access to this department account
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="user-search">Search User</Label>
                <div className="relative">
                  <Input
                    id="user-search"
                    value={userSearchQuery}
                    onChange={(e) => {
                      setUserSearchQuery(e.target.value);
                      handleSearchUsers(e.target.value);
                    }}
                    placeholder="Search by name or email..."
                  />
                  {userSearchQuery && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="absolute right-2 top-1/2 -translate-y-1/2"
                      onClick={() => {
                        setUserSearchQuery('');
                        setSearchResults([]);
                        setSelectedUser(null);
                      }}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  )}
                </div>
                {searchResults.length > 0 && !selectedUser && (
                  <div className="mt-2 border rounded-lg max-h-48 overflow-y-auto">
                    {searchResults.map((user) => (
                      <div
                        key={user.id}
                        className="p-2 hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer"
                        onClick={() => {
                          setSelectedUser(user);
                          setUserSearchQuery(user.name || user.email);
                          setSearchResults([]);
                        }}
                      >
                        <div className="flex items-center space-x-2">
                          <Avatar className="w-8 h-8">
                            <AvatarImage src={user.image || undefined} />
                            <AvatarFallback>
                              {(user.name || user.email).charAt(0).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium text-sm">{user.name || user.email}</p>
                            {user.email && <p className="text-xs text-gray-500">{user.email}</p>}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                {selectedUser && (
                  <div className="mt-2 p-3 border rounded-lg bg-gray-50 dark:bg-gray-800">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Avatar>
                          <AvatarImage src={selectedUser.image || undefined} />
                          <AvatarFallback>
                            {(selectedUser.name || selectedUser.email).charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">{selectedUser.name || selectedUser.email}</p>
                          {selectedUser.email && (
                            <p className="text-sm text-gray-500">{selectedUser.email}</p>
                          )}
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setSelectedUser(null);
                          setUserSearchQuery('');
                        }}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </div>
              
              {selectedUser && (
                <div>
                  <Label>Permissions</Label>
                  <div className="space-y-2 mt-2">
                    {['CREATE_EVENTS', 'POST_OPPORTUNITIES', 'ADMIN_ACCESS'].map((perm) => (
                      <div key={perm} className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id={perm}
                          checked={selectedPermissions.includes(perm)}
                          onChange={() => togglePermission(perm)}
                          className="rounded"
                        />
                        <Label htmlFor={perm} className="font-normal cursor-pointer">
                          {perm.replace(/_/g, ' ')}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setGrantAccessDialogOpen(false)}>
                Cancel
              </Button>
              <Button
                onClick={handleGrantAccess}
                disabled={granting || !selectedUser || selectedPermissions.length === 0}
              >
                {granting ? 'Granting...' : 'Grant Access'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <ConfirmDialog />
      </div>
    </div>
  );
}

