import React from 'react';
import { cn } from '../../lib/cn';

interface SkeletonLoaderProps {
  className?: string;
  width?: string | number;
  height?: string | number;
}

export function SkeletonLoader({ className, width, height }: SkeletonLoaderProps) {
  return (
    <div
      className={cn("animate-pulse bg-surface-2 rounded-md", className)}
      style={{
        width: width !== undefined ? (typeof width === 'number' ? `${width}px` : width) : '100%',
        height: height !== undefined ? (typeof height === 'number' ? `${height}px` : height) : '20px',
      }}
    />
  );
}
