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
    <section className="relative py-20 overflow-hidden bg-gray-50 dark:bg-gray-950">
      
      <div className="relative container mx-auto px-4 z-10">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
            <span className="block">Aligned with the</span>
            <span className="block bg-gradient-to-r from-blue-600 via-purple-600 to-cyan-600 dark:from-blue-400 dark:via-purple-400 dark:to-cyan-400 bg-clip-text text-transparent">
              UN Sustainable Development Goals
            </span>
          </h2>
          <p className="text-lg text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
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
        <div className="text-center mt-12" style={{marginBottom: '0.5cm'}}>
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
