'use client';

import React from 'react';
import { 
  Leaf,
  Users,
  Scale,
  BarChart3,
  Target,
  Calculator,
  CheckCircle,
  AlertCircle,
  Info,
  BookOpen,
  TrendingUp,
  Globe,
  Heart,
  Shield,
  Zap,
  Droplets,
  Recycle,
  Building,
  GraduationCap,
  Briefcase,
  FileText
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function MethodologyPage() {
  const sdgData = {
    environmental: [
      { id: 6, name: 'Clean Water & Sanitation', icon: Droplets, weight: 15, description: 'Water conservation, watershed protection, water education' },
      { id: 7, name: 'Affordable & Clean Energy', icon: Zap, weight: 20, description: 'Renewable energy events, energy efficiency workshops' },
      { id: 11, name: 'Sustainable Cities & Communities', icon: Building, weight: 15, description: 'Urban sustainability, community resilience, mobility' },
      { id: 12, name: 'Responsible Consumption & Production', icon: Recycle, weight: 15, description: 'Waste reduction, circular economy, sustainable products' },
      { id: 13, name: 'Climate Action', icon: Globe, weight: 20, description: 'Carbon reduction, climate education, emission tracking' },
      { id: 14, name: 'Life Below Water', icon: Droplets, weight: 10, description: 'Ocean conservation, marine pollution, beach cleanups' },
      { id: 15, name: 'Life on Land', icon: Leaf, weight: 5, description: 'Biodiversity, forest conservation, land restoration' }
    ],
    social: [
      { id: 1, name: 'No Poverty', icon: Heart, weight: 10, description: 'Economic inclusion, job creation, financial support' },
      { id: 2, name: 'Zero Hunger', icon: Heart, weight: 10, description: 'Food security, sustainable agriculture, nutrition' },
      { id: 3, name: 'Good Health & Well-Being', icon: Heart, weight: 15, description: 'Health education, wellness programs, safety' },
      { id: 4, name: 'Quality Education', icon: GraduationCap, weight: 20, description: 'Learning opportunities, skill development, training' },
      { id: 5, name: 'Gender Equality', icon: Users, weight: 15, description: 'Gender balance, equality awareness, inclusion' },
      { id: 8, name: 'Decent Work & Economic Growth', icon: Briefcase, weight: 15, description: 'Employment opportunities, skill building, economic impact' },
      { id: 10, name: 'Reduced Inequalities', icon: Users, weight: 15, description: 'Diversity, inclusion, accessibility, equal opportunities' }
    ],
    governance: [
      { id: 16, name: 'Peace, Justice & Strong Institutions', icon: Shield, weight: 50, description: 'Ethics, transparency, justice, human rights' },
      { id: 17, name: 'Partnerships for the Goals', icon: Users, weight: 30, description: 'Collaboration, cross-sector partnerships, alliances' },
      { id: 12.6, name: 'Sustainability Reporting', icon: FileText, weight: 20, description: 'Data transparency, reporting quality, disclosure' }
    ]
  };

  const calculationFactors = [
    {
      category: 'Event Participation',
      weight: 40,
      factors: [
        'Total volunteer hours across SDG events',
        'Number of events organized/participated',
        'Geographic diversity of activities',
        'Event type diversity (workshops, cleanups, etc.)'
      ]
    },
    {
      category: 'Impact Quality',
      weight: 30,
      factors: [
        'Verification rate of participations',
        'Event completion rate',
        'Participant engagement levels',
        'Measurable outcomes achieved'
      ]
    },
    {
      category: 'Data Completeness',
      weight: 20,
      factors: [
        'Organization profile completeness',
        'Event data quality',
        'Participation documentation',
        'Outcome reporting accuracy'
      ]
    },
    {
      category: 'Diversity & Inclusion',
      weight: 10,
      factors: [
        'Participant demographic diversity',
        'Geographic reach of activities',
        'Cross-sector collaboration',
        'Inclusive event design'
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-12">
        
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
            ESG Scoring Methodology
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-400 max-w-3xl mx-auto">
            Comprehensive Environmental, Social, and Governance scoring based on United Nations Sustainable Development Goals (SDGs) and real platform data
          </p>
        </div>

        {/* Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <Card className="border-0 shadow-lg bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20">
            <CardContent className="p-6">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-12 h-12 rounded-full bg-green-500 flex items-center justify-center">
                  <Leaf className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Environmental</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">40% Weight</p>
                </div>
              </div>
              <p className="text-sm text-gray-700 dark:text-gray-300">
                Climate action, resource conservation, and environmental protection across 7 SDGs
              </p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg bg-gradient-to-br from-purple-50 to-indigo-50 dark:from-purple-900/20 dark:to-indigo-900/20">
            <CardContent className="p-6">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-12 h-12 rounded-full bg-purple-500 flex items-center justify-center">
                  <Users className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Social</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">35% Weight</p>
                </div>
              </div>
              <p className="text-sm text-gray-700 dark:text-gray-300">
                People, community impact, and social responsibility across 7 SDGs
              </p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20">
            <CardContent className="p-6">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-12 h-12 rounded-full bg-blue-500 flex items-center justify-center">
                  <Scale className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Governance</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">25% Weight</p>
                </div>
              </div>
              <p className="text-sm text-gray-700 dark:text-gray-300">
                Ethics, transparency, and institutional strength across 3 SDGs
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Tabs */}
        <Tabs defaultValue="overview" className="space-y-8">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="environmental">Environmental</TabsTrigger>
            <TabsTrigger value="social">Social</TabsTrigger>
            <TabsTrigger value="governance">Governance</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-8">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Calculator className="h-5 w-5" />
                  <span>Calculation Methodology</span>
                </CardTitle>
                <CardDescription>
                  How ESG scores are calculated using platform data and SDG frameworks
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {calculationFactors.map((factor, index) => (
                    <div key={index} className="space-y-3">
                      <div className="flex items-center justify-between">
                        <h4 className="font-semibold text-gray-900 dark:text-white">{factor.category}</h4>
                        <Badge variant="outline">{factor.weight}%</Badge>
                      </div>
                      <Progress value={factor.weight} className="h-2" />
                      <ul className="space-y-1">
                        {factor.factors.map((item, idx) => (
                          <li key={idx} className="text-sm text-gray-600 dark:text-gray-400 flex items-center space-x-2">
                            <CheckCircle className="h-3 w-3 text-green-500 flex-shrink-0" />
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Target className="h-5 w-5" />
                  <span>Data Sources</span>
                </CardTitle>
                <CardDescription>
                  Platform data points used for ESG calculations
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <h4 className="font-semibold text-gray-900 dark:text-white">Event Data</h4>
                    <ul className="space-y-2">
                      <li className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
                        <CheckCircle className="h-4 w-4 text-green-500" />
                        <span>Event titles and descriptions (SDG classification)</span>
                      </li>
                      <li className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
                        <CheckCircle className="h-4 w-4 text-green-500" />
                        <span>Event types (volunteering, workshops, awareness)</span>
                      </li>
                      <li className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
                        <CheckCircle className="h-4 w-4 text-green-500" />
                        <span>Geographic location and reach</span>
                      </li>
                      <li className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
                        <CheckCircle className="h-4 w-4 text-green-500" />
                        <span>Event dates and duration</span>
                      </li>
                    </ul>
                  </div>
                  <div className="space-y-4">
                    <h4 className="font-semibold text-gray-900 dark:text-white">Participation Data</h4>
                    <ul className="space-y-2">
                      <li className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
                        <CheckCircle className="h-4 w-4 text-green-500" />
                        <span>Volunteer hours and participation status</span>
                      </li>
                      <li className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
                        <CheckCircle className="h-4 w-4 text-green-500" />
                        <span>Participant demographics and diversity</span>
                      </li>
                      <li className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
                        <CheckCircle className="h-4 w-4 text-green-500" />
                        <span>Verification and completion rates</span>
                      </li>
                      <li className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
                        <CheckCircle className="h-4 w-4 text-green-500" />
                        <span>Skills and outcomes achieved</span>
                      </li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Environmental Tab */}
          <TabsContent value="environmental" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Leaf className="h-5 w-5 text-green-500" />
                  <span>Environmental SDGs (40% Weight)</span>
                </CardTitle>
                <CardDescription>
                  Environmental impact measurement across 7 Sustainable Development Goals
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {sdgData.environmental.map((sdg) => {
                    const IconComponent = sdg.icon;
                    return (
                      <div key={sdg.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                        <div className="flex items-start space-x-4">
                          <div className="w-12 h-12 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center flex-shrink-0">
                            <IconComponent className="h-6 w-6 text-green-600 dark:text-green-400" />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center justify-between mb-2">
                              <h4 className="font-semibold text-gray-900 dark:text-white">
                                SDG {sdg.id}: {sdg.name}
                              </h4>
                              <Badge variant="outline" className="bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 border-green-200 dark:border-green-700">
                                {sdg.weight}%
                              </Badge>
                            </div>
                            <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">{sdg.description}</p>
                            <div className="space-y-2">
                              <h5 className="text-sm font-medium text-gray-900 dark:text-white">Key Metrics:</h5>
                              <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                                <li>• Total volunteer hours in {sdg.name.toLowerCase()} activities</li>
                                <li>• Number of events focused on this SDG</li>
                                <li>• Geographic diversity of environmental impact</li>
                                <li>• Event type diversity (cleanups, education, advocacy)</li>
                              </ul>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Social Tab */}
          <TabsContent value="social" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Users className="h-5 w-5 text-purple-500" />
                  <span>Social SDGs (35% Weight)</span>
                </CardTitle>
                <CardDescription>
                  Social impact measurement across 7 Sustainable Development Goals
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {sdgData.social.map((sdg) => {
                    const IconComponent = sdg.icon;
                    return (
                      <div key={sdg.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                        <div className="flex items-start space-x-4">
                          <div className="w-12 h-12 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center flex-shrink-0">
                            <IconComponent className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center justify-between mb-2">
                              <h4 className="font-semibold text-gray-900 dark:text-white">
                                SDG {sdg.id}: {sdg.name}
                              </h4>
                              <Badge variant="outline" className="bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-700">
                                {sdg.weight}%
                              </Badge>
                            </div>
                            <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">{sdg.description}</p>
                            <div className="space-y-2">
                              <h5 className="text-sm font-medium text-gray-900 dark:text-white">Key Metrics:</h5>
                              <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                                <li>• Community impact and engagement levels</li>
                                <li>• Educational and skill-building opportunities</li>
                                <li>• Diversity and inclusion in participation</li>
                                <li>• Economic and social empowerment activities</li>
                              </ul>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Governance Tab */}
          <TabsContent value="governance" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Scale className="h-5 w-5 text-blue-500" />
                  <span>Governance SDGs (25% Weight)</span>
                </CardTitle>
                <CardDescription>
                  Governance and transparency measurement across 3 Sustainable Development Goals
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {sdgData.governance.map((sdg) => {
                    const IconComponent = sdg.icon;
                    return (
                      <div key={sdg.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                        <div className="flex items-start space-x-4">
                          <div className="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center flex-shrink-0">
                            <IconComponent className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center justify-between mb-2">
                              <h4 className="font-semibold text-gray-900 dark:text-white">
                                SDG {sdg.id}: {sdg.name}
                              </h4>
                              <Badge variant="outline" className="bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-700">
                                {sdg.weight}%
                              </Badge>
                            </div>
                            <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">{sdg.description}</p>
                            <div className="space-y-2">
                              <h5 className="text-sm font-medium text-gray-900 dark:text-white">Key Metrics:</h5>
                              <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                                <li>• Data transparency and reporting quality</li>
                                <li>• Cross-sector collaboration and partnerships</li>
                                <li>• Ethical practices and compliance</li>
                                <li>• Stakeholder engagement and accountability</li>
                              </ul>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Scoring Scale */}
        <Card className="mt-12">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <BarChart3 className="h-5 w-5" />
              <span>ESG Scoring Scale</span>
            </CardTitle>
            <CardDescription>
              How ESG scores are interpreted and what they represent
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="text-center p-4 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
                <div className="text-2xl font-bold text-red-600 dark:text-red-400 mb-2">0-39</div>
                <div className="text-sm font-medium text-red-700 dark:text-red-300 mb-1">Needs Improvement</div>
                <div className="text-xs text-red-600 dark:text-red-400">Limited ESG impact and engagement</div>
              </div>
              <div className="text-center p-4 rounded-lg bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800">
                <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400 mb-2">40-59</div>
                <div className="text-sm font-medium text-yellow-700 dark:text-yellow-300 mb-1">Developing</div>
                <div className="text-xs text-yellow-600 dark:text-yellow-400">Basic ESG practices in place</div>
              </div>
              <div className="text-center p-4 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
                <div className="text-2xl font-bold text-blue-600 dark:text-blue-400 mb-2">60-79</div>
                <div className="text-sm font-medium text-blue-700 dark:text-blue-300 mb-1">Good</div>
                <div className="text-xs text-blue-600 dark:text-blue-400">Strong ESG performance</div>
              </div>
              <div className="text-center p-4 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800">
                <div className="text-2xl font-bold text-green-600 dark:text-green-400 mb-2">80-100</div>
                <div className="text-sm font-medium text-green-700 dark:text-green-300 mb-1">Excellent</div>
                <div className="text-xs text-green-600 dark:text-green-400">Outstanding ESG leadership</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Call to Action */}
        <Card className="mt-12 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 border-0">
          <CardContent className="p-8 text-center">
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              Ready to Measure Your ESG Impact?
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-2xl mx-auto">
              Start tracking your organization's environmental, social, and governance performance 
              with our comprehensive SDG-based scoring system.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a 
                href="/signup" 
                className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-medium rounded-lg transition-all"
              >
                Get Started
              </a>
              <a 
                href="/organization/esg" 
                className="inline-flex items-center px-6 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 font-medium rounded-lg transition-all"
              >
                View ESG Dashboard
              </a>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}