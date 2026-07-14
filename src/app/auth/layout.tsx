import type { Metadata } from "next";
import type { ReactNode } from "react";
import { NO_INDEX_ROBOTS } from "@/core/config/seo";

export const metadata: Metadata = {
  robots: NO_INDEX_ROBOTS,
};

export default function AuthLayout({ children }: { children: ReactNode }) {
  return children;
}
