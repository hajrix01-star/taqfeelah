"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { AppFontStyles } from "@/components/taqfeelah-app/taqfeelah-app-font-styles";
import { buildSupportWhatsAppUrl } from "@/core/config/marketing-support";
import { PWA_APP_NAME } from "@/core/config/pwa";
import { ReleaseVersionLine } from "@/release/ReleaseVersionLine";
import { TAQFEELAH_LOGO_SRC } from "@/lib/brand/taqfeelah-logo";
import MarketingAppPreview from "@/features/marketing/MarketingAppPreview";
import {
  MARKETING_FAQ,
  MARKETING_FEATURES,
  MARKETING_PLANS,
} from "@/features/marketing/marketing-content";
import {
  MarketingCard,
  MarketingCta,
  MarketingFadeIn,
  MarketingSectionIntro,
  MarketingShell,
  marketingColors,
  marketingMutedTextClassName,
  marketingNavLinkClassName,
} from "@/features/marketing/marketing-ui";

const PUBLIC_SIGNUP_ENABLED = process.env.NEXT_PUBLIC_PUBLIC_SIGNUP_ENABLED === "true";
const SIGNUP_HREF = PUBLIC_SIGNUP_ENABLED ? "/signup" : "/app";
const APP_LOGIN_HREF = "/app";
const contactMessage = "ظ…ط±ط­ط¨ظ‹ط§طŒ ط£ط±ظٹط¯ ظ…ط¹ط±ظپط© ط§ظ„ظ…ط²ظٹط¯ ط¹ظ† طھظ‚ظپظٹظ„ط© ظˆط§ظ„ط¨ط§ظ‚ط§طھ ط§ظ„ظ…طھط§ط­ط©.";

