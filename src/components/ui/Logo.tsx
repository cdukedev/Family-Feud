interface LogoProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function Logo({ size = 'md', className = '' }: LogoProps) {
  const sizeStyles = {
    sm: 'text-2xl',
    md: 'text-4xl',
    lg: 'text-6xl',
  };

  return (
    <div className={`text-center ${className}`}>
      <h1 className={`font-extrabold ${sizeStyles[size]} tracking-tight`}>
        <span className="text-[var(--color-gold)] drop-shadow-[0_0_10px_rgba(255,215,0,0.5)]">
          FAMILY
        </span>
        <br />
        <span className="text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.3)]">
          FEUD
        </span>
      </h1>
      <div className="mt-1 h-1 bg-gradient-to-r from-transparent via-[var(--color-gold)] to-transparent" />
    </div>
  );
}
