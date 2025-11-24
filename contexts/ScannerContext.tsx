"use client";

import React, { createContext, useContext, useState, ReactNode } from 'react';

interface ScannerContextType {
  isScannerOpen: boolean;
  setIsScannerOpen: (open: boolean) => void;
}

const ScannerContext = createContext<ScannerContextType | undefined>(undefined);

export const ScannerProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isScannerOpen, setIsScannerOpen] = useState(false);

  return (
    <ScannerContext.Provider value={{ isScannerOpen, setIsScannerOpen }}>
      {children}
    </ScannerContext.Provider>
  );
};

export const useScanner = () => {
  const context = useContext(ScannerContext);
  if (context === undefined) {
    throw new Error('useScanner must be used within a ScannerProvider');
  }
  return context;
};

