'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { 
  Award, 
  Star, 
  Target, 
  TrendingUp, 
  Globe,
  Clock,
  Activity,
  ChevronRight,
  Filter,
  Grid3X3,
  List
} from 'lucide-react';
import { sdgs, getSDGById } from '@/constants/sdgs';
import { SDGCredentialCard } from './SDGCredentialCard';
import Link from 'next/link';

// SDG Badge tier definitions with themed names
const SDG_BADGE_DEFINITIONS = {
  1: { // No Poverty
    tiers: [
      { level: 1, name: 'Supporter', icon: '🤝', minHours: 5, minActivities: 1, color: 'from-red-400 to-red-600' },
      { level: 2, name: 'Advocate', icon: '📢', minHours: 20, minActivities: 3, color: 'from-red-500 to-red-700' },
      { level: 3, name: 'Builder', icon: '🏗️', minHours: 50, minActivities: 8, color: 'from-red-600 to-red-800' },
      { level: 4, name: 'Poverty Fighter', icon: '⚔️', minHours: 100, minActivities: 15, color: 'from-red-700 to-red-900' }
    ]
  },
  2: { // Zero Hunger
    tiers: [
      { level: 1, name: 'Food Giver', icon: '🍎', minHours: 5, minActivities: 1, color: 'from-yellow-400 to-yellow-600' },
      { level: 2, name: 'Nourisher', icon: '🌾', minHours: 20, minActivities: 3, color: 'from-yellow-500 to-yellow-700' },
      { level: 3, name: 'Hunger Solver', icon: '🍽️', minHours: 50, minActivities: 8, color: 'from-yellow-600 to-yellow-800' },
      { level: 4, name: 'Food Security Leader', icon: '👑', minHours: 100, minActivities: 15, color: 'from-yellow-700 to-yellow-900' }
    ]
  },
  3: { // Good Health & Well-being
    tiers: [
      { level: 1, name: 'Health Ally', icon: '🏥', minHours: 5, minActivities: 1, color: 'from-green-400 to-green-600' },
      { level: 2, name: 'Health Advocate', icon: '💚', minHours: 20, minActivities: 3, color: 'from-green-500 to-green-700' },
      { level: 3, name: 'Health Champion', icon: '🏆', minHours: 50, minActivities: 8, color: 'from-green-600 to-green-800' },
      { level: 4, name: 'Health Guardian', icon: '🛡️', minHours: 100, minActivities: 15, color: 'from-green-700 to-green-900' }
    ]
  },
  4: { // Quality Education
    tiers: [
      { level: 1, name: 'Tutor', icon: '📚', minHours: 5, minActivities: 1, color: 'from-blue-400 to-blue-600' },
      { level: 2, name: 'Mentor', icon: '👨‍🏫', minHours: 20, minActivities: 3, color: 'from-blue-500 to-blue-700' },
      { level: 3, name: 'Knowledge Builder', icon: '🧠', minHours: 50, minActivities: 8, color: 'from-blue-600 to-blue-800' },
      { level: 4, name: 'Education Leader', icon: '🎓', minHours: 100, minActivities: 15, color: 'from-blue-700 to-blue-900' }
    ]
  },
  5: { // Gender Equality
    tiers: [
      { level: 1, name: 'Supporter', icon: '🤝', minHours: 5, minActivities: 1, color: 'from-purple-400 to-purple-600' },
      { level: 2, name: 'Equalizer', icon: '⚖️', minHours: 20, minActivities: 3, color: 'from-purple-500 to-purple-700' },
      { level: 3, name: 'Advocate', icon: '📢', minHours: 50, minActivities: 8, color: 'from-purple-600 to-purple-800' },
      { level: 4, name: 'Justice Leader', icon: '👑', minHours: 100, minActivities: 15, color: 'from-purple-700 to-purple-900' }
    ]
  },
  6: { // Clean Water & Sanitation
    tiers: [
      { level: 1, name: 'Water Ally', icon: '💧', minHours: 5, minActivities: 1, color: 'from-cyan-400 to-cyan-600' },
      { level: 2, name: 'Water Builder', icon: '🚰', minHours: 20, minActivities: 3, color: 'from-cyan-500 to-cyan-700' },
      { level: 3, name: 'Water Guardian', icon: '🌊', minHours: 50, minActivities: 8, color: 'from-cyan-600 to-cyan-800' },
      { level: 4, name: 'Sanitation Leader', icon: '🏗️', minHours: 100, minActivities: 15, color: 'from-cyan-700 to-cyan-900' }
    ]
  },
  7: { // Affordable & Clean Energy
    tiers: [
      { level: 1, name: 'Energy Helper', icon: '⚡', minHours: 5, minActivities: 1, color: 'from-amber-400 to-amber-600' },
      { level: 2, name: 'Innovator', icon: '🔋', minHours: 20, minActivities: 3, color: 'from-amber-500 to-amber-700' },
      { level: 3, name: 'Energy Advocate', icon: '☀️', minHours: 50, minActivities: 8, color: 'from-amber-600 to-amber-800' },
      { level: 4, name: 'Renewable Leader', icon: '🌞', minHours: 100, minActivities: 15, color: 'from-amber-700 to-amber-900' }
    ]
  },
  8: { // Decent Work & Economic Growth
    tiers: [
      { level: 1, name: 'Work Ally', icon: '💼', minHours: 5, minActivities: 1, color: 'from-rose-400 to-rose-600' },
      { level: 2, name: 'Skills Builder', icon: '🛠️', minHours: 20, minActivities: 3, color: 'from-rose-500 to-rose-700' },
      { level: 3, name: 'Economic Advocate', icon: '📈', minHours: 50, minActivities: 8, color: 'from-rose-600 to-rose-800' },
      { level: 4, name: 'Opportunity Creator', icon: '🚀', minHours: 100, minActivities: 15, color: 'from-rose-700 to-rose-900' }
    ]
  },
  9: { // Industry, Innovation & Infrastructure
    tiers: [
      { level: 1, name: 'Innovator', icon: '💡', minHours: 5, minActivities: 1, color: 'from-orange-400 to-orange-600' },
      { level: 2, name: 'Builder', icon: '🏗️', minHours: 20, minActivities: 3, color: 'from-orange-500 to-orange-700' },
      { level: 3, name: 'Changemaker', icon: '⚙️', minHours: 50, minActivities: 8, color: 'from-orange-600 to-orange-800' },
      { level: 4, name: 'Innovation Leader', icon: '🔬', minHours: 100, minActivities: 15, color: 'from-orange-700 to-orange-900' }
    ]
  },
  10: { // Reduced Inequalities
    tiers: [
      { level: 1, name: 'Supporter', icon: '🤝', minHours: 5, minActivities: 1, color: 'from-pink-400 to-pink-600' },
      { level: 2, name: 'Equalizer', icon: '⚖️', minHours: 20, minActivities: 3, color: 'from-pink-500 to-pink-700' },
      { level: 3, name: 'Advocate', icon: '📢', minHours: 50, minActivities: 8, color: 'from-pink-600 to-pink-800' },
      { level: 4, name: 'Global Justice Leader', icon: '🌍', minHours: 100, minActivities: 15, color: 'from-pink-700 to-pink-900' }
    ]
  },
  11: { // Sustainable Cities & Communities
    tiers: [
      { level: 1, name: 'Community Ally', icon: '🏘️', minHours: 5, minActivities: 1, color: 'from-teal-400 to-teal-600' },
      { level: 2, name: 'Builder', icon: '🏗️', minHours: 20, minActivities: 3, color: 'from-teal-500 to-teal-700' },
      { level: 3, name: 'Advocate', icon: '🌆', minHours: 50, minActivities: 8, color: 'from-teal-600 to-teal-800' },
      { level: 4, name: 'Sustainable Leader', icon: '🌇', minHours: 100, minActivities: 15, color: 'from-teal-700 to-teal-900' }
    ]
  },
  12: { // Responsible Consumption & Production
    tiers: [
      { level: 1, name: 'Green Consumer', icon: '♻️', minHours: 5, minActivities: 1, color: 'from-lime-400 to-lime-600' },
      { level: 2, name: 'Responsible Actor', icon: '🌱', minHours: 20, minActivities: 3, color: 'from-lime-500 to-lime-700' },
      { level: 3, name: 'Eco Advocate', icon: '🌿', minHours: 50, minActivities: 8, color: 'from-lime-600 to-lime-800' },
      { level: 4, name: 'Sustainability Leader', icon: '🌳', minHours: 100, minActivities: 15, color: 'from-lime-700 to-lime-900' }
    ]
  },
  13: { // Climate Action
    tiers: [
      { level: 1, name: 'Climate Ally', icon: '🌱', minHours: 5, minActivities: 1, color: 'from-emerald-400 to-emerald-600' },
      { level: 2, name: 'Climate Builder', icon: '🌍', minHours: 20, minActivities: 3, color: 'from-emerald-500 to-emerald-700' },
      { level: 3, name: 'Climate Champion', icon: '🌿', minHours: 50, minActivities: 8, color: 'from-emerald-600 to-emerald-800' },
      { level: 4, name: 'Climate Guardian', icon: '🌏', minHours: 100, minActivities: 15, color: 'from-emerald-700 to-emerald-900' }
    ]
  },
  14: { // Life Below Water
    tiers: [
      { level: 1, name: 'Ocean Friend', icon: '🐠', minHours: 5, minActivities: 1, color: 'from-blue-400 to-blue-600' },
      { level: 2, name: 'Ocean Advocate', icon: '🐋', minHours: 20, minActivities: 3, color: 'from-blue-500 to-blue-700' },
      { level: 3, name: 'Marine Protector', icon: '🌊', minHours: 50, minActivities: 8, color: 'from-blue-600 to-blue-800' },
      { level: 4, name: 'Ocean Guardian', icon: '🐙', minHours: 100, minActivities: 15, color: 'from-blue-700 to-blue-900' }
    ]
  },
  15: { // Life on Land
    tiers: [
      { level: 1, name: 'Nature Ally', icon: '🌲', minHours: 5, minActivities: 1, color: 'from-green-400 to-green-600' },
      { level: 2, name: 'Wildlife Advocate', icon: '🦋', minHours: 20, minActivities: 3, color: 'from-green-500 to-green-700' },
      { level: 3, name: 'Forest Protector', icon: '🌳', minHours: 50, minActivities: 8, color: 'from-green-600 to-green-800' },
      { level: 4, name: 'Planet Guardian', icon: '🌍', minHours: 100, minActivities: 15, color: 'from-green-700 to-green-900' }
    ]
  },
  16: { // Peace, Justice & Strong Institutions
    tiers: [
      { level: 1, name: 'Supporter', icon: '⚖️', minHours: 5, minActivities: 1, color: 'from-slate-400 to-slate-600' },
      { level: 2, name: 'Advocate', icon: '📢', minHours: 20, minActivities: 3, color: 'from-slate-500 to-slate-700' },
      { level: 3, name: 'Justice Builder', icon: '🏛️', minHours: 50, minActivities: 8, color: 'from-slate-600 to-slate-800' },
      { level: 4, name: 'Peace Leader', icon: '🕊️', minHours: 100, minActivities: 15, color: 'from-slate-700 to-slate-900' }
    ]
  },
  17: { // Partnerships for the Goals
    tiers: [
      { level: 1, name: 'Collaborator', icon: '🤝', minHours: 5, minActivities: 1, color: 'from-indigo-400 to-indigo-600' },
      { level: 2, name: 'Connector', icon: '🔗', minHours: 20, minActivities: 3, color: 'from-indigo-500 to-indigo-700' },
      { level: 3, name: 'Partnership Builder', icon: '🌐', minHours: 50, minActivities: 8, color: 'from-indigo-600 to-indigo-800' },
      { level: 4, name: 'Global Partner Leader', icon: '🌍', minHours: 100, minActivities: 15, color: 'from-indigo-700 to-indigo-900' }
    ]
  }
};

