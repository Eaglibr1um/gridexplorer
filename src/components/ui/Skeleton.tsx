import React from 'react';

interface SkeletonProps {
  className?: string;
}

const Skeleton = ({ className = '' }: SkeletonProps) => {
  return (
    <div 
      className={`animate-pulse bg-gray-200 rounded-md ${className}`}
      style={{
        backgroundImage: 'linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%)',
        backgroundSize: '200% 100%',
        animation: 'skeleton-loading 1.5s infinite linear'
      }}
    />
  );
};

export default Skeleton;

