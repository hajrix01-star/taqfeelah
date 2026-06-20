# خطة الإطلاق — دفعات مجمّعة ثم نشر واحد

> **قرار المالك (2026-06-20):**  
> - تجميع **عدة دفعات إصلاح** في PR/فرع واحد قبل أي merge إلى `main`  
> - **لا نشر لايف** إلا بدفعة واحدة عند «جاهز للايف»  
> - **كل البيانات الحالية تجريبية** — مسموح حذف المنشآت والمشتركين والموظفين الوهميين بالكامل

---

## المبدأ

```text
فرع cursor/prelaunch-*  →  دفعة 1 + 2 + 3 …  →  CI أخضر  →  merge واحد → main → VPS
         ↑                              ↑
    لا push متكرر              لا merge جزئي على main
```

| القاعدة | التفاصيل |
|---------|----------|
| **main = لايف** | أي merge يشغّل `deploy-production.yml` |
| **PR = اختبار** | CI كامل بدون لمس الإنتاج |
| **بيانات تجريبية** | تُمسح قبل أول عميل حقيقي — لا حاجة للاحتفاظ بها |

---

## الدفعات

### الدفعة 1 — ✅ (PR #342)

| البند | الحالة |
|-------|--------|
| password min 8 (client + server) | ✅ |
| `prelaunch-check.mjs` | ✅ |
| E2E + PostgreSQL (`db-integration` CI) | ✅ |
| `phase9` → `exports-attachments` | ✅ |
| توثيق `PRELAUNCH_AUDIT_AND_REMEDIATION.md` | ✅ |

### الدفعة 2 — 🟠 (جارية على نفس الفرع)

| البند | الهدف |
|-------|--------|
| `prelaunch-wipe-all-tenant-data.mjs` | مسح **كل** بيانات العملاء/التجربة بدون seed |
| `LIVE_DEPLOY_BATCH_PLAN.md` | هذه الوثيقة |
| checklist إطلاق موحّد | مسح → migrate → env strict → أول حساب SaaS |

### الدفعة 3 — ✅ (على نفس الفرع)

| البند | الحالة |
|-------|--------|
| UPSTASH إلزامي (`AUTH_RATE_LIMIT_REDIS_REQUIRED` + `--strict`) | ✅ |
| `docs/PRELAUNCH_MANUAL_SMOKE.md` — checklist يدوي | ✅ |
| `prelaunch-live-gate.mjs` — env strict + db-source + manual pointer | ✅ |
| object storage | ⏸ قرار مالك (بعد الإطلاق) |

### الدفعة 4 — ⏸ (ما بعد الإطلاق)

| البند |
|-------|
| ترحيل JS→TS (272 ملف) |
| CSP nonce |

---

## مسح البيانات التجريبية (قبل أول عميل)

> **يحذف:** منشآت، مستخدمين، تقفيلات، entries، اشتراكات، دعوات، signup requests، metrics، platform admin grants في DB  
> **يحتفظ:** `plan_catalog` (خطط النظام من migrations)  
> **لا يُعاد seed demo** بعد المسح

```bash
# 1. نسخ احتياطي (اختياري لكن موصى به)
pg_dump "$DATABASE_URL" > backup-before-live.sql

# 2. مسح جاف — يعرض الخطة فقط
pnpm prelaunch:wipe

# 3. مسح فعلي
PRELAUNCH_WIPE_CONFIRM=wipe-all-tenant-data-for-live pnpm prelaunch:wipe --apply

# 4. migrate (إن لزم)
pnpm db:migrate

# 5. تحقق env
pnpm prelaunch:live-gate --env-file .env.production
# أو: pnpm prelaunch:check:strict --env-file .env.production
CHECK_BASE_URL=https://your-domain pnpm prelaunch:live-gate --env-file .env.production

# 6. أول عميل حقيقي
# /saas-admin/accounts/new
```

---

## Checklist «جاهز للايف» (مرة واحدة)

- [ ] الدفعات 1–3 مدمجة في فرع واحد
- [ ] `pnpm check:refactor` أخضر محليًا
- [ ] CI أخضر (quality + db-integration)
- [ ] `prelaunch:wipe --apply` على VPS (أو DB فارغة)
- [ ] `pnpm prelaunch:live-gate --env-file .env.production` (أو check:strict)
- [ ] `docs/PRELAUNCH_MANUAL_SMOKE.md` — كل البنود ☑
- [ ] **طلب صريح:** «جاهز للايف» / «ادمج» → merge إلى `main`

---

## مراجع

- `docs/PRELAUNCH_AUDIT_AND_REMEDIATION.md`
- `docs/PRODUCTION_STATUS.md`
- `scripts/prelaunch-wipe-all-tenant-data.mjs`
- `scripts/prelaunch-check.mjs`
- `.cursor/rules/merge-deploy-batch-policy.mdc`
