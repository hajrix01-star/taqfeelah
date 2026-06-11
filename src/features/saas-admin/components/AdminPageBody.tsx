import type { ReactNode } from "react";

type AdminPageBodyProps = {
  children: ReactNode;
  className?: string;
};

export function AdminPageBody({ children, className = "" }: AdminPageBodyProps) {
  return (
    <div className={`space-y-4 p-4 sm:space-y-6 sm:p-6 ${className}`.trim()}>
      {children}
    </div>
  );
}
