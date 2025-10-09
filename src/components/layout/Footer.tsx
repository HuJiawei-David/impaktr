// home/ubuntu/impaktrweb/src/components/layout/Footer.tsx

'use client';

import React from 'react';
import Link from 'next/link';
import { 
  Globe, 
  Mail, 
  Twitter, 
  Linkedin, 
  Facebook, 
  Instagram,
  Youtube,
  Heart,
  Award,
  Users,
  BarChart3,
  FileText,
  HelpCircle,
  Shield
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';

const footerLinks = {
  platform: {
    title: 'Platform',
    links: [
      { label: 'Dashboard', href: '/dashboard', icon: BarChart3 },
      { label: 'Events', href: '/events', icon: Users },
      { label: 'Leaderboards', href: '/leaderboards', icon: Award },
      { label: 'Community', href: '/community', icon: Users },
      { label: 'Analytics', href: '/analytics', icon: BarChart3 }
    ]
  },
  resources: {
    title: 'Resources',
    links: [
      { label: 'Help Center', href: '/help', icon: HelpCircle },
      { label: 'API Documentation', href: '/docs/api', icon: FileText },
      { label: 'SDG Guidelines', href: '/docs/sdg', icon: Award },
      { label: 'Verification Guide', href: '/docs/verification', icon: Shield },
      { label: 'Best Practices', href: '/docs/best-practices', icon: FileText }
    ]
  },
  company: {
    title: 'Company',
    links: [
      { label: 'About Us', href: '/about' },
      { label: 'Our Mission', href: '/mission' },
      { label: 'Careers', href: '/careers' },
      { label: 'Press Kit', href: '/press' },
      { label: 'Contact', href: '/contact' }
    ]
  },
  legal: {
    title: 'Legal',
    links: [
      { label: 'Privacy Policy', href: '/privacy' },
      { label: 'Terms of Service', href: '/terms' },
      { label: 'Cookie Policy', href: '/cookies' },
      { label: 'Data Protection', href: '/data-protection' },
      { label: 'Compliance', href: '/compliance' }
    ]
  }
};

const socialLinks = [
  { 
    label: 'Twitter', 
    href: 'https://twitter.com/impaktrcom', 
    icon: Twitter,
    color: 'hover:text-blue-400'
  },
  { 
    label: 'LinkedIn', 
    href: 'https://linkedin.com/company/impaktr', 
    icon: Linkedin,
    color: 'hover:text-blue-600'
  },
  { 
    label: 'Facebook', 
    href: 'https://facebook.com/impaktr', 
    icon: Facebook,
    color: 'hover:text-blue-500'
  },
  { 
    label: 'Instagram', 
    href: 'https://instagram.com/impaktr', 
    icon: Instagram,
    color: 'hover:text-pink-500'
  },
  { 
    label: 'YouTube', 
    href: 'https://youtube.com/@impaktr', 
    icon: Youtube,
    color: 'hover:text-red-500'
  }
];

const sdgColors = [
  '#e5243b', '#dda63a', '#4c9f38', '#c5192d', '#ff3a21',
  '#26bde2', '#fcc30b', '#a21942', '#fd6925', '#dd1367',
  '#fd9d24', '#bf8b2e', '#3f7e44', '#0a97d9', '#56c02b',
  '#00689d', '#19486a'
];

export function Footer() {
  const [email, setEmail] = React.useState('');
  const [isSubscribing, setIsSubscribing] = React.useState(false);

  const handleNewsletterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setIsSubscribing(true);
    try {
      // Here you would implement newsletter subscription
      await new Promise(resolve => setTimeout(resolve, 1000)); // Mock delay
      setEmail('');
      // Show success message
    } catch (error) {
      console.error('Newsletter subscription failed:', error);
    } finally {
      setIsSubscribing(false);
    }
  };

  return (
    <footer className="bg-gradient-to-b from-white via-white to-blue-50 dark:bg-gray-900">
      {/* Newsletter Section - White Background */}
      <div className="relative py-16 overflow-hidden bg-white dark:bg-gray-900">
        {/* Dreamy animated background elements - Same as Hero */}
        <div className="absolute inset-0 overflow-hidden">
          {/* Large dreamy floating bubbles with glow */}
          <div className="absolute top-20 left-20 w-16 h-16 bg-gradient-to-br from-blue-400/30 to-cyan-400/20 rounded-full shadow-2xl shadow-blue-400/20 animate-bounce blur-sm" style={{ animationDelay: '0s', animationDuration: '6s' }}></div>
          <div className="absolute top-32 right-24 w-12 h-12 bg-gradient-to-br from-purple-400/35 to-pink-400/25 rounded-full shadow-2xl shadow-purple-400/25 animate-bounce blur-sm" style={{ animationDelay: '1s', animationDuration: '7s' }}></div>
          <div className="absolute bottom-32 left-32 w-10 h-10 bg-gradient-to-br from-emerald-400/40 to-teal-400/30 rounded-full shadow-2xl shadow-emerald-400/20 animate-bounce blur-sm" style={{ animationDelay: '2s', animationDuration: '5.5s' }}></div>
          <div className="absolute top-1/2 left-16 w-20 h-20 bg-gradient-to-br from-cyan-400/25 to-blue-400/20 rounded-full shadow-2xl shadow-cyan-400/15 animate-bounce blur-sm" style={{ animationDelay: '0.5s', animationDuration: '8s' }}></div>
          <div className="absolute bottom-20 right-16 w-14 h-14 bg-gradient-to-br from-violet-400/30 to-purple-400/25 rounded-full shadow-2xl shadow-violet-400/20 animate-bounce blur-sm" style={{ animationDelay: '1.5s', animationDuration: '6.5s' }}></div>
          <div className="absolute top-16 right-1/3 w-8 h-8 bg-gradient-to-br from-teal-400/35 to-emerald-400/30 rounded-full shadow-2xl shadow-teal-400/25 animate-bounce blur-sm" style={{ animationDelay: '2.5s', animationDuration: '7.5s' }}></div>
          
          {/* Extra large dreamy bubbles */}
          <div className="absolute top-1/4 left-1/4 w-24 h-24 bg-gradient-to-br from-blue-300/15 to-indigo-300/10 rounded-full shadow-2xl shadow-blue-300/10 animate-pulse blur-md" style={{ animationDelay: '0s', animationDuration: '10s' }}></div>
          <div className="absolute bottom-1/4 right-1/4 w-20 h-20 bg-gradient-to-br from-purple-300/18 to-pink-300/12 rounded-full shadow-2xl shadow-purple-300/12 animate-pulse blur-md" style={{ animationDelay: '3s', animationDuration: '12s' }}></div>
          <div className="absolute top-3/4 left-3/4 w-18 h-18 bg-gradient-to-br from-emerald-300/16 to-cyan-300/11 rounded-full shadow-2xl shadow-emerald-300/11 animate-pulse blur-md" style={{ animationDelay: '1.5s', animationDuration: '9s' }}></div>
          
          {/* Massive dreamy orbs */}
          <div className="absolute top-1/3 right-1/5 w-32 h-32 bg-gradient-to-br from-rose-300/12 to-pink-300/8 rounded-full shadow-2xl shadow-rose-300/8 animate-pulse blur-lg" style={{ animationDelay: '4s', animationDuration: '15s' }}></div>
          <div className="absolute bottom-1/3 left-1/5 w-28 h-28 bg-gradient-to-br from-indigo-300/14 to-blue-300/9 rounded-full shadow-2xl shadow-indigo-300/9 animate-pulse blur-lg" style={{ animationDelay: '6s', animationDuration: '13s' }}></div>
          
          {/* Enhanced gradient orbs with dreamy effects */}
          <div className="absolute -top-40 -right-32 w-96 h-96 bg-gradient-to-br from-emerald-500/25 to-teal-500/15 rounded-full blur-3xl animate-pulse opacity-60 shadow-2xl shadow-emerald-500/10" style={{ animationDuration: '16s' }}></div>
          <div className="absolute top-40 -left-32 w-80 h-80 bg-gradient-to-br from-blue-500/25 to-cyan-500/15 rounded-full blur-3xl animate-pulse opacity-50 shadow-2xl shadow-blue-500/10" style={{ animationDelay: '2s', animationDuration: '18s' }}></div>
          <div className="absolute -bottom-32 right-1/3 w-72 h-72 bg-gradient-to-br from-violet-500/25 to-purple-500/15 rounded-full blur-3xl animate-pulse opacity-70 shadow-2xl shadow-violet-500/10" style={{ animationDelay: '4s', animationDuration: '14s' }}></div>
          
          {/* Dreamy gradient layers */}
          <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-blue-900/8 via-transparent to-purple-900/8 animate-pulse" style={{ animationDuration: '20s' }}></div>
          <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-tl from-emerald-900/6 via-transparent to-cyan-900/6 animate-pulse" style={{ animationDelay: '10s', animationDuration: '25s' }}></div>
          <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-r from-pink-900/4 via-transparent to-rose-900/4 animate-pulse" style={{ animationDelay: '15s', animationDuration: '22s' }}></div>
          
          {/* Subtle grid pattern overlay */}
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZGVmcz48cGF0dGVybiBpZD0iZ3JpZCIgd2lkdGg9IjQwIiBoZWlnaHQ9IjQwIiBwYXR0ZXJuVW5pdHM9InVzZXJTcGFjZU9uVXNlIj48cGF0aCBkPSJNIDQwIDAgTCAwIDAgMCA0MCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSJyZ2JhKDU5LCAxMzAsIDI0NiwgMC4wMykiIHN0cm9rZS13aWR0aD0iMSIvPjwvcGF0dGVybj48L2RlZnM+PHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsbD0idXJsKCNncmlkKSIvPjwvc3ZnPg==')] opacity-15"></div>
        </div>

        <div className="relative container mx-auto px-8 lg:px-12" style={{marginBottom: '1.5cm'}}>
          <div className="max-w-4xl mx-auto text-center">
            {/* Enhanced Header */}
            <div className="mb-12">
              <div className="inline-flex items-center px-6 py-3 bg-black/20 backdrop-blur-md border border-blue-500/30 rounded-full mb-6 shadow-2xl">
                <Mail className="w-4 h-4 text-white mr-2" />
                <span className="text-sm font-semibold text-white uppercase tracking-wide">Newsletter</span>
              </div>
              
              <h3 className="text-2xl md:text-4xl font-bold mb-4 text-black">
                <span className="text-black">Stay</span> <span className="text-black">Updated</span>
              </h3>
              
              <p className="text-lg text-black max-w-2xl mx-auto">
                Get the latest impact opportunities, platform updates, and success stories delivered to your inbox
              </p>
            </div>
            
            {/* Enhanced Form */}
            <form onSubmit={handleNewsletterSubmit} className="max-w-md mx-auto mb-8">
              <div className="flex flex-col sm:flex-row gap-4">
                <Input
                  type="email"
                  placeholder="Enter your email address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="flex-1 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border border-gray-200/50 dark:border-gray-700/50 rounded-xl px-4 py-3 text-base placeholder:text-gray-500 shadow-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500/50 transition-all duration-300"
                  required
                />
                <Button
                  type="submit"
                  disabled={isSubscribing}
                  className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-6 py-3 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-300 disabled:opacity-50 sm:w-auto w-full"
                >
                  {isSubscribing ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2"></div>
                      Subscribing...
                    </>
                  ) : (
                    <>
                      Subscribe
                      <Mail className="ml-2 w-4 h-4" />
                    </>
                  )}
                </Button>
              </div>
            </form>

            {/* Enhanced Features */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-6 text-sm text-white mb-6">
              <div className="flex items-center">
                <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                <span>Weekly impact insights</span>
              </div>
              <div className="flex items-center">
                <div className="w-2 h-2 bg-blue-500 rounded-full mr-2"></div>
                <span>Exclusive opportunities</span>
              </div>
              <div className="flex items-center">
                <div className="w-2 h-2 bg-purple-500 rounded-full mr-2"></div>
                <span>Platform updates</span>
              </div>
            </div>
            
            <p className="text-xs text-white">
              Join <strong>10,000+</strong> impact makers. Unsubscribe anytime. 
              <Link href="/privacy" className="!text-purple-400 hover:!text-purple-300 hover:underline ml-1">Privacy Policy</Link>
            </p>
          </div>
        </div>
      </div>

      {/* Main Footer Content */}
      <div className="container mx-auto px-8 lg:px-12 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Brand Section */}
          <div className="lg:col-span-1">
            <Link href="/" className="inline-flex items-center space-x-2 mb-4">
              <div className="w-7 h-7 rounded-lg bg-gradient-to-r from-blue-600 to-purple-600 flex items-center justify-center">
                <span className="text-white font-bold text-sm">I</span>
              </div>
              <span className="font-bold text-lg bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">Impaktr</span>
            </Link>
            
            <p className="text-gray-600 dark:text-gray-300 mb-4 max-w-sm text-sm">
              The world's first global standard for verified social impact.
            </p>

            {/* Social Links */}
            <div className="flex items-center space-x-3">
              {socialLinks.slice(0, 4).map((social) => {
                const Icon = social.icon;
                return (
                  <a
                    key={social.label}
                    href={social.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`text-gray-400 transition-colors ${social.color}`}
                    aria-label={social.label}
                  >
                    <Icon className="w-4 h-4" />
                  </a>
                );
              })}
            </div>
          </div>

          {/* Platform Links */}
          <div>
            <h4 className="font-semibold mb-3 text-gray-900 dark:text-white text-sm">
              Platform
            </h4>
            <ul className="space-y-2">
              {footerLinks.platform.links.slice(0, 5).map((link) => (
                <li key={link.href}>
                  <Link 
                    href={link.href}
                    className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100 transition-colors text-sm"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Resources Links */}
          <div>
            <h4 className="font-semibold mb-3 text-gray-900 dark:text-white text-sm">
              Resources
            </h4>
            <ul className="space-y-2">
              {footerLinks.resources.links.slice(0, 5).map((link) => (
                <li key={link.href}>
                  <Link 
                    href={link.href}
                    className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100 transition-colors text-sm"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Company Links */}
          <div>
            <h4 className="font-semibold mb-3 text-gray-900 dark:text-white text-sm">Company</h4>
            <ul className="space-y-2">
              {footerLinks.company.links.slice(0, 5).map((link) => (
                <li key={link.href}>
                  <Link 
                    href={link.href}
                    className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100 transition-colors text-sm"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* Polished Bottom Section */}
      <div className="border-t border-gray-200/60 dark:border-gray-700/60 bg-gradient-to-r from-gray-50/50 to-slate-50/50 dark:from-gray-900/50 dark:to-slate-900/50">
        <div className="container mx-auto px-8 lg:px-12 py-8">
          <div className="flex flex-col items-center space-y-4 text-center">
            {/* Centered copyright */}
            <div className="text-sm text-gray-600 dark:text-gray-300">
              © 2025 <span className="font-semibold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">impaktr</span>. All rights reserved.
            </div>

            {/* Centered legal links with stylish separators */}
            <div className="flex items-center space-x-1">
              <Link 
                href="/privacy" 
                className="px-3 py-1.5 text-sm text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50/50 dark:hover:bg-blue-950/20 rounded-md transition-all duration-200"
              >
                Privacy
              </Link>
              <div className="w-1 h-1 bg-gray-300 dark:bg-gray-600 rounded-full mx-1"></div>
              <Link 
                href="/terms" 
                className="px-3 py-1.5 text-sm text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50/50 dark:hover:bg-blue-950/20 rounded-md transition-all duration-200"
              >
                Terms
              </Link>
              <div className="w-1 h-1 bg-gray-300 dark:bg-gray-600 rounded-full mx-1"></div>
              <Link 
                href="/cookies" 
                className="px-3 py-1.5 text-sm text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50/50 dark:hover:bg-blue-950/20 rounded-md transition-all duration-200"
              >
                Cookies
              </Link>
              <div className="w-1 h-1 bg-gray-300 dark:bg-gray-600 rounded-full mx-1"></div>
              <Link 
                href="/support" 
                className="px-3 py-1.5 text-sm text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50/50 dark:hover:bg-blue-950/20 rounded-md transition-all duration-200"
              >
                Support
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}