import React from 'react';

export const MosqueLogoIcon: React.FC<{ className?: string }> = ({ className = 'w-9 h-9' }) => {
  return (
    <div className={`relative flex items-center justify-center shrink-0 ${className}`}>
      <img
        src="/logo-simka.svg"
        alt="Logo SIMKA.ID"
        className="w-full h-full object-contain select-none pointer-events-none drop-shadow-xs"
        onError={(e) => {
          (e.target as HTMLImageElement).src = '/logo-simka.png';
        }}
      />
    </div>
  );
};

export const MosqueStamp: React.FC<{ className?: string }> = ({ className = 'w-6 h-6' }) => {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M12 3c-2.5 2-3.5 4.5-3.5 7h7c0-2.5-1-5-3.5-7z" />
      <path d="M4 14h16v7H4z" />
      <path d="M10 21v-4a2 2 0 0 1 4 0v4" />
      <path d="M2 21h20" />
      <path d="M3 14V9l1.5-2L6 9v5" />
      <path d="M18 14V9l1.5-2L21 9v5" />
    </svg>
  );
};
