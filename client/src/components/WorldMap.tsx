import React from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import { motion } from 'framer-motion';
import 'leaflet/dist/leaflet.css';

// Custom Pulsing Icon for a "Live" effect
const pulsingIcon = L.divIcon({
  className: 'custom-pulsing-marker',
  html: `<div class="pulse-container">
           <div class="pulse-dot"></div>
           <div class="pulse-ring"></div>
         </div>`,
  iconSize: [20, 20],
  iconAnchor: [10, 10]
});

interface WorldMapProps {
  isVisible: boolean;
  stats: { country: string; count: number }[];
  heightClass: string;
}

// Coordinate mapping — extended with African + global countries
const WORLD_COORDS: Record<string, [number, number]> = {
  // Africa
  "Nigeria": [9.082, 8.675],
  "Ghana": [7.946, -1.023],
  "Kenya": [-1.292, 36.821],
  "Ethiopia": [9.145, 40.489],
  "South Africa": [-30.559, 22.937],
  "Tanzania": [-6.369, 34.888],
  "Uganda": [1.373, 32.290],
  "Rwanda": [-1.940, 29.874],
  "Senegal": [14.497, -14.452],
  "Cameroon": [7.369, 12.354],
  "Côte d'Ivoire": [7.540, -5.547],
  "Ivory Coast": [7.540, -5.547],
  "Zambia": [-13.133, 27.849],
  "Zimbabwe": [-19.015, 29.154],
  "Mozambique": [-18.665, 35.530],
  "Angola": [-11.202, 17.874],
  "Malawi": [-13.254, 34.302],
  "Mali": [17.570, -3.996],
  "Burkina Faso": [12.364, -1.562],
  "Niger": [17.607, 8.081],
  "Chad": [15.454, 18.732],
  "Sudan": [12.862, 30.217],
  "Somalia": [5.152, 46.199],
  "Liberia": [6.428, -9.429],
  "Sierra Leone": [8.460, -11.779],
  "Guinea": [11.387, -11.875],
  "The Gambia": [13.443, -15.310],
  "Gambia": [13.443, -15.310],
  "Togo": [8.619, 0.824],
  "Benin": [9.307, 2.315],
  "Congo": [-0.228, 15.827],
  "DR Congo": [-4.038, 21.759],
  "Gabon": [-0.803, 11.609],
  "Mauritania": [21.007, 10.940],
  "Morocco": [31.791, -7.092],
  "Algeria": [28.033, 1.659],
  "Tunisia": [33.886, 9.537],
  "Egypt": [26.820, 30.802],
  "Libya": [26.335, 17.228],
  "Botswana": [-22.328, 24.684],
  "Namibia": [-22.957, 18.490],
  "Eswatini": [-26.522, 31.466],
  "Lesotho": [-29.610, 28.233],
  "Eritrea": [15.179, 39.782],
  "Djibouti": [11.825, 42.590],
  // Europe
  "United Kingdom": [55.378, -3.436],
  "Germany": [51.165, 10.451],
  "France": [46.227, 2.213],
  "Netherlands": [52.132, 5.291],
  "Belgium": [50.503, 4.469],
  "Sweden": [60.128, 18.643],
  "Norway": [60.472, 8.468],
  // Americas
  "United States": [37.090, -95.712],
  "Canada": [56.130, -106.346],
  "Brazil": [-14.235, -51.925],
  // Asia
  "India": [20.593, 78.962],
  "China": [35.861, 104.195],
  "Malaysia": [4.210, 101.975],
  "Saudi Arabia": [23.885, 45.079],
  "UAE": [23.424, 53.847],
  "United Arab Emirates": [23.424, 53.847],
};

const WorldMap: React.FC<WorldMapProps> = ({ isVisible, stats, heightClass }) => {
  if (!isVisible) return null;

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      exit={{ opacity: 0, height: 0 }}
      className={`relative w-full overflow-hidden transition-all duration-500 ease-in-out ${heightClass}`}
    >
      <style>{`
        .pulse-container { position: relative; width: 20px; height: 20px; display: flex; items-center; justify-center; }
        .pulse-dot { width: 8px; height: 8px; background: #008751; border-radius: 50%; z-index: 2; box-shadow: 0 0 10px rgba(0,135,81,0.5); }
        .pulse-ring { position: absolute; width: 20px; height: 20px; border: 3px solid #008751; border-radius: 50%; opacity: 0; animation: marker-pulse 2s infinite ease-out; z-index: 1; }
        @keyframes marker-pulse {
          0% { transform: scale(0.5); opacity: 0.8; }
          100% { transform: scale(2.5); opacity: 0; }
        }
        .leaflet-container { background: #ffffff !important; }
      `}</style>

      <MapContainer 
        center={[10, 15]} 
        zoom={2} 
        scrollWheelZoom={false}
        className="w-full h-full"
        zoomControl={false}
      >
        <TileLayer
          attribution='&copy; <a href="https://carto.com/attributions">CARTO</a>'
          url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
        />
        {stats.map(item => {
          const coords = WORLD_COORDS[item.country];
          if (!coords) return null;
          return (
            <Marker 
              key={item.country} 
              position={coords}
              icon={pulsingIcon}
            >
              <Popup className="custom-map-popup">
                <div className="text-center font-sans py-1">
                  <h4 className="font-extrabold text-[#173404] text-sm uppercase tracking-wider">{item.country}</h4>
                  <p className="text-[11px] font-bold text-[#008751] mt-0.5">{item.count.toLocaleString()} Students</p>
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
    </motion.div>
  );
};

export default WorldMap;
