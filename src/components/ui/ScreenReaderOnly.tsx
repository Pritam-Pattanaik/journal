import React from 'react';
import { cn } from '../../lib/cn';

type ScreenReaderOnlyProps = React.HTMLAttributes<HTMLSpanElement>;

export function ScreenReaderOnly({ className, children, ...props }: ScreenReaderOnlyProps) {
  return (
    <span
      className={cn('sr-only', className)}
      {...props}
    >
      {children}
    </span>
  );
}
