# Feature Flags Matrix

> آخر تحديث: 2026-06-26

هذه الوثيقة تسجل متغيرات البيئة المعتمدة حاليًا. `/app` الإنتاجي يعمل عبر المصادقة ومصدر بيانات السيرفر فقط.

## Core Runtime

| Variable | Default | Production | Purpose |
|---|---:|---:|---|
| `APP_MODE` | `local` | `production` | وضع السيرفر |
| `NEXT_PUBLIC_APP_MODE` | `local` | `production` | وضع التطبيق في العميل |
| `NODE_ENV` | `development` | `production` | وضع Node/Next |
| `DATABASE_URL` | غير موجود | مطلوب | اتصال PostgreSQL |
| `AUTH_SESSION_SECRET` | غير موجود | مطلوب | توقيع الجلسات |

## Auth

| Variable | Default | Production | Purpose |
|---|---:|---:|---|
| `NEXT_PUBLIC_AUTH_API_ENABLED` | `false` | `true` | تفعيل واجهات المصادقة |
| `AUTH_DB_CREDENTIALS_ENABLED` | `false` | `true` | قراءة بيانات الدخول من DB |
| `ALLOW_HEADER_AUTH_CONTEXT` | `false` | `false` | يمنع تجاوز الجلسة بالهيدرز |

مصدر الهوية في الإنتاج هو الجلسة الموقعة فقط. أي header auth يبقى للاختبارات أو أدوات داخلية مقيدة، وليس لمسار الإنتاج.

## Data Sources

| Variable | Default | Production | Purpose |
|---|---:|---:|---|
| `NEXT_PUBLIC_CLOSEOUTS_API_ENABLED` | `false` | `true` | التقفيلات من API/DB |
| `NEXT_PUBLIC_ENTRIES_API_ENABLED` | يرث closeouts | `true` | العمليات من API/DB |
| `NEXT_PUBLIC_ORG_CONFIG_API_ENABLED` | يرث entries | `true` | المحلات والقنوات والموظفين من API/DB |
| `NEXT_PUBLIC_PHASE9_API_ENABLED` | يرث entries | `true` | التصدير والمرفقات وduplicate summary |
| `NEXT_PUBLIC_REGISTER_ENTRIES_PAGINATION_ENABLED` | يرث entries | `true` | ترقيم السجل |
| `NEXT_PUBLIC_DISABLE_BROWSER_PERSISTENCE` | `false` | `true` | منع تخزين بيانات أعمال في المتصفح |

## SaaS Admin

| Variable | Default | Purpose |
|---|---:|---|
| `NEXT_PUBLIC_SAAS_ADMIN_ENABLED` | `false` | إظهار واجهة `/saas-admin` |
| `SAAS_ADMIN_API_ENABLED` | `false` | تفعيل APIs إدارة المنصة |
| `USAGE_TRACKING_ENABLED` | `false` | تسجيل أحداث الاستخدام |
| `SAAS_PLATFORM_ADMIN_USER_IDS` | فارغ | قائمة UUID لمسؤولي المنصة |

## Optional Bootstrap / Tests

| Variable | Purpose |
|---|---|
| `AUTH_ORGANIZATION_ID` | إدخال اختياري لبعض سكربتات bootstrap أو الاختبارات |
| `AUTH_OWNER_USER_ID` | إدخال اختياري لبعض سكربتات bootstrap أو الاختبارات |
| `NEXT_PUBLIC_CLOSEOUTS_*_ID_MAP` | تطوير محلي أو اختبارات توافق فقط |

هذه المتغيرات ليست مطلوبة للمنظمات المنشأة عبر SaaS Admin.

## Removed Flags

الأعلام القديمة الخاصة بمسارات الدخول غير الإنتاجية أزيلت من الكود النشط. تفاصيل الإزالة محفوظة في `docs/archive/` وخطة التحول فقط، وليست جزءًا من إعداد البيئة الحالي.

## Code Modules

| Module | Responsibility |
|---|---|
| `core/config/app-mode.ts` | `local` أو `production` |
| `core/config/env.ts` | تحقق بيئة الإنتاج |
| `core/config/auth-api-mode.ts` | تفعيل Auth API |
| `core/config/closeouts-api-mode.ts` | تفعيل API التقفيلات |
| `core/config/entries-api-mode.ts` | تفعيل API العمليات |
| `core/config/browser-persistence-policy.ts` | منع التخزين المحلي في الإنتاج |
