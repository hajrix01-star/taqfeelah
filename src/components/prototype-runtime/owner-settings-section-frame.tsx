"use client";

import type React from "react";
import { motion } from "framer-motion";

export function SettingsSectionFrame({ embedded, children }: { embedded?: boolean; children: React.ReactNode }) {
  if (embedded) return children;
  return (
    <motion.section initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="taq-page-gutter pb-24">
      {children}
    </motion.section>
  );
}
