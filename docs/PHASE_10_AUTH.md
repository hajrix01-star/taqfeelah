# Phase 10 — Auth Foundations

> آخر تحديث: 2026-06-26

المصادقة الحقيقية هي مسار الدخول الوحيد إلى `/app` في الإنتاج.

## Production Flags

| Flag | Production | Purpose |
|---|---:|---|
| `NEXT_PUBLIC_AUTH_API_ENABLED` | `true` | تفعيل واجهات auth |
| `AUTH_DB_CREDENTIALS_ENABLED` | `true` | قراءة بيانات الدخول من `auth_identities` |
| `ALLOW_HEADER_AUTH_CONTEXT` | `false` | منع تجاوز الجلسة بالهيدرز |
| `AUTH_SESSION_SECRET` | مطلوب | توقيع الجلسات |

## Production Entry Path

1. الحساب ينشأ من SaaS Admin أو مسار signup المعتمد.
2. المالك يفعّل الحساب أو يضبط كلمة المرور.
3. المستخدم يدخل من `/app`.
4. السيرفر ينشئ session cookie.
5. كل API يشتق `organizationId` و`userId` من الجلسة والعضوية.

## Implemented Foundations

- `auth_identities` لتخزين credentials بشكل hash.
- `POST /api/v1/auth/session`.
- `POST /api/v1/auth/change-password`.
- password reset routes.
- member credentials عبر org-config APIs.
- employee PIN login.
- session helpers للواجهة.

## Deferred

- OTP provider الحقيقي.
- إرسال invite/setup تلقائي بالبريد أو SMS.
- مزود بريد production عند تفعيل كل تدفقات الإرسال.

## Removed

لا يوجد role picker أو access mode تجريبي في `/app` الإنتاجي. أي توثيق قديم عن ذلك موجود في `docs/archive/` كسجل تاريخي فقط.