export default function MarketingPage() {
  const whatsappHref = buildSupportWhatsAppUrl(contactMessage);

  return (
    <MarketingShell
      header={
        <header className="sticky top-0 z-40 border-b border-[#ECE6DA]/90 bg-[#F8F6F0]/95 backdrop-blur-sm">
          <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
            <Link href="/" className="flex items-center no-underline">
              {/* eslint-disable-next-line @next/next/no-img-element -- static brand logo */}
              <img
                src={TAQFEELAH_LOGO_SRC}
                alt={PWA_APP_NAME}
                draggable={false}
                className="h-9 w-auto select-none object-contain sm:h-11"
              />
            </Link>
            <nav className="hidden items-center gap-6 md:flex" style={{ color: marketingColors.muted }}>
              <a href="#features" className={marketingNavLinkClassName()}>
                ط§ظ„ظ…ظٹط²ط§طھ
              </a>
              <a href="#pricing" className={marketingNavLinkClassName()}>
                ط§ظ„ط¨ط§ظ‚ط§طھ
              </a>
              <a href="#contact" className={marketingNavLinkClassName()}>
                طھظˆط§طµظ„
              </a>
            </nav>
            <div className="hidden sm:flex items-center gap-2">
              {PUBLIC_SIGNUP_ENABLED ? (
                <MarketingCta href={SIGNUP_HREF} variant="secondary">
                  ط¥ظ†ط´ط§ط، ط­ط³ط§ط¨
                </MarketingCta>
              ) : null}
              <MarketingCta href={APP_LOGIN_HREF}>ط§ظ„ط¯ط®ظˆظ„ ظ„ظ„طھط·ط¨ظٹظ‚</MarketingCta>
            </div>
          </div>
        </header>
      }
      footer={
        <footer className="border-t border-[#ECE6DA] py-8">
          <div className="mx-auto flex w-full max-w-6xl flex-col items-center justify-between gap-4 px-4 text-center text-xs font-bold sm:flex-row sm:px-6 sm:text-right" style={{ color: marketingColors.muted }}>
            <div className="space-y-1">
              <p>
                آ© {new Date().getFullYear()} {PWA_APP_NAME} â€” ظ…طھط§ط¨ط¹ط© طھط´ط؛ظٹظ„ ظٹظˆظ…ظٹط©
              </p>
              <ReleaseVersionLine className="text-[#A99D87]" lang="ar" showBuild />
            </div>
            <div className="flex flex-wrap items-center justify-center gap-4">
              <Link href={APP_LOGIN_HREF} className="no-underline hover:text-[#112A46]">
                ط§ظ„ط¯ط®ظˆظ„ ظ„ظ„طھط·ط¨ظٹظ‚
              </Link>
              {PUBLIC_SIGNUP_ENABLED ? (
                <Link href={SIGNUP_HREF} className="no-underline hover:text-[#112A46]">
                  ط¥ظ†ط´ط§ط، ط­ط³ط§ط¨
                </Link>
              ) : null}
              <a
                href={whatsappHref}
                target="_blank"
                rel="noopener noreferrer"
                className="no-underline hover:text-[#112A46]"
              >
                ط§ظ„ط¯ط¹ظ…
              </a>
            </div>
          </div>
        </footer>
      }
      mobileCta={
        PUBLIC_SIGNUP_ENABLED
          ? <MarketingCta href={SIGNUP_HREF}>ط§ط¨ط¯ط£ ظ…ط¬ط§ظ†ظ‹ط§</MarketingCta>
          : <MarketingCta href={APP_LOGIN_HREF}>ط§ظ„ط¯ط®ظˆظ„ ظ„ظ„طھط·ط¨ظٹظ‚</MarketingCta>
      }
    >
      <AppFontStyles />

      <section className="mx-auto grid w-full max-w-6xl gap-10 px-4 py-10 sm:px-6 sm:py-14 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45 }}
          className="space-y-6"
        >
          <p
            className="inline-flex rounded-full bg-white px-3 py-1 text-taq-meta font-black ring-1 ring-black/[0.05]"
            style={{ color: marketingColors.gold }}
          >
            طھط´ط؛ظٹظ„ ظٹظˆظ…ظٹ ظ„ظ„ظ…ط­ظ„ط§طھ â€” ظ„ظٹط³ ظ…ط­ط§ط³ط¨ط©
          </p>
          <h1 className="text-3xl font-black leading-[1.15] sm:text-4xl lg:text-[2.65rem]">
            ط§ظ„ط¯ط§ط®ظ„ âˆ’ ط§ظ„ط®ط§ط±ط¬ = ط§ظ„ظ†ط§طھط¬
          </h1>
          <p className={`max-w-xl ${marketingMutedTextClassName()} sm:text-base`} style={{ color: marketingColors.soft }}>
            {PWA_APP_NAME} ظٹط­ظˆظ‘ظ„ ظٹظˆظ…ظƒ ظپظٹ ط§ظ„ظ…ط­ظ„ ط¥ظ„ظ‰ طµظˆط±ط© ظˆط§ط¶ط­ط©: ط¯ط§ط®ظ„طŒ ط®ط§ط±ط¬طŒ طھظ‚ظپظٹظ„ط§طھ
            ظ…ظˆط¸ظپظٹظ†طŒ ظˆطھظ‚ط§ط±ظٹط± â€” ط¨ظ†ظپط³ ط±ظˆط­ ط§ظ„ط¯ظپطھط± ط§ظ„ظ…ط¹طھظ…ط¯ط© ظپظٹ ط§ظ„طھط·ط¨ظٹظ‚.
          </p>
          <div className="flex flex-wrap gap-3">
            <MarketingCta href={PUBLIC_SIGNUP_ENABLED ? SIGNUP_HREF : APP_LOGIN_HREF}>
              {PUBLIC_SIGNUP_ENABLED ? "ط§ط¨ط¯ط£ ظ…ط¬ط§ظ†ظ‹ط§" : "ط¬ط±ظ‘ط¨ ط§ظ„طھط·ط¨ظٹظ‚ ط§ظ„ط¢ظ†"}
            </MarketingCta>
            <MarketingCta href={APP_LOGIN_HREF} variant="secondary">
              ط§ظ„ط¯ط®ظˆظ„ ظ„ظ„طھط·ط¨ظٹظ‚
            </MarketingCta>
            <MarketingCta href="#pricing" variant="secondary">
              ط¹ط±ط¶ ط§ظ„ط¨ط§ظ‚ط§طھ
            </MarketingCta>
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            {[
              { label: "ظˆط§ط¬ظ‡ط© ط¯ظپطھط±", value: "ظ…ط£ظ„ظˆظپط© ظˆط³ط±ظٹط¹ط©" },
              { label: "PWA", value: "طھط«ط¨ظٹطھ ط¹ظ„ظ‰ ط§ظ„ط¬ظˆط§ظ„" },
              { label: "طھط¹ط¯ط¯ ظ…ط­ظ„ط§طھ", value: "ظ…ظ†ط´ط£ط© ظˆط§ط­ط¯ط©" },
            ].map((item) => (
              <div
                key={item.label}
                className="rounded-2xl bg-white px-4 py-3 text-center ring-1 ring-black/[0.045]"
              >
                <p className="text-taq-meta font-black" style={{ color: marketingColors.gold }}>
                  {item.label}
                </p>
                <p className="mt-1 text-sm font-black">{item.value}</p>
              </div>
            ))}
          </div>
        </motion.div>

        <MarketingAppPreview />
      </section>

      <section id="features" className="border-y border-[#ECE6DA] bg-white/70 py-14">
        <div className="mx-auto w-full max-w-6xl px-4 sm:px-6">
          <MarketingFadeIn>
            <MarketingSectionIntro
              eyebrow="Features"
              title="ظ…ظٹط²ط§طھ طھظ†ط§ط³ط¨ ظٹظˆظ…ظƒ ظپظٹ ط§ظ„ظ…ط­ظ„"
              description="ظƒظ„ ظ…ط§ طھط­طھط§ط¬ظ‡ ظ„ظ…طھط§ط¨ط¹ط© ط§ظ„طھط´ط؛ظٹظ„ â€” ط¨ط¯ظˆظ† ظپظˆط§طھظٹط± ط¶ط±ظٹط¨ظٹط© ط£ظˆ ظ…ط®ط²ظˆظ† ظ…ط¹ظ‚ظ‘ط¯."
            />
          </MarketingFadeIn>
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {MARKETING_FEATURES.map((feature, index) => (
              <MarketingFadeIn key={feature.title} delay={index * 0.04}>
                <MarketingCard className="h-full">
                  <div
                    className="mb-3 inline-flex h-9 w-9 items-center justify-center rounded-2xl text-sm font-black text-white"
                    style={{ backgroundColor: marketingColors.ink }}
                  >
                    {index + 1}
                  </div>
                  <h3 className="text-lg font-black">{feature.title}</h3>
                  <p className={`mt-2 ${marketingMutedTextClassName()}`} style={{ color: marketingColors.soft }}>
                    {feature.description}
                  </p>
                </MarketingCard>
              </MarketingFadeIn>
            ))}
          </div>
        </div>
      </section>

      <section id="pricing" className="py-14">
        <div className="mx-auto w-full max-w-6xl px-4 sm:px-6">
          <MarketingFadeIn>
            <MarketingSectionIntro
              eyebrow="Pricing"
              title="ط¨ط§ظ‚ط§طھ ظ…ط±ظ†ط© ظ„ظ„ط¨ط¯ط§ظٹط© ظˆط§ظ„ظ†ظ…ظˆ"
              description="ط§ط¨ط¯ط£ ظ…ط¬ط§ظ†ظ‹ط§ ظپظٹ ظ…ط±ط­ظ„ط© ط§ظ„ط¥ط·ظ„ط§ظ‚طŒ ط«ظ… ط§ط®طھط± ط§ظ„ط¨ط§ظ‚ط© ط§ظ„ظ…ظ†ط§ط³ط¨ط© ط¹ظ†ط¯ ط§ظ„طھظˆط³ط¹."
            />
          </MarketingFadeIn>
          <div className="mt-8 grid gap-4 lg:grid-cols-3">
            {MARKETING_PLANS.map((plan, index) => (
              <MarketingFadeIn key={plan.id} delay={index * 0.05}>
                <MarketingCard featured={plan.featured} className="flex h-full flex-col">
                  {plan.featured ? (
                    <p
                      className="mb-3 inline-flex self-start rounded-full px-3 py-1 text-taq-meta font-black text-white"
                      style={{ backgroundColor: marketingColors.gold }}
                    >
                      ط§ظ„ط£ظƒط«ط± ط·ظ„ط¨ظ‹ط§
                    </p>
                  ) : null}
                  <p className="text-sm font-black" style={{ color: marketingColors.muted }}>
                    {plan.name}
                  </p>
                  <p className="mt-3 text-3xl font-black">{plan.priceLabel}</p>
                  <p className="text-taq-meta font-bold" style={{ color: marketingColors.muted }}>
                    {plan.periodLabel}
                  </p>
                  <p className={`mt-4 ${marketingMutedTextClassName()}`} style={{ color: marketingColors.soft }}>
                    {plan.description}
                  </p>
                  <ul className="mt-5 space-y-2 text-sm font-bold">
                    {plan.highlights.map((item) => (
                      <li key={item} className="flex items-start gap-2">
                        <span style={{ color: marketingColors.gold }}>â€¢</span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                  <div className="mt-6 pt-2">
                    <MarketingCta
                      href={plan.id === "starter" ? (PUBLIC_SIGNUP_ENABLED ? SIGNUP_HREF : APP_LOGIN_HREF) : whatsappHref}
                      variant={plan.id === "starter" ? "primary" : plan.featured ? "secondary" : "primary"}
                      external={plan.id !== "starter"}
                    >
                      {plan.ctaLabel}
                    </MarketingCta>
                  </div>
                </MarketingCard>
              </MarketingFadeIn>
            ))}
          </div>
        </div>
      </section>

      <section className="border-y border-[#ECE6DA] bg-white/70 py-14">
        <div className="mx-auto grid w-full max-w-6xl gap-8 px-4 sm:px-6 lg:grid-cols-[0.95fr_1.05fr] lg:items-start">
          <MarketingFadeIn>
            <MarketingSectionIntro
              eyebrow="Try the app"
              title="ط¬ط±ظ‘ط¨ ط§ظ„طھط·ط¨ظٹظ‚ ظ…ط¨ط§ط´ط±ط©"
              description="ط¨ط¹ط¯ ط¥ظ†ط´ط§ط، ط§ظ„ط­ط³ط§ط¨ ط£ظˆ ط§ظ„ط¯ط®ظˆظ„ طھظ†طھظ‚ظ„ ط¥ظ„ظ‰ ط§ظ„طھط·ط¨ظٹظ‚ ط§ظ„طھط´ط؛ظٹظ„ظٹ â€” ظ†ظپط³ ط§ظ„طھط¬ط±ط¨ط© ط¹ظ„ظ‰ ط§ظ„ط¬ظˆط§ظ„ ظˆط§ظ„ظƒظ…ط¨ظٹظˆطھط±."
            />
            <div className="mt-6 flex flex-wrap gap-3">
              {PUBLIC_SIGNUP_ENABLED ? (
                <MarketingCta href={SIGNUP_HREF}>ط¥ظ†ط´ط§ط، ط­ط³ط§ط¨</MarketingCta>
              ) : null}
              <MarketingCta href={APP_LOGIN_HREF} variant={PUBLIC_SIGNUP_ENABLED ? "secondary" : "primary"}>
                ط§ظ„ط¯ط®ظˆظ„ ط¥ظ„ظ‰ ط§ظ„طھط·ط¨ظٹظ‚
              </MarketingCta>
            </div>
          </MarketingFadeIn>
          <div className="space-y-4">
            {MARKETING_FAQ.map((item, index) => (
              <MarketingFadeIn key={item.question} delay={index * 0.05}>
                <MarketingCard>
                  <h3 className="text-base font-black">{item.question}</h3>
                  <p className={`mt-2 ${marketingMutedTextClassName()}`} style={{ color: marketingColors.soft }}>
                    {item.answer}
                  </p>
                </MarketingCard>
              </MarketingFadeIn>
            ))}
          </div>
        </div>
      </section>

      <section id="contact" className="py-14">
        <div className="mx-auto w-full max-w-6xl px-4 sm:px-6">
          <MarketingFadeIn>
            <MarketingCard className="p-8 text-center sm:p-10">
              <p className="text-taq-meta font-black uppercase tracking-wide" style={{ color: marketingColors.gold }}>
                Contact
              </p>
              <h2 className="mt-2 text-2xl font-black sm:text-3xl">طھظˆط§طµظ„ ظ…ط¹ظ†ط§</h2>
              <p
                className={`mx-auto mt-3 max-w-2xl ${marketingMutedTextClassName()} sm:text-base`}
                style={{ color: marketingColors.soft }}
              >
                ظ„ط¯ظٹظƒ ط³ط¤ط§ظ„ ط¹ظ† ط§ظ„ط¨ط§ظ‚ط§طھ ط£ظˆ طھظپط¹ظٹظ„ ظ…ظ†ط´ط£طھظƒطں ط±ط§ط³ظ„ظ†ط§ ط¹ظ„ظ‰ ظˆط§طھط³ط§ط¨ ظˆط³ظ†ط±ط¯ ظپظٹ ط£ظ‚ط±ط¨ ظˆظ‚طھ.
              </p>
              <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
                <MarketingCta href={whatsappHref} variant="whatsapp" external>
                  ظˆط§طھط³ط§ط¨ â€” طھظˆط§طµظ„ ظ…ط¹ظ†ط§
                </MarketingCta>
                <MarketingCta href={PUBLIC_SIGNUP_ENABLED ? SIGNUP_HREF : APP_LOGIN_HREF} variant="secondary">
                  {PUBLIC_SIGNUP_ENABLED ? "ط¥ظ†ط´ط§ط، ط­ط³ط§ط¨" : "طھط³ط¬ظٹظ„ / ط¯ط®ظˆظ„"}
                </MarketingCta>
              </div>
            </MarketingCard>
          </MarketingFadeIn>
        </div>
      </section>
    </MarketingShell>
  );
}