interface UserSDGBadge {
  sdgNumber: number;
  currentTier: number;
  totalHours: number;
  totalActivities: number;
  progress: number;
  earnedTiers: number[];
  lastEarned?: string;
}

interface SDGBadgeCollectionProps {
  compact?: boolean;
  onShare?: (badge: UserSDGBadge) => void;
}

export function SDGBadgeCollection({ compact = false, onShare }: SDGBadgeCollectionProps) {
  const [userBadges, setUserBadges] = useState<UserSDGBadge[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [filterStatus, setFilterStatus] = useState<'all' | 'earned' | 'progress'>('all');

  useEffect(() => {
    fetchUserBadges();
  }, []);

  const fetchUserBadges = async () => {
    try {
      // Mock data for demonstration
      const mockBadges: UserSDGBadge[] = [
        {
          sdgNumber: 13,
          currentTier: 1,
          totalHours: 8,
          totalActivities: 2,
          progress: 100,
          earnedTiers: [1],
          lastEarned: '2024-01-15'
        },
        {
          sdgNumber: 4,
          currentTier: 2,
          totalHours: 32,
          totalActivities: 4,
          progress: 100,
          earnedTiers: [1, 2],
          lastEarned: '2024-01-10'
        },
        {
          sdgNumber: 3,
          currentTier: 1,
          totalHours: 3,
          totalActivities: 1,
          progress: 60,
          earnedTiers: [],
        },
        {
          sdgNumber: 1,
          currentTier: 1,
          totalHours: 12,
          totalActivities: 2,
          progress: 100,
          earnedTiers: [1],
          lastEarned: '2024-01-08'
        },
        {
          sdgNumber: 5,
          currentTier: 1,
          totalHours: 2,
          totalActivities: 1,
          progress: 40,
          earnedTiers: [],
        },
        {
          sdgNumber: 2,
          currentTier: 0,
          totalHours: 0,
          totalActivities: 0,
          progress: 0,
          earnedTiers: [],
        }
      ];
      
      setUserBadges(mockBadges);
    } catch (error) {
      console.error('Error fetching user badges:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getBadgeGradient = (colorClass: string) => {
    // Convert Tailwind gradient classes to actual CSS gradients
    const colorMap: { [key: string]: string } = {
      // Red gradients (SDG 1)
      'from-red-400 to-red-600': 'linear-gradient(to right, #f87171, #dc2626)',
      'from-red-500 to-red-700': 'linear-gradient(to right, #ef4444, #b91c1c)',
      'from-red-600 to-red-800': 'linear-gradient(to right, #dc2626, #991b1b)',
      'from-red-700 to-red-900': 'linear-gradient(to right, #b91c1c, #7f1d1d)',
      
      // Yellow gradients (SDG 2)
      'from-yellow-400 to-yellow-600': 'linear-gradient(to right, #facc15, #ca8a04)',
      'from-yellow-500 to-yellow-700': 'linear-gradient(to right, #eab308, #a16207)',
      'from-yellow-600 to-yellow-800': 'linear-gradient(to right, #ca8a04, #854d0e)',
      'from-yellow-700 to-yellow-900': 'linear-gradient(to right, #a16207, #713f12)',
      
      // Green gradients (SDG 3, 15)
      'from-green-400 to-green-600': 'linear-gradient(to right, #4ade80, #16a34a)',
      'from-green-500 to-green-700': 'linear-gradient(to right, #22c55e, #15803d)',
      'from-green-600 to-green-800': 'linear-gradient(to right, #16a34a, #166534)',
      'from-green-700 to-green-900': 'linear-gradient(to right, #15803d, #14532d)',
      
      // Blue gradients (SDG 4, 14)
      'from-blue-400 to-blue-600': 'linear-gradient(to right, #60a5fa, #2563eb)',
      'from-blue-500 to-blue-700': 'linear-gradient(to right, #3b82f6, #1d4ed8)',
      'from-blue-600 to-blue-800': 'linear-gradient(to right, #2563eb, #1e40af)',
      'from-blue-700 to-blue-900': 'linear-gradient(to right, #1d4ed8, #1e3a8a)',
      
      // Purple gradients (SDG 5)
      'from-purple-400 to-purple-600': 'linear-gradient(to right, #c084fc, #9333ea)',
      'from-purple-500 to-purple-700': 'linear-gradient(to right, #a855f7, #7c3aed)',
      'from-purple-600 to-purple-800': 'linear-gradient(to right, #9333ea, #6b21a8)',
      'from-purple-700 to-purple-900': 'linear-gradient(to right, #7c3aed, #581c87)',
      
      // Cyan gradients (SDG 6)
      'from-cyan-400 to-cyan-600': 'linear-gradient(to right, #22d3ee, #0891b2)',
      'from-cyan-500 to-cyan-700': 'linear-gradient(to right, #06b6d4, #0e7490)',
      'from-cyan-600 to-cyan-800': 'linear-gradient(to right, #0891b2, #155e75)',
      'from-cyan-700 to-cyan-900': 'linear-gradient(to right, #0e7490, #164e63)',
      
      // Amber gradients (SDG 7)
      'from-amber-400 to-amber-600': 'linear-gradient(to right, #fbbf24, #d97706)',
      'from-amber-500 to-amber-700': 'linear-gradient(to right, #f59e0b, #b45309)',
      'from-amber-600 to-amber-800': 'linear-gradient(to right, #d97706, #92400e)',
      'from-amber-700 to-amber-900': 'linear-gradient(to right, #b45309, #78350f)',
      
      // Rose gradients (SDG 8)
      'from-rose-400 to-rose-600': 'linear-gradient(to right, #fb7185, #e11d48)',
      'from-rose-500 to-rose-700': 'linear-gradient(to right, #f43f5e, #be123c)',
      'from-rose-600 to-rose-800': 'linear-gradient(to right, #e11d48, #9f1239)',
      'from-rose-700 to-rose-900': 'linear-gradient(to right, #be123c, #881337)',
      
      // Orange gradients (SDG 9)
      'from-orange-400 to-orange-600': 'linear-gradient(to right, #fb923c, #ea580c)',
      'from-orange-500 to-orange-700': 'linear-gradient(to right, #f97316, #c2410c)',
      'from-orange-600 to-orange-800': 'linear-gradient(to right, #ea580c, #9a3412)',
      'from-orange-700 to-orange-900': 'linear-gradient(to right, #c2410c, #7c2d12)',
      
      // Pink gradients (SDG 10)
      'from-pink-400 to-pink-600': 'linear-gradient(to right, #f472b6, #db2777)',
      'from-pink-500 to-pink-700': 'linear-gradient(to right, #ec4899, #be185d)',
      'from-pink-600 to-pink-800': 'linear-gradient(to right, #db2777, #9d174d)',
      'from-pink-700 to-pink-900': 'linear-gradient(to right, #be185d, #831843)',
      
      // Teal gradients (SDG 11)
      'from-teal-400 to-teal-600': 'linear-gradient(to right, #2dd4bf, #0d9488)',
      'from-teal-500 to-teal-700': 'linear-gradient(to right, #14b8a6, #0f766e)',
      'from-teal-600 to-teal-800': 'linear-gradient(to right, #0d9488, #115e59)',
      'from-teal-700 to-teal-900': 'linear-gradient(to right, #0f766e, #134e4a)',
      
      // Lime gradients (SDG 12)
      'from-lime-400 to-lime-600': 'linear-gradient(to right, #a3e635, #65a30d)',
      'from-lime-500 to-lime-700': 'linear-gradient(to right, #84cc16, #4d7c0f)',
      'from-lime-600 to-lime-800': 'linear-gradient(to right, #65a30d, #365314)',
      'from-lime-700 to-lime-900': 'linear-gradient(to right, #4d7c0f, #1a2e05)',
      
      // Emerald gradients (SDG 13)
      'from-emerald-400 to-emerald-600': 'linear-gradient(to right, #34d399, #059669)',
      'from-emerald-500 to-emerald-700': 'linear-gradient(to right, #10b981, #047857)',
      'from-emerald-600 to-emerald-800': 'linear-gradient(to right, #059669, #065f46)',
      'from-emerald-700 to-emerald-900': 'linear-gradient(to right, #047857, #064e3b)',
      
      // Slate gradients (SDG 16)
      'from-slate-400 to-slate-600': 'linear-gradient(to right, #94a3b8, #475569)',
      'from-slate-500 to-slate-700': 'linear-gradient(to right, #64748b, #334155)',
      'from-slate-600 to-slate-800': 'linear-gradient(to right, #475569, #1e293b)',
      'from-slate-700 to-slate-900': 'linear-gradient(to right, #334155, #0f172a)',
      
      // Indigo gradients (SDG 17)
      'from-indigo-400 to-indigo-600': 'linear-gradient(to right, #818cf8, #4f46e5)',
      'from-indigo-500 to-indigo-700': 'linear-gradient(to right, #6366f1, #4338ca)',
      'from-indigo-600 to-indigo-800': 'linear-gradient(to right, #4f46e5, #3730a3)',
      'from-indigo-700 to-indigo-900': 'linear-gradient(to right, #4338ca, #312e81)',
      
      // Default fallback gradients
      'from-violet-500 to-violet-700': 'linear-gradient(to right, #8b5cf6, #6d28d9)',
    };
    
    return colorMap[colorClass] || 'linear-gradient(to right, #3b82f6, #1d4ed8)'; // Default blue gradient
  };

  const getSDGBadgeDefinition = (sdgNumber: number) => {
    return (SDG_BADGE_DEFINITIONS as any)[sdgNumber] || {
      tiers: [
        { level: 1, name: 'Supporter', icon: '⭐', minHours: 5, minActivities: 1, color: 'from-blue-500 to-blue-700' },
        { level: 2, name: 'Builder', icon: '🔨', minHours: 20, minActivities: 3, color: 'from-purple-500 to-purple-700' },
        { level: 3, name: 'Champion', icon: '🏆', minHours: 50, minActivities: 8, color: 'from-indigo-500 to-indigo-700' },
        { level: 4, name: 'Guardian', icon: '🛡️', minHours: 100, minActivities: 15, color: 'from-violet-500 to-violet-700' }
      ]
    };
  };

  const getCurrentTierInfo = (sdgNumber: number, tierLevel: number) => {
    const definition = getSDGBadgeDefinition(sdgNumber);
    return definition.tiers.find((t: any) => t.level === tierLevel) || definition.tiers[0];
  };

  const getNextTierInfo = (sdgNumber: number, currentTier: number) => {
    const definition = getSDGBadgeDefinition(sdgNumber);
    return definition.tiers.find((t: any) => t.level === currentTier + 1);
  };

  const calculateTierProgress = (badge: UserSDGBadge) => {
    const currentTierInfo = getCurrentTierInfo(badge.sdgNumber, badge.currentTier || 1);
    
    if (badge.earnedTiers.includes(badge.currentTier || 1)) {
      return 100;
    }
    
    const hoursProgress = Math.min((badge.totalHours / currentTierInfo.minHours) * 100, 100);
    const activitiesProgress = Math.min((badge.totalActivities / currentTierInfo.minActivities) * 100, 100);
    
    return Math.min(hoursProgress, activitiesProgress);
  };

  const filteredBadges = userBadges.filter(badge => {
    if (filterStatus === 'earned') return badge.earnedTiers.length > 0;
    if (filterStatus === 'progress') return badge.earnedTiers.length === 0 && badge.totalHours > 0;
    return true;
  });

  const handleShare = (badge: UserSDGBadge) => {
    if (onShare) {
      onShare(badge);
    }
    // Default sharing behavior - could open a modal or copy link
    console.log('Sharing badge:', badge);
  };

  const convertToCredential = (badge: UserSDGBadge) => {
    const currentTierInfo = getCurrentTierInfo(badge.sdgNumber, badge.currentTier || 1);
    const nextTierInfo = getNextTierInfo(badge.sdgNumber, badge.currentTier || 1);
    
    return {
      sdgNumber: badge.sdgNumber,
      currentTier: badge.currentTier || 1,
      totalHours: badge.totalHours,
      totalActivities: badge.totalActivities,
      progress: badge.progress,
      earnedTiers: badge.earnedTiers,
      lastEarned: badge.lastEarned,
      nextMilestone: nextTierInfo ? {
        hoursNeeded: nextTierInfo.minHours,
        activitiesNeeded: nextTierInfo.minActivities,
        tierName: nextTierInfo.name
      } : undefined
    };
  };

  if (isLoading) {
    return (
      <Card className="border-0 shadow-sm bg-white dark:bg-gray-800">
        <CardHeader>
          <CardTitle className="flex items-center">
            <Globe className="w-5 h-5 mr-2" />
            SDG Badge Collection
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-32 bg-muted rounded-lg"></div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (compact) {
    return (
      <Card className="border-0 shadow-sm bg-white dark:bg-gray-800">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium text-gray-900 dark:text-white flex items-center w-full">
            <Award className="w-4 h-4 mr-2" />
            SDG Credentials
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4 pt-0">
          <div className="space-y-3">
            {filteredBadges.slice(0, 4).map((badge) => {
              const badgeInfo = getSDGBadgeDefinition(badge.sdgNumber);
              const sdgInfo = getSDGById(badge.sdgNumber);
              const tierLevel = badge.currentTier || 1;
              const currentTierInfo = badgeInfo.tiers[tierLevel - 1] || badgeInfo.tiers[0];
              const nextTierInfo = badgeInfo.tiers[tierLevel];
              
              if (!currentTierInfo) {
                console.warn(`Missing tier info for SDG ${badge.sdgNumber}, tier ${tierLevel}`);
                return null;
              }
              
              // Calculate progress to next tier
              const progress = nextTierInfo ? Math.min(
                (badge.totalHours / nextTierInfo.minHours) * 100,
                (badge.totalActivities / nextTierInfo.minActivities) * 100
              ) : 100;
              
              return (
                <div
                  key={badge.sdgNumber}
                  className="p-3 rounded-lg border border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/50 hover:bg-gray-100/50 dark:hover:bg-gray-700/50 transition-colors space-y-2"
                >
                  {/* Line 1: Current Tier Name + SDG Number Badge */}
                  <div className="flex items-center space-x-2">
                    <div className="text-sm font-semibold text-gray-900 dark:text-white">
                      {currentTierInfo.name}
                    </div>
                    <Badge 
                      className="text-xs px-2 py-0.5 text-white font-normal"
                      style={{ background: getBadgeGradient(currentTierInfo.color) }}
                    >
                      SDG {badge.sdgNumber}
                    </Badge>
                  </div>
                  
                  {/* Line 2: SDG Title as Subtitle */}
                  <div className="text-xs text-gray-600 dark:text-gray-400">
                    {sdgInfo?.title}
                  </div>
                  
                  {/* Line 3: Next Level */}
                  {nextTierInfo && (
                    <div className="text-xs text-gray-600 dark:text-gray-400">
                      Next: {nextTierInfo.name}
                    </div>
                  )}
                  
                  {/* Line 4: Progress Bar */}
                  {nextTierInfo && (
                    <div className="space-y-1">
                      <div className="flex justify-between items-center">
                        <span className="text-xs text-gray-600 dark:text-gray-400">Progress</span>
                        <span className="text-xs font-medium text-gray-900 dark:text-white">{Math.round(progress)}%</span>
                      </div>
                      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                        <div 
                          className="h-2 rounded-full transition-all duration-300"
                          style={{ 
                            width: `${progress}%`,
                            background: getBadgeGradient(currentTierInfo.color)
                          }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              );
            }).filter(Boolean)}
          </div>
          
          {/* View All Button */}
          <div className="mt-4 pt-3 border-t border-gray-100 dark:border-gray-700">
            <Link href="/profile?tab=badges" className="block w-full">
              <div className="group relative w-full p-3 rounded-lg bg-gradient-to-r from-blue-50 to-purple-50 dark:from-gray-800 dark:to-gray-800 border border-blue-200/50 dark:border-gray-700 hover:from-blue-100 hover:to-purple-100 dark:hover:from-gray-700 dark:hover:to-gray-700 transition-all duration-200 cursor-pointer">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center">
                      <Award className="w-4 h-4 text-white" />
                    </div>
                    <div>
                      <div className="text-sm font-medium text-gray-900 dark:text-white">
                        View All Credentials
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        {filteredBadges.length > 4 ? `+${filteredBadges.length - 4} more` : 'See complete collection'}
                      </div>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300 transition-colors" />
                </div>
              </div>
            </Link>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-0 shadow-sm bg-white dark:bg-gray-800">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center">
            <Globe className="w-5 h-5 mr-2" />
            SDG Badge Collection
          </CardTitle>
          
          <div className="flex items-center space-x-2">
            {/* Filter */}
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setFilterStatus('all')}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                  filterStatus === 'all'
                    ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-md'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                }`}
              >
                All
              </button>
              <button
                onClick={() => setFilterStatus('earned')}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                  filterStatus === 'earned'
                    ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-md'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                }`}
              >
                Earned
              </button>
              <button
                onClick={() => setFilterStatus('progress')}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                  filterStatus === 'progress'
                    ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-md'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                }`}
              >
                In Progress
              </button>
            </div>
            
            {/* View Mode */}
            <div className="flex border rounded-md">
              <Button
                variant={viewMode === 'grid' ? 'default' : 'ghost'}
                size="sm"
                className="h-8 px-2"
                onClick={() => setViewMode('grid')}
              >
                <Grid3X3 className="w-3 h-3" />
              </Button>
              <Button
                variant={viewMode === 'list' ? 'default' : 'ghost'}
                size="sm"
                className="h-8 px-2"
                onClick={() => setViewMode('list')}
              >
                <List className="w-3 h-3" />
              </Button>
            </div>
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        {/* Summary Stats */}
        <div className="grid grid-cols-3 gap-4 p-4 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/20 dark:to-purple-950/20 rounded-lg mb-6">
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">
              {userBadges.reduce((sum, badge) => sum + badge.earnedTiers.length, 0)}
            </div>
            <div className="text-xs text-gray-600 dark:text-gray-400">Badges Earned</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">
              {userBadges.filter(badge => badge.totalHours > 0 && badge.earnedTiers.length === 0).length}
            </div>
            <div className="text-xs text-gray-600 dark:text-gray-400">In Progress</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-600">
              {17 - userBadges.filter(badge => badge.totalHours > 0).length}
            </div>
            <div className="text-xs text-gray-600 dark:text-gray-400">Available</div>
          </div>
        </div>

        {/* Badge Collection */}
        <div className={viewMode === 'grid' 
          ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4" 
          : "space-y-3"
        }>
          {filteredBadges.length > 0 ? (
            filteredBadges.map((badge) => (
              <SDGCredentialCard
                key={badge.sdgNumber}
                credential={convertToCredential(badge)}
                onShare={() => handleShare(badge)}
                compact={compact}
              />
            ))
          ) : (
            <div className="col-span-full text-center py-8">
              <Target className="w-12 h-12 mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                No badges in this category
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                {filterStatus === 'earned' && 'Start participating in events to earn your first badges!'}
                {filterStatus === 'progress' && 'Join events related to different SDGs to start making progress.'}
                {filterStatus === 'all' && 'Begin your impact journey by joining events.'}
              </p>
              <Link href="/events">
                <Button>Find Events</Button>
              </Link>
            </div>
          )}
        </div>

        {/* Call to Action */}
        <div className="mt-6 p-4 bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-950/20 dark:to-blue-950/20 rounded-lg border border-green-200/50 dark:border-green-800/50">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-semibold text-sm text-gray-900 dark:text-white">
                Expand Your Impact Across All 17 SDGs! 🌍
              </h4>
              <p className="text-xs text-gray-600 dark:text-gray-400">
                Each SDG offers unique ways to make a difference. Explore events in new areas to unlock more badges.
              </p>
            </div>
            <Link href="/events">
              <Button size="sm" className="bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600">
                Explore SDGs
                <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </Link>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
