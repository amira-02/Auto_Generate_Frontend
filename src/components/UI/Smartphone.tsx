// src/components/Smartphone.tsx
import React from 'react';
import AppInterface from './AppInterface';

const Smartphone: React.FC = () => {
  return (
    <div
      className="relative w-[290px] h-[590px] bg-black rounded-[2.8rem] shadow-2xl border-[12px] border-black flex items-center justify-center overflow-hidden"
      style={{
        transform: 'rotate(-14deg)',           // Exact tilt like the photo
        boxShadow: '25px 35px 60px -10px rgba(0, 0, 0, 0.4)',
      }}
    >
      {/* Side buttons */}
      <div className="absolute -left-[5px] top-20 w-[5px] h-12 bg-black rounded-l-md"></div>
      <div className="absolute -left-[5px] top-36 w-[5px] h-8 bg-black rounded-l-md"></div>

      {/* Screen */}
      <div className="relative w-[262px] h-[562px] bg-white rounded-[2.2rem] overflow-hidden">
        
        {/* Dynamic Island */}
        <div className="absolute top-3 left-1/2 -translate-x-1/2 w-24 h-5 bg-black rounded-3xl z-50 flex items-center justify-center">
          <div className="w-4 h-4 bg-black rounded-full absolute left-3"></div>
        </div>

        {/* App Content */}
        <AppInterface />

      
         </div>
         
    </div>
    
  );
};

export default Smartphone;