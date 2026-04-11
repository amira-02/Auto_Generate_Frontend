// src/components/FloatingIcon.tsx
import React from 'react';

interface FloatingIconProps {
  children: React.ReactNode;
  className?: string;
}

const FloatingIcon: React.FC<FloatingIconProps> = ({ children, className = '' }) => {
  return (
    <div
      className={`absolute transition-all duration-700 hover:scale-125 ${className}`}
      style={{
        animation: 'float 6s ease-in-out infinite',
      }}
    >
      {children}
    </div>
  );
};

export default FloatingIcon;