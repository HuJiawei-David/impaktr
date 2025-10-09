'use client';

import React, { useState } from 'react';
import { 
  DollarSign, 
  Utensils, 
  Heart, 
  GraduationCap, 
  Users, 
  Droplets, 
  Zap, 
  Briefcase, 
  Factory, 
  Scale, 
  Building, 
  Recycle, 
  CloudRain, 
  Fish, 
  TreePine, 
  Shield, 
  Link 
} from 'lucide-react';

// UN SDG data with colors and titles
const sdgData = [
  { id: 1, title: "No Poverty", color: "#E5243B", description: "End poverty in all its forms everywhere" },
  { id: 2, title: "Zero Hunger", color: "#DDA63A", description: "End hunger, achieve food security and improved nutrition" },
  { id: 3, title: "Good Health and Well-being", color: "#4C9F38", description: "Ensure healthy lives and promote well-being for all" },
  { id: 4, title: "Quality Education", color: "#C5192D", description: "Ensure inclusive and equitable quality education" },
  { id: 5, title: "Gender Equality", color: "#FF3A21", description: "Achieve gender equality and empower all women and girls" },
  { id: 6, title: "Clean Water and Sanitation", color: "#26BDE2", description: "Ensure availability and sustainable management of water" },
  { id: 7, title: "Affordable and Clean Energy", color: "#FCC30B", description: "Ensure access to affordable, reliable, sustainable energy" },
  { id: 8, title: "Decent Work and Economic Growth", color: "#A21942", description: "Promote sustained, inclusive and sustainable economic growth" },
  { id: 9, title: "Industry, Innovation and Infrastructure", color: "#FD6925", description: "Build resilient infrastructure, promote industrialization" },
  { id: 10, title: "Reduced Inequalities", color: "#DD1367", description: "Reduce inequality within and among countries" },
  { id: 11, title: "Sustainable Cities and Communities", color: "#FD9D24", description: "Make cities and human settlements inclusive and sustainable" },
  { id: 12, title: "Responsible Consumption and Production", color: "#BF8B2E", description: "Ensure sustainable consumption and production patterns" },
  { id: 13, title: "Climate Action", color: "#3F7E44", description: "Take urgent action to combat climate change" },
  { id: 14, title: "Life Below Water", color: "#0A97D9", description: "Conserve and sustainably use the oceans, seas and marine resources" },
  { id: 15, title: "Life on Land", color: "#56C02B", description: "Protect, restore and promote sustainable use of terrestrial ecosystems" },
  { id: 16, title: "Peace, Justice and Strong Institutions", color: "#00689D", description: "Promote peaceful and inclusive societies for sustainable development" },
  { id: 17, title: "Partnerships for the Goals", color: "#19486A", description: "Strengthen the means of implementation and revitalize partnerships" }
];

// Function to get appropriate icon for each SDG
const getSDGIcon = (id: number) => {
  const iconProps = { size: 32, className: "text-white drop-shadow-lg" };
  
  switch (id) {
    case 1: return <DollarSign {...iconProps} />; // No Poverty
    case 2: return <Utensils {...iconProps} />; // Zero Hunger
    case 3: return <Heart {...iconProps} />; // Good Health
    case 4: return <GraduationCap {...iconProps} />; // Quality Education
    case 5: return <Users {...iconProps} />; // Gender Equality
    case 6: return <Droplets {...iconProps} />; // Clean Water
    case 7: return <Zap {...iconProps} />; // Clean Energy
    case 8: return <Briefcase {...iconProps} />; // Decent Work
    case 9: return <Factory {...iconProps} />; // Industry & Innovation
    case 10: return <Scale {...iconProps} />; // Reduced Inequalities
    case 11: return <Building {...iconProps} />; // Sustainable Cities
    case 12: return <Recycle {...iconProps} />; // Responsible Consumption
    case 13: return <CloudRain {...iconProps} />; // Climate Action
    case 14: return <Fish {...iconProps} />; // Life Below Water
    case 15: return <TreePine {...iconProps} />; // Life on Land
    case 16: return <Shield {...iconProps} />; // Peace & Justice
    case 17: return <Link {...iconProps} />; // Partnerships
    default: return <Heart {...iconProps} />;
  }
};

