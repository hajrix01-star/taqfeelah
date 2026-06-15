"use client";

import Link from "next/link";
import type { CSSProperties, ReactNode } from "react";
import { motion } from "framer-motion";
import {
  MARKETING_CARD_RADIUS,
  MARKETING_CARD_RING,
  MARKETING_EQUATION,
  MARKETING_GOLD,
  MARKETING_INK,
  MARKETING_INK_DEEP,
  MARKETING_MUTED,
  MARKETING_NOTEBOOK_LINE,
  MARKETING_NOTEBOOK_MARGIN,
  MARKETING_PAPER,
  MARKETING_SHELL_BG,
  MARKETING_SOFT,
  MARKETING_TAGLINE,
} from "@/features/marketing/marketing-brand";
import { marketingFontClassNames } from "@/features/marketing/marketing-fonts";

type CtaVariant = "primary" | "secondary" | "whatsapp" | "gold";

const ctaClassName: Record<CtaVariant, string> = {
  primary:
    "inline-flex w-full items-center justify-center rounded-2xl bg-[#112A46] px-5 py-3.5 text-sm font-black text-white no-underline transition hover:bg-[#0D1B2A] sm:w-auto",
  secondary:
    "inline-flex w-full items-center justify-center rounded-2xl bg-white px-5 py-3.5 text-sm font-black text-[#112A46] no-underline ring-1 ring-black/[0.05] transition hover:bg-[#F7F5EF] sm:w-auto",
  whatsapp:
    "inline-flex w-full items-center justify-center rounded-2xl bg-[#25D366] px-5 py-3.5 text-sm font-black text-white no-underline transition hover:bg-[#1ebe5d] sm:w-auto",
  gold:
    "inline-flex w-full items-center justify-center rounded-2xl bg-[#F5A623] px-5 py-3.5 text-sm font-black text-[#112A46] no-underline transition hover:bg-[#e09515] sm:w-auto",
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

export function MarketingBrandWordmark({
  className = "",
  size = "default",
}: {
  className?: string;
  size?: "default" | "compact" | "hero";
}) {
  const arabicSize =
    size === "hero" ? "text-4xl sm:text-5xl" : size === "compact" ? "text-xl" : "text-2xl sm:text-3xl";
  const latinSize =
    size === "hero" ? "text-sm sm:text-base" : size === "compact" ? "text-[0.65rem]" : "text-xs sm:text-sm";

  return (
    <div className={`inline-flex flex-col items-start gap-0.5 ${className}`}>
      <span className={`font-black leading-none tracking-tight ${arabicSize}`} style={{ color: MARKETING_INK }}>
        تقفيلة
      </span>
      <span
        className={`font-bold uppercase tracking-[0.28em] ${latinSize}`}
        style={{ color: MARKETING_GOLD, fontFamily: "var(--font-marketing-poppins), sans-serif" }}
      >
        TAQFEELA
      </span>
    </div>
  );
}

export function MarketingEquation({
  className = "",
  size = "default",
  as: Tag = "p",
}: {
  className?: string;
  size?: "default" | "large";
  as?: "p" | "h1" | "h2";
}) {
  const textSize = size === "large" ? "text-2xl sm:text-3xl lg:text-[2.1rem]" : "text-xl sm:text-2xl";

  return (
    <Tag
      className={`font-black leading-tight ${textSize} ${className}`}
      style={{ color: MARKETING_INK, fontFamily: "var(--font-marketing-cairo), sans-serif" }}
    >
      {MARKETING_EQUATION}
    </Tag>
  );
}

export function MarketingTagline({ className = "" }: { className?: string }) {
  return (
    <p className={`text-base font-black sm:text-lg ${className}`} style={{ color: MARKETING_GOLD }}>
      {MARKETING_TAGLINE}
    </p>
  );
}

export function MarketingNotebookSurface({
  children,
  className = "",
  minHeight,
}: {
  children: ReactNode;
  className?: string;
  minHeight?: string;
}) {
  const style: CSSProperties = {
    backgroundColor: MARKETING_PAPER,
    backgroundImage: `repeating-linear-gradient(180deg, transparent 0px, transparent 27px, ${MARKETING_NOTEBOOK_LINE} 27px, ${MARKETING_NOTEBOOK_LINE} 28px)`,
    minHeight,
  };

  return (
    <div className={`relative overflow-hidden ${className}`} style={style}>
      <div
        className="pointer-events-none absolute bottom-0 top-0 w-px"
        style={{
          backgroundColor: MARKETING_NOTEBOOK_MARGIN,
          insetInlineStart: "2.25rem",
        }}
        aria-hidden
      />
      <div className="relative ps-14 pe-5 py-5 sm:ps-16 sm:pe-6">{children}</div>
    </div>
  );
}

export function MarketingSectionIntro({
  eyebrow,
  title,
  description,
  align = "start",
}: {
  eyebrow: string;
  title: string;
  description: string;
  align?: "start" | "center";
}) {
  const alignClass = align === "center" ? "mx-auto text-center" : "";

  return (
    <div className={`max-w-2xl ${alignClass}`}>
      <p
        className="text-taq-meta font-black uppercase tracking-wide"
        style={{ color: MARKETING_GOLD, fontFamily: "var(--font-marketing-poppins), sans-serif" }}
      >
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
  notebook = false,
}: {
  children: ReactNode;
  className?: string;
  featured?: boolean;
  notebook?: boolean;
}) {
  if (notebook) {
    return (
      <article
        className={`overflow-hidden ${MARKETING_CARD_RADIUS} shadow-sm ${MARKETING_CARD_RING} ${
          featured ? "ring-2 ring-[#F5A623]/60" : ""
        } ${className}`}
      >
        {children}
      </article>
    );
  }

  return (
    <article
      className={`${MARKETING_CARD_RADIUS} bg-white p-5 shadow-sm ${MARKETING_CARD_RING} ${
        featured ? "ring-2 ring-[#F5A623]/60" : ""
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
      className={`min-h-[100dvh] ${marketingFontClassNames}`}
      style={{
        backgroundColor: MARKETING_SHELL_BG,
        color: MARKETING_INK,
        fontFamily: "var(--font-marketing-cairo), sans-serif",
      }}
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
  inkDeep: MARKETING_INK_DEEP,
  muted: MARKETING_MUTED,
  soft: MARKETING_SOFT,
  gold: MARKETING_GOLD,
  shell: MARKETING_SHELL_BG,
  income: "#16A34A",
  expense: "#DC2626",
};
