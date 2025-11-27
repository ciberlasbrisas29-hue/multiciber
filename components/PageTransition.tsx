"use client";

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';

const PageTransition: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const pathname = usePathname();
  const [isTransitioning, setIsTransitioning] = useState(false);

  useEffect(() => {
    setIsTransitioning(true);
    const timer = setTimeout(() => {
      setIsTransitioning(false);
    }, 150);

    return () => {
      clearTimeout(timer);
    };
  }, [pathname]);

  return (
    <div 
      className={`page-transition ${isTransitioning ? 'opacity-0' : 'opacity-100'}`}
      style={{ transition: 'opacity 0.15s ease-in-out' }}
    >
      {children}
    </div>
  );
};

export default PageTransition;

