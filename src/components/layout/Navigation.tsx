// home/ubuntu/impaktrweb/src/components/layout/Navigation.tsx

'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useSession, signIn, signOut } from 'next-auth/react';
import { usePathname, useRouter } from 'next/navigation';
import { 
  Menu, 
  X, 
  Search, 
  Bell, 
  User, 
  Settings, 
  LogOut,
  Home,
  Calendar,
  BarChart3,
  Trophy,
  Award,
  Users,
  Plus,
  Globe,
  Building2,
  Leaf,
  CreditCard,
  Shield,
  MessageCircle,
  Briefcase,
  Target,
  BookOpen
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { ThemeToggle } from '@/components/ui/theme-toggle';

import { NotificationDropdown } from '@/components/notifications/NotificationDropdown';

const navigationItems = [
  { href: '/dashboard', label: 'Dashboard', icon: Home },
  { href: '/events', label: 'Events', icon: Calendar },
  { href: '/opportunities', label: 'Opportunities', icon: Briefcase },
  { href: '/messages', label: 'Messages', icon: MessageCircle },
  { href: '/leaderboards', label: 'Leaderboards', icon: Trophy },
  { href: '/community', label: 'Community', icon: Users },
];

// Organization-specific navigation items
const organizationNavItems = [
  { href: '/organization/dashboard', label: 'Overview', icon: Home },
  { href: '/organization/opportunities', label: 'Opportunities', icon: Briefcase },
  { href: '/organization/members', label: 'Team', icon: Users },
  { href: '/organization/events', label: 'Events', icon: Calendar },
  { href: '/organization/leaderboard', label: 'Leaderboards', icon: Trophy },
  { href: '/organization/esg', label: 'ESG', icon: Leaf },
  { href: '/organization/achievements', label: 'Achievements', icon: Award },
  { href: '/organization/analytics', label: 'Analytics', icon: BarChart3 },
];

export function Navigation() {
  const { data: session, status, update } = useSession();
  const user = session?.user;
  const isLoading = status === 'loading';
  const [isOpen, setIsOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [unreadCount, setUnreadCount] = useState(3); // Mock unread count
  const [organizationData, setOrganizationData] = useState<{
    id: string;
    name: string;
    email: string;
    logo?: string;
    tier: string;
    type: string;
    userRole: string;
  } | null>(null);
  const pathname = usePathname();
  const router = useRouter();

  // Determine if user is an organization
  // Only show org navbar for /organization/* routes, NOT /organizations/[id] (public profile view)
  const isOrgContext = pathname.startsWith('/organization/') || pathname === '/organization';
  const isOrganization = isOrgContext || (user?.userType && user.userType !== 'INDIVIDUAL');
  
  // Use appropriate navigation items
  const navItems = isOrganization ? organizationNavItems : navigationItems;

  // Helper function to format organization type
  const getOrganizationTypeDisplay = (type: string) => {
    switch (type) {
      case 'NGO': return 'NGO';
      case 'CORPORATE': return 'Corporation';
      case 'SCHOOL': return 'Education Institute';
      case 'HEALTHCARE': return 'Healthcare Organization';
      default: return type.charAt(0).toUpperCase() + type.slice(1).toLowerCase();
    }
  };

  // Fetch organization data when in organization context
  useEffect(() => {
    if (isOrgContext && user) {
      fetch('/api/organization/current')
        .then(res => res.json())
        .then(data => {
          if (data.organization) {
            setOrganizationData(data.organization);
          }
        })
        .catch(err => console.error('Error fetching organization data:', err));
    }
  }, [isOrgContext, user]);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 0);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      // For now, just show an alert with the search query
      // You can implement a search page later
      alert(`Searching for: "${searchQuery.trim()}"`);
      setShowSearch(false);
      setSearchQuery('');
    }
  };

  const handleSearchToggle = () => {
    setShowSearch(!showSearch);
    if (!showSearch) {
      // Focus search input when opening
      setTimeout(() => {
        const searchInput = document.getElementById('navbar-search');
        searchInput?.focus();
      }, 100);
    }
  };

  const isHomePage = pathname === '/';

  // Show a loading navbar while session is loading to prevent flash
  if (isLoading) {
    return (
      <nav className={cn(
        "fixed top-0 left-0 right-0 z-50 w-full transition-all duration-500 ease-in-out",
        scrolled || !isHomePage 
          ? "bg-white/95 dark:bg-gray-900 backdrop-blur-xl border-b border-gray-200/50 dark:border-gray-700 shadow-xl" 
          : "bg-transparent backdrop-blur-md"
      )}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link href="/" className="flex items-center">
              <span className="font-bold text-2xl md:text-3xl bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                impaktr
              </span>
            </Link>
            {/* Empty space to maintain layout */}
            <div className="h-10"></div>
          </div>
        </div>
      </nav>
    );
  }

  return (
    <>
    <nav className={cn(
      "fixed top-0 left-0 right-0 z-50 w-full transition-all duration-500 ease-in-out",
      scrolled || !isHomePage 
        ? "bg-white/95 dark:bg-gray-900 backdrop-blur-xl border-b border-gray-200/50 dark:border-gray-700 shadow-xl" 
        : "bg-transparent backdrop-blur-md"
    )}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center">
            <span className="font-bold text-2xl md:text-3xl bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              impaktr
            </span>
          </Link>

          {/* Desktop Navigation - Clean Style */}
          {user ? (
            <div className="hidden md:flex items-center justify-center flex-1 max-w-3xl mx-8">
              <div className="flex items-center space-x-1">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = pathname.startsWith(item.href);

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={cn(
                        "relative flex flex-col items-center justify-center px-4 py-2 rounded-md text-xs font-medium transition-all duration-200 min-w-[80px] group",
                        isActive
                          ? "text-purple-600 bg-purple-50 dark:bg-gray-700 dark:text-purple-400"
                          : "text-gray-600 dark:text-gray-400 hover:text-purple-600 dark:hover:text-purple-400 hover:bg-gray-50 dark:hover:bg-gray-700"
                      )}
                    >
                      <Icon className={cn(
                        "w-5 h-5 mb-1 transition-all duration-200",
                        isActive ? "scale-110" : "group-hover:scale-110"
                      )} />
                      <span className="truncate">{item.label}</span>
                    </Link>
                  );
                })}

                {/* Notification - Only for individual users */}
                {!isOrganization && (
                  <div className="flex items-center ml-2 pl-2 border-l border-gray-200 dark:border-gray-600">
                    {/* Notification Dropdown */}
                  <div className="relative">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button className={cn(
                          "relative flex flex-col items-center justify-center px-4 py-2 rounded-md text-xs font-medium transition-all duration-200 min-w-[80px] group",
                          "text-gray-600 dark:text-gray-400 hover:text-purple-600 dark:hover:text-purple-400 hover:bg-gray-50 dark:hover:bg-gray-700"
                        )}>
                          <div className="relative">
                            <Bell className="w-5 h-5 mb-1 transition-all duration-200 group-hover:scale-110" />
                            {unreadCount > 0 && (
                              <Badge
                                variant="destructive"
                                className="absolute -top-2 -right-2 h-4 w-4 p-0 text-[10px] flex items-center justify-center"
                              >
                                {unreadCount > 9 ? '9+' : unreadCount}
                              </Badge>
                            )}
                          </div>
                          <span className="truncate">Notifications</span>
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent className="w-80" align="end">
                        {/* Header */}
                        <div className="flex items-center justify-between p-4 border-b border-border">
                          <h3 className="font-semibold">Notifications</h3>
                          {unreadCount > 0 && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                // Mark all as read logic would go here
                              }}
                              className="text-xs"
                            >
                              Mark all as read
                            </Button>
                          )}
                        </div>

                        {/* Notifications List */}
                        <div className="max-h-96 overflow-y-auto">
                          <div className="p-4 text-center text-muted-foreground">
                            <Bell className="w-8 h-8 mx-auto mb-2 opacity-50" />
                            <p className="text-sm">No notifications yet</p>
                          </div>
                        </div>

                        {/* Footer */}
                        <div className="p-2 border-t border-border">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="w-full justify-center"
                            onClick={() => {
                              // Navigate to notifications page
                            }}
                          >
                            View All Notifications
                          </Button>
                        </div>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
                )}
              </div>
            </div>
          ) : (
            <div className="hidden md:flex items-center space-x-2">
              {/* Public navigation for non-authenticated users */}
              <Link 
                href="/demo/dashboard" 
                className="flex flex-col items-center justify-center px-4 py-2 rounded-md text-xs font-medium transition-all duration-200 min-w-[80px] group text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-gray-50 dark:hover:bg-gray-800"
              >
                <Home className="w-5 h-5 mb-1 transition-all duration-200 group-hover:scale-110" />
                <span className="truncate">Dashboard</span>
              </Link>
              <Link 
                href="/demo/opportunities" 
                className="flex flex-col items-center justify-center px-4 py-2 rounded-md text-xs font-medium transition-all duration-200 min-w-[80px] group text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-gray-50 dark:hover:bg-gray-800"
              >
                <Globe className="w-5 h-5 mb-1 transition-all duration-200 group-hover:scale-110" />
                <span className="truncate">Opportunities</span>
              </Link>
              <Link 
                href="/demo/leaderboards" 
                className="flex flex-col items-center justify-center px-4 py-2 rounded-md text-xs font-medium transition-all duration-200 min-w-[80px] group text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-gray-50 dark:hover:bg-gray-800"
              >
                <Trophy className="w-5 h-5 mb-1 transition-all duration-200 group-hover:scale-110" />
                <span className="truncate">Leaderboards</span>
              </Link>
              <Link 
                href="/methodology" 
                className="flex flex-col items-center justify-center px-4 py-2 rounded-md text-xs font-medium transition-all duration-200 min-w-[80px] group text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-gray-50 dark:hover:bg-gray-800"
              >
                <BookOpen className="w-5 h-5 mb-1 transition-all duration-200 group-hover:scale-110" />
                <span className="truncate">Methodology</span>
              </Link>
              <Link 
                href="/esg-methodology" 
                className="flex flex-col items-center justify-center px-4 py-2 rounded-md text-xs font-medium transition-all duration-200 min-w-[80px] group text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-gray-50 dark:hover:bg-gray-800"
              >
                <Leaf className="w-5 h-5 mb-1 transition-all duration-200 group-hover:scale-110" />
                <span className="truncate">ESG</span>
              </Link>
              <Link 
                href="/demo/community" 
                className="flex flex-col items-center justify-center px-4 py-2 rounded-md text-xs font-medium transition-all duration-200 min-w-[80px] group text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-gray-50 dark:hover:bg-gray-800"
              >
                <Users className="w-5 h-5 mb-1 transition-all duration-200 group-hover:scale-110" />
                <span className="truncate">Community</span>
              </Link>
            </div>
          )}

          {/* Right Side Actions */}
          <div className="flex items-center space-x-3">
            {user ? (
              <>
                {/* Functional Search Bar */}
                <div className="hidden md:flex items-center relative">
                  {showSearch ? (
                    <form onSubmit={handleSearch} className="flex items-center">
                      <input
                        id="navbar-search"
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search events, users, communities..."
                        className="w-64 px-4 py-2 pr-10 text-sm bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                        onBlur={() => {
                          if (!searchQuery.trim()) {
                            setShowSearch(false);
                          }
                        }}
                      />
                      <button
                        type="button"
                        onClick={() => setShowSearch(false)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </form>
                  ) : (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleSearchToggle}
                      className="text-gray-600 dark:text-gray-300"
                    >
                      <Search className="w-4 h-4" />
                    </Button>
                  )}
                </div>


                {/* Profile Dropdown */}
                <DropdownMenu open={dropdownOpen} onOpenChange={setDropdownOpen}>
                  <DropdownMenuTrigger asChild>
                    <button className="relative h-10 w-10 p-0 rounded-full ring-2 ring-transparent hover:ring-purple-200 dark:hover:ring-purple-800 transition-all duration-200 cursor-pointer border-0 outline-none focus:outline-none focus:ring-purple-200 dark:focus:ring-purple-800" style={{
                      background: 'linear-gradient(to right, #2563eb, #9333ea)'
                    }}>
                      <span className="text-white font-semibold text-sm">
                        {user.name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || 'U'}
                      </span>
                      <div className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-green-500 border-2 border-white dark:border-gray-900"></div>
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-72 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-lg rounded-xl overflow-hidden" align="end" forceMount>
                    {/* Profile Header */}
                    <div className="px-4 py-4 bg-gray-50 dark:bg-gray-800 border-b border-gray-100 dark:border-gray-700">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-12 w-12 ring-2 ring-purple-100 dark:ring-purple-800">
                          {isOrgContext && organizationData ? (
                            <>
                              {organizationData.logo ? (
                                <Image 
                                  src={organizationData.logo} 
                                  alt={organizationData.name}
                                  width={48}
                                  height={48}
                                  className="h-full w-full object-cover rounded-full"
                                />
                              ) : (
                                <AvatarFallback className="bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold text-lg" delayMs={0}>
                                  {organizationData.name?.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2) || 'O'}
                                </AvatarFallback>
                              )}
                            </>
                          ) : (
                            <AvatarFallback className="bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold text-lg" delayMs={0}>
                              {user.name?.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2) || 'U'}
                            </AvatarFallback>
                          )}
                        </Avatar>
                        <div className="flex flex-col space-y-1 min-w-0 flex-1">
                          <p className="font-semibold text-base text-gray-900 dark:text-white truncate">
                            {isOrgContext && organizationData ? organizationData.name : user.name}
                          </p>
                          <p className="text-sm text-gray-600 dark:text-gray-400 truncate">
                            {isOrgContext && organizationData ? organizationData.email : user.email}
                          </p>
                          <div>
                            <Badge className="text-xs bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-200 border-0">
                              {isOrgContext && organizationData 
                                ? getOrganizationTypeDisplay(organizationData.type)
                                : user.userType === 'NGO' ? 'NGO' : user.userType === 'COMPANY' ? 'Company' : 'Individual'
                              }
                            </Badge>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Menu Items */}
                    <div className="py-2">
                      {/* Individual Profile - Only for non-organization users */}
                      {!isOrganization && (
                        <>
                          <Link href="/profile">
                            <DropdownMenuItem className="mx-2 px-3 py-3 rounded-lg">
                              <User className="mr-3 h-5 w-5 text-gray-500 dark:text-gray-400" />
                              <div className="flex flex-col">
                                <span className="font-medium text-gray-900 dark:text-white">My Profile</span>
                                <span className="text-xs text-gray-500 dark:text-gray-400">View and edit profile</span>
                              </div>
                            </DropdownMenuItem>
                          </Link>

                          <Link href="/recommendations">
                            <DropdownMenuItem className="mx-2 px-3 py-3 rounded-lg">
                              <Target className="mr-3 h-5 w-5 text-gray-500 dark:text-gray-400" />
                              <div className="flex flex-col">
                                <span className="font-medium text-gray-900 dark:text-white">For You</span>
                                <span className="text-xs text-gray-500 dark:text-gray-400">Personalized recommendations</span>
                              </div>
                            </DropdownMenuItem>
                          </Link>

                          <Link href="/analytics">
                            <DropdownMenuItem className="mx-2 px-3 py-3 rounded-lg">
                              <BarChart3 className="mr-3 h-5 w-5 text-gray-500 dark:text-gray-400" />
                              <div className="flex flex-col">
                                <span className="font-medium text-gray-900 dark:text-white">Analytics</span>
                                <span className="text-xs text-gray-500 dark:text-gray-400">View your statistics</span>
                              </div>
                            </DropdownMenuItem>
                          </Link>
                        </>
                      )}

                      <Link href={isOrganization ? "/organization/dashboard" : "/dashboard"}>
                        <DropdownMenuItem className="mx-2 px-3 py-3 rounded-lg">
                          <BarChart3 className="mr-3 h-5 w-5 text-gray-500 dark:text-gray-400" />
                          <div className="flex flex-col">
                            <span className="font-medium text-gray-900 dark:text-white">Dashboard</span>
                            <span className="text-xs text-gray-500 dark:text-gray-400">View your impact</span>
                          </div>
                        </DropdownMenuItem>
                      </Link>

                      {/* Organization Settings */}
                      {isOrganization ? (
                        <>
                          <Link href="/organization/profile">
                            <DropdownMenuItem className="mx-2 px-3 py-3 rounded-lg">
                              <Building2 className="mr-3 h-5 w-5 text-gray-500 dark:text-gray-400" />
                              <div className="flex flex-col">
                                <span className="font-medium text-gray-900 dark:text-white">Profile</span>
                                <span className="text-xs text-gray-500 dark:text-gray-400">Organization profile</span>
                              </div>
                            </DropdownMenuItem>
                          </Link>

                          <Link href="/organization/settings/billing">
                            <DropdownMenuItem className="mx-2 px-3 py-3 rounded-lg">
                              <CreditCard className="mr-3 h-5 w-5 text-gray-500 dark:text-gray-400" />
                              <div className="flex flex-col">
                                <span className="font-medium text-gray-900 dark:text-white">Billing & Subscription</span>
                                <span className="text-xs text-gray-500 dark:text-gray-400">Manage subscription</span>
                              </div>
                            </DropdownMenuItem>
                          </Link>

                          <Link href="/organization/settings/members">
                            <DropdownMenuItem className="mx-2 px-3 py-3 rounded-lg">
                              <Shield className="mr-3 h-5 w-5 text-gray-500 dark:text-gray-400" />
                              <div className="flex flex-col">
                                <span className="font-medium text-gray-900 dark:text-white">Members & Permissions</span>
                                <span className="text-xs text-gray-500 dark:text-gray-400">Manage team access</span>
                              </div>
                            </DropdownMenuItem>
                          </Link>
                        </>
                      ) : (
                        <Link href="/settings">
                          <DropdownMenuItem className="mx-2 px-3 py-3 rounded-lg">
                            <Settings className="mr-3 h-5 w-5 text-gray-500 dark:text-gray-400" />
                            <div className="flex flex-col">
                              <span className="font-medium text-gray-900 dark:text-white">Settings</span>
                              <span className="text-xs text-gray-500 dark:text-gray-400">Account preferences</span>
                            </div>
                          </DropdownMenuItem>
                        </Link>
                      )}

                      <div className="mx-2 my-2 border-t border-gray-100 dark:border-gray-700"></div>

                      <button
                        onClick={() => {
                          console.log('Sign out clicked');
                          setDropdownOpen(false);
                          signOut({ callbackUrl: '/' });
                        }}
                        className="mx-2 px-3 py-3 rounded-lg text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 focus:text-red-700 dark:focus:text-red-300 w-full text-left flex items-center transition-all duration-200 hover:scale-105 focus:scale-105"
                      >
                        <LogOut className="mr-3 h-5 w-5" />
                        <div className="flex flex-col">
                          <span className="font-medium">Sign Out</span>
                          <span className="text-xs text-red-500 dark:text-red-400">Sign out of your account</span>
                        </div>
                      </button>
                    </div>
                  </DropdownMenuContent>
                </DropdownMenu>

                {/* Theme Toggle */}
                <ThemeToggle />
              </>
            ) : (
              <>
                {/* Theme Toggle */}
                <ThemeToggle />

                <Link href="/signin">
                <Button 
                  variant="outline"
                  className="border-2 border-gray-300 dark:border-gray-600 hover:border-purple-500 dark:hover:border-purple-400 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:text-purple-600 dark:hover:text-purple-400 font-semibold px-6 py-2.5 rounded-lg transition-all duration-200 hover:shadow-md"
                >
                  Sign In
                </Button>
              </Link>
                <Link href="/journey">
                  <Button 
                    className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold px-6 py-2.5 rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105"
                  >
                    Get Started
                  </Button>
                </Link>
              </>
            )}

            {/* Mobile Menu Toggle */}
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              onClick={() => setIsOpen(!isOpen)}
            >
              {isOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </Button>

            {/* Mobile Search Toggle */}
            {user && (
              <Button
                variant="ghost"
                size="icon"
                className="md:hidden"
                onClick={handleSearchToggle}
              >
                <Search className="w-4 h-4" />
              </Button>
            )}
          </div>
        </div>

      </div>

      {/* Mobile Navigation Dropdown */}
      {isOpen && (
        <div className="md:hidden bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 shadow-lg">
          <div className="px-6 py-4 space-y-2">
            {user ? (
              <>
                {/* Authenticated User Menu */}
                {navItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = pathname.startsWith(item.href);

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={cn(
                        "flex items-center space-x-3 px-4 py-3 rounded-lg text-base font-medium transition-colors",
                        isActive
                          ? "text-blue-600 bg-blue-50 dark:bg-blue-950/30 dark:text-blue-400"
                          : "text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-800"
                      )}
                      onClick={() => setIsOpen(false)}
                    >
                      <Icon className="w-5 h-5" />
                      <span>{item.label}</span>
                    </Link>
                  );
                })}

                <div className="border-t border-gray-200 dark:border-gray-700 pt-3 mt-3">
                  <Link href="/events/create">
                    <Button 
                      className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white rounded-lg py-3" 
                      onClick={() => setIsOpen(false)}
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Create Event
                    </Button>
                  </Link>
                </div>

                {/* Mobile User Profile Section */}
                <div className="border-t border-gray-200 dark:border-gray-700 pt-3 mt-3">
                  <div className="flex items-center gap-3 px-4 py-3 bg-gradient-to-r from-purple-50 to-purple-50 dark:from-purple-950/20 dark:to-purple-950/20 rounded-lg mb-3">
                    <Avatar className="h-10 w-10">
                      <AvatarFallback className="bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold text-sm" delayMs={0}>
                        {user.name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || 'U'}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col space-y-1 leading-none">
                      <p className="font-semibold text-sm text-gray-900 dark:text-gray-100">{user.name}</p>
                      <p className="text-xs text-gray-600 dark:text-gray-400 truncate">
                        {user.email}
                      </p>
                      <div>
                        <Badge variant="secondary" className="text-xs">
                          {user.userType === 'NGO' ? 'NGO' : user.userType === 'COMPANY' ? 'Company' : 'Individual'}
                        </Badge>
                      </div>
                    </div>
                  </div>

                  <Link
                    href="/profile"
                    className="flex items-center space-x-3 px-4 py-3 rounded-lg text-base font-medium text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                    onClick={() => setIsOpen(false)}
                  >
                    <User className="w-5 h-5" />
                    <span>My Profile</span>
                  </Link>

                  <Link
                    href="/recommendations"
                    className="flex items-center space-x-3 px-4 py-3 rounded-lg text-base font-medium text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                    onClick={() => setIsOpen(false)}
                  >
                    <Target className="w-5 h-5" />
                    <span>For You</span>
                  </Link>

                  {!isOrganization && (
                    <Link
                      href="/analytics"
                      className="flex items-center space-x-3 px-4 py-3 rounded-lg text-base font-medium text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                      onClick={() => setIsOpen(false)}
                    >
                      <BarChart3 className="w-5 h-5" />
                      <span>Analytics</span>
                    </Link>
                  )}

                  <Link
                    href="/settings"
                    className="flex items-center space-x-3 px-4 py-3 rounded-lg text-base font-medium text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                    onClick={() => setIsOpen(false)}
                  >
                    <Settings className="w-5 h-5" />
                    <span>Settings</span>
                  </Link>

                  <button
                    onClick={() => {
                      setIsOpen(false);
                      signOut({ callbackUrl: '/' });
                    }}
                    className="flex items-center space-x-3 px-4 py-3 rounded-lg text-base font-medium text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors w-full text-left"
                  >
                    <LogOut className="w-5 h-5" />
                    <span>Sign Out</span>
                  </button>

                  {/* Theme Toggle for Mobile */}
                  <div className="px-4 py-3">
                    <div className="flex items-center justify-between">
                      <span className="text-base font-medium text-gray-700 dark:text-gray-300">Theme</span>
                      <ThemeToggle />
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <>
                {/* Non-authenticated User Menu */}
                <Link
                  href="/events"
                  className="flex items-center space-x-3 px-4 py-3 rounded-lg text-base font-medium text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                  onClick={() => setIsOpen(false)}
                >
                  <Calendar className="w-5 h-5" />
                  <span>Events</span>
                </Link>
                
                <Link
                  href="/community"
                  className="flex items-center space-x-3 px-4 py-3 rounded-lg text-base font-medium text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                  onClick={() => setIsOpen(false)}
                >
                  <Users className="w-5 h-5" />
                  <span>Community</span>
                </Link>
                
                <Link
                  href="/leaderboards"
                  className="flex items-center space-x-3 px-4 py-3 rounded-lg text-base font-medium text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                  onClick={() => setIsOpen(false)}
                >
                  <Trophy className="w-5 h-5" />
                  <span>Leaderboards</span>
                </Link>

                <div className="border-t border-gray-200 dark:border-gray-700 pt-3 mt-3 space-y-2">
                  <Link href="/signin" className="w-full">
                    <Button 
                      variant="outline" 
                      className="w-full border-2 border-gray-300 hover:border-purple-500 text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100 py-3 rounded-lg font-medium"
                      onClick={() => setIsOpen(false)}
                    >
                      Sign In
                    </Button>
                  </Link>
                  <Link href="/signup">
                    <Button 
                      className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white py-3 rounded-lg font-medium shadow-lg"
                      onClick={() => setIsOpen(false)}
                    >
                      Get Started
                    </Button>
                  </Link>
                </div>

                {/* Theme Toggle for Mobile (Non-authenticated) */}
                <div className="border-t border-gray-200 dark:border-gray-700 pt-3 mt-3">
                  <div className="flex items-center justify-between px-4 py-3">
                    <span className="text-base font-medium text-gray-700 dark:text-gray-300">Theme</span>
                    <ThemeToggle />
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Mobile Search Overlay */}
      {showSearch && (
        <div className="md:hidden fixed inset-0 z-50 bg-black/50 backdrop-blur-sm">
          <div className="absolute top-16 left-4 right-4">
            <form onSubmit={handleSearch} className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-4">
              <div className="flex items-center space-x-3">
                <Search className="w-5 h-5 text-gray-400" />
                <input
                  id="mobile-navbar-search"
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search events, users, communities..."
                  className="flex-1 bg-transparent border-0 outline-none text-gray-900 dark:text-gray-100 placeholder:text-gray-500"
                  autoFocus
                />
                <button
                  type="button"
                  onClick={() => setShowSearch(false)}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </nav>

    {/* Mobile Bottom Navigation - LinkedIn Style */}
    {user && (
      <div className="fixed bottom-0 left-0 right-0 z-40 md:hidden bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 px-2 py-1">
        <div className="flex items-center justify-around">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname.startsWith(item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "relative flex flex-col items-center justify-center px-2 py-2 rounded-md text-xs font-medium transition-all duration-200 min-w-[60px]",
                  isActive
                    ? "text-purple-600 dark:text-purple-400"
                    : "text-gray-600 dark:text-gray-400"
                )}
              >
                <Icon className={cn(
                  "w-5 h-5 mb-1 transition-all duration-200",
                  isActive ? "scale-110" : ""
                )} />
                <span className="truncate text-[10px]">{item.label}</span>
                {isActive && (
                  <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-8 h-0.5 bg-purple-600 rounded-full"></div>
                )}
              </Link>
            );
          })}
        </div>
      </div>
    )}
    </>
  );
}