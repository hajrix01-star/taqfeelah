"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { motion } from "framer-motion";
import {
  MARKETING_CARD_RADIUS,
  MARKETING_CARD_RING,
  MARKETING_GOLD,
  MARKETING_INK,
  MARKETING_MUTED,
  MARKETING_SHELL_BG,
  MARKETING_SOFT,
} from "@/features/marketing/marketing-brand";

type CtaVariant = "primary" | "secondary" | "whatsapp";

const ctaClassName: Record<CtaVariant, string> = {
  primary:
    "inline-flex w-full items-center justify-center rounded-2xl bg-[#112A46] px-5 py-3.5 text-sm font-black text-white no-underline transition hover:bg-[#0d2138] sm:w-auto",
  secondary:
    "inline-flex w-full items-center justify-center rounded-2xl bg-white px-5 py-3.5 text-sm font-black text-[#112A46] no-underline ring-1 ring-black/[0.05] transition hover:bg-[#F7F5EF] sm:w-auto",
  whatsapp:
    "inline-flex w-full items-center justify-center rounded-2xl bg-[#25D366] px-5 py-3.5 text-sm font-black text-white no-underline transition hover:bg-[#1ebe5d] sm:w-auto",
};

export function MarketingCta({
  href,
  children,
  variant = "primary",
  external = false,
}: {
  href: string;
  children: ReactNode;
  variant?: CtaVariant;
  external?: boolean;
}) {
  const className = ctaClassName[variant];

  if (external) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" className={className}>
        {children}
      </a>
    );
  }

  return (
    <Link href={href} className={className}>
      {children}
    </Link>
  );
}

export function MarketingSectionIntro({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: string;
  description: string;
}) {
  return (
    <div className="max-w-2xl">
      <p className="text-taq-meta font-black uppercase tracking-wide" style={{ color: MARKETING_GOLD }}>
        {eyebrow}
      </p>
      <h2 className="mt-2 text-2xl font-black sm:text-3xl" style={{ color: MARKETING_INK }}>
        {title}
      </h2>
      <p className="mt-3 text-sm font-bold leading-7 sm:text-base" style={{ color: MARKETING_SOFT }}>
        {description}
      </p>
    </div>
  );
}

export function MarketingCard({
  children,
  className = "",
  featured = false,
}: {
  children: ReactNode;
  className?: string;
  featured?: boolean;
}) {
  return (
    <article
      className={`${MARKETING_CARD_RADIUS} bg-white p-5 shadow-sm ${MARKETING_CARD_RING} ${
        featured ? "ring-2 ring-[#B99844]/70" : ""
      } ${className}`}
    >
      {children}
    </article>
  );
}

export function MarketingFadeIn({
  children,
  className = "",
  delay = 0,
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.4, delay }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

export function MarketingShell({
  children,
  header,
  footer,
  mobileCta,
}: {
  children: ReactNode;
  header: ReactNode;
  footer: ReactNode;
  mobileCta: ReactNode;
}) {
  return (
    <div
      className="min-h-[100dvh] font-sans"
      style={{ backgroundColor: MARKETING_SHELL_BG, color: MARKETING_INK }}
      dir="rtl"
    >
      {header}
      <main className="pb-24 md:pb-0">{children}</main>
      {footer}
      <div
        className="fixed inset-x-0 bottom-0 z-40 border-t border-[#ECE6DA] p-3 backdrop-blur-sm md:hidden"
        style={{ backgroundColor: `${MARKETING_SHELL_BG}f2` }}
      >
        {mobileCta}
      </div>
    </div>
  );
}

export function marketingNavLinkClassName(): string {
  return "text-sm font-bold no-underline transition hover:text-[#112A46]";
}

export function marketingMutedTextClassName(): string {
  return "text-sm font-bold leading-7";
}

export const marketingColors = {
  ink: MARKETING_INK,
  muted: MARKETING_MUTED,
  soft: MARKETING_SOFT,
  gold: MARKETING_GOLD,
  shell: MARKETING_SHELL_BG,
};
