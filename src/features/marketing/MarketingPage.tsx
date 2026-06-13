"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { AppFontStyles } from "@/components/prototype-runtime/prototype-runtime-app-font-styles";
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

const APP_ENTRY_HREF = "/app";
const contactMessage = "مرحبًا، أريد معرفة المزيد عن تقفيلة والباقات المتاحة.";

export default function MarketingPage() {
  const whatsappHref = buildSupportWhatsAppUrl(contactMessage);

  return (
    <MarketingShell
      header={
        <header className="sticky top-0 z-40 border-b border-[#ECE6DA]/90 bg-[#F8F6F0]/95 backdrop-blur-sm">
          <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
            <Link href="/" className="flex items-center no-underline">
              <img
                src={TAQFEELAH_LOGO_SRC}
                alt={PWA_APP_NAME}
                draggable={false}
                className="h-9 w-auto select-none object-contain sm:h-11"
              />
            </Link>
            <nav className="hidden items-center gap-6 md:flex" style={{ color: marketingColors.muted }}>
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
          <div className="mx-auto flex w-full max-w-6xl flex-col items-center justify-between gap-4 px-4 text-center text-xs font-bold sm:flex-row sm:px-6 sm:text-right" style={{ color: marketingColors.muted }}>
            <div className="space-y-1">
              <p>
                © {new Date().getFullYear()} {PWA_APP_NAME} — متابعة تشغيل يومية
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
            تشغيل يومي للمحلات — ليس محاسبة
          </p>
          <h1 className="text-3xl font-black leading-[1.15] sm:text-4xl lg:text-[2.65rem]">
            الداخل − الخارج = الناتج
          </h1>
          <p className={`max-w-xl ${marketingMutedTextClassName()} sm:text-base`} style={{ color: marketingColors.soft }}>
            {PWA_APP_NAME} يحوّل يومك في المحل إلى صورة واضحة: داخل، خارج، تقفيلات
            موظفين، وتقارير — بنفس روح الدفتر المعتمدة في التطبيق.
          </p>
          <div className="flex flex-wrap gap-3">
            <MarketingCta href={APP_ENTRY_HREF}>جرّب التطبيق الآن</MarketingCta>
            <MarketingCta href="#pricing" variant="secondary">
              عرض الباقات
            </MarketingCta>
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            {[
              { label: "واجهة دفتر", value: "مألوفة وسريعة" },
              { label: "PWA", value: "تثبيت على الجوال" },
              { label: "تعدد محلات", value: "منشأة واحدة" },
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
              title="ميزات تناسب يومك في المحل"
              description="كل ما تحتاجه لمتابعة التشغيل — بدون فواتير ضريبية أو مخزون معقّد."
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
                      className="mb-3 inline-flex self-start rounded-full px-3 py-1 text-taq-meta font-black text-white"
                      style={{ backgroundColor: marketingColors.gold }}
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
                        <span style={{ color: marketingColors.gold }}>•</span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                  <div className="mt-6 pt-2">
                    <MarketingCta
                      href={plan.id === "starter" ? APP_ENTRY_HREF : whatsappHref}
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
              title="جرّب التطبيق مباشرة"
              description="بعد التسجيل أو الدخول تنتقل إلى التطبيق التشغيلي — نفس التجربة على الجوال والكمبيوتر."
            />
            <div className="mt-6">
              <MarketingCta href={APP_ENTRY_HREF}>الدخول إلى التطبيق</MarketingCta>
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
              <h2 className="mt-2 text-2xl font-black sm:text-3xl">تواصل معنا</h2>
              <p
                className={`mx-auto mt-3 max-w-2xl ${marketingMutedTextClassName()} sm:text-base`}
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
            </MarketingCard>
          </MarketingFadeIn>
        </div>
      </section>
    </MarketingShell>
  );
}
