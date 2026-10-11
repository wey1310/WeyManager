import React from 'react';

interface GardenCardProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  hoverable?: boolean;
}

export const GardenCard: React.FC<GardenCardProps> = ({
  children,
  className = '',
  onClick,
  hoverable = false,
}) => {
  return (
    <div
      onClick={onClick}
      className={`bg-white rounded-xl border border-[#e4d8c9]/80 shadow-[0_1px_3px_rgba(41,62,43,0.04)] p-5 ${
        hoverable ? 'hover:border-[#a7c8a7] hover:shadow-md transition-all duration-200 cursor-pointer' : ''
      } ${className}`}
    >
      {children}
    </div>
  );
};
