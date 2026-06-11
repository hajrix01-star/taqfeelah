# خطة تنفيذ لوحة SaaS Admin — تقفيلة

> **الحالة:** مكتمل — جاهز للمراجعة عبر PR  
> **الفرع:** `cursor/saas-admin-dashboard-3111`  
> **المسار الأساسي:** `/saas-admin`  
> **النطاق:** read-only — لا تأثير على تطبيق المالك/الموظف

---

## الهدف

بناء لوحة تحكم إدارية داخلية منفصلة تمامًا عن تجربة تقفيلة اليومية، لعرض الحسابات والاستخدام والمؤشرات الاستثمارية وصحة النظام.

---

## المراحل

### المرحلة 0 — التخطيط والتشيك لست ✅

- [x] توثيق الخطة في هذا الملف
- [x] إنشاء فرع `cursor/saas-admin-dashboard-3111`
- [x] مراجعة البنية الحالية (`features/saas-admin`, API موجود)

### المرحلة 1 — Foundation (البنية الأساسية) ✅

- [x] `types.ts` — أنواع مشتركة
- [x] CSS tokens للوحة (`--admin-*`) ضمن نطاق `saas-admin`
- [x] مكوّنات Shell: `AdminShell`, `AdminSidebar`, `AdminHeader`
- [x] مكوّنات UI: `KpiCard`, `StatusBadge`, `AdminTable`, `EmptyState`, `ChartCard`
- [x] `layout.tsx` — حماية: feature flag + جلسة + platform admin allowlist
- [x] `page.tsx` — تحويل إلى `/saas-admin/overview`
- [x] `isPlatformAdminUser()` — فحص غير رمائي للـ layout

**نشر بعد المرحلة 1:** لا — بنية داخلية فقط

### المرحلة 2 — Server + API (البيانات) ✅

- [x] `get-saas-overview.ts` — KPIs + نشاط 30 يوم + حسابات نشطة/خاملة
- [x] `get-saas-accounts.ts` — قائمة حسابات مع بحث/فلتر/ترقيم
- [x] `get-saas-account-details.ts` — تفاصيل حساب واحد
- [x] `get-saas-usage.ts` — تقارير الاستخدام الشهرية
- [x] `get-investor-metrics.ts` — مؤشرات المستثمر (MRR/ARR تقديرية)
- [x] `get-system-health.ts` — صحة النظام (المتاح فقط)
- [x] API routes تحت `/api/v1/saas-admin/`
- [x] توسيع `saas-admin-api-client.ts`

**نشر بعد المرحلة 2:** لا — APIs خلف feature flag

### المرحلة 3 — الصفحات ✅

- [x] `/saas-admin/overview`
- [x] `/saas-admin/accounts`
- [x] `/saas-admin/accounts/[id]`
- [x] `/saas-admin/usage`
- [x] `/saas-admin/investor-metrics`
- [x] `/saas-admin/system-health`
- [x] Recharts للرسوم (line + bar)
- [x] RTL عربي كامل — Light theme

**نشر بعد المرحلة 3:** نعم — PR للمراجعة والـ CI (لا دمج `main` إلا بموافقة المالك)

### المرحلة 4 — الجودة والتحقق ✅

- [x] اختبارات تكامل للـ routes الجديدة
- [x] `pnpm lint` — نجح (تحذيرات قديمة فقط خارج النطاق)
- [x] `pnpm typecheck` — نجح
- [x] `pnpm test` — 661 اختبار ناجح
- [x] `pnpm build` — نجح
- [ ] `pnpm check:refactor` — يتضمن Playwright smoke (اختياري على CI)

**نشر بعد المرحلة 4:** PR جاهز — انتظار CI أخضر

---

## قواعد ثابتة

| القاعدة | التطبيق |
|---------|---------|
| Read-only | لا حذف/تعطيل/تعديل خطير |
| بيانات حقيقية | من DB فقط — لا demo |
| MRR/ARR | تسمية «تقديري» إذا لا دفع حقيقي |
| غير متاح | عرض نص واضح بدل أرقام وهمية |
| الحماية | `SAAS_PLATFORM_ADMIN_USER_IDS` + feature flags + `middleware.ts` (API) |
| لا تأثير على العميل | لا تعديل `/app` أو prototype |

---

## تفعيل محلي

```bash
SAAS_PLATFORM_ADMIN_USER_IDS=<uuid>
SAAS_ADMIN_API_ENABLED=true
NEXT_PUBLIC_SAAS_ADMIN_ENABLED=true
```

---

## تشيك لست التنفيذ النهائي

- [x] 6 صفحات تعمل
- [x] Sidebar يمين + Header
- [x] KPI cards + charts + tables
- [x] بحث/فلتر في Accounts
- [x] تفاصيل حساب read-only
- [x] مؤشرات تقديرية موضّحة
- [x] system-health يعرض المتاح فقط
- [x] لا تغيير على تطبيق العميل
- [x] CI أخضر — مدمج في `main`
- [x] `middleware.ts` لحماية `/api/v1/saas-admin/*`
- [x] توثيق التفعيل في `docs/DEPLOYMENT_WAVES.md` و`docs/API_CONTRACT.md`
