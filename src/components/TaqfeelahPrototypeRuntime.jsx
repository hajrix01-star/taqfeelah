"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { PROTOTYPE_BUILD_STAMP } from "@/prototype-build-stamp.mjs";
import { AnimatePresence, motion } from "framer-motion";
import {
  Bell,
  Building2,
  CalendarDays,
  Camera,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  CreditCard,
  Download,
  FileImage,
  FileSpreadsheet,
  FileText,
  Home,
  Plus,
  ReceiptText,
  Send,
  Share2,
  Settings,
  ShoppingBag,
  Smartphone,
  UserRound,
  Wallet,
  Trash2,
  X,
} from "lucide-react";

function AppFontStyles() {
  return (
    <style>{`@import url('https://fonts.googleapis.com/css2?family=Aref+Ruqaa:wght@700&family=Caveat:wght@700&family=Noto+Sans:wght@400;500;600;700;800&family=Noto+Sans+Arabic:wght@400;500;600;700;800&display=swap');
      .taq-notch { display: none !important; }
      .taq-shell { width: 100% !important; max-width: none !important; min-height: 100dvh !important; border: none !important; border-radius: 0 !important; box-shadow: none !important; }
      .taq-screen { height: 100dvh !important; max-height: 100dvh !important; min-height: 100dvh !important; display: grid !important; grid-template-rows: auto 1fr auto !important; overflow: hidden !important; }
      .taq-scroll { min-height: 0 !important; -webkit-overflow-scrolling: touch; }
      .taq-owner-nav { position: relative !important; bottom: auto !important; left: auto !important; right: auto !important; transform: none !important; width: 100% !important; max-width: none !important; border-radius: 0 !important; box-shadow: none !important; }
      @media (min-width: 640px) and (max-width: 1023px) {
        .taq-topbar { max-width: 540px; margin-inline: auto; }
        .taq-owner-page { max-width: 530px; margin-inline: auto; padding-inline: 0 !important; }
        .taq-scroll > section:not(.taq-owner-page) { max-width: 560px; margin-inline: auto; }
        .taq-notebook-margin { inset-inline-start: calc((100% - 530px) / 2 + 32px) !important; }
      }
      @media (min-width: 1024px) {
        .taq-topbar { max-width: 560px; margin-inline: auto; }
        .taq-owner-page { max-width: 540px; margin-inline: auto; padding-inline: 0 !important; }
        .taq-scroll > section:not(.taq-owner-page) { max-width: 560px; margin-inline: auto; }
        .taq-notebook-margin { inset-inline-start: calc((100% - 540px) / 2 + 32px) !important; }
      }
    `}</style>
  );
}

const copy = {
  ar: {
    appName: "تقفيلة",
    restaurant: "مشويات المعلم الشامي",
    employee: "موظف",
    staffBadge: "موظف",
    owner: "مالك",
    home: "الرئيسية",
    entries: "الإدخالات",
    settings: "الإعدادات",
    reports: "التقارير",
    attachments: "المرفقات",
    active: "نشط",
    openEntry: "مفتوح للإدخال",
    todayEntries: "إدخالات اليوم",
    enterDailySummary: "إدخال ملخص اليوم",
    salesChannelsAndTotal: "قنوات البيع وإجمالي المبيعات",
    addPurchaseExpense: "إضافة مشتريات / مصروف",
    amountNoteOptionalPhoto: "مبلغ + ملاحظة + صورة اختيارية",
    recentEntries: "آخر الإدخالات",
    viewAll: "عرض الكل",
    register: "السجل",
    operationsLog: "سجل العمليات",
    myEntries: "إدخالاتي",
    activeEntries: "نشطة",
    withAttachment: "بمرفق فقط",
    allTypes: "كل الأنواع",
    noOperationsMatch: "لا توجد عمليات مطابقة للفلاتر المحددة.",
    logPurpose: "كل إدخال محفوظ كسجل مستقل. الإلغاء يستبعد العملية من الأرقام دون حذف أثرها.",
    today: "اليوم",
    all: "الكل",
    summary: "ملخص",
    purchases: "مشتريات",
    expense: "مصروف",
    expenses: "مصروفات",
    withdrawal: "سحب",
    other: "أخرى",
    attachmentExists: "يوجد مرفق",
    noAttachment: "بدون مرفق",
    reviewed: "تمت المراجعة",
    waitingReview: "بانتظار المراجعة",
    newOutflow: "خرج جديد",
    transactionType: "نوع العملية",
    howMuch: "كم المبلغ؟",
    captureAttachment: "التقاط صورة المرفق",
    cameraOrGallery: "فتح الكاميرا أو اختيار صورة",
    removePhoto: "حذف الصورة",
    attachmentStoredLocally: "الصورة مضغوطة ومحفوظة محليًا لهذا البروتايب",
    captured: "تم التقاط الصورة",
    optional: "اختياري",
    note: "ملاحظة",
    notePlaceholder: "مثال: شراء خبز وخضار للمطبخ",
    save: "حفظ",
    saveSend: "حفظ الإدخال",
    dailySummary: "ملخص اليوم",
    salesChannels: "قنوات البيع",
    totalSales: "إجمالي المبيعات",
    salesSummaryPhoto: "صورة ملخص المبيعات",
    addOutflow: "إضافة خارج",
    ownerOutflowNotice: "سجّل مصروفًا أو مشتريات دفعتها بنفسك. التحويل للعامل أو للصندوق لا يُسجل هنا.",
    operationStore: "المحل المرتبط بالعملية",
    chooseOperationStore: "اختر المحل قبل حفظ العملية",
    operationStoreHint: "سيتم تسجيل الخارج ضمن تقفيلة هذا المحل فقط.",
    category: "التصنيف",
    amount: "المبلغ",
    date: "التاريخ",
    rent: "إيجار",
    salary: "رواتب",
    utility: "كهرباء وماء",
    phone: "اتصالات",
    maintenance: "صيانة",
    rentMay: "إيجار شهر مايو",
    attachPhoto: "إرفاق صورة",
    photoAttached: "تم إرفاق الصورة",
    replacePhoto: "تغيير الصورة",
    processingPhoto: "جاري تجهيز الصورة...",
    attachmentTooLarge: "تعذر ضغط الصورة للحجم المطلوب. اختر صورة أوضح أو أصغر.",
    invalidAttachment: "المرفق يجب أن يكون صورة.",
    attachmentSaveFailed: "تعذر حفظ الصورة على الجهاز. لم يتم حفظ العملية حتى لا يظهر مرفق غير موجود.",
    discardDraftOnStoreChange: "تغيير المحل سيحذف البيانات المدخلة حاليًا. هل تريد المتابعة؟",
    saveOutflow: "حفظ",
    saveShareWhatsApp: "إرسال عبر واتساب",
    outflowSavedTitle: "تم حفظ العملية",
    outflowSavedDesc: "تم تسجيل الخارج بنجاح وسيظهر مباشرة في الرئيسية والتقارير والسجل.",
    sendOutflowQuestion: "هل تريد إرسال تفاصيل العملية عبر واتساب الآن؟",
    keepWithoutSending: "إغلاق بدون إرسال",
    shareNotebook: "معاينة الدفتر",
    notebookImagePreview: "معاينة الدفتر",
    shareViaWhatsApp: "واتساب",
    shareNotebookImage: "مشاركة الصورة",
    downloadNotebookImage: "حفظ الصورة",
    shareImageFailed: "تعذّر إنشاء صورة الدفتر. جرّب حفظ الصورة ثم أرسلها يدويًا.",
    shareImageSavedHint: "تم حفظ الصورة — أرفقها من المعرض في واتساب.",
    shareImagePasteHint: "تم نسخ الصورة — الصقها في محادثة واتساب (اضغط مطولاً في حقل الكتابة).",
    shareImageWhatsAppPick: "اختر واتساب من قائمة المشاركة لإرسال الصورة.",
    shareImageWhatsAppUnavailable: "المتصفح لا يدعم إرسال الصورة مباشرة — استخدم «مشاركة الصورة» أو «حفظ الصورة».",
    imageReadyToShare: "اضغط مشاركة أو حفظ لإرسال صورة الدفتر كما تظهر بالمعاينة.",
    shareOptions: "خيارات المشاركة",
    imageFormat: "صورة الدفتر",
    pdfFormat: "PDF",
    excelFormat: "Excel",
    comingSoon: "قريبًا",
    professionalReportPreview: "معاينة التقرير الجدولي",
    exportPdf: "تصدير PDF",
    exportExcel: "تصدير Excel",
    reportFor: "تقرير",
    reportType: "نوع التقرير",
    selectedPeriod: "الفترة المحددة",
    preparedForExport: "جاهز للتصدير والمشاركة",
    account: "الحساب",
    notifications: "الإشعارات",
    dailyReminder: "تذكير ملخص اليوم",
    dailyReminderDesc: "تنبيه قبل نهاية اليوم لإرسال المبيعات",
    saveNotice: "إشعار نجاح الحفظ",
    saveNoticeDesc: "تأكيد بعد إرسال أي إدخال",
    permissions: "صلاحياتك",
    permissionSummary: "إدخال ملخص اليوم",
    permissionOutflow: "إضافة مشتريات أو مصروف",
    permissionAttach: "إرفاق صورة مع الإدخال",
    ownerOnly: "التقارير وسجل العمليات الكامل يظهران للمالك فقط.",
    support: "المساعدة والدعم",
    logout: "تسجيل الخروج",
    yellow: "أصفر كلاسيكي",
    softYellow: "أصفر فاتح",
    ivory: "عاجي",
    white: "أبيض",
    greenTint: "أخضر ورقي",
    shopCloseout: "تقفيلة المحل",
    entered: "تم الإدخال",
    day: "اليوم",
    month: "الشهر",
    monthlySummary: "ملخص الشهر",
    dailyCloseout: "تقفيلة اليوم",
    sales: "المبيعات",
    purchasesExpenses: "الخارج",
    outflowRatio: "نسبة الخارج",
    recordedMonthResult: "نتيجة الشهر المسجلة",
    netMovement: "صافي الحركة",
    notReviewed: "لم تُراجع",
    hideDetails: "إخفاء التفاصيل",
    showMore: "إظهار المزيد",
    addPaidByOwner: "إضافة خارج دفعته بنفسك",
    operations: "عمليات",
    monthlyCloseouts: "تقفيلات الشهر",
    noAttachmentsDay: "لا توجد مرفقات لهذا اليوم",
    noAttachmentsPeriod: "لا توجد مرفقات للفترة المحددة",
    attachmentGallery: "معرض المرفقات",
    selectAttachmentPeriod: "حدد فترة العرض",
    photos: "الصور",
    tracking: "المتابعة",
    period: "الفترة",
    reportNotebook: "دفتر التقارير",
    days: "الأيام",
    channels: "القنوات",
    outflow: "الخارج",
    total: "الإجمالي",
    totalOutflow: "إجمالي الخارج",
    detailedOutflowReport: "تقرير الخارج التفصيلي",
    reportDetails: "تفاصيل التقرير",
    hideReportDetails: "إخفاء التفاصيل",
    salesBreakdown: "تفصيل المبيعات",
    outflowBreakdown: "تفصيل الخارج",
    detailsInOutflowTab: "لرؤية العمليات والمرفقات افتح تبويب الخارج.",
    filterByCategory: "التصنيف",
    logExpenseCategoryHint: "اختر بند المصروف لتضييق السجل",
    logFilteredSummary: "ملخص المحدد",
    logFilters: "الفلاتر",
    logResults: "النتائج",
    logStatus: "الحالة",
    logType: "نوع العملية",
    logInPeriod: "ضمن الفترة",
    logVoidedInView: "ملغاة في العرض",
    logWithProofInView: "بمرفق في العرض",
    allCategories: "كل التصنيفات",
    thisMonth: "هذا الشهر",
    thisYear: "هذه السنة",
    customPeriod: "فترة مخصصة",
    fromDate: "من",
    toDate: "إلى",
    numberTransactions: "عدد العمليات",
    averageTransaction: "متوسط العملية",
    viewTransactions: "عرض العمليات",
    hideTransactions: "إخفاء العمليات",
    noOutflowPeriod: "لا توجد عمليات خارج مطابقة للفلاتر",
    enteredByOwner: "المالك",
    yearToDate: "2026 حتى الآن",
    noAttachmentOperations: "عمليات بدون مرفق",
    totalAttachments: "إجمالي المرفقات",
    notReviewedItems: "لم تتم مراجعتها",
    noPhotoOperations: "عمليات بدون صورة",
    viewPhotosFromAttachments: "عرض الصور من قسم المرفقات",
    operationalOnly: "تقارير متابعة تشغيلية وليست تقارير محاسبية",
    time: "الوقت",
    enteredBy: "أدخلها",
    openAttachment: "فتح صورة المرفق",
    confirmReview: "تأكيد المراجعة",
    savedNotice: "تم الحفظ وسيظهر الإدخال لدى المالك",
    tagline: "دفتر تقفيلتك في جوالك",
    valueDesc: "إدخال بسيط للموظف، وملخص واضح للمالك، ومرفقات مرتبطة بكل عملية دون تعقيد محاسبي.",
    cash: "نقد",
    mada: "مدى",
    apple: "Apple Pay",
    jahez: "جاهز",
    hunger: "هنقرستيشن",
    breadVegetables: "شراء خبز وخضار للمطبخ",
    cleaning: "مواد تنظيف",
    dailyNeed: "احتياج يومي للمطبخ",
    salesSummary: "صورة ملخص المبيعات",
    yesterdaySummary: "ملخص أمس",
    dailyPurchases: "مشتريات يومية",
    operatingExpense: "مصروف تشغيل",
    shortBread: "شراء خبز وخضار",
    businessSettings: "الإعدادات",
    storeSettings: "إعدادات المحل",
    storeConfiguration: "إعدادات التشغيل",
    storeSpecificSettings: "هذه الإعدادات تخص هذا المحل فقط ولا تؤثر على المحلات الأخرى.",
    backToSettings: "العودة للإعدادات",
    linkedEmployees: "الموظفون المرتبطون بالمحل",
    noLinkedEmployees: "لا يوجد موظفون مرتبطون بهذا المحل.",
    generalPreferences: "التفضيلات العامة",
    businessProfile: "بيانات المحل",
    ownerAccount: "حساب المالك",
    ownerName: "محمد الهاجري",
    myAccountSecurity: "حسابي والأمان",
    ownerFullName: "اسم المالك",
    editOwnerName: "تعديل اسم المالك",
    ownerRenameProfileHint: "تغيير الاسم يطبق على الحساب والإدخالات الجديدة فقط. يحتفظ السجل السابق باسم منفذ العملية وقت تسجيلها.",
    loginMethod: "طريقة تسجيل الدخول",
    currentLoginMethod: "الطريقة الحالية",
    mobileOtpLogin: "رقم الجوال + رمز تحقق",
    usernamePasswordLogin: "اسم مستخدم وكلمة مرور",
    availableLater: "متاح لاحقًا",
    futureLoginMethodHint: "سيتم تفعيل اسم المستخدم وكلمة المرور لاحقًا بعد بناء نظام المصادقة الآمن، دون التأثير على بيانات المنشأة أو الصلاحيات.",
    futureLoginOnLoginScreen: "تجريبي: owner / demo123 — أو الجوال مع الرمز 1234",
    loginWithPhone: "جوال + رمز",
    loginWithPassword: "مستخدم وكلمة مرور",
    username: "اسم المستخدم",
    password: "كلمة المرور",
    employeeLogin: "دخول الموظف",
    employeeLoginSubtitle: "اختر اسمك وأدخل الرمز",
    employeePin: "رمز الدخول",
    employeePinHint: "تجريبي: 1234 لكل الموظفين",
    backToOwnerLogin: "العودة لدخول المالك",
    invalidOtp: "أدخل الرمز 1234 في البروتايب",
    invalidCredentials: "اسم المستخدم أو كلمة المرور غير صحيحة",
    invalidEmployeePin: "رمز الدخول غير صحيح",
    closeoutInAppAlert: "وصلت تقفيلة يوم جديدة",
    closeoutInAppHint: "سجّلها من الموظف — راجع السجل",
    reviewCloseout: "عرض في السجل",
    dismissAlert: "تجاهل",
    dailyCloseoutAlertPrototype: "تنبيه داخل التطبيق للمالك عند إرسال الموظف للتقفيلة",
    helpCenterTitle: "مركز المساعدة",
    prototypeBuildLabel: "نسخة النموذج",
    helpCenterBody: "البروتايب يغطي: تقفيلة يومية، خارج، سجل، تقارير، ومشاركة الدفتر. للدعم استخدم واتساب من الإعدادات.",
    prototypeDemoAccess: "تجريبي في البروتايب",
    saveAccountSettings: "حفظ بيانات الحساب",
    shopName: "اسم المحل",
    renameStoreHint: "تغيير الاسم لا يؤثر على العمليات أو التقارير السابقة؛ جميع البيانات تبقى مرتبطة بنفس المحل.",
    closeoutSetup: "إعداد التقفيلة",
    setupStore: "المحل المراد ضبطه",
    storeSalesChannelScope: "قنوات البيع تضبط لكل محل بشكل مستقل ولا تؤثر على المحلات الأخرى.",
    visibleSalesChannels: "قنوات البيع الظاهرة للموظف",
    manage: "تعديل",
    outflowCategories: "بنود المصروف",
    notebookAppearance: "شكل الدفتر",
    notebookAppearanceDesc: "لون دفتر التقفيلة والتقارير",
    autoSavedAccount: "يُحفظ تلقائيًا ويُطبق على الدفتر والتقارير والمشاركة.",
    configure: "إدارة",
    close: "إغلاق",
    addChannel: "إضافة قناة",
    newChannelName: "اسم قناة البيع الجديدة",
    channelControlHint: "القناة الموقوفة تختفي من الإدخالات الجديدة وتبقى في التقارير السابقة.",
    stopChannel: "إيقاف",
    restoreChannel: "إعادة تفعيل",
    noSalesChannels: "لا توجد قنوات بيع مفعلة. أضف أو فعّل قناة أولًا.",
    addCategory: "إضافة تصنيف",
    activeItemsHint: "اضغط على العنصر لإظهاره أو إخفائه من الإدخال.",
    teamMember: "عضو الفريق",
    addEmployee: "إضافة موظف",
    employeeMobile: "رقم جوال الموظف",
    allowEntries: "السماح بالإدخالات",
    billingDetails: "تفاصيل الاشتراك",
    renewalDate: "موعد التجديد القادم",
    paymentMethod: "طريقة الدفع",
    contactSupport: "التواصل مع الدعم",
    whatsappSupport: "واتساب الدعم",
    helpCenter: "مركز المساعدة",
    activeChannels: "القنوات النشطة",
    activeCategories: "التصنيفات النشطة",
    reviewWorkflow: "مراجعة صور الإثبات",
    reviewWorkflowDesc: "إظهار حالة المراجعة وزر تأكيد المراجعة للمالك.",
    reviewDisabled: "المراجعة متوقفة — المرفقات متاحة للعرض فقط.",
    changesSaved: "تم حفظ التعديلات",
    saveSettings: "حفظ التعديلات",
    cancelChanges: "إلغاء التعديلات",
    pendingSettingsChanges: "لديك تعديلات غير محفوظة",
    saveToApplyTheme: "اختر الشكل ثم اضغط حفظ لتطبيقه على الدفتر والتقارير والمشاركة.",
    newEmployeeName: "اسم الموظف",
    ownerNotifications: "تنبيهات المالك",
    pendingAttachmentAlert: "تنبيه المرفقات غير المراجعة",
    pendingAttachmentAlertDesc: "إشعار عند وجود مرفقات تنتظر مراجعتك",
    dailyCloseoutAlert: "تنبيه وصول تقفيلة اليوم",
    dailyCloseoutAlertDesc: "إشعار عند إرسال الموظف لملخص اليوم",
    teamAccess: "الموظفون والمحلات المرتبطة",
    linkedStores: "المحلات المرتبطة",
    assignStores: "حدد المحل أو المحلات التي يستطيع الموظف الإدخال عليها",
    selectAtLeastOneStore: "يجب اختيار محل واحد على الأقل للموظف.",
    currentWorkStore: "المحل الحالي للإدخال",
    switchWorkStore: "تغيير المحل",
    noAssignedStores: "لا يوجد محل مرتبط بهذا الموظف. راجع المالك.",
    employeeEntryOnly: "صلاحية الموظف ثابتة: إدخال فقط للمحلات المرتبطة به.",
    employeeCount: "موظف واحد لديه صلاحية الإدخال",
    manageEmployees: "إدارة الموظفين",
    subscription: "الاشتراك",
    currentPlan: "نسخة تجريبية",
    monthlyPrice: "الفوترة والاشتراكات ستُفعّل لاحقًا",
    allStores: "الكل",
    selectStore: "اختر المحل",
    searchStore: "ابحث عن محل أو فرع",
    viewStores: "عرض المحلات",
    hideStores: "إخفاء المحلات",
    storeResults: "نتائج المحلات",
    noActiveStores: "لا توجد محلات نشطة",
    combinedCloseout: "كل المحلات",
    activeStoresScope: "جميع المحلات النشطة",
    combinedReport: "كل المحلات",
    store: "المحل",
    result: "النتيجة",
    status: "الحالة",
    completed: "مكتملة",
    unreviewedShort: "غير المراجع",
    chooseStoreForDetails: "اختر محلًا لعرض المرفقات والتفاصيل وإضافة الخارج",
    shamiShort: "الشامي",
    arzShort: "ARZ",
    shamiLocation: "الظهران - الدوحة",
    arzLocation: "الخبر - العليا",
    combinedTotal: "الإجمالي",
    loginTitle: "ادخل إلى تقفيلة",
    loginSubtitle: "تابع تقفيلة محلك من جوالك ببساطة",
    mobileNumber: "رقم الجوال",
    mobileHint: "سيصلك رمز تحقق على رقم الجوال",
    sendCode: "إرسال رمز التحقق",
    verificationCode: "رمز التحقق",
    codeSentTo: "تم إرسال رمز التحقق إلى",
    verifyContinue: "تحقق وادخل",
    changeNumber: "تغيير الرقم",
    phoneLoginOnly: "طريقة الدخول الحالية: رقم الجوال ورمز تحقق آمن",
    linkedAccountNote: "سيتم فتح الحساب والصلاحيات المرتبطة برقمك تلقائيًا",
    myStores: "محلاتي",
    activeStores: "المحلات النشطة",
    archivedStoresList: "المؤرشفة",
    showArchived: "عرض المؤرشفة",
    hideArchived: "إخفاء المؤرشفة",
    noArchivedStores: "لا توجد محلات مؤرشفة",
    addStore: "إضافة محل",
    archiveStore: "أرشفة",
    archivedStore: "مؤرشف",
    storeActive: "نشط",
    addNewStore: "إضافة محل جديد",
    newStoreName: "اسم المحل الجديد",
    newStoreLocation: "الموقع أو الفرع",
    archiveNotice: "الأرشفة توقف الإدخالات الجديدة وتحتفظ بالتقفيلات والمرفقات السابقة.",
    confirmAddStore: "حفظ المحل",
    delete: "حذف",
    deleteStore: "حذف المحل",
    deleteChannel: "حذف قناة البيع",
    deleteUser: "حذف المستخدم",
    confirmSafeDelete: "تأكيد الإجراء",
    cancel: "إلغاء",
    storeDeleteWithDataTitle: "لا يمكن حذف محل لديه بيانات",
    storeDeleteWithDataDesc: "يحتوي هذا المحل على تقفيلات أو سجلات سابقة. سيتم أرشفته وإيقاف الإدخالات الجديدة فقط، وستبقى التقارير والمرفقات محفوظة.",
    storeDeleteEmptyTitle: "حذف المحل الفارغ؟",
    storeDeleteEmptyDesc: "هذا المحل لا يحتوي على بيانات مسجلة. سيتم حذفه من القائمة نهائيًا.",
    userDeleteTitle: "إزالة صلاحية المستخدم؟",
    userDeleteDesc: "سيتم إيقاف دخول المستخدم وإزالته من الفريق النشط. ستبقى الإدخالات السابقة باسمه ضمن السجل.",
    channelDeleteTitle: "إيقاف قناة البيع؟",
    channelDeleteDesc: "ستختفي القناة من الإدخالات الجديدة، لكنها ستبقى محفوظة في التقارير السابقة ولا تتأثر الأرقام التاريخية.",
    archiveAndKeepData: "أرشفة وحفظ البيانات",
    deleteEmptyStore: "حذف المحل الفارغ",
    revokeAccess: "إزالة الصلاحية",
    retireChannel: "إيقاف القناة",
    safeDeleteNotice: "الحذف الآمن يحافظ على التقارير والسجلات السابقة.",
    selectDay: "اختر اليوم",
    noEntriesDay: "لا توجد إدخالات في هذا اليوم",
    selectMonth: "اختر الشهر",
    selectYear: "اختر السنة",
    selectRange: "اختر الفترة",
    year: "السنة",
    custom: "مخصص",
    applyPeriod: "تطبيق الفترة",
    year2026: "2026",
    year2025: "2025",
    may2026: "مايو 2026",
    april2026: "أبريل 2026",
    march2026: "مارس 2026",
    previousMonth: "الشهر السابق",
    nextMonth: "الشهر التالي",
    suggestedNextCloseout: "اليوم المقترح بناءً على آخر تقفيلة محفوظة",
    changeDateAnytime: "يمكنك تغيير التاريخ عند إدخال عملية متأخرة أو تصحيح سابق.",
    archivedReadOnly: "مؤرشف — عرض فقط",
    viewPastReports: "عرض التقارير السابقة",
    viewPastAttachments: "عرض السجل السابق",
    atLeastOneCategory: "يجب إبقاء تصنيف واحد على الأقل للإدخالات الجديدة.",
    noActiveEmployee: "لا يوجد موظف نشط حاليًا. فعّل موظفًا من إعدادات المالك.",
    noCloseoutsPeriod: "لا توجد تقفيلات مسجلة لهذه الفترة.",
    noSalesChannelsPeriod: "لا توجد قنوات مبيعات مسجلة لهذه الفترة.",
    voided: "ملغاة",
    voidEntry: "إلغاء العملية",
    voidDialogTitle: "إلغاء هذه العملية؟",
    voidConfirm: "سيتم استبعاد العملية من الأرقام والتقارير، مع الاحتفاظ بها في السجل والمرفقات للرجوع إليها.",
    voidReasonPrompt: "سبب الإلغاء - اختياري",
    confirmVoid: "تأكيد الإلغاء",
    voidedByOwner: "ألغيت بواسطة المالك",
    voidReason: "سبب الإلغاء",
    duplicateSalesTitle: "يوجد ملخص مبيعات سابق",
    duplicateSalesWarning: "تم تسجيل ملخص مبيعات نشط لهذا المحل في نفس اليوم. إذا تابعت، سيضاف هذا الإدخال إلى الإجمالي كسجل مستقل ولن يستبدل الإدخال السابق.",
    previousSalesEntries: "ملخصات المبيعات الحالية",
    saveAdditionalEntry: "حفظ كإدخال إضافي",
    duplicateSalesOwnerAlert: "يوجد أكثر من ملخص مبيعات مسجل لنفس اليوم",
    duplicateSalesOwnerHint: "راجع السجل للتأكد من أن الإدخالات صحيحة وليست مكررة.",
    reviewInLog: "مراجعة السجل",
    approveMultipleSales: "اعتماد الإدخالات",
    approveMultipleSalesHint: "اعتماد أن ملخصات المبيعات المتعددة صحيحة وإيقاف التنبيه لهذه النسخة.",
    restoreEntry: "استعادة العملية",
    restoreDialogTitle: "استعادة هذه العملية؟",
    restoreConfirm: "ستعود العملية إلى الأرقام والتقارير مع الاحتفاظ بسجل الإلغاء والاستعادة.",
    restoreReasonPrompt: "سبب الاستعادة - اختياري",
    confirmRestore: "تأكيد الاستعادة",
    restored: "مستعادة",
    restoredByOwner: "استعيدت بواسطة المالك",
    restoreReason: "سبب الاستعادة",
    saving: "جاري الحفظ...",
    enterOwnerSummary: "إدخال تقفيلة اليوم",
    atLeastOneChannel: "يجب إبقاء قناة بيع واحدة على الأقل لإدخال المبيعات.",
    stoppedChannels: "القنوات الموقوفة",
    noStoppedChannels: "لا توجد قنوات موقوفة.",
    invalidDateRange: "تاريخ البداية يجب أن يكون قبل تاريخ النهاية.",
    archiveStoreTitle: "أرشفة المحل؟",
    archiveStoreDesc: "سيتم إيقاف الإدخالات الجديدة مع الاحتفاظ بجميع التقارير والسجلات والمرفقات السابقة.",
    confirmArchive: "تأكيد الأرشفة",
    pendingReviews: "مراجعات معلقة",
    chooseStoreForSummary: "اختر المحل قبل تسجيل التقفيلة",
    futureDateNotAllowed: "لا يمكن تسجيل عملية بتاريخ مستقبلي.",
    auditTrail: "سجل الحركة",
    actionCreated: "تم الإنشاء",
    actionVoided: "تم الإلغاء",
    actionRestored: "تمت الاستعادة",
    actionReviewed: "تمت مراجعة المرفق",
    actionDuplicateApproved: "تم اعتماد تعدد الإدخالات",
    channelsReport: "تقرير القنوات",
    daysReport: "تقرير الأيام",
    attachmentsReport: "تقرير المرفقات",
    shopsComparisonReport: "مقارنة المحلات",
    salesShort: "المبيعات",
    outflowShort: "الخارج",
    pendingReviewOnly: "بانتظار المراجعة فقط",
    archiveStaffWarning: "تنبيه: سيصبح الموظفون التاليون بدون محل نشط للإدخال بعد الأرشفة:",
    saveTeamChanges: "حفظ صلاحيات الفريق",
    desktopHeroTitle: "دفتر تقفيلتك اليومية في جوالك",
    desktopHeroDesc: "سجّل المبيعات والخارج والمرفقات، وتابع حركة محلاتك يوميًا بوضوح، بدون تعقيد الأنظمة المحاسبية.",
    ownerLogin: "تسجيل دخول المالك",
    openOnMobile: "افتح التطبيق من جوالك",
    qrPrototypeNote: "رمز تجريبي — يتم ربطه عند نشر النسخة الفعلية",
    fastEntryTitle: "إدخال سريع",
    fastEntryDesc: "الموظف يسجل مبيعات اليوم والخارج خلال دقائق.",
    clearFollowupTitle: "متابعة واضحة",
    clearFollowupDesc: "المالك يراجع الحركة والسجل لكل محل من مكان واحد.",
    proofLinkedTitle: "إثباتات مرتبطة",
    proofLinkedDesc: "أرفق صورة مع العملية عند الحاجة وراجعها لاحقًا.",
    targetBusinessTitle: "مصمم للمحلات التي تحتاج تقفيلة يومية بسيطة",
    targetBusinessDesc: "للمطاعم والكافيهات والمحلات الصغيرة واللاونجات التي تريد متابعة يومية واضحة بدون تحويل العمل إلى نظام محاسبي كامل.",
    mobileFirstBadge: "مصمم للجوال أولًا",
    desktopOwnerLater: "لوحة المالك على الكمبيوتر ضمن التطوير اللاحق",
    closeLogin: "إغلاق الدخول",
    desktopDemoStore: "مطعم النجاح",
    desktopDemoLocation: "الفرع الرئيسي",
  },
  en: {
    appName: "Taqfeelah",
    restaurant: "Al Moallem Al Shami Grill",
    employee: "Employee",
    staffBadge: "Staff",
    owner: "Owner",
    home: "Home",
    entries: "Entries",
    settings: "Settings",
    reports: "Reports",
    attachments: "Attachments",
    active: "Active",
    openEntry: "Open for entries",
    todayEntries: "Today's entries",
    enterDailySummary: "Enter daily summary",
    salesChannelsAndTotal: "Sales channels and total sales",
    addPurchaseExpense: "Add purchase / expense",
    amountNoteOptionalPhoto: "Amount + note + optional photo",
    recentEntries: "Recent entries",
    viewAll: "View all",
    register: "Log",
    operationsLog: "Operations log",
    myEntries: "My entries",
    activeEntries: "Active",
    withAttachment: "With attachment only",
    allTypes: "All types",
    noOperationsMatch: "No operations match the selected filters.",
    logPurpose: "Each entry is stored as an independent record. Voiding excludes it from totals without erasing its trace.",
    today: "Today",
    all: "All",
    summary: "Summary",
    purchases: "Purchases",
    expense: "Expense",
    expenses: "Expenses",
    withdrawal: "Withdrawal",
    other: "Other",
    attachmentExists: "Attachment added",
    noAttachment: "No attachment",
    reviewed: "Reviewed",
    waitingReview: "Pending review",
    newOutflow: "New outflow",
    transactionType: "Transaction type",
    howMuch: "Amount",
    captureAttachment: "Capture attachment photo",
    cameraOrGallery: "Open camera or choose image",
    removePhoto: "Remove photo",
    attachmentStoredLocally: "Compressed image saved locally for this prototype",
    captured: "Photo captured",
    optional: "Optional",
    note: "Note",
    notePlaceholder: "Example: kitchen bread and vegetables",
    save: "Save",
    saveSend: "Save entry",
    dailySummary: "Daily summary",
    salesChannels: "Sales channels",
    totalSales: "Total sales",
    salesSummaryPhoto: "Sales summary photo",
    addOutflow: "Add outflow",
    ownerOutflowNotice: "Record expenses or purchases you paid directly. Transfers to an employee or cash drawer are not recorded here.",
    operationStore: "Shop for this transaction",
    chooseOperationStore: "Select a shop before saving this transaction",
    operationStoreHint: "This outflow will be recorded only in the selected shop closeout.",
    category: "Category",
    amount: "Amount",
    date: "Date",
    rent: "Rent",
    salary: "Salaries",
    utility: "Electricity & water",
    phone: "Telecom",
    maintenance: "Maintenance",
    rentMay: "May rent payment",
    attachPhoto: "Attach photo",
    photoAttached: "Photo attached",
    replacePhoto: "Replace photo",
    processingPhoto: "Preparing photo...",
    attachmentTooLarge: "The image could not be compressed to the allowed size. Select a clearer or smaller image.",
    invalidAttachment: "The attachment must be an image.",
    attachmentSaveFailed: "The image could not be saved on this device. The entry was not saved to avoid a missing attachment.",
    discardDraftOnStoreChange: "Changing the shop will clear the current unsaved entry. Continue?",
    saveOutflow: "Save",
    saveShareWhatsApp: "Send via WhatsApp",
    outflowSavedTitle: "Transaction saved",
    outflowSavedDesc: "The outflow was recorded successfully and now appears in the home view, reports, and log.",
    sendOutflowQuestion: "Would you like to send the transaction details through WhatsApp now?",
    keepWithoutSending: "Close without sending",
    shareNotebook: "Preview notebook",
    notebookImagePreview: "Notebook preview",
    shareViaWhatsApp: "WhatsApp",
    shareNotebookImage: "Share image",
    downloadNotebookImage: "Save image",
    shareImageFailed: "Could not create the notebook image. Try saving it and sending manually.",
    shareImageSavedHint: "Image saved — attach it from your gallery in WhatsApp.",
    shareImagePasteHint: "Image copied — paste it in the WhatsApp chat (long-press the message field).",
    shareImageWhatsAppPick: "Choose WhatsApp from the share menu to send the image.",
    shareImageWhatsAppUnavailable: "This browser cannot attach the image directly — use Share image or Save image.",
    imageReadyToShare: "Tap share or save to send the notebook image shown in the preview.",
    shareOptions: "Share options",
    imageFormat: "Notebook image",
    pdfFormat: "PDF",
    excelFormat: "Excel",
    comingSoon: "Coming soon",
    professionalReportPreview: "Tabular report preview",
    exportPdf: "Export PDF",
    exportExcel: "Export Excel",
    reportFor: "Report",
    reportType: "Report type",
    selectedPeriod: "Selected period",
    preparedForExport: "Ready to export and share",
    account: "Account",
    notifications: "Notifications",
    dailyReminder: "Daily summary reminder",
    dailyReminderDesc: "Reminder before end of day to submit sales",
    saveNotice: "Save confirmation",
    saveNoticeDesc: "Confirmation after submitting an entry",
    permissions: "Your permissions",
    permissionSummary: "Enter daily summary",
    permissionOutflow: "Add purchase or expense",
    permissionAttach: "Attach a photo to an entry",
    ownerOnly: "Full reports and the operations log are only available to the owner.",
    support: "Help and support",
    logout: "Log out",
    yellow: "Classic yellow",
    softYellow: "Light yellow",
    ivory: "Ivory",
    white: "White",
    greenTint: "Green tint",
    shopCloseout: "Shop closeout",
    entered: "Submitted",
    day: "Day",
    month: "Month",
    monthlySummary: "Monthly summary",
    dailyCloseout: "Daily closeout",
    sales: "Sales",
    purchasesExpenses: "Outflow",
    outflowRatio: "Outflow ratio",
    recordedMonthResult: "Recorded month result",
    netMovement: "Net movement",
    notReviewed: "Not reviewed",
    hideDetails: "Hide details",
    showMore: "Show more",
    addPaidByOwner: "Add outflow you paid",
    operations: "Operations",
    monthlyCloseouts: "Monthly closeouts",
    noAttachmentsDay: "No attachments for this day",
    noAttachmentsPeriod: "No attachments for the selected period",
    attachmentGallery: "Attachment gallery",
    selectAttachmentPeriod: "Select viewing period",
    photos: "Photos",
    tracking: "Tracking",
    period: "Period",
    reportNotebook: "Reports notebook",
    days: "Days",
    channels: "Channels",
    outflow: "Outflow",
    total: "Total",
    totalOutflow: "Total outflow",
    detailedOutflowReport: "Detailed outflow report",
    reportDetails: "Report details",
    hideReportDetails: "Hide details",
    salesBreakdown: "Sales breakdown",
    outflowBreakdown: "Outflow breakdown",
    detailsInOutflowTab: "Open the Outflow tab to view transactions and attachments.",
    filterByCategory: "Category",
    logExpenseCategoryHint: "Pick an expense category to narrow the log",
    logFilteredSummary: "Filtered summary",
    logFilters: "Filters",
    logResults: "Results",
    logStatus: "Status",
    logType: "Operation type",
    logInPeriod: "In period",
    logVoidedInView: "Voided in view",
    logWithProofInView: "With attachment in view",
    allCategories: "All categories",
    thisMonth: "This month",
    thisYear: "This year",
    customPeriod: "Custom period",
    fromDate: "From",
    toDate: "To",
    numberTransactions: "Transactions",
    averageTransaction: "Average transaction",
    viewTransactions: "View transactions",
    hideTransactions: "Hide transactions",
    noOutflowPeriod: "No outflow transactions match these filters",
    enteredByOwner: "Owner",
    yearToDate: "2026 year to date",
    noAttachmentOperations: "Operations without attachment",
    totalAttachments: "Total attachments",
    notReviewedItems: "Not reviewed",
    noPhotoOperations: "Operations without photo",
    viewPhotosFromAttachments: "View photos in Attachments",
    operationalOnly: "Operational tracking reports only, not accounting reports",
    time: "Time",
    enteredBy: "Entered by",
    openAttachment: "Open attachment photo",
    confirmReview: "Confirm review",
    savedNotice: "Saved. The entry will appear for the owner.",
    tagline: "Your closeout notebook on your phone",
    valueDesc: "Simple entries for employees, a clear summary for owners, and attachments tied to each operation without accounting complexity.",
    cash: "Cash",
    mada: "Mada",
    apple: "Apple Pay",
    jahez: "Jahez",
    hunger: "HungerStation",
    breadVegetables: "Kitchen bread and vegetables",
    cleaning: "Cleaning supplies",
    dailyNeed: "Daily kitchen needs",
    salesSummary: "Sales summary photo",
    yesterdaySummary: "Yesterday's summary",
    dailyPurchases: "Daily purchases",
    operatingExpense: "Operating expense",
    shortBread: "Bread and vegetables",
    businessSettings: "Settings",
    storeSettings: "Shop settings",
    storeConfiguration: "Operations settings",
    storeSpecificSettings: "These settings apply only to this shop and do not affect other shops.",
    backToSettings: "Back to settings",
    linkedEmployees: "Staff assigned to this shop",
    noLinkedEmployees: "No staff are assigned to this shop.",
    generalPreferences: "General preferences",
    businessProfile: "Business profile",
    ownerAccount: "Owner account",
    ownerName: "Mohammad Alhajri",
    myAccountSecurity: "My account & security",
    ownerFullName: "Owner name",
    editOwnerName: "Edit owner name",
    ownerRenameProfileHint: "Changing the name applies to the account and new entries only. Previous records retain the actor name captured at the time of entry.",
    loginMethod: "Sign-in method",
    currentLoginMethod: "Current method",
    mobileOtpLogin: "Mobile number + verification code",
    usernamePasswordLogin: "Username and password",
    availableLater: "Available later",
    futureLoginMethodHint: "Username and password sign-in will be enabled later after secure authentication is built, without affecting organization data or access rules.",
    futureLoginOnLoginScreen: "Demo: owner / demo123 — or mobile with code 1234",
    loginWithPhone: "Mobile + code",
    loginWithPassword: "Username & password",
    username: "Username",
    password: "Password",
    employeeLogin: "Employee sign-in",
    employeeLoginSubtitle: "Pick your name and enter your PIN",
    employeePin: "Sign-in PIN",
    employeePinHint: "Demo: 1234 for all staff",
    backToOwnerLogin: "Back to owner sign-in",
    invalidOtp: "Enter code 1234 in this prototype",
    invalidCredentials: "Incorrect username or password",
    invalidEmployeePin: "Incorrect PIN",
    closeoutInAppAlert: "New daily closeout received",
    closeoutInAppHint: "Submitted by staff — review in the log",
    reviewCloseout: "View in log",
    dismissAlert: "Dismiss",
    dailyCloseoutAlertPrototype: "In-app owner alert when staff submit the daily summary",
    helpCenterTitle: "Help center",
    prototypeBuildLabel: "Prototype build",
    helpCenterBody: "This prototype covers daily closeout, outflow, log, reports, and notebook sharing. Use WhatsApp in settings for support.",
    prototypeDemoAccess: "Prototype demo",
    saveAccountSettings: "Save account details",
    shopName: "Shop name",
    renameStoreHint: "Changing the name does not affect previous operations or reports; all data remains linked to the same shop.",
    closeoutSetup: "Closeout setup",
    setupStore: "Shop to configure",
    storeSalesChannelScope: "Sales channels are configured independently for each shop and do not affect other shops.",
    visibleSalesChannels: "Sales channels shown to staff",
    manage: "Edit",
    outflowCategories: "Expense items",
    notebookAppearance: "Notebook appearance",
    notebookAppearanceDesc: "Notebook color for closeouts and reports",
    autoSavedAccount: "Saved automatically and applied to the notebook, reports, and sharing.",
    configure: "Manage",
    close: "Close",
    addChannel: "Add channel",
    newChannelName: "New sales channel name",
    channelControlHint: "Disabled channels disappear from new entries but remain in historical reports.",
    stopChannel: "Disable",
    restoreChannel: "Restore",
    noSalesChannels: "No sales channels are enabled. Add or restore a channel first.",
    addCategory: "Add category",
    activeItemsHint: "Tap an item to show or hide it from entry screens.",
    teamMember: "Team member",
    addEmployee: "Add employee",
    employeeMobile: "Employee mobile number",
    allowEntries: "Allow entries",
    billingDetails: "Subscription details",
    renewalDate: "Next renewal date",
    paymentMethod: "Payment method",
    contactSupport: "Contact support",
    whatsappSupport: "WhatsApp support",
    helpCenter: "Help center",
    activeChannels: "Active channels",
    activeCategories: "Active categories",
    reviewWorkflow: "Review proof photos",
    reviewWorkflowDesc: "Show review status and the confirmation action for the owner.",
    reviewDisabled: "Review is off — attachments remain available for viewing only.",
    changesSaved: "Changes saved",
    saveSettings: "Save changes",
    cancelChanges: "Cancel changes",
    pendingSettingsChanges: "You have unsaved changes",
    saveToApplyTheme: "Select a style, then save to apply it to the notebook, reports, and sharing.",
    newEmployeeName: "Employee name",
    ownerNotifications: "Owner notifications",
    pendingAttachmentAlert: "Unreviewed attachments alert",
    pendingAttachmentAlertDesc: "Notify when attachments need your review",
    dailyCloseoutAlert: "Daily closeout received",
    dailyCloseoutAlertDesc: "Notify when staff submit the daily summary",
    teamAccess: "Staff and assigned shops",
    linkedStores: "Assigned shops",
    assignStores: "Select the shop or shops this employee can submit entries for",
    selectAtLeastOneStore: "Select at least one shop for this employee.",
    currentWorkStore: "Current entry shop",
    switchWorkStore: "Change shop",
    noAssignedStores: "No shop is assigned to this employee. Contact the owner.",
    employeeEntryOnly: "Employee access is fixed: entries only for assigned shops.",
    employeeCount: "1 employee can submit entries",
    manageEmployees: "Manage employees",
    subscription: "Subscription",
    currentPlan: "Trial version",
    monthlyPrice: "Billing and subscriptions will be enabled later",
    allStores: "All",
    selectStore: "Select shop",
    searchStore: "Search shop or branch",
    viewStores: "View shops",
    hideStores: "Hide shops",
    storeResults: "Shop results",
    noActiveStores: "No active shops",
    combinedCloseout: "All shops",
    activeStoresScope: "All active shops",
    combinedReport: "All shops",
    store: "Shop",
    result: "Result",
    status: "Status",
    completed: "Completed",
    unreviewedShort: "Unreviewed",
    chooseStoreForDetails: "Select a shop to view attachments, details, or add outflow",
    shamiShort: "Shami",
    arzShort: "ARZ",
    shamiLocation: "Dhahran - Doha",
    arzLocation: "Khobar - Olaya",
    combinedTotal: "Total",
    loginTitle: "Sign in to Taqfeelah",
    loginSubtitle: "Track your shop closeout simply from your phone",
    mobileNumber: "Mobile number",
    mobileHint: "A verification code will be sent to your phone",
    sendCode: "Send verification code",
    verificationCode: "Verification code",
    codeSentTo: "Verification code sent to",
    verifyContinue: "Verify and continue",
    changeNumber: "Change number",
    phoneLoginOnly: "Current sign-in method: mobile number and secure verification code",
    linkedAccountNote: "Your linked account and permissions will open automatically",
    myStores: "My shops",
    activeStores: "Active shops",
    archivedStoresList: "Archived",
    showArchived: "Show archived",
    hideArchived: "Hide archived",
    noArchivedStores: "No archived shops",
    addStore: "Add shop",
    archiveStore: "Archive",
    archivedStore: "Archived",
    storeActive: "Active",
    addNewStore: "Add new shop",
    newStoreName: "New shop name",
    newStoreLocation: "Location or branch",
    archiveNotice: "Archiving stops new entries while retaining past closeouts and attachments.",
    confirmAddStore: "Save shop",
    delete: "Delete",
    deleteStore: "Delete shop",
    deleteChannel: "Delete sales channel",
    deleteUser: "Delete user",
    confirmSafeDelete: "Confirm action",
    cancel: "Cancel",
    storeDeleteWithDataTitle: "A shop with records cannot be deleted",
    storeDeleteWithDataDesc: "This shop has previous closeouts or records. It will be archived and blocked from new entries only. Reports and attachments remain saved.",
    storeDeleteEmptyTitle: "Delete empty shop?",
    storeDeleteEmptyDesc: "This shop has no recorded data. It will be removed permanently from the list.",
    userDeleteTitle: "Remove user access?",
    userDeleteDesc: "The user's access will be disabled and removed from the active team. Their previous entries remain in the record.",
    channelDeleteTitle: "Disable sales channel?",
    channelDeleteDesc: "The channel will disappear from new entries, but remains in prior reports so historical figures are unaffected.",
    archiveAndKeepData: "Archive and keep data",
    deleteEmptyStore: "Delete empty shop",
    revokeAccess: "Remove access",
    retireChannel: "Disable channel",
    safeDeleteNotice: "Safe deletion preserves historical reports and records.",
    selectDay: "Select day",
    noEntriesDay: "No entries on this day",
    selectMonth: "Select month",
    selectYear: "Select year",
    selectRange: "Select range",
    year: "Year",
    custom: "Custom",
    applyPeriod: "Apply period",
    year2026: "2026",
    year2025: "2025",
    may2026: "May 2026",
    april2026: "April 2026",
    march2026: "March 2026",
    previousMonth: "Previous month",
    nextMonth: "Next month",
    suggestedNextCloseout: "Suggested day based on the last saved closeout",
    changeDateAnytime: "You can change the date for a late entry or previous correction.",
    archivedReadOnly: "Archived — view only",
    viewPastReports: "View past reports",
    viewPastAttachments: "View previous log",
    atLeastOneCategory: "Keep at least one category available for new entries.",
    noActiveEmployee: "There is no active employee. Enable an employee from owner settings.",
    noCloseoutsPeriod: "No closeouts recorded for this period.",
    noSalesChannelsPeriod: "No sales channels recorded for this period.",
    voided: "Voided",
    voidEntry: "Void entry",
    voidDialogTitle: "Void this entry?",
    voidConfirm: "This entry will be excluded from totals and reports while remaining in the log and attachments for reference.",
    voidReasonPrompt: "Void reason - optional",
    confirmVoid: "Confirm void",
    voidedByOwner: "Voided by owner",
    voidReason: "Void reason",
    duplicateSalesTitle: "A sales summary already exists",
    duplicateSalesWarning: "An active sales summary already exists for this shop on the same day. If you continue, this entry will be added to the total as a separate record and will not replace the earlier entry.",
    previousSalesEntries: "Current sales summaries",
    saveAdditionalEntry: "Save as additional entry",
    duplicateSalesOwnerAlert: "More than one sales summary was recorded for the same day",
    duplicateSalesOwnerHint: "Review the log to confirm the entries are valid and not duplicates.",
    reviewInLog: "Review log",
    approveMultipleSales: "Approve entries",
    approveMultipleSalesHint: "Confirm these multiple sales summaries are valid and dismiss this alert for the current entries.",
    restoreEntry: "Restore entry",
    restoreDialogTitle: "Restore this entry?",
    restoreConfirm: "This entry will be counted again in totals and reports while keeping its void and restore audit trail.",
    restoreReasonPrompt: "Restore reason - optional",
    confirmRestore: "Confirm restore",
    restored: "Restored",
    restoredByOwner: "Restored by owner",
    restoreReason: "Restore reason",
    saving: "Saving...",
    enterOwnerSummary: "Enter daily closeout",
    atLeastOneChannel: "Keep at least one sales channel available for sales entries.",
    stoppedChannels: "Disabled channels",
    noStoppedChannels: "No disabled channels.",
    invalidDateRange: "The start date must be before the end date.",
    archiveStoreTitle: "Archive shop?",
    archiveStoreDesc: "New entries will stop while all prior reports, logs, and attachments remain available.",
    confirmArchive: "Confirm archive",
    pendingReviews: "Pending reviews",
    chooseStoreForSummary: "Select a shop before recording the closeout.",
    futureDateNotAllowed: "Transactions cannot be recorded for a future date.",
    auditTrail: "Activity log",
    actionCreated: "Created",
    actionVoided: "Voided",
    actionRestored: "Restored",
    actionReviewed: "Attachment reviewed",
    actionDuplicateApproved: "Multiple entries approved",
    channelsReport: "Channels report",
    daysReport: "Days report",
    attachmentsReport: "Attachments report",
    shopsComparisonReport: "Shops comparison",
    salesShort: "Sales",
    outflowShort: "Outflow",
    pendingReviewOnly: "Pending review only",
    archiveStaffWarning: "Warning: the following employees will have no active shop for entries after archiving:",
    saveTeamChanges: "Save team access",
    desktopHeroTitle: "Your daily closeout notebook on your phone",
    desktopHeroDesc: "Record sales, outflow, and attachments, then follow daily shop movement clearly without accounting-system complexity.",
    ownerLogin: "Owner sign in",
    openOnMobile: "Open the app on your phone",
    qrPrototypeNote: "Prototype code — connected when the live version is deployed",
    fastEntryTitle: "Fast entry",
    fastEntryDesc: "Staff record daily sales and outflow in minutes.",
    clearFollowupTitle: "Clear follow-up",
    clearFollowupDesc: "Owners review movement and the log for every shop in one place.",
    proofLinkedTitle: "Linked proof",
    proofLinkedDesc: "Attach a photo to an operation when needed and review it later.",
    targetBusinessTitle: "Built for shops that need a simple daily closeout",
    targetBusinessDesc: "For restaurants, cafés, small shops, and lounges that need clear daily tracking without turning work into a full accounting system.",
    mobileFirstBadge: "Mobile-first",
    desktopOwnerLater: "Owner desktop dashboard is planned for later development",
    closeLogin: "Close sign in",
    desktopDemoStore: "Al Najah Restaurant",
    desktopDemoLocation: "Main branch",
  },
};

const channels = [
  { id: "cash", text: "cash", icon: Wallet },
  { id: "mada", text: "mada", icon: CreditCard },
  { id: "apple", text: "apple", icon: Smartphone },
  { id: "jahez", text: "jahez", icon: ShoppingBag },
  { id: "hunger", text: "hunger", icon: ShoppingBag },
];

const channelName = (channel, lang) => channel.custom ? (lang === "ar" ? channel.nameAr : channel.nameEn) : text(lang, channel.text);

const expenseCategories = [
  { id: "rent", label: "rent", amount: 8000 },
  { id: "salary", label: "salary", amount: 12000 },
  { id: "utility", label: "utility", amount: 2400 },
  { id: "phone", label: "phone", amount: 650 },
  { id: "maintenance", label: "maintenance", amount: 1200 },
  { id: "other", label: "other", amount: 270 },
];

const outflowReportCategories = [{ id: "all", label: "allCategories" }, { id: "purchases", label: "purchases" }, { id: "withdrawal", label: "withdrawal" }, ...expenseCategories];
const emptyStoreRecord = { sales: 0, expense: 0, ratio: "0.0%", net: 0, proofs: 0, pending: 0 };
const businesses = [
  {
    id: "shami",
    nameKey: "restaurant",
    shortKey: "shamiShort",
    locationKey: "shamiLocation",
    day: { ...emptyStoreRecord },
    month: { ...emptyStoreRecord },
  },
  {
    id: "arz",
    nameAr: "لاونج ARZ",
    nameEn: "ARZ Lounge",
    shortKey: "arzShort",
    locationKey: "arzLocation",
    day: { ...emptyStoreRecord },
    month: { ...emptyStoreRecord },
  },
];
const businessName = (business, lang, short = false) => {
  if (!business) return "";
  if (business.displayName) return business.displayName;
  if (short && business.shortKey) return text(lang, business.shortKey);
  if (business.nameKey) return text(lang, business.nameKey);
  return lang === "ar" ? business.nameAr : business.nameEn;
};
const businessLocation = (business, lang) => business?.locationKey ? text(lang, business.locationKey) : (business?.customLocation || "");
const businessRecord = (business, monthly) => (monthly ? business?.month : business?.day) || emptyStoreRecord;
const combinedTotals = (monthly, storeList = businesses) => storeList.reduce((total, business) => {
  const record = businessRecord(business, monthly);
  return { sales: total.sales + record.sales, expense: total.expense + record.expense, net: total.net + record.net, pending: total.pending + record.pending, proofs: total.proofs + record.proofs };
}, { sales: 0, expense: 0, net: 0, pending: 0, proofs: 0 });
const text = (lang, key) => copy[lang][key] || key;
const money = (value, lang) => {
  const numericValue = Number(value) || 0;
  const sign = numericValue < 0 ? "-" : "";
  const formatted = new Intl.NumberFormat("en-US", { maximumFractionDigits: 2 }).format(Math.abs(numericValue));
  return lang === "ar" ? `${sign}${formatted} ر.س` : `${sign}${formatted} SAR`;
};
const fullDate = (day, lang) => lang === "ar" ? day.fullAr : day.fullEn;
const shortDate = (day, lang) => lang === "ar" ? day.dayAr : day.dayEn;
const opDate = (item, lang) => item.date ? formatCalendarDate(item.date, lang) : (lang === "ar" ? item.dateAr : item.dateEn);
const opTime = (item, lang) => item.createdAt ? new Intl.DateTimeFormat(lang === "ar" ? "ar-SA-u-nu-latn" : "en-US", { hour: "numeric", minute: "2-digit" }).format(new Date(item.createdAt)) : (lang === "ar" ? item.timeAr : item.timeEn);
const auditDateTime = (timestamp, lang) => {
  const date = new Date(timestamp);
  if (Number.isNaN(date.getTime())) return "-";
  return `${formatCalendarDate(timestamp.slice(0, 10), lang)} · ${opTime({ createdAt: timestamp }, lang)}`;
};
const employeeName = (item, lang) => item.enteredBy ? (lang === "ar" ? item.enteredBy.nameAr : item.enteredBy.nameEn) : (lang === "ar" ? item.employeeAr : item.employeeEn);

// طبقة السجل التشغيلي: المصدر الوحيد للأرقام والمرفقات والتقارير داخل البروتايب.
// البنية مقصودة لتنتقل لاحقًا إلى API/DB دون إعادة تصميم الواجهة.
const PROTOTYPE_SUPPORT_WHATSAPP = "966501234567";
const PROTOTYPE_DEMO_OTP = "1234";
const PROTOTYPE_OWNER_USERNAME = "owner";
const PROTOTYPE_OWNER_PASSWORD = "demo123";
const PROTOTYPE_EMPLOYEE_PIN_DEFAULT = "1234";
const CLOSEOUT_ALERTS_STORAGE_KEY = "taqfeelah_closeout_alerts_v1";
const OPERATIONAL_ENTRIES_STORAGE_KEY = "taqfeelah_operational_entries_v3_demo";
const ACKNOWLEDGED_DUPLICATE_SALES_STORAGE_KEY = "taqfeelah_acknowledged_duplicate_sales_v1";
const LAST_CLOSEOUT_STORAGE_KEY = "taqfeelah_last_closeout_dates_v3_demo";
const employeeActorAhmed = { role: "employee", userId: "ahmed", nameAr: "أحمد", nameEn: "Ahmed" };
const employeeActorSara = { role: "employee", userId: "sara", nameAr: "سارة", nameEn: "Sara" };
const entryHasAttachment = (entry) => Boolean(entry.attachment);
const entryIsVoided = (entry) => entry.status === "voided";
const entryIsActive = (entry) => !entryIsVoided(entry);
const OUTFLOW_ENTRY_TYPES = new Set(["purchases", "expense", "withdrawal"]);
const entryIsOutflow = (entry) => OUTFLOW_ENTRY_TYPES.has(entry.type);
const MAX_ENTRY_AMOUNT = 9999999;
const westernizeDigits = (value = "") => String(value).replace(/[٠-٩]/g, (digit) => String("٠١٢٣٤٥٦٧٨٩".indexOf(digit))).replace(/[۰-۹]/g, (digit) => String("۰۱۲۳۴۵۶۷۸۹".indexOf(digit)));
function sanitizeAmountInput(value) {
  const cleaned = westernizeDigits(value).replace(/[٬, ]/g, "").replace(/٫/g, ".").replace(/[^0-9.]/g, "");
  const parts = cleaned.split(".");
  const integer = (parts[0] || "").replace(/^0+(?=[0-9])/, "");
  const decimal = parts.slice(1).join("").slice(0, 2);
  const normalized = parts.length > 1 ? `${integer || "0"}.${decimal}` : integer;
  if (Number(normalized || 0) > MAX_ENTRY_AMOUNT) return String(MAX_ENTRY_AMOUNT);
  return normalized;
}
const toAmount = (value) => {
  const parsed = Number(sanitizeAmountInput(value));
  return Number.isFinite(parsed) && parsed >= 0 ? Math.min(parsed, MAX_ENTRY_AMOUNT) : 0;
};
const newId = (prefix = "entry") => `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
const ownerActor = { role: "owner", userId: "owner", nameAr: "محمد الهاجري", nameEn: "Mohammad Alhajri" };
const MAX_ATTACHMENT_SOURCE_BYTES = 8 * 1024 * 1024;
const MAX_ATTACHMENT_STORED_BYTES = 260 * 1024;
const MAX_ATTACHMENT_EDGE = 1280;
const MIN_ATTACHMENT_QUALITY = 0.38;
const makeAttachment = (id, prepared = null) => prepared ? { ...prepared, id: `attachment-${id}` } : null;
const approximateDataUrlBytes = (value = "") => Math.ceil((value.length * 3) / 4);
async function prepareAttachment(file) {
  if (!file?.type?.startsWith("image/")) throw new Error("invalid");
  if (file.size > MAX_ATTACHMENT_SOURCE_BYTES) throw new Error("large");
  const sourceUrl = URL.createObjectURL(file);
  try {
    const image = await new Promise((resolve, reject) => {
      const element = new Image();
      element.onload = () => resolve(element);
      element.onerror = reject;
      element.src = sourceUrl;
    });
    let scale = Math.min(1, MAX_ATTACHMENT_EDGE / Math.max(image.naturalWidth, image.naturalHeight));
    let quality = 0.8;
    let dataUrl = "";
    for (let attempt = 0; attempt < 9; attempt += 1) {
      const canvas = document.createElement("canvas");
      canvas.width = Math.max(1, Math.round(image.naturalWidth * scale));
      canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));
      const context = canvas.getContext("2d", { alpha: false });
      if (!context) throw new Error("invalid");
      context.drawImage(image, 0, 0, canvas.width, canvas.height);
      dataUrl = canvas.toDataURL("image/jpeg", quality);
      if (approximateDataUrlBytes(dataUrl) <= MAX_ATTACHMENT_STORED_BYTES) break;
      if (quality > MIN_ATTACHMENT_QUALITY) quality -= 0.1;
      else scale *= 0.82;
    }
    const sizeBytes = approximateDataUrlBytes(dataUrl);
    if (sizeBytes > MAX_ATTACHMENT_STORED_BYTES) throw new Error("large");
    return { kind: "image", name: file.name || "attachment.jpg", mimeType: "image/jpeg", sizeBytes, dataUrl };
  } finally {
    URL.revokeObjectURL(sourceUrl);
  }
}

// المرفقات تحفظ خارج LocalStorage حتى لا تتضخم السجلات وتنهار سرعة البروتايب.
const ATTACHMENT_DB_NAME = "taqfeelah_attachment_store";
const ATTACHMENT_STORE_NAME = "images";
function openAttachmentDatabase() {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === "undefined") return reject(new Error("unsupported"));
    const request = indexedDB.open(ATTACHMENT_DB_NAME, 1);
    request.onupgradeneeded = () => { if (!request.result.objectStoreNames.contains(ATTACHMENT_STORE_NAME)) request.result.createObjectStore(ATTACHMENT_STORE_NAME); };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}
async function storeAttachmentPayload(attachment) {
  if (!attachment?.id || !attachment?.dataUrl) return;
  const database = await openAttachmentDatabase();
  await new Promise((resolve, reject) => {
    const transaction = database.transaction(ATTACHMENT_STORE_NAME, "readwrite");
    transaction.objectStore(ATTACHMENT_STORE_NAME).put(attachment.dataUrl, attachment.id);
    transaction.oncomplete = resolve;
    transaction.onerror = () => reject(transaction.error);
  });
  database.close();
}
async function deleteAttachmentPayload(attachmentId) {
  if (!attachmentId) return;
  const database = await openAttachmentDatabase();
  await new Promise((resolve, reject) => {
    const transaction = database.transaction(ATTACHMENT_STORE_NAME, "readwrite");
    transaction.objectStore(ATTACHMENT_STORE_NAME).delete(attachmentId);
    transaction.oncomplete = resolve;
    transaction.onerror = () => reject(transaction.error);
  });
  database.close();
}
async function readAttachmentPayload(attachmentId) {
  if (!attachmentId) return null;
  try {
    const database = await openAttachmentDatabase();
    const result = await new Promise((resolve, reject) => {
      const transaction = database.transaction(ATTACHMENT_STORE_NAME, "readonly");
      const request = transaction.objectStore(ATTACHMENT_STORE_NAME).get(attachmentId);
      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(request.error);
    });
    database.close();
    return result;
  } catch { return null; }
}
function stripEmbeddedAttachmentImages(entries) {
  return entries.map((entry) => entry.attachment ? { ...entry, attachment: { ...entry.attachment, dataUrl: undefined } } : entry);
}
function useAttachmentCapture(lang) {
  const [attachment, setAttachment] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState("");
  const selectAttachment = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    setProcessing(true); setError("");
    try { setAttachment(await prepareAttachment(file)); }
    catch (failure) { setError(text(lang, failure?.message === "invalid" ? "invalidAttachment" : "attachmentTooLarge")); }
    finally { setProcessing(false); }
  };
  const clearAttachment = () => { setAttachment(null); setError(""); };
  return { attachment, processing, error, selectAttachment, clearAttachment };
}
function useAttachmentSource(attachment) {
  const [source, setSource] = useState(attachment?.dataUrl || null);
  useEffect(() => {
    let mounted = true;
    setSource(attachment?.dataUrl || null);
    if (!attachment?.dataUrl && attachment?.id) readAttachmentPayload(attachment.id).then((saved) => { if (mounted) setSource(saved); });
    return () => { mounted = false; };
  }, [attachment?.id, attachment?.dataUrl]);
  return source;
}
function draftNeedsConfirmation(...values) {
  return values.some((value) => value && (typeof value !== "object" || Object.values(value).some(Boolean)));
}
const noteLabel = (entry, lang) => entry.noteKey ? text(lang, entry.noteKey) : (entry.note || text(lang, entry.type));
const entryCategory = (entry) => entry.type === "purchases" ? "purchases" : entry.type === "withdrawal" ? "withdrawal" : (entry.categoryId || "other");
const operationDisplayLabel = (entry, lang) => entry.type === "expense" ? text(lang, expenseCategories.find((item) => item.id === entryCategory(entry))?.label || "other") : text(lang, entry.type);
const signedEntryAmount = (entry) => entry.type === "summary" ? entry.amount : -entry.amount;
const entryWasRestored = (entry) => Boolean(entry.restoredAt);
const duplicateSalesGroupKey = (group) => `${group.businessId}|${group.date}`;
const duplicateSalesSignature = (entries = []) => entries.map((entry) => entry.id).sort().join("|");
const entryDateMatches = (entry, period, selectedDate, selectedMonth, selectedYear, customFrom, customTo) => {
  if (period === "day") return entry.date === selectedDate;
  if (period === "month") return entry.date.startsWith(monthSelectionValue(selectedMonth));
  if (period === "year") return entry.date.startsWith(`${selectedYear}-`);
  return entry.date >= customFrom && entry.date <= customTo;
};
function isoDaysAgo(days) {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return isoCalendarDate(date.getFullYear(), date.getMonth(), date.getDate());
}
function entryCreatedAt(isoDate, hour, minute = 0) {
  const stamp = new Date(`${isoDate}T12:00:00`);
  stamp.setHours(hour, minute, 0, 0);
  return stamp.toISOString();
}
function demoAttachment(id) {
  return { id, kind: "image", name: "receipt.jpg", mimeType: "image/jpeg", sizeBytes: 18400 };
}
function createDemoOperationalEntry(partial) {
  const id = partial.id || newId(partial.type);
  const createdAt = partial.createdAt || entryCreatedAt(partial.date, 12, 0);
  const amount = partial.amount ?? (partial.type === "summary"
    ? (partial.salesChannels || []).reduce((sum, row) => sum + row.amount, 0)
    : toAmount(partial.amountInput ?? 0));
  return {
    id,
    businessId: partial.businessId,
    date: partial.date,
    createdAt,
    type: partial.type,
    categoryId: partial.categoryId || null,
    amount,
    salesChannels: partial.salesChannels || [],
    note: partial.note || "",
    noteKey: partial.noteKey || null,
    enteredBy: partial.enteredBy || ownerActor,
    attachment: partial.attachment ? { ...partial.attachment, id: partial.attachment.id || `attachment-${id}` } : null,
    reviewed: partial.reviewed ?? false,
    status: partial.status || "active",
    voidedAt: partial.voidedAt || null,
    voidedBy: partial.voidedBy || null,
    voidReason: partial.voidReason || "",
    restoredAt: partial.restoredAt || null,
    restoredBy: partial.restoredBy || null,
    restoreReason: partial.restoreReason || "",
    auditTrail: partial.auditTrail || [{ action: "created", at: createdAt, by: partial.enteredBy || ownerActor, reason: "" }],
  };
}
function createDemoOperationalEntries() {
  const today = todayIsoDate();
  const yesterday = isoDaysAgo(1);
  const twoDaysAgo = isoDaysAgo(2);
  const shamiChannelsMorning = [
    { channelId: "cash", name: "نقدي", amount: 2850 },
    { channelId: "mada", name: "مدى", amount: 3920 },
    { channelId: "apple", name: "Apple Pay", amount: 760 },
    { channelId: "jahez", name: "جاهز", amount: 980 },
    { channelId: "hunger", name: "هنقرستيشن", amount: 540 },
  ];
  const shamiChannelsAfternoon = [
    { channelId: "cash", name: "نقدي", amount: 420 },
    { channelId: "mada", name: "مدى", amount: 680 },
  ];
  const shamiChannelsYesterday = [
    { channelId: "cash", name: "نقدي", amount: 3100 },
    { channelId: "mada", name: "مدى", amount: 3650 },
    { channelId: "jahez", name: "جاهز", amount: 1120 },
  ];
  const arzChannelsToday = [
    { channelId: "cash", name: "نقدي", amount: 1640 },
    { channelId: "mada", name: "مدى", amount: 2180 },
    { channelId: "apple", name: "Apple Pay", amount: 520 },
  ];
  return [
    createDemoOperationalEntry({
      id: "demo-shami-summary-today-1",
      businessId: "shami",
      date: today,
      type: "summary",
      createdAt: entryCreatedAt(today, 14, 20),
      enteredBy: employeeActorAhmed,
      salesChannels: shamiChannelsMorning,
      noteKey: "salesSummary",
      reviewed: true,
    }),
    createDemoOperationalEntry({
      id: "demo-shami-summary-today-2",
      businessId: "shami",
      date: today,
      type: "summary",
      createdAt: entryCreatedAt(today, 22, 5),
      enteredBy: ownerActor,
      salesChannels: shamiChannelsAfternoon,
      note: "تقفيلة إضافية بعد السحب على مدى",
      reviewed: true,
    }),
    createDemoOperationalEntry({
      id: "demo-shami-summary-yesterday",
      businessId: "shami",
      date: yesterday,
      type: "summary",
      createdAt: entryCreatedAt(yesterday, 23, 10),
      enteredBy: employeeActorAhmed,
      salesChannels: shamiChannelsYesterday,
      noteKey: "salesSummary",
      reviewed: true,
    }),
    createDemoOperationalEntry({
      id: "demo-shami-purchases-today",
      businessId: "shami",
      date: today,
      type: "purchases",
      createdAt: entryCreatedAt(today, 11, 15),
      enteredBy: employeeActorAhmed,
      amountInput: 315,
      note: "لحم ودجاج للمطبخ",
      attachment: demoAttachment("demo-att-shami-meat"),
      reviewed: false,
    }),
    createDemoOperationalEntry({
      id: "demo-shami-expense-today",
      businessId: "shami",
      date: today,
      type: "expense",
      categoryId: "utility",
      createdAt: entryCreatedAt(today, 10, 40),
      enteredBy: ownerActor,
      amountInput: 420,
      note: "فاتورة كهرباء جزئية",
      reviewed: true,
    }),
    createDemoOperationalEntry({
      id: "demo-shami-expense-2days",
      businessId: "shami",
      date: twoDaysAgo,
      type: "expense",
      categoryId: "rent",
      createdAt: entryCreatedAt(twoDaysAgo, 9, 30),
      enteredBy: ownerActor,
      amountInput: 8000,
      noteKey: "rentMay",
      reviewed: true,
    }),
    createDemoOperationalEntry({
      id: "demo-shami-voided-sample",
      businessId: "shami",
      date: yesterday,
      type: "expense",
      categoryId: "other",
      createdAt: entryCreatedAt(yesterday, 16, 0),
      enteredBy: ownerActor,
      amountInput: 95,
      note: "قيد مكرر — ملغى",
      status: "voided",
      voidedAt: entryCreatedAt(yesterday, 16, 45),
      voidedBy: ownerActor,
      voidReason: "إدخال مكرر بالخطأ",
      auditTrail: [
        { action: "created", at: entryCreatedAt(yesterday, 16, 0), by: ownerActor, reason: "" },
        { action: "voided", at: entryCreatedAt(yesterday, 16, 45), by: ownerActor, reason: "إدخال مكرر بالخطأ" },
      ],
    }),
    createDemoOperationalEntry({
      id: "demo-arz-summary-today",
      businessId: "arz",
      date: today,
      type: "summary",
      createdAt: entryCreatedAt(today, 21, 40),
      enteredBy: employeeActorSara,
      salesChannels: arzChannelsToday,
      noteKey: "salesSummary",
      reviewed: true,
    }),
    createDemoOperationalEntry({
      id: "demo-arz-summary-yesterday",
      businessId: "arz",
      date: yesterday,
      type: "summary",
      createdAt: entryCreatedAt(yesterday, 22, 30),
      enteredBy: employeeActorSara,
      salesChannels: [
        { channelId: "cash", name: "نقدي", amount: 1420 },
        { channelId: "mada", name: "مدى", amount: 1980 },
      ],
      noteKey: "salesSummary",
      reviewed: true,
    }),
    createDemoOperationalEntry({
      id: "demo-arz-expense-today",
      businessId: "arz",
      date: today,
      type: "expense",
      categoryId: "salary",
      createdAt: entryCreatedAt(today, 13, 5),
      enteredBy: ownerActor,
      amountInput: 2200,
      note: "سلفة موظف استقبال",
      reviewed: true,
    }),
    createDemoOperationalEntry({
      id: "demo-arz-purchases-yesterday",
      businessId: "arz",
      date: yesterday,
      type: "purchases",
      createdAt: entryCreatedAt(yesterday, 12, 20),
      enteredBy: employeeActorSara,
      amountInput: 540,
      note: "مستلزمات ضيافة",
      attachment: demoAttachment("demo-att-arz-supplies"),
      reviewed: false,
    }),
    createDemoOperationalEntry({
      id: "demo-arz-withdrawal-today",
      businessId: "arz",
      date: today,
      type: "withdrawal",
      createdAt: entryCreatedAt(today, 18, 0),
      enteredBy: ownerActor,
      amountInput: 500,
      note: "سحب نقدي للصندوق",
      reviewed: true,
    }),
  ];
}
function readOperationalEntries() {
  if (typeof window === "undefined") return createDemoOperationalEntries();
  try {
    const stored = JSON.parse(window.localStorage.getItem(OPERATIONAL_ENTRIES_STORAGE_KEY) || "null");
    if (!Array.isArray(stored) || stored.length === 0) {
      const demo = createDemoOperationalEntries();
      window.localStorage.setItem(OPERATIONAL_ENTRIES_STORAGE_KEY, JSON.stringify(stripEmbeddedAttachmentImages(demo)));
      return demo;
    }
    return stored.map((entry) => ({
      ...entry,
      auditTrail: Array.isArray(entry.auditTrail) && entry.auditTrail.length
        ? entry.auditTrail
        : [{ action: "created", at: entry.createdAt || new Date().toISOString(), by: entry.enteredBy || ownerActor, reason: "" }],
    }));
  } catch {
    const demo = createDemoOperationalEntries();
    window.localStorage.setItem(OPERATIONAL_ENTRIES_STORAGE_KEY, JSON.stringify(stripEmbeddedAttachmentImages(demo)));
    return demo;
  }
}
function readDemoLastCloseoutDates() {
  const today = todayIsoDate();
  return { shami: today, arz: today };
}
function readAcknowledgedDuplicateSales() {
  if (typeof window === "undefined") return {};
  try {
    const stored = JSON.parse(window.localStorage.getItem(ACKNOWLEDGED_DUPLICATE_SALES_STORAGE_KEY) || "null");
    return stored && typeof stored === "object" ? stored : {};
  } catch { return {}; }
}
function readCloseoutAlerts() {
  if (typeof window === "undefined") return [];
  try {
    const stored = JSON.parse(window.localStorage.getItem(CLOSEOUT_ALERTS_STORAGE_KEY) || "[]");
    return Array.isArray(stored) ? stored : [];
  } catch { return []; }
}
function writeCloseoutAlerts(alerts) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(CLOSEOUT_ALERTS_STORAGE_KEY, JSON.stringify(alerts));
}
function openWhatsAppSupport(lang) {
  window.open(`https://wa.me/${PROTOTYPE_SUPPORT_WHATSAPP}?text=${encodeURIComponent(lang === "ar" ? "مرحبًا، أحتاج دعم تقفيلة" : "Hello, I need Taqfeelah support")}`, "_blank");
}
function employeePinMatches(person, pin) {
  return `${pin}`.trim() === `${person?.pin || PROTOTYPE_EMPLOYEE_PIN_DEFAULT}`.trim();
}
function entriesInPeriod(entries, businessId, period, selectedDate, selectedMonth, selectedYear = "2026", customFrom = "2026-01-01", customTo = "2026-12-31") {
  return entries.filter((entry) => (!businessId || entry.businessId === businessId) && entryDateMatches(entry, period, selectedDate, selectedMonth, selectedYear, customFrom, customTo));
}
function summarizeEntries(entries, reviewEnabledForBusiness = () => true) {
  const activeEntries = entries.filter(entryIsActive);
  const sales = activeEntries.filter((entry) => entry.type === "summary").reduce((sum, entry) => sum + entry.amount, 0);
  const expense = activeEntries.filter(entryIsOutflow).reduce((sum, entry) => sum + entry.amount, 0);
  const proofs = activeEntries.filter(entryHasAttachment).length;
  const pending = activeEntries.filter((entry) => entryHasAttachment(entry) && !entry.reviewed && reviewEnabledForBusiness(entry.businessId)).length;
  const ratio = sales > 0 ? `${((expense / sales) * 100).toFixed(1)}%` : expense > 0 ? "—" : "0.0%";
  return { sales, expense, net: sales - expense, ratio, proofs, pending };
}
function summaryDayFromEntries(entries, businessId, date, reviewEnabledForBusiness = () => true) {
  return { id: date, dayAr: formatCalendarDate(date, "ar"), dayEn: formatCalendarDate(date, "en"), fullAr: formatCalendarDate(date, "ar"), fullEn: formatCalendarDate(date, "en"), ...summarizeEntries(entriesInPeriod(entries, businessId, "day", date, "2026-05"), reviewEnabledForBusiness) };
}
function summaryMonthFromEntries(entries, businessId, month, reviewEnabledForBusiness = () => true) {
  return summarizeEntries(entriesInPeriod(entries, businessId, "month", "", month), reviewEnabledForBusiness);
}
function aggregateChannels(entries, businessId, period, selectedDate, selectedMonth, baseChannels = []) {
  const relevant = entriesInPeriod(entries, businessId, period, selectedDate, selectedMonth).filter((entry) => entry.type === "summary" && entryIsActive(entry));
  const mapped = new Map(baseChannels.map((channel) => [channel.id, { ...channel, amount: 0 }]));
  relevant.forEach((entry) => (entry.salesChannels || []).forEach((row) => {
    const current = mapped.get(row.channelId) || { id: row.channelId, custom: true, nameAr: row.name || row.channelId, nameEn: row.name || row.channelId, amount: 0 };
    mapped.set(row.channelId, { ...current, amount: current.amount + row.amount });
  }));
  return [...mapped.values()].filter((channel) => channel.amount > 0);
}
function operationTime(item, lang) {
  if (!item.createdAt) return opTime(item, lang);
  return new Intl.DateTimeFormat(lang === "ar" ? "ar-SA-u-nu-latn" : "en-US", { hour: "numeric", minute: "2-digit" }).format(new Date(item.createdAt));
}
function buildEntry(payload, actor) {
  const id = newId(payload.type);
  const createdAt = new Date().toISOString();
  const amount = payload.type === "summary" ? (payload.salesChannels || []).reduce((sum, row) => sum + row.amount, 0) : toAmount(payload.amount);
  return { id, businessId: payload.businessId, date: payload.date, createdAt, type: payload.type, categoryId: payload.categoryId || null, amount, salesChannels: payload.salesChannels || [], note: payload.note?.trim() || "", noteKey: payload.noteKey || null, enteredBy: actor, attachment: payload.attachment ? makeAttachment(id, payload.attachment) : null, reviewed: false, status: "active", voidedAt: null, voidedBy: null, voidReason: "", restoredAt: null, restoredBy: null, restoreReason: "", auditTrail: [{ action: "created", at: createdAt, by: actor, reason: "" }] };
}
function newestEntries(entries) {
  return [...entries].sort((a, b) => `${b.date}|${b.createdAt || ""}`.localeCompare(`${a.date}|${a.createdAt || ""}`));
}
function attachmentsFromEntries(entries) {
  const grouped = new Map();
  newestEntries(entries.filter(entryHasAttachment)).forEach((entry) => {
    if (!grouped.has(entry.date)) grouped.set(entry.date, []);
    grouped.get(entry.date).push({ id: entry.attachment.id, entryId: entry.id, title: noteLabel(entry, "ar"), titleEn: noteLabel(entry, "en"), amount: entry.amount, reviewed: entry.reviewed, businessId: entry.businessId, attachment: entry.attachment, entry });
  });
  return [...grouped.entries()].map(([date, items]) => ({ dayId: date, date, items }));
}

function Badge({ children, tone = "neutral" }) {
  const themes = { neutral: "bg-[#F0ECE2] text-[#655B45]", success: "bg-[#E6F5E9] text-[#257844]", warning: "bg-[#FFF0E2] text-[#B96725]", navy: "bg-[#E7EEF5] text-[#112A46]" };
  return <span className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${themes[tone]}`}>{children}</span>;
}

const TAQFEELAH_LOGO_PNG = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAIQAAAA9CAMAAABbXzEoAAABgFBMVEUAAAAFFzEUGCYAADwIFiwAAFQJFSoOFykIFi3wqCIKFSn//wAZGSb+tSUYGBwmGCb/fwDzoxr9qQb/AADxnRjymxcxGhr1oxvxpB0pJSbwoxzxpB3ypyEYIisOEh3/vwA5OTnvpiIxAAB/fwAAAH83NwXxph7ypyEKDB7rmyIDDSlVAAB/AAC/fwrvpiLtoiAAPz8rKCtVKipNNhZVVQBmMwBmZjO/fz/ZfwDsoCH/qlUKDyMEDyUADzIbIiw/AD8qKhwwLCggJC5ISCRVVSp/Pz9/VSpuUyWfXx+ZZjOqVQC+gyWqqgDMZgDXiRPPjx/KjCPfnx/elhrfmiL/VQD/fz/ynxzxnSDwpB75rSD/vz//siL/tiD/wCYAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAACcWlEcAAAAgHRSTlMA+zIErwOQUtD4cQEW/hQSArIGASQTDC9zEU2Ozxw2BASPBQICBdCrOhqLAwIIFm4ELwYLAwUFBAc9AzJ0/0oEEqj3BwYEBrEIBQNfAwUNMB0IJ1EDBHY3514Ef7P/AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAG6gIdQAAAWoSURBVHja7VkHd+MoEEYIAUJYlqVIctvETjbJZpPtfa/s9d57/f9/46gSSPHGaed373ZewqNp5mOAYWYMwBv6r1H0/1pukoM8AVkC8p4aGFuPRZYn+TWhIyjAIFxnGU3RHdjZyVWZub25auZOZ1aUo/msLOrRfFzsOVMhCoL1QGSgPjycguw1CF2ISdNsvkiK0SAezPIDUY7BnXYvJIa1QOwVeTwYxHUPRQLK8eyF2O7xbKtFUYB6WoM9MP39qJ34fRzHg3kpy8OWzzlA3AHTgfj4HvjD7y/2ygMFbiTKrSKzAmeiOVVl3egyUZr4WWpi2p7Nc4DIwZZcwbR7sHPwQvbPjmQ5BjtmB9RyR7kq2+0oZwczwWh0MHZ2zoC4vd6ZGMfxLE963QrcuHQhZuCuEl96IFaaqbU1IaksV4Eb5aosM/Ca7QDh4vO9Z8JOvEyeXRRE+CEAH93vm9cClFsALMB3P3id0/GWAChLQzcvr4lotZV/2tTud26UwGKvqPgKMoxoQ8QyWgXitNekIhghxMjD/tCjd+UQJlXfWIHkqWuRHCJW6EpNQIR8JBW2H1NWdLaDUTuGq+5aCJ3oOguC84FIhUQfBKTO54h7k90VUthZSxBwJQcHZ4HoXFGiJLkgoP89TdshbuBZlA4KrphzKcboARPIOSdnayICtAuCawXAtIJ6RXTXTn6s9cB4lWpBdGgvk16M0gS0i3eWdAYI5IOwHSetmgKmR0OzROgwZ4aZCwJ5Yi8CwnzE1aTQ7K5Z79DhZxENe5rQDJCVcgEQRmzDghsWkZyq5NAF6A21IMT5wb7UC2kCuVoG+sioTxp8kTGJLjcHBG325cIgjqlzqLzhyMdnMPVB6GM5uQyIXepevWb1rVY6INAKEOllQBTU2WlvC9bVxOW3I+qeCdQ9E7jBixzuDgh07oN5s3c7mNfmrmEknulKT7uiqX03ulc0Cu1E5C+l7XNuR2rEOnaCLtRoNKE9O2FXFEYNiKFnMMF72oS3L6BiQv03W5vfJ22PYk65YzGJ984YvRDPbBvzQE/aJxTDIU9T+6brlnhKTBuJNk+rVPRBYp4iRDgfaqrUNCo6zNuBJ2JIPEVDPtEdDA6hlkRS+QUfpnaqUEy0T4ONEvfe2s2QvdmV51DgjpcVoL6/0Z90cQytT4KtNhCUHpfrnxAVEvuwoHDZrgAGZann6lUQbt/ahlz7sCkUTShpoocn8JYYhduy88FET5rASxJf5a9HPVc6Ot27v5LsTXi+6Y/3Pxsv733y5M748N5JsqE8Tg6Wg8FgCQ5FOQb5RjAkQMbP8fxIlcWmMlrZfCDzF7/JclU25vpVUc/j+a9gKhRRF19sSBUFeF4/F1i+qb/eYIoxU/9fuYmujRyLQlqHZLHxlOtu+i8JUikK4w2J8IWyxjzqpOau8fKwnIZNkCOqNg7W9UoH28ixs5Di1XpuSDUXjAneDDa+Ka1aLxiLhwstbFzMGCPWzRR1pqN8ImYxtms8Qd9BTntCV8LCgRP0s0YpSLlppi1A0PYNYEEriwQfOzEI8FitSjy9LLc01Sb3FoY4mIQWPZV/JrhF4NsfRajSxBQIoVQLeztQWSYDwtZdEKqOg4f6vh/VrlBhkEeWftG3T06vmhAWbzOhgEjXby7/Xoba79Ug8L7VBMYYWhDI1CWnY4tiKFgRrcUcTBuhNfjp9AcWB4/ckMm49/tS+p+D+Qe38zO2Y7+/HTYvQNd8eBxNTIQXBYVbDIHO6SAYfhrHX5qDSV+FUSOBiImpAUFuwUYTovstHTxIVlar64OQvKHeB32e5GLeef+vwfJulkTNWfETMlEbWDWa1OGWPCbHnYTba2ho7yfXkQq/YduEPABgGd+V+W/ehjHC17shSJ9mLurQfCEqE851zQxeyS9yQny54R8GxWKLBBRg85SAN3Qt9A/eqlRU0akAHAAAAABJRU5ErkJggg==";

function Logo({ compact = false, centered = false }) {
  return (
    <div className={`shrink-0 ${centered ? "flex justify-center" : "flex items-center"}`}>
      <img
        src={TAQFEELAH_LOGO_PNG}
        alt="تقفيلة - TAQFEELAH"
        draggable={false}
        className={`select-none object-contain ${compact ? "h-[44px] w-[132px]" : "h-[68px] w-[176px]"}`}
      />
    </div>
  );
}

function LanguageSwitch({ lang, setLang }) {
  return (
    <div className="flex shrink-0 items-center gap-1 rounded-full bg-white p-1 ring-1 ring-black/[0.05]">
      <button onClick={() => setLang("ar")} className={`rounded-full px-1.5 py-1 text-[10px] font-black ${lang === "ar" ? "bg-[#112A46] text-white" : "text-[#827762]"}`}>ع</button>
      <button onClick={() => setLang("en")} className={`rounded-full px-1.5 py-1 text-[10px] font-black ${lang === "en" ? "bg-[#112A46] text-white" : "text-[#827762]"}`}>EN</button>
    </div>
  );
}

function LoginScreen({ lang, setLang, onOwnerLogin, onEmployeePortal }) {
  const [method, setMethod] = useState("phone");
  const [stage, setStage] = useState("phone");
  const [phone, setPhone] = useState("501234567");
  const [code, setCode] = useState("");
  const [username, setUsername] = useState(PROTOTYPE_OWNER_USERNAME);
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const submitOtp = () => {
    if (`${code}`.trim() !== PROTOTYPE_DEMO_OTP) { setError(text(lang, "invalidOtp")); return; }
    setError("");
    onOwnerLogin();
  };
  const submitPassword = () => {
    if (username.trim().toLowerCase() !== PROTOTYPE_OWNER_USERNAME || password !== PROTOTYPE_OWNER_PASSWORD) {
      setError(text(lang, "invalidCredentials"));
      return;
    }
    setError("");
    onOwnerLogin();
  };
  return (
    <motion.section initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex min-h-[800px] flex-col px-6 pb-8 pt-10">
      <div className="flex justify-end"><LanguageSwitch lang={lang} setLang={setLang} /></div>
      <div className="mt-16 flex justify-center"><Logo lang={lang} /></div>
      <div className="mt-10 text-center">
        <h1 className="text-2xl font-black text-[#112A46]">{text(lang, "loginTitle")}</h1>
        <p className="mx-auto mt-3 max-w-[280px] text-sm leading-6 text-[#827762]">{text(lang, "loginSubtitle")}</p>
      </div>
      <div className="mt-6 grid grid-cols-2 gap-2">
        <button type="button" onClick={() => { setMethod("phone"); setError(""); }} className={`rounded-2xl py-2.5 text-[10px] font-black ${method === "phone" ? "bg-[#112A46] text-white" : "bg-white text-[#716753] ring-1 ring-black/[0.05]"}`}>{text(lang, "loginWithPhone")}</button>
        <button type="button" onClick={() => { setMethod("password"); setError(""); }} className={`rounded-2xl py-2.5 text-[10px] font-black ${method === "password" ? "bg-[#112A46] text-white" : "bg-white text-[#716753] ring-1 ring-black/[0.05]"}`}>{text(lang, "loginWithPassword")}</button>
      </div>
      <div className="mt-4 rounded-[28px] bg-white p-5 shadow-sm ring-1 ring-black/[0.045]">
        {method === "phone" ? (
          stage === "phone" ? (
            <>
              <p className="mb-2 text-xs font-bold text-[#716753]">{text(lang, "mobileNumber")}</p>
              <div dir="ltr" className="flex items-center gap-3 rounded-2xl bg-[#F7F5EF] px-4 py-4 ring-1 ring-[#E8E1D4]">
                <Smartphone className="h-5 w-5 text-[#B99844]" />
                <span className="border-r border-[#DDD3C0] pr-3 text-sm font-black text-[#112A46]">+966</span>
                <input value={phone} onChange={(event) => setPhone(event.target.value)} className="min-w-0 flex-1 bg-transparent text-sm font-black outline-none" />
              </div>
              <p className="mt-2 text-[11px] font-bold text-[#827762]">{text(lang, "mobileHint")}</p>
              <button type="button" onClick={() => { setStage("code"); setError(""); }} className="mt-5 w-full rounded-2xl bg-[#112A46] py-4 text-sm font-black text-white">{text(lang, "sendCode")}</button>
            </>
          ) : (
            <>
              <p className="text-xs font-bold text-[#716753]">{text(lang, "verificationCode")}</p>
              <p className="mt-2 text-[11px] font-bold text-[#827762]">{text(lang, "codeSentTo")} <span dir="ltr" className="text-[#112A46]">+966 {phone}</span></p>
              <input dir="ltr" value={code} onChange={(event) => setCode(event.target.value)} placeholder="• • • •" className="mt-4 w-full rounded-2xl bg-[#F7F5EF] px-4 py-4 text-center text-xl font-black tracking-[0.45em] outline-none ring-1 ring-[#E8E1D4]" />
              <button type="button" onClick={submitOtp} className="mt-5 w-full rounded-2xl bg-[#39A160] py-4 text-sm font-black text-white">{text(lang, "verifyContinue")}</button>
              <button type="button" onClick={() => { setStage("phone"); setError(""); }} className="mt-4 w-full text-xs font-black text-[#9A823E]">{text(lang, "changeNumber")}</button>
            </>
          )
        ) : (
          <>
            <p className="mb-2 text-xs font-bold text-[#716753]">{text(lang, "username")}</p>
            <input dir="ltr" value={username} onChange={(event) => setUsername(event.target.value)} autoComplete="username" className="mb-3 w-full rounded-2xl bg-[#F7F5EF] px-4 py-3.5 text-sm font-black outline-none ring-1 ring-[#E8E1D4]" />
            <p className="mb-2 text-xs font-bold text-[#716753]">{text(lang, "password")}</p>
            <input dir="ltr" type="password" value={password} onChange={(event) => setPassword(event.target.value)} autoComplete="current-password" className="w-full rounded-2xl bg-[#F7F5EF] px-4 py-3.5 text-sm font-black outline-none ring-1 ring-[#E8E1D4]" />
            <button type="button" onClick={submitPassword} className="mt-5 w-full rounded-2xl bg-[#39A160] py-4 text-sm font-black text-white">{text(lang, "verifyContinue")}</button>
          </>
        )}
        {error && <p className="mt-3 rounded-xl bg-[#FFF1EE] p-2.5 text-center text-[10px] font-bold text-[#B44747]">{error}</p>}
      </div>
      <button type="button" onClick={onEmployeePortal} className="mt-4 w-full rounded-2xl bg-white py-3.5 text-xs font-black text-[#112A46] ring-1 ring-black/[0.06]">{text(lang, "employeeLogin")}</button>
      <div className="mt-4 rounded-2xl bg-[#FFF4D2] p-4 text-center">
        <p className="text-[11px] font-black leading-5 text-[#806528]">{text(lang, "prototypeDemoAccess")}</p>
        <p className="mt-1 text-[10px] font-bold text-[#957D43]">{text(lang, "linkedAccountNote")}</p>
        <p className="mt-2 border-t border-[#E4C66B]/45 pt-2 text-[10px] font-bold text-[#957D43]">{text(lang, "futureLoginOnLoginScreen")}</p>
      </div>
      <p className="mt-3 text-center text-[10px] font-bold text-[#827762]">
        {text(lang, "prototypeBuildLabel")}: <span dir="ltr" className="font-black text-[#112A46]">{PROTOTYPE_BUILD_STAMP}</span>
      </p>
    </motion.section>
  );
}

function EmployeeLoginScreen({ lang, setLang, staff = [], onBack, onLogin }) {
  const [selectedId, setSelectedId] = useState("");
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const activeStaff = staff.filter((person) => person.active && !person.removed);
  useEffect(() => {
    if (!selectedId && activeStaff[0]) setSelectedId(activeStaff[0].id);
  }, [activeStaff, selectedId]);
  const submit = () => {
    const person = activeStaff.find((item) => item.id === selectedId);
    if (!person) { setError(text(lang, "noActiveEmployee")); return; }
    if (!employeePinMatches(person, pin)) { setError(text(lang, "invalidEmployeePin")); return; }
    setError("");
    onLogin(person.id);
  };
  return (
    <motion.section initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex min-h-[800px] flex-col px-6 pb-8 pt-10">
      <div className="flex justify-end"><LanguageSwitch lang={lang} setLang={setLang} /></div>
      <div className="mt-16 flex justify-center"><Logo lang={lang} /></div>
      <div className="mt-10 text-center">
        <h1 className="text-2xl font-black text-[#112A46]">{text(lang, "employeeLogin")}</h1>
        <p className="mx-auto mt-3 max-w-[280px] text-sm leading-6 text-[#827762]">{text(lang, "employeeLoginSubtitle")}</p>
      </div>
      <div className="mt-8 rounded-[28px] bg-white p-5 shadow-sm ring-1 ring-black/[0.045]">
        <p className="mb-2 text-xs font-bold text-[#716753]">{text(lang, "employee")}</p>
        <div className="mb-4 flex flex-wrap gap-2">
          {activeStaff.map((person) => (
            <button key={person.id} type="button" onClick={() => setSelectedId(person.id)} className={`rounded-full px-3 py-2 text-[10px] font-black ${selectedId === person.id ? "bg-[#112A46] text-white" : "bg-[#F7F5EF] text-[#716753] ring-1 ring-[#E8E1D4]"}`}>
              {lang === "ar" ? person.nameAr : person.nameEn}
            </button>
          ))}
        </div>
        <p className="mb-2 text-xs font-bold text-[#716753]">{text(lang, "employeePin")}</p>
        <input dir="ltr" inputMode="numeric" value={pin} onChange={(event) => setPin(event.target.value)} placeholder="• • • •" className="w-full rounded-2xl bg-[#F7F5EF] px-4 py-4 text-center text-xl font-black tracking-[0.45em] outline-none ring-1 ring-[#E8E1D4]" />
        <p className="mt-2 text-[10px] font-bold text-[#827762]">{text(lang, "employeePinHint")}</p>
        <button type="button" onClick={submit} className="mt-5 w-full rounded-2xl bg-[#39A160] py-4 text-sm font-black text-white">{text(lang, "verifyContinue")}</button>
        {error && <p className="mt-3 rounded-xl bg-[#FFF1EE] p-2.5 text-center text-[10px] font-bold text-[#B44747]">{error}</p>}
      </div>
      <button type="button" onClick={onBack} className="mt-4 w-full text-xs font-black text-[#9A823E]">{text(lang, "backToOwnerLogin")}</button>
    </motion.section>
  );
}

function HelpCenterSheet({ lang, open, onClose }) {
  if (!open) return null;
  return (
    <AnimatePresence>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 z-[80] flex items-end bg-[#112A46]/45 sm:items-center sm:justify-center sm:p-6">
        <button type="button" onClick={onClose} className="absolute inset-0" aria-label={text(lang, "close")} />
        <motion.div initial={{ y: 16 }} animate={{ y: 0 }} exit={{ y: 16 }} className="relative z-10 w-full max-w-md rounded-t-[28px] bg-[#F8F6F0] p-5 sm:rounded-[28px]">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-base font-black">{text(lang, "helpCenterTitle")}</h3>
            <button type="button" onClick={onClose} className="flex h-9 w-9 items-center justify-center rounded-xl bg-white"><X className="h-4 w-4" /></button>
          </div>
          <p className="text-[12px] font-bold leading-6 text-[#716753]">{text(lang, "helpCenterBody")}</p>
          <p className="mt-3 rounded-xl bg-white px-3 py-2 text-center text-[10px] font-black text-[#112A46] ring-1 ring-black/[0.06]">
            {text(lang, "prototypeBuildLabel")}: <span dir="ltr">{PROTOTYPE_BUILD_STAMP}</span>
          </p>
          <button type="button" onClick={() => { openWhatsAppSupport(lang); onClose(); }} className="mt-4 w-full rounded-2xl bg-[#25D366] py-3.5 text-xs font-black text-white">{text(lang, "whatsappSupport")}</button>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

function TopBar({ lang, setLang, employee, onRoleChange, onLogout = () => {}, onNotifications = () => {}, reviewEnabled = true, notebookMode = false }) {
  const [accountMenuOpen, setAccountMenuOpen] = useState(false);
  const accountMenuRef = useRef(null);
  useEffect(() => {
    if (!accountMenuOpen) return undefined;
    const closeOutside = (event) => { if (accountMenuRef.current && !accountMenuRef.current.contains(event.target)) setAccountMenuOpen(false); };
    const closeEscape = (event) => { if (event.key === "Escape") setAccountMenuOpen(false); };
    document.addEventListener("pointerdown", closeOutside);
    document.addEventListener("keydown", closeEscape);
    return () => { document.removeEventListener("pointerdown", closeOutside); document.removeEventListener("keydown", closeEscape); };
  }, [accountMenuOpen]);
  return (
    <header dir="ltr" className={`taq-topbar sticky top-0 z-40 h-[70px] shrink-0 bg-transparent px-5 pb-2 pt-4`}>
      <div className={`absolute top-[22px] flex h-10 w-10 items-center justify-center ${lang === "ar" ? "left-[14px]" : "right-[14px]"}`}>
        {!employee ? (
          <button onClick={onNotifications} className="relative flex h-9 w-9 items-center justify-center text-[#112A46]">
            <Bell className="h-5 w-5" />
            {reviewEnabled && <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-[#CE4642]" />}
          </button>
        ) : <LanguageSwitch lang={lang} setLang={setLang} />}
      </div>
      <div className="absolute left-1/2 top-[15px] -translate-x-1/2"><Logo compact centered /></div>
      <div className={`absolute top-[22px] flex h-10 w-10 items-center justify-center ${lang === "ar" ? "right-[36px]" : "left-[36px]"}`}>
        {employee ? (
          <span className="h-9 w-9" aria-hidden />
        ) : (
          <div ref={accountMenuRef} className="relative">
            <button onClick={() => setAccountMenuOpen((open) => !open)} aria-label={text(lang, "account")} aria-expanded={accountMenuOpen} aria-haspopup="menu" className={`flex h-9 w-9 items-center justify-center rounded-full text-[#112A46] transition ${accountMenuOpen ? "text-[#9A823E]" : ""}`}>
              <UserRound className="h-[21px] w-[21px]" strokeWidth={2} />
            </button>
            <AnimatePresence>
              {accountMenuOpen && (
                <motion.div dir={lang === "ar" ? "rtl" : "ltr"} initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }} role="menu" className={`absolute top-[44px] z-50 w-[126px] overflow-hidden rounded-xl bg-white p-1.5 shadow-lg ring-1 ring-black/[0.06] ${lang === "ar" ? "right-0" : "left-0"}`}>
                  <div className="flex justify-center px-1 py-1.5"><LanguageSwitch lang={lang} setLang={setLang} /></div>
                  <div className="my-1 border-t border-[#F0ECE2]" />
                  <button role="menuitem" onClick={() => { setAccountMenuOpen(false); onLogout(); }} className="flex w-full items-center justify-center rounded-lg px-2 py-2.5 text-[10px] font-black text-[#B44747] transition hover:bg-[#FFF1EE]">
                    <span>{text(lang, "logout")}</span>
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}
      </div>
    </header>
  );
}

function InkTab({ active, children, onClick, className = "", titleUnderline = false, showActiveUnderline = true }) {
  return (
    <button onClick={onClick} className={`relative pb-2 text-xs font-black transition ${active ? "text-[#112A46]" : "text-[#957D43]"} ${className}`}>
      <span className="relative inline-flex items-center whitespace-nowrap">
        {children}
        {active && showActiveUnderline && (
          <span className="absolute -bottom-[9px] left-0 right-0 h-[2px] rounded-full bg-[#C28A30] transition-all duration-200" />
        )}
      </span>
    </button>
  );
}

function BackTitle({ title, onBack, lang }) {
  const BackIcon = lang === "ar" ? ChevronRight : ChevronLeft;
  return <div className="mb-5 flex items-center gap-3 px-5"><button onClick={onBack} className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white shadow-sm ring-1 ring-black/[0.04]"><BackIcon className="h-5 w-5" /></button><h2 className="text-xl font-black">{title}</h2></div>;
}

function EmployeeStoreContext({ lang, currentStore, assignedStores, onSelect, dark = false }) {
  const [open, setOpen] = useState(false);
  const selectorRef = useRef(null);
  useEffect(() => {
    if (!open) return undefined;
    const closeOutside = (event) => { if (selectorRef.current && !selectorRef.current.contains(event.target)) setOpen(false); };
    document.addEventListener("pointerdown", closeOutside);
    return () => document.removeEventListener("pointerdown", closeOutside);
  }, [open]);
  if (!currentStore) return <div className="mb-4 rounded-2xl bg-[#FFF1EE] p-4 text-xs font-bold text-[#B44747]">{text(lang, "noAssignedStores")}</div>;
  return (
    <div ref={selectorRef} className="relative">
      <p className={`text-[10px] font-bold ${dark ? "text-white/60" : "text-[#827762]"}`}>{text(lang, "currentWorkStore")}</p>
      <button onClick={() => assignedStores.length > 1 && setOpen(!open)} className={`mt-1 flex w-full items-center justify-between text-start ${dark ? "text-white" : "text-[#112A46]"}`}>
        <div><p className="text-sm font-black">{businessName(currentStore, lang)}</p><p className={`mt-0.5 text-[10px] font-bold ${dark ? "text-white/65" : "text-[#827762]"}`}>{businessLocation(currentStore, lang)}</p></div>
        {assignedStores.length > 1 && <div className={`flex items-center gap-1 rounded-full px-2 py-1 text-[9px] font-bold ${dark ? "bg-white/10 text-white" : "bg-[#FFF0CB] text-[#806528]"}`}>{text(lang, "switchWorkStore")}<ChevronDown className="h-3 w-3" /></div>}
      </button>
      <AnimatePresence>{open && assignedStores.length > 1 && <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }} className="absolute start-0 end-0 top-[58px] z-30 rounded-2xl bg-white p-2 shadow-xl ring-1 ring-[#E8E1D4]">{assignedStores.map((business) => <button key={business.id} onClick={() => { onSelect(business.id); setOpen(false); }} className={`flex w-full items-center justify-between rounded-xl px-3 py-3 text-start ${currentStore.id === business.id ? "bg-[#FFF4D2]" : ""}`}><div><p className="text-[11px] font-black text-[#112A46]">{businessName(business, lang)}</p><p className="text-[9px] font-bold text-[#827762]">{businessLocation(business, lang)}</p></div>{currentStore.id === business.id && <Check className="h-4 w-4 text-[#112A46]" />}</button>)}</motion.div>}</AnimatePresence>
    </div>
  );
}

function EmployeeHome({ lang, onSummary, onExpense, onViewAll, currentStore, assignedStores, onSelectStore, activeEmployeeId, operationalEntries = [] }) {
  const entries = newestEntries(
    operationalEntries.filter((entry) => entry.businessId === currentStore?.id && entry.enteredBy?.userId === activeEmployeeId)
  ).slice(0, 4);
  return (
    <motion.section initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="px-5 pb-24">
      <div className="mb-5 rounded-3xl bg-[#112A46] p-5 text-white">
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            <p className="text-[11px] font-bold text-white/65">{text(lang, "todayEntries")}</p>
            <h1 className="mt-1 text-lg font-black">{text(lang, "openEntry")}</h1>
          </div>
          <span className="rounded-full bg-white/10 px-3 py-1 text-[10px] font-black text-[#E4B84A]">{text(lang, "active")}</span>
        </div>
        <EmployeeStoreContext lang={lang} currentStore={currentStore} assignedStores={assignedStores} onSelect={onSelectStore} dark />
      </div>
      <div className="mb-5 grid grid-cols-2 gap-3">
        <button onClick={onSummary} className="flex min-h-[124px] flex-col items-start justify-between rounded-[24px] bg-[#112A46] p-4 text-start text-white shadow-sm">
          <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white/10"><ReceiptText className="h-5 w-5" /></span>
          <span><strong className="block text-[12px] font-black leading-5">{text(lang, "enterDailySummary")}</strong><small className="mt-1 block text-[9px] font-bold leading-4 text-white/65">{text(lang, "salesChannelsAndTotal")}</small></span>
        </button>
        <button onClick={onExpense} className="flex min-h-[124px] flex-col items-start justify-between rounded-[24px] bg-white p-4 text-start text-[#112A46] shadow-sm ring-1 ring-black/[0.045]">
          <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#FFF0CB] text-[#806528]"><Plus className="h-5 w-5" /></span>
          <span><strong className="block text-[12px] font-black leading-5">{text(lang, "addPurchaseExpense")}</strong><small className="mt-1 block text-[9px] font-bold leading-4 text-[#827762]">{text(lang, "amountNoteOptionalPhoto")}</small></span>
        </button>
      </div>
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-[15px] font-black">{text(lang, "recentEntries")}</h3>
        <button type="button" onClick={onViewAll} className="text-xs font-bold text-[#9A823E]">{text(lang, "viewAll")}</button>
      </div>
      <div className="overflow-hidden rounded-3xl bg-white ring-1 ring-black/[0.045]">
        {entries.length ? entries.map((entry, index) => (
          <div key={entry.id} className={`flex items-center justify-between px-4 py-4 ${index < entries.length - 1 ? "border-b border-[#F0ECE2]" : ""}`}>
            <div className="flex min-w-0 items-center gap-3">
              <span className={`h-9 w-1 shrink-0 rounded-full ${entry.type === "summary" ? "bg-[#39A160]" : "bg-[#E4B84A]"}`} />
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <p className="truncate text-sm font-bold">{operationDisplayLabel(entry, lang)}</p>
                  {entryIsVoided(entry) && <Badge tone="warning">{text(lang, "voided")}</Badge>}
                  {entryIsActive(entry) && entryWasRestored(entry) && <Badge tone="success">{text(lang, "restored")}</Badge>}
                </div>
                <p className="text-[11px] text-[#8B8274]">{opTime(entry, lang)} · {text(lang, entry.type)}</p>
              </div>
            </div>
            <strong className={`shrink-0 tabular-nums text-sm font-bold ${entryIsVoided(entry) ? "line-through text-[#A99D87]" : entry.type === "summary" ? "text-[#257844]" : "text-[#B44747]"}`}><MoneyValue value={money(signedEntryAmount(entry), lang)} /></strong>
          </div>
        )) : (
          <div className="p-8 text-center text-xs font-bold text-[#827762]">{text(lang, "noEntriesDay")}</div>
        )}
      </div>
    </motion.section>
  );
}

function EmployeeEntriesScreen({ lang, reviewEnabled = true, currentStore, assignedStores, onSelectStore, activeEmployeeId, operationalEntries = [] }) {
  const entries = newestEntries(operationalEntries.filter((entry) => entry.businessId === currentStore?.id && entry.enteredBy?.userId === activeEmployeeId));
  return <motion.section initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="px-5 pb-24">
    <div className="mb-5"><p className="text-xs font-bold text-[#8B8274]">{text(lang, "tracking")}</p><h1 className="text-xl font-black">{text(lang, "myEntries")}</h1></div>
    <div className="mb-5 rounded-3xl bg-white p-4 ring-1 ring-black/[0.045]"><EmployeeStoreContext lang={lang} currentStore={currentStore} assignedStores={assignedStores} onSelect={onSelectStore} /></div>
    {entries.length === 0 ? <div className="rounded-3xl bg-white p-8 text-center text-xs font-bold text-[#827762] ring-1 ring-black/[0.045]">{text(lang, "noEntriesDay")}</div> : <div className="space-y-3">{entries.map((item) => { const isSale = item.type === "summary"; const signedAmount = isSale ? item.amount : -item.amount; return <div key={item.id} className="rounded-3xl bg-white p-4 ring-1 ring-black/[0.045]"><div className="flex items-start justify-between gap-3"><div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><p className="text-sm font-black">{operationDisplayLabel(item, lang)}</p>{entryIsVoided(item) && <Badge tone="warning">{text(lang, "voided")}</Badge>}{entryHasAttachment(item) && <Badge tone="navy">{text(lang, "attachmentExists")}</Badge>}</div><p className="mt-1 text-[11px] font-bold text-[#827762]">{formatCalendarDate(item.date, lang)} · {opTime(item, lang)}</p></div><strong className={`shrink-0 tabular-nums text-sm font-black ${entryIsVoided(item) ? "text-[#A99D87] line-through" : isSale ? "text-[#257844]" : "text-[#B44747]"}`}><MoneyValue value={money(signedAmount, lang)} /></strong></div>{reviewEnabled && entryIsActive(item) && entryHasAttachment(item) && <p className={`mt-3 text-[10px] font-black ${item.reviewed ? "text-[#257844]" : "text-[#B96725]"}`}>{item.reviewed ? text(lang, "reviewed") : text(lang, "waitingReview")}</p>}</div>; })}</div>}
  </motion.section>;
}

function Stat({ label, value }) { return <div className="rounded-3xl bg-white p-4 ring-1 ring-black/[0.045]"><p className="text-[11px] font-bold text-[#827762]">{label}</p><p className="mt-2 text-xl font-black">{value}</p></div>; }

function EntryDatePicker({ lang, value, onChange, showSuggestion = false }) {
  const [open, setOpen] = useState(false);
  const selected = new Date(`${value}T12:00:00`);
  const [calendarView, setCalendarView] = useState({ year: selected.getFullYear(), month: selected.getMonth() });
  const pickerRef = useRef(null);
  useEffect(() => {
    if (!open) return undefined;
    const closeOutside = (event) => { if (pickerRef.current && !pickerRef.current.contains(event.target)) setOpen(false); };
    const closeEscape = (event) => { if (event.key === "Escape") setOpen(false); };
    document.addEventListener("pointerdown", closeOutside);
    document.addEventListener("keydown", closeEscape);
    return () => { document.removeEventListener("pointerdown", closeOutside); document.removeEventListener("keydown", closeEscape); };
  }, [open]);
  const firstWeekday = new Date(calendarView.year, calendarView.month, 1).getDay();
  const numberOfDays = new Date(calendarView.year, calendarView.month + 1, 0).getDate();
  const dates = Array.from({ length: firstWeekday }, (_, index) => ({ key: `blank-${index}` })).concat(Array.from({ length: numberOfDays }, (_, index) => ({ key: `${index + 1}`, day: index + 1, iso: isoCalendarDate(calendarView.year, calendarView.month, index + 1) })));
  const todayLimit = todayIsoDate();
  const weekDays = lang === "ar" ? ["ح", "ن", "ث", "ر", "خ", "ج", "س"] : ["S", "M", "T", "W", "T", "F", "S"];
  const previous = () => setCalendarView((current) => current.month === 0 ? { year: current.year - 1, month: 11 } : { year: current.year, month: current.month - 1 });
  const next = () => setCalendarView((current) => current.month === 11 ? { year: current.year + 1, month: 0 } : { year: current.year, month: current.month + 1 });
  return (
    <div ref={pickerRef} className="relative mb-5">
      <div className="mb-2 flex items-center justify-between gap-2"><p className="text-xs font-bold text-[#716753]">{text(lang, "date")}</p>{showSuggestion && <span className="rounded-full bg-[#FFF0CB] px-2 py-1 text-[9px] font-bold text-[#806528]">{text(lang, "suggestedNextCloseout")}</span>}</div>
      <button onClick={() => { setCalendarView({ year: selected.getFullYear(), month: selected.getMonth() }); setOpen(!open); }} className="flex w-full items-center justify-between rounded-2xl bg-white px-4 py-3.5 text-sm font-black text-[#112A46] ring-1 ring-black/[0.05]">
        <span>{formatCalendarDate(value, lang)}</span><CalendarDays className="h-4 w-4 text-[#B99844]" />
      </button>
      {showSuggestion && <p className="mt-2 text-[10px] font-bold text-[#827762]">{text(lang, "changeDateAnytime")}</p>}
      <AnimatePresence>{open && <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }} className="absolute start-0 end-0 top-[78px] z-30 rounded-2xl bg-[#FFFDF7] p-3 shadow-xl ring-1 ring-[#D8CCA8]">
        <div className="mb-3 flex items-center justify-between"><button onClick={previous} className="flex h-8 w-8 items-center justify-center rounded-xl text-[#806528]"><ChevronRight className={`h-4 w-4 ${lang === "en" ? "rotate-180" : ""}`} /></button><strong className="text-xs">{formatCalendarMonth(calendarView.year, calendarView.month, lang)}</strong><button onClick={next} className="flex h-8 w-8 items-center justify-center rounded-xl text-[#806528]"><ChevronLeft className={`h-4 w-4 ${lang === "en" ? "rotate-180" : ""}`} /></button></div>
        <div className="mb-2 grid grid-cols-7 text-center text-[10px] font-bold text-[#957D43]">{weekDays.map((day, index) => <span key={`${day}-${index}`}>{day}</span>)}</div>
        <div className="grid grid-cols-7 gap-1 text-center text-xs font-bold">{dates.map((date) => date.day ? <button key={date.key} disabled={date.iso > todayLimit} onClick={() => { if (date.iso <= todayLimit) { onChange(date.iso); setOpen(false); } }} className={`flex h-8 items-center justify-center rounded-lg ${date.iso > todayLimit ? "cursor-not-allowed text-[#C8C0B1]" : date.iso === value ? "bg-[#B44747] text-white" : "text-[#112A46] hover:bg-[#FFF0CB]"}`}>{date.day}</button> : <span key={date.key} className="h-8" />)}</div>
      </motion.div>}</AnimatePresence>
    </div>
  );
}

function ExpenseScreen({ lang, onBack, onSave, saving = false, initialDate = todayIsoDate(), currentStore, assignedStores, onSelectStore, activeCategories = expenseCategories }) {
  const [kind, setKind] = useState("purchases");
  const [category, setCategory] = useState(activeCategories[0]?.id || "other");
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [operationDate, setOperationDate] = useState(initialDate);
  const { attachment, processing, error, selectAttachment, clearAttachment } = useAttachmentCapture(lang);
  useEffect(() => { if (!activeCategories.some((item) => item.id === category)) setCategory(activeCategories[0]?.id || "other"); }, [activeCategories, category]);
  const canSave = Boolean(currentStore && toAmount(amount) > 0 && (kind !== "expense" || activeCategories.length > 0));
  const changeStore = (businessId) => {
    if (businessId !== currentStore?.id && draftNeedsConfirmation(amount, note, attachment) && !window.confirm(text(lang, "discardDraftOnStoreChange"))) return;
    if (businessId !== currentStore?.id) { setAmount(""); setNote(""); clearAttachment(); }
    onSelectStore(businessId);
  };
  const submit = () => canSave && !processing && !saving && onSave({ date: operationDate, businessId: currentStore.id, type: kind, categoryId: kind === "expense" ? category : kind, amount: toAmount(amount), note, attachment });
  return <motion.section initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mx-auto w-full pb-24 sm:max-w-[560px] lg:max-w-none"><BackTitle lang={lang} title={text(lang, "newOutflow")} onBack={onBack} /><div className="space-y-5 px-5"><div className="rounded-3xl bg-white p-4 ring-1 ring-black/[0.045]"><EmployeeStoreContext lang={lang} currentStore={currentStore} assignedStores={assignedStores} onSelect={changeStore} /></div><EntryDatePicker lang={lang} value={operationDate} onChange={setOperationDate} /><div><p className="mb-2 text-xs font-bold text-[#716753]">{text(lang, "transactionType")}</p><div className="grid grid-cols-3 gap-2">{["purchases", "expense", "withdrawal"].map((item) => <Choice key={item} active={kind === item} onClick={() => setKind(item)}>{text(lang, item)}</Choice>)}</div></div>{kind === "expense" && <div><p className="mb-2 text-xs font-bold text-[#716753]">{text(lang, "category")}</p>{activeCategories.length ? <div className="grid grid-cols-3 gap-2">{activeCategories.map((item) => <Choice key={item.id} active={category === item.id} onClick={() => setCategory(item.id)}>{text(lang, item.label)}</Choice>)}</div> : <p className="rounded-xl bg-[#FFF1EE] p-3 text-[10px] font-bold text-[#B44747]">{text(lang, "atLeastOneCategory")}</p>}</div>}<div className="rounded-3xl bg-white p-5 ring-1 ring-black/[0.05]"><p className="text-xs font-bold text-[#716753]">{text(lang, "howMuch")}</p><div className="mt-2 flex items-center gap-2" dir="ltr"><input inputMode="decimal" value={amount} onChange={(event) => setAmount(sanitizeAmountInput(event.target.value))} placeholder="0" className="w-full min-w-0 bg-transparent text-4xl font-black outline-none" /><span className="mt-3 text-sm font-bold text-[#786D58]">{lang === "ar" ? "ر.س" : "SAR"}</span></div></div><div className="grid grid-cols-2 gap-3"><SmallInfo label={text(lang, "date")} value={formatCalendarDate(operationDate, lang)} /><SmallInfo label={text(lang, "category")} value={kind === "expense" ? text(lang, activeCategories.find((item) => item.id === category)?.label || "other") : text(lang, kind)} /></div><AttachmentCapture lang={lang} attachment={attachment} processing={processing} error={error} onSelect={selectAttachment} onClear={clearAttachment} tall /><div className="rounded-3xl bg-white p-4 ring-1 ring-black/[0.05]"><p className="mb-2 text-xs font-bold text-[#716753]">{text(lang, "note")} <span className="font-normal">({text(lang, "optional")})</span></p><textarea value={note} onChange={(event) => setNote(event.target.value)} placeholder={text(lang, "notePlaceholder")} className="min-h-[52px] w-full resize-none rounded-2xl bg-[#F7F5EF] px-4 py-3 text-sm outline-none" /></div><button disabled={!canSave || processing || saving} onClick={submit} className={`w-full rounded-2xl py-4 text-sm font-extrabold text-white ${canSave && !processing && !saving ? "bg-[#39A160]" : "bg-[#B8C0B7]"}`}>{text(lang, saving ? "saving" : "save")}</button></div></motion.section>;
}

function SummaryScreen({ lang, onBack, onSave, saving = false, salesChannels = channels, suggestedDate = todayIsoDate(), showDateSuggestion = false, currentStore, assignedStores, onSelectStore }) {
  const [values, setValues] = useState(Object.fromEntries(salesChannels.map((item) => [item.id, ""])));
  const [summaryDate, setSummaryDate] = useState(suggestedDate);
  const { attachment, processing, error, selectAttachment, clearAttachment } = useAttachmentCapture(lang);
  const salesChannelSignature = salesChannels.map((channel) => channel.id).join("|");
  useEffect(() => {
    setValues(Object.fromEntries(salesChannels.map((item) => [item.id, ""])));
    setSummaryDate(suggestedDate);
    clearAttachment();
  }, [currentStore?.id, salesChannelSignature, suggestedDate]);
  const total = useMemo(() => Object.values(values).reduce((sum, item) => sum + toAmount(item), 0), [values]);
  const canSave = Boolean(currentStore && total > 0);
  const changeStore = (businessId) => {
    if (businessId !== currentStore?.id && draftNeedsConfirmation(values, attachment, summaryDate !== suggestedDate ? "changed-date" : "") && !window.confirm(text(lang, "discardDraftOnStoreChange"))) return;
    if (businessId !== currentStore?.id) { setValues(Object.fromEntries(salesChannels.map((item) => [item.id, ""]))); clearAttachment(); }
    onSelectStore(businessId);
  };
  const submit = () => canSave && !processing && !saving && onSave({ date: summaryDate, businessId: currentStore.id, type: "summary", salesChannels: salesChannels.map((channel) => ({ channelId: channel.id, name: channelName(channel, lang), amount: toAmount(values[channel.id]) })).filter((row) => row.amount > 0), attachment, noteKey: "salesSummary" });
  return <motion.section initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mx-auto w-full pb-24 sm:max-w-[560px] lg:max-w-none"><BackTitle lang={lang} title={text(lang, "dailySummary")} onBack={onBack} /><div className="px-5"><div className="mb-5 rounded-3xl bg-white p-4 ring-1 ring-black/[0.045]"><EmployeeStoreContext lang={lang} currentStore={currentStore} assignedStores={assignedStores} onSelect={changeStore} /></div><EntryDatePicker lang={lang} value={summaryDate} onChange={setSummaryDate} showSuggestion={showDateSuggestion} /><p className="mb-3 text-xs font-bold text-[#716753]">{text(lang, "salesChannels")}</p>{salesChannels.length === 0 ? <div className="mb-4 rounded-3xl bg-white p-5 text-xs font-bold text-[#B44747] ring-1 ring-black/[0.05]">{text(lang, "noSalesChannels")}</div> : <div className="mb-4 grid grid-cols-3 gap-2">{salesChannels.map((channel) => <label key={channel.id} className="rounded-2xl bg-white px-2 py-3 text-center ring-1 ring-black/[0.05]"><span className="mb-2 block min-h-[30px] text-[11px] font-bold leading-4 text-[#716753]">{channelName(channel, lang)}</span><div dir="ltr" className="flex items-center justify-center gap-1"><input inputMode="decimal" value={values[channel.id] ?? ""} onChange={(e) => setValues({ ...values, [channel.id]: sanitizeAmountInput(e.target.value) })} className="min-w-0 w-full bg-[#F7F5EF] px-1 py-2 text-center text-sm font-black outline-none" /><span className="text-[9px] font-bold text-[#827762]">{lang === "ar" ? "ر.س" : "SAR"}</span></div></label>)}</div>}<div className="mb-5 flex justify-between rounded-3xl bg-[#112A46] p-5 text-white"><span className="text-sm font-bold text-white/70">{text(lang, "totalSales")}</span><strong><MoneyValue value={money(total, lang)} /></strong></div><AttachmentCapture lang={lang} attachment={attachment} processing={processing} error={error} onSelect={selectAttachment} onClear={clearAttachment} /><button disabled={!canSave || processing || saving} onClick={submit} className={`mt-5 w-full rounded-2xl py-4 text-sm font-extrabold text-white ${canSave && !processing && !saving ? "bg-[#39A160]" : "bg-[#B8C0B7]"}`}>{text(lang, saving ? "saving" : "save")}</button></div></motion.section>;
}

function Choice({ active, children, onClick }) { return <button onClick={onClick} className={`rounded-2xl py-3 text-xs font-extrabold ${active ? "bg-[#112A46] text-white" : "bg-white text-[#716753] ring-1 ring-black/[0.05]"}`}>{children}</button>; }
function FieldLabel({ label, optional, value }) { return <div className="rounded-3xl bg-white p-4 ring-1 ring-black/[0.05]"><p className="mb-2 text-xs font-bold text-[#716753]">{label} <span className="font-normal">({optional})</span></p><div className="rounded-2xl bg-[#F7F5EF] px-4 py-3 text-sm text-[#716753]">{value}</div></div>; }
function AttachmentPreview({ attachment, className = "" }) {
  const source = useAttachmentSource(attachment);
  if (!source) return <ProofThumb />;
  return <img src={source} alt="" className={`object-cover ${className}`} />;
}
function AttachmentCapture({ lang, attachment, processing, error, onSelect, onClear, tall = false }) {
  return <div><label className={`relative flex w-full cursor-pointer items-center justify-center gap-3 overflow-hidden rounded-3xl border-2 border-dashed border-[#D7CBAF] bg-[#FFFDF7] ${tall ? "h-40 flex-col" : "min-h-24 px-4 py-3"}`}>
    <input type="file" accept="image/*" capture="environment" onChange={onSelect} className="sr-only" />
    {attachment ? <><AttachmentPreview attachment={attachment} className="absolute inset-0 h-full w-full opacity-25" /><Check className={`${tall ? "h-8 w-8" : "h-6 w-6"} relative text-[#39A160]`} /></> : <Camera className={`${tall ? "h-8 w-8" : "h-6 w-6"} text-[#B99844]`} />}
    <div className={`relative ${tall ? "text-center" : "text-start"}`}><p className="text-sm font-extrabold">{processing ? text(lang, "processingPhoto") : attachment ? text(lang, "replacePhoto") : text(lang, "cameraOrGallery")}</p><p className="text-[11px] text-[#827762]">{attachment ? text(lang, "attachmentStoredLocally") : text(lang, "optional")}</p></div>
  </label>{attachment && <button onClick={onClear} className="mt-2 text-[11px] font-bold text-[#B44747]">{text(lang, "removePhoto")}</button>}{error && <p className="mt-2 text-[11px] font-bold text-[#B44747]">{error}</p>}</div>;
}

function StoreOperationPicker({ lang, businessesList = businesses, selectedId, onSelect }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const pickerRef = useRef(null);
  const selectedStore = businessesList.find((business) => business.id === selectedId) || null;
  const searchable = businessesList.length > 2;
  const filteredStores = businessesList.filter((business) => `${businessName(business, lang)} ${businessLocation(business, lang)}`.toLowerCase().includes(query.toLowerCase()));
  useEffect(() => {
    if (!open) return undefined;
    const closeOutside = (event) => { if (pickerRef.current && !pickerRef.current.contains(event.target)) setOpen(false); };
    document.addEventListener("pointerdown", closeOutside);
    return () => document.removeEventListener("pointerdown", closeOutside);
  }, [open]);
  if (!searchable) {
    return <div className="grid grid-cols-2 gap-2">{businessesList.map((business) => <button key={business.id} onClick={() => onSelect(business.id)} className={`rounded-2xl px-3 py-3 text-xs font-black ${selectedId === business.id ? "bg-[#112A46] text-white" : "bg-[#F7F5EF] text-[#716753] ring-1 ring-black/[0.05]"}`}>{businessName(business, lang, true) || businessName(business, lang)}</button>)}</div>;
  }
  return <div ref={pickerRef} className="relative"><button onClick={() => setOpen(!open)} className="flex w-full items-center justify-between rounded-2xl bg-white px-4 py-3 text-start text-xs font-black ring-1 ring-black/[0.05]"><span>{selectedStore ? businessName(selectedStore, lang) : text(lang, "selectStore")}</span><ChevronDown className="h-4 w-4 text-[#806528]" /></button><AnimatePresence>{open && <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }} className="absolute start-0 end-0 top-[50px] z-40 rounded-2xl bg-white p-3 shadow-xl ring-1 ring-[#E8E1D4]"><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder={text(lang, "searchStore")} className="mb-2 w-full rounded-xl bg-[#F7F5EF] px-3 py-2.5 text-[11px] font-bold outline-none" /><div className="max-h-48 overflow-y-auto">{filteredStores.map((business) => <button key={business.id} onClick={() => { onSelect(business.id); setOpen(false); setQuery(""); }} className={`mb-1 flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-start ${selectedId === business.id ? "bg-[#FFF4D2]" : ""}`}><div><p className="text-[11px] font-black">{businessName(business, lang)}</p><p className="text-[9px] font-bold text-[#827762]">{businessLocation(business, lang)}</p></div>{selectedId === business.id && <Check className="h-4 w-4 text-[#112A46]" />}</button>)}</div></motion.div>}</AnimatePresence></div>;
}

function OwnerSummaryScreen({ lang, onBack, onSave, saving = false, selectedBusiness, businessesList = businesses, storeChannelSettings = {} }) {
  const [businessId, setBusinessId] = useState(selectedBusiness === "all" ? "" : selectedBusiness);
  const [summaryDate, setSummaryDate] = useState(() => todayIsoDate());
  const { attachment, processing, error, selectAttachment, clearAttachment } = useAttachmentCapture(lang);
  const selectedStore = businessesList.find((business) => business.id === businessId) || null;
  const channelConfig = getStoreChannelConfig(storeChannelSettings, businessId);
  const salesChannels = selectedStore ? channelConfig.channels.filter((channel) => channelConfig.activeIds.includes(channel.id) && !channel.retired) : [];
  const [values, setValues] = useState({});
  const channelSignature = salesChannels.map((channel) => channel.id).join("|");
  useEffect(() => { setValues(Object.fromEntries(salesChannels.map((channel) => [channel.id, ""]))); clearAttachment(); }, [businessId, channelSignature]);
  const total = useMemo(() => salesChannels.reduce((sum, channel) => sum + toAmount(values[channel.id]), 0), [salesChannels, values]);
  const canSave = Boolean(selectedStore && salesChannels.length > 0 && total > 0 && summaryDate <= todayIsoDate());
  const changeStore = (nextBusinessId) => {
    if (nextBusinessId !== businessId && draftNeedsConfirmation(values, attachment) && !window.confirm(text(lang, "discardDraftOnStoreChange"))) return;
    setBusinessId(nextBusinessId);
  };
  const submit = () => canSave && !processing && !saving && onSave({ date: summaryDate, businessId, type: "summary", salesChannels: salesChannels.map((channel) => ({ channelId: channel.id, name: channelName(channel, lang), amount: toAmount(values[channel.id]) })).filter((row) => row.amount > 0), attachment, noteKey: "salesSummary" });
  return <motion.section initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mx-auto w-full pb-24 sm:max-w-[560px] lg:max-w-none"><BackTitle lang={lang} title={text(lang, "dailySummary")} onBack={onBack} /><div className="space-y-5 px-5"><EntryDatePicker lang={lang} value={summaryDate} onChange={setSummaryDate} /><div><p className="mb-2 text-xs font-bold text-[#716753]">{text(lang, "operationStore")}</p><StoreOperationPicker lang={lang} businessesList={businessesList} selectedId={businessId} onSelect={changeStore} /><p className={`mt-2 text-[10px] font-bold ${selectedStore ? "text-[#827762]" : "text-[#B44747]"}`}>{selectedStore ? text(lang, "operationStoreHint") : text(lang, "chooseStoreForSummary")}</p></div><div><p className="mb-3 text-xs font-bold text-[#716753]">{text(lang, "salesChannels")}</p>{!selectedStore ? <div className="rounded-3xl bg-white p-5 text-xs font-bold text-[#827762] ring-1 ring-black/[0.05]">{text(lang, "chooseStoreForSummary")}</div> : salesChannels.length === 0 ? <div className="rounded-3xl bg-white p-5 text-xs font-bold text-[#B44747] ring-1 ring-black/[0.05]">{text(lang, "noSalesChannels")}</div> : <div className="grid grid-cols-3 gap-2">{salesChannels.map((channel) => <label key={channel.id} className="rounded-2xl bg-white px-2 py-3 text-center ring-1 ring-black/[0.05]"><span className="mb-2 block min-h-[30px] text-[11px] font-bold leading-4 text-[#716753]">{channelName(channel, lang)}</span><div dir="ltr" className="flex items-center justify-center gap-1"><input inputMode="decimal" value={values[channel.id] || ""} onChange={(event) => setValues((current) => ({ ...current, [channel.id]: sanitizeAmountInput(event.target.value) }))} className="min-w-0 w-full bg-[#F7F5EF] px-1 py-2 text-center text-sm font-black outline-none" /><span className="text-[9px] font-bold text-[#827762]">{lang === "ar" ? "ر.س" : "SAR"}</span></div></label>)}</div>}</div><div className="flex justify-between rounded-3xl bg-[#112A46] p-5 text-white"><span className="text-sm font-bold text-white/70">{text(lang, "totalSales")}</span><strong><MoneyValue value={money(total, lang)} /></strong></div><AttachmentCapture lang={lang} attachment={attachment} processing={processing} error={error} onSelect={selectAttachment} onClear={clearAttachment} /><button disabled={!canSave || processing || saving} onClick={submit} className={`w-full rounded-2xl py-4 text-sm font-extrabold text-white ${canSave && !processing && !saving ? "bg-[#39A160]" : "bg-[#B8C0B7]"}`}>{text(lang, saving ? "saving" : "save")}</button></div></motion.section>;
}

function OwnerExpenseScreen({ lang, onBack, onSave, saving = false, selectedBusiness, businessesList = businesses, storeOperationalSettings = {} }) {
  const [businessId, setBusinessId] = useState(selectedBusiness === "all" ? "" : selectedBusiness);
  const [kind, setKind] = useState("expense");
  const [category, setCategory] = useState("other");
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [operationDate, setOperationDate] = useState(() => todayIsoDate());
  const { attachment, processing, error, selectAttachment, clearAttachment } = useAttachmentCapture(lang);
  const selectedStore = businessesList.find((business) => business.id === businessId);
  const activeCategories = expenseCategories.filter((item) => getStoreOperationalConfig(storeOperationalSettings, businessId).activeCategories.includes(item.id));
  useEffect(() => { if (!activeCategories.some((item) => item.id === category)) setCategory(activeCategories[0]?.id || "other"); }, [businessId, category, activeCategories]);
  const canSave = Boolean(selectedStore && toAmount(amount) > 0 && (kind !== "expense" || activeCategories.length > 0));
  const changeStore = (nextBusinessId) => {
    if (nextBusinessId !== businessId && draftNeedsConfirmation(amount, note, attachment) && !window.confirm(text(lang, "discardDraftOnStoreChange"))) return;
    if (nextBusinessId !== businessId) { setAmount(""); setNote(""); clearAttachment(); }
    setBusinessId(nextBusinessId);
  };
  const payload = () => ({ date: operationDate, businessId, type: kind, categoryId: kind === "expense" ? category : kind, amount: toAmount(amount), note, attachment });
  const categoryLabel = kind === "expense" ? text(lang, activeCategories.find((item) => item.id === category)?.label || "other") : text(lang, kind);
  const submit = () => canSave && !processing && !saving && onSave(payload());
  return <motion.section initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mx-auto w-full pb-24 sm:max-w-[560px] lg:max-w-none"><BackTitle lang={lang} title={text(lang, "addOutflow")} onBack={onBack} /><div className="space-y-5 px-5"><div className="rounded-2xl bg-[#FFF4D2] p-3 text-[11px] font-bold leading-5 text-[#806528]">{text(lang, "ownerOutflowNotice")}</div><EntryDatePicker lang={lang} value={operationDate} onChange={setOperationDate} /><div><p className="mb-2 text-xs font-bold text-[#716753]">{text(lang, "operationStore")}</p><StoreOperationPicker lang={lang} businessesList={businessesList} selectedId={businessId} onSelect={changeStore} /><p className={`mt-2 text-[10px] font-bold ${selectedStore ? "text-[#827762]" : "text-[#B44747]"}`}>{selectedStore ? text(lang, "operationStoreHint") : text(lang, "chooseOperationStore")}</p></div><div><p className="mb-2 text-xs font-bold text-[#716753]">{text(lang, "transactionType")}</p><div className="grid grid-cols-3 gap-2">{["expense", "purchases", "withdrawal"].map((item) => <Choice key={item} active={kind === item} onClick={() => setKind(item)}>{text(lang, item)}</Choice>)}</div></div>{kind === "expense" && <div><p className="mb-2 text-xs font-bold text-[#716753]">{text(lang, "category")}</p>{activeCategories.length ? <div className="grid grid-cols-3 gap-2">{activeCategories.map((item) => <Choice key={item.id} active={category === item.id} onClick={() => setCategory(item.id)}>{text(lang, item.label)}</Choice>)}</div> : <p className="rounded-xl bg-[#FFF1EE] p-3 text-[10px] font-bold text-[#B44747]">{text(lang, "atLeastOneCategory")}</p>}</div>}<div className="rounded-3xl bg-white p-5 ring-1 ring-black/[0.05]"><p className="text-xs font-bold text-[#716753]">{text(lang, "amount")}</p><div className="mt-2 flex items-center gap-2" dir="ltr"><input inputMode="decimal" value={amount} onChange={(event) => setAmount(sanitizeAmountInput(event.target.value))} placeholder="0" className="w-full min-w-0 bg-transparent text-4xl font-black outline-none" /><span className="mt-3 text-sm font-bold text-[#786D58]">{lang === "ar" ? "ر.س" : "SAR"}</span></div></div><div className="grid grid-cols-2 gap-3"><SmallInfo label={text(lang, "date")} value={formatCalendarDate(operationDate, lang)} /><SmallInfo label={text(lang, "category")} value={categoryLabel} /></div><div className="rounded-3xl bg-white p-4 ring-1 ring-black/[0.05]"><p className="mb-2 text-xs font-bold text-[#716753]">{text(lang, "note")} <span className="font-normal">({text(lang, "optional")})</span></p><textarea value={note} onChange={(event) => setNote(event.target.value)} placeholder={text(lang, "notePlaceholder")} className="min-h-[52px] w-full resize-none rounded-2xl bg-[#F7F5EF] px-4 py-3 text-sm outline-none" /></div><AttachmentCapture lang={lang} attachment={attachment} processing={processing} error={error} onSelect={selectAttachment} onClear={clearAttachment} /><button disabled={!canSave || processing || saving} onClick={submit} className={`w-full rounded-2xl py-4 text-sm font-extrabold text-white transition ${canSave && !processing && !saving ? "bg-[#112A46]" : "cursor-not-allowed bg-[#B8C0B7]"}`}>{text(lang, saving ? "saving" : "saveOutflow")}</button></div></motion.section>;
}
function SmallInfo({ label, value }) { return <div className="rounded-2xl bg-white p-3 ring-1 ring-black/[0.05]"><p className="text-[10px] font-bold text-[#716753]">{label}</p><p className="mt-1 text-xs font-black">{value}</p></div>; }

function SettingToggle({ enabled, onToggle, disabled = false }) { return <button disabled={disabled} onClick={onToggle} className={`relative h-6 w-11 rounded-full transition ${disabled ? "cursor-not-allowed opacity-55" : ""} ${enabled ? "bg-[#39A160]" : "bg-[#D9D3C7]"}`}><span className={`absolute top-1 h-4 w-4 rounded-full bg-white shadow-sm transition ${enabled ? "left-1" : "left-6"}`} /></button>; }
function EmployeeSettingsScreen({ lang, currentStore, assignedStores, onSelectStore, employeeName, onLogout, onOpenSupport, onOpenHelp }) {
  const perms = ["permissionSummary", "permissionOutflow", "permissionAttach"];
  const initial = employeeName ? employeeName.trim().charAt(0) : (lang === "ar" ? "م" : "E");
  return <motion.section initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="px-5 pb-24"><div className="mb-5"><p className="text-xs font-bold text-[#8B8274]">{text(lang, "account")}</p><h1 className="text-xl font-black">{text(lang, "settings")}</h1></div><div className="mb-5 flex items-center gap-4 rounded-3xl bg-white p-4 ring-1 ring-black/[0.045]"><div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#112A46] text-lg font-black text-white">{initial}</div><div className="flex-1"><p className="text-sm font-black">{employeeName || (lang === "ar" ? "موظف" : "Employee")}</p><p className="mt-0.5 text-[11px] font-bold text-[#827762]">{text(lang, "employee")}</p></div><Badge tone="success">{text(lang, "active")}</Badge></div><p className="mb-2 text-xs font-bold text-[#716753]">{text(lang, "linkedStores")}</p><div className="mb-5 rounded-3xl bg-white p-4 ring-1 ring-black/[0.045]"><EmployeeStoreContext lang={lang} currentStore={currentStore} assignedStores={assignedStores} onSelect={onSelectStore} /><div className="mt-4 space-y-2 border-t border-[#F0ECE2] pt-3">{assignedStores.map((business) => <div key={business.id} className="flex items-center gap-2 text-[11px] font-bold text-[#716753]"><Check className="h-4 w-4 text-[#39A160]" />{businessName(business, lang)}</div>)}</div></div><p className="mb-2 text-xs font-bold text-[#716753]">{text(lang, "permissions")}</p><div className="mb-5 rounded-3xl bg-white p-4 ring-1 ring-black/[0.045]"><p className="mb-4 text-[11px] font-bold text-[#806528]">{text(lang, "employeeEntryOnly")}</p>{perms.map((key) => <div key={key} className="mb-3 flex items-center gap-2 last:mb-0"><Check className="h-4 w-4 text-[#39A160]" /><span className="text-xs font-bold">{text(lang, key)}</span></div>)}<p className="mt-4 border-t border-[#F0ECE2] pt-3 text-[11px] font-bold text-[#827762]">{text(lang, "ownerOnly")}</p></div><div className="overflow-hidden rounded-3xl bg-white ring-1 ring-black/[0.045]"><ActionRow label={text(lang, "support")} lang={lang} border onClick={onOpenSupport} /><ActionRow label={text(lang, "helpCenter")} lang={lang} border onClick={onOpenHelp} /><ActionRow label={text(lang, "logout")} lang={lang} danger onClick={onLogout} /></div></motion.section>;
}
function readSavedSettings() {
  if (typeof window === "undefined") return null;
  try { return JSON.parse(window.localStorage.getItem("taqfeelah_owner_settings") || "null"); } catch { return null; }
}
function OwnerSettingsScreen({ lang, notebookTheme, setNotebookTheme, storeChannelSettings, setStoreChannelSettings, storeOperationalSettings, setStoreOperationalSettings, configuredBusinesses, setConfiguredBusinesses, archivedBusinessIds, setArchivedBusinessIds, staff, setStaff, ownerProfile, setOwnerProfile, operationalEntries = [], selectedBusiness, setSelectedBusiness, setOwnerPage, setArchivedReadOnlyBusinessId, setLastCloseoutDates, onLogout = () => {}, onOpenSupport = () => {}, onOpenHelp = () => {} }) {
  const [section, setSection] = useState("home");
  const [settingsStoreId, setSettingsStoreId] = useState(null);
  const [storePanel, setStorePanel] = useState("overview");
  const [showAddStore, setShowAddStore] = useState(false);
  const [showArchivedStores, setShowArchivedStores] = useState(false);
  const [newStoreName, setNewStoreName] = useState("");
  const [newStoreLocation, setNewStoreLocation] = useState("");
  const [draftStoreName, setDraftStoreName] = useState("");
  const [draftStoreLocation, setDraftStoreLocation] = useState("");
  const [draftStoreChannelConfig, setDraftStoreChannelConfig] = useState(null);
  const [draftStoreOperationalConfig, setDraftStoreOperationalConfig] = useState(null);
  const [newChannelName, setNewChannelName] = useState("");
  const [draftNotebookTheme, setDraftNotebookTheme] = useState(notebookTheme);
  const [themeDirty, setThemeDirty] = useState(false);
  const [settingsSuccess, setSettingsSuccess] = useState(false);
  const [managingTeam, setManagingTeam] = useState(false);
  const [draftStaff, setDraftStaff] = useState(null);
  const [newEmployeeName, setNewEmployeeName] = useState("");
  const [newEmployeeMobile, setNewEmployeeMobile] = useState("");
  const [newEmployeeStoreIds, setNewEmployeeStoreIds] = useState([]);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [settingsNotice, setSettingsNotice] = useState("");
  const [draftOwnerName, setDraftOwnerName] = useState(ownerProfile?.name || text(lang, "ownerName"));

  const activeStoredBusinesses = configuredBusinesses.filter((business) => !archivedBusinessIds.includes(business.id));
  const archivedStoredBusinesses = configuredBusinesses.filter((business) => archivedBusinessIds.includes(business.id));
  const selectedStore = configuredBusinesses.find((business) => business.id === settingsStoreId) || null;
  const archived = selectedStore ? archivedBusinessIds.includes(selectedStore.id) : false;
  const staffWorkingSet = managingTeam && draftStaff ? draftStaff : staff;
  const visibleStaff = staffWorkingSet.filter((person) => !person.removed);
  const employeeStoreIds = (person) => person.storeIds || ["shami"];
  const displayBusinessName = (business) => businessName(business, lang);
  const displayLocation = (business) => businessLocation(business, lang);
  const savedChannelConfig = getStoreChannelConfig(storeChannelSettings, settingsStoreId);
  const savedOperationalConfig = getStoreOperationalConfig(storeOperationalSettings, settingsStoreId);
  const channelConfig = draftStoreChannelConfig || savedChannelConfig;
  const operationalConfig = draftStoreOperationalConfig || savedOperationalConfig;
  const visibleChannels = channelConfig.channels.filter((channel) => !channel.retired);
  const retiredChannels = channelConfig.channels.filter((channel) => channel.retired);
  const linkedStaff = selectedStore ? visibleStaff.filter((person) => employeeStoreIds(person).includes(selectedStore.id)) : [];
  const activeCategoryCount = operationalConfig.activeCategories.length;
  const activeChannelCount = channelConfig.activeIds.length;

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem("taqfeelah_owner_settings", JSON.stringify({ configuredBusinesses, archivedBusinessIds, storeChannelSettings, storeOperationalSettings, staff, ownerProfile }));
  }, [configuredBusinesses, archivedBusinessIds, storeChannelSettings, storeOperationalSettings, staff, ownerProfile]);
  useEffect(() => { setDraftNotebookTheme(notebookTheme); setThemeDirty(false); }, [notebookTheme]);
  useEffect(() => { setDraftOwnerName(ownerProfile?.name || text(lang, "ownerName")); }, [ownerProfile?.name, lang]);

  const showSettingsSaved = () => { setSettingsSuccess(true); window.setTimeout(() => setSettingsSuccess(false), 2200); };
  const saveOwnerProfile = () => {
    const name = draftOwnerName.trim();
    if (!name) return;
    setOwnerProfile({ ...ownerProfile, name });
    showSettingsSaved();
  };
  const resetStoreDrafts = () => { setDraftStoreName(""); setDraftStoreLocation(""); setDraftStoreChannelConfig(null); setDraftStoreOperationalConfig(null); setNewChannelName(""); setSettingsNotice(""); };
  const openStore = (id) => { resetStoreDrafts(); setSettingsStoreId(id); setStorePanel("overview"); };
  const closeStore = () => { resetStoreDrafts(); setSettingsStoreId(null); setStorePanel("overview"); };
  const openStorePanel = (panel) => {
    setSettingsNotice("");
    setStorePanel(panel);
    if (panel === "profile") {
      setDraftStoreName(selectedStore?.displayName || displayBusinessName(selectedStore));
      setDraftStoreLocation(displayLocation(selectedStore));
    }
    if (panel === "channels") setDraftStoreChannelConfig({ ...savedChannelConfig, channels: savedChannelConfig.channels.map((channel) => ({ ...channel })), activeIds: [...savedChannelConfig.activeIds] });
    if (panel === "expenses" || panel === "review") setDraftStoreOperationalConfig({ ...savedOperationalConfig, activeCategories: [...savedOperationalConfig.activeCategories] });
  };
  const backFromStorePanel = () => { resetStoreDrafts(); setStorePanel("overview"); };
  const saveStoreProfile = () => {
    const name = draftStoreName.trim();
    if (!settingsStoreId || !name) return;
    setConfiguredBusinesses((current) => current.map((business) => business.id === settingsStoreId ? { ...business, displayName: name, customLocation: draftStoreLocation.trim() } : business));
    showSettingsSaved(); backFromStorePanel();
  };
  const saveChannelSettings = () => {
    if (!settingsStoreId || !draftStoreChannelConfig) return;
    setStoreChannelSettings((current) => ({ ...current, [settingsStoreId]: draftStoreChannelConfig }));
    showSettingsSaved(); backFromStorePanel();
  };
  const saveOperationalSettings = () => {
    if (!settingsStoreId || !draftStoreOperationalConfig) return;
    setStoreOperationalSettings((current) => ({ ...current, [settingsStoreId]: draftStoreOperationalConfig }));
    showSettingsSaved(); backFromStorePanel();
  };
  const updateOperationalDraft = (updates) => setDraftStoreOperationalConfig((current) => ({ ...(current || savedOperationalConfig), ...updates }));
  const updateChannelDraft = (updater) => setDraftStoreChannelConfig((current) => updater(current || savedChannelConfig));
  const toggleChannel = (id) => {
    if (channelConfig.activeIds.includes(id) && channelConfig.activeIds.length === 1) { setSettingsNotice(text(lang, "atLeastOneChannel")); return; }
    setSettingsNotice("");
    updateChannelDraft((config) => ({ ...config, activeIds: config.activeIds.includes(id) ? config.activeIds.filter((item) => item !== id) : [...config.activeIds, id] }));
  };
  const requestRetireChannel = (channel) => {
    if (channelConfig.activeIds.includes(channel.id) && channelConfig.activeIds.length === 1) { setSettingsNotice(text(lang, "atLeastOneChannel")); return; }
    setDeleteTarget({ type: "channel", item: channel });
  };
  const restoreSalesChannel = (channel) => updateChannelDraft((config) => ({ channels: config.channels.map((item) => item.id === channel.id ? { ...item, retired: false } : item), activeIds: config.activeIds.includes(channel.id) ? config.activeIds : [...config.activeIds, channel.id] }));
  const addSalesChannel = () => {
    const name = newChannelName.trim();
    if (!name) return;
    const id = `channel-${Date.now()}`;
    updateChannelDraft((config) => ({ channels: [...config.channels, { id, custom: true, nameAr: name, nameEn: name, icon: CreditCard }], activeIds: [...config.activeIds, id] }));
    setNewChannelName("");
  };
  const toggleCategory = (id) => {
    if (operationalConfig.activeCategories.includes(id) && operationalConfig.activeCategories.length === 1) { setSettingsNotice(text(lang, "atLeastOneCategory")); return; }
    setSettingsNotice("");
    updateOperationalDraft({ activeCategories: operationalConfig.activeCategories.includes(id) ? operationalConfig.activeCategories.filter((item) => item !== id) : [...operationalConfig.activeCategories, id] });
  };
  const toggleArchive = (id) => setArchivedBusinessIds((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id]);
  const storeHasRecords = (business) => operationalEntries.some((entry) => entry.businessId === business.id);
  const staffWithoutActiveStoreAfterArchive = (businessId) => visibleStaff.filter((person) => person.active && employeeStoreIds(person).includes(businessId) && !employeeStoreIds(person).some((id) => id !== businessId && activeStoredBusinesses.some((business) => business.id === id)));
  const requestArchiveStore = (business) => setDeleteTarget({ type: "archive", item: business, affectedStaff: staffWithoutActiveStoreAfterArchive(business.id) });
  const openStoreDelete = (business) => { const hasRecords = storeHasRecords(business); setDeleteTarget({ type: "store", item: business, hasRecords, affectedStaff: hasRecords ? staffWithoutActiveStoreAfterArchive(business.id) : [] }); };
  const addStore = () => {
    if (!newStoreName.trim()) return;
    const id = `custom-${Date.now()}`;
    setConfiguredBusinesses((current) => [...current, { id, nameAr: newStoreName.trim(), nameEn: newStoreName.trim(), customLocation: newStoreLocation.trim(), day: { ...emptyStoreRecord }, month: { ...emptyStoreRecord } }]);
    setNewStoreName(""); setNewStoreLocation(""); setShowAddStore(false); showSettingsSaved();
  };
  const startManagingTeam = () => { setDraftStaff(staff.map((person) => ({ ...person, storeIds: [...(person.storeIds || [])] }))); setManagingTeam(true); };
  const cancelManagingTeam = () => { setDraftStaff(null); setManagingTeam(false); setNewEmployeeName(""); setNewEmployeeMobile(""); setNewEmployeeStoreIds([]); };
  const saveManagingTeam = () => { if (!draftStaff) return; setStaff(draftStaff); cancelManagingTeam(); showSettingsSaved(); };
  const addStaff = () => {
    if (!newEmployeeName.trim() || newEmployeeStoreIds.length === 0 || !managingTeam) return;
    setDraftStaff((current) => [...(current || staff), { id: `staff-${Date.now()}`, nameAr: newEmployeeName.trim(), nameEn: newEmployeeName.trim(), mobile: newEmployeeMobile.trim(), active: true, storeIds: newEmployeeStoreIds, pin: PROTOTYPE_EMPLOYEE_PIN_DEFAULT }]);
    setNewEmployeeName(""); setNewEmployeeMobile(""); setNewEmployeeStoreIds([]);
  };
  const toggleEmployeeActive = (personId) => { if (managingTeam) setDraftStaff((current) => (current || staff).map((person) => person.id === personId ? { ...person, active: !person.active } : person)); };
  const toggleEmployeeStore = (personId, storeId) => { if (!managingTeam) return; setDraftStaff((current) => (current || staff).map((person) => { if (person.id !== personId) return person; const assigned = employeeStoreIds(person); const next = assigned.includes(storeId) ? assigned.filter((item) => item !== storeId) : [...assigned, storeId]; return { ...person, storeIds: next.length ? next : assigned }; })); };
  const toggleNewEmployeeStore = (storeId) => setNewEmployeeStoreIds((current) => current.includes(storeId) ? current.filter((item) => item !== storeId) : [...current, storeId]);
  const confirmDelete = () => {
    if (!deleteTarget) return;
    if (deleteTarget.type === "archive") { setArchivedBusinessIds((current) => current.includes(deleteTarget.item.id) ? current : [...current, deleteTarget.item.id]); closeStore(); }
    if (deleteTarget.type === "store") {
      if (deleteTarget.hasRecords) setArchivedBusinessIds((current) => current.includes(deleteTarget.item.id) ? current : [...current, deleteTarget.item.id]);
      else {
        setConfiguredBusinesses((current) => current.filter((business) => business.id !== deleteTarget.item.id));
        setArchivedBusinessIds((current) => current.filter((id) => id !== deleteTarget.item.id));
        setStaff((current) => current.map((person) => ({ ...person, storeIds: (person.storeIds || []).filter((id) => id !== deleteTarget.item.id) })));
        setLastCloseoutDates((current) => { const next = { ...current }; delete next[deleteTarget.item.id]; return next; });
        if (selectedBusiness === deleteTarget.item.id) setSelectedBusiness("all");
        setArchivedReadOnlyBusinessId(null);
        setStoreChannelSettings((current) => { const next = { ...current }; delete next[deleteTarget.item.id]; return next; });
        setStoreOperationalSettings((current) => { const next = { ...current }; delete next[deleteTarget.item.id]; return next; });
      }
      closeStore();
    }
    if (deleteTarget.type === "channel") updateChannelDraft((config) => ({ activeIds: config.activeIds.filter((id) => id !== deleteTarget.item.id), channels: config.channels.map((channel) => channel.id === deleteTarget.item.id ? { ...channel, retired: true } : channel) }));
    if (deleteTarget.type === "staff") {
      const removePerson = (current) => current.map((person) => person.id === deleteTarget.item.id ? { ...person, active: false, removed: true } : person);
      if (managingTeam) setDraftStaff((current) => removePerson(current || staff)); else setStaff(removePerson);
    }
    setDeleteTarget(null);
  };
  const deleteDialog = deleteTarget ? {
    title: deleteTarget.type === "archive" ? text(lang, "archiveStoreTitle") : deleteTarget.type === "store" ? text(lang, deleteTarget.hasRecords ? "storeDeleteWithDataTitle" : "storeDeleteEmptyTitle") : text(lang, deleteTarget.type === "channel" ? "channelDeleteTitle" : "userDeleteTitle"),
    desc: deleteTarget.type === "archive" ? text(lang, "archiveStoreDesc") : deleteTarget.type === "store" ? text(lang, deleteTarget.hasRecords ? "storeDeleteWithDataDesc" : "storeDeleteEmptyDesc") : text(lang, deleteTarget.type === "channel" ? "channelDeleteDesc" : "userDeleteDesc"),
    action: deleteTarget.type === "archive" ? text(lang, "confirmArchive") : deleteTarget.type === "store" ? text(lang, deleteTarget.hasRecords ? "archiveAndKeepData" : "deleteEmptyStore") : text(lang, deleteTarget.type === "channel" ? "retireChannel" : "revokeAccess"),
  } : null;
  const DeleteDialog = () => <AnimatePresence>{deleteDialog && <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 z-50 flex items-end bg-[#112A46]/45 sm:items-center sm:justify-center sm:p-6 lg:items-end lg:justify-start lg:p-0"><motion.div initial={{ y: 20 }} animate={{ y: 0 }} exit={{ y: 20 }} className="relative z-10 w-full rounded-t-[30px] bg-[#F8F6F0] p-5 pb-8 sm:max-w-[560px] sm:rounded-[30px] sm:p-6 lg:max-w-none lg:rounded-t-[30px] lg:rounded-b-none lg:p-5 lg:pb-8"><div className="mb-4 flex items-start justify-between"><div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#FFF1EE] text-[#B44747]"><Trash2 className="h-5 w-5" /></div><button onClick={() => setDeleteTarget(null)} className="flex h-9 w-9 items-center justify-center rounded-xl bg-white"><X className="h-4 w-4" /></button></div><h3 className="text-base font-black">{deleteDialog.title}</h3><p className="mt-2 text-[12px] font-bold leading-6 text-[#716753]">{deleteDialog.desc}</p><div className="mt-4 rounded-2xl bg-[#FFF4D2] p-3 text-[10px] font-bold leading-5 text-[#806528]">{text(lang, "safeDeleteNotice")}</div>{deleteTarget?.affectedStaff?.length > 0 && <div className="mt-3 rounded-2xl bg-[#FFF1EE] p-3 text-[10px] font-bold leading-5 text-[#B44747]"><p>{text(lang, "archiveStaffWarning")}</p><p className="mt-1">{deleteTarget.affectedStaff.map((person) => lang === "ar" ? person.nameAr : person.nameEn).join(" · ")}</p></div>}<div className="mt-5 grid grid-cols-[0.9fr_1.35fr] gap-3"><button onClick={() => setDeleteTarget(null)} className="rounded-2xl bg-white py-3.5 text-xs font-black ring-1 ring-black/[0.06]">{text(lang, "cancel")}</button><button onClick={confirmDelete} className="rounded-2xl bg-[#B44747] py-3.5 text-xs font-black text-white">{deleteDialog.action}</button></div></motion.div></motion.div>}</AnimatePresence>;
  const Arrow = lang === "ar" ? ChevronLeft : ChevronRight;
  const SettingsLink = ({ icon: Icon, title, desc = "", value = "", onClick, danger = false, border = true }) => <button onClick={onClick} className={`flex w-full items-center gap-3 px-4 py-4 text-start ${border ? "border-b border-[#F0ECE2]" : ""}`}><span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl ${danger ? "bg-[#FFF1EE] text-[#B44747]" : "bg-[#F7F5EF] text-[#806528]"}`}><Icon className="h-5 w-5" /></span><span className="min-w-0 flex-1"><span className={`block text-[13px] font-black ${danger ? "text-[#B44747]" : "text-[#112A46]"}`}>{title}</span>{desc && <span className="mt-0.5 block truncate text-[10px] font-bold text-[#827762]">{desc}</span>}</span>{value && <span className="shrink-0 text-[10px] font-bold text-[#827762]">{value}</span>}<Arrow className={`h-4 w-4 shrink-0 ${danger ? "text-[#B44747]" : "text-[#B99844]"}`} /></button>;
  const PageHeader = ({ title, onBack }) => <BackTitle lang={lang} title={title} onBack={onBack} />;

  if (settingsStoreId && selectedStore) {
    if (storePanel === "profile") return <motion.section initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="px-5 pb-24"><PageHeader title={lang === "ar" ? "بيانات المحل" : "Shop details"} onBack={backFromStorePanel} /><div className="rounded-3xl bg-white p-4 ring-1 ring-black/[0.045]"><p className="mb-2 text-xs font-bold text-[#716753]">{text(lang, "shopName")}</p><input value={draftStoreName} onChange={(event) => setDraftStoreName(event.target.value)} maxLength={80} className="mb-4 w-full rounded-2xl bg-[#F7F5EF] px-4 py-3 text-xs font-black outline-none" /><p className="mb-2 text-xs font-bold text-[#716753]">{text(lang, "newStoreLocation")}</p><input value={draftStoreLocation} onChange={(event) => setDraftStoreLocation(event.target.value)} maxLength={100} className="w-full rounded-2xl bg-[#F7F5EF] px-4 py-3 text-xs font-black outline-none" /><p className="mt-4 rounded-2xl bg-[#FFF4D2] p-3 text-[10px] font-bold leading-5 text-[#806528]">{text(lang, "renameStoreHint")}</p><button disabled={!draftStoreName.trim()} onClick={saveStoreProfile} className={`mt-5 w-full rounded-2xl py-3.5 text-xs font-black text-white ${draftStoreName.trim() ? "bg-[#112A46]" : "bg-[#B8C0B7]"}`}>{text(lang, "saveSettings")}</button></div><DeleteDialog /></motion.section>;
    if (storePanel === "channels") return <motion.section initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="px-5 pb-24"><PageHeader title={text(lang, "salesChannels")} onBack={backFromStorePanel} /><p className="mb-3 rounded-2xl bg-[#FFF4D2] p-3 text-[10px] font-bold leading-5 text-[#806528]">{text(lang, "channelControlHint")}</p><div className="mb-4 overflow-hidden rounded-3xl bg-white ring-1 ring-black/[0.045]">{visibleChannels.map((channel, index) => <div key={channel.id} className={`flex items-center justify-between gap-3 px-4 py-4 ${index < visibleChannels.length - 1 ? "border-b border-[#F0ECE2]" : ""}`}><div className="min-w-0"><p className="text-xs font-black">{channelName(channel, lang)}</p><p className="mt-1 text-[10px] font-bold text-[#827762]">{channelConfig.activeIds.includes(channel.id) ? text(lang, "active") : text(lang, "stopChannel")}</p></div><div className="flex items-center gap-2"><SettingToggle enabled={channelConfig.activeIds.includes(channel.id)} onToggle={() => toggleChannel(channel.id)} /><button onClick={() => requestRetireChannel(channel)} className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#FFF1EE] text-[#B44747]"><Trash2 className="h-3.5 w-3.5" /></button></div></div>)}</div><div className="mb-4 rounded-3xl bg-white p-4 ring-1 ring-black/[0.045]"><p className="mb-3 text-xs font-black">{text(lang, "addChannel")}</p><div className="flex gap-2"><input value={newChannelName} onChange={(event) => setNewChannelName(event.target.value)} placeholder={text(lang, "newChannelName")} className="min-w-0 flex-1 rounded-2xl bg-[#F7F5EF] px-3 py-3 text-xs font-bold outline-none" /><button onClick={addSalesChannel} className="rounded-2xl bg-[#112A46] px-4 text-xs font-black text-white"><Plus className="h-4 w-4" /></button></div>{retiredChannels.length > 0 && <div className="mt-4 border-t border-[#F0ECE2] pt-4"><p className="mb-2 text-[10px] font-bold text-[#827762]">{text(lang, "stoppedChannels")}</p>{retiredChannels.map((channel) => <button key={channel.id} onClick={() => restoreSalesChannel(channel)} className="mb-2 flex w-full items-center justify-between rounded-xl bg-[#F7F5EF] px-3 py-3 text-[10px] font-black text-[#257844]"><span>{channelName(channel, lang)}</span><span>{text(lang, "restoreChannel")}</span></button>)}</div>}</div>{settingsNotice && <p className="mb-3 rounded-xl bg-[#FFF1EE] p-3 text-[10px] font-bold text-[#B44747]">{settingsNotice}</p>}<div className="grid grid-cols-[0.9fr_1.35fr] gap-3"><button onClick={backFromStorePanel} className="rounded-2xl bg-white py-3.5 text-xs font-black ring-1 ring-black/[0.05]">{text(lang, "cancelChanges")}</button><button onClick={saveChannelSettings} className="rounded-2xl bg-[#112A46] py-3.5 text-xs font-black text-white">{text(lang, "saveSettings")}</button></div><DeleteDialog /></motion.section>;
    if (storePanel === "expenses") return <motion.section initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="px-5 pb-24"><PageHeader title={text(lang, "outflowCategories")} onBack={backFromStorePanel} /><p className="mb-3 rounded-2xl bg-[#FFF4D2] p-3 text-[10px] font-bold leading-5 text-[#806528]">{lang === "ar" ? "تظهر هذه البنود عند اختيار نوع العملية: مصروف. إيقاف البند لا يغير التقارير السابقة." : "These items appear only for Expense entries. Disabling an item does not change historical reports."}</p><div className="mb-4 overflow-hidden rounded-3xl bg-white ring-1 ring-black/[0.045]">{expenseCategories.map((item, index) => <div key={item.id} className={`flex items-center justify-between px-4 py-4 ${index < expenseCategories.length - 1 ? "border-b border-[#F0ECE2]" : ""}`}><p className="text-xs font-black">{text(lang, item.label)}</p><SettingToggle enabled={operationalConfig.activeCategories.includes(item.id)} onToggle={() => toggleCategory(item.id)} /></div>)}</div>{settingsNotice && <p className="mb-3 rounded-xl bg-[#FFF1EE] p-3 text-[10px] font-bold text-[#B44747]">{settingsNotice}</p>}<p className="mb-4 text-[10px] font-bold leading-5 text-[#827762]">{lang === "ar" ? "إضافة بنود مخصصة ستنفذ في النسخة الإنتاجية بعد بناء نموذج البيانات الموحد." : "Custom expense items will be implemented in the production build with the unified data model."}</p><div className="grid grid-cols-[0.9fr_1.35fr] gap-3"><button onClick={backFromStorePanel} className="rounded-2xl bg-white py-3.5 text-xs font-black ring-1 ring-black/[0.05]">{text(lang, "cancelChanges")}</button><button onClick={saveOperationalSettings} className="rounded-2xl bg-[#112A46] py-3.5 text-xs font-black text-white">{text(lang, "saveSettings")}</button></div></motion.section>;
    if (storePanel === "review") return <motion.section initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="px-5 pb-24"><PageHeader title={lang === "ar" ? "مراجعة الصور والتنبيهات" : "Photo review & notifications"} onBack={backFromStorePanel} /><div className="mb-4 overflow-hidden rounded-3xl bg-white ring-1 ring-black/[0.045]"><SettingRow border title={text(lang, "reviewWorkflow")} desc={text(lang, "reviewWorkflowDesc")} toggle={<SettingToggle enabled={operationalConfig.reviewEnabled} onToggle={() => updateOperationalDraft({ reviewEnabled: !operationalConfig.reviewEnabled })} />} /><SettingRow border title={text(lang, "pendingAttachmentAlert")} desc={text(lang, "pendingAttachmentAlertDesc")} toggle={<SettingToggle disabled={!operationalConfig.reviewEnabled} enabled={operationalConfig.attachmentAlert} onToggle={() => updateOperationalDraft({ attachmentAlert: !operationalConfig.attachmentAlert })} />} /><SettingRow title={text(lang, "dailyCloseoutAlert")} desc={text(lang, "dailyCloseoutAlertPrototype")} toggle={<SettingToggle enabled={operationalConfig.closeoutAlert} onToggle={() => updateOperationalDraft({ closeoutAlert: !operationalConfig.closeoutAlert })} />} /></div><div className="grid grid-cols-[0.9fr_1.35fr] gap-3"><button onClick={backFromStorePanel} className="rounded-2xl bg-white py-3.5 text-xs font-black ring-1 ring-black/[0.05]">{text(lang, "cancelChanges")}</button><button onClick={saveOperationalSettings} className="rounded-2xl bg-[#112A46] py-3.5 text-xs font-black text-white">{text(lang, "saveSettings")}</button></div></motion.section>;
    if (storePanel === "staff") return <motion.section initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="px-5 pb-24"><PageHeader title={text(lang, "linkedEmployees")} onBack={backFromStorePanel} /><div className="mb-4 rounded-3xl bg-white p-4 ring-1 ring-black/[0.045]">{linkedStaff.length ? linkedStaff.map((person, index) => <div key={person.id} className={`flex items-center gap-3 py-3 ${index < linkedStaff.length - 1 ? "border-b border-[#F0ECE2]" : ""}`}><UserRound className="h-5 w-5 text-[#806528]" /><div><p className="text-xs font-black">{lang === "ar" ? person.nameAr : person.nameEn}</p><p dir="ltr" className="text-[10px] text-[#827762]">{person.mobile}</p></div></div>) : <p className="text-xs font-bold text-[#827762]">{text(lang, "noLinkedEmployees")}</p>}</div><button onClick={() => { closeStore(); setSection("team"); }} className="w-full rounded-2xl bg-[#112A46] py-3.5 text-xs font-black text-white">{lang === "ar" ? "إدارة الفريق والصلاحيات" : "Manage team access"}</button></motion.section>;
    return <motion.section initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="px-5 pb-24"><PageHeader title={text(lang, "storeSettings")} onBack={closeStore} /><div className="mb-5 rounded-3xl bg-white p-4 ring-1 ring-black/[0.045]"><div className="flex items-center gap-3"><div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#112A46] text-[#E4B84A]"><Building2 className="h-6 w-6" /></div><div className="min-w-0 flex-1"><p className="truncate text-sm font-black">{displayBusinessName(selectedStore)}</p><p className="mt-1 truncate text-[11px] font-bold text-[#827762]">{displayLocation(selectedStore)}</p></div><Badge tone={archived ? "warning" : "success"}>{text(lang, archived ? "archivedStore" : "storeActive")}</Badge></div></div><div className="mb-5 overflow-hidden rounded-3xl bg-white ring-1 ring-black/[0.045]"><SettingsLink icon={Building2} title={lang === "ar" ? "بيانات المحل" : "Shop details"} desc={displayLocation(selectedStore)} onClick={() => openStorePanel("profile")} /><SettingsLink icon={CreditCard} title={text(lang, "salesChannels")} value={`${activeChannelCount}`} onClick={() => openStorePanel("channels")} /><SettingsLink icon={ReceiptText} title={text(lang, "outflowCategories")} value={`${activeCategoryCount}`} onClick={() => openStorePanel("expenses")} /><SettingsLink icon={Bell} title={lang === "ar" ? "مراجعة الصور والتنبيهات" : "Photo review & notifications"} value={operationalConfig.reviewEnabled ? text(lang, "active") : text(lang, "stopChannel")} onClick={() => openStorePanel("review")} /><SettingsLink icon={UserRound} title={text(lang, "linkedEmployees")} value={`${linkedStaff.length}`} onClick={() => openStorePanel("staff")} border={false} /></div>{archived && <div className="mb-5 rounded-3xl bg-[#FFF4D2] p-4"><Badge tone="warning">{text(lang, "archivedReadOnly")}</Badge><p className="mt-3 text-[11px] font-bold text-[#806528]">{text(lang, "archiveNotice")}</p><div className="mt-4 grid grid-cols-2 gap-2"><button onClick={() => { setArchivedReadOnlyBusinessId(selectedStore.id); setSelectedBusiness(selectedStore.id); setOwnerPage("reports"); }} className="rounded-xl bg-white py-3 text-[10px] font-black">{text(lang, "viewPastReports")}</button><button onClick={() => { setArchivedReadOnlyBusinessId(selectedStore.id); setSelectedBusiness(selectedStore.id); setOwnerPage("register"); }} className="rounded-xl bg-white py-3 text-[10px] font-black">{text(lang, "viewPastAttachments")}</button></div></div>}<p className="mb-2 text-xs font-bold text-[#716753]">{lang === "ar" ? "الإدارة" : "Management"}</p>{archived ? <button onClick={() => toggleArchive(selectedStore.id)} className="w-full rounded-2xl bg-white py-3.5 text-xs font-black text-[#257844] ring-1 ring-black/[0.05]">{text(lang, "storeActive")}</button> : <div className="flex gap-3"><button onClick={() => requestArchiveStore(selectedStore)} className="flex-1 rounded-2xl bg-white py-3.5 text-xs font-black text-[#B96725] ring-1 ring-black/[0.05]">{text(lang, "archiveStore")}</button><button onClick={() => openStoreDelete(selectedStore)} className="flex-1 rounded-2xl bg-[#FFF1EE] py-3.5 text-xs font-black text-[#B44747]">{text(lang, "deleteStore")}</button></div>}{settingsSuccess && <div className="mt-4 rounded-2xl bg-[#E6F5E9] p-3 text-center text-[11px] font-black text-[#257844]">{text(lang, "changesSaved")}</div>}<DeleteDialog /></motion.section>;
  }

  if (section === "account") return <motion.section initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="px-5 pb-24"><PageHeader title={text(lang, "myAccountSecurity")} onBack={() => setSection("home")} /><div className="mb-5 rounded-3xl bg-white p-4 ring-1 ring-black/[0.045]"><p className="mb-2 text-xs font-bold text-[#716753]">{text(lang, "ownerFullName")}</p><input value={draftOwnerName} onChange={(event) => setDraftOwnerName(event.target.value)} maxLength={80} className="w-full rounded-2xl bg-[#F7F5EF] px-4 py-3 text-xs font-black outline-none" /><p className="mt-4 rounded-2xl bg-[#FFF4D2] p-3 text-[10px] font-bold leading-5 text-[#806528]">{text(lang, "ownerRenameProfileHint")}</p><button disabled={!draftOwnerName.trim() || draftOwnerName.trim() === ownerProfile?.name} onClick={saveOwnerProfile} className={`mt-5 w-full rounded-2xl py-3.5 text-xs font-black text-white ${draftOwnerName.trim() && draftOwnerName.trim() !== ownerProfile?.name ? "bg-[#112A46]" : "bg-[#B8C0B7]"}`}>{text(lang, "saveAccountSettings")}</button>{settingsSuccess && <div className="mt-4 rounded-xl bg-[#E6F5E9] p-3 text-center text-[10px] font-black text-[#257844]">{text(lang, "changesSaved")}</div>}</div><p className="mb-2 text-xs font-bold text-[#716753]">{text(lang, "loginMethod")}</p><div className="overflow-hidden rounded-3xl bg-white ring-1 ring-black/[0.045]"><div className="flex items-center justify-between gap-3 border-b border-[#F0ECE2] px-4 py-4"><div><p className="text-xs font-black text-[#112A46]">{text(lang, "mobileOtpLogin")}</p><p className="mt-1 text-[10px] font-bold text-[#827762]">{text(lang, "currentLoginMethod")}</p></div><Badge tone="success">{text(lang, "active")}</Badge></div><div className="flex items-center justify-between gap-3 px-4 py-4"><div><p className="text-xs font-black text-[#112A46]">{text(lang, "usernamePasswordLogin")}</p><p className="mt-1 text-[10px] font-bold text-[#827762]">{text(lang, "futureLoginOnLoginScreen")}</p></div><Badge tone="success">{text(lang, "prototypeDemoAccess")}</Badge></div></div></motion.section>;
  if (section === "stores") return <motion.section initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="px-5 pb-24"><PageHeader title={lang === "ar" ? "المحلات" : "Shops"} onBack={() => setSection("home")} /><div className="mb-3 flex items-center justify-between"><p className="text-xs font-bold text-[#716753]">{text(lang, "activeStores")}</p><button onClick={() => setShowAddStore(!showAddStore)} className="flex items-center gap-1 text-[11px] font-black text-[#9A823E]"><Plus className="h-3.5 w-3.5" />{text(lang, "addStore")}</button></div>{showAddStore && <div className="mb-4 rounded-3xl bg-white p-4 ring-1 ring-black/[0.045]"><input value={newStoreName} onChange={(event) => setNewStoreName(event.target.value)} placeholder={text(lang, "newStoreName")} className="mb-2 w-full rounded-2xl bg-[#F7F5EF] px-4 py-3 text-xs font-bold outline-none" /><input value={newStoreLocation} onChange={(event) => setNewStoreLocation(event.target.value)} placeholder={text(lang, "newStoreLocation")} className="mb-4 w-full rounded-2xl bg-[#F7F5EF] px-4 py-3 text-xs font-bold outline-none" /><button onClick={addStore} className="w-full rounded-2xl bg-[#112A46] py-3 text-xs font-black text-white">{text(lang, "confirmAddStore")}</button></div>}<div className="mb-4 overflow-hidden rounded-3xl bg-white ring-1 ring-black/[0.045]">{activeStoredBusinesses.length ? activeStoredBusinesses.map((business, index) => <button key={business.id} onClick={() => openStore(business.id)} className={`flex w-full items-center justify-between px-4 py-4 text-start ${index < activeStoredBusinesses.length - 1 ? "border-b border-[#F0ECE2]" : ""}`}><div><p className="text-xs font-black">{displayBusinessName(business)}</p><p className="mt-1 text-[10px] font-bold text-[#827762]">{displayLocation(business)} · <span className="text-[#257844]">{text(lang, "storeActive")}</span></p></div><Arrow className="h-4 w-4 text-[#B99844]" /></button>) : <p className="p-5 text-center text-xs font-bold text-[#827762]">{text(lang, "noActiveStores")}</p>}</div>{archivedStoredBusinesses.length > 0 && <><button onClick={() => setShowArchivedStores(!showArchivedStores)} className="mb-3 flex items-center gap-1 text-[11px] font-black text-[#9A823E]">{text(lang, showArchivedStores ? "hideArchived" : "showArchived")} ({archivedStoredBusinesses.length})<ChevronDown className={`h-3.5 w-3.5 ${showArchivedStores ? "rotate-180" : ""}`} /></button>{showArchivedStores && <div className="overflow-hidden rounded-3xl bg-white ring-1 ring-black/[0.045]">{archivedStoredBusinesses.map((business) => <button key={business.id} onClick={() => openStore(business.id)} className="flex w-full items-center justify-between px-4 py-4 text-start opacity-70"><div><p className="text-xs font-black">{displayBusinessName(business)}</p><p className="mt-1 text-[10px] font-bold text-[#B96725]">{text(lang, "archivedStore")}</p></div><Arrow className="h-4 w-4" /></button>)}</div>}</>}<DeleteDialog /></motion.section>;
  if (section === "team") return <motion.section initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="px-5 pb-24"><PageHeader title={lang === "ar" ? "الفريق والصلاحيات" : "Team & access"} onBack={() => { cancelManagingTeam(); setSection("home"); }} /><div className="mb-3 flex items-center justify-between"><p className="text-[10px] font-bold text-[#806528]">{text(lang, "employeeEntryOnly")}</p><button onClick={() => managingTeam ? cancelManagingTeam() : startManagingTeam()} className="text-[11px] font-black text-[#9A823E]">{text(lang, managingTeam ? "cancelChanges" : "configure")}</button></div><div className="mb-4 overflow-hidden rounded-3xl bg-white ring-1 ring-black/[0.045]">{visibleStaff.map((person, index) => <div key={person.id} className={`p-4 ${index < visibleStaff.length - 1 || managingTeam ? "border-b border-[#F0ECE2]" : ""}`}><div className="flex items-center justify-between"><div><p className="text-sm font-black">{lang === "ar" ? person.nameAr : person.nameEn}</p><p className="mt-1 text-[10px] font-bold text-[#827762]">{person.active ? text(lang, "active") : text(lang, "stopChannel")} · {employeeStoreIds(person).length} {lang === "ar" ? "محل" : "shop(s)"}</p></div><div className="flex items-center gap-2"><SettingToggle disabled={!managingTeam} enabled={person.active} onToggle={() => toggleEmployeeActive(person.id)} />{managingTeam && <button onClick={() => setDeleteTarget({ type: "staff", item: person })} className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#FFF1EE] text-[#B44747]"><Trash2 className="h-3.5 w-3.5" /></button>}</div></div>{managingTeam && <div className="mt-3 flex flex-wrap gap-2">{activeStoredBusinesses.map((business) => <button key={business.id} onClick={() => toggleEmployeeStore(person.id, business.id)} className={`rounded-full px-3 py-2 text-[10px] font-bold ${employeeStoreIds(person).includes(business.id) ? "bg-[#112A46] text-white" : "bg-[#F0ECE2] text-[#827762]"}`}>{displayBusinessName(business)}</button>)}</div>}</div>)}{managingTeam && <div className="p-4"><p className="mb-3 text-xs font-black">{text(lang, "addEmployee")}</p><input value={newEmployeeName} onChange={(event) => setNewEmployeeName(event.target.value)} placeholder={text(lang, "newEmployeeName")} className="mb-2 w-full rounded-2xl bg-[#F7F5EF] px-4 py-3 text-xs font-bold outline-none" /><input value={newEmployeeMobile} onChange={(event) => setNewEmployeeMobile(event.target.value)} placeholder={text(lang, "employeeMobile")} className="mb-3 w-full rounded-2xl bg-[#F7F5EF] px-4 py-3 text-xs font-bold outline-none" /><div className="mb-3 flex flex-wrap gap-2">{activeStoredBusinesses.map((business) => <button key={business.id} onClick={() => toggleNewEmployeeStore(business.id)} className={`rounded-full px-3 py-2 text-[10px] font-bold ${newEmployeeStoreIds.includes(business.id) ? "bg-[#112A46] text-white" : "bg-[#F0ECE2] text-[#827762]"}`}>{displayBusinessName(business)}</button>)}</div><button disabled={!newEmployeeName.trim() || !newEmployeeStoreIds.length} onClick={addStaff} className={`w-full rounded-2xl py-3 text-xs font-black text-white ${newEmployeeName.trim() && newEmployeeStoreIds.length ? "bg-[#112A46]" : "bg-[#B8C0B7]"}`}>{text(lang, "addEmployee")}</button></div>}</div>{managingTeam && <div className="grid grid-cols-[0.9fr_1.35fr] gap-3"><button onClick={cancelManagingTeam} className="rounded-2xl bg-white py-3.5 text-xs font-black ring-1 ring-black/[0.05]">{text(lang, "cancelChanges")}</button><button onClick={saveManagingTeam} className="rounded-2xl bg-[#112A46] py-3.5 text-xs font-black text-white">{text(lang, "saveTeamChanges")}</button></div>}<DeleteDialog /></motion.section>;
  if (section === "appearance") return <motion.section initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="px-5 pb-24"><PageHeader title={text(lang, "notebookAppearance")} onBack={() => setSection("home")} /><div className="rounded-3xl bg-white p-4 ring-1 ring-black/[0.045]"><p className="mb-2 text-[11px] font-bold text-[#827762]">{lang === "ar" ? "اختر شكل دفتر التقفيلة والتقارير وصور المشاركة." : "Choose the notebook style for closeouts, reports, and sharing."}</p><ThemePicker lang={lang} theme={draftNotebookTheme} onChange={(nextTheme) => { setDraftNotebookTheme(nextTheme); setThemeDirty(nextTheme !== notebookTheme); }} /><p className="mt-4 rounded-2xl bg-[#FFF4D2] p-3 text-[10px] font-bold leading-5 text-[#806528]">{text(lang, "autoSavedAccount")}</p>{themeDirty && <div className="mt-4 grid grid-cols-[0.9fr_1.35fr] gap-3"><button onClick={() => { setDraftNotebookTheme(notebookTheme); setThemeDirty(false); }} className="rounded-2xl bg-[#F7F5EF] py-3 text-xs font-black">{text(lang, "cancelChanges")}</button><button onClick={() => { setNotebookTheme(draftNotebookTheme); setThemeDirty(false); showSettingsSaved(); }} className="rounded-2xl bg-[#112A46] py-3 text-xs font-black text-white">{text(lang, "saveSettings")}</button></div>}{settingsSuccess && <div className="mt-4 rounded-xl bg-[#E6F5E9] p-3 text-center text-[10px] font-black text-[#257844]">{text(lang, "changesSaved")}</div>}</div></motion.section>;
  if (section === "subscription") return <motion.section initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="px-5 pb-24"><PageHeader title={lang === "ar" ? "الخطة والاشتراك" : "Plan & subscription"} onBack={() => setSection("home")} /><div className="rounded-3xl bg-white p-5 ring-1 ring-black/[0.045]"><Badge tone="navy">{text(lang, "currentPlan")}</Badge><h3 className="mt-4 text-lg font-black">{lang === "ar" ? "نسخة التطوير الحالية" : "Current development access"}</h3><p className="mt-2 text-[12px] font-bold leading-6 text-[#716753]">{text(lang, "monthlyPrice")}</p><div className="mt-5 rounded-2xl bg-[#FFF4D2] p-4 text-[11px] font-bold leading-6 text-[#806528]">{lang === "ar" ? "سيتم ربط الاشتراك بالمنشأة وليس بالمحل، مع تحديد عدد المحلات والموظفين وميزات التصدير لاحقًا." : "Subscription will be tied to the organization, not an individual shop, with plan limits added later."}</div></div></motion.section>;
  if (section === "support") return <motion.section initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="px-5 pb-24"><PageHeader title={text(lang, "support")} onBack={() => setSection("home")} /><div className="overflow-hidden rounded-3xl bg-white ring-1 ring-black/[0.045]"><SettingsLink icon={Smartphone} title={text(lang, "whatsappSupport")} onClick={onOpenSupport} border /><SettingsLink icon={FileText} title={text(lang, "helpCenter")} onClick={onOpenHelp} border={false} /></div></motion.section>;
  return <motion.section initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="px-5 pb-24"><div className="mb-5"><p className="text-xs font-bold text-[#8B8274]">{text(lang, "ownerAccount")}</p><h1 className="text-xl font-black">{text(lang, "settings")}</h1></div><button onClick={() => setSection("account")} className="mb-5 flex w-full items-center gap-4 rounded-3xl bg-white p-4 text-start ring-1 ring-black/[0.045]"><div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#112A46] text-white"><UserRound className="h-6 w-6" /></div><div className="min-w-0 flex-1"><p className="text-sm font-black">{ownerProfile?.name || text(lang, "ownerName")}</p><p className="mt-1 text-[11px] font-bold text-[#827762]">{text(lang, "myAccountSecurity")}</p></div><Arrow className="h-4 w-4 shrink-0 text-[#B99844]" /></button><p className="mb-2 text-xs font-bold text-[#716753]">{lang === "ar" ? "المنشأة" : "Organization"}</p><div className="mb-5 overflow-hidden rounded-3xl bg-white ring-1 ring-black/[0.045]"><SettingsLink icon={Building2} title={lang === "ar" ? "المحلات" : "Shops"} value={`${activeStoredBusinesses.length}`} onClick={() => setSection("stores")} /><SettingsLink icon={UserRound} title={lang === "ar" ? "الفريق والصلاحيات" : "Team & access"} value={`${visibleStaff.length}`} onClick={() => setSection("team")} /><SettingsLink icon={CreditCard} title={lang === "ar" ? "الخطة والاشتراك" : "Plan & subscription"} value={lang === "ar" ? "تجريبي" : "Trial"} onClick={() => setSection("subscription")} border={false} /></div><p className="mb-2 text-xs font-bold text-[#716753]">{lang === "ar" ? "التفضيلات" : "Preferences"}</p><div className="mb-5 overflow-hidden rounded-3xl bg-white ring-1 ring-black/[0.045]"><SettingsLink icon={ReceiptText} title={text(lang, "notebookAppearance")} value={text(lang, notebookTheme)} onClick={() => setSection("appearance")} border={false} /></div><p className="mb-2 text-xs font-bold text-[#716753]">{text(lang, "support")}</p><div className="overflow-hidden rounded-3xl bg-white ring-1 ring-black/[0.045]"><SettingsLink icon={Smartphone} title={text(lang, "contactSupport")} onClick={() => setSection("support")} /><SettingsLink icon={UserRound} title={text(lang, "logout")} onClick={onLogout} danger border={false} /></div></motion.section>;
}

function SettingRow({ title, desc, toggle, border }) { return <div className={`flex items-center justify-between px-4 py-4 ${border ? "border-b border-[#F0ECE2]" : ""}`}><div><p className="text-sm font-black">{title}</p><p className="mt-1 text-[11px] text-[#827762]">{desc}</p></div>{toggle}</div>; }
function ActionRow({ label, lang, danger = false, border = false, onClick = () => {} }) { const Arrow = lang === "ar" ? ChevronLeft : ChevronRight; return <button type="button" onClick={onClick} className={`flex w-full items-center justify-between px-4 py-4 text-sm font-black ${border ? "border-b border-[#F0ECE2]" : ""} ${danger ? "text-[#B44747]" : "text-[#112A46]"}`}><span>{label}</span><Arrow className="h-4 w-4" /></button>; }

const notebookThemes = {
  yellow: {
    paper: "#F7DE85",
    line: "rgba(66,90,111,0.14)",
    margin: "rgba(204,105,96,0.46)",
    shadow: "0 12px 24px rgba(160,118,31,0.16)",
    ring: false,
  },
  softYellow: {
    paper: "#FFF0B8",
    line: "rgba(66,90,111,0.12)",
    margin: "rgba(204,105,96,0.44)",
    shadow: "0 12px 24px rgba(160,118,31,0.11)",
    ring: false,
  },
  ivory: {
    paper: "#FFF8E8",
    line: "rgba(84,116,154,0.13)",
    margin: "rgba(204,105,96,0.42)",
    shadow: "0 12px 24px rgba(120,96,53,0.09)",
    ring: true,
  },
  white: {
    paper: "#FFFDF8",
    line: "rgba(84,116,154,0.15)",
    margin: "rgba(204,105,96,0.45)",
    shadow: "0 12px 24px rgba(17,42,70,0.08)",
    ring: true,
  },
  greenTint: {
    paper: "#EEF2DF",
    line: "rgba(62,91,84,0.13)",
    margin: "rgba(204,105,96,0.41)",
    shadow: "0 12px 24px rgba(64,88,70,0.09)",
    ring: true,
  },
};

function notebookLinesBackground(theme) {
  const activeTheme = notebookThemes[theme] || notebookThemes.yellow;
  return {
    backgroundColor: activeTheme.paper,
    backgroundImage: `repeating-linear-gradient(180deg, transparent 0px, transparent 43px, ${activeTheme.line} 43px, ${activeTheme.line} 44px)`,
  };
}

/** Scrollable notebook page: lines and red margin move with content (full scroll height). */
function NotebookScrollSurface({ theme = "yellow", lang = "ar", children }) {
  const activeTheme = notebookThemes[theme] || notebookThemes.yellow;
  const isArabic = lang === "ar";
  return (
    <div className="relative min-h-full" style={notebookLinesBackground(theme)}>
      <div
        className={`taq-notebook-margin pointer-events-none absolute inset-y-0 z-0 w-[1.25px] ${isArabic ? "right-8" : "left-8"}`}
        style={{ backgroundColor: activeTheme.margin }}
      />
      <div className="relative z-[1] min-h-full">{children}</div>
    </div>
  );
}

function Notebook({ children, theme = "yellow", lang = "ar", marginContent = null, fullPage = false }) {
  const isArabic = lang === "ar";
  const activeTheme = notebookThemes[theme] || notebookThemes.yellow;
  const lines = {
    backgroundImage: `repeating-linear-gradient(180deg, transparent 0px, transparent 43px, ${activeTheme.line} 43px, ${activeTheme.line} 44px)`,
  };

  return (
    <div
      dir={isArabic ? "rtl" : "ltr"}
      className={`relative overflow-hidden px-5 pb-0 pt-0 ${fullPage ? "" : `rounded-[28px] ${activeTheme.ring ? "ring-1 ring-[#DED8CB]" : ""}`}`}
      style={{
        backgroundColor: fullPage ? "transparent" : activeTheme.paper,
        boxShadow: fullPage ? "none" : activeTheme.shadow,
        fontFamily: lang === "ar" ? "'Noto Sans Arabic', sans-serif" : "'Noto Sans', sans-serif",
      }}
    >
      {!fullPage && <div className="pointer-events-none absolute inset-0 opacity-70" style={lines} />}
      {!fullPage && (
        <div
          className={`pointer-events-none absolute bottom-0 top-0 w-[1.25px] ${isArabic ? "right-8" : "left-8"}`}
          style={{ backgroundColor: activeTheme.margin }}
        />
      )}
      {marginContent && (
        <div className={`absolute top-[18px] z-20 flex w-[29px] flex-col items-center ${isArabic ? "right-[1px]" : "left-[1px]"}`}>
          {marginContent}
        </div>
      )}
      <div className={`relative ${isArabic ? "pr-6 pl-1" : "pl-6 pr-1"}`}>{children}</div>
    </div>
  );
}
function ThemePicker({ lang, theme, onChange }) {
  const themes = [
    { id: "yellow", label: "yellow" },
    { id: "softYellow", label: "softYellow" },
    { id: "ivory", label: "ivory" },
    { id: "white", label: "white" },
    { id: "greenTint", label: "greenTint" },
  ];
  return (
    <div className="grid grid-cols-5 gap-2">
      {themes.map((item) => {
        const active = theme === item.id;
        return (
          <button key={item.id} onClick={() => onChange(item.id)} className="flex flex-col items-center gap-1.5" title={text(lang, item.label)}>
            <span className={`relative block h-7 w-7 rounded-full border ${active ? "border-[#112A46] ring-2 ring-[#112A46]/15" : "border-[#D9D1C1]"}`} style={{ backgroundColor: notebookThemes[item.id].paper }}>
              {active && <Check className="absolute inset-0 m-auto h-4 w-4 text-[#112A46]" strokeWidth={3} />}
            </span>
            <span className={`max-w-[50px] text-center text-[9px] font-bold leading-3 ${active ? "text-[#112A46]" : "text-[#827762]"}`}>{text(lang, item.label)}</span>
          </button>
        );
      })}
    </div>
  );
}
function NotebookRow({ children, lines = 1, className = "", strong = false }) {
  return (
    <div className={`flex w-full items-end pb-[8px] ${strong ? "border-t-2 border-[#112A46]/60" : ""} ${className}`} style={{ height: `${lines * 44}px` }}>
      {children}
    </div>
  );
}
function NotebookInk({ children, className = "" }) {
  return <span className={className}>{children}</span>;
}
function MoneyValue({ value }) {
  const parts = typeof value === "string" ? value.match(/^(.*?)[ ]+(ر[.]س|SAR)$/) : null;
  if (!parts) return <>{value}</>;
  return (
    <span className="inline-flex items-baseline whitespace-nowrap">
      <span>{parts[1]}</span>
      <span className="ms-1 text-[0.58em] font-bold opacity-70">{parts[2]}</span>
    </span>
  );
}
function NumberLine({ label, value, valueClassName = "text-[#112A46]" }) {
  return <div className="flex w-full items-end justify-between"><span className="text-sm font-medium">{label}</span><strong className={`tabular-nums text-base font-bold ${valueClassName}`}><MoneyValue value={value} /></strong></div>;
}

function FinancialRows({ lang, rows = [] }) {
  return (
    <div className="grid w-full grid-cols-[minmax(0,1fr)_max-content] items-baseline">
      {rows.map((row) => (
        <React.Fragment key={row.id || row.label}>
          <div className="flex h-[44px] min-w-0 items-end pb-[8px] text-sm font-medium text-[#112A46]">
            <span className="truncate">{row.label}</span>
          </div>
          <strong
            dir="ltr"
            className={`flex h-[44px] min-w-[76px] items-end whitespace-nowrap pb-[8px] tabular-nums text-base font-bold ${lang === "ar" ? "justify-start ps-4" : "justify-end pe-4"} ${row.valueClassName || "text-[#112A46]"}`}
          >
            <MoneyValue value={row.value} />
          </strong>
        </React.Fragment>
      ))}
    </div>
  );
}

function formatCalendarDate(dateString, lang) {
  const date = new Date(`${dateString}T12:00:00`);
  return new Intl.DateTimeFormat(lang === "ar" ? "ar-SA-u-ca-gregory-nu-latn" : "en-US", { day: "numeric", month: "long", year: "numeric" }).format(date);
}
function formatCalendarMonth(year, month, lang) {
  return new Intl.DateTimeFormat(lang === "ar" ? "ar-SA-u-ca-gregory-nu-latn" : "en-US", { month: "long", year: "numeric" }).format(new Date(year, month, 1));
}
function isoCalendarDate(year, month, day) {
  return `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}
function todayIsoDate() {
  const today = new Date();
  return isoCalendarDate(today.getFullYear(), today.getMonth(), today.getDate());
}
function monthSelectionValue(value) {
  const legacyMonths = { may2026: "2026-05", april2026: "2026-04", march2026: "2026-03" };
  return legacyMonths[value] || (/^[0-9]{4}-[0-9]{2}$/.test(value || "") ? value : "2026-05");
}
function monthSelectionParts(value) {
  const normalized = monthSelectionValue(value);
  const [year, month] = normalized.split("-").map(Number);
  return { year, month: month - 1, normalized };
}
function formatSelectedMonth(value, lang) {
  const { year, month } = monthSelectionParts(value);
  return formatCalendarMonth(year, month, lang);
}
function DateSelector({ lang, period, setPeriod, allowedPeriods = ["day", "month"], selectedDay, setSelectedDay, selectedDate = null, setSelectedDate = () => {}, fullCalendar = false, selectedMonth, setSelectedMonth, selectedYear = "2026", setSelectedYear = () => {}, customFrom = "2026-03-01", setCustomFrom = () => {}, customTo = "2026-05-31", setCustomTo = () => {}, compact = false }) {
  const [open, setOpen] = useState(false);
  const [calendarView, setCalendarView] = useState({ year: 2026, month: 4 });
  const [monthPickerYear, setMonthPickerYear] = useState(2026);
  const [draftCustomFrom, setDraftCustomFrom] = useState(customFrom);
  const [draftCustomTo, setDraftCustomTo] = useState(customTo);
  const selectorRef = useRef(null);
  useEffect(() => { if (!open) { setDraftCustomFrom(customFrom); setDraftCustomTo(customTo); } }, [open, customFrom, customTo]);
  useEffect(() => {
    if (!open) return undefined;
    const closeOnOutside = (event) => {
      if (selectorRef.current && !selectorRef.current.contains(event.target)) setOpen(false);
    };
    const closeOnEscape = (event) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("pointerdown", closeOnOutside);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("pointerdown", closeOnOutside);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [open]);
  const modes = allowedPeriods.map((id) => ({ id, label: id === "day" ? "day" : id === "month" ? "month" : id === "year" ? "year" : "custom" }));
  const activeDate = selectedDate || todayIsoDate();
  const selectedLabel = period === "day" ? formatCalendarDate(activeDate, lang) : period === "month" ? formatSelectedMonth(selectedMonth, lang) : period === "year" ? selectedYear : `${customFrom} — ${customTo}`;
  const promptKey = period === "day" ? "selectDay" : period === "month" ? "selectMonth" : period === "year" ? "selectYear" : "selectRange";
  const invalidCustomRange = period === "custom" && draftCustomFrom > draftCustomTo;
  const weekDays = lang === "ar" ? ["ح", "ن", "ث", "ر", "خ", "ج", "س"] : ["S", "M", "T", "W", "T", "F", "S"];
  const firstWeekday = new Date(calendarView.year, calendarView.month, 1).getDay();
  const numberOfDays = new Date(calendarView.year, calendarView.month + 1, 0).getDate();
  const calendarDates = Array.from({ length: firstWeekday }, (_, index) => ({ key: `blank-${index}` })).concat(Array.from({ length: numberOfDays }, (_, index) => ({ key: `${index + 1}`, day: index + 1, iso: isoCalendarDate(calendarView.year, calendarView.month, index + 1) })));
  const yearMonths = Array.from({ length: 12 }, (_, index) => ({ month: index, value: `${monthPickerYear}-${String(index + 1).padStart(2, "0")}`, label: formatCalendarMonth(monthPickerYear, index, lang).replace(String(monthPickerYear), "").trim() }));
  const previousMonth = () => setCalendarView((current) => current.month === 0 ? { year: current.year - 1, month: 11 } : { year: current.year, month: current.month - 1 });
  const nextMonth = () => setCalendarView((current) => current.month === 11 ? { year: current.year + 1, month: 0 } : { year: current.year, month: current.month + 1 });
  const openCalendar = () => {
    if (period === "day") {
      const selected = new Date(`${activeDate}T12:00:00`);
      setCalendarView({ year: selected.getFullYear(), month: selected.getMonth() });
    }
    if (period === "month") {
      setMonthPickerYear(monthSelectionParts(selectedMonth).year);
    }
    if (!open) { setDraftCustomFrom(customFrom); setDraftCustomTo(customTo); }
    setOpen(!open);
  };
  return (
    <div ref={selectorRef} className={`relative ${compact ? "text-center" : "text-start"}`}>
      {!compact && <p className="mb-1 text-[10px] font-bold text-[#806528]">{text(lang, promptKey)}</p>}
      <button onClick={openCalendar} className={compact ? "flex items-center justify-center gap-3 pb-1 text-[12px] font-black text-[#112A46]" : "flex max-w-[145px] items-center gap-1 pb-1 text-[11px] font-black text-[#112A46]"}>
        {compact && <ChevronDown className="h-3.5 w-3.5 shrink-0" />}
        <span className="truncate">{selectedLabel}</span>
        {compact ? <CalendarDays className="h-4 w-4 shrink-0" /> : <ChevronDown className="h-3.5 w-3.5 shrink-0" />}
      </button>
      <AnimatePresence>
        {open && (
          <motion.div initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -5 }} className={`absolute z-40 w-[270px] rounded-2xl bg-[#FFFDF7] p-3 shadow-xl ring-1 ring-[#D8CCA8] ${compact ? "left-1/2 top-10 -translate-x-1/2" : "end-0 top-12"}`}>
            <div className={`mb-3 grid gap-1 ${modes.length === 4 ? "grid-cols-4" : "grid-cols-2"}`}>
              {modes.map((mode) => <button key={mode.id} onClick={() => setPeriod(mode.id)} className={`rounded-lg py-2 text-[10px] font-bold ${period === mode.id ? "bg-[#112A46] text-white" : "text-[#806528]"}`}>{text(lang, mode.label)}</button>)}
            </div>
            {period === "day" && <div>
              <div className="mb-3 flex items-center justify-between">
                <button onClick={previousMonth} title={text(lang, "previousMonth")} className="flex h-8 w-8 items-center justify-center rounded-xl text-[#806528] hover:bg-[#FFF0CB]"><ChevronRight className={`h-4 w-4 ${lang === "en" ? "rotate-180" : ""}`} /></button>
                <strong className="text-[12px]">{formatCalendarMonth(calendarView.year, calendarView.month, lang)}</strong>
                <button onClick={nextMonth} title={text(lang, "nextMonth")} className="flex h-8 w-8 items-center justify-center rounded-xl text-[#806528] hover:bg-[#FFF0CB]"><ChevronLeft className={`h-4 w-4 ${lang === "en" ? "rotate-180" : ""}`} /></button>
              </div>
              <div className="mb-2 grid grid-cols-7 text-center text-[10px] font-bold text-[#957D43]">{weekDays.map((item, index) => <span key={`${item}-${index}`}>{item}</span>)}</div>
              <div className="grid grid-cols-7 gap-1 text-center text-xs font-bold">
                {calendarDates.map((date) => date.day ? <button key={date.key} onClick={() => { setSelectedDate(date.iso); setOpen(false); }} className={`relative flex h-8 items-center justify-center rounded-lg ${date.iso === activeDate ? "bg-[#B44747] text-white" : "text-[#112A46] hover:bg-[#FFF0CB]"}`}>{date.day}</button> : <span key={date.key} className="h-8" />)}
              </div>
            </div>}
            {period === "month" && <div>
              <div className="mb-3 flex items-center justify-between">
                <button onClick={() => setMonthPickerYear((year) => year - 1)} title={text(lang, "previousMonth")} className="flex h-8 w-8 items-center justify-center rounded-xl text-[#806528] hover:bg-[#FFF0CB]"><ChevronRight className={`h-4 w-4 ${lang === "en" ? "rotate-180" : ""}`} /></button>
                <strong className="text-sm tabular-nums text-[#112A46]">{monthPickerYear}</strong>
                <button onClick={() => setMonthPickerYear((year) => year + 1)} title={text(lang, "nextMonth")} className="flex h-8 w-8 items-center justify-center rounded-xl text-[#806528] hover:bg-[#FFF0CB]"><ChevronLeft className={`h-4 w-4 ${lang === "en" ? "rotate-180" : ""}`} /></button>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {yearMonths.map((month) => <button key={month.value} onClick={() => { setSelectedMonth(month.value); setOpen(false); }} className={`rounded-xl px-1 py-2.5 text-[10px] font-bold ${monthSelectionValue(selectedMonth) === month.value ? "bg-[#FFF0CB] text-[#B44747] ring-1 ring-[#B44747]/20" : "bg-white text-[#716753] ring-1 ring-black/[0.05]"}`}>{month.label}</button>)}
              </div>
            </div>}
            {period === "year" && <div className="grid grid-cols-2 gap-2">{["2026", "2025"].map((year) => <button key={year} onClick={() => { setSelectedYear(year); setOpen(false); }} className={`rounded-xl py-3 text-xs font-bold ${selectedYear === year ? "bg-[#FFF0CB] text-[#B44747] ring-1 ring-[#B44747]/20" : "bg-white text-[#716753] ring-1 ring-black/[0.05]"}`}>{year}</button>)}</div>}
            {period === "custom" && <div><div className="grid grid-cols-2 gap-2"><label className="rounded-xl bg-[#F7F5EF] p-2 text-[9px] font-bold text-[#806528]">{text(lang, "fromDate")}<input dir="ltr" type="date" value={draftCustomFrom} onChange={(event) => setDraftCustomFrom(event.target.value)} className="mt-1 block w-full bg-transparent text-[10px] font-bold text-[#112A46] outline-none" /></label><label className="rounded-xl bg-[#F7F5EF] p-2 text-[9px] font-bold text-[#806528]">{text(lang, "toDate")}<input dir="ltr" type="date" value={draftCustomTo} onChange={(event) => setDraftCustomTo(event.target.value)} className="mt-1 block w-full bg-transparent text-[10px] font-bold text-[#112A46] outline-none" /></label></div>{invalidCustomRange && <p className="mt-2 rounded-lg bg-[#FFF1EE] p-2 text-[9px] font-bold text-[#B44747]">{text(lang, "invalidDateRange")}</p>}<button disabled={invalidCustomRange} onClick={() => { if (!invalidCustomRange) { setCustomFrom(draftCustomFrom); setCustomTo(draftCustomTo); setOpen(false); } }} className={`mt-3 w-full rounded-xl py-2.5 text-[10px] font-bold text-white ${invalidCustomRange ? "bg-[#B8C0B7]" : "bg-[#112A46]"}`}>{text(lang, "applyPeriod")}</button></div>}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function StoreScopeTabs({ lang, selectedBusiness, setSelectedBusiness, businessesList = businesses }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const selectorRef = useRef(null);
  useEffect(() => {
    if (businessesList.length === 1 && selectedBusiness !== businessesList[0].id) setSelectedBusiness(businessesList[0].id);
  }, [businessesList, selectedBusiness, setSelectedBusiness]);
  useEffect(() => {
    if (!open) return undefined;
    const closeOutside = (event) => { if (selectorRef.current && !selectorRef.current.contains(event.target)) setOpen(false); };
    document.addEventListener("pointerdown", closeOutside);
    return () => document.removeEventListener("pointerdown", closeOutside);
  }, [open]);
  if (businessesList.length <= 1) return null;
  const stores = [{ id: "all", label: text(lang, "allStores") }, ...businessesList.map((business) => ({ id: business.id, label: businessName(business, lang, true) || businessName(business, lang), business }))];
  if (businessesList.length <= 2) {
    return (
      <NotebookRow>
        <div className={`grid w-full items-end gap-2 ${stores.length === 2 ? "grid-cols-2" : "grid-cols-3"}`}>
          {stores.map((store) => {
            const active = selectedBusiness === store.id;
            return <button key={store.id} onClick={() => setSelectedBusiness(store.id)} className={`relative min-w-0 pb-2 text-center text-xs font-black transition ${active ? "text-[#B44747]" : "text-[#957D43]"}`}><span className="relative inline-flex whitespace-nowrap">{store.label}{active && <span className="absolute -bottom-[9px] left-0 right-0 h-[2px] rounded-full bg-[#C28A30]" />}</span></button>;
          })}
        </div>
      </NotebookRow>
    );
  }
  const selectedStore = selectedBusiness === "all" ? null : businessesList.find((business) => business.id === selectedBusiness);
  const filtered = businessesList.filter((business) => `${businessName(business, lang)} ${businessLocation(business, lang)}`.toLowerCase().includes(query.toLowerCase()));
  return (
    <NotebookRow className="justify-center">
      <div ref={selectorRef} className="relative pb-[8px]">
        <button onClick={() => setOpen(!open)} className={`inline-flex max-w-[238px] items-center justify-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-bold transition ${open ? "bg-[#FFF4D2]/80 text-[#B44747]" : "text-[#806528]"}`}>
          <span className="truncate">{selectedBusiness === "all" ? text(lang, "allStores") : businessName(selectedStore, lang)}</span>
          <ChevronDown className={`h-3.5 w-3.5 shrink-0 text-[#806528] transition ${open ? "rotate-180" : ""}`} />
        </button>
        <AnimatePresence>{open && <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }} className="absolute left-1/2 top-[38px] z-40 w-[270px] -translate-x-1/2 rounded-2xl bg-[#FFFDF7] p-3 shadow-xl ring-1 ring-[#D8CCA8]">
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder={text(lang, "searchStore")} className="mb-2 w-full rounded-xl bg-[#F7F5EF] px-3 py-2.5 text-[11px] font-bold outline-none" />
          <button onClick={() => { setSelectedBusiness("all"); setOpen(false); }} className={`mb-1 flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-xs font-bold ${selectedBusiness === "all" ? "bg-[#FFF0CB] text-[#B44747]" : "text-[#112A46]"}`}><span>{text(lang, "allStores")}</span>{selectedBusiness === "all" && <Check className="h-4 w-4" />}</button>
          <div className="max-h-48 overflow-y-auto">{filtered.map((business) => <button key={business.id} onClick={() => { setSelectedBusiness(business.id); setOpen(false); setQuery(""); }} className={`mb-1 flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-start ${selectedBusiness === business.id ? "bg-[#FFF0CB]" : ""}`}><div><p className="text-[11px] font-black text-[#112A46]">{businessName(business, lang)}</p><p className="text-[9px] font-bold text-[#827762]">{businessLocation(business, lang)}</p></div>{selectedBusiness === business.id && <Check className="h-4 w-4 text-[#B44747]" />}</button>)}</div>
        </motion.div>}</AnimatePresence>
      </div>
    </NotebookRow>
  );
}

function StoreComparison({ lang, monthly, reviewEnabled = true, businessesList = businesses }) {
  const [showStores, setShowStores] = useState(false);
  const total = combinedTotals(monthly, businessesList);
  if (businessesList.length > 2) {
    const ranked = [...businessesList].sort((a, b) => businessRecord(b, monthly).net - businessRecord(a, monthly).net);
    return (
      <div>
        <NotebookRow><NumberLine label={text(lang, "sales")} value={money(total.sales, lang)} /></NotebookRow>
        <NotebookRow><NumberLine label={text(lang, "outflow")} value={money(total.expense, lang)} valueClassName="text-[#B44747]" /></NotebookRow>
        <NotebookRow strong lines={2}><NumberLine label={text(lang, "result")} value={money(total.net, lang)} valueClassName={total.net < 0 ? "text-[#B44747]" : "text-[#257844]"} /></NotebookRow>
        {reviewEnabled && <NotebookRow><NumberLine label={text(lang, "unreviewedShort")} value={`${total.pending}`} valueClassName="text-[#B96725]" /></NotebookRow>}
        <NotebookRow className="justify-center"><InkTab active={showStores} onClick={() => setShowStores(!showStores)} className="inline-flex items-center gap-1">{text(lang, showStores ? "hideStores" : "viewStores")}{showStores ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}</InkTab></NotebookRow>
        {showStores && <div><NotebookRow><p className="text-[11px] font-bold text-[#806528]">{text(lang, "storeResults")}</p></NotebookRow>{ranked.map((business) => { const record = businessRecord(business, monthly); return <NotebookRow key={business.id}><div className="flex w-full items-end justify-between text-xs"><span className="font-medium">{businessName(business, lang)}</span><strong className={`tabular-nums font-bold ${record.net < 0 ? "text-[#B44747]" : "text-[#257844]"}`}><MoneyValue value={money(record.net, lang)} /></strong></div></NotebookRow>; })}</div>}
      </div>
    );
  }
  return (
    <div>
      <NotebookRow><div className="grid w-full grid-cols-[1.05fr_1fr_1fr] gap-1 text-[10px] font-bold text-[#806528]"><span className="text-[12px] font-medium">{text(lang, "store")}</span>{businessesList.map((business) => <span key={business.id} className="text-center">{businessName(business, lang, true)}</span>)}</div></NotebookRow>
      <NotebookRow><div className="grid w-full grid-cols-[1.05fr_1fr_1fr] gap-1 text-xs font-medium"><span>{text(lang, "sales")}</span>{businessesList.map((business) => <span key={business.id} className="text-center font-bold tabular-nums"><MoneyValue value={money(businessRecord(business, monthly).sales, lang)} /></span>)}</div></NotebookRow>
      <NotebookRow><div className="grid w-full grid-cols-[1.05fr_1fr_1fr] gap-1 text-xs font-medium"><span className="text-[#B44747]">{text(lang, "outflow")}</span>{businessesList.map((business) => <span key={business.id} className="text-center font-bold tabular-nums text-[#B44747]"><MoneyValue value={money(businessRecord(business, monthly).expense, lang)} /></span>)}</div></NotebookRow>
      <NotebookRow><div className="grid w-full grid-cols-[1.05fr_1fr_1fr] gap-1 text-xs font-medium"><span>{text(lang, "result")}</span>{businessesList.map((business) => { const value = businessRecord(business, monthly).net; return <span key={business.id} className={`text-center font-bold tabular-nums ${value < 0 ? "text-[#B44747]" : "text-[#257844]"}`}><MoneyValue value={money(value, lang)} /></span>; })}</div></NotebookRow>
      {reviewEnabled && <NotebookRow><div className="grid w-full grid-cols-[1.05fr_1fr_1fr] gap-1 text-[11px] font-bold"><span className="font-medium text-[#806528]">{text(lang, "unreviewedShort")}</span>{businessesList.map((business) => <span key={business.id} className="text-center font-black text-[#B96725]">{businessRecord(business, monthly).pending}</span>)}</div></NotebookRow>}
      <NotebookRow strong><NumberLine label={text(lang, "combinedTotal")} value={money(total.net, lang)} valueClassName={total.net < 0 ? "text-[#B44747]" : "text-[#257844]"} /></NotebookRow>
    </div>
  );
}

function NotebookHeading({ lang, label = null, dateSelector = null, onShare = null }) {
  return (
    <div className="relative flex flex-col items-center pb-1 pt-2">
      {dateSelector && (
        <div className="flex h-[44px] w-full items-end justify-center pb-[8px]">
          {dateSelector}
        </div>
      )}
      {label && (
        <div className="flex h-[58px] items-end justify-center pb-[8px]">
          <div className="relative inline-flex flex-col items-center">
            <p className="whitespace-nowrap text-[16px] font-black leading-none text-[#112A46]">{label}</p>
            <span className="mt-2 block h-[2px] w-full rounded-full bg-[#C28A30]" />
            {onShare && (
              <button
                type="button"
                onClick={(event) => { event.preventDefault(); event.stopPropagation(); onShare(); }}
                title={text(lang, "shareNotebook")}
                aria-label={text(lang, "shareNotebook")}
                className={`absolute top-[-5px] z-20 flex h-[28px] w-[28px] items-center justify-center rounded-full text-[#112A46]/78 transition hover:bg-[#FFF0CB]/70 hover:text-[#9A823E] active:scale-95 ${lang === "ar" ? "-left-9" : "-right-9"}`}
              >
                <Share2 className="h-[16px] w-[16px]" strokeWidth={1.7} />
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function NotebookMarginTools({ lang, onShare }) {
  return (
    <div className="flex w-[29px] flex-col items-center pt-1">
      <button
        onClick={onShare}
        title={text(lang, "shareNotebook")}
        aria-label={text(lang, "shareNotebook")}
        className="flex h-[42px] w-[29px] items-center justify-center text-[#112A46]"
      >
        <Share2 className="h-[18px] w-[18px]" strokeWidth={2} />
      </button>
    </div>
  );
}

function NotebookDateBar({ dateSelector }) {
  return <NotebookRow className="justify-end">{dateSelector}</NotebookRow>;
}

function OwnerHome({ lang, operationalEntries = [], duplicateSalesAlerts = [], closeoutAlerts = [], onReviewCloseout = () => {}, onDismissCloseout = () => {}, onReviewDuplicate = () => {}, onAcknowledgeDuplicate = () => {}, reviewEnabledForBusiness = () => true, onOpenOperation = () => {}, onShareNotebook = () => {}, notebookTheme = "yellow", selectedBusiness = "all", setSelectedBusiness = () => {}, reviewEnabled = true, businessesList = businesses }) {
  const [period, setPeriod] = useState("day");
  const [selectedDay, setSelectedDay] = useState(() => todayIsoDate());
  const [selectedDate, setSelectedDate] = useState(() => todayIsoDate());
  const [selectedMonth, setSelectedMonth] = useState(() => todayIsoDate().slice(0, 7));
  const [expanded, setExpanded] = useState(false);
  const [showAttachments, setShowAttachments] = useState(false);
  const monthly = period === "month";
  const isCombined = selectedBusiness === "all";
  const currentBusiness = businessesList.find((business) => business.id === selectedBusiness) || businessesList[0] || null;
  const scopedBusinesses = isCombined ? businessesList : currentBusiness ? [currentBusiness] : [];
  const daySummary = summaryDayFromEntries(operationalEntries, currentBusiness?.id, selectedDate, reviewEnabledForBusiness);
  const result = isCombined
    ? summarizeEntries(operationalEntries.filter((entry) => businessesList.some((business) => business.id === entry.businessId) && entryDateMatches(entry, period, selectedDate, selectedMonth, "2026", "2026-01-01", "2026-12-31")), reviewEnabledForBusiness)
    : monthly
      ? summaryMonthFromEntries(operationalEntries, currentBusiness?.id, selectedMonth, reviewEnabledForBusiness)
      : daySummary;
  const selectedBusinessEntries = currentBusiness ? entriesInPeriod(operationalEntries, currentBusiness.id, "day", selectedDate, selectedMonth) : [];
  const visibleDayOperations = newestEntries(selectedBusinessEntries);
  const attachmentGroup = attachmentsFromEntries(selectedBusinessEntries)[0] || null;
  const changePeriod = (nextPeriod) => {
    setPeriod(nextPeriod);
    setExpanded(false);
    setShowAttachments(false);
  };
  return (
    <motion.section initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="taq-owner-page px-3 pb-6 pt-1 sm:px-8 md:px-12 lg:px-3">
      {closeoutAlerts.length > 0 && <div className="mx-2 mb-3 rounded-2xl bg-[#E6F5E9] p-3 ring-1 ring-[#39A160]/15"><div className="flex items-start gap-2"><Bell className="mt-0.5 h-4 w-4 shrink-0 text-[#257844]" /><div className="min-w-0 flex-1"><p className="text-[11px] font-black text-[#257844]">{text(lang, "closeoutInAppAlert")}</p><p className="mt-1 text-[10px] font-bold text-[#716753]">{businessName(businessesList.find((business) => business.id === closeoutAlerts[0].businessId), lang)} · {formatCalendarDate(closeoutAlerts[0].date, lang)} · {lang === "ar" ? closeoutAlerts[0].employeeNameAr : closeoutAlerts[0].employeeNameEn}</p><p className="mt-1 text-[10px] font-bold text-[#827762]">{text(lang, "closeoutInAppHint")}</p></div></div><div className="mt-3 grid grid-cols-2 gap-2"><button type="button" onClick={() => onReviewCloseout(closeoutAlerts[0])} className="rounded-xl bg-white py-2.5 text-[10px] font-black text-[#257844] ring-1 ring-[#39A160]/15">{text(lang, "reviewCloseout")}</button><button type="button" onClick={() => onDismissCloseout(closeoutAlerts[0].id)} className="rounded-xl bg-[#112A46] py-2.5 text-[10px] font-black text-white">{text(lang, "dismissAlert")}</button></div></div>}
      {duplicateSalesAlerts.length > 0 && <div className="mx-2 mb-3 rounded-2xl bg-[#FFF1EE] p-3 ring-1 ring-[#B44747]/10"><div className="flex items-start gap-2"><Bell className="mt-0.5 h-4 w-4 shrink-0 text-[#B44747]" /><div className="min-w-0 flex-1"><p className="text-[11px] font-black text-[#B44747]">{text(lang, "duplicateSalesOwnerAlert")}</p><p className="mt-1 text-[10px] font-bold text-[#716753]">{businessName(businessesList.find((business) => business.id === duplicateSalesAlerts[0].businessId), lang)} · {formatCalendarDate(duplicateSalesAlerts[0].date, lang)} · {duplicateSalesAlerts[0].entries.length} {text(lang, "summary")}</p><p className="mt-1 text-[10px] font-bold text-[#827762]">{text(lang, "duplicateSalesOwnerHint")}</p></div></div><div className="mt-3 grid grid-cols-2 gap-2"><button type="button" onClick={() => onReviewDuplicate(duplicateSalesAlerts[0])} className="rounded-xl bg-white py-2.5 text-[10px] font-black text-[#B44747] ring-1 ring-[#B44747]/10">{text(lang, "reviewInLog")}</button><button type="button" onClick={() => onAcknowledgeDuplicate(duplicateSalesAlerts[0])} title={text(lang, "approveMultipleSalesHint")} className="rounded-xl bg-[#112A46] py-2.5 text-[10px] font-black text-white">{text(lang, "approveMultipleSales")}</button></div></div>}
      <Notebook fullPage theme={notebookTheme} lang={lang}>
        <NotebookHeading lang={lang} label={monthly ? text(lang, "monthlySummary") : text(lang, "dailySummary")} onShare={() => onShareNotebook({ theme: notebookTheme, period, selectedBusiness, includedBusinessIds: businessesList.map((business) => business.id), selectedDay: daySummary.id, selectedDate, selectedMonth, screen: "home", showDetails: expanded && !monthly && !isCombined })} dateSelector={<DateSelector compact lang={lang} period={period} setPeriod={changePeriod} selectedDay={selectedDay} setSelectedDay={(id) => { setSelectedDay(id); setShowAttachments(false); }} selectedDate={selectedDate} setSelectedDate={(date) => { setSelectedDate(date); setShowAttachments(false); }} fullCalendar selectedMonth={selectedMonth} setSelectedMonth={setSelectedMonth} />} />
        <StoreScopeTabs lang={lang} businessesList={businessesList} selectedBusiness={selectedBusiness} setSelectedBusiness={(id) => { setSelectedBusiness(id); setExpanded(false); setShowAttachments(false); }} />
        {isCombined ? (
          <div>
            <StoreComparison lang={lang} monthly={monthly} reviewEnabled={reviewEnabled} businessesList={scopedBusinesses} />
            <NotebookRow lines={2}><p className="w-full text-[10px] font-bold text-[#806528]">{text(lang, "chooseStoreForDetails")}</p></NotebookRow>
          </div>
        ) : (
          <div>
            <NotebookRow><NumberLine lang={lang} handwritten label={text(lang, "sales")} value={money(result.sales, lang)} /></NotebookRow>
            <NotebookRow><NumberLine lang={lang} handwritten label={text(lang, "purchasesExpenses")} value={money(result.expense, lang)} valueClassName="text-[#B44747]" /></NotebookRow>
            <NotebookRow><div className="flex w-full items-end justify-between text-xs font-bold text-[#806528]"><span>{text(lang, "outflowRatio")}</span><strong className="text-[#B44747]">{result.ratio}</strong></div></NotebookRow>
            <NotebookRow strong lines={2}><div className="flex w-full items-end justify-between"><span className="text-sm font-extrabold">{monthly ? text(lang, "recordedMonthResult") : text(lang, "netMovement")}</span><strong className={`tabular-nums text-2xl font-extrabold ${result.net < 0 ? "text-[#B44747]" : "text-[#257844]"}`}><MoneyValue value={money(result.net, lang)} /></strong></div></NotebookRow>
            <NotebookRow>{monthly ? <div className="flex w-full items-end justify-between text-xs font-bold text-[#806528]"><span>{text(lang, "attachments")}</span><span>{result.proofs}{reviewEnabled && <> · <span className="text-[#B96725]">{result.pending} {text(lang, "notReviewed")}</span></>}</span></div> : <button onClick={() => setShowAttachments(!showAttachments)} className="flex w-full items-end justify-between text-xs font-bold text-[#806528]"><span className="relative pb-1">{text(lang, "attachments")}{showAttachments && <span className="absolute -bottom-[1px] left-0 right-0 h-[2px] rounded-full bg-[#C28A30]" />}</span><span>{result.proofs}{reviewEnabled && <> · <span className="text-[#B96725]">{result.pending} {text(lang, "notReviewed")}</span></>}</span></button>}</NotebookRow>
            {!monthly && showAttachments && <DayAttachments lang={lang} group={attachmentGroup} reviewEnabled={reviewEnabledForBusiness(currentBusiness.id)} onOpenOperation={onOpenOperation} />}
            <NotebookRow className="justify-center"><InkTab active={expanded} showActiveUnderline={false} onClick={() => setExpanded(!expanded)} className="inline-flex items-center gap-1">{expanded ? text(lang, "hideDetails") : text(lang, "showMore")}{expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}</InkTab></NotebookRow>
          </div>
        )}
      </Notebook>
      {!isCombined && expanded && !monthly && (
        <div className={`mt-1 pb-3 ${lang === "ar" ? "pr-11 pl-6" : "pl-11 pr-6"}`}>
          <div className="flex h-[44px] items-end pb-[8px]">
            <h3 className="text-[14px] font-black text-[#112A46]">
              {text(lang, "operations")} {fullDate(daySummary, lang)}
            </h3>
          </div>
          {visibleDayOperations.length ? (
            <div>
              {visibleDayOperations.map((item, index) => {
                const isSale = item.type === "summary";
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => onOpenOperation(item)}
                    className="grid w-full grid-cols-[max-content_minmax(0,1fr)] items-center gap-4 py-3 text-start transition hover:bg-[#FFF4D2]/30"
                  >
                    <strong dir="ltr" className={`min-w-[74px] whitespace-nowrap text-start tabular-nums text-[14px] font-black ${entryIsVoided(item) ? "text-[#A99D87] line-through" : isSale ? "text-[#257844]" : "text-[#B44747]"}`}>
                      <MoneyValue value={money(signedEntryAmount(item), lang)} />
                    </strong>
                    <span className="min-w-0 text-end">
                      <span className="flex items-center justify-end gap-2 text-[13px] font-bold text-[#112A46]">
                        {noteLabel(item, lang)}
                        {entryIsVoided(item) && <Badge tone="warning">{text(lang, "voided")}</Badge>}
                      </span>
                      <small className="mt-1 block truncate text-[10px] font-bold text-[#8A816F]">
                        {opTime(item, lang)} · {entryHasAttachment(item) ? text(lang, "attachmentExists") : text(lang, "noAttachment")}
                      </small>
                    </span>
                  </button>
                );
              })}
            </div>
          ) : (
            <p className="flex h-[44px] items-end pb-[8px] text-xs font-bold text-[#827762]">{text(lang, "noEntriesDay")}</p>
          )}
        </div>
      )}
    </motion.section>
  );
}

function ProofThumb({ paper = false }) { return <div className={`${paper ? "h-12 w-10" : "h-14 w-14 bg-[#E8E1D4]"} flex shrink-0 items-center justify-center rounded-xl`}><div className={`${paper ? "w-9 border border-[#CFBC82]" : "w-9"} rotate-[-3deg] rounded bg-white p-1.5 shadow-sm`}><div className="mb-1 h-1 w-5 rounded bg-[#D8D1C4]" /><div className="mb-1 h-1 w-full rounded bg-[#E9E2D6]" /><div className="h-1 w-7 rounded bg-[#E9E2D6]" /></div></div>; }
function DayAttachments({ lang, group, reviewEnabled = true, onOpenOperation = () => {} }) { if (!group?.items?.length) return <NotebookRow><p className="text-xs font-bold text-[#806528]">{text(lang, "noAttachmentsDay")}</p></NotebookRow>; return <div className="py-3"><div className="flex gap-3 overflow-x-auto pb-1">{group.items.map((item) => <button key={item.id} onClick={() => onOpenOperation(item.entry)} className="min-w-[78px] text-center"><div className="mb-1 flex h-14 justify-center overflow-hidden rounded-xl"><AttachmentPreview attachment={item.attachment} className="h-14 w-14 rounded-xl" /></div><p className="truncate text-[10px] font-bold">{lang === "ar" ? item.title : item.titleEn}</p><p className={`mt-0.5 text-[10px] font-black ${item.entry.type === "summary" ? "text-[#257844]" : "text-[#B44747]"}`}><MoneyValue value={money(signedEntryAmount(item.entry), lang)} /></p>{reviewEnabled && !entryIsVoided(item.entry) && !item.reviewed && <span className="inline-block h-1.5 w-1.5 rounded-full bg-[#B96725]" />}</button>)}</div></div>; }

function logPeriodScopeLabel(lang, period, selectedDate, selectedMonth, selectedYear, customFrom, customTo) {
  if (period === "day") return formatCalendarDate(selectedDate, lang);
  if (period === "month") return formatSelectedMonth(selectedMonth, lang);
  if (period === "year") return selectedYear;
  return `${formatCalendarDate(customFrom, lang)} — ${formatCalendarDate(customTo, lang)}`;
}

function LogFilterChip({ active, children, onClick, tone = "default" }) {
  const toneClass = {
    default: active ? "bg-[#112A46] text-white" : "bg-[#F7F5EF] text-[#716753] ring-1 ring-[#E8E1D4]",
    accent: active ? "bg-[#E4B84A] text-[#112A46]" : "bg-[#F7F5EF] text-[#716753] ring-1 ring-[#E8E1D4]",
    warn: active ? "bg-[#B96725] text-white" : "bg-[#F7F5EF] text-[#716753] ring-1 ring-[#E8E1D4]",
    danger: active ? "bg-[#B44747] text-white" : "bg-[#F7F5EF] text-[#716753] ring-1 ring-[#E8E1D4]",
  }[tone];
  return <button type="button" onClick={onClick} className={`rounded-full px-2.5 py-1 text-[10px] font-black ${toneClass}`}>{children}</button>;
}

function LogStoreFilter({ lang, businessesList = businesses, selectedBusiness, setSelectedBusiness, locked = false }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const filterRef = useRef(null);
  const selectedStore = businessesList.find((business) => business.id === selectedBusiness) || null;
  useEffect(() => {
    if (!locked && businessesList.length === 1 && selectedBusiness !== businessesList[0].id) setSelectedBusiness(businessesList[0].id);
  }, [locked, businessesList, selectedBusiness, setSelectedBusiness]);
  useEffect(() => {
    if (!open) return undefined;
    const closeOutside = (event) => { if (filterRef.current && !filterRef.current.contains(event.target)) setOpen(false); };
    document.addEventListener("pointerdown", closeOutside);
    return () => document.removeEventListener("pointerdown", closeOutside);
  }, [open]);
  if (locked || businessesList.length <= 2) {
    const options = locked || businessesList.length === 1 ? businessesList : [{ id: "all", label: text(lang, "allStores") }, ...businessesList.map((business) => ({ id: business.id, label: businessName(business, lang, true) || businessName(business, lang) }))];
    return <div className="flex flex-wrap gap-2">{options.map((option) => <button key={option.id} disabled={locked} onClick={() => setSelectedBusiness(option.id)} className={`rounded-full px-3 py-2 text-[10px] font-black ${selectedBusiness === option.id ? "bg-[#112A46] text-white" : "bg-white text-[#716753] ring-1 ring-black/[0.05]"}`}>{option.label || businessName(option, lang)}</button>)}</div>;
  }
  const filtered = businessesList.filter((business) => `${businessName(business, lang)} ${businessLocation(business, lang)}`.toLowerCase().includes(query.toLowerCase()));
  return <div ref={filterRef} className="relative"><button onClick={() => setOpen(!open)} className="flex w-full items-center justify-between rounded-2xl bg-white px-4 py-3 text-xs font-black ring-1 ring-black/[0.05]"><span>{selectedBusiness === "all" ? text(lang, "allStores") : businessName(selectedStore, lang)}</span><ChevronDown className="h-4 w-4 text-[#806528]" /></button><AnimatePresence>{open && <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }} className="absolute start-0 end-0 top-[50px] z-40 rounded-2xl bg-white p-3 shadow-xl ring-1 ring-[#E8E1D4]"><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder={text(lang, "searchStore")} className="mb-2 w-full rounded-xl bg-[#F7F5EF] px-3 py-2.5 text-[11px] font-bold outline-none" /><button onClick={() => { setSelectedBusiness("all"); setOpen(false); setQuery(""); }} className={`mb-1 flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-start text-[11px] font-black ${selectedBusiness === "all" ? "bg-[#FFF4D2]" : ""}`}>{text(lang, "allStores")}{selectedBusiness === "all" && <Check className="h-4 w-4" />}</button><div className="max-h-48 overflow-y-auto">{filtered.map((business) => <button key={business.id} onClick={() => { setSelectedBusiness(business.id); setOpen(false); setQuery(""); }} className={`mb-1 flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-start ${selectedBusiness === business.id ? "bg-[#FFF4D2]" : ""}`}><div><p className="text-[11px] font-black">{businessName(business, lang)}</p><p className="text-[9px] font-bold text-[#827762]">{businessLocation(business, lang)}</p></div>{selectedBusiness === business.id && <Check className="h-4 w-4" />}</button>)}</div></motion.div>}</AnimatePresence></div>;
}

function OwnerRegisterScreen({ lang, onOpenOperation = () => {}, operationalEntries = [], selectedBusiness = "all", setSelectedBusiness = () => {}, businessesList = businesses, archivedBusinessIds = [], archivedReadOnlyBusinessId = null, reviewFocus = null, attachmentReviewRequest = null }) {
  const [period, setPeriod] = useState("day");
  const [selectedDate, setSelectedDate] = useState(() => todayIsoDate());
  const [selectedMonth, setSelectedMonth] = useState(() => todayIsoDate().slice(0, 7));
  const [selectedYear, setSelectedYear] = useState(() => String(new Date().getFullYear()));
  const [customFrom, setCustomFrom] = useState(() => `${new Date().getFullYear()}-01-01`);
  const [customTo, setCustomTo] = useState(() => todayIsoDate());
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [expenseCategoryFilter, setExpenseCategoryFilter] = useState("all");
  const [attachmentOnly, setAttachmentOnly] = useState(false);
  const [pendingReviewOnly, setPendingReviewOnly] = useState(false);
  const selectTypeFilter = (nextType) => {
    setTypeFilter(nextType);
    if (nextType !== "expense") setExpenseCategoryFilter("all");
  };
  useEffect(() => {
    if (!reviewFocus?.businessId || !reviewFocus?.date || archivedReadOnlyBusinessId) return;
    setSelectedBusiness(reviewFocus.businessId);
    setPeriod("day");
    setSelectedDate(reviewFocus.date);
    setStatusFilter("active");
    setTypeFilter("summary");
    setExpenseCategoryFilter("all");
    setAttachmentOnly(false);
    setPendingReviewOnly(false);
  }, [reviewFocus, archivedReadOnlyBusinessId]);
  useEffect(() => {
    if (!attachmentReviewRequest?.businessId || !attachmentReviewRequest?.date || archivedReadOnlyBusinessId) return;
    setSelectedBusiness(attachmentReviewRequest.businessId);
    setPeriod("day");
    setSelectedDate(attachmentReviewRequest.date);
    setStatusFilter("active");
    setTypeFilter("all");
    setExpenseCategoryFilter("all");
    setAttachmentOnly(true);
    setPendingReviewOnly(true);
  }, [attachmentReviewRequest, archivedReadOnlyBusinessId]);
  const activeBusinesses = businessesList.filter((business) => !archivedBusinessIds.includes(business.id));
  const archivedReadOnlyBusiness = archivedReadOnlyBusinessId && archivedBusinessIds.includes(archivedReadOnlyBusinessId) ? businessesList.find((business) => business.id === archivedReadOnlyBusinessId) : null;
  const availableBusinesses = archivedReadOnlyBusiness ? [archivedReadOnlyBusiness] : activeBusinesses;
  const safeBusinessId = archivedReadOnlyBusiness ? archivedReadOnlyBusiness.id : activeBusinesses.length === 1 ? activeBusinesses[0].id : selectedBusiness === "all" || activeBusinesses.some((business) => business.id === selectedBusiness) ? selectedBusiness : "all";
  const periodEntries = operationalEntries.filter((entry) => (safeBusinessId === "all" ? activeBusinesses.some((business) => business.id === entry.businessId) : entry.businessId === safeBusinessId) && entryDateMatches(entry, period, selectedDate, selectedMonth, selectedYear, customFrom, customTo));
  const matchesExpenseCategory = (entry) => {
    if (typeFilter !== "expense" || expenseCategoryFilter === "all") return true;
    if (entry.type !== "expense") return false;
    return entryCategory(entry) === expenseCategoryFilter;
  };
  const visibleEntries = newestEntries(periodEntries.filter((entry) => (statusFilter === "all" || (statusFilter === "active" ? entryIsActive(entry) : entryIsVoided(entry))) && (typeFilter === "all" || entry.type === typeFilter) && matchesExpenseCategory(entry) && (!attachmentOnly || entryHasAttachment(entry)) && (!pendingReviewOnly || (entryIsActive(entry) && entryHasAttachment(entry) && !entry.reviewed))));
  const selectionTotals = summarizeEntries(visibleEntries);
  const periodScopeLabel = logPeriodScopeLabel(lang, period, selectedDate, selectedMonth, selectedYear, customFrom, customTo);
  const voidedInView = visibleEntries.filter(entryIsVoided).length;
  const proofInView = visibleEntries.filter(entryHasAttachment).length;
  const scopedStore = availableBusinesses.find((business) => business.id === safeBusinessId);
  const storeScopeLabel = safeBusinessId === "all" ? text(lang, "allStores") : businessName(scopedStore, lang, true) || businessName(scopedStore, lang);
  const typeItems = [{ id: "all", label: "allTypes" }, { id: "summary", label: "summary" }, { id: "purchases", label: "purchases" }, { id: "expense", label: "expense" }, { id: "withdrawal", label: "withdrawal" }];
  const expenseCategoryItems = [{ id: "all", label: "allCategories" }, ...expenseCategories];
  return <motion.section initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="px-4 pb-24">
    <header className="mb-2.5">
      <p className="text-[10px] font-bold text-[#8B8274]">{text(lang, "tracking")}</p>
      <div className="mt-0.5 flex flex-wrap items-center gap-2">
        <h1 className="text-lg font-black leading-tight text-[#112A46]">{text(lang, "operationsLog")}</h1>
        {archivedReadOnlyBusiness && <Badge tone="warning">{text(lang, "archivedReadOnly")}</Badge>}
      </div>
      <p className="mt-1 text-[9px] font-bold leading-4 text-[#957D43]">{text(lang, "logPurpose")}</p>
    </header>

    <div className="mb-2.5 overflow-hidden rounded-2xl bg-white ring-1 ring-black/[0.045]">
      <div className="flex items-center justify-between border-b border-[#F0ECE2] px-3 py-2">
        <p className="text-[10px] font-black text-[#112A46]">{text(lang, "logFilters")}</p>
        <p className="max-w-[55%] truncate text-[9px] font-bold text-[#827762]">{storeScopeLabel} · {periodScopeLabel}</p>
      </div>
      <div className="border-b border-[#F0ECE2] px-3 py-2">
        <LogStoreFilter lang={lang} businessesList={availableBusinesses} selectedBusiness={safeBusinessId} setSelectedBusiness={setSelectedBusiness} locked={Boolean(archivedReadOnlyBusiness)} />
      </div>
      <div className="flex justify-center border-b border-[#F0ECE2] px-3 py-2">
        <DateSelector lang={lang} compact period={period} setPeriod={setPeriod} allowedPeriods={["day", "month", "year", "custom"]} selectedDay={selectedDate} setSelectedDay={() => {}} selectedDate={selectedDate} setSelectedDate={setSelectedDate} fullCalendar selectedMonth={selectedMonth} setSelectedMonth={setSelectedMonth} selectedYear={selectedYear} setSelectedYear={setSelectedYear} customFrom={customFrom} setCustomFrom={setCustomFrom} customTo={customTo} setCustomTo={setCustomTo} />
      </div>
      <div className="space-y-2 px-3 py-2.5">
        <div>
          <p className="mb-1.5 text-[9px] font-bold text-[#957D43]">{text(lang, "logStatus")}</p>
          <div className="flex flex-wrap gap-1.5">
            {[{ id: "all", label: "all", tone: "default" }, { id: "active", label: "activeEntries", tone: "default" }, { id: "voided", label: "voided", tone: "danger" }].map((item) => (
              <LogFilterChip key={item.id} active={statusFilter === item.id} tone={item.tone} onClick={() => setStatusFilter(item.id)}>{text(lang, item.label)}</LogFilterChip>
            ))}
            <LogFilterChip active={attachmentOnly} tone="accent" onClick={() => { setAttachmentOnly(!attachmentOnly); if (attachmentOnly) setPendingReviewOnly(false); }}>{text(lang, "withAttachment")}</LogFilterChip>
            <LogFilterChip active={pendingReviewOnly} tone="warn" onClick={() => { setPendingReviewOnly(!pendingReviewOnly); if (!pendingReviewOnly) { setAttachmentOnly(true); setStatusFilter("active"); } }}>{text(lang, "pendingReviewOnly")}</LogFilterChip>
          </div>
        </div>
        <div>
          <p className="mb-1.5 text-[9px] font-bold text-[#957D43]">{text(lang, "logType")}</p>
          <div className="-mx-1 flex gap-2.5 overflow-x-auto px-1 pb-0.5">{typeItems.map((item) => <InkTab key={item.id} className="text-[10px] pb-1.5" active={typeFilter === item.id} onClick={() => selectTypeFilter(item.id)}>{text(lang, item.label)}</InkTab>)}</div>
        </div>
        {typeFilter === "expense" && (
          <div>
            <p className="mb-1.5 text-[9px] font-bold text-[#957D43]">{text(lang, "filterByCategory")}</p>
            <div className="flex flex-wrap gap-1.5">
              {expenseCategoryItems.map((item) => (
                <LogFilterChip key={item.id} active={expenseCategoryFilter === item.id} tone={expenseCategoryFilter === item.id ? "danger" : "default"} onClick={() => setExpenseCategoryFilter(item.id)}>{text(lang, item.label)}</LogFilterChip>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>

    <div className="mb-2.5 rounded-2xl bg-[#112A46] p-3 text-white ring-1 ring-[#0E2238]">
      <div className="mb-2 flex items-start justify-between gap-2">
        <div>
          <p className="text-[10px] font-bold text-white/70">{text(lang, "logFilteredSummary")}</p>
          <p className="mt-0.5 text-[9px] font-bold text-white/50">{text(lang, "logInPeriod")}: {periodScopeLabel}</p>
        </div>
        <span className="shrink-0 rounded-full bg-white/10 px-2 py-0.5 text-[10px] font-black tabular-nums">{visibleEntries.length} {text(lang, "operations")}</span>
      </div>
      <div className="grid grid-cols-3 gap-1.5">
        <div className="rounded-xl bg-white/8 px-2 py-1.5">
          <p className="text-[8px] font-bold text-white/55">{text(lang, "totalSales")}</p>
          <p className="mt-0.5 truncate text-[11px] font-black tabular-nums text-[#7FD99A]"><MoneyValue value={money(selectionTotals.sales, lang)} /></p>
        </div>
        <div className="rounded-xl bg-white/8 px-2 py-1.5">
          <p className="text-[8px] font-bold text-white/55">{text(lang, "outflow")}</p>
          <p className="mt-0.5 truncate text-[11px] font-black tabular-nums text-[#F5C4C4]"><MoneyValue value={money(selectionTotals.expense, lang)} /></p>
        </div>
        <div className="rounded-xl bg-white/8 px-2 py-1.5">
          <p className="text-[8px] font-bold text-white/55">{text(lang, "result")}</p>
          <p className={`mt-0.5 truncate text-[11px] font-black tabular-nums ${selectionTotals.net < 0 ? "text-[#F5C4C4]" : "text-[#7FD99A]"}`}><MoneyValue value={money(selectionTotals.net, lang)} /></p>
        </div>
      </div>
      <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[9px] font-bold text-white/55">
        <span>{text(lang, "outflowRatio")}: {selectionTotals.ratio}</span>
        {voidedInView > 0 && <span>{text(lang, "logVoidedInView")}: {voidedInView}</span>}
        {proofInView > 0 && <span>{text(lang, "logWithProofInView")}: {proofInView}</span>}
      </div>
    </div>

    <p className="mb-1.5 text-[10px] font-bold text-[#827762]">{text(lang, "logResults")} ({visibleEntries.length})</p>
    {visibleEntries.length === 0 ? (
      <div className="rounded-2xl bg-white px-4 py-6 text-center text-[11px] font-bold text-[#827762] ring-1 ring-black/[0.045]">{text(lang, "noOperationsMatch")}</div>
    ) : (
      <div className="overflow-hidden rounded-2xl bg-white ring-1 ring-black/[0.045]">
        {visibleEntries.map((entry, index) => {
          const store = businessesList.find((business) => business.id === entry.businessId);
          const isSale = entry.type === "summary";
          const signedAmount = isSale ? entry.amount : -entry.amount;
          const metaParts = [
            businessName(store, lang, true) || businessName(store, lang),
            formatCalendarDate(entry.date, lang),
            opTime(entry, lang),
            employeeName(entry, lang),
          ].filter(Boolean);
          return (
            <button
              key={entry.id}
              type="button"
              onClick={() => onOpenOperation(entry)}
              className={`flex w-full items-center gap-2.5 px-3 py-2.5 text-start transition hover:bg-[#FFF8E8]/80 ${index < visibleEntries.length - 1 ? "border-b border-[#F0ECE2]" : ""}`}
            >
              <span className={`h-7 w-0.5 shrink-0 rounded-full ${isSale ? "bg-[#39A160]" : "bg-[#E4B84A]"}`} />
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-1">
                  <p className="truncate text-[12px] font-black leading-tight text-[#112A46]">{operationDisplayLabel(entry, lang)}</p>
                  {entryIsVoided(entry) && <Badge tone="warning">{text(lang, "voided")}</Badge>}
                  {entryHasAttachment(entry) && <Badge tone="navy">{text(lang, "attachmentExists")}</Badge>}
                </div>
                <p className="mt-0.5 truncate text-[9px] font-bold leading-4 text-[#827762]">{metaParts.join(" · ")}</p>
                {entryIsVoided(entry) && entry.voidReason && (
                  <p className="mt-0.5 line-clamp-2 text-[9px] font-bold leading-4 text-[#B44747]">{text(lang, "voidReason")}: {entry.voidReason}</p>
                )}
              </div>
              <strong className={`shrink-0 tabular-nums text-[12px] font-black leading-none ${entryIsVoided(entry) ? "text-[#A99D87] line-through" : isSale ? "text-[#257844]" : "text-[#B44747]"}`}>
                <MoneyValue value={money(signedAmount, lang)} />
              </strong>
            </button>
          );
        })}
      </div>
    )}
  </motion.section>;
}

function OutflowAnalysis({ lang, period, selectedBusiness, selectedDay, selectedDate, selectedMonth, selectedYear, customFrom, customTo, businessesList = businesses, operationalEntries = [], category = "all", setCategory = () => {}, showTransactions = false, setShowTransactions = () => {} }) {
  const visibleRecords = operationalEntries.filter((entry) => entryIsActive(entry) && entryIsOutflow(entry) && (selectedBusiness === "all" || entry.businessId === selectedBusiness) && (category === "all" || entryCategory(entry) === category) && entryDateMatches(entry, period, selectedDate, selectedMonth, selectedYear, customFrom, customTo));
  const total = visibleRecords.reduce((sum, record) => sum + record.amount, 0);
  const average = visibleRecords.length ? total / visibleRecords.length : 0;
  const selectedCategoryLabel = category === "all" ? text(lang, "allCategories") : text(lang, outflowReportCategories.find((item) => item.id === category)?.label || "other");
  const totalLabel = category === "all" ? text(lang, "totalOutflow") : `${text(lang, "totalOutflow")} · ${selectedCategoryLabel}`;
  return <div><div className="flex min-h-[88px] flex-wrap content-center items-end gap-x-4 gap-y-3 pb-3 pt-2">{outflowReportCategories.map((item) => { const active = category === item.id; return <button key={item.id} onClick={() => setCategory(item.id)} className={`relative pb-1.5 text-[10px] font-bold transition ${active ? "text-[#B44747]" : "text-[#806528]"}`}><span className="relative inline-flex whitespace-nowrap">{text(lang, item.label)}{active && <span className="absolute -bottom-[7px] left-0 right-0 h-[2px] rounded-full bg-[#C28A30]" />}</span></button>; })}</div><FinancialRows lang={lang} rows={[
    { id: "total", label: totalLabel, value: money(total, lang), valueClassName: "text-[#B44747]" },
    { id: "count", label: text(lang, "numberTransactions"), value: `${visibleRecords.length}` },
    { id: "average", label: text(lang, "averageTransaction"), value: money(average, lang), valueClassName: "text-[#806528]" },
  ]} /><NotebookRow className="justify-center"><InkTab active={showTransactions} onClick={() => setShowTransactions(!showTransactions)}>{text(lang, showTransactions ? "hideTransactions" : "viewTransactions")}</InkTab></NotebookRow>{showTransactions && (visibleRecords.length ? <div>{newestEntries(visibleRecords).map((record) => { const store = businessesList.find((business) => business.id === record.businessId); return <NotebookRow key={record.id} lines={2}><div className="w-full"><div className="mb-1 flex items-end justify-between text-xs"><strong className="font-medium text-[#112A46]">{text(lang, outflowReportCategories.find((item) => item.id === entryCategory(record))?.label || "other")}</strong><strong className="tabular-nums font-bold text-[#B44747]"><MoneyValue value={money(-record.amount, lang)} /></strong></div><div className="flex justify-between text-[10px] font-bold text-[#806528]"><span>{formatCalendarDate(record.date, lang)} · {businessName(store, lang, true)}</span><span>{entryHasAttachment(record) ? text(lang, "attachmentExists") : text(lang, "noAttachment")}</span></div></div></NotebookRow>; })}</div> : <NotebookRow><p className="text-xs font-bold text-[#806528]">{text(lang, "noOutflowPeriod")}</p></NotebookRow>)}</div>;
}

function RatioBadge({ value }) {
  return <span className="rounded-full bg-[#E6EFEF] px-1.5 py-0.5 text-[9px] font-bold tabular-nums text-[#316C73]">{value}</span>;
}

function SummaryReportDetails({ lang, monthly, selectedBusiness, selectedDate, selectedMonth, reportChannels = channels, businessesList = businesses, section = "both", operationalEntries = [] }) {
  const salesBase = (monthly ? summaryMonthFromEntries(operationalEntries, selectedBusiness, selectedMonth) : summaryDayFromEntries(operationalEntries, selectedBusiness, selectedDate)).sales;
  const periodEntries = entriesInPeriod(operationalEntries, selectedBusiness, monthly ? "month" : "day", selectedDate, selectedMonth);
  const dynamicChannels = aggregateChannels(operationalEntries, selectedBusiness, monthly ? "month" : "day", selectedDate, selectedMonth, reportChannels);
  const outflowByCategory = outflowReportCategories.filter((item) => item.id !== "all").map((item) => ({ ...item, amount: periodEntries.filter((entry) => entryIsActive(entry) && entryIsOutflow(entry) && entryCategory(entry) === item.id).reduce((sum, entry) => sum + entry.amount, 0) })).filter((item) => item.amount > 0);
  const percentageOfSales = (amount) => salesBase > 0 ? `${((amount / salesBase) * 100).toFixed(1)}%` : amount > 0 ? "—" : "0.0%";
  return <>{(section === "sales" || section === "both") && dynamicChannels.map((channel) => <NotebookRow key={channel.id}><div className="flex w-full items-end justify-between ps-3 text-xs"><div className="flex items-center gap-2"><span className="font-medium text-[#716753]">{channelName(channel, lang)}</span><RatioBadge value={percentageOfSales(channel.amount)} /></div><strong className="tabular-nums font-bold text-[#112A46]"><MoneyValue value={money(channel.amount, lang)} /></strong></div></NotebookRow>)}{(section === "outflow" || section === "both") && outflowByCategory.map((item) => <NotebookRow key={item.id}><div className="flex w-full items-end justify-between ps-3 text-xs"><div className="flex items-center gap-2"><span className="font-medium text-[#716753]">{text(lang, item.label)}</span><RatioBadge value={percentageOfSales(item.amount)} /></div><strong className="tabular-nums font-bold text-[#B44747]"><MoneyValue value={money(item.amount, lang)} /></strong></div></NotebookRow>)}</>;
}

function ReportsScreen({ lang, operationalEntries = [], archivedReadOnlyBusinessId = null, reviewEnabledForBusiness = () => true, onShareNotebook = () => {}, notebookTheme = "yellow", selectedBusiness = "all", setSelectedBusiness = () => {}, configuredChannels = channels, reviewEnabled = true, businessesList = businesses, archivedBusinessIds = [] }) {
  const [period, setPeriod] = useState("day");
  const [selectedReportDay, setSelectedReportDay] = useState(() => todayIsoDate());
  const [selectedReportDate, setSelectedReportDate] = useState(() => todayIsoDate());
  const [selectedReportMonth, setSelectedReportMonth] = useState(() => todayIsoDate().slice(0, 7));
  const [selectedReportYear, setSelectedReportYear] = useState(() => String(new Date().getFullYear()));
  const [customFrom, setCustomFrom] = useState(() => `${new Date().getFullYear()}-01-01`);
  const [customTo, setCustomTo] = useState(() => todayIsoDate());
  const [tab, setTab] = useState("summary");
  const [outflowCategory, setOutflowCategory] = useState("all");
  const [showSummaryDetails, setShowSummaryDetails] = useState(false);
  const [showOutflowTransactions, setShowOutflowTransactions] = useState(false);
  const archivedReadOnlyBusiness = archivedReadOnlyBusinessId && archivedBusinessIds.includes(archivedReadOnlyBusinessId)
    ? businessesList.find((business) => business.id === archivedReadOnlyBusinessId)
    : null;
  const activeReportBusinesses = businessesList.filter((business) => !archivedBusinessIds.includes(business.id));
  const visibleReportBusinesses = archivedReadOnlyBusiness ? [archivedReadOnlyBusiness] : activeReportBusinesses;
  const safeSelectedBusiness = archivedReadOnlyBusiness
    ? archivedReadOnlyBusiness.id
    : visibleReportBusinesses.length === 1
      ? visibleReportBusinesses[0].id
      : selectedBusiness === "all" || visibleReportBusinesses.some((business) => business.id === selectedBusiness)
        ? selectedBusiness
        : "all";
  const monthly = period === "month";
  const isCombined = safeSelectedBusiness === "all";
  const selectedStore = visibleReportBusinesses.find((business) => business.id === safeSelectedBusiness) || visibleReportBusinesses[0] || null;
  const scopedBusinesses = isCombined ? visibleReportBusinesses : selectedStore ? [selectedStore] : [];
  const effectiveReviewEnabled = archivedReadOnlyBusiness ? reviewEnabledForBusiness(archivedReadOnlyBusiness.id) : reviewEnabled;
  const scopedEntries = operationalEntries.filter((entry) => isCombined ? visibleReportBusinesses.some((business) => business.id === entry.businessId) : entry.businessId === safeSelectedBusiness);
  const periodEntries = scopedEntries.filter((entry) => entryDateMatches(entry, period, selectedReportDate, selectedReportMonth, selectedReportYear, customFrom, customTo));
  const totals = summarizeEntries(periodEntries, reviewEnabledForBusiness);
  const reportDay = selectedStore ? summaryDayFromEntries(operationalEntries, selectedStore.id, selectedReportDate, reviewEnabledForBusiness) : { id: selectedReportDate };
  const reportDays = [...new Set(scopedEntries.filter((entry) => entryIsActive(entry) && entry.type === "summary" && entry.date.startsWith(monthSelectionValue(selectedReportMonth))).map((entry) => entry.date))]
    .sort()
    .reverse()
    .map((date) => ({ id: date, dayAr: formatCalendarDate(date, "ar"), dayEn: formatCalendarDate(date, "en"), ...summarizeEntries(scopedEntries.filter((entry) => entry.date === date), reviewEnabledForBusiness) }));
  const visibleChannels = aggregateChannels(operationalEntries, isCombined ? null : safeSelectedBusiness, period, selectedReportDate, selectedReportMonth, configuredChannels);
  const tabs = [
    { id: "summary", key: "summary" },
    { id: "days", key: "days" },
    { id: "channels", key: "channels" },
    { id: "expenses", key: "outflow" },
    { id: "proofs", key: "photos" },
  ];
  const changeReportPeriod = (nextPeriod) => {
    setPeriod(nextPeriod);
    setShowSummaryDetails(false);
    setShowOutflowTransactions(false);
  };
  const changeReportTab = (nextTab) => {
    setTab(nextTab);
    setShowSummaryDetails(false);
    setShowOutflowTransactions(false);
    if (nextTab !== "expenses" && (period === "year" || period === "custom")) setPeriod("month");
  };
  return (
    <motion.section initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="taq-owner-page px-3 pb-6 pt-1 sm:px-8 md:px-12 lg:px-3">
      <Notebook fullPage theme={notebookTheme} lang={lang}>
        {archivedReadOnlyBusiness && <div className="mx-2 mb-2 flex justify-center"><Badge tone="warning">{text(lang, "archivedReadOnly")}</Badge></div>}<NotebookHeading lang={lang} label={text(lang, "reportNotebook")} onShare={() => onShareNotebook({ theme: notebookTheme, period, selectedBusiness: safeSelectedBusiness, includedBusinessIds: activeReportBusinesses.map((business) => business.id), selectedDay: reportDay.id, selectedDate: selectedReportDate, selectedMonth: selectedReportMonth, selectedYear: selectedReportYear, customFrom, customTo, screen: "reports", tab, outflowCategory, reviewEnabled: effectiveReviewEnabled, showSummaryDetails: tab === "summary" && showSummaryDetails, showOutflowTransactions: tab === "expenses" && showOutflowTransactions, reportChannels: configuredChannels })} dateSelector={<DateSelector compact lang={lang} period={period} setPeriod={changeReportPeriod} allowedPeriods={tab === "expenses" ? ["day", "month", "year", "custom"] : ["day", "month"]} selectedDay={selectedReportDay} setSelectedDay={setSelectedReportDay} selectedDate={selectedReportDate} setSelectedDate={setSelectedReportDate} fullCalendar selectedMonth={selectedReportMonth} setSelectedMonth={setSelectedReportMonth} selectedYear={selectedReportYear} setSelectedYear={setSelectedReportYear} customFrom={customFrom} setCustomFrom={setCustomFrom} customTo={customTo} setCustomTo={setCustomTo} />} />
        <StoreScopeTabs lang={lang} businessesList={visibleReportBusinesses} selectedBusiness={safeSelectedBusiness} setSelectedBusiness={(id) => { if (!archivedReadOnlyBusiness) setSelectedBusiness(id); setShowSummaryDetails(false); }} />
        {isCombined ? (
          <div>
            <StoreComparison lang={lang} monthly={monthly} reviewEnabled={effectiveReviewEnabled} businessesList={scopedBusinesses} />
            <NotebookRow lines={2}><p className="w-full text-[10px] font-bold text-[#806528]">{text(lang, "chooseStoreForDetails")}</p></NotebookRow>
          </div>
        ) : (
          <div>
            <NotebookRow><div className="grid w-full grid-cols-5 items-end gap-1">{tabs.map((item) => <InkTab key={item.id} active={tab === item.id} onClick={() => changeReportTab(item.id)} titleUnderline className="min-w-0 text-[10px]">{text(lang, item.key)}</InkTab>)}</div></NotebookRow>
            {tab === "summary" && <div>
              <NotebookRow><NumberLine label={text(lang, "sales")} value={money(totals.sales, lang)} /></NotebookRow>
              {showSummaryDetails && <SummaryReportDetails lang={lang} monthly={monthly} selectedBusiness={safeSelectedBusiness} selectedDate={selectedReportDate} selectedMonth={selectedReportMonth} reportChannels={configuredChannels} businessesList={visibleReportBusinesses} section="sales" operationalEntries={operationalEntries} />}
              <NotebookRow><NumberLine label={text(lang, "purchasesExpenses")} value={money(totals.expense, lang)} valueClassName="text-[#B44747]" /></NotebookRow>
              {showSummaryDetails && <SummaryReportDetails lang={lang} monthly={monthly} selectedBusiness={safeSelectedBusiness} selectedDate={selectedReportDate} selectedMonth={selectedReportMonth} reportChannels={configuredChannels} businessesList={visibleReportBusinesses} section="outflow" operationalEntries={operationalEntries} />}
              <NotebookRow><div className="flex w-full items-end justify-between text-xs font-bold text-[#806528]"><span>{text(lang, "outflowRatio")}</span><strong className="text-[#B44747]">{totals.ratio}</strong></div></NotebookRow>
              <NotebookRow strong lines={2}><div className="flex w-full items-end justify-between"><span className="text-sm font-extrabold">{monthly ? text(lang, "recordedMonthResult") : text(lang, "netMovement")}</span><strong className={`tabular-nums text-2xl font-extrabold ${totals.net < 0 ? "text-[#B44747]" : "text-[#257844]"}`}><MoneyValue value={money(totals.net, lang)} /></strong></div></NotebookRow>
              <NotebookRow className="justify-center"><InkTab active={showSummaryDetails} onClick={() => setShowSummaryDetails(!showSummaryDetails)} className="inline-flex items-center gap-1">{text(lang, showSummaryDetails ? "hideReportDetails" : "reportDetails")}{showSummaryDetails ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}</InkTab></NotebookRow>
            </div>}
            {tab === "days" && <div>{reportDays.length === 0 ? <NotebookRow lines={2}><p className="text-xs font-bold text-[#806528]">{text(lang, "noCloseoutsPeriod")}</p></NotebookRow> : reportDays.map((day) => <NotebookRow key={day.id}><div className="grid w-full grid-cols-3 text-xs font-bold"><span>{shortDate(day, lang)}</span><span className="tabular-nums font-bold"><MoneyValue value={money(day.sales, lang)} /></span><span className="tabular-nums font-bold text-[#B44747]"><MoneyValue value={money(day.expense, lang)} /></span></div></NotebookRow>)}</div>}
            {tab === "channels" && <div>{visibleChannels.length === 0 ? <NotebookRow lines={2}><p className="text-xs font-bold text-[#806528]">{text(lang, "noSalesChannelsPeriod")}</p></NotebookRow> : visibleChannels.map((channel) => <NotebookRow key={channel.id}><div className="flex w-full items-end justify-between text-sm"><span className="font-bold">{channelName(channel, lang)}</span><strong className="tabular-nums font-bold"><MoneyValue value={money(channel.amount, lang)} /></strong></div></NotebookRow>)}</div>}
            {tab === "expenses" && <OutflowAnalysis lang={lang} period={period} selectedBusiness={safeSelectedBusiness} selectedDay={selectedReportDay} selectedDate={selectedReportDate} selectedMonth={selectedReportMonth} selectedYear={selectedReportYear} customFrom={customFrom} customTo={customTo} businessesList={visibleReportBusinesses} operationalEntries={operationalEntries.filter((entry) => safeSelectedBusiness !== "all" || activeReportBusinesses.some((business) => business.id === entry.businessId))} category={outflowCategory} setCategory={(value) => { setOutflowCategory(value); setShowOutflowTransactions(false); }} showTransactions={showOutflowTransactions} setShowTransactions={setShowOutflowTransactions} />}
            {tab === "proofs" && <div><NotebookRow><NumberLine label={text(lang, "totalAttachments")} value={`${totals.proofs}`} /></NotebookRow>{effectiveReviewEnabled ? <NotebookRow><NumberLine label={text(lang, "notReviewedItems")} value={`${totals.pending}`} valueClassName="text-[#B96725]" /></NotebookRow> : <NotebookRow lines={2}><p className="text-[10px] font-bold text-[#806528]">{text(lang, "reviewDisabled")}</p></NotebookRow>}</div>}
          </div>
        )}
      </Notebook>
      <p className="mt-4 text-center text-[10px] font-bold text-[#8B8274]">{text(lang, "operationalOnly")}</p>
    </motion.section>
  );
}

function downloadBlobFile(blob, filename) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

async function captureNotebookPreviewBlob(element, backgroundColor = "#FFFDF7") {
  if (!element) throw new Error("missing-preview");
  const { toBlob } = await import("html-to-image");
  if (document.fonts?.ready) await document.fonts.ready;
  const blob = await toBlob(element, {
    cacheBust: true,
    pixelRatio: Math.min(typeof window !== "undefined" ? window.devicePixelRatio || 2 : 2, 2),
    backgroundColor,
  });
  if (!blob) throw new Error("capture-empty");
  return blob;
}

/** Share image via OS sheet (WhatsApp on mobile). Never downloads — wa.me cannot attach files. */
async function shareNotebookImageToWhatsApp(file, caption, lang) {
  if (!file) return { ok: false, method: "none" };
  const openWhatsAppText = (message) => {
    window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, "_blank", "noopener,noreferrer");
  };

  if (typeof navigator !== "undefined" && navigator.share) {
    const payloads = [{ files: [file] }, { files: [file], text: caption }];
    for (const data of payloads) {
      try {
        if (navigator.canShare && !navigator.canShare(data)) continue;
        await navigator.share(data);
        return { ok: true, method: "share" };
      } catch (error) {
        if (error?.name === "AbortError") return { ok: true, method: "abort" };
      }
    }
    try {
      await navigator.share({ files: [file] });
      return { ok: true, method: "share" };
    } catch (error) {
      if (error?.name === "AbortError") return { ok: true, method: "abort" };
    }
  }

  if (navigator.clipboard?.write && typeof ClipboardItem !== "undefined") {
    try {
      const type = file.type || "image/png";
      await navigator.clipboard.write([new ClipboardItem({ [type]: file })]);
      openWhatsAppText(`${caption}${String.fromCharCode(10)}${String.fromCharCode(10)}${text(lang, "shareImagePasteHint")}`);
      return { ok: true, method: "clipboard" };
    } catch {
      // fall through
    }
  }

  openWhatsAppText(caption);
  return { ok: false, method: "text-only" };
}

function NotebookShareModal({ lang, snapshot, onClose, businessesList = businesses, operationalEntries = [], archivedBusinessIds = [] }) {
  const [format, setFormat] = useState("image");
  const [imageBusy, setImageBusy] = useState(false);
  const [imageError, setImageError] = useState("");
  const [shareHint, setShareHint] = useState("");
  const previewRef = useRef(null);
  const cachedImageFileRef = useRef(null);
  const preCaptureTokenRef = useRef(0);
  useEffect(() => { if (snapshot) { setFormat("image"); setImageError(""); setShareHint(""); cachedImageFileRef.current = null; } }, [snapshot]);
  useEffect(() => {
    if (!snapshot || format !== "image") {
      cachedImageFileRef.current = null;
      return undefined;
    }
    const captureToken = ++preCaptureTokenRef.current;
    let cancelled = false;
    const paperColor = (notebookThemes[snapshot.theme] || notebookThemes.yellow).paper || "#FFFDF7";
    const filename = `${lang === "ar" ? "تقفيلة" : "Taqfeelah"}-${snapshot.screen}-${snapshot.selectedDate || todayIsoDate()}.png`;
    let timeoutId = 0;
    const frameId = requestAnimationFrame(() => {
      timeoutId = window.setTimeout(async () => {
        if (cancelled || captureToken !== preCaptureTokenRef.current || !previewRef.current) return;
        try {
          const blob = await captureNotebookPreviewBlob(previewRef.current, paperColor);
          if (!cancelled && captureToken === preCaptureTokenRef.current) {
            cachedImageFileRef.current = new File([blob], filename, { type: "image/png" });
          }
        } catch {
          if (!cancelled && captureToken === preCaptureTokenRef.current) cachedImageFileRef.current = null;
        }
      }, 400);
    });
    return () => {
      cancelled = true;
      cancelAnimationFrame(frameId);
      clearTimeout(timeoutId);
    };
  }, [snapshot, format, lang]);
  if (!snapshot) return null;

  const sharePeriod = snapshot.period || "day";
  const monthly = sharePeriod === "month";
  const isOutflowReport = snapshot.screen === "reports" && snapshot.tab === "expenses";
  const isChannelsReport = snapshot.screen === "reports" && snapshot.tab === "channels";
  const isDaysReport = snapshot.screen === "reports" && snapshot.tab === "days";
  const isProofsReport = snapshot.screen === "reports" && snapshot.tab === "proofs";
  const activeShareBusinesses = businessesList.filter((business) => !archivedBusinessIds.includes(business.id));
  const includedBusinessIds = snapshot.includedBusinessIds || activeShareBusinesses.map((business) => business.id);
  const combined = snapshot.selectedBusiness === "all";
  const business = businessesList.find((item) => item.id === snapshot.selectedBusiness) || businessesList[0] || businesses[0];
  const shareDate = snapshot.selectedDate || todayIsoDate();
  const shareYear = snapshot.selectedYear || String(new Date().getFullYear());
  const shareFrom = snapshot.customFrom || `${shareYear}-01-01`;
  const shareTo = snapshot.customTo || todayIsoDate();
  const selectedDayItem = summaryDayFromEntries(operationalEntries, business.id, shareDate);
  const selectedMonthItem = formatSelectedMonth(snapshot.selectedMonth, lang);
  const scopedShareEntries = operationalEntries.filter((entry) => (combined ? includedBusinessIds.includes(entry.businessId) : entry.businessId === snapshot.selectedBusiness) && entryDateMatches(entry, sharePeriod, shareDate, snapshot.selectedMonth, shareYear, shareFrom, shareTo));
  const outflowCategory = snapshot.outflowCategory || "all";
  const filteredOutflowEntries = scopedShareEntries.filter((entry) => entryIsActive(entry) && entryIsOutflow(entry) && (outflowCategory === "all" || entryCategory(entry) === outflowCategory));
  const shareChannelMap = new Map();
  scopedShareEntries.filter((entry) => entryIsActive(entry) && entry.type === "summary").forEach((entry) => (entry.salesChannels || []).forEach((row) => { const current = shareChannelMap.get(row.channelId) || { id: row.channelId, label: row.name || row.channelId, amount: 0 }; shareChannelMap.set(row.channelId, { ...current, amount: current.amount + row.amount }); }));
  const shareChannelRows = [...shareChannelMap.values()].filter((row) => row.amount > 0);
  const shareDayRows = [...new Set(scopedShareEntries.filter(entryIsActive).map((entry) => entry.date))].sort().reverse().map((date) => ({ date, ...summarizeEntries(scopedShareEntries.filter((entry) => entry.date === date)) }));
  const shareProofEntries = scopedShareEntries.filter((entry) => entryIsActive(entry) && entryHasAttachment(entry));
  const sharePendingProofs = shareProofEntries.filter((entry) => !entry.reviewed).length;
  const shareBusinessRows = includedBusinessIds.map((businessId) => { const item = businessesList.find((business) => business.id === businessId); return { business: item, ...summarizeEntries(scopedShareEntries.filter((entry) => entry.businessId === businessId)) }; }).filter((row) => row.business);
  const outflowTotal = filteredOutflowEntries.reduce((sum, entry) => sum + entry.amount, 0);
  const outflowAverage = filteredOutflowEntries.length ? outflowTotal / filteredOutflowEntries.length : 0;
  const normalRecord = combined ? summarizeEntries(scopedShareEntries) : monthly ? summaryMonthFromEntries(operationalEntries, business.id, snapshot.selectedMonth) : selectedDayItem;
  const record = isOutflowReport ? { sales: 0, expense: outflowTotal, net: -outflowTotal, ratio: "—" } : normalRecord;
  const ratio = record.ratio || (record.sales > 0 ? `${((record.expense / record.sales) * 100).toFixed(1)}%` : record.expense > 0 ? "—" : "0.0%");
  const title = combined ? text(lang, snapshot.screen === "reports" ? "combinedReport" : "combinedCloseout") : businessName(business, lang);
  const periodLabel = sharePeriod === "year" ? shareYear : sharePeriod === "custom" ? `${formatCalendarDate(shareFrom, lang)} — ${formatCalendarDate(shareTo, lang)}` : monthly ? selectedMonthItem : fullDate(selectedDayItem, lang);
  const outflowCategoryLabel = outflowCategory === "all" ? text(lang, "allCategories") : text(lang, outflowReportCategories.find((item) => item.id === outflowCategory)?.label || "other");
  const activeTheme = notebookThemes[snapshot.theme] || notebookThemes.yellow;
  const lines = {
    backgroundImage: `repeating-linear-gradient(180deg, transparent 0px, transparent 43px, ${activeTheme.line} 43px, ${activeTheme.line} 44px)`,
  };
  const shareCaption = combined
    ? [
        lang === "ar" ? "تقفيلة - مقارنة المحلات" : "Taqfeelah - Shops comparison",
        periodLabel,
        ...shareBusinessRows.map((row) => lang === "ar"
          ? `${businessName(row.business, lang)} | المبيعات: ${money(row.sales, lang)} | الخارج: ${money(row.expense, lang)} | النتيجة: ${money(row.net, lang)}`
          : `${businessName(row.business, lang)} | Sales: ${money(row.sales, lang)} | Outflow: ${money(row.expense, lang)} | Result: ${money(row.net, lang)}`),
        lang === "ar"
          ? `الإجمالي | المبيعات: ${money(record.sales, lang)} | الخارج: ${money(record.expense, lang)} | النتيجة: ${money(record.net, lang)}`
          : `Total | Sales: ${money(record.sales, lang)} | Outflow: ${money(record.expense, lang)} | Result: ${money(record.net, lang)}`,
      ].join(String.fromCharCode(10))
    : isOutflowReport
      ? [
          lang === "ar" ? "تقفيلة - تقرير الخارج" : "Taqfeelah - Outflow report",
          title,
          periodLabel,
          lang === "ar" ? `التصنيف: ${outflowCategoryLabel}` : `Category: ${outflowCategoryLabel}`,
          lang === "ar" ? `إجمالي الخارج: ${money(outflowTotal, lang)}` : `Total outflow: ${money(outflowTotal, lang)}`,
          lang === "ar" ? `عدد العمليات: ${filteredOutflowEntries.length}` : `Transactions: ${filteredOutflowEntries.length}`,
        ].join(String.fromCharCode(10))
      : isChannelsReport
        ? [
            lang === "ar" ? "تقفيلة - تقرير القنوات" : "Taqfeelah - Channels report",
            title,
            periodLabel,
            ...shareChannelRows.map((row) => `${row.label}: ${money(row.amount, lang)}`),
          ].join(String.fromCharCode(10))
        : isDaysReport
          ? [
              lang === "ar" ? "تقفيلة - تقرير الأيام" : "Taqfeelah - Days report",
              title,
              periodLabel,
              ...shareDayRows.map((row) => lang === "ar"
                ? `${formatCalendarDate(row.date, lang)} | المبيعات: ${money(row.sales, lang)} | الخارج: ${money(row.expense, lang)}`
                : `${formatCalendarDate(row.date, lang)} | Sales: ${money(row.sales, lang)} | Outflow: ${money(row.expense, lang)}`),
            ].join(String.fromCharCode(10))
          : isProofsReport
            ? [
                lang === "ar" ? "تقفيلة - تقرير المرفقات" : "Taqfeelah - Attachments report",
                title,
                periodLabel,
                lang === "ar" ? `إجمالي المرفقات: ${shareProofEntries.length}` : `Total attachments: ${shareProofEntries.length}`,
                lang === "ar" ? `لم تتم مراجعتها: ${sharePendingProofs}` : `Not reviewed: ${sharePendingProofs}`,
              ].join(String.fromCharCode(10))
            : [
                lang === "ar" ? `تقفيلة - ${title}` : `Taqfeelah - ${title}`,
                periodLabel,
                lang === "ar" ? `المبيعات: ${money(record.sales, lang)}` : `Sales: ${money(record.sales, lang)}`,
                lang === "ar" ? `الخارج: ${money(record.expense, lang)}` : `Outflow: ${money(record.expense, lang)}`,
                lang === "ar" ? `النتيجة: ${money(record.net, lang)}` : `Result: ${money(record.net, lang)}`,
              ].join(String.fromCharCode(10));
  const formats = [
    { id: "image", label: "imageFormat", icon: FileImage },
    { id: "pdf", label: "pdfFormat", icon: FileText },
    { id: "excel", label: "excelFormat", icon: FileSpreadsheet },
  ];

  const detailedSummary = snapshot.screen === "reports" && snapshot.tab === "summary" && snapshot.showSummaryDetails && !combined;
  const showHomeOperations = snapshot.screen === "home" && snapshot.showDetails && !combined && !monthly;
  const shareOperations = showHomeOperations ? newestEntries(scopedShareEntries.filter(entryIsActive)) : [];
  const showOutflowOperations = isOutflowReport && snapshot.showOutflowTransactions && !combined;
  const shareOutflowOperations = showOutflowOperations ? newestEntries(filteredOutflowEntries) : [];
  const shareChannels = snapshot.reportChannels || channels;
  const salesBase = record.sales || 0;
  const percentageOfSales = (amount) => salesBase > 0 ? `${((amount / salesBase) * 100).toFixed(1)}%` : amount > 0 ? "—" : "0.0%";
  const shareEntries = scopedShareEntries;
  const detailOutflow = outflowReportCategories.filter((item) => item.id !== "all").map((item) => ({ ...item, amount: shareEntries.filter((entry) => entryIsActive(entry) && entryIsOutflow(entry) && entryCategory(entry) === item.id).reduce((sum, entry) => sum + entry.amount, 0) })).filter((item) => item.amount > 0);
  const salesDetailRows = aggregateChannels(operationalEntries, snapshot.selectedBusiness, monthly ? "month" : "day", shareDate, snapshot.selectedMonth, shareChannels).map((channel) => {
    const amount = channel.amount;
    return {
      label: channelName(channel, lang),
      ratio: percentageOfSales(amount),
      value: money(amount, lang),
      tone: "text-[#112A46]",
    };
  });
  const outflowDetailRows = detailOutflow.map((item) => ({
    label: text(lang, item.label),
    ratio: percentageOfSales(item.amount),
    value: money(item.amount, lang),
    tone: "text-[#B44747]",
  }));
  const tableRows = [
    { label: text(lang, "sales"), value: money(record.sales, lang), tone: "text-[#112A46]", heading: true },
    ...(detailedSummary ? salesDetailRows : []),
    { label: text(lang, "purchasesExpenses"), value: money(record.expense, lang), tone: "text-[#B44747]", heading: true },
    ...(detailedSummary ? outflowDetailRows : []),
    { label: text(lang, "outflowRatio"), value: ratio, tone: "text-[#B44747]", heading: true },
    { label: text(lang, "result"), value: money(record.net, lang), tone: record.net < 0 ? "text-[#B44747]" : "text-[#257844]", heading: true },
  ];
  const exportTitle = snapshot.screen === "reports" ? text(lang, "reportNotebook") : monthly ? text(lang, "monthlySummary") : text(lang, "dailySummary");
  const valueHeader = lang === "ar" ? "القيمة" : "Value";
  const detailsHeader = lang === "ar" ? "التفاصيل" : "Details";
  const exportTable = combined
    ? {
        headers: [text(lang, "store"), text(lang, "sales"), text(lang, "purchasesExpenses"), text(lang, "result")],
        rows: [
          ...shareBusinessRows.map((row) => [businessName(row.business, lang), money(row.sales, lang), money(row.expense, lang), money(row.net, lang)]),
          [text(lang, "combinedTotal"), money(record.sales, lang), money(record.expense, lang), money(record.net, lang)],
        ],
      }
    : isOutflowReport
      ? {
          headers: [text(lang, "reportType"), valueHeader, detailsHeader],
          rows: [
            [text(lang, "totalOutflow"), money(outflowTotal, lang), ""],
            [text(lang, "numberTransactions"), String(filteredOutflowEntries.length), ""],
            [text(lang, "averageTransaction"), money(outflowAverage, lang), ""],
          ],
        }
      : isChannelsReport
        ? { headers: [text(lang, "channels"), valueHeader], rows: shareChannelRows.map((row) => [row.label, money(row.amount, lang)]) }
        : isDaysReport
          ? { headers: [text(lang, "day"), text(lang, "sales"), text(lang, "purchasesExpenses")], rows: shareDayRows.map((row) => [formatCalendarDate(row.date, lang), money(row.sales, lang), money(row.expense, lang)]) }
          : isProofsReport
            ? { headers: [text(lang, "reportType"), valueHeader], rows: [[text(lang, "totalAttachments"), String(shareProofEntries.length)], ...(snapshot.reviewEnabled !== false ? [[text(lang, "notReviewedItems"), String(sharePendingProofs)]] : [])] }
            : detailedSummary
              ? { headers: [text(lang, "reportType"), lang === "ar" ? "النسبة" : "Ratio", valueHeader], rows: tableRows.map((row) => [row.label, row.ratio || "", row.value]) }
              : { headers: [text(lang, "reportType"), valueHeader, detailsHeader], rows: tableRows.map((row) => [row.label, row.value, ""]) };
  if (showHomeOperations) {
    exportTable.rows.push([text(lang, "operations"), "", formatCalendarDate(shareDate, lang)]);
    shareOperations.forEach((item) => exportTable.rows.push([noteLabel(item, lang), money(signedEntryAmount(item), lang), `${opTime(item, lang)} · ${entryHasAttachment(item) ? text(lang, "attachmentExists") : text(lang, "noAttachment")}`]));
  }
  if (showOutflowOperations) {
    exportTable.rows.push([text(lang, "operations"), "", periodLabel]);
    shareOutflowOperations.forEach((item) => exportTable.rows.push([operationDisplayLabel(item, lang), money(signedEntryAmount(item), lang), `${formatCalendarDate(item.date, lang)} · ${opTime(item, lang)} · ${entryHasAttachment(item) ? text(lang, "attachmentExists") : text(lang, "noAttachment")}`]));
  }
  const safeExportName = `${lang === "ar" ? "تقفيلة" : "Taqfeelah"}-${snapshot.screen}-${shareDate}`;
  const imageFilename = `${safeExportName}.png`;
  const buildNotebookImageFile = async () => {
    const blob = await captureNotebookPreviewBlob(previewRef.current, activeTheme.paper || "#FFFDF7");
    return new File([blob], imageFilename, { type: "image/png" });
  };
  const resolveNotebookImageFile = async () => {
    if (cachedImageFileRef.current) return cachedImageFileRef.current;
    const file = await buildNotebookImageFile();
    cachedImageFileRef.current = file;
    return file;
  };
  const runImageAction = async (action) => {
    setImageError("");
    setShareHint("");
    setImageBusy(true);
    try {
      const file = await resolveNotebookImageFile();
      await action(file);
    } catch (error) {
      if (error?.name === "AbortError") return;
      setImageError(text(lang, "shareImageFailed"));
    } finally {
      setImageBusy(false);
    }
  };
  const downloadNotebookImage = () => runImageAction(async (file) => downloadBlobFile(file, imageFilename));
  const shareNotebookImage = () => runImageAction(async (file) => {
    if (navigator.share && (!navigator.canShare || navigator.canShare({ files: [file] }))) {
      await navigator.share({ files: [file], title: exportTitle, text: shareCaption });
      return;
    }
    downloadBlobFile(file, imageFilename);
  });
  const shareImageViaWhatsApp = () => {
    setImageError("");
    setShareHint("");
    setImageBusy(true);
    void (async () => {
      try {
        const file = await resolveNotebookImageFile();
        const result = await shareNotebookImageToWhatsApp(file, shareCaption, lang);
        if (result.method === "clipboard") setShareHint(text(lang, "shareImagePasteHint"));
        else if (result.method === "text-only") setShareHint(text(lang, "shareImageWhatsAppUnavailable"));
      } catch (error) {
        if (error?.name === "AbortError") return;
        setImageError(text(lang, "shareImageFailed"));
      } finally {
        setImageBusy(false);
      }
    })();
  };
  const csvCell = (value) => `"${String(value ?? "").replace(/"/g, '""')}"`;
  const exportExcel = () => {
    const rows = [exportTable.headers, ...exportTable.rows];
    const csvRows = rows.map((row) => row.map(csvCell).join(","));
    const csv = "﻿" + csvRows.join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${safeExportName}.csv`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  };
  const escapeHtml = (value) => String(value ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  const exportPdf = () => {
    const printWindow = window.open("", "_blank", "width=900,height=1100");
    if (!printWindow) return;
    const direction = lang === "ar" ? "rtl" : "ltr";
    const headerHtml = exportTable.headers.map((header) => `<th>${escapeHtml(header)}</th>`).join("");
    const rowsHtml = exportTable.rows.map((row) => `<tr>${exportTable.headers.map((_, index) => `<td>${escapeHtml(row[index] || "")}</td>`).join("")}</tr>`).join("");
    printWindow.document.write(`<!doctype html><html dir="${direction}"><head><meta charset="UTF-8"><title>${escapeHtml(safeExportName)}</title><style>*{box-sizing:border-box}body{font-family:Arial,sans-serif;color:#112A46;padding:42px;background:#fff}header{border-bottom:3px solid #C28A30;padding-bottom:18px;margin-bottom:24px}h1{font-size:26px;margin:0 0 10px;font-weight:800}p{margin:4px 0;color:#716753;font-size:13px}table{width:100%;border-collapse:collapse;margin-top:24px;font-size:14px}th{background:#112A46;color:#fff;text-align:${lang === "ar" ? "right" : "left"};padding:12px}td{padding:12px;border-bottom:1px solid #E6DFD1;font-weight:600}tr:last-child td{font-weight:800;border-top:2px solid #C28A30}footer{margin-top:30px;color:#827762;font-size:11px}@media print{body{padding:20px}}</style></head><body><header><h1>${escapeHtml(exportTitle)}</h1><p>${escapeHtml(periodLabel)}</p>${!combined ? `<p>${escapeHtml(title)}</p>` : ""}</header><table><thead><tr>${headerHtml}</tr></thead><tbody>${rowsHtml}</tbody></table><footer>${escapeHtml(text(lang, "operationalOnly"))}</footer><script>window.onload = () => { window.print(); };<\/script></body></html>`);
    printWindow.document.close();
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="absolute inset-0 z-50 flex flex-col justify-end bg-[#112A46]/45 sm:items-center sm:justify-center sm:p-6 lg:items-stretch lg:justify-end lg:p-0">
      <div className="max-h-[92%] overflow-y-auto rounded-t-[30px] bg-[#F8F6F0] p-5 pb-8 sm:w-full sm:max-w-[700px] sm:rounded-[30px] sm:p-6 lg:max-w-none lg:rounded-t-[30px] lg:rounded-b-none lg:p-5 lg:pb-8">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <p className="text-[10px] font-bold text-[#827762]">{text(lang, "shareOptions")}</p>
            <h3 className="text-base font-black">{format === "image" ? text(lang, "notebookImagePreview") : text(lang, "professionalReportPreview")}</h3>
          </div>
          <button onClick={onClose} className="flex h-9 w-9 items-center justify-center rounded-xl bg-white"><X className="h-4 w-4" /></button>
        </div>
        <div className="mb-4 grid grid-cols-3 gap-2">
          {formats.map((item) => {
            const Icon = item.icon;
            const active = format === item.id;
            return (
              <button type="button" key={item.id} onClick={() => setFormat(item.id)} className={`flex flex-col items-center gap-2 rounded-2xl px-2 py-3 text-[10px] font-black transition ${active ? "bg-[#112A46] text-white" : "bg-white text-[#716753] ring-1 ring-black/[0.045]"}`}>
                <Icon className="h-5 w-5" />{text(lang, item.label)}
              </button>
            );
          })}
        </div>
        {format === "image" ? (
          <>
            <div ref={previewRef} className="mb-4 overflow-hidden rounded-[24px] p-0 shadow-lg" style={{ backgroundColor: activeTheme.paper }}>
              <div className="relative px-5 pb-4 pt-3" style={{ ...lines, fontFamily: lang === "ar" ? "'Noto Sans Arabic', sans-serif" : "'Noto Sans', sans-serif" }}>
                <div className={`absolute bottom-0 top-0 w-[1.25px] ${lang === "ar" ? "right-8" : "left-8"}`} style={{ backgroundColor: activeTheme.margin }} />
                <div className={lang === "ar" ? "pr-6 pl-1" : "pl-6 pr-1"}>
                  <div className="flex h-[54px] items-center justify-center">
                    <Logo compact centered />
                  </div>
                  <div className="flex h-[44px] items-end justify-center gap-3 pb-[8px] text-[12px] font-black text-[#112A46]">
                    <ChevronDown className="h-3.5 w-3.5 shrink-0" />
                    <span>{periodLabel}</span>
                    <CalendarDays className="h-4 w-4 shrink-0" />
                  </div>
                  <div className="flex h-[58px] items-end justify-center pb-[8px]">
                    <div className="inline-flex flex-col items-center">
                      <p className="whitespace-nowrap text-[16px] font-black leading-none text-[#112A46]">{snapshot.screen === "reports" ? text(lang, "reportNotebook") : monthly ? text(lang, "monthlySummary") : text(lang, "dailySummary")}</p>
                      <span className="mt-2 block h-[2px] w-full rounded-full bg-[#C28A30]" />
                    </div>
                  </div>
                  {combined ? <>
                    <div className="flex h-[44px] items-end pb-2 text-[11px] font-bold text-[#806528]">{text(lang, "shopsComparisonReport")}</div>
                    <div className="grid h-[44px] grid-cols-[1.05fr_0.9fr_0.9fr_0.9fr] items-end gap-1 pb-2 text-[9px] font-bold text-[#806528]"><span>{text(lang, "store")}</span><span className="text-center">{text(lang, "salesShort")}</span><span className="text-center">{text(lang, "outflowShort")}</span><span className="text-center">{text(lang, "result")}</span></div>
                    {shareBusinessRows.map((row) => <div key={row.business.id} className="grid h-[44px] grid-cols-[1.05fr_0.9fr_0.9fr_0.9fr] items-end gap-1 pb-2 text-[10px]"><span className="truncate font-bold">{businessName(row.business, lang, true) || businessName(row.business, lang)}</span><strong className="text-center tabular-nums">{money(row.sales, lang)}</strong><strong className="text-center tabular-nums text-[#B44747]">{money(row.expense, lang)}</strong><strong className={`text-center tabular-nums ${row.net < 0 ? "text-[#B44747]" : "text-[#257844]"}`}>{money(row.net, lang)}</strong></div>)}
                    <div className="mt-1 grid h-[55px] grid-cols-[1.05fr_0.9fr_0.9fr_0.9fr] items-end gap-1 border-t-2 border-[#112A46]/55 pb-2 text-[10px]"><span className="font-bold">{text(lang, "combinedTotal")}</span><strong className="text-center tabular-nums">{money(record.sales, lang)}</strong><strong className="text-center tabular-nums text-[#B44747]">{money(record.expense, lang)}</strong><strong className={`text-center tabular-nums ${record.net < 0 ? "text-[#B44747]" : "text-[#257844]"}`}>{money(record.net, lang)}</strong></div>
                  </> : isOutflowReport ? <>
                    <div className="flex min-h-[44px] items-end pb-2 text-[11px] font-bold text-[#806528]">{text(lang, "detailedOutflowReport")} · {outflowCategoryLabel}</div>
                    <FinancialRows lang={lang} rows={[
                      { id: "share-total", label: text(lang, "totalOutflow"), value: money(outflowTotal, lang), valueClassName: "text-[#B44747]" },
                      { id: "share-count", label: text(lang, "numberTransactions"), value: `${filteredOutflowEntries.length}` },
                      { id: "share-average", label: text(lang, "averageTransaction"), value: money(outflowAverage, lang), valueClassName: "text-[#806528]" },
                    ]} />
                    {showOutflowOperations && (
                      <div className="pt-1">
                        <div className="flex h-[44px] items-end pb-[8px]">
                          <p className="inline-flex flex-col text-[12px] font-black text-[#112A46]">
                            <span>{text(lang, "operations")}</span>
                            <span className="mt-1.5 h-[2px] w-full rounded-full bg-[#C28A30]" />
                          </p>
                        </div>
                        {shareOutflowOperations.length ? shareOutflowOperations.map((item, index) => (
                          <div key={`share-outflow-operation-${item.id}`} className={`grid min-h-[44px] w-full grid-cols-[max-content_minmax(0,1fr)] items-center gap-3 py-2 ${index < shareOutflowOperations.length - 1 ? "border-b border-[#D9DFE3]/70" : ""}`}>
                            <strong dir="ltr" className="min-w-[68px] whitespace-nowrap text-start tabular-nums text-[12px] font-black text-[#B44747]">
                              <MoneyValue value={money(signedEntryAmount(item), lang)} />
                            </strong>
                            <span className="min-w-0 text-end">
                              <span className="block truncate text-[11px] font-bold text-[#112A46]">{operationDisplayLabel(item, lang)}</span>
                              <small className="mt-0.5 block truncate text-[9px] font-bold text-[#8A816F]">{formatCalendarDate(item.date, lang)} · {opTime(item, lang)} · {entryHasAttachment(item) ? text(lang, "attachmentExists") : text(lang, "noAttachment")}</small>
                            </span>
                          </div>
                        )) : (
                          <div className="flex h-[44px] items-end pb-2 text-[10px] font-bold text-[#806528]">{text(lang, "noOutflowPeriod")}</div>
                        )}
                      </div>
                    )}
                  </> : isChannelsReport ? <>
                    <div className="flex h-[44px] items-end pb-2 text-[11px] font-bold text-[#806528]">{text(lang, "channelsReport")}</div>
                    {shareChannelRows.length ? shareChannelRows.map((row) => <div key={row.id} className="flex h-[44px] items-end justify-between pb-2 text-sm"><span>{row.label}</span><strong className="tabular-nums">{money(row.amount, lang)}</strong></div>) : <div className="flex h-[44px] items-end pb-2 text-xs text-[#806528]">{text(lang, "noSalesChannelsPeriod")}</div>}
                  </> : isDaysReport ? <>
                    <div className="flex h-[44px] items-end pb-2 text-[11px] font-bold text-[#806528]">{text(lang, "daysReport")}</div>
                    {shareDayRows.length ? <><div className="grid h-[44px] grid-cols-[1.25fr_1fr_1fr] items-end gap-1 pb-2 text-[9px] font-bold text-[#806528]"><span>{text(lang, "day")}</span><span className="text-center">{text(lang, "salesShort")}</span><span className="text-center">{text(lang, "outflowShort")}</span></div>{shareDayRows.map((row) => <div key={row.date} className="grid h-[44px] grid-cols-[1.25fr_1fr_1fr] items-end gap-1 pb-2 text-[10px]"><span className="truncate font-bold">{formatCalendarDate(row.date, lang)}</span><strong className="text-center tabular-nums">{money(row.sales, lang)}</strong><strong className="text-center tabular-nums text-[#B44747]">{money(row.expense, lang)}</strong></div>)}</> : <div className="flex h-[44px] items-end pb-2 text-xs text-[#806528]">{text(lang, "noCloseoutsPeriod")}</div>}
                  </> : isProofsReport ? <>
                    <div className="flex h-[44px] items-end pb-2 text-[11px] font-bold text-[#806528]">{text(lang, "attachmentsReport")}</div>
                    <div className="flex h-[44px] items-end justify-between pb-2 text-sm"><span>{text(lang, "totalAttachments")}</span><strong className="tabular-nums">{shareProofEntries.length}</strong></div>
                    {snapshot.reviewEnabled !== false && <div className="flex h-[44px] items-end justify-between pb-2 text-sm text-[#B96725]"><span>{text(lang, "notReviewedItems")}</span><strong className="tabular-nums">{sharePendingProofs}</strong></div>}
                    {snapshot.reviewEnabled === false && <div className="flex h-[44px] items-end pb-2 text-[10px] font-bold text-[#806528]">{text(lang, "reviewDisabled")}</div>}
                  </> : <>
                    <div className="flex h-[44px] items-end justify-between pb-2 text-sm"><span>{text(lang, "sales")}</span><strong className="tabular-nums"><MoneyValue value={money(record.sales, lang)} /></strong></div>
                    {detailedSummary && salesDetailRows.map((row) => (
                      <div key={`image-sales-${row.label}`} className="flex h-[44px] items-end justify-between pb-2 ps-3 text-xs">
                        <div className="flex items-center gap-2"><span className="text-[#716753]">{row.label}</span><RatioBadge value={row.ratio} /></div>
                        <strong className="tabular-nums text-[#112A46]"><MoneyValue value={row.value} /></strong>
                      </div>
                    ))}
                    <div className="flex h-[44px] items-end justify-between pb-2 text-sm text-[#B44747]"><span>{text(lang, "purchasesExpenses")}</span><strong className="tabular-nums"><MoneyValue value={money(record.expense, lang)} /></strong></div>
                    {detailedSummary && outflowDetailRows.map((row) => (
                      <div key={`image-outflow-${row.label}`} className="flex h-[44px] items-end justify-between pb-2 ps-3 text-xs">
                        <div className="flex items-center gap-2"><span className="text-[#716753]">{row.label}</span><RatioBadge value={row.ratio} /></div>
                        <strong className="tabular-nums text-[#B44747]"><MoneyValue value={row.value} /></strong>
                      </div>
                    ))}
                    <div className="flex h-[44px] items-end justify-between pb-2 text-xs text-[#806528]"><span>{text(lang, "outflowRatio")}</span><strong className="text-[#B44747]">{ratio}</strong></div>
                    <div className="mt-1 flex h-[55px] items-end justify-between border-t-2 border-[#112A46]/55 pb-2"><span className="text-sm font-bold">{snapshot.screen === "home" ? (monthly ? text(lang, "recordedMonthResult") : text(lang, "netMovement")) : text(lang, "result")}</span><strong className={`tabular-nums text-xl font-extrabold ${record.net < 0 ? "text-[#B44747]" : "text-[#257844]"}`}><MoneyValue value={money(record.net, lang)} /></strong></div>
                    {showHomeOperations && (
                      <div className="pt-1">
                        <div className="flex h-[44px] items-end pb-[8px]">
                          <p className="inline-flex flex-col text-[12px] font-black text-[#112A46]">
                            <span>{text(lang, "operations")} {formatCalendarDate(shareDate, lang)}</span>
                            <span className="mt-1.5 h-[2px] w-full rounded-full bg-[#C28A30]" />
                          </p>
                        </div>
                        {shareOperations.length ? shareOperations.map((item, index) => {
                          const isSale = item.type === "summary";
                          return (
                            <div key={`share-operation-${item.id}`} className={`grid min-h-[44px] w-full grid-cols-[max-content_minmax(0,1fr)] items-center gap-3 py-2 ${index < shareOperations.length - 1 ? "border-b border-[#D9DFE3]/70" : ""}`}>
                              <strong dir="ltr" className={`min-w-[68px] whitespace-nowrap text-start tabular-nums text-[12px] font-black ${isSale ? "text-[#257844]" : "text-[#B44747]"}`}>
                                <MoneyValue value={money(signedEntryAmount(item), lang)} />
                              </strong>
                              <span className="min-w-0 text-end">
                                <span className="block truncate text-[11px] font-bold text-[#112A46]">{noteLabel(item, lang)}</span>
                                <small className="mt-0.5 block truncate text-[9px] font-bold text-[#8A816F]">{opTime(item, lang)} · {entryHasAttachment(item) ? text(lang, "attachmentExists") : text(lang, "noAttachment")}</small>
                              </span>
                            </div>
                          );
                        }) : (
                          <div className="flex h-[44px] items-end pb-2 text-[10px] font-bold text-[#806528]">{text(lang, "noEntriesDay")}</div>
                        )}
                      </div>
                    )}
                  </>}
                </div>
              </div>
            </div>
            <p className="mb-2 text-center text-[10px] font-bold text-[#827762]">{text(lang, "imageReadyToShare")}</p>
            {shareHint && <p className="mb-3 rounded-xl bg-[#E6F5E9] px-3 py-2 text-center text-[10px] font-bold text-[#257844]">{shareHint}</p>}
            {imageError && <p className="mb-3 rounded-xl bg-[#FFF1EE] px-3 py-2 text-center text-[10px] font-bold text-[#B44747]">{imageError}</p>}
          </>
        ) : (
          <div className="mb-5 overflow-hidden rounded-[22px] bg-white ring-1 ring-black/[0.055]">
            <div className="bg-[#112A46] p-4 text-white">
              <div className="flex items-start justify-between gap-2"><div><p className="text-[10px] font-medium text-white/65">{text(lang, "reportFor")}</p><h4 className="mt-1 text-sm font-extrabold">{title}</h4></div><span className={`rounded-lg px-2 py-1 text-[10px] font-black ${format === "pdf" ? "bg-[#B44747]" : "bg-[#217346]"}`}>{format === "pdf" ? "PDF" : "Excel"}</span></div>
              <div className="mt-3 flex items-center justify-between text-[10px] font-medium text-white/70"><span>{text(lang, "selectedPeriod")}</span><span>{periodLabel}</span></div>
            </div>
            <div className="p-3">
              <div className="grid rounded-t-lg bg-[#F4F2ED] px-3 py-2 text-[10px] font-bold text-[#716753]" style={{ gridTemplateColumns: `repeat(${exportTable.headers.length}, minmax(0, 1fr))` }}>
                {exportTable.headers.map((header, index) => <span key={`export-head-${index}`} className={index > 0 ? "text-end" : ""}>{header}</span>)}
              </div>
              {exportTable.rows.map((row, index) => (
                <div key={`export-row-${index}`} className={`grid px-3 py-3 text-[11px] ${index < exportTable.rows.length - 1 ? "border-b border-[#ECE6DA]" : ""} ${row[0] === text(lang, "operations") ? "bg-[#FFF4D2] font-black text-[#112A46]" : "font-bold"}`} style={{ gridTemplateColumns: `repeat(${exportTable.headers.length}, minmax(0, 1fr))` }}>
                  {exportTable.headers.map((_, cellIndex) => <span key={`export-cell-${index}-${cellIndex}`} className={`${cellIndex > 0 ? "text-end tabular-nums" : "text-[#112A46]"} truncate`}>{row[cellIndex] || ""}</span>)}
                </div>
              ))}
            </div>
            <div className="flex items-center justify-between border-t border-[#ECE6DA] px-4 py-3 text-[10px] font-bold text-[#827762]"><span>{text(lang, "appName")}</span><span>{text(lang, "preparedForExport")}</span></div>
          </div>
        )}
        {format === "image" ? (
          <div className="space-y-2">
            <button type="button" disabled={imageBusy} onClick={shareNotebookImage} className="flex w-full items-center justify-center gap-2 rounded-2xl bg-[#112A46] py-3.5 text-xs font-black text-white disabled:opacity-60">
              <Share2 className="h-4 w-4" />{imageBusy ? (lang === "ar" ? "جاري التجهيز…" : "Preparing…") : text(lang, "shareNotebookImage")}
            </button>
            <div className="grid grid-cols-3 gap-2">
              <button type="button" onClick={onClose} className="rounded-2xl bg-white py-3.5 text-[10px] font-black text-[#112A46] ring-1 ring-black/[0.06]">{lang === "ar" ? "إغلاق" : "Close"}</button>
              <button type="button" disabled={imageBusy} onClick={downloadNotebookImage} className="flex items-center justify-center gap-1.5 rounded-2xl bg-white py-3.5 text-[10px] font-black text-[#112A46] ring-1 ring-black/[0.06] disabled:opacity-60">
                <Download className="h-3.5 w-3.5" />{text(lang, "downloadNotebookImage")}
              </button>
              <button type="button" disabled={imageBusy} onClick={shareImageViaWhatsApp} className="flex items-center justify-center gap-1.5 rounded-2xl bg-[#25D366] py-3.5 text-[10px] font-black text-white disabled:opacity-60">
                <Send className="h-3.5 w-3.5" />{text(lang, "shareViaWhatsApp")}
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-[0.7fr_1.3fr] gap-3">
            <button onClick={onClose} className="rounded-2xl bg-white py-3.5 text-xs font-black text-[#112A46] ring-1 ring-black/[0.06]">{lang === "ar" ? "إغلاق" : "Close"}</button>
            {format === "pdf" && <button type="button" onClick={exportPdf} className="flex items-center justify-center gap-2 rounded-2xl bg-[#B44747] py-3.5 text-xs font-black text-white"><FileText className="h-4 w-4" />{text(lang, "exportPdf")}</button>}
            {format === "excel" && <button type="button" onClick={exportExcel} className="flex items-center justify-center gap-2 rounded-2xl bg-[#217346] py-3.5 text-xs font-black text-white"><FileSpreadsheet className="h-4 w-4" />{text(lang, "exportExcel")}</button>}
          </div>
        )}
      </div>
    </motion.div>
  );
}

function SavedOutflowShareDialog({ lang, item, businessesList = businesses, onClose }) {
  if (!item) return null;
  const store = businessesList.find((business) => business.id === item.businessId);
  const categoryLabel = operationDisplayLabel(item, lang);
  const message = `${text(lang, "addOutflow")} - ${businessName(store, lang)}
${text(lang, "transactionType")}: ${text(lang, item.type)}
${text(lang, "category")}: ${categoryLabel}
${text(lang, "amount")}: ${money(signedEntryAmount(item), lang)}
${text(lang, "date")}: ${formatCalendarDate(item.date, lang)}
${text(lang, "note")}: ${item.note || "-"}`;
  const sendWhatsApp = () => { window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, "_blank"); onClose(); };
  return <AnimatePresence><motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 z-[60] flex items-end bg-[#112A46]/50 sm:items-center sm:justify-center sm:p-6 lg:items-end lg:justify-start lg:p-0"><motion.div initial={{ y: 18 }} animate={{ y: 0 }} exit={{ y: 18 }} className="relative z-10 w-full rounded-t-[30px] bg-[#F8F6F0] p-5 pb-8 sm:max-w-[560px] sm:rounded-[30px] sm:p-6 lg:max-w-none lg:rounded-t-[30px] lg:rounded-b-none lg:p-5 lg:pb-8"><div className="mb-4 flex items-start justify-between"><div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#E6F5E9] text-[#257844]"><Check className="h-5 w-5" /></div><button onClick={onClose} className="flex h-9 w-9 items-center justify-center rounded-xl bg-white ring-1 ring-black/[0.05]"><X className="h-4 w-4" /></button></div><h3 className="text-base font-black">{text(lang, "outflowSavedTitle")}</h3><p className="mt-2 text-[12px] font-bold leading-6 text-[#716753]">{text(lang, "outflowSavedDesc")}</p><div className="mt-4 rounded-2xl bg-white p-4 ring-1 ring-black/[0.045]"><div className="flex items-center justify-between gap-2"><div><p className="text-xs font-black text-[#112A46]">{categoryLabel}</p><p className="mt-1 text-[10px] font-bold text-[#827762]">{businessName(store, lang)} · {formatCalendarDate(item.date, lang)}</p></div><strong className="tabular-nums text-sm font-black text-[#B44747]">{money(signedEntryAmount(item), lang)}</strong></div></div><p className="mt-4 text-xs font-bold text-[#716753]">{text(lang, "sendOutflowQuestion")}</p><div className="mt-5 grid grid-cols-[1fr_1.15fr] gap-3"><button onClick={onClose} className="rounded-2xl bg-white py-3.5 text-[11px] font-black text-[#112A46] ring-1 ring-black/[0.06]">{text(lang, "keepWithoutSending")}</button><button onClick={sendWhatsApp} className="flex items-center justify-center gap-2 rounded-2xl bg-[#25D366] py-3.5 text-[11px] font-black text-white"><Send className="h-4 w-4" />{text(lang, "saveShareWhatsApp")}</button></div></motion.div></motion.div></AnimatePresence>;
}

function OperationModal({ lang, item, onClose, onReview, onVoid, onRestore, reviewEnabled = true, canVoid = true, canRestore = true }) {
  if (!item) return null;
  const isSale = item.type === "summary";
  const voided = entryIsVoided(item);
  return <AnimatePresence><motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 z-40 flex items-end bg-[#112A46]/35 sm:items-center sm:justify-center sm:p-6 lg:items-end lg:justify-start lg:p-0"><div className="relative z-10 w-full rounded-t-[30px] bg-[#F8F6F0] p-5 pb-8 sm:max-w-[560px] sm:rounded-[30px] sm:p-6 lg:max-w-none lg:rounded-t-[30px] lg:rounded-b-none lg:p-5 lg:pb-8"><div className="mb-4 flex justify-between"><div className="flex flex-wrap items-center gap-2"><Badge tone={isSale ? "success" : "warning"}>{operationDisplayLabel(item, lang)}</Badge>{voided && <Badge tone="warning">{text(lang, "voided")}</Badge>}{!voided && entryWasRestored(item) && <Badge tone="success">{text(lang, "restored")}</Badge>}{!voided && item.reviewed && <Badge tone="success">{text(lang, "reviewed")}</Badge>}<h3 className="mt-2 w-full text-lg font-black">{noteLabel(item, lang)}</h3></div><button onClick={onClose}><X className="h-5 w-5" /></button></div><div className="mb-4 rounded-2xl bg-white p-4 text-sm"><div className="mb-2 flex justify-between"><span>{text(lang, "amount")}</span><strong className={`${voided ? "line-through opacity-60" : ""} ${isSale ? "text-[#257844]" : "text-[#B44747]"}`}>{money(signedEntryAmount(item), lang)}</strong></div><div className="mb-2 flex justify-between"><span>{text(lang, "time")}</span><strong>{opDate(item, lang)} · {opTime(item, lang)}</strong></div><div className="flex justify-between"><span>{text(lang, "enteredBy")}</span><strong>{employeeName(item, lang)}</strong></div>{voided && <div className="mt-3 border-t border-[#F0ECE2] pt-3"><div className="flex justify-between text-[#B44747]"><span>{text(lang, "status")}</span><strong>{text(lang, "voidedByOwner")}</strong></div>{item.voidReason && <div className="mt-2 flex justify-between gap-3 text-[11px] text-[#716753]"><span>{text(lang, "voidReason")}</span><strong className="text-end">{item.voidReason}</strong></div>}</div>}{!voided && entryWasRestored(item) && <div className="mt-3 border-t border-[#F0ECE2] pt-3"><div className="flex justify-between text-[#257844]"><span>{text(lang, "status")}</span><strong>{text(lang, "restoredByOwner")}</strong></div>{item.restoreReason && <div className="mt-2 flex justify-between gap-3 text-[11px] text-[#716753]"><span>{text(lang, "restoreReason")}</span><strong className="text-end">{item.restoreReason}</strong></div>}</div>}</div>{(item.auditTrail || []).length > 0 && <div className="mb-4 rounded-2xl bg-white p-4"><p className="mb-3 text-xs font-black text-[#112A46]">{text(lang, "auditTrail")}</p><div className="space-y-2">{item.auditTrail.map((action, index) => <div key={`${action.action}-${action.at}-${index}`} className="flex items-start justify-between gap-3 text-[10px] font-bold"><div className="flex items-start gap-2"><span className={`mt-1 h-2 w-2 rounded-full ${action.action === "voided" ? "bg-[#B44747]" : action.action === "restored" || action.action === "reviewed" || action.action === "duplicate_approved" ? "bg-[#257844]" : "bg-[#806528]"}`} /><div><p>{text(lang, action.action === "created" ? "actionCreated" : action.action === "voided" ? "actionVoided" : action.action === "restored" ? "actionRestored" : action.action === "reviewed" ? "actionReviewed" : "actionDuplicateApproved")}</p><p className="mt-0.5 font-medium text-[#827762]">{action.by ? (lang === "ar" ? action.by.nameAr : action.by.nameEn) : "-"}</p>{action.reason && <p className="mt-0.5 font-medium text-[#827762]">{action.reason}</p>}</div></div><span className="shrink-0 text-end text-[#827762]">{auditDateTime(action.at, lang)}</span></div>)}</div></div>}{entryHasAttachment(item) && <div className="mb-4 overflow-hidden rounded-2xl bg-[#E9E2D5]"><AttachmentPreview attachment={item.attachment} className="h-52 w-full" /></div>}{reviewEnabled && !voided && entryHasAttachment(item) && !item.reviewed && <button onClick={() => onReview(item.id)} className="mb-3 w-full rounded-2xl bg-[#39A160] py-4 text-sm font-extrabold text-white">{text(lang, "confirmReview")}</button>}{canRestore && voided && <button onClick={() => onRestore(item.id)} className="w-full rounded-2xl bg-[#E6F5E9] py-4 text-sm font-extrabold text-[#257844]">{text(lang, "restoreEntry")}</button>}{canVoid && !voided && <button onClick={() => onVoid(item.id)} className="w-full rounded-2xl bg-[#FFF1EE] py-4 text-sm font-extrabold text-[#B44747]">{text(lang, "voidEntry")}</button>}</div></motion.div></AnimatePresence>;
}

function DuplicateSalesDialog({ lang, draft, previousEntries = [], businessesList = businesses, onCancel, onConfirm }) {
  if (!draft) return null;
  const store = businessesList.find((business) => business.id === draft.businessId);
  const newAmount = (draft.salesChannels || []).reduce((sum, row) => sum + row.amount, 0);
  const previousTotal = previousEntries.reduce((sum, entry) => sum + entry.amount, 0);
  return <AnimatePresence><motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 z-[60] flex items-end bg-[#112A46]/50 sm:items-center sm:justify-center sm:p-6 lg:items-end lg:justify-start lg:p-0"><motion.div initial={{ y: 18 }} animate={{ y: 0 }} exit={{ y: 18 }} className="relative z-10 w-full rounded-t-[30px] bg-[#F8F6F0] p-5 pb-8 sm:max-w-[560px] sm:rounded-[30px] sm:p-6 lg:max-w-none lg:rounded-t-[30px] lg:rounded-b-none lg:p-5 lg:pb-8"><div className="mb-4 flex items-start justify-between"><div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#FFF1EE] text-[#B44747]"><Bell className="h-5 w-5" /></div><button onClick={onCancel} className="flex h-9 w-9 items-center justify-center rounded-xl bg-white ring-1 ring-black/[0.05]"><X className="h-4 w-4" /></button></div><h3 className="text-base font-black">{text(lang, "duplicateSalesTitle")}</h3><p className="mt-2 text-[12px] font-bold leading-6 text-[#716753]">{text(lang, "duplicateSalesWarning")}</p><div className="mt-4 rounded-2xl bg-white p-4 ring-1 ring-black/[0.045]"><p className="text-[11px] font-black text-[#112A46]">{businessName(store, lang)} · {formatCalendarDate(draft.date, lang)}</p><div className="mt-3 flex justify-between text-xs font-bold text-[#827762]"><span>{text(lang, "previousSalesEntries")} ({previousEntries.length})</span><strong>{money(previousTotal, lang)}</strong></div><div className="mt-2 flex justify-between border-t border-[#F0ECE2] pt-2 text-xs font-black"><span>{text(lang, "summary")}</span><strong className="text-[#257844]">+{money(newAmount, lang)}</strong></div></div><div className="mt-5 grid grid-cols-[0.9fr_1.35fr] gap-3"><button onClick={onCancel} className="rounded-2xl bg-white py-3.5 text-xs font-black ring-1 ring-black/[0.06]">{text(lang, "cancel")}</button><button onClick={onConfirm} className="rounded-2xl bg-[#B44747] py-3.5 text-xs font-black text-white">{text(lang, "saveAdditionalEntry")}</button></div></motion.div></motion.div></AnimatePresence>;
}

function VoidOperationDialog({ lang, item, onCancel, onConfirm }) {
  const [reason, setReason] = useState("");
  useEffect(() => { setReason(""); }, [item?.id]);
  if (!item) return null;
  const isSale = item.type === "summary";
  return <AnimatePresence><motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 z-[60] flex items-end bg-[#112A46]/50 sm:items-center sm:justify-center sm:p-6 lg:items-end lg:justify-start lg:p-0"><motion.div initial={{ y: 18 }} animate={{ y: 0 }} exit={{ y: 18 }} className="relative z-10 w-full rounded-t-[30px] bg-[#F8F6F0] p-5 pb-8 sm:max-w-[560px] sm:rounded-[30px] sm:p-6 lg:max-w-none lg:rounded-t-[30px] lg:rounded-b-none lg:p-5 lg:pb-8"><div className="mb-4 flex items-start justify-between"><div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#FFF1EE] text-[#B44747]"><X className="h-5 w-5" /></div><button onClick={onCancel} className="flex h-9 w-9 items-center justify-center rounded-xl bg-white ring-1 ring-black/[0.05]"><X className="h-4 w-4" /></button></div><h3 className="text-base font-black">{text(lang, "voidDialogTitle")}</h3><p className="mt-2 text-[12px] font-bold leading-6 text-[#716753]">{text(lang, "voidConfirm")}</p><div className="mt-4 rounded-2xl bg-white p-4 ring-1 ring-black/[0.045]"><div className="flex items-center justify-between gap-2"><div className="flex items-center gap-2"><Badge tone={isSale ? "success" : "warning"}>{operationDisplayLabel(item, lang)}</Badge><span className="text-[11px] font-bold text-[#827762]">{opDate(item, lang)}</span></div><strong className={`tabular-nums text-sm font-black ${isSale ? "text-[#257844]" : "text-[#B44747]"}`}>{money(signedEntryAmount(item), lang)}</strong></div></div><div className="mt-4"><p className="mb-2 text-xs font-bold text-[#716753]">{text(lang, "voidReasonPrompt")}</p><textarea value={reason} onChange={(event) => setReason(event.target.value)} maxLength={160} placeholder={text(lang, "voidReasonPrompt")} className="min-h-[72px] w-full resize-none rounded-2xl bg-white px-4 py-3 text-sm font-bold outline-none ring-1 ring-black/[0.05]" /></div><div className="mt-5 grid grid-cols-[0.9fr_1.35fr] gap-3"><button onClick={onCancel} className="rounded-2xl bg-white py-3.5 text-xs font-black ring-1 ring-black/[0.06]">{text(lang, "cancel")}</button><button onClick={() => onConfirm(reason.trim())} className="rounded-2xl bg-[#B44747] py-3.5 text-xs font-black text-white">{text(lang, "confirmVoid")}</button></div></motion.div></motion.div></AnimatePresence>;
}
function RestoreOperationDialog({ lang, item, onCancel, onConfirm }) {
  const [reason, setReason] = useState("");
  useEffect(() => { setReason(""); }, [item?.id]);
  if (!item) return null;
  const isSale = item.type === "summary";
  return <AnimatePresence><motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 z-[60] flex items-end bg-[#112A46]/50 sm:items-center sm:justify-center sm:p-6 lg:items-end lg:justify-start lg:p-0"><motion.div initial={{ y: 18 }} animate={{ y: 0 }} exit={{ y: 18 }} className="relative z-10 w-full rounded-t-[30px] bg-[#F8F6F0] p-5 pb-8 sm:max-w-[560px] sm:rounded-[30px] sm:p-6 lg:max-w-none lg:rounded-t-[30px] lg:rounded-b-none lg:p-5 lg:pb-8"><div className="mb-4 flex items-start justify-between"><div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#E6F5E9] text-[#257844]"><Check className="h-5 w-5" /></div><button onClick={onCancel} className="flex h-9 w-9 items-center justify-center rounded-xl bg-white ring-1 ring-black/[0.05]"><X className="h-4 w-4" /></button></div><h3 className="text-base font-black">{text(lang, "restoreDialogTitle")}</h3><p className="mt-2 text-[12px] font-bold leading-6 text-[#716753]">{text(lang, "restoreConfirm")}</p><div className="mt-4 rounded-2xl bg-white p-4 ring-1 ring-black/[0.045]"><div className="flex items-center justify-between gap-2"><div className="flex items-center gap-2"><Badge tone={isSale ? "success" : "warning"}>{operationDisplayLabel(item, lang)}</Badge><span className="text-[11px] font-bold text-[#827762]">{opDate(item, lang)}</span></div><strong className={`tabular-nums text-sm font-black ${isSale ? "text-[#257844]" : "text-[#B44747]"}`}>{money(signedEntryAmount(item), lang)}</strong></div></div><div className="mt-4"><p className="mb-2 text-xs font-bold text-[#716753]">{text(lang, "restoreReasonPrompt")}</p><textarea value={reason} onChange={(event) => setReason(event.target.value)} maxLength={160} placeholder={text(lang, "restoreReasonPrompt")} className="min-h-[72px] w-full resize-none rounded-2xl bg-white px-4 py-3 text-sm font-bold outline-none ring-1 ring-black/[0.05]" /></div><div className="mt-5 grid grid-cols-[0.9fr_1.35fr] gap-3"><button onClick={onCancel} className="rounded-2xl bg-white py-3.5 text-xs font-black ring-1 ring-black/[0.06]">{text(lang, "cancel")}</button><button onClick={() => onConfirm(reason.trim())} className="rounded-2xl bg-[#257844] py-3.5 text-xs font-black text-white">{text(lang, "confirmRestore")}</button></div></motion.div></motion.div></AnimatePresence>;
}
function buildInitialStoreOperationalSettings(savedSettings, storeList) {
  if (savedSettings?.storeOperationalSettings) return savedSettings.storeOperationalSettings;
  const legacy = {
    activeCategories: savedSettings?.activeCategories || expenseCategories.map((item) => item.id),
    reviewEnabled: savedSettings?.reviewEnabled ?? true,
    closeoutAlert: savedSettings?.closeoutAlert ?? true,
    attachmentAlert: savedSettings?.attachmentAlert ?? true,
  };
  return Object.fromEntries(storeList.map((business) => [business.id, { ...legacy, activeCategories: [...legacy.activeCategories] }]));
}
function getStoreOperationalConfig(settings, storeId) {
  return settings[storeId] || { activeCategories: expenseCategories.map((item) => item.id), reviewEnabled: true, closeoutAlert: true, attachmentAlert: true };
}
function buildInitialStoreChannelSettings(savedSettings, storeList) {
  if (savedSettings?.storeChannelSettings) return savedSettings.storeChannelSettings;
  const legacyChannels = savedSettings?.configuredChannels || channels;
  const legacyActiveIds = savedSettings?.activeChannels || legacyChannels.filter((channel) => !channel.retired).map((channel) => channel.id);
  return Object.fromEntries(storeList.map((business) => [business.id, { channels: legacyChannels.map((channel) => ({ ...channel })), activeIds: [...legacyActiveIds] }]));
}
function getStoreChannelConfig(settings, storeId) {
  return settings[storeId] || { channels: channels.map((channel) => ({ ...channel })), activeIds: channels.map((channel) => channel.id) };
}
function nextDayIso(dateString) {
  const date = new Date(`${dateString}T12:00:00`);
  date.setDate(date.getDate() + 1);
  return isoCalendarDate(date.getFullYear(), date.getMonth(), date.getDate());
}
function QuickAddSheet({ lang, employee, open, onClose, onSummary, onExpense }) {
  if (!open) return null;
  const secondaryTitle = employee ? text(lang, "addPurchaseExpense") : text(lang, "addPaidByOwner");
  return (
    <AnimatePresence>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 z-[70] flex items-end bg-[#112A46]/45 sm:items-center sm:justify-center sm:p-6 lg:items-end lg:justify-start lg:p-0">
        <button onClick={onClose} className="absolute inset-0" aria-label={text(lang, "close")} />
        <motion.div initial={{ y: 18 }} animate={{ y: 0 }} exit={{ y: 18 }} className="relative z-10 w-full rounded-t-[30px] bg-[#F8F6F0] p-5 pb-8 sm:max-w-[560px] sm:rounded-[30px] sm:p-6 lg:max-w-none lg:rounded-t-[30px] lg:rounded-b-none lg:p-5 lg:pb-8">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold text-[#827762]">{text(lang, "addOutflow")}</p>
              <h3 className="text-base font-black text-[#112A46]">{lang === "ar" ? "إضافة عملية" : "Add entry"}</h3>
            </div>
            <button onClick={onClose} className="flex h-9 w-9 items-center justify-center rounded-xl bg-white ring-1 ring-black/[0.05]"><X className="h-4 w-4" /></button>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <button onClick={onSummary} className="flex min-h-[142px] flex-col items-start justify-between rounded-[24px] bg-[#112A46] p-4 text-start text-white">
              <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/10"><ReceiptText className="h-5 w-5" /></span>
              <span><strong className="block text-[12px] font-black leading-5">{employee ? text(lang, "enterDailySummary") : text(lang, "enterOwnerSummary")}</strong><small className="mt-1 block text-[9px] font-bold leading-4 text-white/65">{text(lang, "salesChannelsAndTotal")}</small></span>
            </button>
            <button onClick={onExpense} className="flex min-h-[142px] flex-col items-start justify-between rounded-[24px] bg-white p-4 text-start text-[#112A46] ring-1 ring-black/[0.055]">
              <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#FFF0CB] text-[#806528]"><Plus className="h-5 w-5" /></span>
              <span><strong className="block text-[12px] font-black leading-5">{secondaryTitle}</strong><small className="mt-1 block text-[9px] font-bold leading-4 text-[#827762]">{text(lang, "amountNoteOptionalPhoto")}</small></span>
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

function BottomNav({ lang, employee, active, onChange, onAdd = () => {} }) {
  const NavButton = ({ item }) => { const Icon = item.icon; return <button onClick={() => onChange(item.id)} className={`flex min-w-[64px] flex-col items-center gap-1 text-[10px] font-bold ${active === item.id ? "text-[#112A46]" : "text-[#A99D87]"}`}><Icon className="h-5 w-5" />{text(lang, item.key)}</button>; };
  if (employee) {
    const employeeItems = [{ id: "home", key: "home", icon: Home }, { id: "entries", key: "entries", icon: ReceiptText }, { id: "settings", key: "settings", icon: Settings }];
    return <nav className="taq-owner-nav relative z-30 grid h-[72px] w-full shrink-0 grid-cols-3 items-center border-t border-[#ECE6DA] bg-white/95 px-6 pb-[env(safe-area-inset-bottom,0px)]">{employeeItems.map((item) => <NavButton key={item.id} item={item} />)}</nav>;
  }
  const leftItems = [{ id: "home", key: "home", icon: Home }, { id: "reports", key: "reports", icon: FileText }];
  const rightItems = [{ id: "register", key: "register", icon: ReceiptText }, { id: "settings", key: "settings", icon: Settings }];
  return (
    <nav className="taq-owner-nav relative z-30 flex h-[72px] w-full shrink-0 items-center justify-between border-t border-[#ECE6DA] bg-white/95 px-4 pb-[env(safe-area-inset-bottom,0px)]">
      <div className="flex w-[128px] items-center justify-between">{leftItems.map((item) => <NavButton key={item.id} item={item} />)}</div>
      <button onClick={onAdd} aria-label={lang === "ar" ? "إضافة عملية" : "Add entry"} className="absolute left-1/2 top-1 flex h-[64px] w-[64px] -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border-[5px] border-[#F8F6F0] bg-[#E4B84A] text-[#112A46] shadow-sm"><Plus className="h-8 w-8" strokeWidth={2.4} /></button>
      <div className="w-[58px]" />
      <div className="flex w-[128px] items-center justify-between">{rightItems.map((item) => <NavButton key={item.id} item={item} />)}</div>
    </nav>
  );
}

export default function TaqfeelahPrototypeRuntime() {
  const [lang, setLang] = useState("ar");
  const [loggedIn, setLoggedIn] = useState(false);
  const [authScreen, setAuthScreen] = useState("owner");
  const [employee, setEmployee] = useState(false);
  const [loggedInEmployeeId, setLoggedInEmployeeId] = useState(null);
  const [closeoutAlerts, setCloseoutAlerts] = useState(() => readCloseoutAlerts());
  const [helpOpen, setHelpOpen] = useState(false);
  const [employeePage, setEmployeePage] = useState("home");
  const [ownerPage, setOwnerPage] = useState("home");
  const [selected, setSelected] = useState(null);
  const [voidTarget, setVoidTarget] = useState(null);
  const [restoreTarget, setRestoreTarget] = useState(null);
  const [savedOutflowShareTarget, setSavedOutflowShareTarget] = useState(null);
  const [saving, setSaving] = useState(false);
  const savingRef = useRef(false);
  const [pendingDuplicateSummary, setPendingDuplicateSummary] = useState(null);
  const [duplicateReviewFocus, setDuplicateReviewFocus] = useState(null);
  const [attachmentReviewRequest, setAttachmentReviewRequest] = useState(null);
  const [saved, setSaved] = useState(false);
  const [operationalEntries, setOperationalEntries] = useState(() => readOperationalEntries());
  const [acknowledgedDuplicateSales, setAcknowledgedDuplicateSales] = useState(() => readAcknowledgedDuplicateSales());
  const [notebookTheme, setNotebookTheme] = useState(() => { if (typeof window === "undefined") return "yellow"; return window.localStorage.getItem("taqfeelah_notebook_theme") || "yellow"; });
  const [selectedBusiness, setSelectedBusiness] = useState("all");
  const [shareSnapshot, setShareSnapshot] = useState(null);
  const [quickAddOpen, setQuickAddOpen] = useState(false);
  const [archivedReadOnlyBusinessId, setArchivedReadOnlyBusinessId] = useState(null);
  const initialSettings = readSavedSettings();
  const initialBusinesses = initialSettings?.configuredBusinesses || businesses;
  const [configuredBusinesses, setConfiguredBusinesses] = useState(initialBusinesses);
  const [archivedBusinessIds, setArchivedBusinessIds] = useState(initialSettings?.archivedBusinessIds || initialSettings?.archivedStores || []);
  const [staff, setStaff] = useState(initialSettings?.staff || [
    { id: "ahmed", nameAr: "أحمد", nameEn: "Ahmed", mobile: "050 123 4567", active: true, storeIds: ["shami"], pin: PROTOTYPE_EMPLOYEE_PIN_DEFAULT },
    { id: "sara", nameAr: "سارة", nameEn: "Sara", mobile: "055 987 6543", active: true, storeIds: ["arz"], pin: PROTOTYPE_EMPLOYEE_PIN_DEFAULT },
  ]);
  const [ownerProfile, setOwnerProfile] = useState(initialSettings?.ownerProfile || { name: "محمد الهاجري" });
  const currentOwnerActor = { ...ownerActor, nameAr: ownerProfile.name, nameEn: ownerProfile.name };
  const [storeChannelSettings, setStoreChannelSettings] = useState(() => buildInitialStoreChannelSettings(initialSettings, initialBusinesses));
  const [storeOperationalSettings, setStoreOperationalSettings] = useState(() => buildInitialStoreOperationalSettings(initialSettings, initialBusinesses));
  const [lastCloseoutDates, setLastCloseoutDates] = useState(() => {
    if (typeof window === "undefined") return readDemoLastCloseoutDates();
    try {
      const savedDates = JSON.parse(window.localStorage.getItem(LAST_CLOSEOUT_STORAGE_KEY) || "null");
      if (savedDates && typeof savedDates === "object" && Object.keys(savedDates).length > 0) return savedDates;
      const demoDates = readDemoLastCloseoutDates();
      window.localStorage.setItem(LAST_CLOSEOUT_STORAGE_KEY, JSON.stringify(demoDates));
      return demoDates;
    } catch { return readDemoLastCloseoutDates(); }
  });
  const [employeeBusinessId, setEmployeeBusinessId] = useState("shami");
  const activeBusinesses = configuredBusinesses.filter((business) => !archivedBusinessIds.includes(business.id));
  const reportingBusinesses = configuredBusinesses;
  const activeViewBusiness = activeBusinesses.length === 1 ? activeBusinesses[0].id : selectedBusiness === "all" || activeBusinesses.some((business) => business.id === selectedBusiness) ? selectedBusiness : "all";
  const activeEmployee = employee && loggedInEmployeeId
    ? staff.find((person) => person.id === loggedInEmployeeId && person.active && !person.removed) || null
    : null;
  const unseenCloseoutAlerts = closeoutAlerts.filter((alert) => !alert.seen);
  const assignedEmployeeBusinesses = activeBusinesses.filter((business) => (activeEmployee?.storeIds || []).includes(business.id));
  const currentEmployeeBusiness = assignedEmployeeBusinesses.find((business) => business.id === employeeBusinessId) || assignedEmployeeBusinesses[0] || null;
  const currentEmployeeChannelConfig = getStoreChannelConfig(storeChannelSettings, currentEmployeeBusiness?.id);
  const currentEmployeeOperationalConfig = getStoreOperationalConfig(storeOperationalSettings, currentEmployeeBusiness?.id);
  const currentEmployeeCategories = expenseCategories.filter((item) => currentEmployeeOperationalConfig.activeCategories.includes(item.id));
  const activeOwnerStoreId = activeViewBusiness === "all" ? activeBusinesses[0]?.id : activeViewBusiness;
  const reportSettingsStoreId = archivedReadOnlyBusinessId || activeOwnerStoreId;
  const reportChannelConfig = getStoreChannelConfig(storeChannelSettings, reportSettingsStoreId);
  const reviewEnabledForBusiness = (businessId) => getStoreOperationalConfig(storeOperationalSettings, businessId).reviewEnabled;
  const attachmentAlertEnabledForBusiness = (businessId) => { const config = getStoreOperationalConfig(storeOperationalSettings, businessId); return config.reviewEnabled && config.attachmentAlert; };
  const closeoutAlertEnabledForBusiness = (businessId) => getStoreOperationalConfig(storeOperationalSettings, businessId).closeoutAlert;
  const ownerReviewEnabled = activeViewBusiness === "all" ? activeBusinesses.some((business) => reviewEnabledForBusiness(business.id)) : reviewEnabledForBusiness(activeOwnerStoreId);
  const selectedOperationReviewEnabled = selected ? reviewEnabledForBusiness(selected.businessId) && !archivedBusinessIds.includes(selected.businessId) : ownerReviewEnabled;
  const duplicateSalesAlerts = useMemo(() => {
    const grouped = new Map();
    operationalEntries.filter((entry) => entry.type === "summary" && entryIsActive(entry) && activeBusinesses.some((business) => business.id === entry.businessId)).forEach((entry) => {
      const key = `${entry.businessId}|${entry.date}`;
      if (!grouped.has(key)) grouped.set(key, { businessId: entry.businessId, date: entry.date, entries: [] });
      grouped.get(key).entries.push(entry);
    });
    return [...grouped.values()].filter((group) => group.entries.length > 1 && acknowledgedDuplicateSales[duplicateSalesGroupKey(group)] !== duplicateSalesSignature(group.entries)).sort((a, b) => b.date.localeCompare(a.date));
  }, [operationalEntries, activeBusinesses, acknowledgedDuplicateSales]);
  const pendingAttachmentReviews = newestEntries(operationalEntries.filter((entry) => activeBusinesses.some((business) => business.id === entry.businessId) && entryIsActive(entry) && entryHasAttachment(entry) && !entry.reviewed && attachmentAlertEnabledForBusiness(entry.businessId)));
  const firstPendingAttachmentReview = pendingAttachmentReviews[0] || null;
  const ownerHasPendingReview = pendingAttachmentReviews.length > 0;
  useEffect(() => { if (typeof window !== "undefined") window.localStorage.setItem("taqfeelah_notebook_theme", notebookTheme); }, [notebookTheme]);
  useEffect(() => { if (typeof window !== "undefined") window.localStorage.setItem(OPERATIONAL_ENTRIES_STORAGE_KEY, JSON.stringify(stripEmbeddedAttachmentImages(operationalEntries))); }, [operationalEntries]);
  useEffect(() => { if (typeof window !== "undefined") window.localStorage.setItem(ACKNOWLEDGED_DUPLICATE_SALES_STORAGE_KEY, JSON.stringify(acknowledgedDuplicateSales)); }, [acknowledgedDuplicateSales]);
  useEffect(() => { if (typeof window !== "undefined") window.localStorage.setItem(LAST_CLOSEOUT_STORAGE_KEY, JSON.stringify(lastCloseoutDates)); }, [lastCloseoutDates]);
  useEffect(() => { writeCloseoutAlerts(closeoutAlerts); }, [closeoutAlerts]);
  useEffect(() => {
    setStoreChannelSettings((current) => {
      let changed = false;
      const next = { ...current };
      configuredBusinesses.forEach((business) => {
        if (!next[business.id]) {
          next[business.id] = { channels: channels.map((channel) => ({ ...channel })), activeIds: channels.map((channel) => channel.id) };
          changed = true;
        }
      });
      return changed ? next : current;
    });
    setStoreOperationalSettings((current) => {
      let changed = false;
      const next = { ...current };
      configuredBusinesses.forEach((business) => {
        if (!next[business.id]) {
          next[business.id] = getStoreOperationalConfig({}, business.id);
          changed = true;
        }
      });
      return changed ? next : current;
    });
  }, [configuredBusinesses]);
  useEffect(() => { if (selectedBusiness !== "all" && !configuredBusinesses.some((business) => business.id === selectedBusiness)) setSelectedBusiness("all"); }, [selectedBusiness, configuredBusinesses]);
  useEffect(() => { if (assignedEmployeeBusinesses.length > 0 && !assignedEmployeeBusinesses.some((business) => business.id === employeeBusinessId)) setEmployeeBusinessId(assignedEmployeeBusinesses[0].id); }, [employeeBusinessId, assignedEmployeeBusinesses]);
  const hasPreviousCloseout = Boolean(currentEmployeeBusiness && lastCloseoutDates[currentEmployeeBusiness.id]);
  const todayDate = todayIsoDate();
  const calculatedSuggestedEntryDate = hasPreviousCloseout ? nextDayIso(lastCloseoutDates[currentEmployeeBusiness.id]) : todayDate;
  const suggestedEntryDate = calculatedSuggestedEntryDate > todayDate ? todayDate : calculatedSuggestedEntryDate;
  const pushCloseoutAlert = (payload, entry, actor) => {
    if (!closeoutAlertEnabledForBusiness(payload.businessId)) return;
    setCloseoutAlerts((current) => [{
      id: `co-${entry.id}`,
      businessId: payload.businessId,
      date: payload.date,
      entryId: entry.id,
      employeeNameAr: actor.nameAr,
      employeeNameEn: actor.nameEn,
      seen: false,
      at: Date.now(),
    }, ...current.filter((item) => item.id !== `co-${entry.id}`)]);
  };
  const persistEmployeeEntry = async (payload) => {
    if (savingRef.current || !payload?.businessId || !activeEmployee || !assignedEmployeeBusinesses.some((business) => business.id === payload.businessId)) return;
    if (payload.date > todayIsoDate()) { window.alert(text(lang, "futureDateNotAllowed")); return; }
    savingRef.current = true; setSaving(true);
    try {
      const actor = { role: "employee", userId: activeEmployee.id, nameAr: activeEmployee.nameAr, nameEn: activeEmployee.nameEn };
      const entry = buildEntry(payload, actor);
      if (entry.attachment) {
        try { await storeAttachmentPayload(entry.attachment); }
        catch { window.alert(text(lang, "attachmentSaveFailed")); return; }
      }
      setOperationalEntries((current) => [entry, ...current]);
      if (payload.type === "summary") {
        setLastCloseoutDates((current) => ({ ...current, [payload.businessId]: !current[payload.businessId] || payload.date > current[payload.businessId] ? payload.date : current[payload.businessId] }));
        pushCloseoutAlert(payload, entry, actor);
      }
      setEmployeePage("home"); setSaved(true); window.setTimeout(() => setSaved(false), 2200);
    } finally { savingRef.current = false; setSaving(false); }
  };
  const saveEmployee = async (payload) => {
    if (savingRef.current || !payload?.businessId || !activeEmployee || !assignedEmployeeBusinesses.some((business) => business.id === payload.businessId)) return;
    if (payload.type === "summary") {
      const previousEntries = operationalEntries.filter((entry) => entry.type === "summary" && entryIsActive(entry) && entry.businessId === payload.businessId && entry.date === payload.date);
      if (previousEntries.length > 0) { setPendingDuplicateSummary({ payload, previousEntries }); return; }
    }
    await persistEmployeeEntry(payload);
  };
  const saveOwner = async (payload) => {
    if (savingRef.current || !payload?.businessId || !activeBusinesses.some((business) => business.id === payload.businessId)) return;
    if (payload.date > todayIsoDate()) { window.alert(text(lang, "futureDateNotAllowed")); return; }
    savingRef.current = true; setSaving(true);
    try {
      const entry = buildEntry(payload, currentOwnerActor);
      if (entry.attachment) {
        try { await storeAttachmentPayload(entry.attachment); }
        catch { window.alert(text(lang, "attachmentSaveFailed")); return; }
      }
      setOperationalEntries((current) => [entry, ...current]);
      if (payload.type === "summary") setLastCloseoutDates((current) => ({ ...current, [payload.businessId]: !current[payload.businessId] || payload.date > current[payload.businessId] ? payload.date : current[payload.businessId] }));
      setOwnerPage("home");
      if (payload.type !== "summary") setSavedOutflowShareTarget(entry);
      else { setSaved(true); window.setTimeout(() => setSaved(false), 2200); }
    } finally { savingRef.current = false; setSaving(false); }
  };
  const saveOwnerSummary = async (payload) => {
    if (savingRef.current || !payload?.businessId) return;
    const previousEntries = operationalEntries.filter((entry) => entry.type === "summary" && entryIsActive(entry) && entry.businessId === payload.businessId && entry.date === payload.date);
    if (previousEntries.length > 0) { setPendingDuplicateSummary({ payload, previousEntries, actor: "owner" }); return; }
    await saveOwner(payload);
  };
  const confirmReview = (entryId) => {
    const actionAt = new Date().toISOString();
    setOperationalEntries((current) => current.map((entry) => entry.id === entryId && entryIsActive(entry) ? { ...entry, reviewed: true, reviewedAt: actionAt, reviewedBy: currentOwnerActor, auditTrail: [...(entry.auditTrail || []), { action: "reviewed", at: actionAt, by: currentOwnerActor, reason: "" }] } : entry));
    setSelected(null);
  };
  const requestVoidOperation = (entryId) => {
    const target = operationalEntries.find((entry) => entry.id === entryId);
    if (!target || entryIsVoided(target) || archivedBusinessIds.includes(target.businessId)) return;
    setVoidTarget(target);
  };
  const requestRestoreOperation = (entryId) => {
    const target = operationalEntries.find((entry) => entry.id === entryId);
    if (!target || !entryIsVoided(target) || archivedBusinessIds.includes(target.businessId)) return;
    setRestoreTarget(target);
  };
  const confirmDuplicateSummary = async () => {
    const pending = pendingDuplicateSummary;
    if (!pending?.payload) return;
    setPendingDuplicateSummary(null);
    if (pending.actor === "owner") await saveOwner(pending.payload);
    else await persistEmployeeEntry(pending.payload);
  };
  const reviewDuplicateSales = (alert) => {
    if (!alert?.businessId || !alert?.date) return;
    setArchivedReadOnlyBusinessId(null);
    setSelectedBusiness(alert.businessId);
    setDuplicateReviewFocus({ businessId: alert.businessId, date: alert.date, openedAt: Date.now() });
    setOwnerPage("register");
  };
  const acknowledgeDuplicateSales = (alert) => {
    if (!alert?.businessId || !alert?.date || !alert.entries?.length) return;
    const actionAt = new Date().toISOString();
    const approvedIds = new Set(alert.entries.map((entry) => entry.id));
    setOperationalEntries((current) => current.map((entry) => approvedIds.has(entry.id) ? { ...entry, auditTrail: [...(entry.auditTrail || []), { action: "duplicate_approved", at: actionAt, by: currentOwnerActor, reason: "" }] } : entry));
    setAcknowledgedDuplicateSales((current) => ({ ...current, [duplicateSalesGroupKey(alert)]: duplicateSalesSignature(alert.entries) }));
  };
  const confirmVoidOperation = (reason = "") => {
    const target = voidTarget;
    if (!target || entryIsVoided(target) || archivedBusinessIds.includes(target.businessId)) { setVoidTarget(null); return; }
    const actionAt = new Date().toISOString();
    const nextEntries = operationalEntries.map((entry) => entry.id === target.id ? { ...entry, status: "voided", voidedAt: actionAt, voidedBy: currentOwnerActor, voidReason: reason.trim(), auditTrail: [...(entry.auditTrail || []), { action: "voided", at: actionAt, by: currentOwnerActor, reason: reason.trim() }] } : entry);
    setOperationalEntries(nextEntries);
    if (target.type === "summary") {
      const latestActiveCloseoutDate = nextEntries.filter((entry) => entry.businessId === target.businessId && entry.type === "summary" && entryIsActive(entry)).map((entry) => entry.date).sort().pop();
      setLastCloseoutDates((current) => { const next = { ...current }; if (latestActiveCloseoutDate) next[target.businessId] = latestActiveCloseoutDate; else delete next[target.businessId]; return next; });
    }
    setVoidTarget(null);
    setSelected(null);
  };
  const confirmRestoreOperation = (reason = "") => {
    const target = restoreTarget;
    if (!target || !entryIsVoided(target) || archivedBusinessIds.includes(target.businessId)) { setRestoreTarget(null); return; }
    const actionAt = new Date().toISOString();
    const nextEntries = operationalEntries.map((entry) => entry.id === target.id ? { ...entry, status: "active", restoredAt: actionAt, restoredBy: currentOwnerActor, restoreReason: reason.trim(), auditTrail: [...(entry.auditTrail || []), { action: "restored", at: actionAt, by: currentOwnerActor, reason: reason.trim() }] } : entry);
    setOperationalEntries(nextEntries);
    if (target.type === "summary") {
      const latestActiveCloseoutDate = nextEntries.filter((entry) => entry.businessId === target.businessId && entry.type === "summary" && entryIsActive(entry)).map((entry) => entry.date).sort().pop();
      setLastCloseoutDates((current) => ({ ...current, [target.businessId]: latestActiveCloseoutDate || target.date }));
    }
    setRestoreTarget(null);
    setSelected(null);
  };
  const completeOwnerLogin = () => { setLoggedIn(true); setEmployee(false); setLoggedInEmployeeId(null); setAuthScreen("owner"); setOwnerPage("home"); };
  const completeEmployeeLogin = (personId) => {
    const person = staff.find((item) => item.id === personId && item.active && !item.removed);
    if (!person) return;
    setLoggedIn(true);
    setEmployee(true);
    setLoggedInEmployeeId(person.id);
    setEmployeeBusinessId(person.storeIds?.[0] || "shami");
    setEmployeePage("home");
    setAuthScreen("owner");
  };
  const reviewCloseoutAlert = (alert) => {
    if (!alert?.businessId || !alert?.date) return;
    setArchivedReadOnlyBusinessId(null);
    setSelectedBusiness(alert.businessId);
    setOwnerPage("register");
    if (alert.entryId) setSelected(operationalEntries.find((entry) => entry.id === alert.entryId) || null);
    setCloseoutAlerts((current) => current.map((item) => item.id === alert.id ? { ...item, seen: true } : item));
  };
  const dismissCloseoutAlert = (alertId) => {
    setCloseoutAlerts((current) => current.map((item) => item.id === alertId ? { ...item, seen: true } : item));
  };
  const logout = () => {
    setLoggedIn(false);
    setEmployee(false);
    setLoggedInEmployeeId(null);
    setAuthScreen("owner");
    setEmployeePage("home");
    setOwnerPage("home");
    setSelected(null);
    setVoidTarget(null);
    setRestoreTarget(null);
    setSavedOutflowShareTarget(null);
    setPendingDuplicateSummary(null);
    setDuplicateReviewFocus(null);
    setAttachmentReviewRequest(null);
    setShareSnapshot(null);
    setQuickAddOpen(false);
    setArchivedReadOnlyBusinessId(null);
    setSelectedBusiness("all");
  };
  if (!loggedIn) {
    return (
      <div dir={lang === "ar" ? "rtl" : "ltr"} className="min-h-[100dvh] bg-[#F8F6F0] font-sans text-[#112A46]">
        <AppFontStyles />
        {authScreen === "owner" ? (
          <LoginScreen lang={lang} setLang={setLang} onOwnerLogin={completeOwnerLogin} onEmployeePortal={() => setAuthScreen("employee")} />
        ) : (
          <EmployeeLoginScreen lang={lang} setLang={setLang} staff={staff} onBack={() => setAuthScreen("owner")} onLogin={completeEmployeeLogin} />
        )}
      </div>
    );
  }
  return (
    <div dir={lang === "ar" ? "rtl" : "ltr"} className="min-h-[100dvh] bg-[#F8F6F0] font-sans text-[#112A46]">
      <AppFontStyles />
      <main className="taq-shell relative flex min-h-[100dvh] w-full flex-col overflow-hidden bg-[#F8F6F0]">
        <div className="taq-screen relative grid h-[100dvh] max-h-[100dvh] grid-rows-[auto_1fr_auto] overflow-hidden bg-[#F8F6F0] pt-5">
          <TopBar lang={lang} setLang={setLang} employee={employee} notebookMode={!employee && (ownerPage === "home" || ownerPage === "reports")} onLogout={logout} onNotifications={() => { setArchivedReadOnlyBusinessId(null); if (duplicateSalesAlerts.length > 0) { setAttachmentReviewRequest(null); reviewDuplicateSales(duplicateSalesAlerts[0]); } else if (firstPendingAttachmentReview) { setDuplicateReviewFocus(null); setAttachmentReviewRequest({ businessId: firstPendingAttachmentReview.businessId, date: firstPendingAttachmentReview.date, entryId: firstPendingAttachmentReview.id, openedAt: Date.now() }); setOwnerPage("register"); } else if (unseenCloseoutAlerts[0]) { reviewCloseoutAlert(unseenCloseoutAlerts[0]); } }} reviewEnabled={ownerHasPendingReview || duplicateSalesAlerts.length > 0 || unseenCloseoutAlerts.length > 0}
          />
          <div className="taq-scroll relative min-h-0 overflow-y-auto overscroll-y-contain">{employee && !activeEmployee && <section className="px-5 pb-24"><div className="rounded-3xl bg-white p-8 text-center text-sm font-bold text-[#827762] ring-1 ring-black/[0.045]">{text(lang, "noActiveEmployee")}</div></section>}{employee && activeEmployee && employeePage === "home" && <EmployeeHome lang={lang} currentStore={currentEmployeeBusiness} assignedStores={assignedEmployeeBusinesses} onSelectStore={setEmployeeBusinessId} activeEmployeeId={activeEmployee?.id} operationalEntries={operationalEntries} onSummary={() => setEmployeePage("summary")} onExpense={() => setEmployeePage("expense")} onViewAll={() => setEmployeePage("entries")} />}{employee && activeEmployee && employeePage === "summary" && <SummaryScreen lang={lang} saving={saving} currentStore={currentEmployeeBusiness} assignedStores={assignedEmployeeBusinesses} onSelectStore={setEmployeeBusinessId} salesChannels={currentEmployeeChannelConfig.channels.filter((channel) => currentEmployeeChannelConfig.activeIds.includes(channel.id) && !channel.retired)} suggestedDate={suggestedEntryDate} showDateSuggestion={hasPreviousCloseout} onBack={() => setEmployeePage("home")} onSave={saveEmployee} />}{employee && activeEmployee && employeePage === "entries" && <EmployeeEntriesScreen lang={lang} currentStore={currentEmployeeBusiness} assignedStores={assignedEmployeeBusinesses} onSelectStore={setEmployeeBusinessId} activeEmployeeId={activeEmployee?.id} reviewEnabled={currentEmployeeOperationalConfig.reviewEnabled} operationalEntries={operationalEntries} />}{employee && activeEmployee && employeePage === "expense" && <ExpenseScreen lang={lang} saving={saving} currentStore={currentEmployeeBusiness} assignedStores={assignedEmployeeBusinesses} onSelectStore={setEmployeeBusinessId} activeCategories={currentEmployeeCategories} initialDate={todayDate} onBack={() => setEmployeePage("home")} onSave={saveEmployee} />}{employee && activeEmployee && employeePage === "settings" && <EmployeeSettingsScreen lang={lang} currentStore={currentEmployeeBusiness} assignedStores={assignedEmployeeBusinesses} onSelectStore={setEmployeeBusinessId} employeeName={lang === "ar" ? activeEmployee.nameAr : activeEmployee.nameEn} onLogout={logout} onOpenSupport={() => openWhatsAppSupport(lang)} onOpenHelp={() => setHelpOpen(true)} />}{!employee && ownerPage === "home" && <NotebookScrollSurface theme={notebookTheme} lang={lang}><OwnerHome lang={lang} operationalEntries={operationalEntries} duplicateSalesAlerts={duplicateSalesAlerts} closeoutAlerts={unseenCloseoutAlerts} onReviewCloseout={reviewCloseoutAlert} onDismissCloseout={dismissCloseoutAlert} onReviewDuplicate={reviewDuplicateSales} onAcknowledgeDuplicate={acknowledgeDuplicateSales} reviewEnabledForBusiness={reviewEnabledForBusiness} onOpenOperation={setSelected} onAddExpense={() => setOwnerPage("add-expense")} onAddSummary={() => setOwnerPage("add-summary")} onShareNotebook={setShareSnapshot} notebookTheme={notebookTheme} setNotebookTheme={setNotebookTheme} selectedBusiness={activeViewBusiness} setSelectedBusiness={setSelectedBusiness} reviewEnabled={ownerReviewEnabled} businessesList={activeBusinesses} /></NotebookScrollSurface>}{!employee && ownerPage === "add-summary" && <OwnerSummaryScreen lang={lang} saving={saving} selectedBusiness={activeViewBusiness} businessesList={activeBusinesses} storeChannelSettings={storeChannelSettings} onBack={() => setOwnerPage("home")} onSave={saveOwnerSummary} />}{!employee && ownerPage === "add-expense" && <OwnerExpenseScreen lang={lang} saving={saving} selectedBusiness={activeViewBusiness} businessesList={activeBusinesses} storeOperationalSettings={storeOperationalSettings} onBack={() => setOwnerPage("home")} onSave={saveOwner} />}{!employee && ownerPage === "reports" && <NotebookScrollSurface theme={notebookTheme} lang={lang}><ReportsScreen lang={lang} operationalEntries={operationalEntries} archivedReadOnlyBusinessId={archivedReadOnlyBusinessId} reviewEnabledForBusiness={reviewEnabledForBusiness} onShareNotebook={setShareSnapshot} notebookTheme={notebookTheme} setNotebookTheme={setNotebookTheme} selectedBusiness={selectedBusiness} setSelectedBusiness={setSelectedBusiness} configuredChannels={reportChannelConfig.channels} reviewEnabled={ownerReviewEnabled} businessesList={reportingBusinesses} archivedBusinessIds={archivedBusinessIds} /></NotebookScrollSurface>}{!employee && ownerPage === "register" && <OwnerRegisterScreen lang={lang} onOpenOperation={setSelected} reviewFocus={duplicateReviewFocus} attachmentReviewRequest={attachmentReviewRequest} archivedReadOnlyBusinessId={archivedReadOnlyBusinessId} operationalEntries={operationalEntries} selectedBusiness={selectedBusiness} setSelectedBusiness={setSelectedBusiness} businessesList={reportingBusinesses} archivedBusinessIds={archivedBusinessIds} />}{!employee && ownerPage === "settings" && <OwnerSettingsScreen lang={lang} operationalEntries={operationalEntries} selectedBusiness={selectedBusiness} setSelectedBusiness={setSelectedBusiness} setOwnerPage={setOwnerPage} setArchivedReadOnlyBusinessId={setArchivedReadOnlyBusinessId} setLastCloseoutDates={setLastCloseoutDates} notebookTheme={notebookTheme} setNotebookTheme={setNotebookTheme} storeChannelSettings={storeChannelSettings} setStoreChannelSettings={setStoreChannelSettings} storeOperationalSettings={storeOperationalSettings} setStoreOperationalSettings={setStoreOperationalSettings} configuredBusinesses={configuredBusinesses} setConfiguredBusinesses={setConfiguredBusinesses} archivedBusinessIds={archivedBusinessIds} setArchivedBusinessIds={setArchivedBusinessIds} staff={staff} setStaff={setStaff} ownerProfile={ownerProfile} setOwnerProfile={setOwnerProfile} onLogout={logout} onOpenSupport={() => openWhatsAppSupport(lang)} onOpenHelp={() => setHelpOpen(true)} />}{saved && <div className="sticky bottom-4 left-4 right-4 z-30 mx-auto max-w-md rounded-2xl bg-[#112A46] p-4 text-xs font-bold text-white">{text(lang, "savedNotice")}</div>}
          </div>
          <BottomNav lang={lang} employee={employee} active={employee ? employeePage : ownerPage} onAdd={() => setQuickAddOpen(true)} onChange={(page) => { setQuickAddOpen(false); if (employee) setEmployeePage(page); else { setArchivedReadOnlyBusinessId(null); setDuplicateReviewFocus(null); setAttachmentReviewRequest(null); setSelectedBusiness("all"); setOwnerPage(page); } }} />{!employee && <QuickAddSheet lang={lang} employee={false} open={quickAddOpen} onClose={() => setQuickAddOpen(false)} onSummary={() => { setQuickAddOpen(false); setOwnerPage("add-summary"); }} onExpense={() => { setQuickAddOpen(false); setOwnerPage("add-expense"); }} />}<OperationModal lang={lang} item={selected} onClose={() => setSelected(null)} onReview={confirmReview} onVoid={requestVoidOperation} onRestore={requestRestoreOperation} reviewEnabled={selectedOperationReviewEnabled} canVoid={Boolean(selected) && !archivedBusinessIds.includes(selected?.businessId)} canRestore={Boolean(selected) && !archivedBusinessIds.includes(selected?.businessId)} /><DuplicateSalesDialog lang={lang} draft={pendingDuplicateSummary?.payload || null} previousEntries={pendingDuplicateSummary?.previousEntries || []} businessesList={activeBusinesses} onCancel={() => setPendingDuplicateSummary(null)} onConfirm={confirmDuplicateSummary} /><VoidOperationDialog lang={lang} item={voidTarget} onCancel={() => setVoidTarget(null)} onConfirm={confirmVoidOperation} /><RestoreOperationDialog lang={lang} item={restoreTarget} onCancel={() => setRestoreTarget(null)} onConfirm={confirmRestoreOperation} /><SavedOutflowShareDialog lang={lang} item={savedOutflowShareTarget} businessesList={activeBusinesses} onClose={() => setSavedOutflowShareTarget(null)} /><NotebookShareModal lang={lang} snapshot={shareSnapshot} onClose={() => setShareSnapshot(null)} businessesList={reportingBusinesses} operationalEntries={operationalEntries} archivedBusinessIds={archivedBusinessIds} />
          <HelpCenterSheet lang={lang} open={helpOpen} onClose={() => setHelpOpen(false)} />
        </div>
      </main>
    </div>
  );
}

