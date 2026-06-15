"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { buildSupportWhatsAppUrl } from "@/core/config/marketing-support";
import { PWA_APP_NAME } from "@/core/config/pwa";
import { ReleaseVersionLine } from "@/release/ReleaseVersionLine";
import MarketingAppPreview from "@/features/marketing/MarketingAppPreview";
import {
  MARKETING_APP_SECTIONS,
  MARKETING_AUDIENCE,
  MARKETING_FAQ,
  MARKETING_FEATURES,
  MARKETING_NOT_ITEMS,
  MARKETING_PLANS,
  MARKETING_PROBLEMS,
  MARKETING_QUOTES,
} from "@/features/marketing/marketing-content";
import {
  MARKETING_EQUATION,
  MARKETING_EXPENSE,
  MARKETING_GOLD,
  MARKETING_INCOME,
  MARKETING_TAGLINE,
} from "@/features/marketing/marketing-brand";
import {
  MarketingBrandWordmark,
  MarketingCard,
  MarketingCta,
  MarketingEquation,
  MarketingFadeIn,
  MarketingNotebookSurface,
  MarketingSectionIntro,
  MarketingShell,
  MarketingTagline,
  marketingColors,
  marketingMutedTextClassName,
  marketingNavLinkClassName,
} from "@/features/marketing/marketing-ui";

const APP_ENTRY_HREF = "/app";
const contactMessage = "مرحبًا، أريد معرفة المزيد عن تقفيلة والباقات المتاحة.";

