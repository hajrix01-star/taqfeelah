export default function OfflinePage() {
  return (
    <main
      className="flex min-h-[100dvh] flex-col items-center justify-center gap-4 bg-[#F8F6F0] px-6 text-center font-sans text-[#112A46]"
      dir="rtl"
      style={{
        paddingTop: "env(safe-area-inset-top)",
        paddingBottom: "env(safe-area-inset-bottom)",
      }}
    >
      <h1 className="text-xl font-black">لا يوجد اتصال بالإنترنت</h1>
      <p className="max-w-sm text-sm font-bold text-[#827762]">
        تقفيلة تحتاج اتصالًا لعرض بياناتك ومزامنة العمليات. تحقق من الشبكة ثم أعد المحاولة.
      </p>
      <a
        href="/app"
        className="rounded-2xl bg-[#112A46] px-5 py-3 text-sm font-black text-white no-underline"
      >
        إعادة المحاولة
      </a>
    </main>
  );
}
