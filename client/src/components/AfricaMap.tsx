import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin } from 'lucide-react';

interface CountryStats {
  country: string;
  count: number;
  lat?: number;
  lng?: number;
}

interface AfricaMapProps {
  isVisible: boolean;
  stats: CountryStats[];
}

// Coordinates mapping for common ACETEL countries
const COUNTRY_COORDS: Record<string, { x: string; y: string }> = {
  "Nigeria": { x: "46%", y: "48%" },
  "Ghana": { x: "41%", y: "52%" },
  "Kenya": { x: "65%", y: "58%" },
  "Senegal": { x: "32%", y: "44%" },
  "Ethiopia": { x: "68%", y: "50%" },
  "Tanzania": { x: "64%", y: "65%" },
  "Cameroon": { x: "50%", y: "55%" },
  "Uganda": { x: "61%", y: "56%" },
  "Rwanda": { x: "60%", y: "60%" },
  "South Africa": { x: "55%", y: "85%" },
};

const AfricaMap: React.FC<AfricaMapProps> = ({ isVisible, stats }) => {
  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ duration: 0.5, ease: "easeInOut" }}
          className="overflow-hidden bg-[#F5FAF2] border-b border-[#C0DD97]"
        >
          <div className="max-w-4xl mx-auto py-12 px-6 flex flex-col md:flex-row items-center gap-12">
            
            {/* SVG Africa Map Container */}
            <div className="relative w-full max-w-[400px] aspect-[1/1.1]">
              <svg
                viewBox="0 0 320 350"
                className="w-full h-full drop-shadow-sm"
                fill="#EAF3DE"
                stroke="#C0DD97"
                strokeWidth="1"
              >
                <path d="M120,40 C140,20 200,30 240,60 C280,90 300,140 280,180 C260,220 230,280 200,310 C170,340 130,340 110,300 C90,260 70,220 50,200 C30,180 20,140 30,110 C40,80 80,60 120,40 Z" />
                {/* Note: This is a simplified stylistic Africa path for branding purposes */}
              </svg>

              {/* Pins */}
              {stats.map((item) => {
                const pos = COUNTRY_COORDS[item.country];
                if (!pos) return null;
                return (
                  <motion.div
                    key={item.country}
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.6 }}
                    style={{ left: pos.x, top: pos.y }}
                    className="absolute -translate-x-1/2 -translate-y-1/2 group"
                  >
                    <MapPin 
                      size={20} 
                      className="text-[#3B6D11] fill-[#EAF3DE] cursor-pointer hover:scale-125 transition-transform" 
                    />
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 bg-[#173404] text-white text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-10">
                      {item.country}: {item.count} Students
                    </div>
                  </motion.div>
                );
              })}
            </div>

            {/* Stats Sidebar */}
            <div className="flex-1 text-left">
              <h3 className="text-[#173404] text-xl font-bold mb-4">Regional Presence</h3>
              <p className="text-[#3B6D11] text-sm mb-6 leading-relaxed">
                ACETEL leverages technology to reach students across the continent. Our digital-first 
                platform ensures no administrative or geographical barriers to excellence.
              </p>
              <div className="grid grid-cols-2 gap-4">
                {stats.slice(0, 6).map(s => (
                  <div key={s.country} className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-[#3B6D11]" />
                    <span className="text-xs font-semibold text-[#173404]">{s.country}</span>
                    <span className="text-[10px] text-[#639922]">({s.count})</span>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default AfricaMap;
