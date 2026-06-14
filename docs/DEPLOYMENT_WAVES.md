# موجات النشر — تقفيلة V2

> خطة مبسّطة لصاحب المنتج: نجمّع المراحل التقنية في موجات أقل، مع إبقاء أعلام التراجع (flags) للطوارئ.

## المبدأ

| نوع العمل | حجم الدفعة | لماذا |
|-----------|------------|--------|
| **تفكيك الكود** (استخراج من Runtime) | كبير — 2–3 وحدات ثم دمج ونشر | لا تغيير بصري؛ الاختبارات + Browser smoke يمسكون الأخطاء |
| **تفعيل على VPS** | موجة واحدة في كل مرة | أقل نشرات، تتبع أوضح، سلوك متماسك |

بعد كل دمج: راقب GitHub Actions حتى ينجح **Lint, test, browser smoke, build** ثم **Deploy to VPS**.

---

## موجات تفعيل الإنتاج (VPS)

الأعلام الفردية تبقى في `.env` للتراجع. كل موجة تُفعَّل **دفعة واحدة** بعد نجاح الاختبارات.

### الموجة 1 — النواة (البيانات الحية)

**الحالة:** منجزة — التقفيلات والسجل التشغيلي من PostgreSQL.

**المراحل التقنية:** 1 + 2 + 3

| العلم | الغرض |
|-------|--------|
| `NEXT_PUBLIC_CLOSEOUTS_API_ENABLED=true` | التقفيلات من PostgreSQL |
| `NEXT_PUBLIC_ENTRIES_API_ENABLED=true` | السجل التشغيلي من PostgreSQL |
| (ضمنياً) runtime settings من API | إعدادات المالك من الخادم |

**ماذا يتغيّر للمستخدم:** الأرقام والعمليات تُحفظ في قاعدة البيانات بدل التخزين المحلي.

**اختبار يدوي سريع:** تسجيل مالك → إضافة مصروف → تقفيلة موظف → void/استعادة عملية.

**تحقق تلقائي بعد النشر:** خطوة `verify` في GitHub Actions تستدعي `GET /api/v1/stores/:storeId/entries` وتتوقع HTTP 200.

---

### الموجة 2 — التحليلات (الرئيسية والتقارير)

**الحالة:** مفعّلة — `DEPLOYMENT_WAVE=2` يُفرض تلقائياً عند كل نشر عبر `scripts/vps_deploy.py`.

**المراحل التقنية:** 4 + 5 + 6

**الاعتماد:** الموجة 1 (نفس أعلام `ENTRIES_API`؛ لا أعلام جديدة).

**ماذا يتغيّر:** بطاقات الرئيسية (يوم/شهر) والتقارير تجمع من SQL بدل مسح كل السجلات في الذاكرة.

**اختبار يدوي:** الرئيسية (يوم + شهر) → تقارير (أيام، قنوات، مصروفات، مرفقات).

**تحقق تلقائي بعد النشر:** بالإضافة لـ entries، يتحقق من `GET .../summary/day` و`GET /api/v1/reports/days`.

---

### الموجة 3 — الأداء (السجل الكبير)

**الحالة:** مفعّلة — `DEPLOYMENT_WAVE=3` يُفرض تلقائياً عند كل نشر عبر `scripts/vps_deploy.py`.

**المراحل التقنية:** 7

| العلم | الغرض |
|-------|--------|
| `NEXT_PUBLIC_REGISTER_ENTRIES_PAGINATION_ENABLED=true` | تحميل السجل على دفعات (cursor) |

**الاعتماد:** الموجة 1–2 (نفس أعلام `ENTRIES_API`).

**ماذا يتغيّر:** سجل العمليات يحمّل على دفعات بدل جلب كل السجلات دفعة واحدة — أسرع مع بيانات كثيرة.

**اختبار يدوي:** افتح **سجل العمليات** → جرّب فترة شهر أو سنة → تأكد أن القائمة تظهر وتستمر بالتحميل عند التمرير.

**تحقق تلقائي بعد النشر:** بالإضافة لتحققات الموجة 1–2، يتحقق من `GET .../entries?paginated=1&limit=25` ووجود `items` في الاستجابة.

---

### الموجة 4 — إعداد المنشأة

**الحالة:** مفعّلة — `DEPLOYMENT_WAVE=4` يُفرض تلقائياً عند كل نشر عبر `scripts/vps_deploy.py`.

**المراحل التقنية:** 8

| العلم | الغرض |
|-------|--------|
| `NEXT_PUBLIC_ORG_CONFIG_API_ENABLED=true` | محلات، فريق، قنوات من API |

**الاعتماد:** الموجة 1–3 (نفس أعلام `ENTRIES_API`؛ العلم صريح هنا رغم أنه قد يُورَث من `ENTRIES_API`).

**ماذا يتغيّر:** إعدادات المالك (محلات، فريق، قنوات البيع) تُحمَّل وتُحفَظ عبر API بدل الاعتماد الضمني فقط.

**اختبار يدوي:** إعدادات المالك → إضافة محل → تعديل قناة → عضو فريق.

