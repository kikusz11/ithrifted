import React from 'react';

interface ModernButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  type?: 'button' | 'submit';
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  className?: string;
}

export default function ModernButton({ 
  children, 
  onClick, 
  type = 'button', 
  variant = 'primary', 
  size = 'md',
  disabled = false,
  className = ''
}: ModernButtonProps) {
  const baseClasses = 'font-semibold rounded-xl transition-all duration-300 transform hover:scale-105 active:scale-95 backdrop-blur-sm border';
  
  const variants = {
    primary: 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white border-blue-500/50 shadow-lg shadow-blue-500/25',
    secondary: 'bg-white/10 hover:bg-white/20 text-white border-white/20 shadow-lg shadow-black/10',
    ghost: 'bg-transparent hover:bg-white/10 text-gray-300 hover:text-white border-transparent',
    danger: 'bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-red-400 text-white border-red-500/50 shadow-lg shadow-red-500/25'
  };

  const sizes = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-6 py-3 text-lg'
  };

  const disabledClasses = disabled ? 'opacity-50 cursor-not-allowed hover:scale-100 active:scale-100' : '';

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`${baseClasses} ${variants[variant]} ${sizes[size]} ${disabledClasses} ${className}`}
    >
      {children}
    </button>
  );
}