# Performance Rules

> آخر تحديث: 2026-06-26

هذه القواعد تطبق على backend الإنتاجي وتكامل `/app`.

## المبادئ

| القاعدة | السبب |
|---|---|
| لا تحمل سنوات من العمليات إلى المتصفح | التجميع في المتصفح لا يتوسع |
| كل list API يجب أن يكون paginated | السجل والتدقيق قد يكبران بسرعة |
| التقارير تطلب فترة محددة | day/month/custom range فقط |
| الحسابات المرجعية في `domain/cash-movement` | توحيد الحساب والاختبار |
| المال يخزن بالهللات | منع float drift وتسريع الجمع |

## ملخص اليوم والشهر

- الاستعلام يكون على `entries` مع `organization_id`, `store_id`, `date`, `status`.
- التجميع يتم في SQL.
- لا تستخدم full-history load لحساب كرت أو تقرير.
- الهدف الأولي: p95 أقل من 500ms بعد وجود فهارس مناسبة وبيانات قياس.

## السجل

- استخدم keyset pagination على:

```text
date DESC, created_at DESC, id DESC
```

- default `limit=50`.
- max `limit=100`.
- لا ترجع bytes مرفقات داخل القائمة.

## التقارير

- تقارير القنوات تقرأ `entry_sales_channels` مع join على `entries`.
- تقارير الخارج تجمع داخل SQL حسب النطاق.
- لا تضف rollup table إلا بعد قياس حقيقي يثبت الحاجة.

## الفهارس المطلوبة

راجع `DATABASE_SCHEMA.md`. الحد الأدنى للاستعلامات الثقيلة:

- `(organization_id, store_id, date, status)`
- `(organization_id, store_id, date DESC, created_at DESC)`
- `(organization_id, store_id, type, date, status)`

كل استعلام إنتاجي يجب أن يتضمن `organization_id`.

## قواعد الواجهة

- الرئيسية تجلب ملخص يوم/شهر فقط.
- السجل يستخدم cursor أو pages.
- تفاصيل المرفق تجلب عند الطلب.
- لا يوجد global state يحمل كل عمليات المنظمة.

## مرفوض في المراجعة

- `SELECT * FROM entries` بدون نطاق تاريخ لقوائم UI.
- تجميع 10k+ صف داخل React.
- تخزين صور داخل note أو JSON.
- N+1 query لسطر كل قناة.
- الاعتماد على totals مرسلة من العميل بدون تحقق server-side.

## اختبار الضغط

قبل اعتماد توسع كبير:

- seed لبيانات كبيرة واقعية.
- قياس day/month/register/reports.
- حفظ نتائج p95 و`EXPLAIN ANALYZE`.
- القرار بإضافة rollup أو Redis أو object storage يكون مبنيًا على القياس.
