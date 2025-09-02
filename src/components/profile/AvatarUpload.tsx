import React from 'react';
import { SquareUserRound, SquarePen } from 'lucide-react';

interface AvatarUploadProps {
  avatarUrl?: string;
  onUpload: (event: React.ChangeEvent<HTMLInputElement>) => void;
  uploading?: boolean;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

export default function AvatarUpload({ 
  avatarUrl, 
  onUpload, 
  uploading = false,
  size = 'xl'
}: AvatarUploadProps) {
  const sizes = {
    sm: 'w-16 h-16',
    md: 'w-24 h-24', 
    lg: 'w-32 h-32',
    xl: 'w-40 h-40'
  };

  const iconSizes = {
    sm: 24,
    md: 32,
    lg: 40,
    xl: 48
  };

  const editButtonSizes = {
    sm: 'w-6 h-6',
    md: 'w-8 h-8',
    lg: 'w-10 h-10', 
    xl: 'w-12 h-12'
  };

  return (
    <div className="relative group">
      <div className={`${sizes[size]} mx-auto relative overflow-hidden rounded-full`}>
        {avatarUrl ? (
          <img 
            src={avatarUrl} 
            alt="Profile Avatar" 
            className="w-full h-full object-cover border-4 border-white/20 group-hover:border-blue-500/50 transition-all duration-300" 
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-gray-800 to-gray-900 flex items-center justify-center border-4 border-white/20 group-hover:border-blue-500/50 transition-all duration-300">
            <SquareUserRound size={iconSizes[size]} className="text-gray-400 group-hover:text-blue-400 transition-colors duration-300" />
          </div>
        )}
        
        {/* Overlay for hover effect */}
        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center rounded-full">
          <SquarePen size={20} className="text-white" />
        </div>
      </div>
      
      {/* Edit Button */}
      <label 
        htmlFor="avatar-upload" 
        className={`absolute -bottom-2 -right-2 ${editButtonSizes[size]} bg-gradient-to-r from-blue-600 to-indigo-600 
          rounded-full cursor-pointer hover:from-blue-500 hover:to-indigo-500 transition-all duration-300 
          transform hover:scale-110 active:scale-95 flex items-center justify-center border-2 border-white/20
          shadow-lg shadow-blue-500/25`}
      >
        <SquarePen size={16} className="text-white" />
        <input 
          id="avatar-upload" 
          type="file" 
          accept="image/*" 
          onChange={onUpload} 
          disabled={uploading} 
          className="hidden"
        />
      </label>
      
      {uploading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        </div>
      )}
    </div>
  );
}