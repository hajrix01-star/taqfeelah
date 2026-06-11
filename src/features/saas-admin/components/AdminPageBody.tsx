import type { ReactNode } from "react";

type AdminPageBodyProps = {
  children: ReactNode;
  className?: string;
};

export function AdminPageBody({ children, className = "" }: AdminPageBodyProps) {
  return (
    <div
      className={`admin-page-body admin-content-container space-y-4 p-4 sm:space-y-5 sm:p-5 ${className}`.trim()}
    >
      {children}
    </div>
  );
}
