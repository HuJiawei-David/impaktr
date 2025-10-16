// Badge Configuration for Impaktr Platform
// Complete badge naming system for all 17 SDGs, individuals, and organizations

import { BadgeTier, IndividualRank, OrganizationTier } from '@prisma/client';

// ============================================================================
// INDIVIDUAL RANK BADGES (Overall Impact Score)
// ============================================================================

export interface RankBadgeConfig {
  rank: IndividualRank;
  name: string;
  description: string;
  icon: string;
  minScore: number;
  minHours: number;
  minBadges: number;
  color: string;
}

export const INDIVIDUAL_RANK_BADGES: RankBadgeConfig[] = [
  {
    rank: IndividualRank.HELPER,
    name: 'Helper',
    description: 'Taking your first steps in making a difference',
    icon: 'hand-helping',
    minScore: 0,
    minHours: 0,
    minBadges: 0,
    color: 'from-gray-400 to-gray-500'
  },
  {
    rank: IndividualRank.SUPPORTER,
    name: 'Supporter',
    description: 'Supporting causes that matter',
    icon: 'heart',
    minScore: 50,
    minHours: 10,
    minBadges: 1,
    color: 'from-green-400 to-green-500'
  },
  {
    rank: IndividualRank.CONTRIBUTOR,
    name: 'Contributor',
    description: 'Contributing meaningfully to your community',
    icon: 'users',
    minScore: 100,
    minHours: 25,
    minBadges: 3,
    color: 'from-blue-400 to-blue-500'
  },
  {
    rank: IndividualRank.BUILDER,
    name: 'Builder',
    description: 'Building lasting change in your community',
    icon: 'hammer',
    minScore: 200,
    minHours: 50,
    minBadges: 6,
    color: 'from-purple-400 to-purple-500'
  },
  {
    rank: IndividualRank.ADVOCATE,
    name: 'Advocate',
    description: 'Advocating for positive change',
    icon: 'megaphone',
    minScore: 350,
    minHours: 100,
    minBadges: 10,
    color: 'from-orange-400 to-orange-500'
  },
  {
    rank: IndividualRank.CHANGEMAKER,
    name: 'Changemaker',
    description: 'Making transformative impact in society',
    icon: 'sparkles',
    minScore: 500,
    minHours: 200,
    minBadges: 15,
    color: 'from-pink-400 to-pink-500'
  },
  {
    rank: IndividualRank.MENTOR,
    name: 'Mentor',
    description: 'Mentoring others in their impact journey',
    icon: 'user-graduate',
    minScore: 700,
    minHours: 350,
    minBadges: 22,
    color: 'from-indigo-400 to-indigo-500'
  },
  {
    rank: IndividualRank.LEADER,
    name: 'Leader',
    description: 'Leading transformative social initiatives',
    icon: 'crown',
    minScore: 850,
    minHours: 500,
    minBadges: 30,
    color: 'from-yellow-400 to-yellow-500'
  },
  {
    rank: IndividualRank.AMBASSADOR,
    name: 'Ambassador',
    description: 'Representing impact excellence globally',
    icon: 'globe',
    minScore: 950,
    minHours: 750,
    minBadges: 40,
    color: 'from-cyan-400 to-cyan-500'
  },
  {
    rank: IndividualRank.GLOBAL_CITIZEN,
    name: 'Global Citizen',
    description: 'Achieving world-class impact leadership',
    icon: 'earth',
    minScore: 1000,
    minHours: 1000,
    minBadges: 50,
    color: 'from-emerald-400 to-emerald-600'
  }
];

// ============================================================================
// ORGANIZATION TIER BADGES (Overall Impact Score)
// ============================================================================

export interface OrganizationTierBadgeConfig {
  tier: OrganizationTier;
  name: string;
  description: string;
  icon: string;
  minEmployeeParticipation: number;
  minAverageScore: number;
  minEvents: number;
  minSDGDiversity: number;
  color: string;
}

