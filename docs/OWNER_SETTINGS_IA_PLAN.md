# تنظيم إعدادات المالك

> آخر تحديث: 2026-06-26

هذه الوثيقة تصف تنظيم إعدادات المالك الحالي. التفاصيل التاريخية للتجارب السابقة يجب أن تبقى في `docs/archive/` فقط.

## الهيكل الحالي

إعدادات المالك مبنية على أربعة أقسام:

| القسم | الغرض |
|---|---|
| محلات وفريق | إدارة المحلات، الموظفين، الدعوات، وربط الموظف بالمحل |
| حسابي | بيانات المالك، الجوال/البريد، وكلمة المرور |
| الشكل | مظهر الدفتر |
| المساعدة | الاشتراك، الدعم، ومركز المساعدة |

## قواعد الواجهة

- لا توجد تبويبات فرعية مزدوجة داخل الإعدادات.
- إدارة الموظف والمحل تكون في قسم واحد: **محلات وفريق**.
- الاشتراك يعرض من قسم **المساعدة**، والترقية تتم من مسار واحد واضح.
- قسم **حسابي** لا يحتوي على بطاقة اشتراك مكررة.
- قسم **الشكل** يخص مظهر الدفتر فقط.

## الملفات الرئيسية

| ملف | الدور |
|---|---|
| `src/components/taqfeelah-app/owner-settings-tabbed-shell.tsx` | قشرة إعدادات المالك |
| `src/components/taqfeelah-app/owner-settings-tab-navigation.ts` | ربط الأقسام بالتبويبات |
| `src/components/taqfeelah-app/owner-settings-section-views.tsx` | تجميع الأقسام |
| `src/components/taqfeelah-app/owner-settings-account-section.tsx` | حساب المالك والأمان |
| `src/components/taqfeelah-app/owner-settings-stores-section.tsx` | إدارة المحلات |
| `src/components/taqfeelah-app/owner-settings-team-section.tsx` | الفريق والصلاحيات |
| `src/components/taqfeelah-app/owner-settings-appearance-section.tsx` | مظهر الدفتر |
| `src/components/taqfeelah-app/owner-settings-support-section.tsx` | الدعم والاشتراك |

## بوابة التعديل

أي تغيير في إعدادات المالك يجب أن يثبت:

- حفظ المحلات والموظفين بعد الخروج والدخول.
- عدم تكرار مسارات الاشتراك أو الفريق.
- عدم وجود مسار إعدادات قديم يظهر للمستخدم.
- نجاح `owner-settings-tab-navigation.test.ts` واختبارات الإعدادات المرتبطة.
