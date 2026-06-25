# خطة التحول 01 — Transformation Plan 01

## الهدف التنفيذي

تحويل تطبيق تقفيلة إلى بنية إنتاجية واضحة:

**Production = Server/API/Database only**

الواجهة تدخل وتعرض فقط، والخادم هو مصدر الحقيقة للأرقام المالية والتشغيلية.

## سبب الخطة

من الفحص الفعلي للكود، التطبيق الحقيقي ما زال يمر عبر أسماء ومسارات تاريخية مثل `prototype-runtime` و `features/demo/AppRuntimePage`. كذلك قسم السجلات يحتوي أكثر من مسار بيانات للأرقام: عمليات من API، تقارير من API، وحسابات client محلية في بعض الحالات.

هذا قد يسبب:

- تغير أرقام السجل لحظيًا.
- اختلاف السجل عن الرئيسية أو التقرير.
- ارتباك المبرمجين بسبب أسماء demo/prototype.
- خطر مالي إذا ظهر fallback أو رقم قديم في الإنتاج.

## Checklist التنفيذ

## شرط بوابة المراحل

- لا ننتقل من أي مرحلة إلى المرحلة التي بعدها إلا بعد إغلاق المرحلة الحالية 100%.
- إغلاق أي مرحلة يعني: تنفيذ كل بنودها، وتحديث الوثيقة، وإضافة اختبار أو حراسة تمنع رجوع السلوك المرفوض، وتشغيل التحقق المناسب.
- أي عمل تم سابقًا في مرحلة لاحقة يبقى محفوظًا، لكن التنفيذ الجديد يعود إلى أول مرحلة غير مكتملة ولا يتجاوزها حتى تُغلق بالكامل.
- إذا ظهر أن بندًا يحتاج عقد API أو migration منفصل، لا يُعتبر مكتملًا بمجرد الالتفاف حوله؛ إما يُنفذ العقد المطلوب أو يُنقل صراحة إلى خطة مستقلة قبل إغلاق المرحلة.

### Phase 1 — تثبيت الإنتاج ماليًا

- [x] منع السجل من عرض بيانات React Query قديمة كأرقام مؤقتة.
- [x] منع رسالة fallback المالي المحلي في تقرير السجل.
- [x] عرض loading/error بدل أرقام مؤقتة في بطاقة ملخص السجل.
- [x] منع الرئيسية من عرض ملخصات يوم/شهر قديمة من React Query.
- [x] منع مرفقات الرئيسية من استخدام local fallback عند تفعيل API.
- [x] منع التصدير/المشاركة من استخدام fallback محلي عند الحاجة لبيانات الخادم.
- [x] توثيق حراسة عدم تخزين operational entries في المتصفح عند server/DB mode.
- [x] حراسة أن `/app` لا يشغل demo migration بعد فصل مدخل Taqfeelah App.
- [x] حراسة أن قراءة operational entries لا تستخدم demo/local seed عند server/DB mode.
- [x] توحيد ملخص الرئيسية على read model التقارير الخادمي بدل hook ملخص مستقل.
- [x] عزل قراءات السجل الخادمية خلف adapter واحد بدل استدعاء entries/reports مباشرة من الشاشة.
- [x] إضافة اختبار وحدة لعقد adapter قراءات السجل الخادمية.
- [x] منع قراءة/كتابة last-closeout demo fallback عند server/org-config/DB mode.
- [x] منع قراءة/كتابة notebook theme المحلي عند server/org-config/DB mode.
- [x] إزالة hook ملخصات اليوم القديم `useStoreDaySummaries` حتى لا يبقى read model مالي ثانٍ للرئيسية.
- [x] إزالة باقي مسارات fallback المالي من كل الشاشات الإنتاجية بعد فحص إضافي.
- [x] توحيد home/report/register على read model خادمي واحد على مستوى الواجهة: الرئيسية والتقارير عبر `useStoreReports`، والسجل عبر `useRegisterServerReadModel`.
- [x] منع كرت السجل/التقفيلات من بناء أرقام نهائية من عمليات paginated جزئية؛ المجاميع النهائية تأتي من تقرير الخادم، والتقفيلات لا تعرض كقائمة مكتملة حتى تنتهي كل صفحات عملياتها.
- [x] نقل عقد API الأعمق للسجل إلى خطة API مستقلة بدل اعتباره بندًا مفتوحًا داخل Phase 1.