export function SDGWaterfallFlashcard() {
  const [hoveredSDG, setHoveredSDG] = useState<number | null>(null);

  return (
    <section className="relative py-16 bg-gradient-to-br from-gray-50 to-blue-50 dark:from-gray-900 dark:to-gray-800 overflow-hidden">
      {/* Background decorative elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-10 left-10 w-32 h-32 bg-blue-200/20 rounded-full blur-xl animate-pulse"></div>
        <div className="absolute bottom-10 right-10 w-40 h-40 bg-green-200/20 rounded-full blur-xl animate-pulse" style={{ animationDelay: '2s' }}></div>
        <div className="absolute top-1/2 left-1/4 w-24 h-24 bg-purple-200/20 rounded-full blur-xl animate-pulse" style={{ animationDelay: '4s' }}></div>
      </div>

      <div className="relative container mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Aligned with the{' '}
            <span className="bg-gradient-to-r from-blue-600 to-green-600 bg-clip-text text-transparent">
              UN Sustainable Development Goals
            </span>
          </h2>
          <p className="text-lg text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
            Make impact that matters by contributing to the world's most important goals for sustainable development
          </p>
        </div>

        {/* SDG Waterfall Grid */}
        <div className="relative">
          {/* Desktop Waterfall Layout */}
          <div className="hidden lg:block">
            <div className="grid grid-cols-6 gap-4 max-w-6xl mx-auto">
              {sdgData.map((sdg, index) => {
                const row = Math.floor(index / 6);
                const col = index % 6;
                const isEvenRow = row % 2 === 0;
                const offsetClass = isEvenRow ? '' : 'lg:translate-x-8';
                
                return (
                  <div
                    key={sdg.id}
                    className={`relative group cursor-pointer transform transition-all duration-500 hover:scale-110 hover:z-10 ${offsetClass}`}
                    style={{
                      animationDelay: `${index * 100}ms`,
                      animation: 'fadeInUp 0.6s ease-out forwards'
                    }}
                    onMouseEnter={() => setHoveredSDG(sdg.id)}
                    onMouseLeave={() => setHoveredSDG(null)}
                  >
                    {/* SDG Card */}
                    <div 
                      className="relative w-full aspect-square rounded-2xl shadow-lg group-hover:shadow-2xl transition-all duration-300 overflow-hidden"
                      style={{ backgroundColor: sdg.color }}
                    >
                      {/* SDG Number */}
                      <div className="absolute top-2 left-2 w-8 h-8 bg-white rounded-full flex items-center justify-center">
                        <span className="text-sm font-bold" style={{ color: sdg.color }}>
                          {sdg.id}
                        </span>
                      </div>
                      
                      {/* SDG Icon/Logo */}
                      <div className="absolute inset-0 flex flex-col items-center justify-center p-3">
                        <div className="mb-2">
                          {getSDGIcon(sdg.id)}
                        </div>
                        <div className="text-white text-center">
                          <div className="text-xs font-bold leading-tight">
                            {sdg.title}
                          </div>
                        </div>
                      </div>
                      
                      {/* Hover overlay with description */}
                      <div className={`absolute inset-0 bg-black/80 flex items-center justify-center p-3 transition-opacity duration-300 ${
                        hoveredSDG === sdg.id ? 'opacity-100' : 'opacity-0'
                      }`}>
                        <div className="text-white text-center">
                          <h4 className="font-bold text-sm mb-2">{sdg.title}</h4>
                          <p className="text-xs leading-tight">{sdg.description}</p>
                        </div>
                      </div>
                      
                      {/* Floating animation effect */}
                      <div className="absolute inset-0 bg-white/10 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 animate-pulse"></div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Tablet Layout */}
          <div className="hidden md:block lg:hidden">
            <div className="grid grid-cols-4 gap-4 max-w-4xl mx-auto">
              {sdgData.map((sdg, index) => (
                <div
                  key={sdg.id}
                  className="relative group cursor-pointer transform transition-all duration-500 hover:scale-110 hover:z-10"
                  style={{
                    animationDelay: `${index * 100}ms`,
                    animation: 'fadeInUp 0.6s ease-out forwards'
                  }}
                  onMouseEnter={() => setHoveredSDG(sdg.id)}
                  onMouseLeave={() => setHoveredSDG(null)}
                >
                  <div 
                    className="relative w-full aspect-square rounded-2xl shadow-lg group-hover:shadow-2xl transition-all duration-300 overflow-hidden"
                    style={{ backgroundColor: sdg.color }}
                  >
                    <div className="absolute top-2 left-2 w-8 h-8 bg-white rounded-full flex items-center justify-center">
                      <span className="text-sm font-bold" style={{ color: sdg.color }}>
                        {sdg.id}
                      </span>
                    </div>
                    
                    <div className="absolute inset-0 flex flex-col items-center justify-center p-3">
                      <div className="mb-2">
                        {getSDGIcon(sdg.id)}
                      </div>
                      <div className="text-white text-center">
                        <div className="text-xs font-bold leading-tight">
                          {sdg.title}
                        </div>
                      </div>
                    </div>
                    
                    <div className={`absolute inset-0 bg-black/80 flex items-center justify-center p-3 transition-opacity duration-300 ${
                      hoveredSDG === sdg.id ? 'opacity-100' : 'opacity-0'
                    }`}>
                      <div className="text-white text-center">
                        <h4 className="font-bold text-sm mb-2">{sdg.title}</h4>
                        <p className="text-xs leading-tight">{sdg.description}</p>
                      </div>
                    </div>
                    
                    <div className="absolute inset-0 bg-white/10 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 animate-pulse"></div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Mobile Layout */}
          <div className="block md:hidden">
            <div className="grid grid-cols-2 gap-3 max-w-sm mx-auto">
              {sdgData.map((sdg, index) => (
                <div
                  key={sdg.id}
                  className="relative group cursor-pointer transform transition-all duration-500 hover:scale-105"
                  style={{
                    animationDelay: `${index * 50}ms`,
                    animation: 'fadeInUp 0.6s ease-out forwards'
                  }}
                  onMouseEnter={() => setHoveredSDG(sdg.id)}
                  onMouseLeave={() => setHoveredSDG(null)}
                >
                  <div 
                    className="relative w-full aspect-square rounded-xl shadow-lg group-hover:shadow-xl transition-all duration-300 overflow-hidden"
                    style={{ backgroundColor: sdg.color }}
                  >
                    <div className="absolute top-1 left-1 w-6 h-6 bg-white rounded-full flex items-center justify-center">
                      <span className="text-xs font-bold" style={{ color: sdg.color }}>
                        {sdg.id}
                      </span>
                    </div>
                    
                    <div className="absolute inset-0 flex flex-col items-center justify-center p-2">
                      <div className="mb-1">
                        {getSDGIcon(sdg.id)}
                      </div>
                      <div className="text-white text-center">
                        <div className="text-xs font-bold leading-tight">
                          {sdg.title}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Call to Action */}
        <div className="text-center mt-12">
          <p className="text-gray-600 dark:text-gray-300 mb-6">
            Ready to align your impact with global goals?
          </p>
          <button className="bg-gradient-to-r from-blue-600 to-green-600 text-white px-8 py-3 rounded-full font-semibold hover:from-blue-700 hover:to-green-700 transition-all duration-300 transform hover:scale-105 shadow-lg">
            Start Your SDG Journey
          </button>
        </div>
      </div>

      <style jsx>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </section>
  );
}
