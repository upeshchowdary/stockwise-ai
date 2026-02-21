import * as React from "react";

import { cn } from "@/lib/utils";

// Simple TooltipProvider that avoids the Radix useRef crash with React 18
const TooltipProvider: React.FC<{ children: React.ReactNode; delayDuration?: number; skipDelayDuration?: number }> = ({ children }) => {
  return <>{children}</>;
};

const Tooltip: React.FC<{ children: React.ReactNode; open?: boolean; defaultOpen?: boolean; onOpenChange?: (open: boolean) => void }> = ({ children }) => {
  return <>{children}</>;
};

const TooltipTrigger = React.forwardRef<HTMLButtonElement, React.ButtonHTMLAttributes<HTMLButtonElement> & { asChild?: boolean }>(
  ({ children, ...props }, ref) => {
    if (props.asChild) {
      return <>{children}</>;
    }
    return <button ref={ref} {...props}>{children}</button>;
  }
);
TooltipTrigger.displayName = "TooltipTrigger";

const TooltipContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & { sideOffset?: number; side?: string; align?: string }
>(({ className, sideOffset = 4, side, align, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "z-50 overflow-hidden rounded-md border bg-popover px-3 py-1.5 text-sm text-popover-foreground shadow-md",
      className,
    )}
    style={{ display: "none" }}
    {...props}
  />
));
TooltipContent.displayName = "TooltipContent";

export { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider };
