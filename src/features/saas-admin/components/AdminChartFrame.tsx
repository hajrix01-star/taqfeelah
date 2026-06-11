import type { ReactNode } from "react";

type AdminChartFrameProps = {
  children: ReactNode;
  className?: string;
};

export function AdminChartFrame({ children, className = "" }: AdminChartFrameProps) {
  return (
    <div className={`admin-chart-frame h-56 w-full min-w-0 sm:h-64 md:h-72 ${className}`.trim()}>
      {children}
    </div>
  );
}
