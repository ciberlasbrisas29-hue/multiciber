"use client";

interface SkeletonLoaderProps {
  variant?: 'text' | 'card' | 'list' | 'table' | 'circle' | 'custom';
  width?: string;
  height?: string;
  className?: string;
  count?: number;
}

const SkeletonLoader: React.FC<SkeletonLoaderProps> = ({
  variant = 'text',
  width,
  height,
  className = '',
  count = 1
}) => {
  const baseClasses = 'animate-pulse bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 bg-[length:200%_100%]';

  const variants = {
    text: `h-4 rounded ${width || 'w-full'}`,
    card: `rounded-xl ${width || 'w-full'} ${height || 'h-32'}`,
    list: `h-16 rounded-lg ${width || 'w-full'}`,
    table: `h-12 rounded ${width || 'w-full'}`,
    circle: `rounded-full ${width || 'w-12'} ${height || 'h-12'}`,
    custom: ''
  };

  const skeletonClass = `${baseClasses} ${variants[variant]} ${className}`;

  if (count > 1) {
    return (
      <div className="space-y-2">
        {Array.from({ length: count }).map((_, index) => (
          <div key={index} className={skeletonClass} />
        ))}
      </div>
    );
  }

  return <div className={skeletonClass} />;
};

export default SkeletonLoader;

