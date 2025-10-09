'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

// UN SDG data with official logos
const sdgData = [
  { 
    id: 1, 
    title: "No Poverty", 
    color: "#E5243B",
    image: "https://sdgs.un.org/sites/default/files/goals/E_SDG_Icons-01.jpg"
  },
  { 
    id: 2, 
    title: "Zero Hunger", 
    color: "#DDA63A",
    image: "https://sdgs.un.org/sites/default/files/goals/E_SDG_Icons-02.jpg"
  },
  { 
    id: 3, 
    title: "Good Health and Well-being", 
    color: "#4C9F38",
    image: "https://sdgs.un.org/sites/default/files/goals/E_SDG_Icons-03.jpg"
  },
  { 
    id: 4, 
    title: "Quality Education", 
    color: "#C5192D",
    image: "https://sdgs.un.org/sites/default/files/goals/E_SDG_Icons-04.jpg"
  },
  { 
    id: 5, 
    title: "Gender Equality", 
    color: "#FF3A21",
    image: "https://sdgs.un.org/sites/default/files/goals/E_SDG_Icons-05.jpg"
  },
  { 
    id: 6, 
    title: "Clean Water and Sanitation", 
    color: "#26BDE2",
    image: "https://sdgs.un.org/sites/default/files/goals/E_SDG_Icons-06.jpg"
  },
  { 
    id: 7, 
    title: "Affordable and Clean Energy", 
    color: "#FCC30B",
    image: "https://sdgs.un.org/sites/default/files/goals/E_SDG_Icons-07.jpg"
  },
  { 
    id: 8, 
    title: "Decent Work and Economic Growth", 
    color: "#A21942",
    image: "https://sdgs.un.org/sites/default/files/goals/E_SDG_Icons-08.jpg"
  },
  { 
    id: 9, 
    title: "Industry, Innovation and Infrastructure", 
    color: "#FD6925",
    image: "https://sdgs.un.org/sites/default/files/goals/E_SDG_Icons-09.jpg"
  },
  { 
    id: 10, 
    title: "Reduced Inequalities", 
    color: "#DD1367",
    image: "https://sdgs.un.org/sites/default/files/goals/E_SDG_Icons-10.jpg"
  },
  { 
    id: 11, 
    title: "Sustainable Cities and Communities", 
    color: "#FD9D24",
    image: "https://sdgs.un.org/sites/default/files/goals/E_SDG_Icons-11.jpg"
  },
  { 
    id: 12, 
    title: "Responsible Consumption and Production", 
    color: "#BF8B2E",
    image: "https://sdgs.un.org/sites/default/files/goals/E_SDG_Icons-12.jpg"
  },
  { 
    id: 13, 
    title: "Climate Action", 
    color: "#3F7E44",
    image: "https://sdgs.un.org/sites/default/files/goals/E_SDG_Icons-13.jpg"
  },
  { 
    id: 14, 
    title: "Life Below Water", 
    color: "#0A97D9",
    image: "https://sdgs.un.org/sites/default/files/goals/E_SDG_Icons-14.jpg"
  },
  { 
    id: 15, 
    title: "Life on Land", 
    color: "#56C02B",
    image: "https://sdgs.un.org/sites/default/files/goals/E_SDG_Icons-15.jpg"
  },
  { 
    id: 16, 
    title: "Peace, Justice and Strong Institutions", 
    color: "#00689D",
    image: "https://sdgs.un.org/sites/default/files/goals/E_SDG_Icons-16.jpg"
  },
  { 
    id: 17, 
    title: "Partnerships for the Goals", 
    color: "#19486A",
    image: "https://sdgs.un.org/sites/default/files/goals/E_SDG_Icons-17.jpg"
  }
];

