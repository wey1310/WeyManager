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
      className={`bg-[#FFFDF6] rounded-2xl border border-[#D5E4D0] shadow-[0_1px_3px_rgba(41,62,43,0.04)] p-5 sm:p-6 ${
        hoverable ? 'hover:border-[#A8C7A0] hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 cursor-pointer' : ''
      } ${className}`}
    >
      {children}
    </div>
  );
};
