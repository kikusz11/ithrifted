import React from 'react';

interface GlassCardProps {
  children: React.ReactNode;
  className?: string;
  variant?: 'default' | 'elevated' | 'subtle';
}

export default function GlassCard({ children, className = '', variant = 'default' }: GlassCardProps) {
  // Updated for Light Brown/White Theme
  // Old: backdrop-blur-xl border border-white/10 rounded-2xl
  const baseClasses = 'rounded-2xl transition-all duration-300';

  const variants = {
    // White card with soft shadow
    default: 'bg-white shadow-lg border border-stone-100',
    // Higher elevation
    elevated: 'bg-white shadow-2xl border border-stone-200',
    // Subtle offset background
    subtle: 'bg-stone-50 border border-stone-200 shadow-sm'
  };

  return (
    <div className={`${baseClasses} ${variants[variant]} ${className}`}>
      {children}
    </div>
  );
}