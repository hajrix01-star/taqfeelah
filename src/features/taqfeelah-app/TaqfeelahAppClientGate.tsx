"use client";

import type { ReactNode } from "react";
import { AppQueryProvider } from "@/core/client/app-query-provider";

export default function TaqfeelahAppClientGate({ children }: { children: ReactNode }) {
  return <AppQueryProvider>{children}</AppQueryProvider>;
}