export default function MarketingPage() {
  const whatsappHref = buildSupportWhatsAppUrl(contactMessage);

  return (
    <MarketingShell
      header={
        <header className="sticky top-0 z-40 border-b border-[#ECE6DA]/90 bg-[#F8F6F0]/95 backdrop-blur-sm">
          <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
            <Link href="/" className="no-underline">
              <MarketingBrandWordmark size="compact" />
            </Link>
            <nav className="hidden items-center gap-6 md:flex" style={{ color: marketingColors.muted }}>
              <a href="#idea" className={marketingNavLinkClassName()}>
                الفكرة
              </a>
              <a href="#features" className={marketingNavLinkClassName()}>
                الميزات
              </a>
              <a href="#pricing" className={marketingNavLinkClassName()}>
                الباقات
              </a>
              <a href="#contact" className={marketingNavLinkClassName()}>
                تواصل
              </a>
            </nav>
            <div className="hidden sm:block">
              <MarketingCta href={APP_ENTRY_HREF}>الدخول للتطبيق</MarketingCta>
            </div>
          </div>
        </header>
      }
      footer={
        <footer className="border-t border-[#ECE6DA] py-8">
          <div
            className="mx-auto flex w-full max-w-6xl flex-col items-center justify-between gap-4 px-4 text-center text-xs font-bold sm:flex-row sm:px-6 sm:text-right"
            style={{ color: marketingColors.muted }}
          >
            <div className="space-y-2">
              <MarketingBrandWordmark size="compact" className="items-center sm:items-start" />
              <p className="mt-2">
                © {new Date().getFullYear()} {PWA_APP_NAME} — {MARKETING_TAGLINE}
              </p>
              <ReleaseVersionLine className="text-[#A99D87]" lang="ar" showBuild />
            </div>
            <div className="flex flex-wrap items-center justify-center gap-4">
              <Link href={APP_ENTRY_HREF} className="no-underline hover:text-[#112A46]">
                الدخول للتطبيق
              </Link>
              <a
                href={whatsappHref}
                target="_blank"
                rel="noopener noreferrer"
                className="no-underline hover:text-[#112A46]"
              >
                الدعم
              </a>
            </div>
          </div>
        </footer>
      }
      mobileCta={<MarketingCta href={APP_ENTRY_HREF}>الدخول للتطبيق</MarketingCta>}
    >
      {/* Hero */}
      <section className="mx-auto grid w-full max-w-6xl gap-10 px-4 py-10 sm:px-6 sm:py-16 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45 }}
          className="space-y-6"
        >
          <MarketingBrandWordmark size="hero" />
          <MarketingTagline />
          <MarketingEquation as="h1" size="large" />
          <p className={`max-w-xl ${marketingMutedTextClassName()} sm:text-base`} style={{ color: marketingColors.soft }}>
            مو لازم تكون محاسب. اعرف بس: داخل، خارج، والباقي.
            <br />
            دفتر تشغيل يومي ذكي لأصحاب المطاعم والكافيهات والمحلات.
          </p>
          <div className="flex flex-wrap gap-3">
            <MarketingCta href={APP_ENTRY_HREF} variant="gold">
              جرّب التطبيق الآن
            </MarketingCta>
            <MarketingCta href="#pricing" variant="secondary">
              عرض الباقات
            </MarketingCta>
          </div>
          <div className="flex flex-wrap gap-2">
            {MARKETING_NOT_ITEMS.map((item) => (
              <span
                key={item}
                className="inline-flex rounded-full bg-white px-3 py-1 text-taq-meta font-black ring-1 ring-black/[0.05]"
                style={{ color: marketingColors.muted }}
              >
                {item}
              </span>
            ))}
          </div>
        </motion.div>

        <MarketingAppPreview />
      </section>

      {/* Core idea — notebook visual */}
      <section id="idea" className="border-y border-[#ECE6DA] bg-white/50 py-14">
        <div className="mx-auto w-full max-w-6xl px-4 sm:px-6">
          <div className="grid gap-8 lg:grid-cols-[1fr_1.1fr] lg:items-center">
            <MarketingFadeIn>
              <MarketingSectionIntro
                eyebrow="The idea"
                title="بدل دائن ومدين وتعقيد محاسبي"
                description="الفكرة الأساسية بسيطة: داخل، خارج، والباقي. صاحب المحل لا يحتاج يدخل في مصطلحات محاسبية حتى يفهم يومه."
              />
              <div className="mt-6 space-y-3">
                {MARKETING_QUOTES.map((quote) => (
                  <p
                    key={quote}
                    className="rounded-2xl bg-[#F8F6F0] px-4 py-3 text-sm font-bold leading-7 ring-1 ring-black/[0.04]"
                    style={{ color: marketingColors.ink }}
                  >
                    {quote}
                  </p>
                ))}
              </div>
            </MarketingFadeIn>

            <MarketingFadeIn delay={0.06}>
              <MarketingCard notebook className="shadow-md">
                <MarketingNotebookSurface minHeight="280px">
                  <p className="text-taq-meta font-black" style={{ color: MARKETING_GOLD }}>
                    دفتر اليوم
                  </p>
                  <div className="mt-6 space-y-5">
                    <NotebookRow label="داخل" value="١٢٬١٩٠" color={MARKETING_INCOME} />
                    <NotebookRow label="خارج" value="٣٬٤٥٠" color={MARKETING_EXPENSE} prefix="−" />
                    <div className="border-t-2 border-[#112A46]/20 pt-4">
                      <NotebookRow label="الباقي" value="٨٬٧٤٠" color={marketingColors.ink} large />
                    </div>
                  </div>
                  <p className="mt-8 text-center text-sm font-black" style={{ color: MARKETING_GOLD }}>
                    {MARKETING_TAGLINE}
                  </p>
                </MarketingNotebookSurface>
              </MarketingCard>
            </MarketingFadeIn>
          </div>
        </div>
      </section>

      {/* Problems */}
      <section className="py-14">
        <div className="mx-auto w-full max-w-6xl px-4 sm:px-6">
          <MarketingFadeIn>
            <MarketingSectionIntro
              eyebrow="The problem"
              title="صاحب المحل يعرف إن فيه مبيعات — لكن مو دائمًا يعرف يومه"
              description="تقفيلة يحل الأسئلة اليومية بدون تعقيد: كم دخل؟ كم خرج؟ كم باقي؟"
              align="center"
            />
          </MarketingFadeIn>
          <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {MARKETING_PROBLEMS.map((item, index) => (
              <MarketingFadeIn key={item.question} delay={index * 0.04}>
                <MarketingCard className="h-full text-center">
                  <p className="text-base font-black">{item.question}</p>
                  <p className="mt-2 text-taq-meta font-bold" style={{ color: MARKETING_GOLD }}>
                    {item.hint}
                  </p>
                </MarketingCard>
              </MarketingFadeIn>
            ))}
          </div>
          <MarketingFadeIn className="mt-8 text-center">
            <p className="text-lg font-black" style={{ color: marketingColors.ink }}>
              افتح التطبيق، سجل الداخل والخارج، واعرف الباقي.
            </p>
          </MarketingFadeIn>
        </div>
      </section>

      {/* Audience */}
      <section className="border-y border-[#ECE6DA] bg-[#112A46] py-12 text-white">
        <div className="mx-auto w-full max-w-6xl px-4 text-center sm:px-6">
          <p
            className="text-taq-meta font-black uppercase tracking-wide"
            style={{ color: MARKETING_GOLD, fontFamily: "var(--font-marketing-poppins), sans-serif" }}
          >
            Who it&apos;s for
          </p>
          <h2 className="mt-2 text-2xl font-black sm:text-3xl">لصاحب المحل — مو للمحاسب</h2>
          <p className="mx-auto mt-3 max-w-2xl text-sm font-bold leading-7 text-white/75 sm:text-base">
            العميل المستهدف ليس محاسبًا. هو صاحب مشروع يريد يعرف يومه بسرعة.
          </p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
            {MARKETING_AUDIENCE.map((item) => (
              <span
                key={item}
                className="rounded-full bg-white/10 px-4 py-2 text-sm font-black ring-1 ring-white/15"
              >
                {item}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-14">
        <div className="mx-auto w-full max-w-6xl px-4 sm:px-6">
          <MarketingFadeIn>
            <MarketingSectionIntro
              eyebrow="Features"
              title="دفتر يومي ذكي — بدون ازدحام"
              description="كل ميزة تخدم المعادلة الذهبية: داخل − خارج = الباقي."
            />
          </MarketingFadeIn>
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {MARKETING_FEATURES.map((feature, index) => (
              <MarketingFadeIn key={feature.title} delay={index * 0.04}>
                <MarketingCard className="h-full">
                  <span
                    className="mb-3 inline-flex rounded-full px-3 py-1 text-taq-meta font-black"
                    style={{ backgroundColor: `${MARKETING_GOLD}22`, color: MARKETING_GOLD }}
                  >
                    {feature.keyword}
                  </span>
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

      {/* App sections */}
      <section className="border-y border-[#ECE6DA] bg-white/60 py-14">
        <div className="mx-auto w-full max-w-6xl px-4 sm:px-6">
          <MarketingFadeIn>
            <MarketingSectionIntro
              eyebrow="The app"
              title="أقسام بسيطة — زر إضافة في الوسط"
              description="الرئيسية، التقارير، السجل، والإعدادات. كل شيء واضح ومباشر."
            />
          </MarketingFadeIn>
          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            {MARKETING_APP_SECTIONS.map((section, index) => (
              <MarketingFadeIn key={section.title} delay={index * 0.04}>
                <MarketingCard notebook>
                  <MarketingNotebookSurface minHeight="120px">
                    <h3 className="text-lg font-black">{section.title}</h3>
                    <p className="mt-2 text-sm font-bold leading-7" style={{ color: marketingColors.soft }}>
                      {section.description}
                    </p>
                  </MarketingNotebookSurface>
                </MarketingCard>
              </MarketingFadeIn>
            ))}
          </div>
          <MarketingFadeIn className="mt-8 flex justify-center">
            <MarketingCta href={APP_ENTRY_HREF}>جرّب التطبيق مباشرة</MarketingCta>
          </MarketingFadeIn>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-14">
        <div className="mx-auto w-full max-w-6xl px-4 sm:px-6">
          <MarketingFadeIn>
            <MarketingSectionIntro
              eyebrow="Pricing"
              title="باقات مرنة للبداية والنمو"
              description="ابدأ مجانًا في مرحلة الإطلاق، ثم اختر الباقة المناسبة عند التوسع."
            />
          </MarketingFadeIn>
          <div className="mt-8 grid gap-4 lg:grid-cols-3">
            {MARKETING_PLANS.map((plan, index) => (
              <MarketingFadeIn key={plan.id} delay={index * 0.05}>
                <MarketingCard featured={plan.featured} className="flex h-full flex-col">
                  {plan.featured ? (
                    <p
                      className="mb-3 inline-flex self-start rounded-full px-3 py-1 text-taq-meta font-black text-[#112A46]"
                      style={{ backgroundColor: MARKETING_GOLD }}
                    >
                      الأكثر طلبًا
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
                        <span style={{ color: MARKETING_GOLD }}>•</span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                  <div className="mt-6 pt-2">
                    <MarketingCta
                      href={plan.id === "starter" ? APP_ENTRY_HREF : whatsappHref}
                      variant={plan.id === "starter" ? "gold" : plan.featured ? "secondary" : "primary"}
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

      {/* FAQ */}
      <section className="border-y border-[#ECE6DA] bg-white/70 py-14">
        <div className="mx-auto grid w-full max-w-6xl gap-8 px-4 sm:px-6 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
          <MarketingFadeIn>
            <MarketingSectionIntro
              eyebrow="FAQ"
              title="أسئلة شائعة"
              description="تقفيلة ليست نظامًا كبيرًا. تقفيلة دفتر تشغيل يومي ذكي."
            />
            <div className="mt-6 rounded-2xl bg-[#F8F6F0] p-5 ring-1 ring-black/[0.04]">
              <p className="text-sm font-black" style={{ color: marketingColors.muted }}>
                المعادلة الذهبية
              </p>
              <p className="mt-2 text-xl font-black">{MARKETING_EQUATION}</p>
              <p className="mt-3 text-sm font-bold" style={{ color: MARKETING_GOLD }}>
                {MARKETING_TAGLINE}
              </p>
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

      {/* Contact CTA */}
      <section id="contact" className="py-14">
        <div className="mx-auto w-full max-w-6xl px-4 sm:px-6">
          <MarketingFadeIn>
            <MarketingCard notebook className="overflow-hidden shadow-md">
              <MarketingNotebookSurface minHeight="200px">
                <div className="text-center">
                  <MarketingBrandWordmark className="items-center" />
                  <MarketingTagline className="mt-4" />
                  <MarketingEquation className="mt-3 justify-center" />
                  <p
                    className={`mx-auto mt-4 max-w-2xl ${marketingMutedTextClassName()} sm:text-base`}
                    style={{ color: marketingColors.soft }}
                  >
                    لديك سؤال عن الباقات أو تفعيل منشأتك؟ راسلنا على واتساب وسنرد في أقرب وقت.
                  </p>
                  <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
                    <MarketingCta href={whatsappHref} variant="whatsapp" external>
                      واتساب — تواصل معنا
                    </MarketingCta>
                    <MarketingCta href={APP_ENTRY_HREF} variant="secondary">
                      تسجيل / دخول
                    </MarketingCta>
                  </div>
                </div>
              </MarketingNotebookSurface>
            </MarketingCard>
          </MarketingFadeIn>
        </div>
      </section>
    </MarketingShell>
  );
}

function NotebookRow({
  label,
  value,
  color,
  prefix = "",
  large = false,
}: {
  label: string;
  value: string;
  color: string;
  prefix?: string;
  large?: boolean;
}) {
  return (
    <div className="flex items-end justify-between gap-4">
      <span className={`font-black ${large ? "text-lg" : "text-sm"}`} style={{ color: marketingColors.muted }}>
        {label}
      </span>
      <span
        className={`font-black tabular-nums ${large ? "text-2xl" : "text-lg"}`}
        style={{ color }}
        dir="ltr"
      >
        {prefix}
        {value} ر.س
      </span>
    </div>
  );
}
