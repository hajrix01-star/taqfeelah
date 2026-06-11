import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import { buildSupportWhatsAppUrl } from "@/core/config/marketing-support";
import { PWA_APP_NAME } from "@/core/config/pwa";
import {
  MARKETING_FAQ,
  MARKETING_FEATURES,
  MARKETING_PLANS,
} from "@/features/marketing/marketing-content";

const APP_ENTRY_HREF = "/app";
const contactMessage = "مرحبًا، أريد معرفة المزيد عن تقفيلة والباقات المتاحة.";

function MarketingCta({
  href,
  children,
  variant = "primary",
  external = false,
}: {
  href: string;
  children: ReactNode;
  variant?: "primary" | "secondary";
  external?: boolean;
}) {
  const className =
    variant === "primary"
      ? "inline-flex w-full items-center justify-center rounded-2xl bg-[#112A46] px-5 py-3 text-sm font-black text-white no-underline transition hover:bg-[#0d2138] sm:w-auto"
      : "inline-flex w-full items-center justify-center rounded-2xl border border-[#D9D0C0] bg-white px-5 py-3 text-sm font-black text-[#112A46] no-underline transition hover:bg-[#F0ECE2] sm:w-auto";

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

export default function MarketingPage() {
  const whatsappHref = buildSupportWhatsAppUrl(contactMessage);

  return (
    <div className="min-h-[100dvh] bg-[#F8F6F0] font-sans text-[#112A46]" dir="rtl">
      <header className="sticky top-0 z-40 border-b border-[#ECE6DA]/90 bg-[#F8F6F0]/95 backdrop-blur-sm">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
          <Link href="/" className="flex items-center gap-3 no-underline">
            <Image
              src="/brand/taqfeelah-logo.png"
              alt={PWA_APP_NAME}
              width={132}
              height={44}
              priority
              className="h-9 w-auto object-contain sm:h-11"
            />
          </Link>
          <nav className="hidden items-center gap-6 text-sm font-bold text-[#5C6F84] md:flex">
            <a href="#features" className="no-underline hover:text-[#112A46]">
              الميزات
            </a>
            <a href="#pricing" className="no-underline hover:text-[#112A46]">
              الباقات
            </a>
            <a href="#contact" className="no-underline hover:text-[#112A46]">
              تواصل
            </a>
          </nav>
          <MarketingCta href={APP_ENTRY_HREF}>الدخول للتطبيق</MarketingCta>
        </div>
      </header>

      <main>
        <section className="mx-auto grid w-full max-w-6xl gap-10 px-4 py-12 sm:px-6 sm:py-16 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
          <div className="space-y-6">
            <p className="inline-flex rounded-full bg-[#E8F2EA] px-3 py-1 text-xs font-black text-[#2F6B4C]">
              تشغيل يومي للمحلات — ليس محاسبة
            </p>
            <h1 className="text-3xl font-black leading-tight sm:text-4xl lg:text-5xl">
              الداخل − الخارج = الناتج
            </h1>
            <p className="max-w-xl text-base font-bold leading-7 text-[#5C6F84] sm:text-lg">
              {PWA_APP_NAME} يساعدك على متابعة يومك التشغيلي: مبيعات، خارج، تقفيلات موظفين،
              وتقارير واضحة — من الجوال أو الكمبيوتر.
            </p>
            <div className="flex flex-wrap gap-3">
              <MarketingCta href={APP_ENTRY_HREF}>جرّب التطبيق الآن</MarketingCta>
              <MarketingCta href="#pricing" variant="secondary">
                عرض الباقات
              </MarketingCta>
            </div>
          </div>

          <div className="rounded-[2rem] border border-[#ECE6DA] bg-white p-6 shadow-[0_24px_60px_rgba(17,42,70,0.08)]">
            <p className="text-sm font-black text-[#827762]">لماذا تقفيلة؟</p>
            <ul className="mt-4 space-y-3 text-sm font-bold leading-7 text-[#112A46]">
              <li>واجهة بسيطة شبيهة بالدفتر — بدون تعقيد ERP.</li>
              <li>موظف يقفّل يومه؛ مالك يتابع ويعدّل.</li>
              <li>قابل للتثبيت كتطبيق PWA على الجوال.</li>
            </ul>
            <div className="mt-6 rounded-2xl bg-[#F8F6F0] p-4 text-center">
              <p className="text-xs font-black text-[#827762]">معادلة التشغيل</p>
              <p className="mt-2 text-2xl font-black">داخل − خارج = ناتج</p>
            </div>
          </div>
        </section>

        <section id="features" className="border-y border-[#ECE6DA] bg-white py-14">
          <div className="mx-auto w-full max-w-6xl px-4 sm:px-6">
            <div className="mb-8 max-w-2xl">
              <h2 className="text-2xl font-black sm:text-3xl">ميزات تناسب يومك في المحل</h2>
              <p className="mt-3 text-sm font-bold leading-7 text-[#5C6F84] sm:text-base">
                كل ما تحتاجه لمتابعة التشغيل — بدون فواتير ضريبية أو مخزون معقّد.
              </p>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {MARKETING_FEATURES.map((feature) => (
                <article
                  key={feature.title}
                  className="rounded-3xl border border-[#ECE6DA] bg-[#F8F6F0] p-5"
                >
                  <h3 className="text-lg font-black">{feature.title}</h3>
                  <p className="mt-2 text-sm font-bold leading-7 text-[#5C6F84]">
                    {feature.description}
                  </p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section id="pricing" className="py-14">
          <div className="mx-auto w-full max-w-6xl px-4 sm:px-6">
            <div className="mb-8 max-w-2xl">
              <h2 className="text-2xl font-black sm:text-3xl">باقات مرنة للبداية والنمو</h2>
              <p className="mt-3 text-sm font-bold leading-7 text-[#5C6F84] sm:text-base">
                ابدأ مجانًا في مرحلة الإطلاق، ثم اختر الباقة المناسبة عند التوسع.
              </p>
            </div>
            <div className="grid gap-4 lg:grid-cols-3">
              {MARKETING_PLANS.map((plan) => (
                <article
                  key={plan.id}
                  className={`flex flex-col rounded-3xl border p-6 ${
                    plan.featured
                      ? "border-[#112A46] bg-[#112A46] text-white shadow-[0_20px_50px_rgba(17,42,70,0.18)]"
                      : "border-[#ECE6DA] bg-white"
                  }`}
                >
                  <p className={`text-sm font-black ${plan.featured ? "text-[#D7E4F2]" : "text-[#827762]"}`}>
                    {plan.name}
                  </p>
                  <p className="mt-3 text-3xl font-black">{plan.priceLabel}</p>
                  <p className={`text-xs font-bold ${plan.featured ? "text-[#D7E4F2]" : "text-[#827762]"}`}>
                    {plan.periodLabel}
                  </p>
                  <p className={`mt-4 text-sm font-bold leading-7 ${plan.featured ? "text-white/90" : "text-[#5C6F84]"}`}>
                    {plan.description}
                  </p>
                  <ul className={`mt-5 space-y-2 text-sm font-bold ${plan.featured ? "text-white" : "text-[#112A46]"}`}>
                    {plan.highlights.map((item) => (
                      <li key={item}>• {item}</li>
                    ))}
                  </ul>
                  <div className="mt-6">
                    <MarketingCta
                      href={plan.id === "starter" ? APP_ENTRY_HREF : whatsappHref}
                      variant={plan.featured ? "secondary" : "primary"}
                      external={plan.id !== "starter"}
                    >
                      {plan.ctaLabel}
                    </MarketingCta>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="border-y border-[#ECE6DA] bg-white py-14">
          <div className="mx-auto grid w-full max-w-6xl gap-8 px-4 sm:px-6 lg:grid-cols-2">
            <div>
              <h2 className="text-2xl font-black sm:text-3xl">جرّب التطبيق مباشرة</h2>
              <p className="mt-3 text-sm font-bold leading-7 text-[#5C6F84] sm:text-base">
                بعد التسجيل أو الدخول تنتقل إلى التطبيق التشغيلي كما هو — نفس التجربة على
                الجوال والكمبيوتر.
              </p>
              <div className="mt-6">
                <MarketingCta href={APP_ENTRY_HREF}>الدخول إلى التطبيق</MarketingCta>
              </div>
            </div>
            <div className="space-y-4">
              {MARKETING_FAQ.map((item) => (
                <article key={item.question} className="rounded-3xl border border-[#ECE6DA] bg-[#F8F6F0] p-5">
                  <h3 className="text-base font-black">{item.question}</h3>
                  <p className="mt-2 text-sm font-bold leading-7 text-[#5C6F84]">{item.answer}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section id="contact" className="py-14">
          <div className="mx-auto w-full max-w-6xl px-4 sm:px-6">
            <div className="rounded-[2rem] border border-[#ECE6DA] bg-white p-8 text-center sm:p-10">
              <h2 className="text-2xl font-black sm:text-3xl">تواصل معنا</h2>
              <p className="mx-auto mt-3 max-w-2xl text-sm font-bold leading-7 text-[#5C6F84] sm:text-base">
                لديك سؤال عن الباقات أو تفعيل منشأتك؟ راسلنا على واتساب وسنرد في أقرب وقت.
              </p>
              <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
                <a
                  href={whatsappHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center rounded-2xl bg-[#25D366] px-5 py-3 text-sm font-black text-white no-underline"
                >
                  واتساب — تواصل معنا
                </a>
                <MarketingCta href={APP_ENTRY_HREF} variant="secondary">
                  تسجيل / دخول
                </MarketingCta>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-[#ECE6DA] py-8">
        <div className="mx-auto flex w-full max-w-6xl flex-col items-center justify-between gap-4 px-4 text-center text-xs font-bold text-[#827762] sm:flex-row sm:px-6 sm:text-right">
          <p>© {new Date().getFullYear()} {PWA_APP_NAME} — متابعة تشغيل يومية</p>
          <div className="flex flex-wrap items-center justify-center gap-4">
            <Link href={APP_ENTRY_HREF} className="no-underline hover:text-[#112A46]">
              الدخول للتطبيق
            </Link>
            <a href={whatsappHref} target="_blank" rel="noopener noreferrer" className="no-underline hover:text-[#112A46]">
              الدعم
            </a>
          </div>
        </div>
      </footer>

      <div className="sticky bottom-0 z-40 border-t border-[#ECE6DA] bg-[#F8F6F0]/95 p-3 backdrop-blur-sm md:hidden">
        <MarketingCta href={APP_ENTRY_HREF}>الدخول للتطبيق</MarketingCta>
      </div>
    </div>
  );
}
