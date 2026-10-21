import React from 'react';

interface MosqueLogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'full' | 'icon-only' | 'badge';
  withText?: boolean;
}

export const MosqueLogo: React.FC<MosqueLogoProps> = ({
  className = '',
  size = 'md',
  variant = 'icon-only',
  withText = false
}) => {
  const sizeMap = {
    sm: 'w-7 h-7',
    md: 'w-9 h-9',
    lg: 'w-12 h-12',
    xl: 'w-16 h-16'
  };

  const iconSize = sizeMap[size] || sizeMap.md;

  return (
    <div className={`inline-flex items-center gap-3 ${className}`}>
      {/* Official SIMKA Emerald Mosque Logo */}
      <img
        src="/logo-simka.svg"
        alt="Logo SIMKA.ID"
        className={`${iconSize} object-contain rounded-xl drop-shadow-xs select-none pointer-events-none shrink-0`}
        onError={(e) => {
          (e.target as HTMLImageElement).src = '/logo-simka.png';
        }}
      />

      {/* Optional Brand Text */}
      {withText && (
        <div className="flex flex-col text-left">
          <div className="flex items-center gap-1.5 leading-none">
            <span className="text-base font-black tracking-tight text-slate-900 dark:text-white">
              SIMKA<span className="text-[#00B686]">.ID</span>
            </span>
          </div>
          <span className="text-[10.5px] font-medium text-emerald-700 dark:text-emerald-300 tracking-normal mt-0.5">
            Sistem Monitoring Karakter
          </span>
        </div>
      )}
    </div>
  );
};
