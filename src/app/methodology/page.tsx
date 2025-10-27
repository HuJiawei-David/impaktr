'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  TrendingUp, 
  Clock, 
  Zap, 
  Star, 
  Medal, 
  Shield, 
  Globe, 
  Calculator, 
  Target, 
  BarChart3, 
  Award, 
  Activity, 
  Trophy, 
  BookOpen, 
  ChevronDown, 
  ChevronUp,
  Users
} from 'lucide-react';
import Link from 'next/link';

export default function MethodologyPage() {
  const [activeSection, setActiveSection] = useState('overview');
  const [expandedFAQ, setExpandedFAQ] = useState<number | null>(null);

  const sections = [
    { id: 'overview', label: 'Overview', icon: Target },
    { id: 'impact-score', label: 'Impact Score', icon: TrendingUp },
    { id: 'org-impact', label: 'Organization Impact', icon: Users },
    { id: 'badges', label: 'Badge System', icon: Award },
    { id: 'leaderboards', label: 'Leaderboards', icon: Trophy },
    { id: 'glossary', label: 'Glossary', icon: BookOpen },
    { id: 'faq', label: 'FAQ', icon: Target }
  ];

  const glossaryTerms = [
    { term: 'Impact Score', definition: 'A comprehensive 0-1000 point system measuring your total social and environmental impact across all activities.' },
    { term: 'SDG', definition: 'Sustainable Development Goals - 17 global goals set by the United Nations to address social and environmental challenges.' },
    { term: 'Verification', definition: 'Process of confirming participation through organizer approval, GPS tracking, or peer validation.' },
    { term: 'Quality Rating', definition: 'Assessment of participation quality based on organizer and peer feedback, ranging from 0.5x to 1.5x multiplier.' },
    { term: 'Location Multiplier', definition: 'Fairness adjustment accounting for regional differences in volunteering opportunities and barriers.' },
    { term: 'Intensity Multiplier', definition: 'Factor adjusting score based on event difficulty and impact potential (0.8x to 1.2x).' },
    { term: 'Skill Multiplier', definition: 'Bonus for using specialized skills in volunteering activities (1.0x to 1.4x).' },
    { term: 'Organization Score', definition: '0-100 point system measuring corporate social responsibility performance across multiple metrics.' },
    { term: 'Employee Participation Rate', definition: 'Percentage of organization members who have participated in verified volunteering activities.' },
    { term: 'SDG Diversity', definition: 'Number of different Sustainable Development Goals an organization or individual works on.' }
  ];

  const faqItems = [
    {
      question: "How is my Impact Score calculated?",
      answer: "Your Impact Score uses the formula: Σ (H × I × S × Q × V × L) × 0.1, where H=hours (log-scaled), I=intensity, S=skills, Q=quality, V=verification, and L=location. This ensures fair, comprehensive measurement of your impact."
    },
    {
      question: "Why use log scaling for hours?",
      answer: "Log scaling prevents extreme hour-logging from dominating leaderboards while still rewarding dedication. 10 hours = 104 points, 100 hours = 200 points - this creates fair competition between casual and dedicated volunteers."
    },
    {
      question: "How do I get verified for activities?",
      answer: "Activities can be verified through organizer approval (highest), GPS tracking + organizer confirmation, peer validation, or self-reporting (lowest multiplier). More verification = higher scores."
    },
    {
      question: "What counts as a 'skilled' activity?",
      answer: "Activities using specialized skills like medical/healthcare (1.4x), technical/engineering (1.3x), teaching/training (1.2x), or general volunteering (1.0x). This rewards leveraging your unique expertise for social good."
    },
    {
      question: "How are organization scores different from individual scores?",
      answer: "Organization scores focus on collective impact, employee engagement, and community mobilization. They measure participation rates, total volunteer hours (including external volunteers), quality ratings, verification rates, skills usage, event diversity, and community reach. Scores range from 0-1000+ points."
    },
    {
      question: "Can I lose points or badges?",
      answer: "No, points and badges are permanent once earned. However, quality ratings can affect future activities, and we may adjust formulas based on community feedback to ensure fairness."
    },
    {
      question: "How often are leaderboards updated?",
      answer: "Leaderboards update in real-time as activities are verified. Weekly and monthly leaderboards reset at specific times (Monday 00:00 UTC and 1st of month), while all-time rankings are cumulative."
    },
    {
      question: "What if I disagree with my quality rating?",
      answer: "You can appeal quality ratings through the platform. We review appeals and may adjust ratings based on additional evidence or organizer clarification."
    },
    {
      question: "How do location multipliers work?",
      answer: "Developing countries receive 1.1x-1.3x multipliers due to fewer opportunities and higher barriers. Developed countries use 1.0x baseline. This ensures global fairness in impact measurement."
    },
    {
      question: "Can organizations see individual member scores?",
      answer: "Organizations can see aggregate participation data and member contributions to their collective score, but individual impact scores remain private unless members choose to share them."
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-[22px] pb-8">
        <Card className="border-0 shadow-sm bg-white dark:bg-gray-800 mb-6">
          <CardContent className="p-6">
            <div className="flex items-center space-x-4">
              <div className="w-16 h-16 border-2 border-gray-100 dark:border-gray-700 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center">
                <BarChart3 className="h-8 w-8 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                  Impact Measurement Methodology
                </h1>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Understanding how your social and environmental impact is measured and recognized.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar Navigation */}
          <div className="lg:col-span-1">
            <Card className="sticky top-6">
              <CardHeader>
                <CardTitle className="text-lg">Navigation</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {sections.map((section) => {
                  const Icon = section.icon;
                  return (
                    <button
                      key={section.id}
                      onClick={() => setActiveSection(section.id)}
                      className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-left transition-colors ${
                        activeSection === section.id
                          ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                          : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      <span className="text-sm font-medium">{section.label}</span>
                    </button>
                  );
                })}
              </CardContent>
            </Card>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            {/* Overview Section */}
            {activeSection === 'overview' && (
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Target className="w-6 h-6 text-blue-600" />
                      How We Measure Impact
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <p className="text-lg">
                      Impaktr uses a comprehensive, data-driven approach to measure and recognize social and environmental impact. 
                      Our methodology ensures fairness, transparency, and motivation for all participants.
                    </p>

                    <div className="grid md:grid-cols-3 gap-4">
                      <Card className="border-l-4 border-blue-500">
                        <CardContent className="pt-6">
                          <Globe className="w-8 h-8 text-blue-600 mb-3" />
                          <h3 className="font-semibold text-lg mb-2">Fairness</h3>
                          <p className="text-sm text-muted-foreground">
                            Location multipliers and log scaling ensure everyone's contribution is valued equally, regardless of where they live or how much time they have.
                          </p>
                        </CardContent>
                      </Card>

                      <Card className="border-l-4 border-purple-500">
                        <CardContent className="pt-6">
                          <Target className="w-8 h-8 text-purple-600 mb-3" />
                          <h3 className="font-semibold text-lg mb-2">Quality</h3>
                          <p className="text-sm text-muted-foreground">
                            Multiple activities required for badges ensure sustained commitment and prevent gaming the system through one-time participation.
                          </p>
                        </CardContent>
                      </Card>

                      <Card className="border-l-4 border-indigo-500">
                        <CardContent className="pt-6">
                          <BarChart3 className="w-8 h-8 text-indigo-600 mb-3" />
                          <h3 className="font-semibold text-lg mb-2">Transparency</h3>
                          <p className="text-sm text-muted-foreground">
                            All formulas and calculation methods are publicly documented so you understand exactly how your impact is measured.
                          </p>
                        </CardContent>
                      </Card>
                    </div>

                    <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg p-6 mt-6">
                      <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
                        <Zap className="w-5 h-5 text-blue-600" />
                        Quick Stats
                      </h3>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div>
                          <div className="text-3xl font-bold text-blue-600">68</div>
                          <div className="text-sm text-muted-foreground">SDG Badges Available</div>
                        </div>
                        <div>
                          <div className="text-3xl font-bold text-purple-600">10</div>
                          <div className="text-sm text-muted-foreground">Overall Ranks</div>
                        </div>
                        <div>
                          <div className="text-3xl font-bold text-indigo-600">17</div>
                          <div className="text-sm text-muted-foreground">UN SDGs Tracked</div>
                        </div>
                        <div>
                          <div className="text-3xl font-bold text-pink-600">1000</div>
                          <div className="text-sm text-muted-foreground">Max Impact Score</div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Impact Score Section */}
            {activeSection === 'impact-score' && (
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <TrendingUp className="w-6 h-6 text-blue-600" />
                      Impact Score Calculation
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <p className="text-lg">
                      Your Impact Score (0-1000) represents your total contribution to social and environmental causes. It's calculated using a comprehensive formula:
                    </p>

                    <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/30 dark:to-purple-950/30 border-2 border-blue-200 dark:border-blue-800 rounded-lg p-6">
                      <div className="font-mono text-center text-lg mb-4">
                        Impact Score = Σ (H × I × S × Q × V × L) × 0.1
                      </div>
                      <p className="text-sm text-center text-muted-foreground">
                        Sum across all verified participations (max 1000)
                      </p>
                    </div>

                    <div className="space-y-4">
                      <h3 className="font-semibold text-xl mb-4">Formula Components:</h3>

                      <Card className="border-l-4 border-blue-500">
                        <CardContent className="pt-6">
                          <div className="flex items-start gap-4">
                            <Clock className="w-6 h-6 text-blue-600 mt-1" />
                            <div>
                              <h4 className="font-semibold text-lg mb-2">H = Hours Component</h4>
                              <p className="text-sm text-muted-foreground mb-2">
                                <code className="bg-muted px-2 py-1 rounded">log₁₀(hours + 1) × 100</code>
                              </p>
                              <p className="text-sm">
                                Log scaling ensures fairness. Example: 10 hours = 104 points, 100 hours = 200 points.
                                This prevents extreme hour-logging from dominating leaderboards.
                              </p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>

                      <Card className="border-l-4 border-purple-500">
                        <CardContent className="pt-6">
                          <div className="flex items-start gap-4">
                            <Zap className="w-6 h-6 text-purple-600 mt-1" />
                            <div>
                              <h4 className="font-semibold text-lg mb-2">I = Intensity Multiplier</h4>
                              <p className="text-sm text-muted-foreground mb-2">
                                Range: 0.8x - 1.2x
                              </p>
                              <p className="text-sm">
                                Accounts for event difficulty. Emergency response and disaster relief receive 1.2x,
                                regular volunteering 1.0x, low-intensity activities 0.8x.
                              </p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>

                      <Card className="border-l-4 border-indigo-500">
                        <CardContent className="pt-6">
                          <div className="flex items-start gap-4">
                            <Star className="w-6 h-6 text-indigo-600 mt-1" />
                            <div>
                              <h4 className="font-semibold text-lg mb-2">S = Skill Multiplier</h4>
                              <p className="text-sm text-muted-foreground mb-2">
                                Range: 1.0x - 1.4x
                              </p>
                              <p className="text-sm">
                                Bonus for using specialized skills. Medical/healthcare = 1.4x, technical/engineering = 1.3x,
                                teaching/training = 1.2x, general volunteering = 1.0x.
                              </p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>

                      <Card className="border-l-4 border-pink-500">
                        <CardContent className="pt-6">
                          <div className="flex items-start gap-4">
                            <Medal className="w-6 h-6 text-pink-600 mt-1" />
                            <div>
                              <h4 className="font-semibold text-lg mb-2">Q = Quality Rating</h4>
                              <p className="text-sm text-muted-foreground mb-2">
                                Range: 0.5x - 1.5x
                              </p>
                              <p className="text-sm">
                                Based on organizer and peer feedback. Exceptional = 1.5x, good = 1.0x,
                                needs improvement = 0.5x. Encourages high-quality participation.
                              </p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>

                      <Card className="border-l-4 border-green-500">
                        <CardContent className="pt-6">
                          <div className="flex items-start gap-4">
                            <Shield className="w-6 h-6 text-green-600 mt-1" />
                            <div>
                              <h4 className="font-semibold text-lg mb-2">V = Verification Factor</h4>
                              <p className="text-sm text-muted-foreground mb-2">
                                Range: 0.8x - 1.1x
                              </p>
                              <p className="text-sm">
                                Verified activities score higher. GPS + organizer verification = 1.1x,
                                organizer verification = 1.0x, peer verification = 0.95x, self-reported = 0.8x.
                              </p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>

                      <Card className="border-l-4 border-orange-500">
                        <CardContent className="pt-6">
                          <div className="flex items-start gap-4">
                            <Globe className="w-6 h-6 text-orange-600 mt-1" />
                            <div>
                              <h4 className="font-semibold text-lg mb-2">L = Location Multiplier</h4>
                              <p className="text-sm text-muted-foreground mb-2">
                                Range: 0.8x - 1.3x
                              </p>
                              <p className="text-sm">
                                Global fairness adjustment. Developing countries (1.1x-1.3x) receive boosts due to fewer opportunities
                                and higher barriers. Developed countries use 1.0x baseline.
                              </p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </div>

                    <div className="bg-yellow-50 dark:bg-yellow-950/30 border border-yellow-200 dark:border-yellow-800 rounded-lg p-6 mt-6">
                      <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
                        <Calculator className="w-5 h-5 text-yellow-600" />
                        Example Calculation
                      </h3>
                      <div className="space-y-2 text-sm">
                        <p><strong>Scenario:</strong> 10 hours medical volunteering in Kenya, verified by organizer, good quality</p>
                        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg font-mono text-xs space-y-1 mt-3">
                          <p>H = log₁₀(10 + 1) × 100 = 104.14</p>
                          <p>I = 1.0 (regular intensity)</p>
                          <p>S = 1.4 (medical skills)</p>
                          <p>Q = 1.0 (good quality)</p>
                          <p>V = 1.0 (organizer verified)</p>
                          <p>L = 1.3 (Kenya multiplier)</p>
                          <p className="border-t pt-2 mt-2">Score = 104.14 × 1.0 × 1.4 × 1.0 × 1.0 × 1.3 × 0.1 = <strong className="text-blue-600">18.95 points</strong></p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Organization Impact Section */}
            {activeSection === 'org-impact' && (
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Users className="w-6 h-6 text-blue-600" />
                      Organization Impact Score
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <p className="text-lg">
                      Organizations are measured differently from individuals, focusing on <strong>collective impact</strong>, <strong>employee engagement</strong>, and <strong>program quality</strong>. The Organization Score (0-1000+) reflects corporate social responsibility performance and community mobilization.
                    </p>

                    <div className="bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-purple-950/30 dark:to-indigo-950/30 border-2 border-purple-200 dark:border-purple-800 rounded-lg p-6">
                      <div className="font-mono text-center text-lg mb-4">
                        Org Score = (E + H + Q + V + S + I + C) × G × 1000
                      </div>
                      <p className="text-sm text-center text-muted-foreground">
                        Maximum score: 1000+ points (includes external volunteers and community impact)
                      </p>
                    </div>

                    <div className="space-y-4">
                      <h3 className="font-semibold text-xl mb-4">Formula Components:</h3>

                      <Card className="border-l-4 border-purple-500">
                        <CardContent className="pt-6">
                          <div className="flex items-start gap-4">
                            <Users className="w-6 h-6 text-purple-600 mt-1" />
                            <div>
                              <h4 className="font-semibold text-lg mb-2">E = Employee Participation (25%)</h4>
                              <p className="text-sm text-muted-foreground mb-2">
                                <code className="bg-muted px-2 py-1 rounded">(Active Members / Total Members) × 0.25</code>
                              </p>
                              <p className="text-sm">
                                Percentage of employees who have participated in at least one verified volunteering activity.
                                Higher participation rates demonstrate strong company culture and engagement.
                              </p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>

                      <Card className="border-l-4 border-blue-500">
                        <CardContent className="pt-6">
                          <div className="flex items-start gap-4">
                            <Clock className="w-6 h-6 text-blue-600 mt-1" />
                            <div>
                              <h4 className="font-semibold text-lg mb-2">H = Hours per Employee (15%)</h4>
                              <p className="text-sm text-muted-foreground mb-2">
                                <code className="bg-muted px-2 py-1 rounded">log₁₀(Total Hours / Total Members + 1) × 0.15</code>
                              </p>
                              <p className="text-sm">
                                <strong>Now includes ALL volunteer hours</strong> (employees + external volunteers) per employee. 
                                Measures organizational commitment and community mobilization by time invested per employee, 
                                rewarding organizations that engage external volunteers.
                              </p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>

                      <Card className="border-l-4 border-indigo-500">
                        <CardContent className="pt-6">
                          <div className="flex items-start gap-4">
                            <Star className="w-6 h-6 text-indigo-600 mt-1" />
                            <div>
                              <h4 className="font-semibold text-lg mb-2">Q = Quality Rating (15%)</h4>
                              <p className="text-sm text-muted-foreground mb-2">
                                <code className="bg-muted px-2 py-1 rounded">Average Quality × 0.15</code>
                              </p>
                              <p className="text-sm">
                                Average quality rating across all employee participations based on organizer feedback.
                                Ensures organizations prioritize meaningful, high-quality engagement over volume.
                              </p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>

                      <Card className="border-l-4 border-green-500">
                        <CardContent className="pt-6">
                          <div className="flex items-start gap-4">
                            <Shield className="w-6 h-6 text-green-600 mt-1" />
                            <div>
                              <h4 className="font-semibold text-lg mb-2">V = Verification Rate (10%)</h4>
                              <p className="text-sm text-muted-foreground mb-2">
                                <code className="bg-muted px-2 py-1 rounded">(Verified / Total Participations) × 0.10</code>
                              </p>
                              <p className="text-sm">
                                Percentage of participations that are verified by organizers. Higher verification rates
                                demonstrate program legitimacy and proper documentation.
                              </p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>

                      <Card className="border-l-4 border-pink-500">
                        <CardContent className="pt-6">
                          <div className="flex items-start gap-4">
                            <Zap className="w-6 h-6 text-pink-600 mt-1" />
                            <div>
                              <h4 className="font-semibold text-lg mb-2">S = Skills Impact (15%)</h4>
                              <p className="text-sm text-muted-foreground mb-2">
                                <code className="bg-muted px-2 py-1 rounded">(Skilled Participations / Total) × 0.15</code>
                              </p>
                              <p className="text-sm">
                                Percentage of activities using specialized skills (pro bono, technical, medical, etc.).
                                Rewards organizations that leverage their unique expertise for social good.
                              </p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>

                      <Card className="border-l-4 border-orange-500">
                        <CardContent className="pt-6">
                          <div className="flex items-start gap-4">
                            <Zap className="w-6 h-6 text-orange-600 mt-1" />
                            <div>
                              <h4 className="font-semibold text-lg mb-2">I = Innovation Factor (10%)</h4>
                              <p className="text-sm text-muted-foreground mb-2">
                                <code className="bg-muted px-2 py-1 rounded">min(Unique Event Types / 5, 1) × 0.10</code>
                              </p>
                              <p className="text-sm">
                                <strong>NEW COMPONENT:</strong> Rewards organizations for event diversity and innovation. 
                                Measures variety of event types (volunteering, workshops, fundraisers, etc.) to encourage 
                                comprehensive and creative CSR programs.
                              </p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>

                      <Card className="border-l-4 border-teal-500">
                        <CardContent className="pt-6">
                          <div className="flex items-start gap-4">
                            <Target className="w-6 h-6 text-teal-600 mt-1" />
                            <div>
                              <h4 className="font-semibold text-lg mb-2">C = Community Reach (10%)</h4>
                              <p className="text-sm text-muted-foreground mb-2">
                                <code className="bg-muted px-2 py-1 rounded">min(Unique Participants / 100, 1) × 0.10</code>
                              </p>
                              <p className="text-sm">
                                <strong>REDEFINED:</strong> Now measures unique participants (employees + external volunteers) 
                                instead of SDG diversity. Rewards organizations that mobilize large communities and 
                                create broad social impact beyond their own employees.
                              </p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>

                      <Card className="border-l-4 border-cyan-500">
                        <CardContent className="pt-6">
                          <div className="flex items-start gap-4">
                            <Globe className="w-6 h-6 text-cyan-600 mt-1" />
                            <div>
                              <h4 className="font-semibold text-lg mb-2">G = Global Fairness (Multiplier)</h4>
                              <p className="text-sm text-muted-foreground mb-2">
                                Range: 0.8x - 1.2x (currently 1.0x default)
                              </p>
                              <p className="text-sm">
                                Future adjustment for organizations operating in different regions or sectors.
                                Ensures fair comparison across diverse organizational contexts.
                              </p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </div>

                    <div className="bg-yellow-50 dark:bg-yellow-950/30 border border-yellow-200 dark:border-yellow-800 rounded-lg p-6 mt-6">
                      <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
                        <Calculator className="w-5 h-5 text-yellow-600" />
                        Example Calculation
                      </h3>
                      <div className="space-y-2 text-sm">
                        <p><strong>Scenario:</strong> Company with 100 employees, 35 participated, 2000 total hours (including 1500 from external volunteers), good quality</p>
                        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg font-mono text-xs space-y-1 mt-3">
                          <p>E = (35 / 100) × 0.25 = 0.0875 (8.75%)</p>
                          <p>H = log₁₀(2000 / 100 + 1) × 0.15 = log₁₀(21) × 0.15 = 0.196 (19.6%)</p>
                          <p>Q = 1.0 × 0.15 = 0.15 (15%)</p>
                          <p>V = (2000 / 2000) × 0.10 = 0.10 (10%) - all verified</p>
                          <p>S = (800 / 2000) × 0.15 = 0.06 (6%) - some skilled work</p>
                          <p>I = min(4 / 5, 1) × 0.10 = 0.08 (8%) - 4 event types</p>
                          <p>C = min(150 / 100, 1) × 0.10 = 0.10 (10%) - 150 unique participants</p>
                          <p>G = 1.0 (global fairness)</p>
                          <p className="border-t pt-2 mt-2">Score = (0.0875 + 0.196 + 0.15 + 0.10 + 0.06 + 0.08 + 0.10) × 1.0 × 1000 = <strong className="text-purple-600">773.5 points</strong></p>
                        </div>
                        <p className="text-muted-foreground mt-3">This score places the company at <strong>ESG Champion</strong> tier, demonstrating strong community mobilization and external volunteer engagement.</p>
                      </div>
                    </div>

                    <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg p-6 mt-6">
                      <h3 className="font-semibold text-lg mb-3">Organization Tier Progression:</h3>
                      <div className="space-y-2 text-sm">
                        <div className="flex items-center justify-between p-2 bg-white dark:bg-gray-800 rounded">
                          <span><strong>Registered</strong> - Getting started</span>
                          <span className="text-muted-foreground">0% participation</span>
                        </div>
                        <div className="flex items-center justify-between p-2 bg-white dark:bg-gray-800 rounded">
                          <span><strong>Participant</strong> - First steps</span>
                          <span className="text-muted-foreground">5%+ participation, 1+ event</span>
                        </div>
                        <div className="flex items-center justify-between p-2 bg-white dark:bg-gray-800 rounded">
                          <span><strong>Community Ally</strong> - Building partnerships</span>
                          <span className="text-muted-foreground">10%+ participation, 2+ SDGs</span>
                        </div>
                        <div className="flex items-center justify-between p-2 bg-white dark:bg-gray-800 rounded">
                          <span><strong>Contributor</strong> - Significant impact</span>
                          <span className="text-muted-foreground">20%+ participation, 3+ SDGs</span>
                        </div>
                        <div className="flex items-center justify-between p-2 bg-white dark:bg-gray-800 rounded">
                          <span><strong>CSR Practitioner</strong> - Systematic programs</span>
                          <span className="text-muted-foreground">35%+ participation, 5+ SDGs</span>
                        </div>
                        <div className="flex items-center justify-between p-2 bg-white dark:bg-gray-800 rounded">
                          <span><strong>CSR Leader</strong> - Sector leadership</span>
                          <span className="text-muted-foreground">50%+ participation, 7+ SDGs</span>
                        </div>
                        <div className="flex items-center justify-between p-2 bg-white dark:bg-gray-800 rounded">
                          <span><strong>ESG Champion</strong> - ESG excellence</span>
                          <span className="text-muted-foreground">65%+ participation, 10+ SDGs</span>
                        </div>
                        <div className="flex items-center justify-between p-2 bg-white dark:bg-gray-800 rounded">
                          <span><strong>Trusted Partner</strong> - Industry recognition</span>
                          <span className="text-muted-foreground">75%+ participation, 12+ SDGs</span>
                        </div>
                        <div className="flex items-center justify-between p-2 bg-white dark:bg-gray-800 rounded">
                          <span><strong>Industry Benchmark</strong> - Setting standards</span>
                          <span className="text-muted-foreground">85%+ participation, 15+ SDGs</span>
                        </div>
                        <div className="flex items-center justify-between p-2 bg-white dark:bg-gray-800 rounded border-2 border-purple-500">
                          <span><strong>Global Impact Leader</strong> - World-class</span>
                          <span className="text-muted-foreground">95%+ participation, 17 SDGs</span>
                        </div>
                      </div>
                    </div>

                    <div className="bg-purple-50 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-800 rounded-lg p-6 mt-6">
                      <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
                        <BarChart3 className="w-5 h-5 text-purple-600" />
                        Organization SDG Badge Requirements
                      </h3>
                      <p className="text-sm mb-4">Organizations earn the same 68 SDG badges but with higher thresholds reflecting collective effort:</p>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="bg-white dark:bg-gray-800 p-3 rounded-lg">
                          <div className="font-semibold mb-1">SUPPORTER</div>
                          <div className="text-sm text-muted-foreground">50 hours, 2 activities</div>
                        </div>
                        <div className="bg-white dark:bg-gray-800 p-3 rounded-lg">
                          <div className="font-semibold mb-1">BUILDER</div>
                          <div className="text-sm text-muted-foreground">200 hours, 8 activities</div>
                        </div>
                        <div className="bg-white dark:bg-gray-800 p-3 rounded-lg">
                          <div className="font-semibold mb-1">CHAMPION</div>
                          <div className="text-sm text-muted-foreground">500 hours, 20 activities</div>
                        </div>
                        <div className="bg-white dark:bg-gray-800 p-3 rounded-lg">
                          <div className="font-semibold mb-1">GUARDIAN</div>
                          <div className="text-sm text-muted-foreground">1000 hours, 50 activities</div>
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground mt-3">Hours are cumulative across all employees for that SDG area.</p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Badge System Section */}
            {activeSection === 'badges' && (
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Award className="w-6 h-6 text-blue-600" />
                      Badge System
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <p className="text-lg">
                      Impaktr offers 68 SDG-specific badges (17 SDGs × 4 tiers) plus 10 overall rank badges, recognizing your expertise in specific impact areas.
                    </p>

                    <div className="space-y-4">
                      <h3 className="font-semibold text-xl">SDG Badge Tiers (Individuals):</h3>
                      
                      <div className="grid md:grid-cols-2 gap-4">
                        <Card className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/30 dark:to-emerald-950/30 border-2 border-green-300">
                          <CardContent className="pt-6">
                            <div className="text-4xl mb-2">🌱</div>
                            <h4 className="font-bold text-lg mb-2">SUPPORTER</h4>
                            <div className="space-y-1 text-sm">
                              <p>• <strong>10 hours</strong> in SDG area</p>
                              <p>• <strong>2 activities</strong> completed</p>
                              <p className="text-muted-foreground mt-2">Entry-level recognition</p>
                            </div>
                          </CardContent>
                        </Card>

                        <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 border-2 border-blue-300">
                          <CardContent className="pt-6">
                            <div className="text-4xl mb-2">🔨</div>
                            <h4 className="font-bold text-lg mb-2">BUILDER</h4>
                            <div className="space-y-1 text-sm">
                              <p>• <strong>50 hours</strong> in SDG area</p>
                              <p>• <strong>8 activities</strong> completed</p>
                              <p className="text-muted-foreground mt-2">Intermediate expertise</p>
                            </div>
                          </CardContent>
                        </Card>

                        <Card className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-950/30 dark:to-pink-950/30 border-2 border-purple-300">
                          <CardContent className="pt-6">
                            <div className="text-4xl mb-2">🏆</div>
                            <h4 className="font-bold text-lg mb-2">CHAMPION</h4>
                            <div className="space-y-1 text-sm">
                              <p>• <strong>150 hours</strong> in SDG area</p>
                              <p>• <strong>20 activities</strong> completed</p>
                              <p className="text-muted-foreground mt-2">Advanced mastery</p>
                            </div>
                          </CardContent>
                        </Card>

                        <Card className="bg-gradient-to-br from-yellow-50 to-orange-50 dark:from-yellow-950/30 dark:to-orange-950/30 border-2 border-yellow-300">
                          <CardContent className="pt-6">
                            <div className="text-4xl mb-2">🛡️</div>
                            <h4 className="font-bold text-lg mb-2">GUARDIAN</h4>
                            <div className="space-y-1 text-sm">
                              <p>• <strong>400 hours</strong> in SDG area</p>
                              <p>• <strong>50 activities</strong> completed</p>
                              <p className="text-muted-foreground mt-2">Expert-level dedication</p>
                            </div>
                          </CardContent>
                        </Card>
                      </div>

                      <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg p-6 mt-6">
                        <h4 className="font-semibold mb-3 flex items-center gap-2">
                          <Activity className="w-5 h-5 text-blue-600" />
                          Badge Progress Calculation
                        </h4>
                        <div className="space-y-3 text-sm">
                          <p className="font-mono bg-white dark:bg-gray-800 p-3 rounded">
                            Progress = (Hours Progress × 50%) + (Activities Progress × 50%)
                          </p>
                          <p className="text-muted-foreground">
                            Both requirements must be met to earn the badge. For example, having 100 hours but only 1 activity won't earn you the Supporter badge - you need 2+ activities.
                          </p>
                        </div>
                      </div>

                      <h3 className="font-semibold text-xl mt-8">Organization Badge Requirements:</h3>
                      
                      <div className="bg-purple-50 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-800 rounded-lg p-6 mb-6">
                        <h4 className="font-semibold mb-3 flex items-center gap-2">
                          <Users className="w-5 h-5 text-purple-600" />
                          Organization SDG Badge Requirements
                        </h4>
                        <p className="text-sm mb-4">Organizations earn the same 68 SDG badges but with higher thresholds reflecting collective effort:</p>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="bg-white dark:bg-gray-800 p-3 rounded-lg">
                            <div className="font-semibold mb-1">SUPPORTER</div>
                            <div className="text-sm text-muted-foreground">50 hours, 2 activities</div>
                          </div>
                          <div className="bg-white dark:bg-gray-800 p-3 rounded-lg">
                            <div className="font-semibold mb-1">BUILDER</div>
                            <div className="text-sm text-muted-foreground">200 hours, 8 activities</div>
                          </div>
                          <div className="bg-white dark:bg-gray-800 p-3 rounded-lg">
                            <div className="font-semibold mb-1">CHAMPION</div>
                            <div className="text-sm text-muted-foreground">500 hours, 20 activities</div>
                          </div>
                          <div className="bg-white dark:bg-gray-800 p-3 rounded-lg">
                            <div className="font-semibold mb-1">GUARDIAN</div>
                            <div className="text-sm text-muted-foreground">1000 hours, 50 activities</div>
                          </div>
                        </div>
                        <p className="text-sm text-muted-foreground mt-3">Hours are cumulative across all employees for that SDG area.</p>
                      </div>

                      <h3 className="font-semibold text-xl mt-8">Overall Rank Progression:</h3>
                      
                      <div className="space-y-2">
                        {[
                          { rank: 'Helper', score: 0, hours: 0, badges: 0, color: 'gray' },
                          { rank: 'Supporter', score: 50, hours: 10, badges: 1, color: 'green' },
                          { rank: 'Contributor', score: 100, hours: 25, badges: 3, color: 'blue' },
                          { rank: 'Builder', score: 200, hours: 50, badges: 6, color: 'purple' },
                          { rank: 'Advocate', score: 350, hours: 100, badges: 10, color: 'orange' },
                          { rank: 'Changemaker', score: 500, hours: 200, badges: 15, color: 'pink' },
                          { rank: 'Mentor', score: 700, hours: 350, badges: 22, color: 'indigo' },
                          { rank: 'Leader', score: 850, hours: 500, badges: 30, color: 'yellow' },
                          { rank: 'Ambassador', score: 950, hours: 750, badges: 40, color: 'cyan' },
                          { rank: 'Global Citizen', score: 1000, hours: 1000, badges: 50, color: 'emerald' }
                        ].map((rank, index) => (
                          <Card key={index} className={`border-l-4 border-${rank.color}-500`}>
                            <CardContent className="py-3 px-4">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                  <div className="font-bold text-lg">{index + 1}.</div>
                                  <div>
                                    <div className="font-semibold">{rank.rank}</div>
                                    <div className="text-xs text-muted-foreground">
                                      {rank.score}+ points • {rank.hours}+ hours • {rank.badges}+ badges
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Leaderboards Section */}
            {activeSection === 'leaderboards' && (
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Trophy className="w-6 h-6 text-blue-600" />
                      Leaderboards
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <p className="text-lg">
                      Leaderboards celebrate and recognize top contributors across various dimensions of impact. They're designed to be fair, inclusive, and motivating for all participants.
                    </p>

                    <div className="grid md:grid-cols-2 gap-4">
                      <Card className="border-l-4 border-blue-500">
                        <CardContent className="pt-6">
                          <Trophy className="w-8 h-8 text-blue-600 mb-3" />
                          <h3 className="font-semibold text-lg mb-2">Impact Score Leaderboard</h3>
                          <p className="text-sm text-muted-foreground">
                            Ranks volunteers by total impact score. Accounts for hours, quality, verification, and location fairness.
                            Shows who's making the most comprehensive impact.
                          </p>
                        </CardContent>
                      </Card>

                      <Card className="border-l-4 border-purple-500">
                        <CardContent className="pt-6">
                          <Clock className="w-8 h-8 text-purple-600 mb-3" />
                          <h3 className="font-semibold text-lg mb-2">Hours Leaderboard</h3>
                          <p className="text-sm text-muted-foreground">
                            Pure time commitment ranking. Recognizes volunteers who dedicate the most hours to verified activities,
                            regardless of other factors.
                          </p>
                        </CardContent>
                      </Card>

                      <Card className="border-l-4 border-pink-500">
                        <CardContent className="pt-6">
                          <Award className="w-8 h-8 text-pink-600 mb-3" />
                          <h3 className="font-semibold text-lg mb-2">Badges Leaderboard</h3>
                          <p className="text-sm text-muted-foreground">
                            Shows volunteers with the most SDG badges earned. Celebrates diversity of impact across
                            different sustainable development goals.
                          </p>
                        </CardContent>
                      </Card>

                      <Card className="border-l-4 border-indigo-500">
                        <CardContent className="pt-6">
                          <Target className="w-8 h-8 text-indigo-600 mb-3" />
                          <h3 className="font-semibold text-lg mb-2">SDG-Specific Leaderboards</h3>
                          <p className="text-sm text-muted-foreground">
                            Separate rankings for each of the 17 SDGs. Shows top contributors in specific areas like
                            Climate Action, Quality Education, or Zero Hunger.
                          </p>
                        </CardContent>
                      </Card>
                    </div>

                    <div className="space-y-4 mt-6">
                      <h3 className="font-semibold text-xl">Time Periods:</h3>
                      
                      <div className="grid gap-3">
                        <Card>
                          <CardContent className="py-4">
                            <div className="flex items-center justify-between">
                              <div>
                                <h4 className="font-semibold">Weekly Leaderboard</h4>
                                <p className="text-sm text-muted-foreground">
                                  Resets every Monday at 00:00 UTC. Perfect for staying motivated with short-term goals.
                                </p>
                              </div>
                              <BarChart3 className="w-8 h-8 text-blue-600" />
                            </div>
                          </CardContent>
                        </Card>

                        <Card>
                          <CardContent className="py-4">
                            <div className="flex items-center justify-between">
                              <div>
                                <h4 className="font-semibold">Monthly Leaderboard</h4>
                                <p className="text-sm text-muted-foreground">
                                  Resets on the 1st of each month. Encourages sustained participation over weeks.
                                </p>
                              </div>
                              <BarChart3 className="w-8 h-8 text-purple-600" />
                            </div>
                          </CardContent>
                        </Card>

                        <Card>
                          <CardContent className="py-4">
                            <div className="flex items-center justify-between">
                              <div>
                                <h4 className="font-semibold">All-Time Leaderboard</h4>
                                <p className="text-sm text-muted-foreground">
                                  Cumulative ranking since account creation. Shows lifetime achievers and dedicated volunteers.
                                </p>
                              </div>
                              <BarChart3 className="w-8 h-8 text-indigo-600" />
                            </div>
                          </CardContent>
                        </Card>
                      </div>
                    </div>

                    <div className="bg-yellow-50 dark:bg-yellow-950/30 border border-yellow-200 dark:border-yellow-800 rounded-lg p-6">
                      <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
                        <Shield className="w-5 h-5 text-yellow-600" />
                        Tiebreaker Rules
                      </h3>
                      <p className="text-sm mb-3">When impact scores are identical, we use the following order:</p>
                      <ol className="text-sm space-y-2 list-decimal list-inside">
                        <li><strong>Total verified hours</strong> - More hours = higher rank</li>
                        <li><strong>Number of unique SDGs</strong> - Diverse impact breaks ties</li>
                        <li><strong>Total badges earned</strong> - More achievements = higher rank</li>
                        <li><strong>Account age</strong> - Earlier registration date wins (legacy recognition)</li>
                      </ol>
                    </div>

                    <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg p-6">
                      <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
                        <Users className="w-5 h-5 text-blue-600" />
                        Organization Leaderboards
                      </h3>
                      <p className="text-sm">
                        Organizations compete based on: <strong>employee participation rate</strong> (% of members active),
                        <strong> total collective hours</strong>, <strong>SDG diversity</strong> (how many different SDGs they work on),
                        and <strong>average member quality rating</strong>. This encourages companies to build strong,
                        comprehensive CSR programs.
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Glossary Section */}
            {activeSection === 'glossary' && (
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <BookOpen className="w-6 h-6 text-blue-600" />
                      Glossary of Terms
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {glossaryTerms.map((item, index) => (
                        <Card key={index} className="border-l-4 border-blue-500">
                          <CardContent className="pt-6">
                            <h3 className="font-bold text-lg mb-2">{item.term}</h3>
                            <p className="text-sm text-muted-foreground">{item.definition}</p>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* FAQ Section */}
            {activeSection === 'faq' && (
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Target className="w-6 h-6 text-blue-600" />
                      Frequently Asked Questions
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {faqItems.map((item, index) => (
                        <Card key={index}>
                          <CardContent className="p-0">
                            <button
                              onClick={() => setExpandedFAQ(expandedFAQ === index ? null : index)}
                              className="w-full flex items-center justify-between p-4 text-left hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                            >
                              <span className="font-semibold">{item.question}</span>
                              {expandedFAQ === index ? (
                                <ChevronUp className="w-5 h-5 text-muted-foreground flex-shrink-0" />
                              ) : (
                                <ChevronDown className="w-5 h-5 text-muted-foreground flex-shrink-0" />
                              )}
                            </button>
                            {expandedFAQ === index && (
                              <div className="px-4 pb-4 text-sm text-muted-foreground border-t pt-4">
                                {item.answer}
                              </div>
                            )}
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* CTA Section */}
            <Card className="bg-gradient-to-r from-blue-600 to-purple-600 text-white border-0">
              <CardContent className="py-8 text-center">
                <h2 className="text-2xl font-bold mb-3">Ready to Start Making Impact?</h2>
                <p className="text-blue-100 mb-6 max-w-2xl mx-auto">
                  Join thousands of changemakers tracking their social impact and earning recognition for making the world a better place.
                </p>
                <Link href="/signup">
                  <button className="bg-white text-blue-600 hover:bg-blue-50 px-8 py-3 rounded-full font-semibold transition-colors">
                    Get Started
                  </button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}