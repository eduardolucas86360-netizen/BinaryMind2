import React from 'react';

interface LogoProps {
  className?: string;
}

export const Logo: React.FC<LogoProps> = ({ className = "w-10 h-10" }) => {
  return (
    <svg 
      viewBox="0 0 100 100" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg" 
      className={className}
    >
      {/* Elementos Binários (Lado Esquerdo - Cérebro Digital) */}
      <rect x="15" y="30" width="8" height="8" rx="2" fill="currentColor" className="opacity-80" />
      <rect x="28" y="30" width="18" height="8" rx="2" fill="currentColor" className="opacity-60" />
      
      <rect x="15" y="45" width="22" height="8" rx="2" fill="currentColor" className="opacity-90" />
      <rect x="42" y="45" width="8" height="8" rx="2" fill="currentColor" className="opacity-70" />
      
      <rect x="20" y="60" width="8" height="8" rx="2" fill="currentColor" className="opacity-60" />
      <rect x="33" y="60" width="15" height="8" rx="2" fill="currentColor" className="opacity-80" />

      {/* Rosto Minimalista (Perfil Direito) */}
      <path 
        d="M55 25C55 25 75 25 75 45C75 55 65 58 65 65C65 72 70 75 70 75V80H55" 
        stroke="currentColor" 
        strokeWidth="6" 
        strokeLinecap="round" 
        strokeLinejoin="round"
      />
      
      {/* Conexão Neural Superior */}
      <path d="M55 25V40" stroke="currentColor" strokeWidth="4" strokeLinecap="round" className="opacity-50" />
    </svg>
  );
};
