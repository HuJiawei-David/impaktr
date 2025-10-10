'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { signIn, useSession } from 'next-auth/react';
import { useForm } from 'react-hook-form';
import { 
  Eye, 
  EyeOff, 
  Mail, 
  Lock, 
  User, 
  ArrowRight, 
  Users, 
  Building2,
  Home,
  ArrowLeft,
  GraduationCap,
  Heart
} from 'lucide-react';
import { UserType } from '@prisma/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import Link from 'next/link';

interface SignupFormData {
  firstName?: string;
  lastName?: string;
  organizationName?: string;
  email: string;
  password: string;
  confirmPassword: string;
  userType: UserType;
}

const userTypeOptions = [
  { type: UserType.INDIVIDUAL, title: 'Individual', icon: User, gradient: 'from-blue-500 to-cyan-500', description: 'Personal impact tracking' },
  { type: UserType.NGO, title: 'NGO', icon: Heart, gradient: 'from-pink-500 to-rose-500', description: 'Non-profit organization' },
  { type: UserType.CORPORATE, title: 'Corporate', icon: Building2, gradient: 'from-purple-500 to-indigo-500', description: 'Corporate social responsibility' },
  { type: UserType.SCHOOL, title: 'School', icon: GraduationCap, gradient: 'from-green-500 to-emerald-500', description: 'Educational institution' },
  { type: UserType.HEALTHCARE, title: 'Healthcare', icon: Home, gradient: 'from-orange-500 to-amber-500', description: 'Medical organization' }
];

function SignupContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session } = useSession();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [userType, setUserType] = useState<UserType | null>(null);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setValue
  } = useForm<SignupFormData>();

  // Get user type from URL params and redirect if already authenticated
  useEffect(() => {
    if (session) {
      router.push('/profile-setup');
      return;
    }

    // Get user type from URL params
    const typeParam = searchParams?.get('type');
    if (typeParam) {
      const selectedType = typeParam.toUpperCase() as UserType;
      if (Object.values(UserType).includes(selectedType)) {
        setUserType(selectedType);
        setValue('userType', selectedType);
      } else {
        // Invalid type, redirect to journey page
        router.push('/journey');
      }
    } else {
      // No type specified, redirect to journey page
      router.push('/journey');
    }
  }, [session, router, searchParams, setValue]);

  // Show loading while determining user type
  if (!userType) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-slate-900 dark:via-blue-950 dark:to-indigo-950 flex items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <div className="inline-flex items-center space-x-2 mb-4">
            <span className="font-bold text-3xl bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              impaktr
            </span>
          </div>
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent"></div>
          <p className="text-gray-600 dark:text-gray-300">Setting up your account...</p>
        </div>
      </div>
    );
  }

  const password = watch('password');

  const onSubmit = async (data: SignupFormData) => {
    if (data.password !== data.confirmPassword) {
      return;
    }

    setIsLoading(true);
    setError(null); // Clear any previous errors
    
    try {
      // Create account with credentials
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: userType === UserType.INDIVIDUAL 
            ? `${data.firstName} ${data.lastName || ''}`.trim()
            : data.organizationName,
          email: data.email,
          password: data.password,
          userType: userType,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        const errorMessage = errorData.message || 'Registration failed';
        
        // Set user-friendly error message
        if (errorMessage.includes('already exists')) {
          setError('An account with this email already exists. Please sign in instead.');
        } else {
          setError(errorMessage);
        }
        return; // Stop execution here
      }

      // Sign in with the new credentials
      const signInResult = await signIn('credentials', {
        email: data.email,
        password: data.password,
        callbackUrl: '/profile-setup',
        redirect: false,
      });

      if (signInResult?.error) {
        setError('Sign in failed after registration. Please try signing in manually.');
        return;
      }

      router.push('/profile-setup');
    } catch (error) {
      console.error('Registration error:', error);
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleOAuthSignup = (provider: string) => {
    // Store the selected user type for after OAuth
    if (userType) {
      sessionStorage.setItem('selectedProfileType', userType);
    }
    signIn(provider, { callbackUrl: '/profile-setup' });
  };


  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-slate-900 dark:via-blue-950 dark:to-indigo-950">
      <div className="flex min-h-screen">
        {/* Left Content Section */}
        <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden">
          {/* Background Pattern */}
          <div className="absolute inset-0 bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-700">
            <div className="absolute inset-0 bg-black/20"></div>
            <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-white/10 rounded-full blur-3xl animate-pulse"></div>
            <div className="absolute bottom-1/4 right-1/4 w-48 h-48 bg-white/10 rounded-full blur-3xl animate-pulse animation-delay-300"></div>
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-white/5 rounded-full blur-3xl"></div>
          </div>
          
          {/* Content */}
          <div className="relative z-10 flex flex-col justify-center px-12 py-16 text-white">
            {/* Header */}
            <div className="mb-8">
              <Link href="/" className="inline-flex items-center mb-8">
                <span className="font-bold text-3xl text-white">
                  impaktr
                </span>
              </Link>
              
              <h1 className="text-4xl lg:text-5xl font-bold mb-4 leading-tight">
                Make Your Impact
                <br />
                <span className="bg-gradient-to-r from-yellow-400 to-orange-400 bg-clip-text text-transparent">
                  Measurable
                </span>
              </h1>
              <p className="text-xl text-blue-100 mb-8 leading-relaxed">
                Join the world's first platform to verify, measure, and celebrate your social impact. Turn your good deeds into a globally recognized impact score.
              </p>
            </div>

            {/* Features */}
            <div className="space-y-4 mb-8">
              <div className="flex items-center space-x-3">
                <div className="w-6 h-6 bg-green-400 rounded-full flex items-center justify-center">
                  <svg className="w-4 h-4 text-green-900" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
                <span className="text-blue-100">Verified Impact Scoring</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-6 h-6 bg-green-400 rounded-full flex items-center justify-center">
                  <svg className="w-4 h-4 text-green-900" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
                <span className="text-blue-100">UN SDG Badge System</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-6 h-6 bg-green-400 rounded-full flex items-center justify-center">
                  <svg className="w-4 h-4 text-green-900" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
                <span className="text-blue-100">Shareable Certificates</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-6 h-6 bg-green-400 rounded-full flex items-center justify-center">
                  <svg className="w-4 h-4 text-green-900" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
                <span className="text-blue-100">Global Leaderboards</span>
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-white mb-1">250K+</div>
                <div className="text-sm text-blue-200">Active Users</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-white mb-1">1.2M</div>
                <div className="text-sm text-blue-200">Impact Hours</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-white mb-1">17</div>
                <div className="text-sm text-blue-200">SDG Goals</div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Registration Section */}
        <div className="w-full lg:w-1/2 flex flex-col">
          {/* Header for mobile */}
          <div className="lg:hidden flex items-center justify-between p-6">
            <Link href="/" className="flex items-center">
              <span className="font-bold text-2xl md:text-3xl bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                impaktr
              </span>
            </Link>
            
            <Link 
              href="/" 
              className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100 transition-colors group"
            >
              <Home className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform" />
              Back to Homepage
            </Link>
          </div>

          {/* Back to homepage link for desktop */}
          <div className="hidden lg:flex justify-end p-6">
            <Link 
              href="/" 
              className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100 transition-colors group"
            >
              <Home className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform" />
              Back to Homepage
            </Link>
          </div>

          {/* Main Content */}
          <div className="flex-1 flex items-center justify-center px-6 lg:px-12 pb-8">
            <div className="w-full max-w-md">
              {/* Mobile Hero - Only show on small screens */}
              <div className="lg:hidden text-center mb-8">
                <h1 className="text-3xl font-bold mb-2">
                  <span className="text-slate-800 dark:text-slate-100">Join</span>{' '}
                  <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                    Impaktr
                  </span>
                </h1>
                <p className="text-gray-600 dark:text-gray-400">
                  Measure and celebrate your social impact
                </p>
              </div>

              {/* Registration Card */}
              <Card className="shadow-2xl border-0 bg-white/95 backdrop-blur-sm dark:bg-gray-900/95 overflow-hidden">
                <CardHeader className="pb-6">
                  <CardTitle className="text-xl font-bold text-center text-gray-900 dark:text-gray-100">
                    Create Account
                  </CardTitle>
                  <CardDescription className="text-center text-gray-600 dark:text-gray-400">
                    Complete your {userTypeOptions.find(opt => opt.type === userType)?.title.toLowerCase()} registration
                  </CardDescription>
                </CardHeader>
                
                <CardContent className="space-y-6">
                  {/* Show Selected User Type */}
                  {userType && (
                    <div className="flex items-center justify-between pb-4 border-b border-gray-100 dark:border-gray-800">
                      <Link
                        href="/journey"
                        className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 font-normal text-sm flex items-center"
                      >
                        <ArrowLeft className="w-4 h-4 mr-1" />
                        Change type
                      </Link>
                      <div className="flex items-center space-x-2">
                        <div className={`w-6 h-6 rounded-lg bg-gradient-to-r ${userTypeOptions.find(opt => opt.type === userType)?.gradient} flex items-center justify-center`}>
                          {React.createElement(userTypeOptions.find(opt => opt.type === userType)?.icon || User, { className: "w-3 h-3 text-white" })}
                        </div>
                        <span className="text-sm text-gray-500 dark:text-gray-400 font-medium">
                          {userTypeOptions.find(opt => opt.type === userType)?.title} Account
                        </span>
                      </div>
                    </div>
                  )}

              {/* Signup Form */}
              {userType && (
                <>
                  {/* OAuth Buttons */}
                  <div className="space-y-3">
                    <Button
                      variant="outline"
                      onClick={() => handleOAuthSignup('google')}
                      className="w-full h-11 border-2 border-gray-200 hover:border-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-all duration-200"
                      disabled={isLoading}
                    >
                      <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24">
                        <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                        <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                        <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                        <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                      </svg>
                      Continue with Google
                    </Button>
                  </div>

                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <Separator className="border-gray-200 dark:border-gray-700" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                      <span className="bg-white dark:bg-gray-900 px-3 text-gray-500 dark:text-gray-400">
                        Or with email
                      </span>
                    </div>
                  </div>

                  {/* Compact Form */}
                  <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                    {/* Error Alert */}
                    {error && (
                      <div className="bg-red-50 dark:bg-red-900/20 border-2 border-red-200 dark:border-red-800 rounded-lg p-4">
                        <div className="flex items-start">
                          <div className="flex-shrink-0">
                            <svg className="w-5 h-5 text-red-600 dark:text-red-400" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                            </svg>
                          </div>
                          <div className="ml-3 flex-1">
                            <p className="text-sm font-medium text-red-800 dark:text-red-200">
                              {error}
                            </p>
                            {error.includes('already exists') && (
                              <button
                                type="button"
                                onClick={() => signIn()}
                                className="mt-2 inline-flex items-center text-sm font-semibold text-red-700 dark:text-red-300 hover:text-red-600 dark:hover:text-red-200 underline"
                              >
                                Go to Sign In →
                              </button>
                            )}
                          </div>
                          <button
                            type="button"
                            onClick={() => setError(null)}
                            className="ml-3 flex-shrink-0 text-red-400 hover:text-red-600 dark:text-red-300 dark:hover:text-red-100"
                          >
                            <span className="sr-only">Dismiss</span>
                            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    )}
                    
                    {/* Name Fields - Different for Individual vs Organization */}
                    {userType === UserType.INDIVIDUAL ? (
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <Label htmlFor="firstName" className="text-xs font-medium text-gray-700 dark:text-gray-300">First Name</Label>
                          <div className="relative">
                            <User className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                            <Input
                              id="firstName"
                              type="text"
                              placeholder="First name"
                              className="pl-8 h-10 text-sm"
                              {...register('firstName', { required: 'First name is required' })}
                            />
                          </div>
                          {errors.firstName && <p className="text-xs text-red-600">{errors.firstName.message}</p>}
                        </div>
                        <div className="space-y-1">
                          <Label htmlFor="lastName" className="text-xs font-medium text-gray-700 dark:text-gray-300">Last Name</Label>
                          <div className="relative">
                            <User className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                            <Input
                              id="lastName"
                              type="text"
                              placeholder="Last name (optional)"
                              className="pl-8 h-10 text-sm"
                              {...register('lastName')}
                            />
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-1">
                        <Label htmlFor="organizationName" className="text-xs font-medium text-gray-700 dark:text-gray-300">Organization Name</Label>
                        <div className="relative">
                          <Building2 className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                          <Input
                            id="organizationName"
                            type="text"
                            placeholder="Organization name"
                            className="pl-8 h-10 text-sm"
                            {...register('organizationName', { required: 'Organization name is required' })}
                          />
                        </div>
                        {errors.organizationName && <p className="text-xs text-red-600">{errors.organizationName.message}</p>}
                      </div>
                    )}

                    {/* Email Field - Single Line */}
                    <div className="space-y-1">
                      <Label htmlFor="email" className="text-xs font-medium text-gray-700 dark:text-gray-300">Email</Label>
                      <div className="relative">
                        <Mail className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                        <Input
                          id="email"
                          type="email"
                          placeholder="Email"
                          className="pl-8 h-10 text-sm"
                          {...register('email', {
                            required: 'Email is required',
                            pattern: {
                              value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                              message: 'Invalid email',
                            },
                          })}
                        />
                      </div>
                      {errors.email && <p className="text-xs text-red-600">{errors.email.message}</p>}
                    </div>

                    {/* Password Field - Single Line */}
                    <div className="space-y-1">
                      <Label htmlFor="password" className="text-xs font-medium text-gray-700 dark:text-gray-300">Password</Label>
                      <div className="relative">
                        <Lock className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                        <Input
                          id="password"
                          type={showPassword ? 'text' : 'password'}
                          placeholder="Password"
                          className="pl-8 pr-8 h-10 text-sm"
                          {...register('password', {
                            required: 'Password is required',
                            minLength: { value: 8, message: 'Min 8 characters' },
                          })}
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                        >
                          {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                      {errors.password && <p className="text-xs text-red-600">{errors.password.message}</p>}
                    </div>

                    {/* Confirm Password Field - Single Line */}
                    <div className="space-y-1">
                      <Label htmlFor="confirmPassword" className="text-xs font-medium text-gray-700 dark:text-gray-300">Confirm Password</Label>
                      <div className="relative">
                        <Lock className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                        <Input
                          id="confirmPassword"
                          type={showConfirmPassword ? 'text' : 'password'}
                          placeholder="Confirm password"
                          className="pl-8 pr-8 h-10 text-sm"
                          {...register('confirmPassword', {
                            required: 'Please confirm password',
                            validate: (value) => value === password || 'Passwords do not match',
                          })}
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                        >
                          {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                      {errors.confirmPassword && <p className="text-xs text-red-600">{errors.confirmPassword.message}</p>}
                    </div>

                    <Button
                      type="submit"
                      className="w-full h-11 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-[1.02]"
                      disabled={isLoading}
                    >
                      {isLoading ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                      ) : (
                        <ArrowRight className="w-4 h-4 mr-2" />
                      )}
                      Create Account
                    </Button>
                  </form>

                  <div className="text-center pt-2">
                    <p className="text-xs text-gray-600 dark:text-gray-400">
                      Already have an account?{' '}
                      <button
                        type="button"
                        onClick={() => signIn()}
                        className="font-medium text-blue-600 hover:text-blue-500 transition-colors underline"
                      >
                        Sign in
                      </button>
                    </p>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

              {/* Compact Terms */}
              <p className="text-xs text-gray-500 dark:text-gray-400 text-center mt-4">
                By creating an account, you agree to our{' '}
                <Link href="/terms" className="underline hover:text-gray-700 dark:hover:text-gray-300 transition-colors">
                  Terms
                </Link>{' '}
                and{' '}
                <Link href="/privacy" className="underline hover:text-gray-700 dark:hover:text-gray-300 transition-colors">
                  Privacy Policy
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function SignupPage() {
  return (
    <React.Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-slate-900 dark:via-blue-950 dark:to-indigo-950 flex items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <div className="inline-flex items-center space-x-2 mb-4">
            <span className="font-bold text-3xl bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              impaktr
            </span>
          </div>
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent"></div>
          <p className="text-gray-600 dark:text-gray-300">Loading...</p>
        </div>
      </div>
    }>
      <SignupContent />
    </React.Suspense>
  );
}