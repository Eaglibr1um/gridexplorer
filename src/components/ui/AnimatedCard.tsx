import { ReactNode } from 'react';

interface AnimatedCardProps {
  children: ReactNode;
  className?: string;
  hover?: boolean;
  delay?: number;
  onClick?: () => void;
}

const AnimatedCard = ({
  children,
  className = '',
  hover = true,
  delay = 0,
  onClick,
}: AnimatedCardProps) => {
  const delayClass = delay > 0 ? `animate-stagger-${Math.min(Math.floor(delay / 50), 4)}` : 'animate-fade-in-up';

  return (
    <div
      className={`
        bg-white rounded-xl shadow-lg p-6
        ${hover ? 'card-hover' : ''}
        ${delayClass}
        ${onClick ? 'cursor-pointer' : ''}
        ${className}
      `}
      onClick={onClick}
      style={delay > 0 ? { animationDelay: `${delay}ms` } : undefined}
    >
      {children}
    </div>
  );
};

export default AnimatedCard;

