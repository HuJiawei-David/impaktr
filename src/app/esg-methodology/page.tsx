'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Button } from '@/components/ui/button';
import { 
  Leaf, 
  Users, 
  Scale, 
  BarChart3, 
  Database, 
  Weight, 
  TrendingUp, 
  FileText,
  Target,
  Calculator,
  CheckCircle,
  Globe,
  Heart,
  Shield,
  Zap,
  Droplets,
  Recycle,
  Building,
  GraduationCap,
  Briefcase
} from 'lucide-react';

export default function ESGMethodologyPage() {
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
                  ESG Scoring Methodology
                </h1>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Understanding how your Environmental, Social, and Governance impact is measured.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>1. Introduction</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-700 dark:text-gray-300">
                Our platform provides a comprehensive ESG (Environmental, Social, Governance) scoring system to help organizations
                understand, track, and improve their sustainability performance. This methodology outlines the principles,
                data sources, and calculation methods used to derive your ESG scores.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>2. Data Sources</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                ESG scores are calculated based on a variety of data points collected through your organization's activities on the platform:
              </p>
              <ul className="list-disc list-inside space-y-2 text-gray-700 dark:text-gray-300">
                <li><Database className="inline-block h-4 w-4 mr-2 text-blue-500" /> <strong>Event Participation:</strong> Volunteer hours, event types, SDG alignment, participant demographics.</li>
                <li><Database className="inline-block h-4 w-4 mr-2 text-blue-500" /> <strong>Organization Profile:</strong> Industry, location, employee count, description completeness.</li>
                <li><Database className="inline-block h-4 w-4 mr-2 text-blue-500" /> <strong>User Data:</strong> Member demographics (gender, nationality, country), skills, impact scores.</li>
                <li><Database className="inline-block h-4 w-4 mr-2 text-blue-500" /> <strong>Reporting & Compliance:</strong> Frequency of event creation, data completeness, verification rates.</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>3. ESG Pillars & SDG Alignment</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                Our methodology aligns with the United Nations Sustainable Development Goals (SDGs), categorizing them under the three ESG pillars:
              </p>
              <Accordion type="single" collapsible className="w-full">
                <AccordionItem value="item-1">
                  <AccordionTrigger className="text-green-600 dark:text-green-400"><Leaf className="h-5 w-5 mr-2" /> Environmental (E)</AccordionTrigger>
                  <AccordionContent className="text-gray-700 dark:text-gray-300">
                    Focuses on an organization's impact on the natural environment.
                    <ul className="list-disc list-inside ml-4 mt-2 space-y-1">
                      <li><strong>SDG 6:</strong> Clean Water & Sanitation (water use, discharge quality)</li>
                      <li><strong>SDG 7:</strong> Affordable & Clean Energy (renewables mix, energy efficiency)</li>
                      <li><strong>SDG 11:</strong> Sustainable Cities & Communities (environmental impacts of operations)</li>
                      <li><strong>SDG 12:</strong> Responsible Consumption & Production (waste, circularity)</li>
                      <li><strong>SDG 13:</strong> Climate Action (GHG emissions, climate resilience)</li>
                      <li><strong>SDG 14:</strong> Life Below Water (marine pollution, aquatic biodiversity)</li>
                      <li><strong>SDG 15:</strong> Life on Land (deforestation, terrestrial biodiversity)</li>
                    </ul>
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="item-2">
                  <AccordionTrigger className="text-blue-600 dark:text-blue-400"><Users className="h-5 w-5 mr-2" /> Social (S)</AccordionTrigger>
                  <AccordionContent className="text-gray-700 dark:text-gray-300">
                    Examines an organization's relationships with its employees, customers, suppliers, and communities.
                    <ul className="list-disc list-inside ml-4 mt-2 space-y-1">
                      <li><strong>SDG 1:</strong> No Poverty (living wage, economic inclusion)</li>
                      <li><strong>SDG 2:</strong> Zero Hunger (food security, sustainable agriculture)</li>
                      <li><strong>SDG 3:</strong> Good Health & Well-Being (safety, wellness)</li>
                      <li><strong>SDG 4:</strong> Quality Education (employee learning, community education)</li>
                      <li><strong>SDG 5:</strong> Gender Equality (pay equity, representation)</li>
                      <li><strong>SDG 8:</strong> Decent Work & Economic Growth (labor standards, job creation)</li>
                      <li><strong>SDG 10:</strong> Reduced Inequalities (DEI, accessibility)</li>
                    </ul>
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="item-3">
                  <AccordionTrigger className="text-purple-600 dark:text-purple-400"><Scale className="h-5 w-5 mr-2" /> Governance (G)</AccordionTrigger>
                  <AccordionContent className="text-gray-700 dark:text-gray-300">
                    Addresses an organization's leadership, executive pay, audits, internal controls, and shareholder rights.
                    <ul className="list-disc list-inside ml-4 mt-2 space-y-1">
                      <li><strong>SDG 16:</strong> Peace, Justice & Strong Institutions (ethics, anti-corruption, data privacy)</li>
                      <li><strong>SDG 17:</strong> Partnerships for the Goals (multi-stakeholder governance, collaboration)</li>
                      <li><strong>SDG 12.6:</strong> Encouraging sustainability reporting (disclosure quality, assurance)</li>
                    </ul>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>4. Calculation Methodology</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                Each SDG is assigned a score from 0-100 based on relevant metrics derived from your platform activities.
                These individual SDG scores are then aggregated to form the Environmental, Social, and Governance pillar scores.
              </p>
              <h4 className="font-semibold text-lg text-gray-900 dark:text-white mb-2 flex items-center"><Weight className="h-5 w-5 mr-2" /> Weighting</h4>
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                The three ESG pillars are weighted to reflect their relative importance, which can be customized based on industry standards or organizational priorities.
                (e.g., Environmental: 35%, Social: 40%, Governance: 25%).
              </p>
              <h4 className="font-semibold text-lg text-gray-900 dark:text-white mb-2 flex items-center"><TrendingUp className="h-5 w-5 mr-2" /> Overall ESG Score</h4>
              <p className="text-gray-700 dark:text-gray-300">
                The overall ESG score is a weighted average of the Environmental, Social, and Governance pillar scores,
                providing a single, comprehensive measure of your organization's sustainability performance.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>5. Scoring Factors</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid md:grid-cols-3 gap-4">
                  <Card className="border-l-4 border-green-500">
                    <CardContent className="pt-6">
                      <Leaf className="w-8 h-8 text-green-600 mb-3" />
                      <h3 className="font-semibold text-lg mb-2">Event Participation (40%)</h3>
                      <p className="text-sm text-muted-foreground">
                        Hours volunteered, diversity of activities, geographic reach, and SDG alignment of events.
                      </p>
                    </CardContent>
                  </Card>

                  <Card className="border-l-4 border-blue-500">
                    <CardContent className="pt-6">
                      <Shield className="w-8 h-8 text-blue-600 mb-3" />
                      <h3 className="font-semibold text-lg mb-2">Impact Quality (30%)</h3>
                      <p className="text-sm text-muted-foreground">
                        Verification rates, completion rates, and quality assessments from organizers and participants.
                      </p>
                    </CardContent>
                  </Card>

                  <Card className="border-l-4 border-purple-500">
                    <CardContent className="pt-6">
                      <Database className="w-8 h-8 text-purple-600 mb-3" />
                      <h3 className="font-semibold text-lg mb-2">Data Completeness (20%)</h3>
                      <p className="text-sm text-muted-foreground">
                        Profile completeness, reporting accuracy, and frequency of data updates and submissions.
                      </p>
                    </CardContent>
                  </Card>
                </div>

                <Card className="border-l-4 border-orange-500">
                  <CardContent className="pt-6">
                    <Users className="w-8 h-8 text-orange-600 mb-3" />
                    <h3 className="font-semibold text-lg mb-2">Diversity & Inclusion (10%)</h3>
                    <p className="text-sm text-muted-foreground">
                      Demographic diversity of participants, accessibility of events, and inclusive practices in organization activities.
                    </p>
                  </CardContent>
                </Card>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>6. SDG-Specific Calculations</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                Each SDG is calculated using specific metrics relevant to that goal. Here are examples of how some key SDGs are scored:
              </p>
              
              <div className="space-y-4">
                <Card className="bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800">
                  <CardContent className="pt-6">
                    <h4 className="font-semibold text-lg mb-3 flex items-center"><Droplets className="h-5 w-5 mr-2 text-green-600" /> SDG 6: Clean Water & Sanitation</h4>
                    <ul className="text-sm space-y-1 text-gray-700 dark:text-gray-300">
                      <li>• Water conservation events and activities</li>
                      <li>• Sanitation and hygiene education programs</li>
                      <li>• Water quality monitoring and testing</li>
                      <li>• Community water access initiatives</li>
                    </ul>
                  </CardContent>
                </Card>

                <Card className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800">
                  <CardContent className="pt-6">
                    <h4 className="font-semibold text-lg mb-3 flex items-center"><Heart className="h-5 w-5 mr-2 text-blue-600" /> SDG 3: Good Health & Well-Being</h4>
                    <ul className="text-sm space-y-1 text-gray-700 dark:text-gray-300">
                      <li>• Health education and awareness campaigns</li>
                      <li>• Mental health support programs</li>
                      <li>• Medical volunteering and healthcare access</li>
                      <li>• Wellness and fitness initiatives</li>
                    </ul>
                  </CardContent>
                </Card>

                <Card className="bg-purple-50 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-800">
                  <CardContent className="pt-6">
                    <h4 className="font-semibold text-lg mb-3 flex items-center"><GraduationCap className="h-5 w-5 mr-2 text-purple-600" /> SDG 4: Quality Education</h4>
                    <ul className="text-sm space-y-1 text-gray-700 dark:text-gray-300">
                      <li>• Educational programs and workshops</li>
                      <li>• Skills training and development</li>
                      <li>• Digital literacy initiatives</li>
                      <li>• Scholarship and mentorship programs</li>
                    </ul>
                  </CardContent>
                </Card>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>7. Reporting & Transparency</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                Our platform generates detailed ESG reports, allowing you to visualize your performance across all metrics and SDGs.
                These reports can be used for internal analysis, stakeholder communication, and compliance purposes.
              </p>
              <div className="flex items-center space-x-4">
                <Button className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white border-0">
                  <FileText className="h-4 w-4 mr-2" /> View Sample Report
                </Button>
                <Button variant="outline">
                  <Calculator className="h-4 w-4 mr-2" /> Calculate Your Score
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>8. Industry Standards & Compliance</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                Our ESG methodology aligns with internationally recognized standards and frameworks:
              </p>
              <ul className="list-disc list-inside space-y-2 text-gray-700 dark:text-gray-300">
                <li><strong>UN Global Compact:</strong> Principles for responsible business</li>
                <li><strong>GRI Standards:</strong> Global Reporting Initiative guidelines</li>
                <li><strong>SASB Standards:</strong> Industry-specific sustainability accounting</li>
                <li><strong>TCFD Recommendations:</strong> Climate-related financial disclosures</li>
                <li><strong>UN SDGs:</strong> 17 Sustainable Development Goals framework</li>
              </ul>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-blue-600 to-purple-600 text-white border-0">
            <CardContent className="py-8 text-center">
              <h2 className="text-2xl font-bold mb-3">Ready to Measure Your ESG Impact?</h2>
              <p className="text-blue-100 mb-6 max-w-2xl mx-auto">
                Start tracking your organization's environmental, social, and governance performance with our comprehensive ESG scoring system.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button className="bg-white text-blue-600 hover:bg-blue-50 px-8 py-3 rounded-full font-semibold transition-colors">
                  Get Started
                </Button>
                <Button variant="outline" className="border-white text-white hover:bg-white hover:text-blue-600 px-8 py-3 rounded-full font-semibold transition-colors">
                  Learn More
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