export function SDGSimple() {
  return (
    <section className="relative py-20 overflow-hidden" style={{background: 'rgba(59, 130, 246, 0.1)'}}>
      {/* Purple overlay on top of blue background */}
      <div className="absolute inset-0" style={{background: 'rgba(147, 51, 234, 0.08)'}}></div>
      {/* Wave pattern background */}
      <div className="absolute inset-0 overflow-hidden">
        {/* Transitional bubbles from hero section */}
        <div className="absolute top-0 left-1/4 w-12 h-12 bg-gradient-to-br from-blue-400/20 to-cyan-400/15 rounded-full shadow-xl shadow-blue-400/10 animate-bounce blur-sm" style={{ animationDelay: '0s', animationDuration: '6s' }}></div>
        <div className="absolute top-8 right-1/3 w-8 h-8 bg-gradient-to-br from-emerald-400/25 to-teal-400/20 rounded-full shadow-xl shadow-emerald-400/15 animate-bounce blur-sm" style={{ animationDelay: '2s', animationDuration: '7s' }}></div>
        <div className="absolute top-16 left-1/3 w-10 h-10 bg-gradient-to-br from-purple-400/20 to-pink-400/15 rounded-full shadow-xl shadow-purple-400/10 animate-bounce blur-sm" style={{ animationDelay: '1s', animationDuration: '5.5s' }}></div>
        
        {/* SVG Wave patterns */}
        <div className="absolute inset-0 opacity-20">
          <svg className="w-full h-full" viewBox="0 0 1200 800" preserveAspectRatio="none">
            <path d="M0,200 Q300,100 600,200 T1200,200 L1200,0 L0,0 Z" fill="rgba(59, 130, 246, 0.1)" />
            <path d="M0,400 Q300,300 600,400 T1200,400 L1200,200 L0,200 Z" fill="rgba(147, 51, 234, 0.08)" />
            <path d="M0,600 Q300,500 600,600 T1200,600 L1200,400 L0,400 Z" fill="rgba(99, 102, 241, 0.06)" />
          </svg>
        </div>
        
        {/* Organic shapes with blue and purple colors */}
        <div className="absolute top-20 left-1/4 w-16 h-8 bg-blue-200/30 rounded-full transform rotate-12 animate-pulse" style={{ animationDelay: '0s', animationDuration: '6s' }}></div>
        <div className="absolute top-40 right-1/3 w-12 h-6 bg-purple-200/40 rounded-full transform -rotate-24 animate-pulse" style={{ animationDelay: '2s', animationDuration: '8s' }}></div>
        <div className="absolute bottom-32 left-1/5 w-20 h-10 bg-indigo-200/25 rounded-full transform rotate-45 animate-pulse" style={{ animationDelay: '4s', animationDuration: '7s' }}></div>
        
        {/* Floating circles with different sizes */}
        <div className="absolute top-1/3 right-1/4 w-6 h-6 bg-blue-300/20 rounded-full animate-bounce" style={{ animationDelay: '1s', animationDuration: '4s' }}></div>
        <div className="absolute bottom-1/3 left-1/2 w-4 h-4 bg-purple-300/30 rounded-full animate-bounce" style={{ animationDelay: '3s', animationDuration: '5s' }}></div>
        
        {/* Dreamy gradient layers - exactly like hero section */}
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-blue-900/8 via-transparent to-purple-900/8 animate-pulse" style={{ animationDuration: '20s' }}></div>
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-tl from-emerald-900/6 via-transparent to-cyan-900/6 animate-pulse" style={{ animationDelay: '10s', animationDuration: '25s' }}></div>
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-r from-pink-900/4 via-transparent to-rose-900/4 animate-pulse" style={{ animationDelay: '15s', animationDuration: '22s' }}></div>
        
        {/* Subtle grid pattern overlay - exactly like hero section */}
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZGVmcz48cGF0dGVybiBpZD0iZ3JpZCIgd2lkdGg9IjQwIiBoZWlnaHQ9IjQwIiBwYXR0ZXJuVW5pdHM9InVzZXJTcGFjZU9uVXNlIj48cGF0aCBkPSJNIDQwIDAgTCAwIDAgMCA0MCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSJyZ2JhKDU5LCAxMzAsIDI0NiwgMC4wMykiIHN0cm9rZS13aWR0aD0iMSIvPjwvcGF0dGVybj48L2RlZnM+PHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsbD0idXJsKCNncmlkKSIvPjwvc3ZnPg==')] opacity-15"></div>
        
        {/* White bottom wave - transitional element to next section */}
        <div className="absolute bottom-0 left-0 w-full h-32 overflow-hidden">
          <svg className="w-full h-full" viewBox="0 0 1200 100" preserveAspectRatio="none">
            <path d="M0,50 Q300,20 600,50 T1200,50 L1200,100 L0,100 Z" fill="rgba(255, 255, 255, 0.8)" />
            <path d="M0,70 Q300,40 600,70 T1200,70 L1200,100 L0,100 Z" fill="rgba(255, 255, 255, 0.6)" />
          </svg>
        </div>
      </div>
      
      <div className="relative container mx-auto px-4 z-10">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Aligned with the{' '}
            <span className="bg-gradient-to-r from-blue-600 via-purple-600 to-cyan-600 bg-clip-text text-transparent">
              UN Sustainable Development Goals
            </span>
          </h2>
          <p className="text-lg text-gray-600 max-w-3xl mx-auto">
            Make impact that matters by contributing to the world's most important goals for sustainable development
          </p>
        </div>
        

        {/* Horizontal Rolling SDG Logos */}
        <div className="relative w-screen overflow-hidden -mx-4" style={{paddingTop: '2rem', paddingBottom: '2rem'}}>
          <div className="flex animate-scroll-horizontal" style={{gap: '1cm', paddingLeft: '100vw'}}>
            {/* Create multiple sets for seamless infinite scroll */}
            {Array.from({ length: 4 }, (_, setIndex) => 
              sdgData.map((sdg, index) => (
                <div
                  key={`set-${setIndex}-sdg-${sdg.id}`}
                  className="group flex-shrink-0 w-32 h-32 md:w-40 md:h-40 lg:w-48 lg:h-48 shadow-xl group-hover:shadow-2xl group-hover:-translate-y-2 transition-all duration-500"
                  style={{
                    transform: 'scale(1) translateY(0)',
                    margin: '1rem', // Add margin to prevent clipping when scaled
                    transformOrigin: 'center center', // Ensure scaling from center
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'scale(1.3) translateY(-0.5rem)';
                    e.currentTarget.style.zIndex = '10'; // Bring to front when scaled
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'scale(1) translateY(0)';
                    e.currentTarget.style.zIndex = '1'; // Return to normal layer
                  }}
                >
                <div className="relative w-full h-full rounded-lg overflow-hidden cursor-pointer shadow-xl">
                  <img
                    src={sdg.image}
                    alt={`SDG ${sdg.id}: ${sdg.title}`}
                    className="w-full h-full object-cover"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.style.display = 'none';
                        target.parentElement!.style.backgroundColor = sdg.color;
                        target.parentElement!.innerHTML = `
                          <div class="w-full h-full flex flex-col items-center justify-center text-white p-1">
                            <div class="text-lg font-bold mb-1">${sdg.id}</div>
                            <div class="text-xs text-center leading-tight">${sdg.title}</div>
                          </div>
                        `;
                      }}
                    />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
        
        {/* Call to Action - positioned 1.5cm from bottom wave */}
        <div className="text-center mt-12" style={{marginBottom: '1.5cm'}}>
          <p className="text-gray-600 mb-6">
            Ready to align your impact with global goals?
          </p>
          <Link href="/journey">
            <button className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-6 py-3 text-base font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 border-0 inline-flex items-center">
              Start Your SDG Journey
              <ArrowRight className="ml-2 w-4 h-4" />
            </button>
          </Link>
        </div>
      </div>

      <style jsx global>{`
        @keyframes scroll-horizontal {
          0% {
            transform: translateX(-100vw);
          }
          100% {
            transform: translateX(calc(-100vw - (100% / 4)));
          }
        }
        
        .animate-scroll-horizontal {
          animation: scroll-horizontal 68s linear infinite;
          width: max-content;
        }
        
        .animate-scroll-horizontal:has(.group:hover) {
          animation-play-state: paused;
        }
      `}</style>
    </section>
  );
}
