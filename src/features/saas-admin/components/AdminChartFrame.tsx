import type { ReactNode } from "react";

type AdminChartFrameProps = {
  children: ReactNode;
  className?: string;
};

export function AdminChartFrame({ children, className = "" }: AdminChartFrameProps) {
  return (
    <div className={`admin-chart-frame h-48 w-full min-w-0 sm:h-52 md:h-56 ${className}`.trim()}>
      {children}
    </div>
  );
}
