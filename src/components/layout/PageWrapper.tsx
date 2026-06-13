import React from 'react';

interface PageWrapperProps {
  children: React.ReactNode;
}

export default function PageWrapper({ children }: PageWrapperProps) {
  return (
    <div className="flex-1 overflow-y-auto page-enter p-6 max-w-[1400px] w-full mx-auto">
      {children}
    </div>
  );
}
