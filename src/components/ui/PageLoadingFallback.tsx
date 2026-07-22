import React from 'react';
import { Loader2 } from 'lucide-react';

export function PageLoadingFallback() {
  return (
    <div className="flex h-full min-h-[50vh] w-full items-center justify-center p-8">
      <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
    </div>
  );
}
