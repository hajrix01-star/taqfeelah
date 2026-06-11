"use client";

import { useState } from "react";
import { QueryClientProvider } from "@tanstack/react-query";
import { createAppQueryClient } from "./create-query-client";

export function AppQueryProvider({ children }) {
  const [queryClient] = useState(() => createAppQueryClient());
  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
}