**تحقق تلقائي بعد النشر:** بالإضافة لتحققات الموجة 1–3، يتحقق من:
- `GET /api/v1/stores?status=active` (وجود `stores`)
- `GET /api/v1/members?status=active` (وجود `members`)
- `GET /api/v1/stores/:storeId/sales-channels?status=active` (وجود `channels`)

> **ملاحظة:** روابط التحقق التي تحتوي `&` مُقتبَسة في bash (نفس إصلاح الموجة 3).

---

### الموجة 5 — الإضافات

**الحالة:** مفعّلة — `DEPLOYMENT_WAVE=5` يُفرض تلقائياً عند كل نشر عبر `scripts/vps_deploy.py`.

**المراحل التقنية:** 9

| العلم | الغرض |
|-------|--------|
| `NEXT_PUBLIC_PHASE9_API_ENABLED=true` | ملخص مكرر، تصدير دفتر، مرفقات inline |

**الاعتماد:** الموجة 1–4 (نفس أعلام `ENTRIES_API`؛ العلم صريح هنا رغم أنه قد يُورَث من `ENTRIES_API`).

**ماذا يتغيّر:** تصدير الدفتر، المرفقات المضمّنة، واعتماد/إقرار الملخص المكرر تمر عبر Phase 9 API بشكل صريح.

**اختبار يدوي:** مشاركة/تصدير الدفتر → إضافة عملية بمرفق صورة → (إن وُجد) تنبيه ملخص مكرر.

**تحقق تلقائي بعد النشر:** بالإضافة لتحققات الموجة 1–4:
- `GET /api/v1/exports/notebook?...` (وجود `totals`)
- `POST .../duplicate-summary/acknowledge` مع `{}` (HTTP 400 تحقق)
- `POST .../attachments/inline` مع `{}` (HTTP 400 تحقق)

> **ملاحظة:** روابط التحقق التي تحتوي `&` مُقتبَسة في bash (نفس إصلاح الموجة 3).

---

### الموجة 6 — الدخول الحقيقي

**الحالة:** ✅ **مفعّلة** — `deploy-production.yml` يفرض `DEPLOYMENT_WAVE=7` (تشمل موجة 6) مع auth flags.

**المراحل التقنية:** 10

| العلم | عند التفعيل |
|-------|-------------|
| `NEXT_PUBLIC_PROTOTYPE_ACCESS_MODE=false` | شاشة دخول حقيقية |
| `AUTH_DB_CREDENTIALS_ENABLED=true` | كلمات المرور من `auth_identities` |
| `NEXT_PUBLIC_AUTH_API_ENABLED=true` | ربط واجهة الدخول بالـ API |
| `ALLOW_HEADER_AUTH_CONTEXT=false` | إيقاف سياق prototype |

**قبل التفعيل:** `pnpm db:seed:auth` أو `pnpm db:migrate:auth` على VPS.

**تحقق تلقائي (عند wave ≥ 6):** POST دخول مالك 200، كلمة مرور خاطئة 401، PIN موظف 200.

راجع `docs/PHASE_10_AUTH.md`.

---

### الموجة 7 — SaaS Admin

**الحالة:** ✅ **مفعّلة في CI** — `SAAS_ADMIN_API_ENABLED` و`NEXT_PUBLIC_SAAS_ADMIN_ENABLED` و`SAAS_PLATFORM_ADMIN_USER_IDS` من أسرار GitHub.  
راجع `docs/PRODUCTION_STATUS.md` للشفافية الكاملة.

**المراحل التقنية:** 11

| العلم | عند التفعيل |
|-------|-------------|
| `SAAS_PLATFORM_ADMIN_USER_IDS` | UUID مالك المنصة (مطلوب قبل أي وصول) |
| `SAAS_ADMIN_API_ENABLED=true` | تفعيل `/api/v1/saas-admin/*` |
| `NEXT_PUBLIC_SAAS_ADMIN_ENABLED=true` | إظهار لوحة `/saas-admin` |
| `USAGE_TRACKING_ENABLED=true` | (اختياري) تتبع الاستخدام + snapshots |

**تحقق تلقائي (عند wave ≥ 7):** `GET /api/v1/saas-admin/overview` → 503 (مغلق) أو 401 (مفعّل بدون جلسة)، `GET /saas-admin` → 200.

**تفعيل اللايف (بعد النشر):**

```bash
cd /opt/taqfeelah && set -a && . ./.env.production && set +a
# عدّل .env.production:
# SAAS_PLATFORM_ADMIN_USER_IDS=<uuid>
# SAAS_ADMIN_API_ENABLED=true
# NEXT_PUBLIC_SAAS_ADMIN_ENABLED=true
pm2 restart taqfeelah   # أو انتظر نشرًا كاملاً يعيد البناء
pnpm saas:aggregate    # اختياري — لملء engagement snapshots
```