export const ORGANIZATION_TIER_BADGES: OrganizationTierBadgeConfig[] = [
  {
    tier: OrganizationTier.REGISTERED,
    name: 'Registered',
    description: 'Welcome to the impact journey',
    icon: 'building',
    minEmployeeParticipation: 0,
    minAverageScore: 0,
    minEvents: 0,
    minSDGDiversity: 0,
    color: 'from-gray-400 to-gray-500'
  },
  {
    tier: OrganizationTier.PARTICIPANT,
    name: 'Participant',
    description: 'Participating in social impact initiatives',
    icon: 'handshake',
    minEmployeeParticipation: 5,
    minAverageScore: 10,
    minEvents: 1,
    minSDGDiversity: 1,
    color: 'from-green-400 to-green-500'
  },
  {
    tier: OrganizationTier.COMMUNITY_ALLY,
    name: 'Community Ally',
    description: 'Building strong community partnerships',
    icon: 'users-round',
    minEmployeeParticipation: 10,
    minAverageScore: 15,
    minEvents: 3,
    minSDGDiversity: 2,
    color: 'from-blue-400 to-blue-500'
  },
  {
    tier: OrganizationTier.CONTRIBUTOR,
    name: 'Contributor',
    description: 'Contributing significantly to social causes',
    icon: 'hand-heart',
    minEmployeeParticipation: 20,
    minAverageScore: 25,
    minEvents: 5,
    minSDGDiversity: 3,
    color: 'from-purple-400 to-purple-500'
  },
  {
    tier: OrganizationTier.CSR_PRACTITIONER,
    name: 'CSR Practitioner',
    description: 'Practicing systematic CSR programs',
    icon: 'briefcase',
    minEmployeeParticipation: 35,
    minAverageScore: 40,
    minEvents: 10,
    minSDGDiversity: 5,
    color: 'from-orange-400 to-orange-500'
  },
  {
    tier: OrganizationTier.CSR_LEADER,
    name: 'CSR Leader',
    description: 'Leading CSR initiatives in your sector',
    icon: 'medal',
    minEmployeeParticipation: 50,
    minAverageScore: 55,
    minEvents: 20,
    minSDGDiversity: 7,
    color: 'from-pink-400 to-pink-500'
  },
  {
    tier: OrganizationTier.ESG_CHAMPION,
    name: 'ESG Champion',
    description: 'Championing ESG excellence',
    icon: 'trophy',
    minEmployeeParticipation: 65,
    minAverageScore: 70,
    minEvents: 35,
    minSDGDiversity: 10,
    color: 'from-indigo-400 to-indigo-500'
  },
  {
    tier: OrganizationTier.TRUSTED_PARTNER,
    name: 'Trusted Partner',
    description: 'Recognized as a trusted impact partner',
    icon: 'shield-check',
    minEmployeeParticipation: 75,
    minAverageScore: 80,
    minEvents: 50,
    minSDGDiversity: 12,
    color: 'from-yellow-400 to-yellow-500'
  },
  {
    tier: OrganizationTier.INDUSTRY_BENCHMARK,
    name: 'Industry Benchmark',
    description: 'Setting industry standards for impact',
    icon: 'star',
    minEmployeeParticipation: 85,
    minAverageScore: 90,
    minEvents: 75,
    minSDGDiversity: 15,
    color: 'from-cyan-400 to-cyan-500'
  },
  {
    tier: OrganizationTier.GLOBAL_IMPACT_LEADER,
    name: 'Global Impact Leader',
    description: 'Leading global impact excellence',
    icon: 'crown',
    minEmployeeParticipation: 95,
    minAverageScore: 95,
    minEvents: 100,
    minSDGDiversity: 17,
    color: 'from-emerald-400 to-emerald-600'
  }
];

// ============================================================================
// SDG-SPECIFIC BADGES
// ============================================================================

export interface SDGBadgeConfig {
  sdgNumber: number;
  sdgName: string;
  tiers: {
    [key in BadgeTier]: {
      individual: {
        name: string;
        description: string;
        minHours: number;
        minActivities: number;
      };
      organization: {
        name: string;
        description: string;
        minHours: number;
        minActivities: number;
      };
    };
  };
  icon: string;
  color: string;
}

