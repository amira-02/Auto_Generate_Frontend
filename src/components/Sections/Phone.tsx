// src/components/HomePage.tsx
import React from 'react';
import Smartphone from '../UI/Smartphone';


const Phone: React.FC = () => {
  return (
    <div className="min-h-screen bg-white relative overflow-hidden flex items-center justify-center px-8">
 
      {/* The Smartphone - centered */}
      <div className="relative z-10">
        <Smartphone />
      </div>

     
    </div>
  );
};

export default Phone;