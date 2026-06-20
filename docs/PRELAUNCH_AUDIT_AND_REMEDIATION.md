# فحص ما قبل الإطلاق — خطة الإصلاح والتحقق

> **التاريخ:** 2026-06-20  
> **الفرع:** `cursor/prelaunch-remediation-3ebd`  
> **الحالة:** دفعات 1–3 ✅ — **لا merge إلى main حتى «جاهز للايف»**  
> **استراتيجية:** راجع `docs/LIVE_DEPLOY_BATCH_PLAN.md`

---

## 1. ملخص الفحص الأولي

| المحور | الدرجة | أبرز الملاحظات |
|--------|--------|----------------|
| هيكل ومعمارية | 8.5/10 | طبقات واضحة `app → features → domain → core` |
| API/DB | 8.5/10 | Zod + session auth + transactions + audit |
| أمان | 7.5/10 | client password 6 vs server 8، Redis اختياري |
| توحيد | 8/10 | `domain/cash-movement` مركزي |
| نظافة كود | 6.5/10 | 272 JS legacy، تسمية `phase9` |
| اختبارات | 7.5/10 | 1057 unit — لا E2E + PostgreSQL |
| توثيق | 9/10 | docs/ شامل |

**بوابات الجودة قبل الإصلاح:** lint (14 warn) · typecheck ✅ · test 1057 ✅ · build ✅

---

## 2. خطة الإصلاح (مرتبة بالأولوية)

| ID | البند | الأولوية | الحالة |
|----|-------|----------|--------|
| R1 | محاذاة client password min = 8 مع `password-policy.ts` | 🔴 | ✅ |
| R2 | `scripts/prelaunch-check.mjs` — checklist تشغيلي | 🔴 | ✅ |
| R3 | E2E + PostgreSQL | 🔴 | ✅ |
| R4 | db-source في CI | 🔴 | ✅ |
| R5–R9 | lint, rename, seed, tests | 🟠 | ✅ |
| R11–R15 | wipe, batch plan, UPSTASH strict, manual smoke | 🔴 | ✅ |

---

## 3. Checklist التحقق بعد الإصلاح

### 3.1 بوابات آلية (يجب أن تمرّ)

```bash
corepack pnpm lint          # 0 errors
corepack pnpm typecheck     # pass
corepack pnpm test          # all pass
corepack pnpm smoke:browser # shell smoke
corepack pnpm smoke:browser:db  # E2E + PostgreSQL (CI)
corepack pnpm build         # pass
node scripts/prelaunch-check.mjs --env-file .env.example
pnpm prelaunch:wipe                                    # dry-run counts
PRELAUNCH_WIPE_CONFIRM=wipe-all-tenant-data-for-live pnpm prelaunch:wipe:apply
```

### 3.2 تحقق يدوي قبل أول عميل

- [ ] VPS: `drizzle-kit migrate` فقط — **بدون** seed demo
- [ ] `AUTH_SESSION_SECRET` ≥ 16 حرفًا (GitHub secret)
- [ ] Upstash — **اختياري** للإطلاق (ذاكرة السيرفر كافية للبداية)
- [ ] `NEXT_PUBLIC_DISABLE_BROWSER_PERSISTENCE=true`
- [ ] أول حساب من `/saas-admin/accounts/new`
- [ ] مسار: مالك → موظف → تقفيلة → تقرير

### 3.3 إعادة فحص كل بند

| البند | طريقة التحقق | معيار النجاح |
|-------|--------------|--------------|
| R1 Password | grep client + server | `MIN_PASSWORD_LENGTH=8` everywhere |
| R3 E2E DB | CI job `db-integration` | login owner → /app shell |
| R5 Lint | `pnpm lint` | 0 problems |
| R6 Rename | grep `features/phase9` | 0 imports (re-exports only if any) |

---

## 4. جداول قبل / بعد

### R1 — كلمة المرور

| | قبل | بعد | السبب |
|---|-----|-----|-------|
| Server | min 8 (`passwordSchema`) | min 8 | — |
| Client forms | min 6 | min 8 + رسائل عربية/إنجليزية | توحيد العقد |
| Seed dev | `"123"` | `"hajri123"` | CI/E2E compatible |

### R3 — E2E PostgreSQL

| | قبل | بعد | السبب |
|---|-----|-----|-------|
| CI | Playwright shell فقط | job `db-integration` + postgres service | ضمان login حقيقي |
| Config | APIs disabled | `playwright.db.config.ts` full production flags | مسار إنتاج |

### R6 — تسمية phase9

| | قبل | بعد | السبب |
|---|-----|-----|-------|
| Module path | `features/phase9/` | `features/exports-attachments/` | وضوح |
| Env flag | `NEXT_PUBLIC_PHASE9_API_ENABLED` | **unchanged** (backward compat) | لا كسر deploy |

---

## 5. نتائج إعادة الفحص (2026-06-20)

| الفحص | النتيجة |
|-------|---------|
| `pnpm lint` | ✅ 0 errors (7 warnings pre-existing) |
| `pnpm typecheck` | ✅ pass |
| `pnpm test` | ✅ 299 files / 1060 tests |
| `pnpm smoke:browser` | ✅ 3 passed |
| `pnpm build` | ✅ pass |
| `pnpm prelaunch:check --env-file .env.example` | ✅ pass (4 warnings) |
| `pnpm smoke:browser:db` | ⏳ CI job `db-integration` (يتطلب PostgreSQL) |

---

## 6. مراجع

- `docs/PRELAUNCH_MANUAL_SMOKE.md` — checklist يدوي قبل الإعلان
- `docs/PRODUCTION_STATUS.md`

- `docs/PRODUCTION_STATUS.md`
- `docs/PRELAUNCH_CLEANUP.md`
- `docs/DATA_SOURCE_UNIFICATION.md`
- `scripts/prelaunch-check.mjs`
