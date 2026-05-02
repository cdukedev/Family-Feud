interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  className?: string;
}

export function Card({ children, className = '', ...props }: CardProps) {
  return (
    <div className={`bg-white/10 backdrop-blur-md rounded-2xl border border-white/10 p-6 ${className}`} {...props}>
      {children}
    </div>
  );
}
