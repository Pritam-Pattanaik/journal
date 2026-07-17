import React, { ReactNode } from "react";
import { cn } from "../../lib/cn";

interface AuroraBackgroundProps extends React.HTMLProps<HTMLDivElement> {
  children?: ReactNode;
  showRadialGradient?: boolean;
}

export const AuroraBackground = ({
  className,
  children,
  showRadialGradient = true,
  ...props
}: AuroraBackgroundProps) => {
  return (
    <div
      className={cn(
        "relative h-full w-full bg-canvas text-primary transition-colors duration-300",
        className
      )}
      {...props}
    >
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        <div
          className={cn(
            `
          [--white-gradient:repeating-linear-gradient(100deg,rgba(0,0,0,0.03)_0%,rgba(0,0,0,0.03)_7%,transparent_10%,transparent_12%,rgba(0,0,0,0.03)_16%)]
          [--dark-gradient:repeating-linear-gradient(100deg,rgba(255,255,255,0.03)_0%,rgba(255,255,255,0.03)_7%,transparent_10%,transparent_12%,rgba(255,255,255,0.03)_16%)]
          [--aurora:repeating-linear-gradient(100deg,#3b82f6_10%,#818cf8_15%,#93c5fd_20%,#ddd6fe_25%,#60a5fa_30%)]
          
          [background-image:var(--white-gradient),var(--aurora)]
          dark:[background-image:var(--dark-gradient),var(--aurora)]
          
          [background-size:300%,_200%]
          [background-position:50%_50%,50%_50%]
          filter blur-[20px] 
          
          after:content-[""] after:absolute after:inset-0 
          after:[background-image:var(--white-gradient),var(--aurora)] 
          dark:after:[background-image:var(--dark-gradient),var(--aurora)]
          after:[background-size:200%,_100%] 
          after:animate-aurora after:[background-attachment:fixed]
          
          pointer-events-none
          absolute -inset-[10px] opacity-10 dark:opacity-20 will-change-transform`,
            showRadialGradient &&
              `[mask-image:radial-gradient(ellipse_at_100%_0%,black_10%,transparent_70%)]`
          )}
        ></div>
      </div>
      <div className="relative z-10 h-full w-full">{children}</div>
    </div>
  );
};
