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
    <footer className="bg-muted/30 border-t border-border">
      {/* Newsletter Section */}
      <div className="bg-primary/5 border-b border-border">
        <div className="container mx-auto px-4 py-12">
          <div className="max-w-4xl mx-auto text-center">
            <h3 className="text-2xl font-bold mb-4">
              Stay Updated with Global Impact
            </h3>
            <p className="text-muted-foreground mb-8 max-w-2xl mx-auto">
              Get the latest updates on social impact opportunities, new features, 
              and inspiring stories from our global community of changemakers.
            </p>
            
            <form onSubmit={handleNewsletterSubmit} className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
              <Input
                type="email"
                placeholder="Enter your email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="flex-1"
                required
              />
              <Button type="submit" disabled={isSubscribing}>
                {isSubscribing ? 'Subscribing...' : 'Subscribe'}
              </Button>
            </form>
            
            <p className="text-xs text-muted-foreground mt-3">
              By subscribing, you agree to our Privacy Policy and consent to receive updates from Impaktr.
            </p>
          </div>
        </div>
      </div>

      {/* Main Footer Content */}
      <div className="container mx-auto px-4 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 lg:gap-12">
          {/* Brand Section */}
          <div className="lg:col-span-2">
            <Link href="/" className="inline-flex items-center space-x-2 mb-6">
              <div className="w-10 h-10 rounded-lg brand-gradient flex items-center justify-center">
                <span className="text-white font-bold text-lg">I</span>
              </div>
              <span className="font-bold text-2xl brand-gradient-text">Impaktr</span>
            </Link>
            
            <p className="text-muted-foreground mb-6 max-w-sm">
              The world's first global standard for verified social impact. 
              Measure, verify, and benchmark your contributions to the UN Sustainable Development Goals.
            </p>

            {/* Stats */}
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="text-center p-3 rounded-lg bg-card border">
                <div className="font-bold text-lg brand-gradient-text">50K+</div>
                <div className="text-xs text-muted-foreground">Verified Users</div>
              </div>
              <div className="text-center p-3 rounded-lg bg-card border">
                <div className="font-bold text-lg brand-gradient-text">1.2M</div>
                <div className="text-xs text-muted-foreground">Impact Hours</div>
              </div>
            </div>

            {/* Social Links */}
            <div className="flex items-center space-x-4">
              {socialLinks.map((social) => {
                const Icon = social.icon;
                return (
                  <a
                    key={social.label}
                    href={social.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`text-muted-foreground transition-colors ${social.color}`}
                    aria-label={social.label}
                  >
                    <Icon className="w-5 h-5" />
                  </a>
                );
              })}
            </div>
          </div>

          {/* Platform Links */}
          <div>
            <h4 className="font-semibold mb-4 flex items-center">
              <Globe className="w-4 h-4 mr-2" />
              {footerLinks.platform.title}
            </h4>
            <ul className="space-y-3">
              {footerLinks.platform.links.map((link) => {
                const Icon = link.icon;
                return (
                  <li key={link.href}>
                    <Link 
                      href={link.href}
                      className="text-muted-foreground hover:text-foreground transition-colors flex items-center"
                    >
                      <Icon className="w-3 h-3 mr-2" />
                      {link.label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>

          {/* Resources Links */}
          <div>
            <h4 className="font-semibold mb-4 flex items-center">
              <FileText className="w-4 h-4 mr-2" />
              {footerLinks.resources.title}
            </h4>
            <ul className="space-y-3">
              {footerLinks.resources.links.map((link) => {
                const Icon = link.icon;
                return (
                  <li key={link.href}>
                    <Link 
                      href={link.href}
                      className="text-muted-foreground hover:text-foreground transition-colors flex items-center"
                    >
                      <Icon className="w-3 h-3 mr-2" />
                      {link.label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>

          {/* Company & Legal Links */}
          <div>
            <h4 className="font-semibold mb-4">{footerLinks.company.title}</h4>
            <ul className="space-y-3 mb-6">
              {footerLinks.company.links.map((link) => (
                <li key={link.href}>
                  <Link 
                    href={link.href}
                    className="text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>

            <h4 className="font-semibold mb-4">{footerLinks.legal.title}</h4>
            <ul className="space-y-3">
              {footerLinks.legal.links.map((link) => (
                <li key={link.href}>
                  <Link 
                    href={link.href}
                    className="text-muted-foreground hover:text-foreground transition-colors text-sm"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* SDG Section */}
      <div className="border-t border-border">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center mb-6">
            <h4 className="font-semibold mb-2">Supporting UN Sustainable Development Goals</h4>
            <p className="text-sm text-muted-foreground">
              Our platform enables individuals and organizations to contribute to all 17 SDGs
            </p>
          </div>
          
          <div className="flex flex-wrap justify-center gap-2 mb-6">
            {Array.from({ length: 17 }, (_, i) => i + 1).map((sdgNumber) => (
              <div
                key={sdgNumber}
                className="w-8 h-8 rounded flex items-center justify-center text-white text-xs font-bold transition-transform hover:scale-110 cursor-pointer"
                style={{ backgroundColor: sdgColors[sdgNumber - 1] }}
                title={`SDG ${sdgNumber}`}
              >
                {sdgNumber}
              </div>
            ))}
          </div>

          <div className="text-center">
            <Link 
              href="/sdgs" 
              className="text-sm text-primary hover:underline"
            >
              Learn more about the Sustainable Development Goals →
            </Link>
          </div>
        </div>
      </div>

      <Separator />

      {/* Bottom Section */}
      <div className="container mx-auto px-4 py-6">
        <div className="flex flex-col md:flex-row items-center justify-between space-y-4 md:space-y-0">
          <div className="flex items-center space-x-4 text-sm text-muted-foreground">
            <span>© 2024 Impaktr. All rights reserved.</span>
            <Separator orientation="vertical" className="h-4" />
            <span className="flex items-center">
              Made with <Heart className="w-3 h-3 mx-1 text-red-500" fill="currentColor" /> for a better world
            </span>
          </div>

          <div className="flex items-center space-x-4">
            <Badge variant="outline" className="text-xs">
              Global Impact Standard
            </Badge>
            <Badge variant="outline" className="text-xs">
              UN SDG Aligned
            </Badge>
            <Badge variant="outline" className="text-xs">
              Verified Impact
            </Badge>
          </div>
        </div>

        {/* Language Selector */}
        <div className="mt-4 pt-4 border-t border-border">
          <div className="flex items-center justify-center space-x-4">
            <span className="text-sm text-muted-foreground">Language:</span>
            <select className="text-sm bg-background border border-input rounded px-2 py-1">
              <option value="en">English</option>
              <option value="ms">Bahasa Malaysia</option>
              <option value="zh">中文</option>
              <option value="es">Español</option>
              <option value="fr">Français</option>
            </select>
          </div>
        </div>
      </div>
    </footer>
  );
}