import React from 'react';

interface GardenButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  icon?: React.ReactNode;
}

export const GardenButton: React.FC<GardenButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  icon,
  className = '',
  disabled,
  ...props
}) => {
  const sizeClasses = {
    sm: 'px-2.5 py-1.5 text-xs gap-1.5',
    md: 'px-4 py-2 text-sm gap-2',
    lg: 'px-5 py-2.5 text-base gap-2.5',
  };

  const variantClasses = {
    primary:
      'bg-[#467348] text-white hover:bg-[#395c3b] active:bg-[#304a32] shadow-sm shadow-[#467348]/20 border border-[#467348]',
    secondary:
      'bg-[#eef5ee] text-[#395c3b] hover:bg-[#e1ede1] active:bg-[#d4e4d4] border border-[#cbdfcb]',
    outline:
      'bg-white text-[#293e2b] hover:bg-[#f6f9f6] border border-[#cbdfcb]',
    danger:
      'bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200',
    ghost:
      'bg-transparent text-[#395c3b] hover:bg-[#eef5ee]/60 border border-transparent',
  };

  return (
    <button
      disabled={disabled}
      className={`inline-flex items-center justify-center font-medium rounded-lg transition-colors duration-150 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap focus-visible:outline-2 focus-visible:outline-[#467348] ${sizeClasses[size]} ${variantClasses[variant]} ${className}`}
      {...props}
    >
      {icon && <span className="shrink-0">{icon}</span>}
      <span>{children}</span>
    </button>
  );
};