ثم: تسجيل دخول كمالك مسموح → [https://taqfeelah.com/saas-admin](https://taqfeelah.com/saas-admin)

**قبل التفعيل:** `pnpm db:seed:saas` (إن لزم) + تحديد `SAAS_PLATFORM_ADMIN_USER_IDS`.

راجع `docs/PHASE_11_SAAS_ADMIN.md` و`docs/API_CONTRACT.md`.

---

## موجات تفكيك الكود (بدون تغيير واجهة)

| الدفعة | المحتوى | الحالة |
|--------|---------|--------|
| A | إعدادات المالك (فريق، محلات، قنوات، حساب) | منجز |
| B | بناء/حفظ العمليات + bootstrap الإعدادات | منجز |
| C | إلغاء / استعادة / مراجعة / ملخص مكرر | منجز |
| D | طبقة حفظ العمليات (مالك + موظف + API/محلي) | منجز |
| **E** | **منطق السجل والتقارير (عرض فقط، بدون UI)** | **منجز** |
| F | شاشات الموظف (closeouts) — منطق فقط | منجز |

---

## استكشاف مشاكل النشر (SSH من GitHub)

**نموذج النشر الحالي:** CI يبني مرة واحدة → يرفع artifact (يشمل `.next`) → VPS يثبت الاعتماديات ويشغّل migrate فقط (بدون `pnpm build`).

**الوقت المتوقع:** ~6–10 دقائق إجمالاً (validate ~4–6 د + deploy ~2–4 د).

إذا فشل **Preflight VPS connectivity** وظهر `TCP *:22 — blocked or timed out`:

1. **الموقع قد يبقى شغالاً** — هذا يعني أن Nginx والتطبيق يعملان، لكن GitHub لا يستطيع الدخول عبر SSH للنشر.
2. **جرّب أولاً:** من GitHub Actions → **Production Deploy** → **Run workflow** واختر `preflight_wait_minutes` = 10 أو 15 (ينتظر قبل فحص SSH). أو اضغط **Re-run failed jobs** (ينتظر 3 دقائق تلقائياً). النشر الروتيني (push إلى `main`) **لا ينتظر** قبل SSH — فقط إعادة التشغيل اليدوية أو بعد فشل.
3. **سكربتات الإصلاح البطيئة:** افتراضياً **لا تُشغَّل** عند كل نشر (`VPS_RUN_REMOTE_REPAIR_SCRIPTS=false`). لتشغيلها: **Run workflow** مع `run_repair_scripts=true`، أو أضف `[run-repairs]` في رسالة commit.
4. **نشرات متتالية:** workflow يلغي النشر القديم إذا بدأ نشر أحدث (`cancel-in-progress: true`) — لا تتراكم طوابير 30+ دقيقة.
5. **مرة واحدة على VPS** (root): `bash scripts/vps-harden-github-deploy.sh` — يعيد تشغيل SSH، يفتح OpenSSH في UFW، ويرفع `maxretry` في fail2ban لتقليل حظر GitHub Actions.
6. **على VPS (Hostinger hPanel أو SSH يدوي):**
   - تأكد أن خدمة SSH تعمل: `systemctl status ssh`
   - راجع fail2ban: `fail2ban-client status sshd` — إن وُجد حظر، انتظر أو أزل الحظر
   - راجع الجدار الناري: `ufw status` — المنفذ 22 (أو `VPS_PORT`) مفتوح
7. **تحقق من سر GitHub `VPS_PORT`:** إن كان SSH على منفذ غير 22، يجب أن يطابق المنفذ الفعلي.
8. **اختياري:** أضف سر `VPS_SSH_PRIVATE_KEY` (مفتاح deploy) بدل الاعتماد على `VPS_PASS` فقط.
9. **تعليق SSH:** كل أمر بعيد له مهلة (`VPS_SSH_COMMAND_TIMEOUT=2400` ث ≈ 40 د) — يفشل بسرعة بدل التعليق 90 دقيقة.
10. بعد الإصلاح: أعد تشغيل workflow **Production Deploy** (أو انتظر النشر التالي مع push).

### تحقق baseline بعد النشر

خطوة **Verify production** في GitHub Actions تشغّل (على VPS) عند `POST_DEPLOY_BASELINE_VERIFY=true`:

- `node scripts/verify-plan-table-db.mjs` — جداول، `entries.closeout_id NOT NULL`، لا orphans
- `CHECK_BASE_URL=http://127.0.0.1:3010 node scripts/db-source-unification-check.mjs` — مسار تقفيلة كامل عبر API المحلي

تشغيل يدوي على VPS:

```bash
cd /opt/taqfeelah && set -a && . ./.env.production && set +a
node scripts/verify-plan-table-db.mjs
CHECK_BASE_URL="http://127.0.0.1:3010" node scripts/db-source-unification-check.mjs
```

أو من جهازك (بعد ضبط `VPS_*`): `python scripts/vps_deploy.py baseline-verify`

## مرجع الأعلام التفصيلي

`docs/FEATURE_FLAGS_MATRIX.md` — جدول كل متغير بيئة وترتيبه التقني.

## مرجع المراحل التفصيلي

`docs/PROTOTYPE_ACCESS_MODE.md` — وصف كل Phase 0–11.
