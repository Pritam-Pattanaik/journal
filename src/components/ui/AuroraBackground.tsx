import React, { ReactNode } from "react";
import { cn } from "../../lib/cn";

interface AuroraBackgroundProps extends React.HTMLProps<HTMLDivElement> {
  children?: ReactNode;
  showRadialGradient?: boolean;
}

export const AuroraBackground = React.memo(({
  className,
  children,
  showRadialGradient = true,
  ...props
}: AuroraBackgroundProps) => {
  return (
    <div
      className={cn("relative h-full w-full bg-canvas text-primary transition-colors duration-300", className)}
      {...props}
    >
      {/* Subtle Aurora layer */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        <div
          className={cn(
            // Light mode base
            `[--light-gradient:repeating-linear-gradient(100deg,rgba(245,247,250,0.9)_0%,rgba(245,247,250,0.9)_7%,transparent_10%,transparent_12%,rgba(245,247,250,0.9)_16%)]`,
            // Dark mode base
            `dark:[--dark-gradient:repeating-linear-gradient(100deg,rgba(8,12,20,0.95)_0%,rgba(8,12,20,0.95)_7%,transparent_10%,transparent_12%,rgba(8,12,20,0.95)_16%)]`,
            // Aurora: accent -> iris -> lavender (luxury palette)
            `[--aurora:repeating-linear-gradient(100deg,#1A4FB8_5%,#5A4FCF_15%,#8B7CF8_20%,#4F8EF7_28%,#6366F1_36%,#8B7CF8_44%)]`,

            `[background-image:var(--light-gradient),var(--aurora)]`,
            `dark:[background-image:var(--dark-gradient),var(--aurora)]`,

            `[background-size:400%,_260%]`,
            `[background-position:50%_50%,50%_50%]`,
            `filter blur-[28px]`,

            `after:content-[""] after:absolute after:inset-0`,
            `after:[background-image:var(--light-gradient),var(--aurora)]`,
            `dark:after:[background-image:var(--dark-gradient),var(--aurora)]`,
            `after:[background-size:200%,_120%]`,
            `after:animate-aurora after:[background-attachment:fixed]`,

            `pointer-events-none absolute -inset-[10px]`,
            `opacity-[0.04] dark:opacity-[0.15] will-change-transform`,
            showRadialGradient &&
              `[mask-image:radial-gradient(ellipse_at_75%_0%,black_10%,transparent_60%)]`
          )}
        />
      </div>
      <div className="relative z-10 h-full w-full">{children}</div>
    </div>
  );
});
