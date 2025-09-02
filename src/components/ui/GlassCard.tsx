import React from 'react';

interface GlassCardProps {
  children: React.ReactNode;
  className?: string;
  variant?: 'default' | 'elevated' | 'subtle';
}

export default function GlassCard({ children, className = '', variant = 'default' }: GlassCardProps) {
  const baseClasses = 'backdrop-blur-xl border border-white/10 rounded-2xl';
  
  const variants = {
    default: 'bg-white/5 shadow-2xl shadow-black/20',
    elevated: 'bg-white/8 shadow-2xl shadow-black/30 border-white/20',
    subtle: 'bg-white/3 shadow-lg shadow-black/10'
  };

  return (
    <div className={`${baseClasses} ${variants[variant]} ${className}`}>
      {children}
    </div>
  );
}