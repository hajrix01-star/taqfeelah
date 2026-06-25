"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Logo } from "@/components/taqfeelah-app/taqfeelah-app-chrome";
import { verifyPublicSignupViaApi } from "@/features/signup/client/signup-api-client";

type VerifyEmailPageProps = {
  token: string;
};

export default function VerifyEmailPage({ token }: VerifyEmailPageProps) {
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token.trim()) {
      setError("رابط التأكيد غير صالح.");
      setLoading(false);
      return;
    }

    let cancelled = false;
    void verifyPublicSignupViaApi(token.trim())
      .then((result) => {
        if (cancelled) return;
        const setupUrl = typeof result?.setupUrl === "string" ? result.setupUrl : "";
        if (!setupUrl) {
          setError("تعذر إكمال التأكيد. اطلب رابطًا جديدًا من صفحة التسجيل.");
          setLoading(false);
          return;
        }
        window.location.assign(setupUrl);
      })
      .catch((failure) => {
        if (cancelled) return;
        setError(failure instanceof Error ? failure.message : "تعذر تأكيد البريد الإلكتروني.");
        setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [token]);

  return (
    <div dir="rtl" className="taq-app-root min-h-[100dvh] bg-[#F8F6F0] font-sans text-[#112A46]">
      <div className="taq-page-gutter flex min-h-[100dvh] flex-col pb-8 pt-10">
        <div className="mt-10 flex justify-center"><Logo /></div>
        <div className="mt-10 text-center">
          <h1 className="text-2xl font-black">تأكيد البريد الإلكتروني</h1>
        </div>
        <div className="mt-8 rounded-[28px] bg-white p-5 text-center shadow-sm ring-1 ring-black/[0.045]">
          {loading ? (
            <p className="text-sm font-bold text-[#827762]">جاري تأكيد بريدك وإعداد حسابك…</p>
          ) : null}
          {!loading && error ? (
            <>
              <p className="text-sm font-bold text-[#B44747]">{error}</p>
              <Link href="/signup" className="mt-4 inline-block text-xs font-black text-[#9A823E]">
                العودة للتسجيل
              </Link>
            </>
          ) : null}
        </div>
      </div>
    </div>
  );
}
