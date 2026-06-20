# خطة الإطلاق — دفعات مجمّعة ثم نشر واحد

> **قرار المالك (2026-06-20):**  
> - تجميع **عدة دفعات إصلاح** في PR/فرع واحد قبل أي merge إلى `main`  
> - **لا نشر لايف** إلا بدفعة واحدة عند «جاهز للايف»  
> - **كل البيانات الحالية تجريبية** — مسموح حذف المنشآت والمشتركين والموظفين الوهميين بالكامل  
> - **Upstash Redis اختياري للإطلاق** — rate limit في الذاكرة كافٍ للبداية  
> - **مسح البيانات التجريبية:** **مؤجّل** — نُبقي البيانات للتجربة حتى أول عميل حقيقي

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

### الدفعة 2 — ✅ (على نفس الفرع)

| البند | الحالة |
|-------|--------|
| `prelaunch-wipe-all-tenant-data.mjs` | ✅ |
| `LIVE_DEPLOY_BATCH_PLAN.md` | ✅ |
| checklist إطلاق موحّد | ✅ |

### الدفعة 3 — ✅ (على نفس الفرع)

| البند | الحالة |
|-------|--------|
| UPSTASH اختياري (`--strict` لا يتطلبه) | ✅ |
| `docs/PRELAUNCH_MANUAL_SMOKE.md` — checklist يدوي | ✅ |
| `prelaunch-live-gate.mjs` — env strict + db-source + manual pointer | ✅ |
| object storage | ⏸ قرار مالك (بعد الإطلاق) |

### الدفعة 4 — ⏸ **لم تُنفَّذ** (ما بعد الإطلاق — لا تمنع لايف)

| البند | الحالة |
|-------|--------|
| ترحيل JS→TS (~272 ملف legacy) | ⏸ لم يبدأ |
| CSP nonce | ⏸ لم يبدأ |

> **لا تستحق تأجيل الإطلاق:** التطبيق يعمل؛ هذه تحسينات صيانة/أمان تدريجية بعد stabilize.

---

## مسح البيانات التجريبية

> **قرار المالك (2026-06):** **لا مسح الآن** — البيانات التجريبية تُبقى للتجربة على اللايف.  
> **متى المسح؟** فقط قبل **أول عميل حقيقي** (ليس قبل merge أو أول deploy).

```bash
# عند الحاجة لاحقًا — dry-run أولًا
pnpm prelaunch:wipe
PRELAUNCH_WIPE_CONFIRM=wipe-all-tenant-data-for-live pnpm prelaunch:wipe:apply
```

Script جاهز (`prelaunch-wipe-all-tenant-data.mjs`) — **لا تُشغّله** ما دامت التجربة مستمرة.

---

## Checklist «جاهز للايف» (مرة واحدة)

- [ ] الدفعات 1–3 مدمجة في فرع واحد
- [ ] `pnpm check:refactor` أخضر محليًا
- [ ] CI أخضر (quality + db-integration)
- [ ] `pnpm prelaunch:live-gate --env-file .env.production` (أو check:strict)
- [ ] `docs/PRELAUNCH_MANUAL_SMOKE.md` — كل البنود ☑
- [ ] ~~`prelaunch:wipe --apply`~~ — **مؤجّل** (نُبقي بيانات التجربة)
- [ ] **طلب صريح:** «جاهز للايف» / «ادمج» → merge إلى `main`

---

## مراجع

- `docs/VPS_ENV_SETUP_FOR_OWNER.md`
- `docs/VPS_LAUNCH_RUNBOOK.md`
- `docs/PRELAUNCH_AUDIT_AND_REMEDIATION.md`
- `docs/PRODUCTION_STATUS.md`
- `scripts/prelaunch-wipe-all-tenant-data.mjs`
- `scripts/prelaunch-check.mjs`
- `.cursor/rules/merge-deploy-batch-policy.mdc`