### Phase 2 — فصل demo عن التطبيق الحقيقي

- [x] إنشاء مدخل واضح باسم `Taqfeelah App`.
- [x] نقل تشغيل `/app` من `features/demo/AppRuntimePage` إلى مدخل إنتاجي واضح.
- [x] إبقاء demo فقط خلف مسار أو flag منفصل، إن احتجناه.
- [x] منع demo من الدخول في مسار `/app` الإنتاجي.
- [x] فصل أسماء loader/runtime التاريخية تدريجيًا بعد تثبيت مدخل `/app`: أصبح التحميل عبر `useTaqfeelahAppRuntime` و `loadTaqfeelahAppRuntime` و facade باسم `TaqfeelahAppRuntime`.
- [x] حذف ملفات loader/hook القديمة `use-taqfeelah-prototype-runtime` و `load-taqfeelah-prototype-runtime` حتى لا تبقى واجهة تحميل مربكة.

### Phase 3 — حذف الجذور غير المطلوبة

- [x] حذف تبويبة الاشتراك المكررة من داخل “محلات وفريق” مع إبقاء تفاصيل الخطة في الدعم وزر الترقية العلوي.
- [x] حذف واجهة دعوة الموظف من إعدادات الفريق والاعتماد على “إضافة موظف” فقط.
- [x] حذف demo financial seed من مسار الإنتاج بعد عزل التطبيق الحقيقي؛ demo seed يبقى لمسار demo فقط ولا يعمل في server/DB mode.
- [x] حذف fallback storage المالي غير الإنتاجي للعمليات التشغيلية من runtime.
- [x] عدم حذف billing/entitlements أو جداول DB مستخدمة بدون خطة migration منفصلة.

### Phase 4 — إعادة التسمية إلى Taqfeelah App

- [ ] إعادة تسمية `prototype-runtime` تدريجيًا إلى `taqfeelah-app`.
- [ ] تحديث imports والاختبارات بشكل ميكانيكي ومنضبط.
- [ ] إبقاء التغيير بلا تعديل سلوكي قدر الإمكان.
- [ ] تشغيل lint/typecheck/test/build بعد كل دفعة.

### Phase 5 — اختبارات الحماية

- [x] اختبار يمنع رجوع `keepPreviousData` للأرقام في السجل والتقارير.
- [x] اختبار يمنع رجوع رسالة local financial fallback في تقرير السجل.
- [x] اختبار يمنع رجوع `keepPreviousData` في الرئيسية ومرفقاتها.
- [x] اختبار يمنع localStorage للأرقام التشغيلية في production/server mode.
- [x] اختبار يمنع التصدير المحلي عند طلب بيانات الخادم.
- [x] اختبار يثبت أن `/app` يستخدم مدخل Taqfeelah App بعد مرحلة الفصل.
- [x] اختبار يمنع demo migration وdemo operational seed من مسار `/app` الإنتاجي.
- [x] اختبار يمنع رجوع أسماء loader/hook التاريخية في مدخل Taqfeelah App.
- [x] اختبار يمنع رجوع تبويبة الاشتراك المكررة وواجهة دعوات الفريق وfallback storage التشغيلي بعد حذفها من الجذر.

## القرار المعماري

نعتمد مبدأ:

- Server is the authority.
- Frontend is input/display only.
- No financial/local fallback in production.
- No browser storage for operational financial data in production.
- One server-authoritative financial read path for home/report/register.

## خارج النطاق الآن

- إعادة تسمية شاملة دفعة واحدة.
- إنشاء endpoint خلفي موحد جديد للسجل/التقارير؛ Phase 1 أغلقت توحيد read model على مستوى الواجهة، وأي عقد API أعمق يحتاج خطة API مستقلة قبل التنفيذ.
- إعادة تسمية المكوّن الداخلي الكبير `TaqfeelahPrototypeRuntime` ومجلد `prototype-runtime`؛ هذه ضمن Phase 4 وليست ضمن إغلاق Phase 2.
- Object Storage.
- Redis.
- Sentry.
- Rollups.
- Load testing كبير.
- تغيير التصميم.
- Refactor واسع للتطبيق كله.
