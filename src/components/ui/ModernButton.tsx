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
  const baseClasses = 'font-semibold rounded-xl transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98] border';

  // Updated variants for Light Theme (Stone/White)
  const variants = {
    primary: 'bg-indigo-600 hover:bg-indigo-700 text-white border-transparent shadow-lg shadow-indigo-500/20',
    // Secondary: Light stone background (slightly darker than page bg) with dark text
    secondary: 'bg-stone-200 hover:bg-stone-300 text-stone-800 border-stone-300 shadow-sm',
    // Ghost: Transparent, hover effect
    ghost: 'bg-transparent hover:bg-stone-100 text-stone-600 hover:text-stone-900 border-transparent',
    danger: 'bg-red-50 hover:bg-red-100 text-red-600 hover:text-red-700 border-red-200'
  };

  const sizes = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-6 py-3 text-lg'
  };

  const disabledClasses = disabled ? 'opacity-50 cursor-not-allowed hover:scale-100 active:scale-100 grayscale' : '';

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