export const SDG_BADGE_CONFIGS: SDGBadgeConfig[] = [
  {
    sdgNumber: 1,
    sdgName: 'No Poverty',
    icon: 'coins',
    color: 'from-red-600 to-red-700',
    tiers: {
      [BadgeTier.SUPPORTER]: {
        individual: {
          name: 'Supporter',
          description: 'Supporting poverty alleviation efforts',
          minHours: 10,
          minActivities: 2
        },
        organization: {
          name: 'Local Supporter',
          description: 'Supporting local poverty initiatives',
          minHours: 50,
          minActivities: 2
        }
      },
      [BadgeTier.BUILDER]: {
        individual: {
          name: 'Advocate',
          description: 'Advocating for poverty elimination',
          minHours: 50,
          minActivities: 8
        },
        organization: {
          name: 'Community Builder',
          description: 'Building community poverty programs',
          minHours: 200,
          minActivities: 8
        }
      },
      [BadgeTier.CHAMPION]: {
        individual: {
          name: 'Builder',
          description: 'Building sustainable poverty solutions',
          minHours: 150,
          minActivities: 20
        },
        organization: {
          name: 'Poverty Innovator',
          description: 'Innovating poverty reduction solutions',
          minHours: 500,
          minActivities: 20
        }
      },
      [BadgeTier.GUARDIAN]: {
        individual: {
          name: 'Poverty Fighter',
          description: 'Fighting poverty with exceptional dedication',
          minHours: 400,
          minActivities: 50
        },
        organization: {
          name: 'Poverty Benchmark Leader',
          description: 'Leading poverty elimination benchmarks',
          minHours: 1000,
          minActivities: 50
        }
      }
    }
  },
  {
    sdgNumber: 2,
    sdgName: 'Zero Hunger',
    icon: 'utensils',
    color: 'from-yellow-600 to-yellow-700',
    tiers: {
      [BadgeTier.SUPPORTER]: {
        individual: {
          name: 'Food Giver',
          description: 'Giving food to those in need',
          minHours: 10,
          minActivities: 2
        },
        organization: {
          name: 'Food Provider',
          description: 'Providing food assistance programs',
          minHours: 50,
          minActivities: 2
        }
      },
      [BadgeTier.BUILDER]: {
        individual: {
          name: 'Nourisher',
          description: 'Nourishing communities',
          minHours: 50,
          minActivities: 8
        },
        organization: {
          name: 'Program Builder',
          description: 'Building food security programs',
          minHours: 200,
          minActivities: 8
        }
      },
      [BadgeTier.CHAMPION]: {
        individual: {
          name: 'Hunger Solver',
          description: 'Solving hunger challenges',
          minHours: 150,
          minActivities: 20
        },
        organization: {
          name: 'Hunger Innovator',
          description: 'Innovating hunger solutions',
          minHours: 500,
          minActivities: 20
        }
      },
      [BadgeTier.GUARDIAN]: {
        individual: {
          name: 'Food Security Leader',
          description: 'Leading food security initiatives',
          minHours: 400,
          minActivities: 50
        },
        organization: {
          name: 'Food Security Benchmark',
          description: 'Setting food security benchmarks',
          minHours: 1000,
          minActivities: 50
        }
      }
    }
  },
  {
    sdgNumber: 3,
    sdgName: 'Good Health & Well-being',
    icon: 'heart-pulse',
    color: 'from-green-600 to-green-700',
    tiers: {
      [BadgeTier.SUPPORTER]: {
        individual: {
          name: 'Health Ally',
          description: 'Supporting health and well-being',
          minHours: 10,
          minActivities: 2
        },
        organization: {
          name: 'Health Actor',
          description: 'Taking action on health initiatives',
          minHours: 50,
          minActivities: 2
        }
      },
      [BadgeTier.BUILDER]: {
        individual: {
          name: 'Health Advocate',
          description: 'Advocating for health equity',
          minHours: 50,
          minActivities: 8
        },
        organization: {
          name: 'Healthcare Builder',
          description: 'Building healthcare programs',
          minHours: 200,
          minActivities: 8
        }
      },
      [BadgeTier.CHAMPION]: {
        individual: {
          name: 'Health Champion',
          description: 'Championing health for all',
          minHours: 150,
          minActivities: 20
        },
        organization: {
          name: 'Health Innovator',
          description: 'Innovating health solutions',
          minHours: 500,
          minActivities: 20
        }
      },
      [BadgeTier.GUARDIAN]: {
        individual: {
          name: 'Health Guardian',
          description: 'Guarding community health',
          minHours: 400,
          minActivities: 50
        },
        organization: {
          name: 'Health Benchmark',
          description: 'Setting health excellence benchmarks',
          minHours: 1000,
          minActivities: 50
        }
      }
    }
  },
  {
    sdgNumber: 4,
    sdgName: 'Quality Education',
    icon: 'graduation-cap',
    color: 'from-red-700 to-red-800',
    tiers: {
      [BadgeTier.SUPPORTER]: {
        individual: {
          name: 'Tutor',
          description: 'Tutoring and mentoring learners',
          minHours: 10,
          minActivities: 2
        },
        organization: {
          name: 'Education Ally',
          description: 'Supporting education initiatives',
          minHours: 50,
          minActivities: 2
        }
      },
      [BadgeTier.BUILDER]: {
        individual: {
          name: 'Mentor',
          description: 'Mentoring future leaders',
          minHours: 50,
          minActivities: 8
        },
        organization: {
          name: 'Education Builder',
          description: 'Building education programs',
          minHours: 200,
          minActivities: 8
        }
      },
      [BadgeTier.CHAMPION]: {
        individual: {
          name: 'Knowledge Builder',
          description: 'Building knowledge ecosystems',
          minHours: 150,
          minActivities: 20
        },
        organization: {
          name: 'Education Innovator',
          description: 'Innovating education solutions',
          minHours: 500,
          minActivities: 20
        }
      },
      [BadgeTier.GUARDIAN]: {
        individual: {
          name: 'Education Leader',
          description: 'Leading educational transformation',
          minHours: 400,
          minActivities: 50
        },
        organization: {
          name: 'Education Benchmark',
          description: 'Setting education excellence standards',
          minHours: 1000,
          minActivities: 50
        }
      }
    }
  },
  {
    sdgNumber: 5,
    sdgName: 'Gender Equality',
    icon: 'venus-mars',
    color: 'from-orange-600 to-orange-700',
    tiers: {
      [BadgeTier.SUPPORTER]: {
        individual: {
          name: 'Supporter',
          description: 'Supporting gender equality',
          minHours: 10,
          minActivities: 2
        },
        organization: {
          name: 'Equality Actor',
          description: 'Taking action on gender equality',
          minHours: 50,
          minActivities: 2
        }
      },
      [BadgeTier.BUILDER]: {
        individual: {
          name: 'Equalizer',
          description: 'Equalizing opportunities for all',
          minHours: 50,
          minActivities: 8
        },
        organization: {
          name: 'Diversity Builder',
          description: 'Building diverse and inclusive workplaces',
          minHours: 200,
          minActivities: 8
        }
      },
      [BadgeTier.CHAMPION]: {
        individual: {
          name: 'Advocate',
          description: 'Advocating for gender justice',
          minHours: 150,
          minActivities: 20
        },
        organization: {
          name: 'Equality Innovator',
          description: 'Innovating equality solutions',
          minHours: 500,
          minActivities: 20
        }
      },
      [BadgeTier.GUARDIAN]: {
        individual: {
          name: 'Justice Leader',
          description: 'Leading gender justice movements',
          minHours: 400,
          minActivities: 50
        },
        organization: {
          name: 'Equality Benchmark',
          description: 'Setting equality benchmarks',
          minHours: 1000,
          minActivities: 50
        }
      }
    }
  },
  {
    sdgNumber: 6,
    sdgName: 'Clean Water & Sanitation',
    icon: 'droplet',
    color: 'from-blue-600 to-blue-700',
    tiers: {
      [BadgeTier.SUPPORTER]: {
        individual: {
          name: 'Water Ally',
          description: 'Supporting clean water access',
          minHours: 10,
          minActivities: 2
        },
        organization: {
          name: 'Water Provider',
          description: 'Providing water and sanitation',
          minHours: 50,
          minActivities: 2
        }
      },
      [BadgeTier.BUILDER]: {
        individual: {
          name: 'Water Builder',
          description: 'Building water infrastructure',
          minHours: 50,
          minActivities: 8
        },
        organization: {
          name: 'Program Builder',
          description: 'Building WASH programs',
          minHours: 200,
          minActivities: 8
        }
      },
      [BadgeTier.CHAMPION]: {
        individual: {
          name: 'Water Guardian',
          description: 'Protecting water resources',
          minHours: 150,
          minActivities: 20
        },
        organization: {
          name: 'Sanitation Innovator',
          description: 'Innovating water solutions',
          minHours: 500,
          minActivities: 20
        }
      },
      [BadgeTier.GUARDIAN]: {
        individual: {
          name: 'Sanitation Leader',
          description: 'Leading WASH initiatives',
          minHours: 400,
          minActivities: 50
        },
        organization: {
          name: 'Water Benchmark',
          description: 'Setting water excellence standards',
          minHours: 1000,
          minActivities: 50
        }
      }
    }
  },
  {
    sdgNumber: 7,
    sdgName: 'Affordable & Clean Energy',
    icon: 'zap',
    color: 'from-yellow-500 to-yellow-600',
    tiers: {
      [BadgeTier.SUPPORTER]: {
        individual: {
          name: 'Energy Helper',
          description: 'Helping with energy transition',
          minHours: 10,
          minActivities: 2
        },
        organization: {
          name: 'Energy Actor',
          description: 'Taking action on clean energy',
          minHours: 50,
          minActivities: 2
        }
      },
      [BadgeTier.BUILDER]: {
        individual: {
          name: 'Innovator',
          description: 'Innovating energy solutions',
          minHours: 50,
          minActivities: 8
        },
        organization: {
          name: 'Renewable Builder',
          description: 'Building renewable energy programs',
          minHours: 200,
          minActivities: 8
        }
      },
      [BadgeTier.CHAMPION]: {
        individual: {
          name: 'Energy Advocate',
          description: 'Advocating for clean energy',
          minHours: 150,
          minActivities: 20
        },
        organization: {
          name: 'Energy Innovator',
          description: 'Innovating energy systems',
          minHours: 500,
          minActivities: 20
        }
      },
      [BadgeTier.GUARDIAN]: {
        individual: {
          name: 'Renewable Leader',
          description: 'Leading renewable energy adoption',
          minHours: 400,
          minActivities: 50
        },
        organization: {
          name: 'Energy Benchmark',
          description: 'Setting energy excellence benchmarks',
          minHours: 1000,
          minActivities: 50
        }
      }
    }
  },
  {
    sdgNumber: 8,
    sdgName: 'Decent Work & Economic Growth',
    icon: 'briefcase',
    color: 'from-red-800 to-red-900',
    tiers: {
      [BadgeTier.SUPPORTER]: {
        individual: {
          name: 'Work Ally',
          description: 'Supporting decent work',
          minHours: 10,
          minActivities: 2
        },
        organization: {
          name: 'Employment Actor',
          description: 'Creating employment opportunities',
          minHours: 50,
          minActivities: 2
        }
      },
      [BadgeTier.BUILDER]: {
        individual: {
          name: 'Skills Builder',
          description: 'Building workforce skills',
          minHours: 50,
          minActivities: 8
        },
        organization: {
          name: 'Skills Builder',
          description: 'Building skills development programs',
          minHours: 200,
          minActivities: 8
        }
      },
      [BadgeTier.CHAMPION]: {
        individual: {
          name: 'Economic Advocate',
          description: 'Advocating for economic justice',
          minHours: 150,
          minActivities: 20
        },
        organization: {
          name: 'Work Innovator',
          description: 'Innovating work solutions',
          minHours: 500,
          minActivities: 20
        }
      },
      [BadgeTier.GUARDIAN]: {
        individual: {
          name: 'Opportunity Creator',
          description: 'Creating economic opportunities',
          minHours: 400,
          minActivities: 50
        },
        organization: {
          name: 'Work Benchmark',
          description: 'Setting decent work standards',
          minHours: 1000,
          minActivities: 50
        }
      }
    }
  },
  {
    sdgNumber: 9,
    sdgName: 'Industry, Innovation & Infrastructure',
    icon: 'factory',
    color: 'from-orange-700 to-orange-800',
    tiers: {
      [BadgeTier.SUPPORTER]: {
        individual: {
          name: 'Innovator',
          description: 'Innovating for the future',
          minHours: 10,
          minActivities: 2
        },
        organization: {
          name: 'Innovation Actor',
          description: 'Taking action on innovation',
          minHours: 50,
          minActivities: 2
        }
      },
      [BadgeTier.BUILDER]: {
        individual: {
          name: 'Builder',
          description: 'Building infrastructure',
          minHours: 50,
          minActivities: 8
        },
        organization: {
          name: 'Builder',
          description: 'Building innovation ecosystems',
          minHours: 200,
          minActivities: 8
        }
      },
      [BadgeTier.CHAMPION]: {
        individual: {
          name: 'Changemaker',
          description: 'Driving transformative change',
          minHours: 150,
          minActivities: 20
        },
        organization: {
          name: 'Innovator',
          description: 'Leading innovation initiatives',
          minHours: 500,
          minActivities: 20
        }
      },
      [BadgeTier.GUARDIAN]: {
        individual: {
          name: 'Innovation Leader',
          description: 'Leading innovation excellence',
          minHours: 400,
          minActivities: 50
        },
        organization: {
          name: 'Innovation Benchmark',
          description: 'Setting innovation benchmarks',
          minHours: 1000,
          minActivities: 50
        }
      }
    }
  },
  {
    sdgNumber: 10,
    sdgName: 'Reduced Inequalities',
    icon: 'scale-balanced',
    color: 'from-pink-600 to-pink-700',
    tiers: {
      [BadgeTier.SUPPORTER]: {
        individual: {
          name: 'Supporter',
          description: 'Supporting equality initiatives',
          minHours: 10,
          minActivities: 2
        },
        organization: {
          name: 'Inclusion Actor',
          description: 'Taking action on inclusion',
          minHours: 50,
          minActivities: 2
        }
      },
      [BadgeTier.BUILDER]: {
        individual: {
          name: 'Equalizer',
          description: 'Equalizing opportunities',
          minHours: 50,
          minActivities: 8
        },
        organization: {
          name: 'Equality Builder',
          description: 'Building inclusive programs',
          minHours: 200,
          minActivities: 8
        }
      },
      [BadgeTier.CHAMPION]: {
        individual: {
          name: 'Advocate',
          description: 'Advocating for inclusion',
          minHours: 150,
          minActivities: 20
        },
        organization: {
          name: 'Inclusion Innovator',
          description: 'Innovating inclusion solutions',
          minHours: 500,
          minActivities: 20
        }
      },
      [BadgeTier.GUARDIAN]: {
        individual: {
          name: 'Global Justice Leader',
          description: 'Leading global justice',
          minHours: 400,
          minActivities: 50
        },
        organization: {
          name: 'Equality Benchmark',
          description: 'Setting equality benchmarks',
          minHours: 1000,
          minActivities: 50
        }
      }
    }
  },
  {
    sdgNumber: 11,
    sdgName: 'Sustainable Cities & Communities',
    icon: 'building-2',
    color: 'from-yellow-700 to-yellow-800',
    tiers: {
      [BadgeTier.SUPPORTER]: {
        individual: {
          name: 'Community Ally',
          description: 'Supporting community development',
          minHours: 10,
          minActivities: 2
        },
        organization: {
          name: 'Community Actor',
          description: 'Taking community action',
          minHours: 50,
          minActivities: 2
        }
      },
      [BadgeTier.BUILDER]: {
        individual: {
          name: 'Builder',
          description: 'Building sustainable communities',
          minHours: 50,
          minActivities: 8
        },
        organization: {
          name: 'City Builder',
          description: 'Building sustainable cities',
          minHours: 200,
          minActivities: 8
        }
      },
      [BadgeTier.CHAMPION]: {
        individual: {
          name: 'Advocate',
          description: 'Advocating for sustainability',
          minHours: 150,
          minActivities: 20
        },
        organization: {
          name: 'Sustainable Innovator',
          description: 'Innovating urban solutions',
          minHours: 500,
          minActivities: 20
        }
      },
      [BadgeTier.GUARDIAN]: {
        individual: {
          name: 'Sustainable Leader',
          description: 'Leading urban transformation',
          minHours: 400,
          minActivities: 50
        },
        organization: {
          name: 'City Benchmark',
          description: 'Setting urban excellence standards',
          minHours: 1000,
          minActivities: 50
        }
      }
    }
  },
  {
    sdgNumber: 12,
    sdgName: 'Responsible Consumption & Production',
    icon: 'recycle',
    color: 'from-yellow-600 to-amber-700',
    tiers: {
      [BadgeTier.SUPPORTER]: {
        individual: {
          name: 'Green Consumer',
          description: 'Consuming responsibly',
          minHours: 10,
          minActivities: 2
        },
        organization: {
          name: 'Green Actor',
          description: 'Taking green action',
          minHours: 50,
          minActivities: 2
        }
      },
      [BadgeTier.BUILDER]: {
        individual: {
          name: 'Responsible Actor',
          description: 'Acting responsibly',
          minHours: 50,
          minActivities: 8
        },
        organization: {
          name: 'Responsible Builder',
          description: 'Building circular systems',
          minHours: 200,
          minActivities: 8
        }
      },
      [BadgeTier.CHAMPION]: {
        individual: {
          name: 'Eco Advocate',
          description: 'Advocating for sustainability',
          minHours: 150,
          minActivities: 20
        },
        organization: {
          name: 'Circular Innovator',
          description: 'Innovating circular economy',
          minHours: 500,
          minActivities: 20
        }
      },
      [BadgeTier.GUARDIAN]: {
        individual: {
          name: 'Sustainability Leader',
          description: 'Leading sustainable practices',
          minHours: 400,
          minActivities: 50
        },
        organization: {
          name: 'Circular Benchmark',
          description: 'Setting circular economy standards',
          minHours: 1000,
          minActivities: 50
        }
      }
    }
  },
  {
    sdgNumber: 13,
    sdgName: 'Climate Action',
    icon: 'thermometer',
    color: 'from-green-700 to-green-800',
    tiers: {
      [BadgeTier.SUPPORTER]: {
        individual: {
          name: 'Climate Ally',
          description: 'Supporting climate action',
          minHours: 10,
          minActivities: 2
        },
        organization: {
          name: 'Climate Actor',
          description: 'Taking climate action',
          minHours: 50,
          minActivities: 2
        }
      },
      [BadgeTier.BUILDER]: {
        individual: {
          name: 'Climate Builder',
          description: 'Building climate solutions',
          minHours: 50,
          minActivities: 8
        },
        organization: {
          name: 'Climate Builder',
          description: 'Building climate programs',
          minHours: 200,
          minActivities: 8
        }
      },
      [BadgeTier.CHAMPION]: {
        individual: {
          name: 'Climate Champion',
          description: 'Championing climate action',
          minHours: 150,
          minActivities: 20
        },
        organization: {
          name: 'Climate Innovator',
          description: 'Innovating climate solutions',
          minHours: 500,
          minActivities: 20
        }
      },
      [BadgeTier.GUARDIAN]: {
        individual: {
          name: 'Climate Guardian',
          description: 'Protecting our climate',
          minHours: 400,
          minActivities: 50
        },
        organization: {
          name: 'Climate Benchmark',
          description: 'Setting climate excellence standards',
          minHours: 1000,
          minActivities: 50
        }
      }
    }
  },
  {
    sdgNumber: 14,
    sdgName: 'Life Below Water',
    icon: 'waves',
    color: 'from-blue-700 to-blue-800',
    tiers: {
      [BadgeTier.SUPPORTER]: {
        individual: {
          name: 'Ocean Friend',
          description: 'Protecting marine life',
          minHours: 10,
          minActivities: 2
        },
        organization: {
          name: 'Ocean Actor',
          description: 'Taking ocean action',
          minHours: 50,
          minActivities: 2
        }
      },
      [BadgeTier.BUILDER]: {
        individual: {
          name: 'Ocean Advocate',
          description: 'Advocating for ocean health',
          minHours: 50,
          minActivities: 8
        },
        organization: {
          name: 'Marine Builder',
          description: 'Building marine programs',
          minHours: 200,
          minActivities: 8
        }
      },
      [BadgeTier.CHAMPION]: {
        individual: {
          name: 'Marine Protector',
          description: 'Protecting marine ecosystems',
          minHours: 150,
          minActivities: 20
        },
        organization: {
          name: 'Ocean Innovator',
          description: 'Innovating ocean solutions',
          minHours: 500,
          minActivities: 20
        }
      },
      [BadgeTier.GUARDIAN]: {
        individual: {
          name: 'Ocean Guardian',
          description: 'Guarding ocean health',
          minHours: 400,
          minActivities: 50
        },
        organization: {
          name: 'Ocean Benchmark',
          description: 'Setting ocean conservation standards',
          minHours: 1000,
          minActivities: 50
        }
      }
    }
  },
  {
    sdgNumber: 15,
    sdgName: 'Life on Land',
    icon: 'tree-pine',
    color: 'from-green-600 to-green-700',
    tiers: {
      [BadgeTier.SUPPORTER]: {
        individual: {
          name: 'Nature Ally',
          description: 'Supporting nature conservation',
          minHours: 10,
          minActivities: 2
        },
        organization: {
          name: 'Nature Actor',
          description: 'Taking nature action',
          minHours: 50,
          minActivities: 2
        }
      },
      [BadgeTier.BUILDER]: {
        individual: {
          name: 'Wildlife Advocate',
          description: 'Advocating for wildlife',
          minHours: 50,
          minActivities: 8
        },
        organization: {
          name: 'Land Builder',
          description: 'Building conservation programs',
          minHours: 200,
          minActivities: 8
        }
      },
      [BadgeTier.CHAMPION]: {
        individual: {
          name: 'Forest Protector',
          description: 'Protecting forests and wildlife',
          minHours: 150,
          minActivities: 20
        },
        organization: {
          name: 'Biodiversity Innovator',
          description: 'Innovating biodiversity solutions',
          minHours: 500,
          minActivities: 20
        }
      },
      [BadgeTier.GUARDIAN]: {
        individual: {
          name: 'Planet Guardian',
          description: 'Guarding planetary health',
          minHours: 400,
          minActivities: 50
        },
        organization: {
          name: 'Planet Benchmark',
          description: 'Setting conservation excellence standards',
          minHours: 1000,
          minActivities: 50
        }
      }
    }
  },
  {
    sdgNumber: 16,
    sdgName: 'Peace, Justice & Strong Institutions',
    icon: 'gavel',
    color: 'from-blue-800 to-blue-900',
    tiers: {
      [BadgeTier.SUPPORTER]: {
        individual: {
          name: 'Supporter',
          description: 'Supporting peace and justice',
          minHours: 10,
          minActivities: 2
        },
        organization: {
          name: 'Justice Actor',
          description: 'Taking justice action',
          minHours: 50,
          minActivities: 2
        }
      },
      [BadgeTier.BUILDER]: {
        individual: {
          name: 'Advocate',
          description: 'Advocating for justice',
          minHours: 50,
          minActivities: 8
        },
        organization: {
          name: 'Justice Builder',
          description: 'Building justice systems',
          minHours: 200,
          minActivities: 8
        }
      },
      [BadgeTier.CHAMPION]: {
        individual: {
          name: 'Justice Builder',
          description: 'Building justice and peace',
          minHours: 150,
          minActivities: 20
        },
        organization: {
          name: 'Justice Innovator',
          description: 'Innovating justice solutions',
          minHours: 500,
          minActivities: 20
        }
      },
      [BadgeTier.GUARDIAN]: {
        individual: {
          name: 'Peace Leader',
          description: 'Leading peace initiatives',
          minHours: 400,
          minActivities: 50
        },
        organization: {
          name: 'Justice Benchmark',
          description: 'Setting justice excellence standards',
          minHours: 1000,
          minActivities: 50
        }
      }
    }
  },
  {
    sdgNumber: 17,
    sdgName: 'Partnerships for the Goals',
    icon: 'handshake',
    color: 'from-indigo-700 to-indigo-800',
    tiers: {
      [BadgeTier.SUPPORTER]: {
        individual: {
          name: 'Collaborator',
          description: 'Collaborating for impact',
          minHours: 10,
          minActivities: 2
        },
        organization: {
          name: 'Partnership Actor',
          description: 'Building partnerships',
          minHours: 50,
          minActivities: 2
        }
      },
      [BadgeTier.BUILDER]: {
        individual: {
          name: 'Connector',
          description: 'Connecting changemakers',
          minHours: 50,
          minActivities: 8
        },
        organization: {
          name: 'Connector',
          description: 'Connecting stakeholders',
          minHours: 200,
          minActivities: 8
        }
      },
      [BadgeTier.CHAMPION]: {
        individual: {
          name: 'Partnership Builder',
          description: 'Building lasting partnerships',
          minHours: 150,
          minActivities: 20
        },
        organization: {
          name: 'Partnership Innovator',
          description: 'Innovating partnership models',
          minHours: 500,
          minActivities: 20
        }
      },
      [BadgeTier.GUARDIAN]: {
        individual: {
          name: 'Global Partner Leader',
          description: 'Leading global partnerships',
          minHours: 400,
          minActivities: 50
        },
        organization: {
          name: 'Global Partnership Benchmark',
          description: 'Setting partnership excellence standards',
          minHours: 1000,
          minActivities: 50
        }
      }
    }
  }
];

