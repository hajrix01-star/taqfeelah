import "@/features/saas-admin/components/admin-theme.css";

export function SaasAdminDisabledScreen() {
  return (
    <main
      dir="rtl"
      className="saas-admin-root flex min-h-[100dvh] items-center justify-center px-6"
    >
      <section className="max-w-xl rounded-2xl border border-[var(--admin-border)] bg-[var(--admin-surface)] p-8 text-center shadow-sm">
        <h1 className="text-lg font-bold text-[var(--admin-primary)]">لوحة SaaS غير مفعّلة</h1>
        <p className="mt-3 text-sm leading-7 text-[var(--admin-muted)]">
          فعّل
          {" "}
          <code className="rounded bg-[#F3F4F6] px-2 py-1">NEXT_PUBLIC_SAAS_ADMIN_ENABLED=true</code>
          {" "}
          و
          {" "}
          <code className="rounded bg-[#F3F4F6] px-2 py-1">SAAS_ADMIN_API_ENABLED=true</code>
          {" "}
          ثم عيّن
          {" "}
          <code className="rounded bg-[#F3F4F6] px-2 py-1">SAAS_PLATFORM_ADMIN_USER_IDS</code>
          .
        </p>
      </section>
    </main>
  );
}

export function SaasAdminUnauthorizedScreen() {
  return (
    <main
      dir="rtl"
      className="saas-admin-root flex min-h-[100dvh] items-center justify-center px-6"
    >
      <section className="max-w-xl rounded-2xl border border-[var(--admin-border)] bg-[var(--admin-surface)] p-8 text-center shadow-sm">
        <h1 className="text-lg font-bold text-[var(--admin-primary)]">غير مصرح بالوصول</h1>
        <p className="mt-3 text-sm leading-7 text-[var(--admin-muted)]">
          هذه اللوحة مخصصة لمسؤولي المنصة فقط. سجّل الدخول بحساب مدرج في
          {" "}
          <code className="rounded bg-[#F3F4F6] px-2 py-1">SAAS_PLATFORM_ADMIN_USER_IDS</code>
          .
        </p>
        {/* TODO: ربط Auth Admin مخصص عند توفر نظام أدوار منصة دائم */}
      </section>
    </main>
  );
}

export function SaasAdminUnauthenticatedScreen() {
  return (
    <main
      dir="rtl"
      className="saas-admin-root flex min-h-[100dvh] items-center justify-center px-6"
    >
      <section className="max-w-xl rounded-2xl border border-[var(--admin-border)] bg-[var(--admin-surface)] p-8 text-center shadow-sm">
        <h1 className="text-lg font-bold text-[var(--admin-primary)]">يلزم تسجيل الدخول</h1>
        <p className="mt-3 text-sm leading-7 text-[var(--admin-muted)]">
          سجّل الدخول أولًا للوصول إلى لوحة SaaS Admin.
        </p>
      </section>
    </main>
  );
}
