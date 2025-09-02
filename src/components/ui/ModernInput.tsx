import React from 'react';

interface ModernInputProps {
  type?: string;
  name?: string;
  placeholder?: string;
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  className?: string;
  required?: boolean;
}

export default function ModernInput({ 
  type = 'text', 
  name, 
  placeholder, 
  value, 
  onChange, 
  className = '',
  required = false
}: ModernInputProps) {
  return (
    <input
      type={type}
      name={name}
      placeholder={placeholder}
      value={value}
      onChange={onChange}
      required={required}
      className={`w-full bg-white/5 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-gray-400 
        backdrop-blur-sm transition-all duration-300 
        focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 focus:bg-white/10
        hover:bg-white/8 hover:border-white/30 ${className}`}
    />
  );
}