// Helper functions to get badge configurations
export function getIndividualRankBadge(rank: IndividualRank): RankBadgeConfig | undefined {
  return INDIVIDUAL_RANK_BADGES.find(b => b.rank === rank);
}

export function getOrganizationTierBadge(tier: OrganizationTier): OrganizationTierBadgeConfig | undefined {
  return ORGANIZATION_TIER_BADGES.find(b => b.tier === tier);
}

export function getSDGBadgeConfig(sdgNumber: number): SDGBadgeConfig | undefined {
  return SDG_BADGE_CONFIGS.find(b => b.sdgNumber === sdgNumber);
}

export function getIndividualSDGBadgeName(sdgNumber: number, tier: BadgeTier): string {
  const config = getSDGBadgeConfig(sdgNumber);
  return config?.tiers[tier]?.individual?.name || `SDG ${sdgNumber} Badge`;
}

export function getOrganizationSDGBadgeName(sdgNumber: number, tier: BadgeTier): string {
  const config = getSDGBadgeConfig(sdgNumber);
  return config?.tiers[tier]?.organization?.name || `SDG ${sdgNumber} Org Badge`;
}

export function getIndividualSDGBadgeDescription(sdgNumber: number, tier: BadgeTier): string {
  const config = getSDGBadgeConfig(sdgNumber);
  return config?.tiers[tier]?.individual?.description || '';
}

export function getOrganizationSDGBadgeDescription(sdgNumber: number, tier: BadgeTier): string {
  const config = getSDGBadgeConfig(sdgNumber);
  return config?.tiers[tier]?.organization?.description || '';
}

export function getSDGBadgeRequirements(sdgNumber: number, tier: BadgeTier, isOrganization: boolean = false) {
  const config = getSDGBadgeConfig(sdgNumber);
  if (!config) return null;
  
  const tierConfig = config.tiers[tier];
  return isOrganization ? tierConfig.organization : tierConfig.individual;
}


