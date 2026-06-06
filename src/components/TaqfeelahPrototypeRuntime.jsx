"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { PROTOTYPE_BUILD_STAMP } from "@/prototype-build-stamp.mjs";
import { DailyCloseoutsProvider, useDailyCloseouts } from "@/features/daily-closeouts/DailyCloseoutsProvider";
import { buildOperationalEntriesFromCloseout } from "@/features/daily-closeouts/daily-closeouts-demo-store";
import { autoResolveSubmittedCloseoutsWithoutReview, readDailyCloseouts } from "@/features/daily-closeouts/daily-closeouts-demo-store";
import { readCloseoutEvents } from "@/features/daily-closeouts/daily-closeouts-demo-store";
import { applyNotebookThemeCssVariables, notebookCardBackground, notebookLinesBackground, notebookThemes, resolveNotebookTheme } from "@/features/daily-closeouts/notebook-themes";
import { shareImageThroughWhatsApp } from "@/features/daily-closeouts/notebook-image-sharing";
import EmployeeCloseoutsView from "@/features/employee-closeouts/EmployeeCloseoutsView";
import DailyCloseoutEntryFlow from "@/features/employee-closeouts/DailyCloseoutEntryFlow";
import EmployeeHistoryVisibilityPicker from "@/features/employee-closeouts/EmployeeHistoryVisibilityPicker";
import { employeeHistoryVisibilityLabel } from "@/features/employee-closeouts/employee-closeout-history";
import EmployeeFooterNav from "@/features/employee-closeouts/EmployeeFooterNav";
import { readEmployeeNotebookTheme, writeEmployeeNotebookTheme } from "@/features/employee-closeouts/employee-theme-storage";
import PendingCloseoutsNotice from "@/features/owner-closeout-review/PendingCloseoutsNotice";
import OwnerCloseoutReviewPanel from "@/features/owner-closeout-review/OwnerCloseoutReviewPanel";
import ReturnCloseoutModal from "@/features/owner-closeout-review/ReturnCloseoutModal";
import NotebookScrollSurface from "@/features/daily-closeouts/NotebookScrollSurface";
import LanHintBanner from "@/features/demo/LanHintBanner";
import { clearAuthSession, clearEmployeeCredentials, clearOwnerCredentials, readEmployeeCredentials, readOwnerCredentials, resolveAuthStateFromSession, saveAuthSession, saveEmployeeCredentials, saveOwnerCredentials } from "@/features/demo/login-credentials-storage";
import { readLocalStorageJson } from "@/features/demo/prototype-storage";
import AttachmentLightbox from "./AttachmentLightbox";
import {
  createPrototypeMonthDemoOperationalEntries,
  PROTOTYPE_DEMO_LAST_CLOSEOUT_KEY,
  PROTOTYPE_DEMO_OPERATIONAL_ENTRIES_KEY,
} from "@/features/demo/prototype-month-demo-seed";
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
import { getEnabledOwnerLoginMethods, isOwnerLoginMethodEnabled } from "@/core/auth/owner-login-methods";
import { buildRuntimeApiIdMaps } from "@/core/client/runtime-api-id-maps";
import {
  diagnoseCloseoutSubmitFailure,
  fetchStoreCloseoutsViaApi,
  hasCloseoutApiActorMapping,
  hasCloseoutApiStoreMapping,
  isUuid,
  reviewCloseoutViaApi,
  setRuntimeApiIdMaps,
  submitCloseoutViaApi,
} from "@/features/closeouts/client/closeouts-api-client";
import { formatCloseoutDayLabel } from "@/features/closeouts/client/closeout-day-label";
import {
  buildRegisterCloseoutDayContext,
  filterSummaryChannelRows,
  summaryEntryDisplayAmount,
  summarySalesChannelLabel as buildSummarySalesChannelLabel,
} from "@/features/entries/client/register-operation-display";
import {
  createStoreEntryViaApi,
  fetchStoreEntriesViaApi,
  restoreStoreEntryViaApi,
  reviewStoreEntryViaApi,
  voidStoreEntryViaApi,
} from "@/features/entries/client/store-entries-api-client";
import {
  acknowledgeDuplicateSummariesViaApi,
  approveDuplicateSummaryViaApi,
} from "@/features/phase9/client/phase9-api-client";
import { useNotebookExportShareData } from "@/features/phase9/client/use-notebook-export-share-data";
import { resolvePayloadAttachmentForPhase9Api } from "@/features/phase9/client/inline-attachment-api-flow";
import {
  fetchEmployeeLoginRosterViaApi,
  getSessionStatusViaApi,
  loginEmployeeSessionViaApi,
  loginOwnerSessionViaApi,
  logoutSessionViaApi,
} from "@/features/runtime-settings/client/runtime-session-and-settings-api-client";
import {
  applyRuntimeSettingsSnapshotPatch,
  buildRuntimeSettingsSnapshot,
  readOwnerSettingsApiAuth,
  usesRuntimeSettingsApi,
} from "@/features/runtime-settings/client/runtime-settings-bridge";
import { useRuntimeSettingsFromApi } from "@/features/runtime-settings/client/use-runtime-settings-from-api";
import { isProductionAppMode } from "@/core/config/app-mode";
import { isCloseoutsApiDbSourceMode, isCloseoutsApiStrictMode } from "@/core/config/closeouts-api-mode";
import { isEntriesApiDbSourceMode, isEntriesApiStrictMode } from "@/core/config/entries-api-mode";
import { isRegisterEntriesPaginationEnabled } from "@/core/config/register-entries-pagination-mode";
import { isOrgConfigApiEnabled } from "@/core/config/org-config-api-mode";
import { useRegisterEntriesFromApi } from "@/features/entries/client/use-register-entries-from-api";
import { useStoreDaySummaries } from "@/features/reports/client/use-store-day-summaries";
import { useStoreReports } from "@/features/reports/client/use-store-reports";
import { useOrgConfigRuntimeBridge } from "@/features/org-config/client/org-config-runtime-bridge";
import {
  buildInitialStoreOperationalSettings,
  buildStoreOperationalPolicy,
  getStoreOperationalConfig,
} from "@/features/org-config/client/store-operational-config";
import {
  entriesInPeriod,
  summarizeEntries,
  summaryMonthFromEntries,
} from "@/features/operations/operational-analytics";
import { isPrototypeAccessMode } from "@/core/config/prototype-access-mode";
import PrototypeAccessScreen from "@/features/demo/PrototypeAccessScreen";

function AppFontStyles() {
  return (
    <style>{`@import url('https://fonts.googleapis.com/css2?family=Aref+Ruqaa:wght@700&family=Caveat:wght@700&family=Noto+Sans:wght@400;500;600;700;800&family=Noto+Sans+Arabic:wght@400;500;600;700;800&display=swap');
      .taq-notch { display: none !important; }
      .taq-shell { width: 100% !important; max-width: none !important; min-height: 100dvh !important; border: none !important; border-radius: 0 !important; box-shadow: none !important; }
      .taq-screen { height: 100dvh !important; max-height: 100dvh !important; min-height: 100dvh !important; display: grid !important; grid-template-rows: auto 1fr auto !important; overflow: hidden !important; }
      .taq-scroll { min-height: 0 !important; -webkit-overflow-scrolling: touch; }
      .taq-owner-nav { position: relative !important; bottom: auto !important; left: auto !important; right: auto !important; transform: none !important; width: 100% !important; max-width: none !important; border-radius: 0 !important; box-shadow: none !important; }
      .taq-notebook-surface .taq-notebook-content {
        box-sizing: border-box;
        padding-inline-start: calc(2rem + 1.25px + 14px);
        padding-inline-end: 14px;
        max-width: 100%;
      }
      .taq-notebook-surface .taq-owner-page.taq-notebook-body {
        width: 100%;
        max-width: none;
        margin-inline: 0;
        padding-inline: 0 !important;
      }
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
    shareImagePasteHint: "تم فتح واتساب بالنص، والصورة منسوخة — الصق الصورة في نفس المحادثة.",
    shareImageWhatsAppPick: "اختر واتساب من قائمة المشاركة لإرسال الصورة.",
    shareImageWhatsAppUnavailable: "تم فتح واتساب بالنص، لكن تعذر نسخ الصورة تلقائيًا — أرفقها يدويًا من المعرض.",
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
    registerPeriodSummary: "ملخص الفترة",
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
    futureLoginOnLoginScreen: "تجريبي الآن: owner / demo123. طرق الواتساب/الإيميل جاهزة برمجيًا وتُفعّل لاحقًا.",
    loginWithPhone: "جوال + رمز",
    loginWithPassword: "مستخدم وكلمة مرور",
    username: "اسم المستخدم",
    password: "كلمة المرور",
    rememberMe: "تذكرني",
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
    applyFilters: "تطبيق",
    resetFilters: "إعادة تعيين",
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
    shareImagePasteHint: "WhatsApp opened with text, and the image was copied — paste it in the same chat.",
    shareImageWhatsAppPick: "Choose WhatsApp from the share menu to send the image.",
    shareImageWhatsAppUnavailable: "WhatsApp opened with text, but image copy is unavailable — attach it manually from gallery.",
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
    registerPeriodSummary: "Period summary",
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
    futureLoginOnLoginScreen: "Demo now: owner / demo123. WhatsApp/email methods are code-ready and can be enabled later.",
    loginWithPhone: "Mobile + code",
    loginWithPassword: "Username & password",
    username: "Username",
    password: "Password",
    rememberMe: "Remember me",
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
    applyFilters: "Apply",
    resetFilters: "Reset",
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
const APP_IN_PRODUCTION_MODE = isProductionAppMode();
const PROTOTYPE_ACCESS_MODE = isPrototypeAccessMode();
const BINDS_TO_SERVER_AUTH = APP_IN_PRODUCTION_MODE && !PROTOTYPE_ACCESS_MODE;
const ENTRIES_API_DB_SOURCE = isEntriesApiDbSourceMode();
const REGISTER_ENTRIES_PAGINATION_ENABLED = isRegisterEntriesPaginationEnabled();
const OPERATIONAL_ENTRIES_WORKING_DAYS = 30;
const OPERATIONAL_ENTRIES_WORKING_LIMIT = 300;
const CLOSEOUTS_API_DB_SOURCE = isCloseoutsApiDbSourceMode();
const RUNTIME_SETTINGS_DB_SOURCE = ENTRIES_API_DB_SOURCE;
const ORG_CONFIG_API_ENABLED = isOrgConfigApiEnabled();

const PROTOTYPE_SUPPORT_WHATSAPP = "966501234567";
const PROTOTYPE_DEMO_OTP = process.env.NEXT_PUBLIC_DEMO_OTP || (APP_IN_PRODUCTION_MODE ? "" : "1234");
const PROTOTYPE_OWNER_USERNAME = (
  process.env.NEXT_PUBLIC_DEMO_OWNER_USERNAME || (APP_IN_PRODUCTION_MODE ? "hajri" : "owner")
).trim().toLowerCase();
const PROTOTYPE_OWNER_PASSWORD = process.env.NEXT_PUBLIC_DEMO_OWNER_PASSWORD || (APP_IN_PRODUCTION_MODE ? "" : "demo123");
const PROTOTYPE_EMPLOYEE_PIN_DEFAULT = process.env.NEXT_PUBLIC_DEMO_EMPLOYEE_PIN_DEFAULT || (APP_IN_PRODUCTION_MODE ? "" : "1234");
const CLOSEOUT_ALERTS_STORAGE_KEY = "taqfeelah_closeout_alerts_v1";
const OPERATIONAL_ENTRIES_STORAGE_KEY = PROTOTYPE_DEMO_OPERATIONAL_ENTRIES_KEY;
const ACKNOWLEDGED_DUPLICATE_SALES_STORAGE_KEY = "taqfeelah_acknowledged_duplicate_sales_v1";
const LAST_CLOSEOUT_STORAGE_KEY = PROTOTYPE_DEMO_LAST_CLOSEOUT_KEY;
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
const noteLabel = (entry, lang) => {
  if (entry.type === "summary") return summarySalesChannelLabel(entry, lang);
  if (entry.noteKey) return text(lang, entry.noteKey);
  return entry.note || text(lang, entry.type);
};
const entryCategory = (entry) => entry.type === "purchases" ? "purchases" : entry.type === "withdrawal" ? "withdrawal" : (entry.categoryId || "other");
function resolveSummaryChannelName(row, lang) {
  const fallback = channels.find((channel) => channel.id === row.channelId);
  return row.name || (fallback ? channelName(fallback, lang) : row.channelId);
}
function summarySalesChannelLabel(entry, lang, salesChannelFilter = "all") {
  return buildSummarySalesChannelLabel(
    entry,
    (row) => resolveSummaryChannelName(row, lang),
    salesChannelFilter,
    text(lang, "summary"),
  );
}
const operationDisplayLabel = (entry, lang, salesChannelFilter = "all") => {
  if (entry.type === "expense") return text(lang, expenseCategories.find((item) => item.id === entryCategory(entry))?.label || "other");
  if (entry.type === "summary") return summarySalesChannelLabel(entry, lang, salesChannelFilter);
  return text(lang, entry.type);
};
function expandRegisterCloseoutOperationRows(item, lang, salesChannelFilter = "all") {
  if (item.type !== "summary") {
    return [{ key: item.id, item, label: operationDisplayLabel(item, lang, salesChannelFilter), amount: signedEntryAmount(item), isSale: false }];
  }
  const rows = filterSummaryChannelRows(item, salesChannelFilter);
  if (!rows.length) {
    return [{ key: item.id, item, label: summarySalesChannelLabel(item, lang, salesChannelFilter), amount: summaryEntryDisplayAmount(item, salesChannelFilter), isSale: true }];
  }
  return rows.map((row, index) => {
    const fallback = channels.find((channel) => channel.id === row.channelId);
    const label = row.name || (fallback ? channelName(fallback, lang) : row.channelId);
    return { key: `${item.id}-${row.channelId}-${index}`, item, label, amount: Number(row.amount), isSale: true };
  });
}
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
  return createPrototypeMonthDemoOperationalEntries();
}
function readOperationalEntries() {
  if (typeof window === "undefined") return BINDS_TO_SERVER_AUTH || ENTRIES_API_DB_SOURCE ? [] : createDemoOperationalEntries();
  const stored = readLocalStorageJson(OPERATIONAL_ENTRIES_STORAGE_KEY, null);
  if (!Array.isArray(stored) || stored.length === 0) return BINDS_TO_SERVER_AUTH || ENTRIES_API_DB_SOURCE ? [] : createDemoOperationalEntries();
  return stored.map((entry) => ({
    ...entry,
    auditTrail: Array.isArray(entry.auditTrail) && entry.auditTrail.length
      ? entry.auditTrail
      : [{ action: "created", at: entry.createdAt || new Date().toISOString(), by: entry.enteredBy || ownerActor, reason: "" }],
  }));
}
function readDemoLastCloseoutDates() {
  const stored = readLocalStorageJson(LAST_CLOSEOUT_STORAGE_KEY, null);
  if (stored && typeof stored === "object" && !Array.isArray(stored)) return stored;
  if (BINDS_TO_SERVER_AUTH) return {};
  return { shami: "2026-06-02", arz: "2026-06-02" };
}
function readAcknowledgedDuplicateSales() {
  if (BINDS_TO_SERVER_AUTH) return {};
  if (typeof window === "undefined") return {};
  const stored = readLocalStorageJson(ACKNOWLEDGED_DUPLICATE_SALES_STORAGE_KEY, null);
  return stored && typeof stored === "object" && !Array.isArray(stored) ? stored : {};
}
function readCloseoutAlerts() {
  if (BINDS_TO_SERVER_AUTH) return [];
  if (typeof window === "undefined") return [];
  const stored = readLocalStorageJson(CLOSEOUT_ALERTS_STORAGE_KEY, []);
  return Array.isArray(stored) ? stored : [];
}
function writeCloseoutAlerts(alerts) {
  if (BINDS_TO_SERVER_AUTH) return;
  if (typeof window === "undefined") return;
  window.localStorage.setItem(CLOSEOUT_ALERTS_STORAGE_KEY, JSON.stringify(alerts));
}
function openWhatsAppSupport(lang) {
  window.open(`https://wa.me/${PROTOTYPE_SUPPORT_WHATSAPP}?text=${encodeURIComponent(lang === "ar" ? "مرحبًا، أحتاج دعم تقفيلة" : "Hello, I need Taqfeelah support")}`, "_blank");
}
function readPublicUserIdMap() {
  try {
    const parsed = JSON.parse(process.env.NEXT_PUBLIC_CLOSEOUTS_USER_ID_MAP || "{}");
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}
function resolveLegacyEmployeeIdByApiUserId(apiUserId) {
  if (!apiUserId) return "";
  const map = readPublicUserIdMap();
  for (const [legacyId, mappedUserId] of Object.entries(map)) {
    if (typeof mappedUserId === "string" && mappedUserId.toLowerCase() === String(apiUserId).toLowerCase()) {
      return legacyId;
    }
  }
  return "";
}
function employeePinMatches(person, pin) {
  const expectedPin = `${person?.pin || PROTOTYPE_EMPLOYEE_PIN_DEFAULT}`.trim();
  if (!expectedPin) return false;
  return `${pin}`.trim() === expectedPin;
}
function aggregateSalesChannelsFromGroupEntries(entries, lang, channelFilter = "all") {
  const map = new Map();
  entries.filter(entryIsActive).forEach((entry) => {
    if (entry.type !== "summary") return;
    (entry.salesChannels || []).forEach((row) => {
      if (!row?.channelId || Number(row.amount) <= 0) return;
      const fallback = channels.find((channel) => channel.id === row.channelId);
      const name = row.name || (fallback ? channelName(fallback, lang) : row.channelId);
      const current = map.get(row.channelId) || { channelId: row.channelId, name, amount: 0 };
      map.set(row.channelId, { ...current, amount: current.amount + Number(row.amount) });
    });
  });
  let result = [...map.values()].sort((a, b) => b.amount - a.amount);
  if (channelFilter !== "all") {
    result = result.filter((row) => row.channelId === channelFilter);
  }
  return result;
}
function summaryDayFromEntries(entries, businessId, date, reviewEnabledForBusiness = () => false) {
  return { id: date, dayAr: formatCalendarDate(date, "ar"), dayEn: formatCalendarDate(date, "en"), fullAr: formatCalendarDate(date, "ar"), fullEn: formatCalendarDate(date, "en"), ...summarizeEntries(entriesInPeriod(entries, businessId, "day", date, "2026-05"), reviewEnabledForBusiness) };
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
  return {
    id,
    businessId: payload.businessId,
    date: payload.date,
    createdAt,
    type: payload.type,
    categoryId: payload.categoryId || null,
    amount,
    salesChannels: payload.salesChannels || [],
    note: payload.note?.trim() || "",
    noteKey: payload.noteKey || null,
    closeoutId: payload.closeoutId || null,
    daySequence: Number.isInteger(payload.daySequence) ? payload.daySequence : null,
    outflowId: payload.outflowId || null,
    enteredBy: actor,
    attachment: payload.attachment ? makeAttachment(id, payload.attachment) : null,
    reviewed: false,
    status: "active",
    voidedAt: null,
    voidedBy: null,
    voidReason: "",
    restoredAt: null,
    restoredBy: null,
    restoreReason: "",
    auditTrail: [{ action: "created", at: createdAt, by: actor, reason: "" }],
  };
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
  return <span className={`rounded-full px-2.5 py-1 text-taq-meta font-bold ${themes[tone]}`}>{children}</span>;
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
      <button onClick={() => setLang("ar")} className={`rounded-full px-1.5 py-1 text-taq-meta font-black ${lang === "ar" ? "bg-[#112A46] text-white" : "text-[#827762]"}`}>ع</button>
      <button onClick={() => setLang("en")} className={`rounded-full px-1.5 py-1 text-taq-meta font-black ${lang === "en" ? "bg-[#112A46] text-white" : "text-[#827762]"}`}>EN</button>
    </div>
  );
}

function LoginScreen({ lang, setLang, onOwnerLogin, onEmployeePortal }) {
  const ownerLoginMethods = getEnabledOwnerLoginMethods();
  const [method, setMethod] = useState(
    ownerLoginMethods.includes("whatsapp_otp") ? "phone" : "password",
  );
  const [stage, setStage] = useState("phone");
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [username, setUsername] = useState(PROTOTYPE_OWNER_USERNAME);
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  useEffect(() => {
    const saved = readOwnerCredentials();
    if (!saved) return;
    setRememberMe(true);
    if (saved.username) setUsername(saved.username);
    if (saved.password) setPassword(saved.password);
  }, []);
  const submitOtp = () => {
    if (`${code}`.trim() !== PROTOTYPE_DEMO_OTP) { setError(text(lang, "invalidOtp")); return; }
    setError("");
    onOwnerLogin();
  };
  const submitPassword = async () => {
    if (submitting) return;
    if (APP_IN_PRODUCTION_MODE) {
      setSubmitting(true);
      try {
        const session = await loginOwnerSessionViaApi({ username: username.trim(), password });
        onOwnerLogin(typeof session?.userId === "string" ? session.userId : "");
      } catch (failure) {
        const message = failure instanceof Error && failure.message
          ? failure.message
          : text(lang, "invalidCredentials");
        setError(message);
        return;
      } finally {
        setSubmitting(false);
      }
    } else if (username.trim().toLowerCase() !== PROTOTYPE_OWNER_USERNAME || password !== PROTOTYPE_OWNER_PASSWORD) {
      setError(text(lang, "invalidCredentials"));
      return;
    }
    setError("");
    if (rememberMe) saveOwnerCredentials({ username: username.trim(), password });
    else clearOwnerCredentials();
    if (!APP_IN_PRODUCTION_MODE) onOwnerLogin();
  };
  useEffect(() => {
    if (method === "phone" && !isOwnerLoginMethodEnabled("whatsapp_otp")) {
      setMethod("password");
    }
  }, [method]);
  const canUsePhoneOtp = isOwnerLoginMethodEnabled("whatsapp_otp");
  const canUsePassword = isOwnerLoginMethodEnabled("username_password");
  const showAuthMethodTabs = canUsePhoneOtp && canUsePassword;
  return (
    <motion.section initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex min-h-[800px] flex-col px-6 pb-8 pt-10">
      <div className="flex justify-end"><LanguageSwitch lang={lang} setLang={setLang} /></div>
      <div className="mt-16 flex justify-center"><Logo lang={lang} /></div>
      <div className="mt-10 text-center">
        <h1 className="text-2xl font-black text-[#112A46]">{text(lang, "loginTitle")}</h1>
        <p className="mx-auto mt-3 max-w-[280px] text-sm leading-6 text-[#827762]">{text(lang, "loginSubtitle")}</p>
      </div>
      {showAuthMethodTabs ? (
        <div className="mt-6 grid grid-cols-2 gap-2">
          <button type="button" onClick={() => { setMethod("phone"); setError(""); }} className={`rounded-2xl py-2.5 text-taq-meta font-black ${method === "phone" ? "bg-[#112A46] text-white" : "bg-white text-[#716753] ring-1 ring-black/[0.05]"}`}>{text(lang, "loginWithPhone")}</button>
          <button type="button" onClick={() => { setMethod("password"); setError(""); }} className={`rounded-2xl py-2.5 text-taq-meta font-black ${method === "password" ? "bg-[#112A46] text-white" : "bg-white text-[#716753] ring-1 ring-black/[0.05]"}`}>{text(lang, "loginWithPassword")}</button>
        </div>
      ) : null}
      <div className="mt-4 rounded-[28px] bg-white p-5 shadow-sm ring-1 ring-black/[0.045]">
        {method === "phone" && canUsePhoneOtp ? (
          stage === "phone" ? (
            <>
              <p className="mb-2 text-xs font-bold text-[#716753]">{text(lang, "mobileNumber")}</p>
              <div dir="ltr" className="flex items-center gap-3 rounded-2xl bg-[#F7F5EF] px-4 py-4 ring-1 ring-[#E8E1D4]">
                <Smartphone className="h-5 w-5 text-[#B99844]" />
                <span className="border-r border-[#DDD3C0] pr-3 text-sm font-black text-[#112A46]">+966</span>
                <input
                  value={phone}
                  inputMode="numeric"
                  pattern="[0-9]*"
                  onChange={(event) => setPhone(event.target.value.replace(/\D/g, ""))}
                  className="min-w-0 flex-1 bg-transparent text-sm font-black outline-none"
                />
              </div>
              <p className="mt-2 text-taq-meta font-bold text-[#827762]">{text(lang, "mobileHint")}</p>
              <button type="button" onClick={() => { setStage("code"); setError(""); }} className="mt-5 w-full rounded-2xl bg-[#112A46] py-4 text-sm font-black text-white">{text(lang, "sendCode")}</button>
            </>
          ) : (
            <>
              <p className="text-xs font-bold text-[#716753]">{text(lang, "verificationCode")}</p>
              <p className="mt-2 text-taq-meta font-bold text-[#827762]">{text(lang, "codeSentTo")} <span dir="ltr" className="text-[#112A46]">+966 {phone}</span></p>
              <input
                dir="ltr"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={4}
                value={code}
                onChange={(event) => setCode(event.target.value.replace(/\D/g, "").slice(0, 4))}
                placeholder="• • • •"
                className="mt-4 w-full rounded-2xl bg-[#F7F5EF] px-4 py-4 text-center text-xl font-black tracking-[0.45em] outline-none ring-1 ring-[#E8E1D4]"
              />
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
            <label className="mt-3 flex cursor-pointer items-center gap-2.5">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(event) => setRememberMe(event.target.checked)}
                className="h-4 w-4 rounded border-[#C8BCA4] text-[#112A46] accent-[#112A46]"
              />
              <span className="text-taq-meta font-black text-[#716753]">{text(lang, "rememberMe")}</span>
            </label>
            <button type="button" onClick={() => { void submitPassword(); }} disabled={submitting} className="mt-4 w-full rounded-2xl bg-[#39A160] py-4 text-sm font-black text-white disabled:bg-[#B8C0B7]">{text(lang, "verifyContinue")}</button>
          </>
        )}
        {error && <p className="mt-3 rounded-xl bg-[#FFF1EE] p-2.5 text-center text-taq-meta font-bold text-[#B44747]">{error}</p>}
      </div>
      <button type="button" onClick={onEmployeePortal} className="mt-4 w-full rounded-2xl bg-white py-3.5 text-xs font-black text-[#112A46] ring-1 ring-black/[0.06]">{text(lang, "employeeLogin")}</button>
      {!APP_IN_PRODUCTION_MODE ? <LanHintBanner lang={lang} /> : null}
      {!APP_IN_PRODUCTION_MODE ? (
        <div className="mt-4 rounded-2xl bg-[#FFF4D2] p-4 text-center">
          <p className="text-taq-meta font-black leading-5 text-[#806528]">{text(lang, "prototypeDemoAccess")}</p>
          <p className="mt-1 text-taq-meta font-bold text-[#957D43]">{text(lang, "linkedAccountNote")}</p>
          <p className="mt-2 border-t border-[#E4C66B]/45 pt-2 text-taq-meta font-bold text-[#957D43]">{text(lang, "futureLoginOnLoginScreen")}</p>
        </div>
      ) : null}
      {!APP_IN_PRODUCTION_MODE ? (
        <p className="mt-3 text-center text-taq-meta font-bold text-[#827762]">
          {text(lang, "prototypeBuildLabel")}: <span dir="ltr" className="font-black text-[#112A46]">{PROTOTYPE_BUILD_STAMP}</span>
        </p>
      ) : null}
    </motion.section>
  );
}

function EmployeeLoginScreen({ lang, setLang, staff = [], onBack, onLogin }) {
  const [selectedId, setSelectedId] = useState("");
  const [manualEmployeeId, setManualEmployeeId] = useState("");
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [rosterStaff, setRosterStaff] = useState([]);
  const [rosterLoading, setRosterLoading] = useState(APP_IN_PRODUCTION_MODE);
  const loginStaff = APP_IN_PRODUCTION_MODE
    ? (staff.filter((person) => person.active && !person.removed).length > 0 ? staff : rosterStaff)
    : staff;
  const activeStaff = loginStaff.filter((person) => person.active && !person.removed);
  useEffect(() => {
    if (!APP_IN_PRODUCTION_MODE) return;
    let cancelled = false;
    fetchEmployeeLoginRosterViaApi()
      .then((payload) => {
        if (cancelled) return;
        if (Array.isArray(payload?.staff)) {
          setRosterStaff(payload.staff.map((person) => ({
            ...person,
            active: true,
            removed: false,
          })));
        }
      })
      .catch((failure) => {
        if (cancelled) return;
        console.warn("employee roster load failed", failure);
      })
      .finally(() => {
        if (!cancelled) setRosterLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);
  useEffect(() => {
    if (!selectedId && activeStaff[0]) setSelectedId(activeStaff[0].id);
  }, [activeStaff, selectedId]);
  useEffect(() => {
    const saved = readEmployeeCredentials();
    if (!saved) return;
    setRememberMe(true);
    if (saved.employeeId && activeStaff.some((person) => person.id === saved.employeeId)) setSelectedId(saved.employeeId);
    else if (saved.employeeId) setManualEmployeeId(saved.employeeId);
    if (saved.pin) setPin(saved.pin);
  }, [activeStaff]);
  const submit = async () => {
    if (submitting) return;
    const employeeIdentifier = activeStaff.length > 0 ? selectedId : manualEmployeeId.trim();
    const person = activeStaff.find((item) => item.id === employeeIdentifier);
    if (!employeeIdentifier) { setError(text(lang, "noActiveEmployee")); return; }
    if (APP_IN_PRODUCTION_MODE) {
      setSubmitting(true);
      try {
        const session = await loginEmployeeSessionViaApi({
          employeeId: employeeIdentifier,
          pin: pin.trim(),
        });
        onLogin(person?.id || employeeIdentifier, typeof session?.userId === "string" ? session.userId : "");
      } catch (failure) {
        const message = failure instanceof Error && failure.message
          ? failure.message
          : text(lang, "invalidEmployeePin");
        setError(message);
        return;
      } finally {
        setSubmitting(false);
      }
    } else if (!person || !employeePinMatches(person, pin)) { setError(text(lang, "invalidEmployeePin")); return; }
    setError("");
    if (rememberMe) saveEmployeeCredentials({ employeeId: employeeIdentifier, pin: pin.trim() });
    else clearEmployeeCredentials();
    if (!APP_IN_PRODUCTION_MODE) onLogin(person?.id || employeeIdentifier);
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
        {activeStaff.length > 0 ? (
          <div className="mb-4 flex flex-wrap gap-2">
            {activeStaff.map((person) => (
              <button key={person.id} type="button" onClick={() => setSelectedId(person.id)} className={`rounded-full px-3 py-2 text-taq-meta font-black ${selectedId === person.id ? "bg-[#112A46] text-white" : "bg-[#F7F5EF] text-[#716753] ring-1 ring-[#E8E1D4]"}`}>
                {lang === "ar" ? person.nameAr : person.nameEn}
              </button>
            ))}
          </div>
        ) : rosterLoading ? (
          <p className="mb-4 rounded-2xl bg-[#F7F5EF] px-4 py-3 text-center text-taq-meta font-bold text-[#827762]">
            {lang === "ar" ? "جاري تحميل قائمة الموظفين..." : "Loading employee list..."}
          </p>
        ) : (
          <input
            dir="ltr"
            value={manualEmployeeId}
            onChange={(event) => setManualEmployeeId(event.target.value)}
            placeholder={lang === "ar" ? "Employee ID" : "Employee ID"}
            className="mb-4 w-full rounded-2xl bg-[#F7F5EF] px-4 py-3.5 text-sm font-black outline-none ring-1 ring-[#E8E1D4]"
          />
        )}
        <p className="mb-2 text-xs font-bold text-[#716753]">{text(lang, "employeePin")}</p>
        <input dir="ltr" inputMode="numeric" value={pin} onChange={(event) => setPin(event.target.value)} placeholder="• • • •" className="w-full rounded-2xl bg-[#F7F5EF] px-4 py-4 text-center text-xl font-black tracking-[0.45em] outline-none ring-1 ring-[#E8E1D4]" />
        {!APP_IN_PRODUCTION_MODE ? <p className="mt-2 text-taq-meta font-bold text-[#827762]">{text(lang, "employeePinHint")}</p> : null}
        <label className="mt-3 flex cursor-pointer items-center gap-2.5">
          <input
            type="checkbox"
            checked={rememberMe}
            onChange={(event) => setRememberMe(event.target.checked)}
            className="h-4 w-4 rounded border-[#C8BCA4] text-[#112A46] accent-[#112A46]"
          />
          <span className="text-taq-meta font-black text-[#716753]">{text(lang, "rememberMe")}</span>
        </label>
        <button type="button" onClick={() => { void submit(); }} disabled={submitting} className="mt-4 w-full rounded-2xl bg-[#39A160] py-4 text-sm font-black text-white disabled:bg-[#B8C0B7]">{text(lang, "verifyContinue")}</button>
        {error && <p className="mt-3 rounded-xl bg-[#FFF1EE] p-2.5 text-center text-taq-meta font-bold text-[#B44747]">{error}</p>}
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
          <p className="text-taq-meta font-bold leading-6 text-[#716753]">{text(lang, "helpCenterBody")}</p>
          {!APP_IN_PRODUCTION_MODE ? (
            <p className="mt-3 rounded-xl bg-white px-3 py-2 text-center text-taq-meta font-black text-[#112A46] ring-1 ring-black/[0.06]">
              {text(lang, "prototypeBuildLabel")}: <span dir="ltr">{PROTOTYPE_BUILD_STAMP}</span>
            </p>
          ) : null}
          {!APP_IN_PRODUCTION_MODE ? <LanHintBanner lang={lang} /> : null}
          <button type="button" onClick={() => { openWhatsAppSupport(lang); onClose(); }} className="mt-4 w-full rounded-2xl bg-[#25D366] py-3.5 text-xs font-black text-white">{text(lang, "whatsappSupport")}</button>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

function TopBar({ lang, setLang, employee, employeeName = "", onRoleChange, onLogout = () => {}, onNotifications = () => {}, onEmployeeSettings = () => {}, showNotifications = true, hasNotificationBadge = false, notebookMode = false, notebookTheme = "yellow" }) {
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
  const headerSurfaceStyle = notebookMode ? notebookLinesBackground(notebookTheme) : { backgroundColor: "#F8F6F0" };
  const headerStyle = {
    ...headerSurfaceStyle,
    minHeight: "calc(70px + env(safe-area-inset-top, 0px))",
    paddingTop: "calc(1rem + env(safe-area-inset-top, 0px))",
  };
  return (
    <header dir="ltr" className="taq-topbar sticky top-0 z-40 shrink-0 px-5 pb-2" style={headerStyle}>
      <div className={`absolute top-[calc(22px+env(safe-area-inset-top,0px))] flex h-10 w-10 items-center justify-center ${lang === "ar" ? "left-[14px]" : "right-[14px]"}`}>
        {!employee && showNotifications && (
          <button onClick={onNotifications} className="relative flex h-9 w-9 items-center justify-center text-[#112A46]">
            <Bell className="h-5 w-5" />
            {hasNotificationBadge && <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-[#CE4642]" />}
          </button>
        )}
      </div>
      <div className="absolute left-1/2 top-[calc(12px+env(safe-area-inset-top,0px))] -translate-x-1/2 text-center">
        <Logo compact centered />
        {employee && employeeName ? (
          <p className="mx-auto mt-0.5 max-w-[160px] truncate text-taq-meta font-extrabold text-[#716753]">{employeeName}</p>
        ) : null}
      </div>
      <div className={`absolute top-[calc(22px+env(safe-area-inset-top,0px))] flex h-10 w-10 items-center justify-center ${lang === "ar" ? "right-[36px]" : "left-[36px]"}`}>
        <div ref={accountMenuRef} className="relative">
          <button
            type="button"
            onClick={() => setAccountMenuOpen((open) => !open)}
            aria-label={text(lang, "account")}
            aria-expanded={accountMenuOpen}
            aria-haspopup="menu"
            className={`flex h-9 w-9 items-center justify-center rounded-full text-[#112A46] transition ${accountMenuOpen ? "text-[#9A823E]" : ""}`}
          >
            <UserRound className="h-[21px] w-[21px]" strokeWidth={2} />
          </button>
          <AnimatePresence>
            {accountMenuOpen && (
              <motion.div
                dir={lang === "ar" ? "rtl" : "ltr"}
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                role="menu"
                className={`absolute top-[44px] z-50 overflow-hidden rounded-xl bg-white p-1.5 shadow-lg ring-1 ring-black/[0.06] ${employee ? "w-[148px]" : "w-[126px]"} ${lang === "ar" ? "right-0" : "left-0"}`}
              >
                <div className="flex justify-center px-1 py-1.5"><LanguageSwitch lang={lang} setLang={setLang} /></div>
                {employee ? (
                  <>
                    <div className="my-1 border-t border-[#F0ECE2]" />
                    <button
                      role="menuitem"
                      type="button"
                      onClick={() => { setAccountMenuOpen(false); onEmployeeSettings(); }}
                      className="flex w-full items-center justify-center rounded-lg px-2 py-2.5 text-taq-meta font-black text-[#112A46] transition hover:bg-[#F7F5EF]"
                    >
                      {text(lang, "settings")}
                    </button>
                  </>
                ) : null}
                <div className="my-1 border-t border-[#F0ECE2]" />
                <button role="menuitem" type="button" onClick={() => { setAccountMenuOpen(false); onLogout(); }} className="flex w-full items-center justify-center rounded-lg px-2 py-2.5 text-taq-meta font-black text-[#B44747] transition hover:bg-[#FFF1EE]">
                  <span>{text(lang, "logout")}</span>
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </header>
  );
}

function InkTab({ active, children, onClick, className = "", titleUnderline = false, showActiveUnderline = true }) {
  return (
    <button onClick={onClick} className={`relative pb-2 text-taq-meta font-black transition ${active ? "text-[#112A46]" : "text-[#957D43]"} ${className}`}>
      <span className="relative inline-flex items-center whitespace-nowrap">
        {children}
        {active && showActiveUnderline && (
          <span className="absolute -bottom-[9px] left-0 right-0 h-[2px] rounded-full bg-[#C28A30] transition-all duration-200" />
        )}
      </span>
    </button>
  );
}

function BackTitle({ title, onBack, lang, inNotebook = false }) {
  const BackIcon = lang === "ar" ? ChevronRight : ChevronLeft;
  return <div className={`mb-5 flex items-center gap-3 ${inNotebook ? "" : "px-5"}`}><button onClick={onBack} className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white shadow-sm ring-1 ring-black/[0.04]"><BackIcon className="h-5 w-5" /></button><h2 className="text-xl font-black">{title}</h2></div>;
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
      <p className={`text-taq-meta font-bold ${dark ? "text-white/60" : "text-[#827762]"}`}>{text(lang, "currentWorkStore")}</p>
      <button onClick={() => assignedStores.length > 1 && setOpen(!open)} className={`mt-1 flex w-full items-center justify-between text-start ${dark ? "text-white" : "text-[#112A46]"}`}>
        <div><p className="text-sm font-black">{businessName(currentStore, lang)}</p><p className={`mt-0.5 text-taq-meta font-bold ${dark ? "text-white/65" : "text-[#827762]"}`}>{businessLocation(currentStore, lang)}</p></div>
        {assignedStores.length > 1 && <div className={`flex items-center gap-1 rounded-full px-2 py-1 text-taq-nav font-bold ${dark ? "bg-white/10 text-white" : "bg-[#FFF0CB] text-[#806528]"}`}>{text(lang, "switchWorkStore")}<ChevronDown className="h-3 w-3" /></div>}
      </button>
      <AnimatePresence>{open && assignedStores.length > 1 && <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }} className="absolute start-0 end-0 top-[58px] z-30 rounded-2xl bg-white p-2 shadow-xl ring-1 ring-[#E8E1D4]">{assignedStores.map((business) => <button key={business.id} onClick={() => { onSelect(business.id); setOpen(false); }} className={`flex w-full items-center justify-between rounded-xl px-3 py-3 text-start ${currentStore.id === business.id ? "bg-[#FFF4D2]" : ""}`}><div><p className="text-taq-meta font-black text-[#112A46]">{businessName(business, lang)}</p><p className="text-taq-nav font-bold text-[#827762]">{businessLocation(business, lang)}</p></div>{currentStore.id === business.id && <Check className="h-4 w-4 text-[#112A46]" />}</button>)}</motion.div>}</AnimatePresence>
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
            <p className="text-taq-meta font-bold text-white/65">{text(lang, "todayEntries")}</p>
            <h1 className="mt-1 text-lg font-black">{text(lang, "openEntry")}</h1>
          </div>
          <span className="rounded-full bg-white/10 px-3 py-1 text-taq-meta font-black text-[#E4B84A]">{text(lang, "active")}</span>
        </div>
        <EmployeeStoreContext lang={lang} currentStore={currentStore} assignedStores={assignedStores} onSelect={onSelectStore} dark />
      </div>
      <div className="mb-5 grid grid-cols-2 gap-3">
        <button onClick={onSummary} className="flex min-h-[124px] flex-col items-start justify-between rounded-[24px] bg-[#112A46] p-4 text-start text-white shadow-sm">
          <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white/10"><ReceiptText className="h-5 w-5" /></span>
          <span><strong className="block text-taq-meta font-black leading-5">{text(lang, "enterDailySummary")}</strong><small className="mt-1 block text-taq-nav font-bold leading-4 text-white/65">{text(lang, "salesChannelsAndTotal")}</small></span>
        </button>
        <button onClick={onExpense} className="flex min-h-[124px] flex-col items-start justify-between rounded-[24px] bg-white p-4 text-start text-[#112A46] shadow-sm ring-1 ring-black/[0.045]">
          <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#FFF0CB] text-[#806528]"><Plus className="h-5 w-5" /></span>
          <span><strong className="block text-taq-meta font-black leading-5">{text(lang, "addPurchaseExpense")}</strong><small className="mt-1 block text-taq-nav font-bold leading-4 text-[#827762]">{text(lang, "amountNoteOptionalPhoto")}</small></span>
        </button>
      </div>
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-taq-body-sm font-black">{text(lang, "recentEntries")}</h3>
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
                <p className="text-taq-meta text-[#8B8274]">{opTime(entry, lang)} · {text(lang, entry.type)}</p>
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

function EmployeeEntriesScreen({ lang, reviewEnabled = false, currentStore, assignedStores, onSelectStore, activeEmployeeId, operationalEntries = [] }) {
  const entries = newestEntries(operationalEntries.filter((entry) => entry.businessId === currentStore?.id && entry.enteredBy?.userId === activeEmployeeId));
  return <motion.section initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="px-5 pb-24">
    <div className="mb-5"><p className="text-xs font-bold text-[#8B8274]">{text(lang, "tracking")}</p><h1 className="text-xl font-black">{text(lang, "myEntries")}</h1></div>
    <div className="mb-5 rounded-3xl bg-white p-4 ring-1 ring-black/[0.045]"><EmployeeStoreContext lang={lang} currentStore={currentStore} assignedStores={assignedStores} onSelect={onSelectStore} /></div>
    {entries.length === 0 ? <div className="rounded-3xl bg-white p-8 text-center text-xs font-bold text-[#827762] ring-1 ring-black/[0.045]">{text(lang, "noEntriesDay")}</div> : <div className="space-y-3">{entries.map((item) => { const isSale = item.type === "summary"; const signedAmount = isSale ? item.amount : -item.amount; return <div key={item.id} className="rounded-3xl bg-white p-4 ring-1 ring-black/[0.045]"><div className="flex items-start justify-between gap-3"><div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><p className="text-sm font-black">{operationDisplayLabel(item, lang)}</p>{entryIsVoided(item) && <Badge tone="warning">{text(lang, "voided")}</Badge>}{entryHasAttachment(item) && <Badge tone="navy">{text(lang, "attachmentExists")}</Badge>}</div><p className="mt-1 text-taq-meta font-bold text-[#827762]">{formatCalendarDate(item.date, lang)} · {opTime(item, lang)}</p></div><strong className={`shrink-0 tabular-nums text-sm font-black ${entryIsVoided(item) ? "text-[#A99D87] line-through" : isSale ? "text-[#257844]" : "text-[#B44747]"}`}><MoneyValue value={money(signedAmount, lang)} /></strong></div>{reviewEnabled && entryIsActive(item) && entryHasAttachment(item) && <p className={`mt-3 text-taq-meta font-black ${item.reviewed ? "text-[#257844]" : "text-[#B96725]"}`}>{item.reviewed ? text(lang, "reviewed") : text(lang, "waitingReview")}</p>}</div>; })}</div>}
  </motion.section>;
}

function Stat({ label, value }) { return <div className="rounded-3xl bg-white p-4 ring-1 ring-black/[0.045]"><p className="text-taq-meta font-bold text-[#827762]">{label}</p><p className="mt-2 text-xl font-black">{value}</p></div>; }

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
      <div className="mb-2 flex items-center justify-between gap-2"><p className="text-xs font-bold text-[#716753]">{text(lang, "date")}</p>{showSuggestion && <span className="rounded-full bg-[#FFF0CB] px-2 py-1 text-taq-nav font-bold text-[#806528]">{text(lang, "suggestedNextCloseout")}</span>}</div>
      <button onClick={() => { setCalendarView({ year: selected.getFullYear(), month: selected.getMonth() }); setOpen(!open); }} className="flex w-full items-center justify-between rounded-2xl bg-white px-4 py-3.5 text-sm font-black text-[#112A46] ring-1 ring-black/[0.05]">
        <span>{formatCalendarDate(value, lang)}</span><CalendarDays className="h-4 w-4 text-[#B99844]" />
      </button>
      {showSuggestion && <p className="mt-2 text-taq-meta font-bold text-[#827762]">{text(lang, "changeDateAnytime")}</p>}
      <AnimatePresence>{open && <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }} className="absolute start-0 end-0 top-[78px] z-30 rounded-2xl bg-[#FFFDF7] p-3 shadow-xl ring-1 ring-[#D8CCA8]">
        <div className="mb-3 flex items-center justify-between"><button onClick={previous} className="flex h-8 w-8 items-center justify-center rounded-xl text-[#806528]"><ChevronRight className={`h-4 w-4 ${lang === "en" ? "rotate-180" : ""}`} /></button><strong className="text-xs">{formatCalendarMonth(calendarView.year, calendarView.month, lang)}</strong><button onClick={next} className="flex h-8 w-8 items-center justify-center rounded-xl text-[#806528]"><ChevronLeft className={`h-4 w-4 ${lang === "en" ? "rotate-180" : ""}`} /></button></div>
        <div className="mb-2 grid grid-cols-7 text-center text-taq-meta font-bold text-[#957D43]">{weekDays.map((day, index) => <span key={`${day}-${index}`}>{day}</span>)}</div>
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
  return <motion.section initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mx-auto w-full pb-24 sm:max-w-[560px] lg:max-w-none"><BackTitle lang={lang} title={text(lang, "newOutflow")} onBack={onBack} /><div className="space-y-5 px-5"><div className="rounded-3xl bg-white p-4 ring-1 ring-black/[0.045]"><EmployeeStoreContext lang={lang} currentStore={currentStore} assignedStores={assignedStores} onSelect={changeStore} /></div><EntryDatePicker lang={lang} value={operationDate} onChange={setOperationDate} /><div><p className="mb-2 text-xs font-bold text-[#716753]">{text(lang, "transactionType")}</p><div className="grid grid-cols-3 gap-2">{["purchases", "expense", "withdrawal"].map((item) => <Choice key={item} active={kind === item} onClick={() => setKind(item)}>{text(lang, item)}</Choice>)}</div></div>{kind === "expense" && <div><p className="mb-2 text-xs font-bold text-[#716753]">{text(lang, "category")}</p>{activeCategories.length ? <div className="grid grid-cols-3 gap-2">{activeCategories.map((item) => <Choice key={item.id} active={category === item.id} onClick={() => setCategory(item.id)}>{text(lang, item.label)}</Choice>)}</div> : <p className="rounded-xl bg-[#FFF1EE] p-3 text-taq-meta font-bold text-[#B44747]">{text(lang, "atLeastOneCategory")}</p>}</div>}<div className="rounded-3xl bg-white p-5 ring-1 ring-black/[0.05]"><p className="text-xs font-bold text-[#716753]">{text(lang, "howMuch")}</p><div className="mt-2 flex items-center gap-2" dir="ltr"><input inputMode="decimal" value={amount} onChange={(event) => setAmount(sanitizeAmountInput(event.target.value))} placeholder="0" className="w-full min-w-0 bg-transparent text-4xl font-black outline-none" /><span className="mt-3 text-sm font-bold text-[#786D58]">{lang === "ar" ? "ر.س" : "SAR"}</span></div></div><div className="grid grid-cols-2 gap-3"><SmallInfo label={text(lang, "date")} value={formatCalendarDate(operationDate, lang)} /><SmallInfo label={text(lang, "category")} value={kind === "expense" ? text(lang, activeCategories.find((item) => item.id === category)?.label || "other") : text(lang, kind)} /></div><AttachmentCapture lang={lang} attachment={attachment} processing={processing} error={error} onSelect={selectAttachment} onClear={clearAttachment} tall /><div className="rounded-3xl bg-white p-4 ring-1 ring-black/[0.05]"><p className="mb-2 text-xs font-bold text-[#716753]">{text(lang, "note")} <span className="font-normal">({text(lang, "optional")})</span></p><textarea value={note} onChange={(event) => setNote(event.target.value)} placeholder={text(lang, "notePlaceholder")} className="min-h-[52px] w-full resize-none rounded-2xl bg-[#F7F5EF] px-4 py-3 text-sm outline-none" /></div><button disabled={!canSave || processing || saving} onClick={submit} className={`w-full rounded-2xl py-4 text-sm font-extrabold text-white ${canSave && !processing && !saving ? "bg-[#39A160]" : "bg-[#B8C0B7]"}`}>{text(lang, saving ? "saving" : "save")}</button></div></motion.section>;
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
  return <motion.section initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mx-auto w-full pb-24 sm:max-w-[560px] lg:max-w-none"><BackTitle lang={lang} title={text(lang, "dailySummary")} onBack={onBack} /><div className="px-5"><div className="mb-5 rounded-3xl bg-white p-4 ring-1 ring-black/[0.045]"><EmployeeStoreContext lang={lang} currentStore={currentStore} assignedStores={assignedStores} onSelect={changeStore} /></div><EntryDatePicker lang={lang} value={summaryDate} onChange={setSummaryDate} showSuggestion={showDateSuggestion} /><p className="mb-3 text-xs font-bold text-[#716753]">{text(lang, "salesChannels")}</p>{salesChannels.length === 0 ? <div className="mb-4 rounded-3xl bg-white p-5 text-xs font-bold text-[#B44747] ring-1 ring-black/[0.05]">{text(lang, "noSalesChannels")}</div> : <div className="mb-4 grid grid-cols-3 gap-2">{salesChannels.map((channel) => <label key={channel.id} className="rounded-2xl bg-white px-2 py-3 text-center ring-1 ring-black/[0.05]"><span className="mb-2 block min-h-[30px] text-taq-meta font-bold leading-4 text-[#716753]">{channelName(channel, lang)}</span><div dir="ltr" className="flex items-center justify-center gap-1"><input inputMode="decimal" value={values[channel.id] ?? ""} onChange={(e) => setValues({ ...values, [channel.id]: sanitizeAmountInput(e.target.value) })} className="min-w-0 w-full bg-[#F7F5EF] px-1 py-2 text-center text-sm font-black outline-none" /><span className="text-taq-nav font-bold text-[#827762]">{lang === "ar" ? "ر.س" : "SAR"}</span></div></label>)}</div>}<div className="mb-5 flex justify-between rounded-3xl bg-[#112A46] p-5 text-white"><span className="text-sm font-bold text-white/70">{text(lang, "totalSales")}</span><strong><MoneyValue value={money(total, lang)} /></strong></div><AttachmentCapture lang={lang} attachment={attachment} processing={processing} error={error} onSelect={selectAttachment} onClear={clearAttachment} /><button disabled={!canSave || processing || saving} onClick={submit} className={`mt-5 w-full rounded-2xl py-4 text-sm font-extrabold text-white ${canSave && !processing && !saving ? "bg-[#39A160]" : "bg-[#B8C0B7]"}`}>{text(lang, saving ? "saving" : "save")}</button></div></motion.section>;
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
    <div className={`relative ${tall ? "text-center" : "text-start"}`}><p className="text-sm font-extrabold">{processing ? text(lang, "processingPhoto") : attachment ? text(lang, "replacePhoto") : text(lang, "cameraOrGallery")}</p><p className="text-taq-meta text-[#827762]">{attachment ? text(lang, "attachmentStoredLocally") : text(lang, "optional")}</p></div>
  </label>{attachment && <button onClick={onClear} className="mt-2 text-taq-meta font-bold text-[#B44747]">{text(lang, "removePhoto")}</button>}{error && <p className="mt-2 text-taq-meta font-bold text-[#B44747]">{error}</p>}</div>;
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
  return <div ref={pickerRef} className="relative"><button onClick={() => setOpen(!open)} className="flex w-full items-center justify-between rounded-2xl bg-white px-4 py-3 text-start text-xs font-black ring-1 ring-black/[0.05]"><span>{selectedStore ? businessName(selectedStore, lang) : text(lang, "selectStore")}</span><ChevronDown className="h-4 w-4 text-[#806528]" /></button><AnimatePresence>{open && <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }} className="absolute start-0 end-0 top-[50px] z-40 rounded-2xl bg-white p-3 shadow-xl ring-1 ring-[#E8E1D4]"><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder={text(lang, "searchStore")} className="mb-2 w-full rounded-xl bg-[#F7F5EF] px-3 py-2.5 text-taq-meta font-bold outline-none" /><div className="max-h-48 overflow-y-auto">{filteredStores.map((business) => <button key={business.id} onClick={() => { onSelect(business.id); setOpen(false); setQuery(""); }} className={`mb-1 flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-start ${selectedId === business.id ? "bg-[#FFF4D2]" : ""}`}><div><p className="text-taq-meta font-black">{businessName(business, lang)}</p><p className="text-taq-nav font-bold text-[#827762]">{businessLocation(business, lang)}</p></div>{selectedId === business.id && <Check className="h-4 w-4 text-[#112A46]" />}</button>)}</div></motion.div>}</AnimatePresence></div>;
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
  return <motion.section initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mx-auto w-full pb-24 sm:max-w-[560px] lg:max-w-none"><BackTitle lang={lang} title={text(lang, "dailySummary")} onBack={onBack} /><div className="space-y-5 px-5"><EntryDatePicker lang={lang} value={summaryDate} onChange={setSummaryDate} /><div><p className="mb-2 text-xs font-bold text-[#716753]">{text(lang, "operationStore")}</p><StoreOperationPicker lang={lang} businessesList={businessesList} selectedId={businessId} onSelect={changeStore} /><p className={`mt-2 text-taq-meta font-bold ${selectedStore ? "text-[#827762]" : "text-[#B44747]"}`}>{selectedStore ? text(lang, "operationStoreHint") : text(lang, "chooseStoreForSummary")}</p></div><div><p className="mb-3 text-xs font-bold text-[#716753]">{text(lang, "salesChannels")}</p>{!selectedStore ? <div className="rounded-3xl bg-white p-5 text-xs font-bold text-[#827762] ring-1 ring-black/[0.05]">{text(lang, "chooseStoreForSummary")}</div> : salesChannels.length === 0 ? <div className="rounded-3xl bg-white p-5 text-xs font-bold text-[#B44747] ring-1 ring-black/[0.05]">{text(lang, "noSalesChannels")}</div> : <div className="grid grid-cols-3 gap-2">{salesChannels.map((channel) => <label key={channel.id} className="rounded-2xl bg-white px-2 py-3 text-center ring-1 ring-black/[0.05]"><span className="mb-2 block min-h-[30px] text-taq-meta font-bold leading-4 text-[#716753]">{channelName(channel, lang)}</span><div dir="ltr" className="flex items-center justify-center gap-1"><input inputMode="decimal" value={values[channel.id] || ""} onChange={(event) => setValues((current) => ({ ...current, [channel.id]: sanitizeAmountInput(event.target.value) }))} className="min-w-0 w-full bg-[#F7F5EF] px-1 py-2 text-center text-sm font-black outline-none" /><span className="text-taq-nav font-bold text-[#827762]">{lang === "ar" ? "ر.س" : "SAR"}</span></div></label>)}</div>}</div><div className="flex justify-between rounded-3xl bg-[#112A46] p-5 text-white"><span className="text-sm font-bold text-white/70">{text(lang, "totalSales")}</span><strong><MoneyValue value={money(total, lang)} /></strong></div><AttachmentCapture lang={lang} attachment={attachment} processing={processing} error={error} onSelect={selectAttachment} onClear={clearAttachment} /><button disabled={!canSave || processing || saving} onClick={submit} className={`w-full rounded-2xl py-4 text-sm font-extrabold text-white ${canSave && !processing && !saving ? "bg-[#39A160]" : "bg-[#B8C0B7]"}`}>{text(lang, saving ? "saving" : "save")}</button></div></motion.section>;
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
  return <motion.section initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mx-auto w-full pb-24 sm:max-w-[560px] lg:max-w-none"><BackTitle lang={lang} title={text(lang, "addOutflow")} onBack={onBack} /><div className="space-y-5 px-5"><div className="rounded-2xl bg-[#FFF4D2] p-3 text-taq-meta font-bold leading-5 text-[#806528]">{text(lang, "ownerOutflowNotice")}</div><EntryDatePicker lang={lang} value={operationDate} onChange={setOperationDate} /><div><p className="mb-2 text-xs font-bold text-[#716753]">{text(lang, "operationStore")}</p><StoreOperationPicker lang={lang} businessesList={businessesList} selectedId={businessId} onSelect={changeStore} /><p className={`mt-2 text-taq-meta font-bold ${selectedStore ? "text-[#827762]" : "text-[#B44747]"}`}>{selectedStore ? text(lang, "operationStoreHint") : text(lang, "chooseOperationStore")}</p></div><div><p className="mb-2 text-xs font-bold text-[#716753]">{text(lang, "transactionType")}</p><div className="grid grid-cols-3 gap-2">{["expense", "purchases", "withdrawal"].map((item) => <Choice key={item} active={kind === item} onClick={() => setKind(item)}>{text(lang, item)}</Choice>)}</div></div>{kind === "expense" && <div><p className="mb-2 text-xs font-bold text-[#716753]">{text(lang, "category")}</p>{activeCategories.length ? <div className="grid grid-cols-3 gap-2">{activeCategories.map((item) => <Choice key={item.id} active={category === item.id} onClick={() => setCategory(item.id)}>{text(lang, item.label)}</Choice>)}</div> : <p className="rounded-xl bg-[#FFF1EE] p-3 text-taq-meta font-bold text-[#B44747]">{text(lang, "atLeastOneCategory")}</p>}</div>}<div className="rounded-3xl bg-white p-5 ring-1 ring-black/[0.05]"><p className="text-xs font-bold text-[#716753]">{text(lang, "amount")}</p><div className="mt-2 flex items-center gap-2" dir="ltr"><input inputMode="decimal" value={amount} onChange={(event) => setAmount(sanitizeAmountInput(event.target.value))} placeholder="0" className="w-full min-w-0 bg-transparent text-4xl font-black outline-none" /><span className="mt-3 text-sm font-bold text-[#786D58]">{lang === "ar" ? "ر.س" : "SAR"}</span></div></div><div className="grid grid-cols-2 gap-3"><SmallInfo label={text(lang, "date")} value={formatCalendarDate(operationDate, lang)} /><SmallInfo label={text(lang, "category")} value={categoryLabel} /></div><div className="rounded-3xl bg-white p-4 ring-1 ring-black/[0.05]"><p className="mb-2 text-xs font-bold text-[#716753]">{text(lang, "note")} <span className="font-normal">({text(lang, "optional")})</span></p><textarea value={note} onChange={(event) => setNote(event.target.value)} placeholder={text(lang, "notePlaceholder")} className="min-h-[52px] w-full resize-none rounded-2xl bg-[#F7F5EF] px-4 py-3 text-sm outline-none" /></div><AttachmentCapture lang={lang} attachment={attachment} processing={processing} error={error} onSelect={selectAttachment} onClear={clearAttachment} /><button disabled={!canSave || processing || saving} onClick={submit} className={`w-full rounded-2xl py-4 text-sm font-extrabold text-white transition ${canSave && !processing && !saving ? "bg-[#112A46]" : "cursor-not-allowed bg-[#B8C0B7]"}`}>{text(lang, saving ? "saving" : "saveOutflow")}</button></div></motion.section>;
}
function SmallInfo({ label, value }) { return <div className="rounded-2xl bg-white p-3 ring-1 ring-black/[0.05]"><p className="text-taq-meta font-bold text-[#716753]">{label}</p><p className="mt-1 text-xs font-black">{value}</p></div>; }

function SettingToggle({ enabled, onToggle, disabled = false }) { return <button disabled={disabled} onClick={onToggle} className={`relative h-6 w-11 rounded-full transition ${disabled ? "cursor-not-allowed opacity-55" : ""} ${enabled ? "bg-[#39A160]" : "bg-[#D9D3C7]"}`}><span className={`absolute top-1 h-4 w-4 rounded-full bg-white shadow-sm transition ${enabled ? "left-1" : "left-6"}`} /></button>; }
function EmployeeSettingsScreen({ lang, onBack, currentStore, assignedStores, onSelectStore, employeeNotebookTheme, setEmployeeNotebookTheme, onOpenSupport, onOpenHelp }) {
  const perms = ["permissionSummary", "permissionOutflow", "permissionAttach"];
  const [draftTheme, setDraftTheme] = useState(employeeNotebookTheme);
  const [savedNotice, setSavedNotice] = useState(false);
  useEffect(() => { setDraftTheme(employeeNotebookTheme); }, [employeeNotebookTheme]);
  const saveTheme = () => {
    setEmployeeNotebookTheme(draftTheme);
    setSavedNotice(true);
    window.setTimeout(() => setSavedNotice(false), 2200);
  };
  const themeDirty = draftTheme !== employeeNotebookTheme;
  return (
    <motion.section initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="taq-owner-page taq-notebook-body pb-28 pt-1">
      <BackTitle lang={lang} title={text(lang, "settings")} onBack={onBack} inNotebook />
      <p className="mb-2 text-xs font-bold text-[#716753]">{text(lang, "linkedStores")}</p>
      <div className="mb-5 rounded-3xl bg-white p-4 ring-1 ring-black/[0.045]">
        <EmployeeStoreContext lang={lang} currentStore={currentStore} assignedStores={assignedStores} onSelect={onSelectStore} />
        <div className="mt-4 space-y-2 border-t border-[#F0ECE2] pt-3">
          {assignedStores.map((business) => (
            <div key={business.id} className="flex items-center gap-2 text-taq-meta font-bold text-[#716753]">
              <Check className="h-4 w-4 text-[#39A160]" />
              {businessName(business, lang)}
            </div>
          ))}
        </div>
      </div>
      <p className="mb-2 text-xs font-bold text-[#716753]">{lang === "ar" ? "شكل دفتر واجهتي" : "My notebook theme"}</p>
      <div className="mb-5 rounded-3xl bg-white p-4 ring-1 ring-black/[0.045]">
        <ThemePicker lang={lang} theme={draftTheme} onChange={setDraftTheme} />
        <p className="mt-3 text-taq-meta font-bold leading-5 text-[#806528]">{lang === "ar" ? "يُطبّق على قائمة التقفيلات وشاشة الإدخال فقط. الافتراضي من إعدادات المحل." : "Applies to your closeout list and entry flow. Defaults to store settings."}</p>
        <button type="button" onClick={saveTheme} disabled={!themeDirty} className={`mt-4 w-full rounded-2xl py-3.5 text-xs font-extrabold text-white transition ${themeDirty ? "bg-[#112A46]" : "cursor-not-allowed bg-[#B8C0B7]"}`}>
          {text(lang, savedNotice ? "savedNotice" : "save")}
        </button>
      </div>
      <p className="mb-2 text-xs font-bold text-[#716753]">{text(lang, "permissions")}</p>
      <div className="mb-5 rounded-3xl bg-white p-4 ring-1 ring-black/[0.045]">
        <p className="mb-4 text-taq-meta font-bold text-[#806528]">{text(lang, "employeeEntryOnly")}</p>
        {perms.map((key) => (
          <div key={key} className="mb-3 flex items-center gap-2 last:mb-0">
            <Check className="h-4 w-4 text-[#39A160]" />
            <span className="text-xs font-bold">{text(lang, key)}</span>
          </div>
        ))}
        <p className="mt-4 border-t border-[#F0ECE2] pt-3 text-taq-meta font-bold text-[#827762]">{text(lang, "ownerOnly")}</p>
      </div>
      <div className="overflow-hidden rounded-3xl bg-white ring-1 ring-black/[0.045]">
        <ActionRow label={text(lang, "support")} lang={lang} border onClick={onOpenSupport} />
        <ActionRow label={text(lang, "helpCenter")} lang={lang} onClick={onOpenHelp} />
      </div>
    </motion.section>
  );
}
const DISABLE_REVIEW_ALERTS_MIGRATION_KEY = "disableReviewAlertsV1";

function migrateSavedSettings(raw) {
  if (!raw || typeof window === "undefined" || BINDS_TO_SERVER_AUTH || raw[DISABLE_REVIEW_ALERTS_MIGRATION_KEY]) return raw;
  const migrated = { ...raw, [DISABLE_REVIEW_ALERTS_MIGRATION_KEY]: true };
  if (migrated.storeOperationalSettings) {
    migrated.storeOperationalSettings = Object.fromEntries(
      Object.entries(migrated.storeOperationalSettings).map(([id, cfg]) => [
        id,
        {
          ...cfg,
          reviewEnabled: false,
          attachmentAlert: false,
          closeoutAlert: false,
          closeoutReviewEnabled: false,
        },
      ]),
    );
  } else {
    migrated.reviewEnabled = false;
    migrated.closeoutAlert = false;
    migrated.attachmentAlert = false;
    migrated.closeoutReviewEnabled = false;
  }
  window.localStorage.setItem("taqfeelah_owner_settings", JSON.stringify(migrated));
  window.localStorage.removeItem(CLOSEOUT_ALERTS_STORAGE_KEY);
  autoResolveSubmittedCloseoutsWithoutReview(() => false);
  return migrated;
}

function readSavedSettings() {
  if (BINDS_TO_SERVER_AUTH || RUNTIME_SETTINGS_DB_SOURCE) return null;
  if (typeof window === "undefined") return null;
  try {
    const raw = JSON.parse(window.localStorage.getItem("taqfeelah_owner_settings") || "null");
    return migrateSavedSettings(raw);
  } catch {
    return null;
  }
}

const PROTOTYPE_DEFAULT_STAFF = [
  { id: "ahmed", nameAr: "أحمد", nameEn: "Ahmed", mobile: "050 123 4567", active: true, storeIds: ["shami"], pin: PROTOTYPE_EMPLOYEE_PIN_DEFAULT },
  { id: "sara", nameAr: "سارة", nameEn: "Sara", mobile: "055 987 6543", active: true, storeIds: ["arz"], pin: PROTOTYPE_EMPLOYEE_PIN_DEFAULT },
];

function readPrototypeAuthBoot() {
  // Prototype Access Mode always starts logged out (no session restore).
  if (!BINDS_TO_SERVER_AUTH || PROTOTYPE_ACCESS_MODE) {
    return {
      loggedIn: false,
      employee: false,
      loggedInEmployeeId: null,
      employeeBusinessId: "",
    };
  }
  const settings = readSavedSettings();
  return resolveAuthStateFromSession(settings?.staff || (BINDS_TO_SERVER_AUTH ? [] : PROTOTYPE_DEFAULT_STAFF));
}
function OwnerSettingsScreen({ lang, notebookTheme, setNotebookTheme, storeChannelSettings, setStoreChannelSettings, storeOperationalSettings, setStoreOperationalSettings, configuredBusinesses, setConfiguredBusinesses, archivedBusinessIds, setArchivedBusinessIds, staff, setStaff, ownerProfile, setOwnerProfile, authOwnerUsername, setAuthOwnerUsername, authOwnerPassword, setAuthOwnerPassword, authEmployeePins, setAuthEmployeePins, operationalEntries = [], selectedBusiness, setSelectedBusiness, setOwnerPage, setArchivedReadOnlyBusinessId, setLastCloseoutDates, onPersistSettingsNow = null, onLogout = () => {}, onOpenSupport = () => {}, onOpenHelp = () => {} }) {
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
  const [draftAuthOwnerUsername, setDraftAuthOwnerUsername] = useState(authOwnerUsername || "");
  const [draftAuthOwnerPassword, setDraftAuthOwnerPassword] = useState(authOwnerPassword || "");
  const [draftAuthEmployeePins, setDraftAuthEmployeePins] = useState(() => ({ ...(authEmployeePins || {}) }));
  const [teamSaving, setTeamSaving] = useState(false);

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
    if (APP_IN_PRODUCTION_MODE || RUNTIME_SETTINGS_DB_SOURCE) return;
    if (typeof window === "undefined") return;
    window.localStorage.setItem("taqfeelah_owner_settings", JSON.stringify({
      configuredBusinesses,
      archivedBusinessIds,
      storeChannelSettings,
      storeOperationalSettings,
      notebookTheme,
      staff,
      ownerProfile,
      authConfig: {
        ownerUsername: authOwnerUsername,
        ownerPassword: authOwnerPassword,
        employeePins: authEmployeePins,
      },
    }));
  }, [configuredBusinesses, archivedBusinessIds, storeChannelSettings, storeOperationalSettings, notebookTheme, staff, ownerProfile, authOwnerUsername, authOwnerPassword, authEmployeePins]);
  useEffect(() => { setDraftNotebookTheme(notebookTheme); setThemeDirty(false); }, [notebookTheme]);
  useEffect(() => { setDraftOwnerName(ownerProfile?.name || text(lang, "ownerName")); }, [ownerProfile?.name, lang]);
  useEffect(() => { setDraftAuthOwnerUsername(authOwnerUsername || ""); }, [authOwnerUsername]);
  useEffect(() => { setDraftAuthOwnerPassword(authOwnerPassword || ""); }, [authOwnerPassword]);
  useEffect(() => { setDraftAuthEmployeePins({ ...(authEmployeePins || {}) }); }, [authEmployeePins]);

  const showSettingsSaved = () => { setSettingsSuccess(true); window.setTimeout(() => setSettingsSuccess(false), 2200); };
  const saveOwnerProfile = () => {
    const name = draftOwnerName.trim();
    if (!name) return;
    setOwnerProfile({ ...ownerProfile, name });
    showSettingsSaved();
  };
  const saveAuthCredentials = () => {
    const ownerUsername = draftAuthOwnerUsername.trim();
    const ownerPassword = draftAuthOwnerPassword.trim();
    if (!ownerUsername || !ownerPassword) {
      setSettingsNotice(lang === "ar" ? "اسم المستخدم وكلمة المرور للمالك مطلوبان." : "Owner username and password are required.");
      return;
    }
    setAuthOwnerUsername(ownerUsername);
    setAuthOwnerPassword(ownerPassword);
    setAuthEmployeePins(draftAuthEmployeePins || {});
    setSettingsNotice("");
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
  const saveManagingTeam = async () => {
    if (!draftStaff || teamSaving) return;
    const nextStaff = draftStaff.map((person) => ({
      ...person,
      pin: draftAuthEmployeePins?.[person.id] || person.pin || "1234",
    }));
    const allowedIds = new Set(nextStaff.map((person) => person.id));
    const nextPins = Object.fromEntries(
      Object.entries({ ...(authEmployeePins || {}), ...(draftAuthEmployeePins || {}) })
        .filter(([personId]) => allowedIds.has(personId)),
    );
    setStaff(nextStaff);
    setAuthEmployeePins(nextPins);
    cancelManagingTeam();
    if (APP_IN_PRODUCTION_MODE && typeof onPersistSettingsNow === "function") {
      setTeamSaving(true);
      setSettingsNotice("");
      try {
        await onPersistSettingsNow({
          staff: nextStaff,
          authConfig: {
            ownerUsername: authOwnerUsername,
            ownerPassword: authOwnerPassword,
            employeePins: nextPins,
          },
        });
        showSettingsSaved();
      } catch (failure) {
        setSettingsNotice(
          failure instanceof Error && failure.message
            ? failure.message
            : (lang === "ar" ? "تعذر حفظ الفريق على الخادم." : "Failed to save team on server."),
        );
      } finally {
        setTeamSaving(false);
      }
      return;
    }
    showSettingsSaved();
  };
  const addStaff = () => {
    if (!newEmployeeName.trim() || newEmployeeStoreIds.length === 0 || !managingTeam) return;
    const newStaffId = `staff-${Date.now()}`;
    setDraftStaff((current) => [...(current || staff), { id: newStaffId, nameAr: newEmployeeName.trim(), nameEn: newEmployeeName.trim(), mobile: newEmployeeMobile.trim(), active: true, storeIds: newEmployeeStoreIds, pin: PROTOTYPE_EMPLOYEE_PIN_DEFAULT }]);
    setDraftAuthEmployeePins((current) => ({ ...(current || {}), [newStaffId]: PROTOTYPE_EMPLOYEE_PIN_DEFAULT || "1234" }));
    setNewEmployeeName(""); setNewEmployeeMobile(""); setNewEmployeeStoreIds([]);
  };
  const updateDraftEmployeePin = (personId, value) => {
    setDraftAuthEmployeePins((current) => ({ ...(current || {}), [personId]: value }));
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
      setDraftAuthEmployeePins((current) => {
        const next = { ...(current || {}) };
        delete next[deleteTarget.item.id];
        return next;
      });
      setAuthEmployeePins((current) => {
        const next = { ...(current || {}) };
        delete next[deleteTarget.item.id];
        return next;
      });
    }
    setDeleteTarget(null);
  };
  const deleteDialog = deleteTarget ? {
    title: deleteTarget.type === "archive" ? text(lang, "archiveStoreTitle") : deleteTarget.type === "store" ? text(lang, deleteTarget.hasRecords ? "storeDeleteWithDataTitle" : "storeDeleteEmptyTitle") : text(lang, deleteTarget.type === "channel" ? "channelDeleteTitle" : "userDeleteTitle"),
    desc: deleteTarget.type === "archive" ? text(lang, "archiveStoreDesc") : deleteTarget.type === "store" ? text(lang, deleteTarget.hasRecords ? "storeDeleteWithDataDesc" : "storeDeleteEmptyDesc") : text(lang, deleteTarget.type === "channel" ? "channelDeleteDesc" : "userDeleteDesc"),
    action: deleteTarget.type === "archive" ? text(lang, "confirmArchive") : deleteTarget.type === "store" ? text(lang, deleteTarget.hasRecords ? "archiveAndKeepData" : "deleteEmptyStore") : text(lang, deleteTarget.type === "channel" ? "retireChannel" : "revokeAccess"),
  } : null;
  const DeleteDialog = () => <AnimatePresence>{deleteDialog && <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 z-50 flex items-end bg-[#112A46]/45 sm:items-center sm:justify-center sm:p-6 lg:items-end lg:justify-start lg:p-0"><motion.div initial={{ y: 20 }} animate={{ y: 0 }} exit={{ y: 20 }} className="relative z-10 w-full rounded-t-[30px] bg-[#F8F6F0] p-5 pb-8 sm:max-w-[560px] sm:rounded-[30px] sm:p-6 lg:max-w-none lg:rounded-t-[30px] lg:rounded-b-none lg:p-5 lg:pb-8"><div className="mb-4 flex items-start justify-between"><div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#FFF1EE] text-[#B44747]"><Trash2 className="h-5 w-5" /></div><button onClick={() => setDeleteTarget(null)} className="flex h-9 w-9 items-center justify-center rounded-xl bg-white"><X className="h-4 w-4" /></button></div><h3 className="text-base font-black">{deleteDialog.title}</h3><p className="mt-2 text-taq-meta font-bold leading-6 text-[#716753]">{deleteDialog.desc}</p><div className="mt-4 rounded-2xl bg-[#FFF4D2] p-3 text-taq-meta font-bold leading-5 text-[#806528]">{text(lang, "safeDeleteNotice")}</div>{deleteTarget?.affectedStaff?.length > 0 && <div className="mt-3 rounded-2xl bg-[#FFF1EE] p-3 text-taq-meta font-bold leading-5 text-[#B44747]"><p>{text(lang, "archiveStaffWarning")}</p><p className="mt-1">{deleteTarget.affectedStaff.map((person) => lang === "ar" ? person.nameAr : person.nameEn).join(" · ")}</p></div>}<div className="mt-5 grid grid-cols-[0.9fr_1.35fr] gap-3"><button onClick={() => setDeleteTarget(null)} className="rounded-2xl bg-white py-3.5 text-xs font-black ring-1 ring-black/[0.06]">{text(lang, "cancel")}</button><button onClick={confirmDelete} className="rounded-2xl bg-[#B44747] py-3.5 text-xs font-black text-white">{deleteDialog.action}</button></div></motion.div></motion.div>}</AnimatePresence>;
  const Arrow = lang === "ar" ? ChevronLeft : ChevronRight;
  const SettingsLink = ({ icon: Icon, title, desc = "", value = "", onClick, danger = false, border = true }) => <button onClick={onClick} className={`flex w-full items-center gap-3 px-4 py-4 text-start ${border ? "border-b border-[#F0ECE2]" : ""}`}><span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl ${danger ? "bg-[#FFF1EE] text-[#B44747]" : "bg-[#F7F5EF] text-[#806528]"}`}><Icon className="h-5 w-5" /></span><span className="min-w-0 flex-1"><span className={`block text-taq-body-sm font-black ${danger ? "text-[#B44747]" : "text-[#112A46]"}`}>{title}</span>{desc && <span className="mt-0.5 block truncate text-taq-meta font-bold text-[#827762]">{desc}</span>}</span>{value && <span className="shrink-0 text-taq-meta font-bold text-[#827762]">{value}</span>}<Arrow className={`h-4 w-4 shrink-0 ${danger ? "text-[#B44747]" : "text-[#B99844]"}`} /></button>;
  const PageHeader = ({ title, onBack }) => <BackTitle lang={lang} title={title} onBack={onBack} />;

  if (settingsStoreId && selectedStore) {
    if (storePanel === "profile") return <motion.section initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="px-5 pb-24"><PageHeader title={lang === "ar" ? "بيانات المحل" : "Shop details"} onBack={backFromStorePanel} /><div className="rounded-3xl bg-white p-4 ring-1 ring-black/[0.045]"><p className="mb-2 text-xs font-bold text-[#716753]">{text(lang, "shopName")}</p><input value={draftStoreName} onChange={(event) => setDraftStoreName(event.target.value)} maxLength={80} className="mb-4 w-full rounded-2xl bg-[#F7F5EF] px-4 py-3 text-xs font-black outline-none" /><p className="mb-2 text-xs font-bold text-[#716753]">{text(lang, "newStoreLocation")}</p><input value={draftStoreLocation} onChange={(event) => setDraftStoreLocation(event.target.value)} maxLength={100} className="w-full rounded-2xl bg-[#F7F5EF] px-4 py-3 text-xs font-black outline-none" /><p className="mt-4 rounded-2xl bg-[#FFF4D2] p-3 text-taq-meta font-bold leading-5 text-[#806528]">{text(lang, "renameStoreHint")}</p><button disabled={!draftStoreName.trim()} onClick={saveStoreProfile} className={`mt-5 w-full rounded-2xl py-3.5 text-xs font-black text-white ${draftStoreName.trim() ? "bg-[#112A46]" : "bg-[#B8C0B7]"}`}>{text(lang, "saveSettings")}</button></div><DeleteDialog /></motion.section>;
    if (storePanel === "channels") return <motion.section initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="px-5 pb-24"><PageHeader title={text(lang, "salesChannels")} onBack={backFromStorePanel} /><p className="mb-3 rounded-2xl bg-[#FFF4D2] p-3 text-taq-meta font-bold leading-5 text-[#806528]">{text(lang, "channelControlHint")}</p><div className="mb-4 overflow-hidden rounded-3xl bg-white ring-1 ring-black/[0.045]">{visibleChannels.map((channel, index) => <div key={channel.id} className={`flex items-center justify-between gap-3 px-4 py-4 ${index < visibleChannels.length - 1 ? "border-b border-[#F0ECE2]" : ""}`}><div className="min-w-0"><p className="text-xs font-black">{channelName(channel, lang)}</p><p className="mt-1 text-taq-meta font-bold text-[#827762]">{channelConfig.activeIds.includes(channel.id) ? text(lang, "active") : text(lang, "stopChannel")}</p></div><div className="flex items-center gap-2"><SettingToggle enabled={channelConfig.activeIds.includes(channel.id)} onToggle={() => toggleChannel(channel.id)} /><button onClick={() => requestRetireChannel(channel)} className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#FFF1EE] text-[#B44747]"><Trash2 className="h-3.5 w-3.5" /></button></div></div>)}</div><div className="mb-4 rounded-3xl bg-white p-4 ring-1 ring-black/[0.045]"><p className="mb-3 text-xs font-black">{text(lang, "addChannel")}</p><div className="flex gap-2"><input value={newChannelName} onChange={(event) => setNewChannelName(event.target.value)} placeholder={text(lang, "newChannelName")} className="min-w-0 flex-1 rounded-2xl bg-[#F7F5EF] px-3 py-3 text-xs font-bold outline-none" /><button onClick={addSalesChannel} className="rounded-2xl bg-[#112A46] px-4 text-xs font-black text-white"><Plus className="h-4 w-4" /></button></div>{retiredChannels.length > 0 && <div className="mt-4 border-t border-[#F0ECE2] pt-4"><p className="mb-2 text-taq-meta font-bold text-[#827762]">{text(lang, "stoppedChannels")}</p>{retiredChannels.map((channel) => <button key={channel.id} onClick={() => restoreSalesChannel(channel)} className="mb-2 flex w-full items-center justify-between rounded-xl bg-[#F7F5EF] px-3 py-3 text-taq-meta font-black text-[#257844]"><span>{channelName(channel, lang)}</span><span>{text(lang, "restoreChannel")}</span></button>)}</div>}</div>{settingsNotice && <p className="mb-3 rounded-xl bg-[#FFF1EE] p-3 text-taq-meta font-bold text-[#B44747]">{settingsNotice}</p>}<div className="grid grid-cols-[0.9fr_1.35fr] gap-3"><button onClick={backFromStorePanel} className="rounded-2xl bg-white py-3.5 text-xs font-black ring-1 ring-black/[0.05]">{text(lang, "cancelChanges")}</button><button onClick={saveChannelSettings} className="rounded-2xl bg-[#112A46] py-3.5 text-xs font-black text-white">{text(lang, "saveSettings")}</button></div><DeleteDialog /></motion.section>;
    if (storePanel === "expenses") return <motion.section initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="px-5 pb-24"><PageHeader title={text(lang, "outflowCategories")} onBack={backFromStorePanel} /><p className="mb-3 rounded-2xl bg-[#FFF4D2] p-3 text-taq-meta font-bold leading-5 text-[#806528]">{lang === "ar" ? "تظهر هذه البنود عند اختيار نوع العملية: مصروف. إيقاف البند لا يغير التقارير السابقة." : "These items appear only for Expense entries. Disabling an item does not change historical reports."}</p><div className="mb-4 overflow-hidden rounded-3xl bg-white ring-1 ring-black/[0.045]">{expenseCategories.map((item, index) => <div key={item.id} className={`flex items-center justify-between px-4 py-4 ${index < expenseCategories.length - 1 ? "border-b border-[#F0ECE2]" : ""}`}><p className="text-xs font-black">{text(lang, item.label)}</p><SettingToggle enabled={operationalConfig.activeCategories.includes(item.id)} onToggle={() => toggleCategory(item.id)} /></div>)}</div>{settingsNotice && <p className="mb-3 rounded-xl bg-[#FFF1EE] p-3 text-taq-meta font-bold text-[#B44747]">{settingsNotice}</p>}<p className="mb-4 text-taq-meta font-bold leading-5 text-[#827762]">{lang === "ar" ? "إضافة بنود مخصصة ستنفذ في النسخة الإنتاجية بعد بناء نموذج البيانات الموحد." : "Custom expense items will be implemented in the production build with the unified data model."}</p><div className="grid grid-cols-[0.9fr_1.35fr] gap-3"><button onClick={backFromStorePanel} className="rounded-2xl bg-white py-3.5 text-xs font-black ring-1 ring-black/[0.05]">{text(lang, "cancelChanges")}</button><button onClick={saveOperationalSettings} className="rounded-2xl bg-[#112A46] py-3.5 text-xs font-black text-white">{text(lang, "saveSettings")}</button></div></motion.section>;
    if (storePanel === "review") return <motion.section initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="px-5 pb-24"><PageHeader title={lang === "ar" ? "مراجعة الصور والتنبيهات" : "Photo review & notifications"} onBack={backFromStorePanel} /><div className="mb-4 overflow-hidden rounded-3xl bg-white ring-1 ring-black/[0.045]"><SettingRow border title={text(lang, "reviewWorkflow")} desc={text(lang, "reviewWorkflowDesc")} toggle={<SettingToggle enabled={operationalConfig.reviewEnabled} onToggle={() => updateOperationalDraft({ reviewEnabled: !operationalConfig.reviewEnabled })} />} /><SettingRow border title={lang === "ar" ? "مراجعة تقفيلات الموظفين" : "Employee closeout review"} desc={lang === "ar" ? "عند التفعيل يجب على المالك اعتماد أو إرجاع تقفيلة اليوم قبل اعتبارها نهائية. الافتراضي: معطّل." : "When enabled, owner must approve or return employee daily closeouts. Default: off."} toggle={<SettingToggle enabled={operationalConfig.closeoutReviewEnabled} onToggle={() => updateOperationalDraft({ closeoutReviewEnabled: !operationalConfig.closeoutReviewEnabled })} />} /><SettingRow border title={text(lang, "pendingAttachmentAlert")} desc={text(lang, "pendingAttachmentAlertDesc")} toggle={<SettingToggle disabled={!operationalConfig.reviewEnabled} enabled={operationalConfig.attachmentAlert} onToggle={() => updateOperationalDraft({ attachmentAlert: !operationalConfig.attachmentAlert })} />} /><SettingRow title={text(lang, "dailyCloseoutAlert")} desc={text(lang, "dailyCloseoutAlertPrototype")} toggle={<SettingToggle enabled={operationalConfig.closeoutAlert} onToggle={() => updateOperationalDraft({ closeoutAlert: !operationalConfig.closeoutAlert })} />} /></div><EmployeeHistoryVisibilityPicker lang={lang} value={operationalConfig.employeeHistoryVisibility || "all"} onChange={(next) => updateOperationalDraft({ employeeHistoryVisibility: next })} /><div className="mb-4 rounded-3xl bg-white p-4 ring-1 ring-black/[0.045]"><p className="mb-2 text-xs font-black">{lang === "ar" ? "شكل دفتر هذا المحل" : "This store notebook theme"}</p><ThemePicker lang={lang} theme={operationalConfig.notebookTheme || notebookTheme} onChange={(nextTheme) => updateOperationalDraft({ notebookTheme: nextTheme })} /><p className="mt-3 text-taq-meta font-bold leading-5 text-[#806528]">{lang === "ar" ? "يُستخدم في واجهة الموظف لهذا المحل ما لم يغيّر الموظف لونه الشخصي." : "Used for this store's employee UI unless the employee picks a personal theme."}</p></div><div className="grid grid-cols-[0.9fr_1.35fr] gap-3"><button onClick={backFromStorePanel} className="rounded-2xl bg-white py-3.5 text-xs font-black ring-1 ring-black/[0.05]">{text(lang, "cancelChanges")}</button><button onClick={saveOperationalSettings} className="rounded-2xl bg-[#112A46] py-3.5 text-xs font-black text-white">{text(lang, "saveSettings")}</button></div></motion.section>;
    if (storePanel === "staff") return <motion.section initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="px-5 pb-24"><PageHeader title={text(lang, "linkedEmployees")} onBack={backFromStorePanel} /><div className="mb-4 rounded-3xl bg-white p-4 ring-1 ring-black/[0.045]">{linkedStaff.length ? linkedStaff.map((person, index) => <div key={person.id} className={`flex items-center gap-3 py-3 ${index < linkedStaff.length - 1 ? "border-b border-[#F0ECE2]" : ""}`}><UserRound className="h-5 w-5 text-[#806528]" /><div><p className="text-xs font-black">{lang === "ar" ? person.nameAr : person.nameEn}</p><p dir="ltr" className="text-taq-meta text-[#827762]">{person.mobile}</p></div></div>) : <p className="text-xs font-bold text-[#827762]">{text(lang, "noLinkedEmployees")}</p>}</div><button onClick={() => { closeStore(); setSection("team"); }} className="w-full rounded-2xl bg-[#112A46] py-3.5 text-xs font-black text-white">{lang === "ar" ? "إدارة الفريق والصلاحيات" : "Manage team access"}</button></motion.section>;
    return <motion.section initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="px-5 pb-24"><PageHeader title={text(lang, "storeSettings")} onBack={closeStore} /><div className="mb-5 rounded-3xl bg-white p-4 ring-1 ring-black/[0.045]"><div className="flex items-center gap-3"><div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#112A46] text-[#E4B84A]"><Building2 className="h-6 w-6" /></div><div className="min-w-0 flex-1"><p className="truncate text-sm font-black">{displayBusinessName(selectedStore)}</p><p className="mt-1 truncate text-taq-meta font-bold text-[#827762]">{displayLocation(selectedStore)}</p></div><Badge tone={archived ? "warning" : "success"}>{text(lang, archived ? "archivedStore" : "storeActive")}</Badge></div></div><div className="mb-5 overflow-hidden rounded-3xl bg-white ring-1 ring-black/[0.045]"><SettingsLink icon={Building2} title={lang === "ar" ? "بيانات المحل" : "Shop details"} desc={displayLocation(selectedStore)} onClick={() => openStorePanel("profile")} /><SettingsLink icon={CreditCard} title={text(lang, "salesChannels")} value={`${activeChannelCount}`} onClick={() => openStorePanel("channels")} /><SettingsLink icon={ReceiptText} title={text(lang, "outflowCategories")} value={`${activeCategoryCount}`} onClick={() => openStorePanel("expenses")} /><SettingsLink icon={Bell} title={lang === "ar" ? "مراجعة الصور والتنبيهات" : "Photo review & notifications"} value={operationalConfig.reviewEnabled ? text(lang, "active") : text(lang, "stopChannel")} onClick={() => openStorePanel("review")} /><SettingsLink icon={UserRound} title={text(lang, "linkedEmployees")} value={`${linkedStaff.length}`} onClick={() => openStorePanel("staff")} border={false} /></div>{archived && <div className="mb-5 rounded-3xl bg-[#FFF4D2] p-4"><Badge tone="warning">{text(lang, "archivedReadOnly")}</Badge><p className="mt-3 text-taq-meta font-bold text-[#806528]">{text(lang, "archiveNotice")}</p><div className="mt-4 grid grid-cols-2 gap-2"><button onClick={() => { setArchivedReadOnlyBusinessId(selectedStore.id); setSelectedBusiness(selectedStore.id); setOwnerPage("reports"); }} className="rounded-xl bg-white py-3 text-taq-meta font-black">{text(lang, "viewPastReports")}</button><button onClick={() => { setArchivedReadOnlyBusinessId(selectedStore.id); setSelectedBusiness(selectedStore.id); setOwnerPage("register"); }} className="rounded-xl bg-white py-3 text-taq-meta font-black">{text(lang, "viewPastAttachments")}</button></div></div>}<p className="mb-2 text-xs font-bold text-[#716753]">{lang === "ar" ? "الإدارة" : "Management"}</p>{archived ? <button onClick={() => toggleArchive(selectedStore.id)} className="w-full rounded-2xl bg-white py-3.5 text-xs font-black text-[#257844] ring-1 ring-black/[0.05]">{text(lang, "storeActive")}</button> : <div className="flex gap-3"><button onClick={() => requestArchiveStore(selectedStore)} className="flex-1 rounded-2xl bg-white py-3.5 text-xs font-black text-[#B96725] ring-1 ring-black/[0.05]">{text(lang, "archiveStore")}</button><button onClick={() => openStoreDelete(selectedStore)} className="flex-1 rounded-2xl bg-[#FFF1EE] py-3.5 text-xs font-black text-[#B44747]">{text(lang, "deleteStore")}</button></div>}{settingsSuccess && <div className="mt-4 rounded-2xl bg-[#E6F5E9] p-3 text-center text-taq-meta font-black text-[#257844]">{text(lang, "changesSaved")}</div>}<DeleteDialog /></motion.section>;
  }

  if (section === "account") {
    const ownerProfileDirty = draftOwnerName.trim() && draftOwnerName.trim() !== ownerProfile?.name;
    const authDirty = draftAuthOwnerUsername.trim() !== (authOwnerUsername || "")
      || draftAuthOwnerPassword.trim() !== (authOwnerPassword || "");
    return (
      <motion.section initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="px-5 pb-24">
        <PageHeader title={text(lang, "myAccountSecurity")} onBack={() => setSection("home")} />
        <div className="mb-5 rounded-3xl bg-white p-4 ring-1 ring-black/[0.045]">
          <p className="mb-2 text-xs font-bold text-[#716753]">{text(lang, "ownerFullName")}</p>
          <input
            value={draftOwnerName}
            onChange={(event) => setDraftOwnerName(event.target.value)}
            maxLength={80}
            className="w-full rounded-2xl bg-[#F7F5EF] px-4 py-3 text-xs font-black outline-none"
          />
          <p className="mt-4 rounded-2xl bg-[#FFF4D2] p-3 text-taq-meta font-bold leading-5 text-[#806528]">
            {text(lang, "ownerRenameProfileHint")}
          </p>
          <button
            disabled={!ownerProfileDirty}
            onClick={saveOwnerProfile}
            className={`mt-5 w-full rounded-2xl py-3.5 text-xs font-black text-white ${ownerProfileDirty ? "bg-[#112A46]" : "bg-[#B8C0B7]"}`}
          >
            {text(lang, "saveAccountSettings")}
          </button>
        </div>

        <div className="mb-5 rounded-3xl bg-white p-4 ring-1 ring-black/[0.045]">
          <p className="mb-2 text-xs font-bold text-[#716753]">
            {lang === "ar" ? "بيانات دخول المالك" : "Owner login credentials"}
          </p>
          <input
            dir="ltr"
            value={draftAuthOwnerUsername}
            onChange={(event) => setDraftAuthOwnerUsername(event.target.value)}
            placeholder={lang === "ar" ? "اسم المستخدم" : "Username"}
            className="mb-2 w-full rounded-2xl bg-[#F7F5EF] px-4 py-3 text-xs font-black outline-none"
          />
          <input
            dir="ltr"
            type="password"
            value={draftAuthOwnerPassword}
            onChange={(event) => setDraftAuthOwnerPassword(event.target.value)}
            placeholder={lang === "ar" ? "كلمة المرور" : "Password"}
            className="w-full rounded-2xl bg-[#F7F5EF] px-4 py-3 text-xs font-black outline-none"
          />
          <p className="mt-4 rounded-2xl bg-[#FFF4D2] p-3 text-taq-meta font-bold leading-5 text-[#806528]">
            {lang === "ar"
              ? "يتم حفظها في إعدادات التشغيل على الخادم ويمكن تعديلها لاحقًا."
              : "Stored in server runtime settings and can be changed later."}
          </p>
          <button
            disabled={!authDirty && !ownerProfileDirty}
            onClick={saveAuthCredentials}
            className={`mt-5 w-full rounded-2xl py-3.5 text-xs font-black text-white ${authDirty || ownerProfileDirty ? "bg-[#112A46]" : "bg-[#B8C0B7]"}`}
          >
            {lang === "ar" ? "حفظ بيانات الدخول" : "Save login credentials"}
          </button>
          {settingsNotice && <p className="mt-3 rounded-xl bg-[#FFF1EE] p-2.5 text-center text-taq-meta font-bold text-[#B44747]">{settingsNotice}</p>}
          {settingsSuccess && <div className="mt-4 rounded-xl bg-[#E6F5E9] p-3 text-center text-taq-meta font-black text-[#257844]">{text(lang, "changesSaved")}</div>}
        </div>
      </motion.section>
    );
  }
  if (section === "stores") return <motion.section initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="px-5 pb-24"><PageHeader title={lang === "ar" ? "المحلات" : "Shops"} onBack={() => setSection("home")} /><div className="mb-3 flex items-center justify-between"><p className="text-xs font-bold text-[#716753]">{text(lang, "activeStores")}</p><button onClick={() => setShowAddStore(!showAddStore)} className="flex items-center gap-1 text-taq-meta font-black text-[#9A823E]"><Plus className="h-3.5 w-3.5" />{text(lang, "addStore")}</button></div>{showAddStore && <div className="mb-4 rounded-3xl bg-white p-4 ring-1 ring-black/[0.045]"><input value={newStoreName} onChange={(event) => setNewStoreName(event.target.value)} placeholder={text(lang, "newStoreName")} className="mb-2 w-full rounded-2xl bg-[#F7F5EF] px-4 py-3 text-xs font-bold outline-none" /><input value={newStoreLocation} onChange={(event) => setNewStoreLocation(event.target.value)} placeholder={text(lang, "newStoreLocation")} className="mb-4 w-full rounded-2xl bg-[#F7F5EF] px-4 py-3 text-xs font-bold outline-none" /><button onClick={addStore} className="w-full rounded-2xl bg-[#112A46] py-3 text-xs font-black text-white">{text(lang, "confirmAddStore")}</button></div>}<div className="mb-4 overflow-hidden rounded-3xl bg-white ring-1 ring-black/[0.045]">{activeStoredBusinesses.length ? activeStoredBusinesses.map((business, index) => <button key={business.id} onClick={() => openStore(business.id)} className={`flex w-full items-center justify-between px-4 py-4 text-start ${index < activeStoredBusinesses.length - 1 ? "border-b border-[#F0ECE2]" : ""}`}><div><p className="text-xs font-black">{displayBusinessName(business)}</p><p className="mt-1 text-taq-meta font-bold text-[#827762]">{displayLocation(business)} · <span className="text-[#257844]">{text(lang, "storeActive")}</span></p></div><Arrow className="h-4 w-4 text-[#B99844]" /></button>) : <p className="p-5 text-center text-xs font-bold text-[#827762]">{text(lang, "noActiveStores")}</p>}</div>{archivedStoredBusinesses.length > 0 && <><button onClick={() => setShowArchivedStores(!showArchivedStores)} className="mb-3 flex items-center gap-1 text-taq-meta font-black text-[#9A823E]">{text(lang, showArchivedStores ? "hideArchived" : "showArchived")} ({archivedStoredBusinesses.length})<ChevronDown className={`h-3.5 w-3.5 ${showArchivedStores ? "rotate-180" : ""}`} /></button>{showArchivedStores && <div className="overflow-hidden rounded-3xl bg-white ring-1 ring-black/[0.045]">{archivedStoredBusinesses.map((business) => <button key={business.id} onClick={() => openStore(business.id)} className="flex w-full items-center justify-between px-4 py-4 text-start opacity-70"><div><p className="text-xs font-black">{displayBusinessName(business)}</p><p className="mt-1 text-taq-meta font-bold text-[#B96725]">{text(lang, "archivedStore")}</p></div><Arrow className="h-4 w-4" /></button>)}</div>}</>}<DeleteDialog /></motion.section>;
  if (section === "team") {
    return (
      <motion.section initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="px-5 pb-24">
        <PageHeader title={lang === "ar" ? "الفريق والصلاحيات" : "Team & access"} onBack={() => { cancelManagingTeam(); setSection("home"); }} />
        <div className="mb-3 flex items-center justify-between">
          <p className="text-taq-meta font-bold text-[#806528]">{text(lang, "employeeEntryOnly")}</p>
          <button onClick={() => managingTeam ? cancelManagingTeam() : startManagingTeam()} className="text-taq-meta font-black text-[#9A823E]">
            {text(lang, managingTeam ? "cancelChanges" : "configure")}
          </button>
        </div>
        <div className="mb-4 overflow-hidden rounded-3xl bg-white ring-1 ring-black/[0.045]">
          {visibleStaff.map((person, index) => (
            <div key={person.id} className={`p-4 ${index < visibleStaff.length - 1 || managingTeam ? "border-b border-[#F0ECE2]" : ""}`}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-black">{lang === "ar" ? person.nameAr : person.nameEn}</p>
                  <p className="mt-1 text-taq-meta font-bold text-[#827762]">
                    {person.active ? text(lang, "active") : text(lang, "stopChannel")} · {employeeStoreIds(person).length} {lang === "ar" ? "محل" : "shop(s)"}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <SettingToggle disabled={!managingTeam} enabled={person.active} onToggle={() => toggleEmployeeActive(person.id)} />
                  {managingTeam && (
                    <button onClick={() => setDeleteTarget({ type: "staff", item: person })} className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#FFF1EE] text-[#B44747]">
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              </div>
              {managingTeam && (
                <>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {activeStoredBusinesses.map((business) => (
                      <button key={business.id} onClick={() => toggleEmployeeStore(person.id, business.id)} className={`rounded-full px-3 py-2 text-taq-meta font-bold ${employeeStoreIds(person).includes(business.id) ? "bg-[#112A46] text-white" : "bg-[#F0ECE2] text-[#827762]"}`}>
                        {displayBusinessName(business)}
                      </button>
                    ))}
                  </div>
                  <div className="mt-3">
                    <p className="mb-2 text-xs font-black text-[#716753]">{lang === "ar" ? "الرقم السري للموظف" : "Employee PIN"}</p>
                    <input
                      dir="ltr"
                      value={draftAuthEmployeePins?.[person.id] || ""}
                      onChange={(event) => updateDraftEmployeePin(person.id, event.target.value)}
                      placeholder={lang === "ar" ? "PIN أو كلمة مرور قصيرة" : "PIN or short passcode"}
                      className="w-full rounded-2xl bg-[#F7F5EF] px-4 py-3 text-xs font-black outline-none"
                    />
                  </div>
                </>
              )}
            </div>
          ))}
          {managingTeam && (
            <div className="p-4">
              <p className="mb-3 text-xs font-black">{text(lang, "addEmployee")}</p>
              <input value={newEmployeeName} onChange={(event) => setNewEmployeeName(event.target.value)} placeholder={text(lang, "newEmployeeName")} className="mb-2 w-full rounded-2xl bg-[#F7F5EF] px-4 py-3 text-xs font-bold outline-none" />
              <input value={newEmployeeMobile} onChange={(event) => setNewEmployeeMobile(event.target.value)} placeholder={text(lang, "employeeMobile")} className="mb-3 w-full rounded-2xl bg-[#F7F5EF] px-4 py-3 text-xs font-bold outline-none" />
              <div className="mb-3 flex flex-wrap gap-2">
                {activeStoredBusinesses.map((business) => (
                  <button key={business.id} onClick={() => toggleNewEmployeeStore(business.id)} className={`rounded-full px-3 py-2 text-taq-meta font-bold ${newEmployeeStoreIds.includes(business.id) ? "bg-[#112A46] text-white" : "bg-[#F0ECE2] text-[#827762]"}`}>
                    {displayBusinessName(business)}
                  </button>
                ))}
              </div>
              <button disabled={!newEmployeeName.trim() || !newEmployeeStoreIds.length} onClick={addStaff} className={`w-full rounded-2xl py-3 text-xs font-black text-white ${newEmployeeName.trim() && newEmployeeStoreIds.length ? "bg-[#112A46]" : "bg-[#B8C0B7]"}`}>
                {text(lang, "addEmployee")}
              </button>
            </div>
          )}
        </div>
        {managingTeam && (
          <div className="grid grid-cols-[0.9fr_1.35fr] gap-3">
            <button onClick={cancelManagingTeam} className="rounded-2xl bg-white py-3.5 text-xs font-black ring-1 ring-black/[0.05]">{text(lang, "cancelChanges")}</button>
            <button type="button" disabled={teamSaving} onClick={() => { void saveManagingTeam(); }} className={`rounded-2xl py-3.5 text-xs font-black text-white ${teamSaving ? "bg-[#B8C0B7]" : "bg-[#112A46]"}`}>{text(lang, "saveTeamChanges")}</button>
          </div>
        )}
        <DeleteDialog />
      </motion.section>
    );
  }
  if (section === "appearance") return <motion.section initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="px-5 pb-24"><PageHeader title={text(lang, "notebookAppearance")} onBack={() => setSection("home")} /><div className="rounded-3xl bg-white p-4 ring-1 ring-black/[0.045]"><p className="mb-2 text-taq-meta font-bold text-[#827762]">{lang === "ar" ? "اختر شكل دفتر التقفيلة والتقارير وصور المشاركة." : "Choose the notebook style for closeouts, reports, and sharing."}</p><ThemePicker lang={lang} theme={draftNotebookTheme} onChange={(nextTheme) => { setDraftNotebookTheme(nextTheme); setThemeDirty(nextTheme !== notebookTheme); }} /><p className="mt-4 rounded-2xl bg-[#FFF4D2] p-3 text-taq-meta font-bold leading-5 text-[#806528]">{text(lang, "autoSavedAccount")}</p>{themeDirty && <div className="mt-4 grid grid-cols-[0.9fr_1.35fr] gap-3"><button onClick={() => { setDraftNotebookTheme(notebookTheme); setThemeDirty(false); }} className="rounded-2xl bg-[#F7F5EF] py-3 text-xs font-black">{text(lang, "cancelChanges")}</button><button onClick={() => { setNotebookTheme(draftNotebookTheme); setThemeDirty(false); showSettingsSaved(); }} className="rounded-2xl bg-[#112A46] py-3 text-xs font-black text-white">{text(lang, "saveSettings")}</button></div>}{settingsSuccess && <div className="mt-4 rounded-xl bg-[#E6F5E9] p-3 text-center text-taq-meta font-black text-[#257844]">{text(lang, "changesSaved")}</div>}</div></motion.section>;
  if (section === "subscription") return APP_IN_PRODUCTION_MODE ? <motion.section initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="px-5 pb-24"><PageHeader title={lang === "ar" ? "الخطة والاشتراك" : "Plan & subscription"} onBack={() => setSection("home")} /><div className="rounded-3xl bg-white p-5 ring-1 ring-black/[0.045]"><Badge tone="warning">{lang === "ar" ? "معطّل حاليًا" : "Disabled for now"}</Badge><p className="mt-4 text-taq-meta font-bold leading-6 text-[#716753]">{lang === "ar" ? "تم تعطيل SaaS في مرحلة الإطلاق الحالية. سيتم تفعيله لاحقًا دون التأثير على تشغيل المحلات." : "SaaS billing is disabled for the current launch phase and will be enabled later without affecting store operations."}</p></div></motion.section> : <motion.section initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="px-5 pb-24"><PageHeader title={lang === "ar" ? "الخطة والاشتراك" : "Plan & subscription"} onBack={() => setSection("home")} /><div className="rounded-3xl bg-white p-5 ring-1 ring-black/[0.045]"><Badge tone="navy">{text(lang, "currentPlan")}</Badge><h3 className="mt-4 text-lg font-black">{lang === "ar" ? "نسخة التطوير الحالية" : "Current development access"}</h3><p className="mt-2 text-taq-meta font-bold leading-6 text-[#716753]">{text(lang, "monthlyPrice")}</p><div className="mt-5 rounded-2xl bg-[#FFF4D2] p-4 text-taq-meta font-bold leading-6 text-[#806528]">{lang === "ar" ? "سيتم ربط الاشتراك بالمنشأة وليس بالمحل، مع تحديد عدد المحلات والموظفين وميزات التصدير لاحقًا." : "Subscription will be tied to the organization, not an individual shop, with plan limits added later."}</div></div></motion.section>;
  if (section === "support") return <motion.section initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="px-5 pb-24"><PageHeader title={text(lang, "support")} onBack={() => setSection("home")} /><div className="overflow-hidden rounded-3xl bg-white ring-1 ring-black/[0.045]"><SettingsLink icon={Smartphone} title={text(lang, "whatsappSupport")} onClick={onOpenSupport} border /><SettingsLink icon={FileText} title={text(lang, "helpCenter")} onClick={onOpenHelp} border={false} /></div></motion.section>;
  return <motion.section initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="px-5 pb-24"><div className="mb-5"><p className="text-xs font-bold text-[#8B8274]">{text(lang, "ownerAccount")}</p><h1 className="text-xl font-black">{text(lang, "settings")}</h1></div><button onClick={() => setSection("account")} className="mb-5 flex w-full items-center gap-4 rounded-3xl bg-white p-4 text-start ring-1 ring-black/[0.045]"><div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#112A46] text-white"><UserRound className="h-6 w-6" /></div><div className="min-w-0 flex-1"><p className="text-sm font-black">{ownerProfile?.name || text(lang, "ownerName")}</p><p className="mt-1 text-taq-meta font-bold text-[#827762]">{text(lang, "myAccountSecurity")}</p></div><Arrow className="h-4 w-4 shrink-0 text-[#B99844]" /></button><p className="mb-2 text-xs font-bold text-[#716753]">{lang === "ar" ? "المنشأة" : "Organization"}</p><div className="mb-5 overflow-hidden rounded-3xl bg-white ring-1 ring-black/[0.045]"><SettingsLink icon={Building2} title={lang === "ar" ? "المحلات" : "Shops"} value={`${activeStoredBusinesses.length}`} onClick={() => setSection("stores")} /><SettingsLink icon={UserRound} title={lang === "ar" ? "الفريق والصلاحيات" : "Team & access"} value={`${visibleStaff.length}`} onClick={() => setSection("team")} />{APP_IN_PRODUCTION_MODE ? null : <SettingsLink icon={CreditCard} title={lang === "ar" ? "الخطة والاشتراك" : "Plan & subscription"} value={lang === "ar" ? "تجريبي" : "Trial"} onClick={() => setSection("subscription")} border={false} />}</div><p className="mb-2 text-xs font-bold text-[#716753]">{lang === "ar" ? "التفضيلات" : "Preferences"}</p><div className="mb-5 overflow-hidden rounded-3xl bg-white ring-1 ring-black/[0.045]"><SettingsLink icon={ReceiptText} title={text(lang, "notebookAppearance")} value={text(lang, notebookTheme)} onClick={() => setSection("appearance")} border={false} /></div><p className="mb-2 text-xs font-bold text-[#716753]">{text(lang, "support")}</p><div className="overflow-hidden rounded-3xl bg-white ring-1 ring-black/[0.045]"><SettingsLink icon={Smartphone} title={text(lang, "contactSupport")} onClick={() => setSection("support")} /><SettingsLink icon={UserRound} title={text(lang, "logout")} onClick={onLogout} danger border={false} /></div></motion.section>;
}

function SettingRow({ title, desc, toggle, border }) { return <div className={`flex items-center justify-between px-4 py-4 ${border ? "border-b border-[#F0ECE2]" : ""}`}><div><p className="text-sm font-black">{title}</p><p className="mt-1 text-taq-meta text-[#827762]">{desc}</p></div>{toggle}</div>; }
function ActionRow({ label, lang, danger = false, border = false, onClick = () => {} }) { const Arrow = lang === "ar" ? ChevronLeft : ChevronRight; return <button type="button" onClick={onClick} className={`flex w-full items-center justify-between px-4 py-4 text-sm font-black ${border ? "border-b border-[#F0ECE2]" : ""} ${danger ? "text-[#B44747]" : "text-[#112A46]"}`}><span>{label}</span><Arrow className="h-4 w-4" /></button>; }

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
            <span className={`max-w-[50px] text-center text-taq-nav font-bold leading-3 ${active ? "text-[#112A46]" : "text-[#827762]"}`}>{text(lang, item.label)}</span>
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
  return <div className="flex w-full items-end justify-between"><span className="text-taq-body-sm font-medium">{label}</span><strong className={`tabular-nums text-taq-body font-bold ${valueClassName}`}><MoneyValue value={value} /></strong></div>;
}

function FinancialRows({ lang, rows = [] }) {
  return (
    <div className="grid w-full grid-cols-[minmax(0,1fr)_max-content] items-baseline">
      {rows.map((row) => (
        <React.Fragment key={row.id || row.label}>
          <div className="flex h-[44px] min-w-0 items-end pb-[8px] text-taq-body-sm font-medium text-[#112A46]">
            <span className="truncate">{row.label}</span>
          </div>
          <strong
            dir="ltr"
            className={`flex h-[44px] min-w-[76px] items-end whitespace-nowrap pb-[8px] tabular-nums text-taq-body font-bold ${lang === "ar" ? "justify-start ps-4" : "justify-end pe-4"} ${row.valueClassName || "text-[#112A46]"}`}
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
      {!compact && <p className="mb-1 text-taq-meta font-bold text-[#806528]">{text(lang, promptKey)}</p>}
      <button onClick={openCalendar} className={compact ? "flex items-center justify-center gap-3 pb-1 text-taq-meta font-black text-[#112A46]" : "flex max-w-[145px] items-center gap-1 pb-1 text-taq-meta font-black text-[#112A46]"}>
        {compact && <ChevronDown className="h-3.5 w-3.5 shrink-0" />}
        <span className="truncate">{selectedLabel}</span>
        {compact ? <CalendarDays className="h-4 w-4 shrink-0" /> : <ChevronDown className="h-3.5 w-3.5 shrink-0" />}
      </button>
      <AnimatePresence>
        {open && (
          <motion.div initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -5 }} className={`absolute z-40 w-[270px] rounded-2xl bg-[#FFFDF7] p-3 shadow-xl ring-1 ring-[#D8CCA8] ${compact ? "left-1/2 top-10 -translate-x-1/2" : "end-0 top-12"}`}>
            <div className={`mb-3 grid gap-1 ${modes.length === 4 ? "grid-cols-4" : "grid-cols-2"}`}>
              {modes.map((mode) => <button key={mode.id} onClick={() => setPeriod(mode.id)} className={`rounded-lg py-2 text-taq-meta font-bold ${period === mode.id ? "bg-[#112A46] text-white" : "text-[#806528]"}`}>{text(lang, mode.label)}</button>)}
            </div>
            {period === "day" && <div>
              <div className="mb-3 flex items-center justify-between">
                <button onClick={previousMonth} title={text(lang, "previousMonth")} className="flex h-8 w-8 items-center justify-center rounded-xl text-[#806528] hover:bg-[#FFF0CB]"><ChevronRight className={`h-4 w-4 ${lang === "en" ? "rotate-180" : ""}`} /></button>
                <strong className="text-taq-meta">{formatCalendarMonth(calendarView.year, calendarView.month, lang)}</strong>
                <button onClick={nextMonth} title={text(lang, "nextMonth")} className="flex h-8 w-8 items-center justify-center rounded-xl text-[#806528] hover:bg-[#FFF0CB]"><ChevronLeft className={`h-4 w-4 ${lang === "en" ? "rotate-180" : ""}`} /></button>
              </div>
              <div className="mb-2 grid grid-cols-7 text-center text-taq-meta font-bold text-[#957D43]">{weekDays.map((item, index) => <span key={`${item}-${index}`}>{item}</span>)}</div>
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
                {yearMonths.map((month) => <button key={month.value} onClick={() => { setSelectedMonth(month.value); setOpen(false); }} className={`rounded-xl px-1 py-2.5 text-taq-meta font-bold ${monthSelectionValue(selectedMonth) === month.value ? "bg-[#FFF0CB] text-[#B44747] ring-1 ring-[#B44747]/20" : "bg-white text-[#716753] ring-1 ring-black/[0.05]"}`}>{month.label}</button>)}
              </div>
            </div>}
            {period === "year" && <div className="grid grid-cols-2 gap-2">{["2026", "2025"].map((year) => <button key={year} onClick={() => { setSelectedYear(year); setOpen(false); }} className={`rounded-xl py-3 text-xs font-bold ${selectedYear === year ? "bg-[#FFF0CB] text-[#B44747] ring-1 ring-[#B44747]/20" : "bg-white text-[#716753] ring-1 ring-black/[0.05]"}`}>{year}</button>)}</div>}
            {period === "custom" && <div><div className="grid grid-cols-2 gap-2"><label className="rounded-xl bg-[#F7F5EF] p-2 text-taq-nav font-bold text-[#806528]">{text(lang, "fromDate")}<input dir="ltr" type="date" value={draftCustomFrom} onChange={(event) => setDraftCustomFrom(event.target.value)} className="mt-1 block w-full bg-transparent text-taq-meta font-bold text-[#112A46] outline-none" /></label><label className="rounded-xl bg-[#F7F5EF] p-2 text-taq-nav font-bold text-[#806528]">{text(lang, "toDate")}<input dir="ltr" type="date" value={draftCustomTo} onChange={(event) => setDraftCustomTo(event.target.value)} className="mt-1 block w-full bg-transparent text-taq-meta font-bold text-[#112A46] outline-none" /></label></div>{invalidCustomRange && <p className="mt-2 rounded-lg bg-[#FFF1EE] p-2 text-taq-nav font-bold text-[#B44747]">{text(lang, "invalidDateRange")}</p>}<button disabled={invalidCustomRange} onClick={() => { if (!invalidCustomRange) { setCustomFrom(draftCustomFrom); setCustomTo(draftCustomTo); setOpen(false); } }} className={`mt-3 w-full rounded-xl py-2.5 text-taq-meta font-bold text-white ${invalidCustomRange ? "bg-[#B8C0B7]" : "bg-[#112A46]"}`}>{text(lang, "applyPeriod")}</button></div>}
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
        <button onClick={() => setOpen(!open)} className={`inline-flex max-w-[238px] items-center justify-center gap-1.5 rounded-full px-3 py-1 text-taq-meta font-bold transition ${open ? "bg-[#FFF4D2]/80 text-[#B44747]" : "text-[#806528]"}`}>
          <span className="truncate">{selectedBusiness === "all" ? text(lang, "allStores") : businessName(selectedStore, lang)}</span>
          <ChevronDown className={`h-3.5 w-3.5 shrink-0 text-[#806528] transition ${open ? "rotate-180" : ""}`} />
        </button>
        <AnimatePresence>{open && <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }} className="absolute left-1/2 top-[38px] z-40 w-[270px] -translate-x-1/2 rounded-2xl bg-[#FFFDF7] p-3 shadow-xl ring-1 ring-[#D8CCA8]">
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder={text(lang, "searchStore")} className="mb-2 w-full rounded-xl bg-[#F7F5EF] px-3 py-2.5 text-taq-meta font-bold outline-none" />
          <button onClick={() => { setSelectedBusiness("all"); setOpen(false); }} className={`mb-1 flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-xs font-bold ${selectedBusiness === "all" ? "bg-[#FFF0CB] text-[#B44747]" : "text-[#112A46]"}`}><span>{text(lang, "allStores")}</span>{selectedBusiness === "all" && <Check className="h-4 w-4" />}</button>
          <div className="max-h-48 overflow-y-auto">{filtered.map((business) => <button key={business.id} onClick={() => { setSelectedBusiness(business.id); setOpen(false); setQuery(""); }} className={`mb-1 flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-start ${selectedBusiness === business.id ? "bg-[#FFF0CB]" : ""}`}><div><p className="text-taq-meta font-black text-[#112A46]">{businessName(business, lang)}</p><p className="text-taq-nav font-bold text-[#827762]">{businessLocation(business, lang)}</p></div>{selectedBusiness === business.id && <Check className="h-4 w-4 text-[#B44747]" />}</button>)}</div>
        </motion.div>}</AnimatePresence>
      </div>
    </NotebookRow>
  );
}

function StoreComparison({ lang, monthly, reviewEnabled = false, businessesList = businesses }) {
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
        {showStores && <div><NotebookRow><p className="text-taq-meta font-bold text-[#806528]">{text(lang, "storeResults")}</p></NotebookRow>{ranked.map((business) => { const record = businessRecord(business, monthly); return <NotebookRow key={business.id}><div className="flex w-full items-end justify-between text-xs"><span className="font-medium">{businessName(business, lang)}</span><strong className={`tabular-nums font-bold ${record.net < 0 ? "text-[#B44747]" : "text-[#257844]"}`}><MoneyValue value={money(record.net, lang)} /></strong></div></NotebookRow>; })}</div>}
      </div>
    );
  }
  return (
    <div>
      <NotebookRow><div className="grid w-full grid-cols-[1.05fr_1fr_1fr] gap-1 text-taq-meta font-bold text-[#806528]"><span className="text-taq-meta font-medium">{text(lang, "store")}</span>{businessesList.map((business) => <span key={business.id} className="text-center">{businessName(business, lang, true)}</span>)}</div></NotebookRow>
      <NotebookRow><div className="grid w-full grid-cols-[1.05fr_1fr_1fr] gap-1 text-xs font-medium"><span>{text(lang, "sales")}</span>{businessesList.map((business) => <span key={business.id} className="text-center font-bold tabular-nums"><MoneyValue value={money(businessRecord(business, monthly).sales, lang)} /></span>)}</div></NotebookRow>
      <NotebookRow><div className="grid w-full grid-cols-[1.05fr_1fr_1fr] gap-1 text-xs font-medium"><span className="text-[#B44747]">{text(lang, "outflow")}</span>{businessesList.map((business) => <span key={business.id} className="text-center font-bold tabular-nums text-[#B44747]"><MoneyValue value={money(businessRecord(business, monthly).expense, lang)} /></span>)}</div></NotebookRow>
      <NotebookRow><div className="grid w-full grid-cols-[1.05fr_1fr_1fr] gap-1 text-xs font-medium"><span>{text(lang, "result")}</span>{businessesList.map((business) => { const value = businessRecord(business, monthly).net; return <span key={business.id} className={`text-center font-bold tabular-nums ${value < 0 ? "text-[#B44747]" : "text-[#257844]"}`}><MoneyValue value={money(value, lang)} /></span>; })}</div></NotebookRow>
      {reviewEnabled && <NotebookRow><div className="grid w-full grid-cols-[1.05fr_1fr_1fr] gap-1 text-taq-meta font-bold"><span className="font-medium text-[#806528]">{text(lang, "unreviewedShort")}</span>{businessesList.map((business) => <span key={business.id} className="text-center font-black text-[#B96725]">{businessRecord(business, monthly).pending}</span>)}</div></NotebookRow>}
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
            <p className="whitespace-nowrap text-taq-body font-black leading-none text-[#112A46]">{label}</p>
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

function OwnerHome({ lang, operationalEntries = [], duplicateSalesAlerts = [], closeoutAlerts = [], pendingEmployeeCloseouts = [], onViewPendingCloseouts = () => {}, onReviewCloseout = () => {}, onDismissCloseout = () => {}, onReviewDuplicate = () => {}, onAcknowledgeDuplicate = () => {}, reviewEnabledForBusiness = () => false, onOpenOperation = () => {}, onShareNotebook = () => {}, notebookTheme = "yellow", selectedBusiness = "all", setSelectedBusiness = () => {}, reviewEnabled = false, businessesList = businesses, summaryApiEnabled = false, summaryApiOrganizationId = "", summaryApiActorUserId = "", summaryApiActorRole = "owner", summaryRefreshKey = 0 }) {
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
  const summaryApiActive = summaryApiEnabled;
  const {
    businessesWithDaySummaries,
    combinedResult: apiCombinedResult,
    getStoreResult,
    summariesByStoreId,
    loading: summaryLoading,
  } = useStoreDaySummaries({
    enabled: summaryApiActive,
    period: monthly ? "month" : "day",
    organizationId: summaryApiOrganizationId,
    actorUserId: summaryApiActorUserId,
    actorRole: summaryApiActorRole,
    businesses: businessesList,
    date: selectedDate,
    month: selectedMonth,
    refreshKey: summaryRefreshKey,
  });
  const summaryApiHasData = summaryApiActive && !summaryLoading && Object.keys(summariesByStoreId).length > 0;
  const comparisonBusinesses = summaryApiHasData ? businessesWithDaySummaries : scopedBusinesses;
  const daySummary = summaryDayFromEntries(operationalEntries, currentBusiness?.id, selectedDate, reviewEnabledForBusiness);
  const localCombinedResult = summarizeEntries(operationalEntries.filter((entry) => businessesList.some((business) => business.id === entry.businessId) && entryDateMatches(entry, period, selectedDate, selectedMonth, "2026", "2026-01-01", "2026-12-31")), reviewEnabledForBusiness);
  const apiStoreResult = summaryApiHasData && currentBusiness?.id ? getStoreResult(currentBusiness.id) : null;
  const result = isCombined
    ? (summaryApiHasData ? apiCombinedResult : localCombinedResult)
    : monthly
      ? (summaryApiHasData && apiStoreResult ? apiStoreResult : summaryMonthFromEntries(operationalEntries, currentBusiness?.id, selectedMonth, reviewEnabledForBusiness))
      : (apiStoreResult || daySummary);
  const selectedBusinessEntries = currentBusiness ? entriesInPeriod(operationalEntries, currentBusiness.id, "day", selectedDate, selectedMonth) : [];
  const visibleDayOperations = newestEntries(selectedBusinessEntries);
  const attachmentGroup = attachmentsFromEntries(selectedBusinessEntries)[0] || null;
  const changePeriod = (nextPeriod) => {
    setPeriod(nextPeriod);
    setExpanded(false);
    setShowAttachments(false);
  };
  return (
    <motion.section initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="taq-owner-page taq-notebook-body pb-6 pt-1">
      {pendingEmployeeCloseouts.length > 0 && <PendingCloseoutsNotice lang={lang} pending={pendingEmployeeCloseouts} onView={onViewPendingCloseouts} />}
      {closeoutAlerts.length > 0 && <div className="mx-2 mb-3 rounded-2xl bg-[#E6F5E9] p-3 ring-1 ring-[#39A160]/15"><div className="flex items-start gap-2"><Bell className="mt-0.5 h-4 w-4 shrink-0 text-[#257844]" /><div className="min-w-0 flex-1"><p className="text-taq-meta font-black text-[#257844]">{text(lang, "closeoutInAppAlert")}</p><p className="mt-1 text-taq-meta font-bold text-[#716753]">{businessName(businessesList.find((business) => business.id === closeoutAlerts[0].businessId), lang)} · {formatCalendarDate(closeoutAlerts[0].date, lang)} · {lang === "ar" ? closeoutAlerts[0].employeeNameAr : closeoutAlerts[0].employeeNameEn}</p><p className="mt-1 text-taq-meta font-bold text-[#827762]">{text(lang, "closeoutInAppHint")}</p></div></div><div className="mt-3 grid grid-cols-2 gap-2"><button type="button" onClick={() => onReviewCloseout(closeoutAlerts[0])} className="rounded-xl bg-white py-2.5 text-taq-meta font-black text-[#257844] ring-1 ring-[#39A160]/15">{text(lang, "reviewCloseout")}</button><button type="button" onClick={() => onDismissCloseout(closeoutAlerts[0].id)} className="rounded-xl bg-[#112A46] py-2.5 text-taq-meta font-black text-white">{text(lang, "dismissAlert")}</button></div></div>}
      {duplicateSalesAlerts.length > 0 && <div className="mx-2 mb-3 rounded-2xl bg-[#FFF1EE] p-3 ring-1 ring-[#B44747]/10"><div className="flex items-start gap-2"><Bell className="mt-0.5 h-4 w-4 shrink-0 text-[#B44747]" /><div className="min-w-0 flex-1"><p className="text-taq-meta font-black text-[#B44747]">{text(lang, "duplicateSalesOwnerAlert")}</p><p className="mt-1 text-taq-meta font-bold text-[#716753]">{businessName(businessesList.find((business) => business.id === duplicateSalesAlerts[0].businessId), lang)} · {formatCalendarDate(duplicateSalesAlerts[0].date, lang)} · {duplicateSalesAlerts[0].entries.length} {text(lang, "summary")}</p><p className="mt-1 text-taq-meta font-bold text-[#827762]">{text(lang, "duplicateSalesOwnerHint")}</p></div></div><div className="mt-3 grid grid-cols-2 gap-2"><button type="button" onClick={() => onReviewDuplicate(duplicateSalesAlerts[0])} className="rounded-xl bg-white py-2.5 text-taq-meta font-black text-[#B44747] ring-1 ring-[#B44747]/10">{text(lang, "reviewInLog")}</button><button type="button" onClick={() => onAcknowledgeDuplicate(duplicateSalesAlerts[0])} title={text(lang, "approveMultipleSalesHint")} className="rounded-xl bg-[#112A46] py-2.5 text-taq-meta font-black text-white">{text(lang, "approveMultipleSales")}</button></div></div>}
      <Notebook fullPage theme={notebookTheme} lang={lang}>
        <NotebookHeading lang={lang} label={monthly ? text(lang, "monthlySummary") : text(lang, "dailySummary")} onShare={() => onShareNotebook({ theme: notebookTheme, period, selectedBusiness, includedBusinessIds: businessesList.map((business) => business.id), selectedDay: daySummary.id, selectedDate, selectedMonth, screen: "home", showDetails: expanded && !monthly && !isCombined })} dateSelector={<DateSelector compact lang={lang} period={period} setPeriod={changePeriod} selectedDay={selectedDay} setSelectedDay={(id) => { setSelectedDay(id); setShowAttachments(false); }} selectedDate={selectedDate} setSelectedDate={(date) => { setSelectedDate(date); setShowAttachments(false); }} fullCalendar selectedMonth={selectedMonth} setSelectedMonth={setSelectedMonth} />} />
        <StoreScopeTabs lang={lang} businessesList={businessesList} selectedBusiness={selectedBusiness} setSelectedBusiness={(id) => { setSelectedBusiness(id); setExpanded(false); setShowAttachments(false); }} />
        {isCombined ? (
          <div>
            <StoreComparison lang={lang} monthly={monthly} reviewEnabled={reviewEnabled} businessesList={comparisonBusinesses} />
            <NotebookRow lines={2}><p className="w-full text-taq-meta font-bold text-[#806528]">{text(lang, "chooseStoreForDetails")}</p></NotebookRow>
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
            <h3 className="text-taq-body-sm font-black text-[#112A46]">
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
                    <strong dir="ltr" className={`min-w-[74px] whitespace-nowrap text-start tabular-nums text-taq-body-sm font-black ${entryIsVoided(item) ? "text-[#A99D87] line-through" : isSale ? "text-[#257844]" : "text-[#B44747]"}`}>
                      <MoneyValue value={money(signedEntryAmount(item), lang)} />
                    </strong>
                    <span className="min-w-0 text-end">
                      <span className="flex items-center justify-end gap-2 text-taq-body-sm font-bold text-[#112A46]">
                        {operationDisplayLabel(item, lang)}
                        {entryIsVoided(item) && <Badge tone="warning">{text(lang, "voided")}</Badge>}
                      </span>
                      <small className="mt-1 block truncate text-taq-meta font-bold text-[#8A816F]">
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
function DayAttachments({ lang, group, reviewEnabled = false, onOpenOperation = () => {} }) { if (!group?.items?.length) return <NotebookRow><p className="text-xs font-bold text-[#806528]">{text(lang, "noAttachmentsDay")}</p></NotebookRow>; return <div className="py-3"><div className="flex gap-3 overflow-x-auto pb-1">{group.items.map((item) => <button key={item.id} onClick={() => onOpenOperation(item.entry)} className="min-w-[78px] text-center"><div className="mb-1 flex h-14 justify-center overflow-hidden rounded-xl"><AttachmentPreview attachment={item.attachment} className="h-14 w-14 rounded-xl" /></div><p className="truncate text-taq-meta font-bold">{lang === "ar" ? item.title : item.titleEn}</p><p className={`mt-0.5 text-taq-meta font-black ${item.entry.type === "summary" ? "text-[#257844]" : "text-[#B44747]"}`}><MoneyValue value={money(signedEntryAmount(item.entry), lang)} /></p>{reviewEnabled && !entryIsVoided(item.entry) && !item.reviewed && <span className="inline-block h-1.5 w-1.5 rounded-full bg-[#B96725]" />}</button>)}</div></div>; }

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
    navy: active ? "bg-[#214B7B] text-white" : "bg-[#F7F5EF] text-[#716753] ring-1 ring-[#E8E1D4]",
  }[tone];
  return <button type="button" onClick={onClick} className={`rounded-full px-2.5 py-1 text-taq-meta font-black ${toneClass}`}>{children}</button>;
}

const DEFAULT_REGISTER_LOG_FILTERS = {
  status: "all",
  type: "all",
  expenseCategory: "all",
  attachmentOnly: false,
  pendingReviewOnly: false,
  actor: "all",
  salesChannel: "all",
};

function summarizeRegisterPeriod(entries, lang, salesChannelFilter, channelOptions = []) {
  const activeEntries = entries.filter(entryIsActive);
  if (salesChannelFilter !== "all") {
    const option = channelOptions.find((item) => item.id === salesChannelFilter);
    let amount = 0;
    activeEntries.forEach((entry) => {
      if (entry.type !== "summary") return;
      (entry.salesChannels || []).forEach((row) => {
        if (row.channelId === salesChannelFilter) amount += Number(row.amount) || 0;
      });
    });
    return {
      mode: "channel",
      label: option?.label || (lang === "ar" ? "قناة" : "Channel"),
      amount,
    };
  }
  const totals = summarizeEntries(entries);
  return { mode: "totals", sales: totals.sales, expense: totals.expense, net: totals.net };
}

function registerLogFilterCount(filters) {
  return Number(filters.status !== "all")
    + Number(filters.type !== "all")
    + Number(filters.expenseCategory !== "all")
    + Number(filters.salesChannel !== "all")
    + Number(filters.attachmentOnly)
    + Number(filters.pendingReviewOnly)
    + Number(filters.actor !== "all");
}

function RegisterFiltersSheet({ lang, open, onClose, onApply, draft, setDraft, typeItems, expenseCategoryItems, actorOptions, salesChannelOptions }) {
  if (!open) return null;
  const selectDraftType = (nextType) => {
    setDraft((current) => ({
      ...current,
      type: nextType,
      expenseCategory: nextType !== "expense" ? "all" : current.expenseCategory,
    }));
  };
  const activeDraftCount = registerLogFilterCount(draft);

  const sheet = (
    <AnimatePresence>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[220] flex items-center justify-center bg-[#112A46]/45 p-4 pt-[max(0.75rem,env(safe-area-inset-top))] pb-[max(0.75rem,env(safe-area-inset-bottom))]">
        <button type="button" onClick={onClose} className="absolute inset-0" aria-label={text(lang, "close")} />
        <motion.div dir={lang === "ar" ? "rtl" : "ltr"} initial={{ scale: 0.97, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.97, opacity: 0 }} className="relative z-10 flex max-h-[min(72dvh,520px)] w-full max-w-[400px] flex-col overflow-hidden rounded-[24px] bg-[#F8F6F0] shadow-[0_18px_48px_rgba(17,42,70,0.22)]">
          <div className="flex shrink-0 items-center justify-between border-b border-[#ECE6DA] px-5 py-4 text-start">
            <div>
              <p className="text-taq-meta font-bold text-[#827762]">{lang === "ar" ? "تصفية السجل" : "Log filters"}</p>
              <h3 className="text-base font-black text-[#112A46]">{lang === "ar" ? "الفلاتر" : "Filters"}</h3>
            </div>
            <button type="button" onClick={onClose} className="flex h-9 w-9 items-center justify-center rounded-xl bg-white ring-1 ring-black/[0.05]" aria-label={text(lang, "close")}>
              <X className="h-4 w-4" />
            </button>
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
            <div className="mb-4">
              <p className="mb-1.5 text-taq-nav font-bold text-[#957D43]">{text(lang, "logStatus")}</p>
              <div className="flex flex-wrap gap-1.5">
                {[{ id: "all", label: "all", tone: "default" }, { id: "active", label: "activeEntries", tone: "default" }, { id: "voided", label: "voided", tone: "danger" }].map((item) => (
                  <LogFilterChip key={item.id} active={draft.status === item.id} tone={item.tone} onClick={() => setDraft((current) => ({ ...current, status: item.id }))}>{text(lang, item.label)}</LogFilterChip>
                ))}
                <LogFilterChip active={draft.attachmentOnly} tone="accent" onClick={() => setDraft((current) => ({ ...current, attachmentOnly: !current.attachmentOnly, pendingReviewOnly: current.attachmentOnly ? false : current.pendingReviewOnly }))}>{text(lang, "withAttachment")}</LogFilterChip>
                <LogFilterChip active={draft.pendingReviewOnly} tone="warn" onClick={() => setDraft((current) => ({ ...current, pendingReviewOnly: !current.pendingReviewOnly, attachmentOnly: !current.pendingReviewOnly ? true : current.attachmentOnly, status: !current.pendingReviewOnly ? "active" : current.status }))}>{text(lang, "pendingReviewOnly")}</LogFilterChip>
              </div>
            </div>
            <div className="mb-4">
              <p className="mb-1.5 text-taq-nav font-bold text-[#957D43]">{text(lang, "logType")}</p>
              <div className="-mx-1 flex gap-2.5 overflow-x-auto px-1 pb-0.5">{typeItems.map((item) => <InkTab key={item.id} className="text-taq-meta pb-1.5" active={draft.type === item.id} onClick={() => selectDraftType(item.id)}>{text(lang, item.label)}</InkTab>)}</div>
            </div>
            <div className="mb-4">
              <p className="mb-1.5 text-taq-nav font-bold text-[#957D43]">{lang === "ar" ? "قناة البيع" : "Sales channel"}</p>
              <div className="flex flex-wrap gap-1.5">
                {salesChannelOptions.map((item) => (
                  <LogFilterChip key={item.id} active={draft.salesChannel === item.id} tone={draft.salesChannel === item.id ? "navy" : "default"} onClick={() => setDraft((current) => ({ ...current, salesChannel: item.id }))}>
                    {item.label}
                  </LogFilterChip>
                ))}
              </div>
            </div>
            {draft.type === "expense" && (
              <div className="mb-4">
                <p className="mb-1.5 text-taq-nav font-bold text-[#957D43]">{text(lang, "filterByCategory")}</p>
                <div className="flex flex-wrap gap-1.5">
                  {expenseCategoryItems.map((item) => (
                    <LogFilterChip key={item.id} active={draft.expenseCategory === item.id} tone={draft.expenseCategory === item.id ? "danger" : "default"} onClick={() => setDraft((current) => ({ ...current, expenseCategory: item.id }))}>{text(lang, item.label)}</LogFilterChip>
                  ))}
                </div>
              </div>
            )}
            <div>
              <p className="mb-1.5 text-taq-nav font-bold text-[#957D43]">{lang === "ar" ? "من قام بالإدخال" : "Entered by"}</p>
              <div className="flex flex-wrap gap-1.5">
                {actorOptions.map((item) => (
                  <LogFilterChip key={item.id} active={draft.actor === item.id} tone={draft.actor === item.id ? "navy" : "default"} onClick={() => setDraft((current) => ({ ...current, actor: item.id }))}>
                    {item.label}
                  </LogFilterChip>
                ))}
              </div>
            </div>
          </div>
          <div className="shrink-0 border-t border-[#ECE6DA] px-5 py-4">
            <div className="mb-2 flex items-center justify-between text-taq-meta font-bold text-[#827762]">
              <span>{lang === "ar" ? "فلاتر مفعّلة" : "Active filters"}</span>
              <span className="rounded-full bg-[#112A46] px-2 py-0.5 text-taq-meta font-black text-white">{activeDraftCount}</span>
            </div>
            <div className={`grid gap-3 ${lang === "ar" ? "grid-cols-[1.35fr_0.95fr]" : "grid-cols-[0.95fr_1.35fr]"}`}>
              {lang === "ar" ? (
                <>
                  <button type="button" onClick={onApply} className="rounded-2xl bg-[#112A46] py-3 text-xs font-black text-white">{text(lang, "applyFilters")}</button>
                  <button type="button" onClick={() => setDraft({ ...DEFAULT_REGISTER_LOG_FILTERS })} className="rounded-2xl bg-white py-3 text-xs font-black ring-1 ring-black/[0.06]">{text(lang, "resetFilters")}</button>
                </>
              ) : (
                <>
                  <button type="button" onClick={() => setDraft({ ...DEFAULT_REGISTER_LOG_FILTERS })} className="rounded-2xl bg-white py-3 text-xs font-black ring-1 ring-black/[0.06]">{text(lang, "resetFilters")}</button>
                  <button type="button" onClick={onApply} className="rounded-2xl bg-[#112A46] py-3 text-xs font-black text-white">{text(lang, "applyFilters")}</button>
                </>
              )}
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
  if (typeof document === "undefined") return null;
  return createPortal(sheet, document.body);
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
  if (businessesList.length <= 1) {
    if (!businessesList[0]) return null;
    return (
      <NotebookRow className="justify-center">
        <p className="text-xs font-black text-[#806528]">{businessName(businessesList[0], lang, true) || businessName(businessesList[0], lang)}</p>
      </NotebookRow>
    );
  }
  const stores = locked
    ? businessesList.map((business) => ({ id: business.id, label: businessName(business, lang, true) || businessName(business, lang) }))
    : [{ id: "all", label: text(lang, "allStores") }, ...businessesList.map((business) => ({ id: business.id, label: businessName(business, lang, true) || businessName(business, lang) }))];
  if (locked || businessesList.length <= 2) {
    return (
      <NotebookRow>
        <div className={`grid w-full items-end gap-2 ${stores.length === 2 ? "grid-cols-2" : "grid-cols-3"}`}>
          {stores.map((store) => {
            const active = selectedBusiness === store.id;
            return (
              <button key={store.id} type="button" disabled={locked} onClick={() => setSelectedBusiness(store.id)} className={`relative min-w-0 pb-2 text-center text-xs font-black transition ${active ? "text-[#B44747]" : "text-[#957D43]"} ${locked ? "cursor-default" : ""}`}>
                <span className="relative inline-flex whitespace-nowrap">{store.label}{active && <span className="absolute -bottom-[9px] left-0 right-0 h-[2px] rounded-full bg-[#C28A30]" />}</span>
              </button>
            );
          })}
        </div>
      </NotebookRow>
    );
  }
  const filtered = businessesList.filter((business) => `${businessName(business, lang)} ${businessLocation(business, lang)}`.toLowerCase().includes(query.toLowerCase()));
  return (
    <NotebookRow className="justify-center">
      <div ref={filterRef} className="relative pb-[8px]">
        <button type="button" onClick={() => setOpen(!open)} className={`inline-flex max-w-[238px] items-center justify-center gap-1.5 rounded-full px-3 py-1 text-taq-meta font-bold transition ${open ? "text-[#B44747]" : "text-[#806528]"}`}>
          <span className="truncate">{selectedBusiness === "all" ? text(lang, "allStores") : businessName(selectedStore, lang)}</span>
          <ChevronDown className={`h-3.5 w-3.5 shrink-0 transition ${open ? "rotate-180 text-[#B44747]" : "text-[#806528]"}`} />
        </button>
        <AnimatePresence>{open && <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }} className="absolute left-1/2 top-[38px] z-40 w-[270px] -translate-x-1/2 rounded-2xl bg-[#FFFDF7] p-3 shadow-xl ring-1 ring-[#D8CCA8]">
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder={text(lang, "searchStore")} className="mb-2 w-full rounded-xl bg-[#F7F5EF] px-3 py-2.5 text-taq-meta font-bold outline-none" />
          <button type="button" onClick={() => { setSelectedBusiness("all"); setOpen(false); setQuery(""); }} className={`mb-1 flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-xs font-bold ${selectedBusiness === "all" ? "bg-[#FFF0CB] text-[#B44747]" : "text-[#112A46]"}`}><span>{text(lang, "allStores")}</span>{selectedBusiness === "all" && <Check className="h-4 w-4" />}</button>
          <div className="max-h-48 overflow-y-auto">{filtered.map((business) => <button key={business.id} type="button" onClick={() => { setSelectedBusiness(business.id); setOpen(false); setQuery(""); }} className={`mb-1 flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-start ${selectedBusiness === business.id ? "bg-[#FFF0CB]" : ""}`}><div><p className="text-taq-meta font-black text-[#112A46]">{businessName(business, lang)}</p><p className="text-taq-nav font-bold text-[#827762]">{businessLocation(business, lang)}</p></div>{selectedBusiness === business.id && <Check className="h-4 w-4 text-[#B44747]" />}</button>)}</div>
        </motion.div>}</AnimatePresence>
      </div>
    </NotebookRow>
  );
}

function OwnerRegisterScreen({ lang, onOpenOperation = () => {}, operationalEntries = [], selectedBusiness = "all", setSelectedBusiness = () => {}, businessesList = businesses, archivedBusinessIds = [], archivedReadOnlyBusinessId = null, reviewFocus = null, attachmentReviewRequest = null, notebookTheme = "yellow", registerEntriesApiEnabled = false, registerEntriesApiOrganizationId = "", registerEntriesApiActorUserId = "", registerEntriesApiActorRole = "owner", registerEntriesRefreshKey = 0 }) {
  const [period, setPeriod] = useState("day");
  const [selectedDate, setSelectedDate] = useState(() => todayIsoDate());
  const [selectedMonth, setSelectedMonth] = useState(() => todayIsoDate().slice(0, 7));
  const [selectedYear, setSelectedYear] = useState(() => String(new Date().getFullYear()));
  const [customFrom, setCustomFrom] = useState(() => `${new Date().getFullYear()}-01-01`);
  const [customTo, setCustomTo] = useState(() => todayIsoDate());
  const [logFilters, setLogFilters] = useState(DEFAULT_REGISTER_LOG_FILTERS);
  const [draftLogFilters, setDraftLogFilters] = useState(DEFAULT_REGISTER_LOG_FILTERS);
  const [filtersSheetOpen, setFiltersSheetOpen] = useState(false);
  const [logView, setLogView] = useState("closeouts");
  const [expandedEntryId, setExpandedEntryId] = useState(null);
  const [expandedCloseoutKey, setExpandedCloseoutKey] = useState(null);

  const openFiltersSheet = () => {
    setDraftLogFilters(logFilters);
    setFiltersSheetOpen(true);
  };
  const closeFiltersSheet = () => setFiltersSheetOpen(false);
  const applyFiltersSheet = () => {
    setLogFilters(draftLogFilters);
    setFiltersSheetOpen(false);
  };

  useEffect(() => {
    if (!reviewFocus?.businessId || !reviewFocus?.date || archivedReadOnlyBusinessId) return;
    setSelectedBusiness(reviewFocus.businessId);
    setPeriod("day");
    setSelectedDate(reviewFocus.date);
    setLogFilters({ ...DEFAULT_REGISTER_LOG_FILTERS, status: "active", type: "summary" });
  }, [reviewFocus, archivedReadOnlyBusinessId, setSelectedBusiness]);

  useEffect(() => {
    if (!attachmentReviewRequest?.businessId || !attachmentReviewRequest?.date || archivedReadOnlyBusinessId) return;
    setSelectedBusiness(attachmentReviewRequest.businessId);
    setPeriod("day");
    setSelectedDate(attachmentReviewRequest.date);
    setLogFilters({ ...DEFAULT_REGISTER_LOG_FILTERS, status: "active", attachmentOnly: true, pendingReviewOnly: true });
  }, [attachmentReviewRequest, archivedReadOnlyBusinessId, setSelectedBusiness]);

  const activeBusinesses = businessesList.filter((business) => !archivedBusinessIds.includes(business.id));
  const archivedReadOnlyBusiness = archivedReadOnlyBusinessId && archivedBusinessIds.includes(archivedReadOnlyBusinessId) ? businessesList.find((business) => business.id === archivedReadOnlyBusinessId) : null;
  const availableBusinesses = archivedReadOnlyBusiness ? [archivedReadOnlyBusiness] : activeBusinesses;
  const safeBusinessId = archivedReadOnlyBusiness ? archivedReadOnlyBusiness.id : activeBusinesses.length === 1 ? activeBusinesses[0].id : selectedBusiness === "all" || activeBusinesses.some((business) => business.id === selectedBusiness) ? selectedBusiness : "all";
  const registerTargetStoreIds = useMemo(
    () => (safeBusinessId === "all" ? activeBusinesses.map((business) => business.id) : [safeBusinessId]),
    [activeBusinesses, safeBusinessId],
  );
  const {
    entries: apiRegisterEntries,
    loading: apiRegisterEntriesLoading,
    hasMore: apiRegisterEntriesHasMore,
    loadMore: loadMoreRegisterEntries,
    loadAllRemaining: loadAllRegisterEntries,
  } = useRegisterEntriesFromApi({
    enabled: registerEntriesApiEnabled,
    organizationId: registerEntriesApiOrganizationId,
    actorUserId: registerEntriesApiActorUserId,
    actorRole: registerEntriesApiActorRole,
    storeIds: registerTargetStoreIds,
    period,
    selectedDate,
    selectedMonth,
    selectedYear,
    customFrom,
    customTo,
    refreshKey: registerEntriesRefreshKey,
  });
  const localPeriodEntries = useMemo(
    () => operationalEntries.filter((entry) => (safeBusinessId === "all" ? activeBusinesses.some((business) => business.id === entry.businessId) : entry.businessId === safeBusinessId) && entryDateMatches(entry, period, selectedDate, selectedMonth, selectedYear, customFrom, customTo)),
    [activeBusinesses, customFrom, customTo, operationalEntries, period, safeBusinessId, selectedDate, selectedMonth, selectedYear],
  );
  const periodEntries = registerEntriesApiEnabled
    ? (apiRegisterEntries.length || !apiRegisterEntriesLoading ? apiRegisterEntries : localPeriodEntries)
    : localPeriodEntries;
  const registerLoadMoreRef = useRef(null);
  useEffect(() => {
    if (!registerEntriesApiEnabled || logView !== "operations" || !apiRegisterEntriesHasMore) return undefined;
    const target = registerLoadMoreRef.current;
    if (!target) return undefined;
    const observer = new IntersectionObserver((records) => {
      if (records.some((record) => record.isIntersecting)) {
        loadMoreRegisterEntries();
      }
    }, { root: null, rootMargin: "240px" });
    observer.observe(target);
    return () => observer.disconnect();
  }, [apiRegisterEntriesHasMore, loadMoreRegisterEntries, logView, periodEntries.length, registerEntriesApiEnabled]);
  useEffect(() => {
    if (!registerEntriesApiEnabled || logView !== "closeouts" || !apiRegisterEntriesHasMore) return undefined;
    loadAllRegisterEntries();
    return undefined;
  }, [apiRegisterEntriesHasMore, loadAllRegisterEntries, logView, registerEntriesApiEnabled, registerEntriesRefreshKey, safeBusinessId, period, selectedDate, selectedMonth, selectedYear, customFrom, customTo]);
  const actorOptions = useMemo(() => {
    const seen = new Set();
    const options = [{ id: "all", label: lang === "ar" ? "الكل" : "All" }];
    periodEntries.forEach((entry) => {
      const actorId = entry.enteredBy?.userId;
      if (!actorId || seen.has(actorId)) return;
      seen.add(actorId);
      options.push({
        id: actorId,
        label: employeeName(entry, lang) || (lang === "ar" ? "مستخدم" : "User"),
      });
    });
    return options;
  }, [periodEntries, lang]);
  const salesChannelOptions = useMemo(() => {
    const seen = new Set();
    const options = [{ id: "all", label: lang === "ar" ? "كل القنوات" : "All channels" }];
    periodEntries.forEach((entry) => {
      if (entry.type !== "summary") return;
      (entry.salesChannels || []).forEach((row) => {
        if (!row?.channelId || seen.has(row.channelId)) return;
        seen.add(row.channelId);
        const fallback = channels.find((channel) => channel.id === row.channelId);
        options.push({
          id: row.channelId,
          label: row.name || (fallback ? channelName(fallback, lang) : row.channelId),
        });
      });
    });
    return options;
  }, [periodEntries, lang]);
  const matchesExpenseCategory = (entry) => {
    if (logFilters.type !== "expense" || logFilters.expenseCategory === "all") return true;
    if (entry.type !== "expense") return false;
    return entryCategory(entry) === logFilters.expenseCategory;
  };
  const matchesActor = (entry) => logFilters.actor === "all" || entry.enteredBy?.userId === logFilters.actor;
  const matchesSalesChannel = (entry) => {
    if (logFilters.salesChannel === "all") return true;
    if (entry.type !== "summary") return false;
    return (entry.salesChannels || []).some((row) => row.channelId === logFilters.salesChannel && Number(row.amount) > 0);
  };
  const filteredEntries = periodEntries.filter((entry) => (logFilters.status === "all" || (logFilters.status === "active" ? entryIsActive(entry) : entryIsVoided(entry))) && (logFilters.type === "all" || entry.type === logFilters.type) && matchesExpenseCategory(entry) && matchesActor(entry) && matchesSalesChannel(entry) && (!logFilters.attachmentOnly || entryHasAttachment(entry)) && (!logFilters.pendingReviewOnly || (entryIsActive(entry) && entryHasAttachment(entry) && !entry.reviewed)));
  const visibleEntries = newestEntries(filteredEntries);
  const {
    sameDayCloseoutCountByStoreDate,
    daySequenceByCloseoutId,
  } = useMemo(() => buildRegisterCloseoutDayContext(periodEntries), [periodEntries]);
  const closeoutSummaries = useMemo(() => {
    const grouped = new Map();
    newestEntries(filteredEntries).forEach((entry) => {
      // Keep each closeout independent by grouping on closeoutId when present.
      const key = entry.closeoutId
        ? `closeout|${entry.closeoutId}`
        : `legacy-day|${entry.businessId}|${entry.date}`;
      if (!grouped.has(key)) {
        grouped.set(key, {
          key,
          businessId: entry.businessId,
          closeoutId: entry.closeoutId || null,
          date: entry.date,
          entries: [],
        });
      }
      grouped.get(key).entries.push(entry);
    });
    const summaries = [...grouped.values()].map((group) => {
      const store = businessesList.find((business) => business.id === group.businessId) || null;
      const totals = summarizeEntries(group.entries);
      const salesChannels = aggregateSalesChannelsFromGroupEntries(group.entries, lang, logFilters.salesChannel);
      const channelSalesTotal = salesChannels.reduce((sum, row) => sum + row.amount, 0);
      const ownerEntered = group.entries.find((entry) => entry.enteredBy?.userId === ownerActor.userId) || group.entries[0];
      const daySequence = group.entries.find((entry) => Number.isInteger(entry.daySequence))?.daySequence ?? null;
      return {
        ...group,
        store,
        totals,
        salesChannels,
        displaySales: logFilters.salesChannel === "all" ? totals.sales : channelSalesTotal,
        operations: newestEntries(group.entries),
        actorLabel: employeeName(ownerEntered, lang) || text(lang, "enteredByOwner"),
        daySequence,
      };
    });
    const sameDayCloseoutCountByStoreDate = new Map();
    summaries.forEach((summary) => {
      if (!summary.closeoutId) return;
      const key = `${summary.businessId}|${summary.date}`;
      sameDayCloseoutCountByStoreDate.set(key, (sameDayCloseoutCountByStoreDate.get(key) || 0) + 1);
    });
    return summaries.map((summary) => ({
      ...summary,
      sameDayCloseoutCount: summary.closeoutId
        ? sameDayCloseoutCountByStoreDate.get(`${summary.businessId}|${summary.date}`) || 1
        : 1,
    })).filter((group) => logFilters.salesChannel === "all" || group.salesChannels.length > 0).sort((a, b) => {
      if (a.date !== b.date) return b.date.localeCompare(a.date);
      const aStamp = `${a.date}|${a.operations[0]?.createdAt || ""}`;
      const bStamp = `${b.date}|${b.operations[0]?.createdAt || ""}`;
      return bStamp.localeCompare(aStamp);
    });
  }, [filteredEntries, businessesList, lang, logFilters.salesChannel]);
  useEffect(() => {
    if (!visibleEntries.length) {
      setExpandedEntryId(null);
      return;
    }
    setExpandedEntryId((current) => (current && visibleEntries.some((entry) => entry.id === current) ? current : null));
  }, [visibleEntries]);
  useEffect(() => {
    if (!closeoutSummaries.length) {
      setExpandedCloseoutKey(null);
      return;
    }
    setExpandedCloseoutKey((current) => (current && closeoutSummaries.some((summary) => summary.key === current) ? current : null));
  }, [closeoutSummaries]);
  const registerScrollId = (value) => `${value}`.replace(/[|]/g, "--");
  useEffect(() => {
    const targetId = expandedCloseoutKey
      ? `register-closeout-${registerScrollId(expandedCloseoutKey)}`
      : expandedEntryId
        ? `register-entry-${expandedEntryId}`
        : null;
    if (!targetId) return undefined;
    const timer = window.setTimeout(() => {
      document.getElementById(targetId)?.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "nearest" });
    }, 80);
    return () => window.clearTimeout(timer);
  }, [expandedCloseoutKey, expandedEntryId]);

  const typeItems = [{ id: "all", label: "allTypes" }, { id: "summary", label: "summary" }, { id: "purchases", label: "purchases" }, { id: "expense", label: "expense" }, { id: "withdrawal", label: "withdrawal" }];
  const expenseCategoryItems = [{ id: "all", label: "allCategories" }, ...expenseCategories];
  const activeFilterCount = registerLogFilterCount(logFilters);
  const registerCardStyle = useMemo(() => ({ backgroundColor: notebookCardBackground(notebookTheme) }), [notebookTheme]);
  const registerCardInsetStyle = useMemo(() => ({ backgroundColor: notebookCardBackground(notebookTheme, "inset") }), [notebookTheme]);
  const registerPeriodSummary = useMemo(
    () => summarizeRegisterPeriod(filteredEntries, lang, logFilters.salesChannel, salesChannelOptions),
    [filteredEntries, lang, logFilters.salesChannel, salesChannelOptions],
  );
  const registerPeriodLabel = logPeriodScopeLabel(lang, period, selectedDate, selectedMonth, selectedYear, customFrom, customTo);

  return (
    <NotebookScrollSurface theme={notebookTheme} lang={lang}>
      <motion.section initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="taq-owner-page taq-notebook-body pb-28 pt-1">
        {archivedReadOnlyBusiness && <div className="mx-2 mb-2 flex justify-center"><Badge tone="warning">{text(lang, "archivedReadOnly")}</Badge></div>}
        <NotebookHeading
          lang={lang}
          label={text(lang, "operationsLog")}
          dateSelector={(
            <DateSelector
              compact
              lang={lang}
              period={period}
              setPeriod={setPeriod}
              allowedPeriods={["day", "month", "year", "custom"]}
              selectedDay={selectedDate}
              setSelectedDay={() => {}}
              selectedDate={selectedDate}
              setSelectedDate={setSelectedDate}
              fullCalendar
              selectedMonth={selectedMonth}
              setSelectedMonth={setSelectedMonth}
              selectedYear={selectedYear}
              setSelectedYear={setSelectedYear}
              customFrom={customFrom}
              setCustomFrom={setCustomFrom}
              customTo={customTo}
              setCustomTo={setCustomTo}
            />
          )}
        />

        <div className={`${lang === "ar" ? "pr-11 pl-6" : "pl-11 pr-6"}`}>
          <LogStoreFilter lang={lang} businessesList={availableBusinesses} selectedBusiness={safeBusinessId} setSelectedBusiness={setSelectedBusiness} locked={Boolean(archivedReadOnlyBusiness)} />
          <NotebookRow className="mb-1">
            <div className="flex w-full items-end justify-between gap-3">
              <div className="flex min-w-0 flex-1 items-end gap-4">
                <InkTab active={logView === "closeouts"} onClick={() => setLogView("closeouts")} className="text-taq-meta pb-1.5">
                  {lang === "ar" ? "التقفيلات" : "Closeouts"}
                </InkTab>
                <InkTab active={logView === "operations"} onClick={() => setLogView("operations")} className="text-taq-meta pb-1.5">
                  {lang === "ar" ? "العمليات" : "Operations"}
                </InkTab>
              </div>
              <InkTab active={activeFilterCount > 0} onClick={openFiltersSheet} className="inline-flex shrink-0 items-center gap-1 pb-1.5 text-taq-meta">
                {text(lang, "logFilters")}
                {activeFilterCount > 0 ? <span className="tabular-nums">({activeFilterCount})</span> : null}
              </InkTab>
            </div>
          </NotebookRow>
        </div>

        <RegisterFiltersSheet
          lang={lang}
          open={filtersSheetOpen}
          onClose={closeFiltersSheet}
          onApply={applyFiltersSheet}
          draft={draftLogFilters}
          setDraft={setDraftLogFilters}
          typeItems={typeItems}
          expenseCategoryItems={expenseCategoryItems}
          actorOptions={actorOptions}
          salesChannelOptions={salesChannelOptions}
        />

        <article className="mb-3 overflow-hidden rounded-[19px] border border-[#E8E1D4] px-3.5 py-3 shadow-[0_8px_18px_rgba(17,42,70,0.06)]" style={registerCardStyle}>
          <p className="text-taq-meta font-black text-[#112A46]">{text(lang, "registerPeriodSummary")}</p>
          <p className="mt-0.5 text-taq-nav font-bold text-[#827762]">{registerPeriodLabel}</p>
          {registerPeriodSummary.mode === "channel" ? (
            <div className="mt-3 flex items-end justify-between gap-3 border-t border-dashed border-[#DDD3C0] pt-2.5">
              <span className="text-taq-meta font-black text-[#716753]">{registerPeriodSummary.label}</span>
              <strong className="tabular-nums text-taq-body-sm font-extrabold text-[#257844]">
                <MoneyValue value={money(registerPeriodSummary.amount, lang)} />
              </strong>
            </div>
          ) : (
            <div className="mt-2.5 grid grid-cols-3 gap-2 border-t border-dashed border-[#DDD3C0] pt-2.5">
              <p className="text-taq-meta font-black text-[#112A46]">
                {lang === "ar" ? "الداخل" : "In"}
                {" "}
                <span className="tabular-nums"><MoneyValue value={money(registerPeriodSummary.sales, lang)} /></span>
              </p>
              <p className="text-taq-meta font-black text-[#B44747]">
                {lang === "ar" ? "الخارج" : "Out"}
                {" "}
                <span className="tabular-nums"><MoneyValue value={money(registerPeriodSummary.expense, lang)} /></span>
              </p>
              <p className={`text-taq-meta font-black ${registerPeriodSummary.net < 0 ? "text-[#B44747]" : "text-[#257844]"}`}>
                {lang === "ar" ? "الناتج" : "Net"}
                {" "}
                <span className="tabular-nums"><MoneyValue value={money(registerPeriodSummary.net, lang)} /></span>
              </p>
            </div>
          )}
        </article>

        <div className="mb-3 flex items-center justify-between px-1 text-taq-meta font-black text-[#8B8274]">
          <span>{text(lang, "logResults")}</span>
          <span>{logView === "operations" ? `${visibleEntries.length} ${text(lang, "operations")}` : `${closeoutSummaries.length} ${lang === "ar" ? "تقفيلات" : "Closeouts"}`}</span>
        </div>

        {logView === "operations" && (visibleEntries.length === 0 ? (
          <div className="rounded-2xl px-4 py-8 text-center text-taq-meta font-bold text-[#827762] ring-1 ring-[#E8E1D4]" style={registerCardStyle}>{text(lang, "noOperationsMatch")}</div>
        ) : (
          <div className="space-y-2.5">
            {visibleEntries.map((entry) => {
              const store = businessesList.find((business) => business.id === entry.businessId);
              const isSale = entry.type === "summary";
              const signedAmount = isSale
                ? summaryEntryDisplayAmount(entry, logFilters.salesChannel)
                : -entry.amount;
              const isExpanded = expandedEntryId === entry.id;
              const actorLabel = employeeName(entry, lang) || (lang === "ar" ? "مستخدم" : "User");
              const registerDaySequence = entry.closeoutId
                ? (Number.isInteger(entry.daySequence) ? entry.daySequence : daySequenceByCloseoutId.get(entry.closeoutId) ?? null)
                : null;
              const registerSameDayCloseoutCount = entry.closeoutId
                ? sameDayCloseoutCountByStoreDate.get(`${entry.businessId}|${entry.date}`) || 1
                : 1;
              const registerDateLabel = formatCloseoutDayLabel({
                formattedDate: formatCalendarDate(entry.date, lang),
                daySequence: registerDaySequence,
                sameDayCloseoutCount: registerSameDayCloseoutCount,
              });
              return (
                <article id={`register-entry-${entry.id}`} key={entry.id} className="overflow-hidden rounded-[19px] border border-[#E8E1D4] shadow-[0_8px_18px_rgba(17,42,70,0.06)]" style={registerCardStyle}>
                  <button type="button" onClick={() => setExpandedEntryId((current) => (current === entry.id ? null : entry.id))} className="flex w-full items-start gap-2.5 px-3.5 py-3 text-start">
                    <span className={`mt-0.5 h-8 w-1 shrink-0 rounded-full ${isSale ? "bg-[#39A160]" : "bg-[#E4B84A]"}`} />
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <p className="truncate text-taq-meta font-black text-[#112A46]">{operationDisplayLabel(entry, lang, logFilters.salesChannel)}</p>
                        {entryIsVoided(entry) && <Badge tone="warning">{text(lang, "voided")}</Badge>}
                        {entryHasAttachment(entry) && <Badge tone="navy">{text(lang, "attachmentExists")}</Badge>}
                      </div>
                      <p className="mt-1 truncate text-taq-nav font-bold text-[#827762]">{registerDateLabel} · {opTime(entry, lang)} · {businessName(store, lang, true) || businessName(store, lang)} · {actorLabel}</p>
                    </div>
                    <div className="shrink-0 text-end">
                      <strong className={`block tabular-nums text-taq-meta font-black ${entryIsVoided(entry) ? "text-[#A99D87] line-through" : isSale ? "text-[#257844]" : "text-[#B44747]"}`}>
                        <MoneyValue value={money(signedAmount, lang)} />
                      </strong>
                      <span className="mt-1 block text-taq-meta font-black text-[#806528]">{isExpanded ? (lang === "ar" ? "إخفاء" : "Hide") : (lang === "ar" ? "تفاصيل" : "Details")}</span>
                    </div>
                  </button>
                  {isExpanded && (
                    <div className="border-t border-[#E8E1D4] px-3.5 py-3" style={registerCardInsetStyle}>
                      {entry.note ? <p className="mb-2 text-taq-meta font-bold text-[#716753]">{entry.note}</p> : null}
                      {entryIsVoided(entry) && entry.voidReason ? <p className="mb-2 text-taq-meta font-bold text-[#B44747]">{text(lang, "voidReason")}: {entry.voidReason}</p> : null}
                      <div className="grid grid-cols-2 gap-2 text-taq-meta font-bold text-[#716753]">
                        <div className="rounded-xl px-2.5 py-2 ring-1 ring-[#E8E1D4]" style={registerCardStyle}>{lang === "ar" ? "المدخل" : "Entered by"}: {actorLabel}</div>
                        <div className="rounded-xl px-2.5 py-2 ring-1 ring-[#E8E1D4]" style={registerCardStyle}>{lang === "ar" ? "المحل" : "Store"}: {businessName(store, lang, true) || businessName(store, lang)}</div>
                      </div>
                      <button type="button" onClick={() => onOpenOperation(entry)} className="mt-2.5 w-full rounded-xl bg-[#112A46] py-2.5 text-taq-meta font-black text-white">{lang === "ar" ? "عرض العملية" : "Open operation"}</button>
                    </div>
                  )}
                </article>
              );
            })}
            {registerEntriesApiEnabled && logView === "operations" && apiRegisterEntriesHasMore ? (
              <div ref={registerLoadMoreRef} className="h-px w-full shrink-0" aria-hidden="true" />
            ) : null}
          </div>
        ))}

        {logView === "closeouts" && (closeoutSummaries.length === 0 ? (
          <div className="rounded-2xl px-4 py-8 text-center text-taq-meta font-bold text-[#827762] ring-1 ring-[#E8E1D4]" style={registerCardStyle}>{text(lang, "noCloseoutsPeriod")}</div>
        ) : (
          <div className="space-y-2.5">
            {closeoutSummaries.map((summary) => {
              const isExpanded = expandedCloseoutKey === summary.key;
              const storeLabel = businessName(summary.store, lang, true) || businessName(summary.store, lang);
              return (
                <article id={`register-closeout-${registerScrollId(summary.key)}`} key={summary.key} className="overflow-hidden rounded-[19px] border border-[#E8E1D4] shadow-[0_8px_18px_rgba(17,42,70,0.06)]" style={registerCardStyle}>
                  <button type="button" onClick={() => setExpandedCloseoutKey((current) => (current === summary.key ? null : summary.key))} className="flex w-full items-start gap-2.5 px-3.5 py-3 text-start">
                    <ChevronDown className={`mt-0.5 h-5 w-5 shrink-0 text-[#112A46] transition ${isExpanded ? "rotate-180" : ""}`} />
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center justify-between gap-x-2 gap-y-1">
                        <p className="text-taq-meta font-black text-[#112A46]">{formatCloseoutDayLabel({ formattedDate: formatCalendarDate(summary.date, lang), daySequence: summary.daySequence, sameDayCloseoutCount: summary.sameDayCloseoutCount })}</p>
                        <p className="rounded-full border border-[#8EA1C4] px-2.5 py-1 text-taq-meta font-black text-[#214B7B]">{lang === "ar" ? `أدخلها ${summary.actorLabel}` : `Entered by ${summary.actorLabel}`}</p>
                      </div>
                      <p className="mt-1 text-taq-meta font-bold text-[#716753]">{lang === "ar" ? "تقفيلة يوم" : "Daily closeout"} · {storeLabel}</p>
                      <div className="mt-2 grid grid-cols-3 gap-2 border-t border-dashed border-[#DDD3C0] pt-2">
                        <p className="text-taq-meta font-black text-[#112A46]">{lang === "ar" ? "الدخل" : "In"} <span className="tabular-nums"><MoneyValue value={money(summary.displaySales, lang)} /></span></p>
                        <p className="text-taq-meta font-black text-[#B44747]">{lang === "ar" ? "الخارج" : "Out"} <span className="tabular-nums"><MoneyValue value={money(-summary.totals.expense, lang)} /></span></p>
                        <p className={`text-taq-meta font-black ${summary.totals.net < 0 ? "text-[#B44747]" : "text-[#257844]"}`}>{lang === "ar" ? "الناتج" : "Net"} <span className="tabular-nums"><MoneyValue value={money(summary.totals.net, lang)} /></span></p>
                      </div>
                      {isExpanded && (
                        summary.salesChannels.length > 0 ? (
                          <div className="mt-2 flex flex-wrap gap-1.5">
                            {summary.salesChannels.map((channel) => (
                              <span key={channel.channelId} className="rounded-full bg-[#E6F5E9] px-2 py-0.5 text-taq-nav font-bold text-[#257844]">
                                {channel.name} · <span className="tabular-nums"><MoneyValue value={money(channel.amount, lang)} /></span>
                              </span>
                            ))}
                          </div>
                        ) : (
                          <p className="mt-2 text-taq-nav font-bold text-[#8B8274]">{lang === "ar" ? "لا توجد قنوات مبيعات" : "No sales channels"}</p>
                        )
                      )}
                      <p className="mt-2 text-taq-meta font-black text-[#806528]">{isExpanded ? (lang === "ar" ? "إخفاء" : "Hide") : (lang === "ar" ? "عرض" : "Show")}</p>
                    </div>
                  </button>
                  {isExpanded && (
                    <div className="border-t border-[#E8E1D4] px-3.5 py-2.5" style={registerCardInsetStyle}>
                      <div className="space-y-2">
                        {summary.operations.flatMap((item) => expandRegisterCloseoutOperationRows(item, lang, logFilters.salesChannel).map((row) => (
                          <button key={row.key} type="button" onClick={() => onOpenOperation(row.item)} className="grid w-full grid-cols-[max-content_minmax(0,1fr)] items-center gap-3 rounded-xl px-2 py-2 text-start hover:bg-[#FFF4D2]/35">
                            <strong dir="ltr" className={`min-w-[70px] whitespace-nowrap text-start tabular-nums text-taq-meta font-black ${entryIsVoided(row.item) ? "text-[#A99D87] line-through" : row.isSale ? "text-[#257844]" : "text-[#B44747]"}`}>
                              <MoneyValue value={money(row.amount, lang)} />
                            </strong>
                            <span className="min-w-0 text-end">
                              <span className="truncate text-taq-meta font-bold text-[#112A46]">{row.label}</span>
                              <small className="mt-0.5 block truncate text-taq-nav font-bold text-[#8A816F]">{opTime(row.item, lang)} · {entryHasAttachment(row.item) ? text(lang, "attachmentExists") : text(lang, "noAttachment")}</small>
                            </span>
                          </button>
                        )))}
                      </div>
                    </div>
                  )}
                </article>
              );
            })}
          </div>
        ))}
      </motion.section>
    </NotebookScrollSurface>
  );
}

function OutflowAnalysis({ lang, period, selectedBusiness, selectedDay, selectedDate, selectedMonth, selectedYear, customFrom, customTo, businessesList = businesses, operationalEntries = [], category = "all", setCategory = () => {}, showTransactions = false, setShowTransactions = () => {}, apiTransactions = null, apiTotal = null, apiCount = null }) {
  const useApiTransactions = Array.isArray(apiTransactions);
  const visibleRecords = useApiTransactions
    ? apiTransactions
    : operationalEntries.filter((entry) => entryIsActive(entry) && entryIsOutflow(entry) && (selectedBusiness === "all" || entry.businessId === selectedBusiness) && (category === "all" || entryCategory(entry) === category) && entryDateMatches(entry, period, selectedDate, selectedMonth, selectedYear, customFrom, customTo));
  const total = typeof apiTotal === "number" ? apiTotal : visibleRecords.reduce((sum, record) => sum + record.amount, 0);
  const average = typeof apiCount === "number" && apiCount > 0
    ? total / apiCount
    : visibleRecords.length
      ? total / visibleRecords.length
      : 0;
  const selectedCategoryLabel = category === "all" ? text(lang, "allCategories") : text(lang, outflowReportCategories.find((item) => item.id === category)?.label || "other");
  const totalLabel = category === "all" ? text(lang, "totalOutflow") : `${text(lang, "totalOutflow")} · ${selectedCategoryLabel}`;
  return <div><div className="flex min-h-[88px] flex-wrap content-center items-end gap-x-4 gap-y-3 pb-3 pt-2">{outflowReportCategories.map((item) => { const active = category === item.id; return <button key={item.id} onClick={() => setCategory(item.id)} className={`relative pb-1.5 text-taq-meta font-bold transition ${active ? "text-[#B44747]" : "text-[#806528]"}`}><span className="relative inline-flex whitespace-nowrap">{text(lang, item.label)}{active && <span className="absolute -bottom-[7px] left-0 right-0 h-[2px] rounded-full bg-[#C28A30]" />}</span></button>; })}</div><FinancialRows lang={lang} rows={[
    { id: "total", label: totalLabel, value: money(total, lang), valueClassName: "text-[#B44747]" },
    { id: "count", label: text(lang, "numberTransactions"), value: `${typeof apiCount === "number" ? apiCount : visibleRecords.length}` },
    { id: "average", label: text(lang, "averageTransaction"), value: money(average, lang), valueClassName: "text-[#806528]" },
  ]} /><NotebookRow className="justify-center"><InkTab active={showTransactions} onClick={() => setShowTransactions(!showTransactions)}>{text(lang, showTransactions ? "hideTransactions" : "viewTransactions")}</InkTab></NotebookRow>{showTransactions && (visibleRecords.length ? <div>{newestEntries(visibleRecords).map((record) => { const store = businessesList.find((business) => business.id === record.businessId); return <NotebookRow key={record.id} lines={2}><div className="w-full"><div className="mb-1 flex items-end justify-between text-xs"><strong className="font-medium text-[#112A46]">{text(lang, outflowReportCategories.find((item) => item.id === entryCategory(record))?.label || "other")}</strong><strong className="tabular-nums font-bold text-[#B44747]"><MoneyValue value={money(-record.amount, lang)} /></strong></div><div className="flex justify-between text-taq-meta font-bold text-[#806528]"><span>{formatCalendarDate(record.date, lang)} · {businessName(store, lang, true)}</span><span>{entryHasAttachment(record) ? text(lang, "attachmentExists") : text(lang, "noAttachment")}</span></div></div></NotebookRow>; })}</div> : <NotebookRow><p className="text-xs font-bold text-[#806528]">{text(lang, "noOutflowPeriod")}</p></NotebookRow>)}</div>;
}

function RatioBadge({ value }) {
  return <span className="rounded-full bg-[#E6EFEF] px-1.5 py-0.5 text-taq-nav font-bold tabular-nums text-[#316C73]">{value}</span>;
}

function SummaryReportDetails({ lang, monthly, selectedBusiness, selectedDate, selectedMonth, reportChannels = channels, businessesList = businesses, section = "both", operationalEntries = [], apiChannelRows = null, apiOutflowCategories = null, salesBaseOverride = null }) {
  const salesBase = typeof salesBaseOverride === "number"
    ? salesBaseOverride
    : (monthly ? summaryMonthFromEntries(operationalEntries, selectedBusiness, selectedMonth) : summaryDayFromEntries(operationalEntries, selectedBusiness, selectedDate)).sales;
  const periodEntries = entriesInPeriod(operationalEntries, selectedBusiness, monthly ? "month" : "day", selectedDate, selectedMonth);
  const dynamicChannels = Array.isArray(apiChannelRows)
    ? apiChannelRows
    : aggregateChannels(operationalEntries, selectedBusiness, monthly ? "month" : "day", selectedDate, selectedMonth, reportChannels);
  const outflowByCategory = Array.isArray(apiOutflowCategories)
    ? apiOutflowCategories.map((item) => ({
      ...outflowReportCategories.find((category) => category.id === item.id) || { id: item.id, label: item.id },
      amount: item.amount,
    })).filter((item) => item.amount > 0)
    : outflowReportCategories.filter((item) => item.id !== "all").map((item) => ({ ...item, amount: periodEntries.filter((entry) => entryIsActive(entry) && entryIsOutflow(entry) && entryCategory(entry) === item.id).reduce((sum, entry) => sum + entry.amount, 0) })).filter((item) => item.amount > 0);
  const percentageOfSales = (amount) => salesBase > 0 ? `${((amount / salesBase) * 100).toFixed(1)}%` : amount > 0 ? "—" : "0.0%";
  return <>{(section === "sales" || section === "both") && dynamicChannels.map((channel) => <NotebookRow key={channel.id}><div className="flex w-full items-end justify-between ps-3 text-xs"><div className="flex items-center gap-2"><span className="font-medium text-[#716753]">{channelName(channel, lang)}</span><RatioBadge value={percentageOfSales(channel.amount)} /></div><strong className="tabular-nums font-bold text-[#112A46]"><MoneyValue value={money(channel.amount, lang)} /></strong></div></NotebookRow>)}{(section === "outflow" || section === "both") && outflowByCategory.map((item) => <NotebookRow key={item.id}><div className="flex w-full items-end justify-between ps-3 text-xs"><div className="flex items-center gap-2"><span className="font-medium text-[#716753]">{text(lang, item.label)}</span><RatioBadge value={percentageOfSales(item.amount)} /></div><strong className="tabular-nums font-bold text-[#B44747]"><MoneyValue value={money(item.amount, lang)} /></strong></div></NotebookRow>)}</>;
}

function ReportsScreen({ lang, operationalEntries = [], archivedReadOnlyBusinessId = null, reviewEnabledForBusiness = () => false, onShareNotebook = () => {}, notebookTheme = "yellow", selectedBusiness = "all", setSelectedBusiness = () => {}, configuredChannels = channels, reviewEnabled = false, businessesList = businesses, archivedBusinessIds = [], reportsApiEnabled = false, reportsApiOrganizationId = "", reportsApiActorUserId = "", reportsApiActorRole = "owner", summaryRefreshKey = 0 }) {
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
  const {
    loading: reportsApiLoading,
    hasData: reportsApiLoaded,
    combinedTotals: apiCombinedTotals,
    singleStoreTotals: apiSingleStoreTotals,
    businessesWithSummaries,
    daysRows: apiDaysRows,
    channelRows: apiChannelRows,
    outflowCategories: apiOutflowCategories,
    outflowTransactions: apiOutflowTransactions,
    outflowTransactionCount: apiOutflowTransactionCount,
    outflowTotal: apiOutflowTotal,
    attachmentProofs: apiAttachmentProofs,
  } = useStoreReports({
    enabled: reportsApiEnabled,
    organizationId: reportsApiOrganizationId,
    actorUserId: reportsApiActorUserId,
    actorRole: reportsApiActorRole,
    businesses: visibleReportBusinesses,
    selectedStoreId: safeSelectedBusiness,
    period,
    selectedDate: selectedReportDate,
    selectedMonth: selectedReportMonth,
    selectedYear: selectedReportYear,
    customFrom,
    customTo,
    configuredChannels,
    outflowCategory,
    includeOutflowTransactions: showOutflowTransactions,
    refreshKey: summaryRefreshKey,
  });
  const reportsApiHasData = reportsApiEnabled && !reportsApiLoading && reportsApiLoaded;
  const comparisonBusinesses = reportsApiHasData ? businessesWithSummaries : scopedBusinesses;
  const useApiDetailTabs = reportsApiHasData && !isCombined;
  const scopedEntries = operationalEntries.filter((entry) => isCombined ? visibleReportBusinesses.some((business) => business.id === entry.businessId) : entry.businessId === safeSelectedBusiness);
  const periodEntries = scopedEntries.filter((entry) => entryDateMatches(entry, period, selectedReportDate, selectedReportMonth, selectedReportYear, customFrom, customTo));
  const localTotals = summarizeEntries(periodEntries, reviewEnabledForBusiness);
  const totals = isCombined
    ? (reportsApiHasData ? apiCombinedTotals : localTotals)
    : (reportsApiHasData && apiSingleStoreTotals ? apiSingleStoreTotals : localTotals);
  const reportDay = selectedStore ? summaryDayFromEntries(operationalEntries, selectedStore.id, selectedReportDate, reviewEnabledForBusiness) : { id: selectedReportDate };
  const localReportDays = [...new Set(scopedEntries.filter((entry) => entryIsActive(entry) && entry.type === "summary" && entry.date.startsWith(monthSelectionValue(selectedReportMonth))).map((entry) => entry.date))]
    .sort()
    .reverse()
    .map((date) => ({ id: date, dayAr: formatCalendarDate(date, "ar"), dayEn: formatCalendarDate(date, "en"), ...summarizeEntries(scopedEntries.filter((entry) => entry.date === date), reviewEnabledForBusiness) }));
  const reportDays = useApiDetailTabs
    ? apiDaysRows
      .filter((day) => day.id.startsWith(monthSelectionValue(selectedReportMonth)))
      .map((day) => ({
        ...day,
        dayAr: formatCalendarDate(day.id, "ar"),
        dayEn: formatCalendarDate(day.id, "en"),
      }))
    : localReportDays;
  const visibleChannels = useApiDetailTabs
    ? apiChannelRows
    : aggregateChannels(operationalEntries, isCombined ? null : safeSelectedBusiness, period, selectedReportDate, selectedReportMonth, configuredChannels);
  const proofsTotals = useApiDetailTabs && apiAttachmentProofs
    ? { proofs: apiAttachmentProofs.proofs, pending: apiAttachmentProofs.pending }
    : { proofs: totals.proofs, pending: totals.pending };
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
    <motion.section initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="taq-owner-page taq-notebook-body pb-6 pt-1">
      <Notebook fullPage theme={notebookTheme} lang={lang}>
        {archivedReadOnlyBusiness && <div className="mx-2 mb-2 flex justify-center"><Badge tone="warning">{text(lang, "archivedReadOnly")}</Badge></div>}<NotebookHeading lang={lang} label={text(lang, "reportNotebook")} onShare={() => onShareNotebook({ theme: notebookTheme, period, selectedBusiness: safeSelectedBusiness, includedBusinessIds: activeReportBusinesses.map((business) => business.id), selectedDay: reportDay.id, selectedDate: selectedReportDate, selectedMonth: selectedReportMonth, selectedYear: selectedReportYear, customFrom, customTo, screen: "reports", tab, outflowCategory, reviewEnabled: effectiveReviewEnabled, showSummaryDetails: tab === "summary" && showSummaryDetails, showOutflowTransactions: tab === "expenses" && showOutflowTransactions, reportChannels: configuredChannels })} dateSelector={<DateSelector compact lang={lang} period={period} setPeriod={changeReportPeriod} allowedPeriods={tab === "expenses" ? ["day", "month", "year", "custom"] : ["day", "month"]} selectedDay={selectedReportDay} setSelectedDay={setSelectedReportDay} selectedDate={selectedReportDate} setSelectedDate={setSelectedReportDate} fullCalendar selectedMonth={selectedReportMonth} setSelectedMonth={setSelectedReportMonth} selectedYear={selectedReportYear} setSelectedYear={setSelectedReportYear} customFrom={customFrom} setCustomFrom={setCustomFrom} customTo={customTo} setCustomTo={setCustomTo} />} />
        <StoreScopeTabs lang={lang} businessesList={visibleReportBusinesses} selectedBusiness={safeSelectedBusiness} setSelectedBusiness={(id) => { if (!archivedReadOnlyBusiness) setSelectedBusiness(id); setShowSummaryDetails(false); }} />
        {isCombined ? (
          <div>
            <StoreComparison lang={lang} monthly={monthly} reviewEnabled={effectiveReviewEnabled} businessesList={comparisonBusinesses} />
            <NotebookRow lines={2}><p className="w-full text-taq-meta font-bold text-[#806528]">{text(lang, "chooseStoreForDetails")}</p></NotebookRow>
          </div>
        ) : (
          <div>
            <NotebookRow><div className="grid w-full grid-cols-5 items-end gap-1">{tabs.map((item) => <InkTab key={item.id} active={tab === item.id} onClick={() => changeReportTab(item.id)} titleUnderline className="min-w-0 text-taq-meta">{text(lang, item.key)}</InkTab>)}</div></NotebookRow>
            {tab === "summary" && <div>
              <NotebookRow><NumberLine label={text(lang, "sales")} value={money(totals.sales, lang)} /></NotebookRow>
              {showSummaryDetails && <SummaryReportDetails lang={lang} monthly={monthly} selectedBusiness={safeSelectedBusiness} selectedDate={selectedReportDate} selectedMonth={selectedReportMonth} reportChannels={configuredChannels} businessesList={visibleReportBusinesses} section="sales" operationalEntries={operationalEntries} apiChannelRows={useApiDetailTabs ? apiChannelRows : null} salesBaseOverride={totals.sales} />}
              <NotebookRow><NumberLine label={text(lang, "purchasesExpenses")} value={money(totals.expense, lang)} valueClassName="text-[#B44747]" /></NotebookRow>
              {showSummaryDetails && <SummaryReportDetails lang={lang} monthly={monthly} selectedBusiness={safeSelectedBusiness} selectedDate={selectedReportDate} selectedMonth={selectedReportMonth} reportChannels={configuredChannels} businessesList={visibleReportBusinesses} section="outflow" operationalEntries={operationalEntries} apiOutflowCategories={useApiDetailTabs ? apiOutflowCategories : null} salesBaseOverride={totals.sales} />}
              <NotebookRow><div className="flex w-full items-end justify-between text-xs font-bold text-[#806528]"><span>{text(lang, "outflowRatio")}</span><strong className="text-[#B44747]">{totals.ratio}</strong></div></NotebookRow>
              <NotebookRow strong lines={2}><div className="flex w-full items-end justify-between"><span className="text-sm font-extrabold">{monthly ? text(lang, "recordedMonthResult") : text(lang, "netMovement")}</span><strong className={`tabular-nums text-2xl font-extrabold ${totals.net < 0 ? "text-[#B44747]" : "text-[#257844]"}`}><MoneyValue value={money(totals.net, lang)} /></strong></div></NotebookRow>
              <NotebookRow className="justify-center"><InkTab active={showSummaryDetails} onClick={() => setShowSummaryDetails(!showSummaryDetails)} className="inline-flex items-center gap-1">{text(lang, showSummaryDetails ? "hideReportDetails" : "reportDetails")}{showSummaryDetails ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}</InkTab></NotebookRow>
            </div>}
            {tab === "days" && <div>{reportDays.length === 0 ? <NotebookRow lines={2}><p className="text-xs font-bold text-[#806528]">{text(lang, "noCloseoutsPeriod")}</p></NotebookRow> : reportDays.map((day) => <NotebookRow key={day.id}><div className="grid w-full grid-cols-3 text-xs font-bold"><span>{shortDate(day, lang)}</span><span className="tabular-nums font-bold"><MoneyValue value={money(day.sales, lang)} /></span><span className="tabular-nums font-bold text-[#B44747]"><MoneyValue value={money(day.expense, lang)} /></span></div></NotebookRow>)}</div>}
            {tab === "channels" && <div>{visibleChannels.length === 0 ? <NotebookRow lines={2}><p className="text-xs font-bold text-[#806528]">{text(lang, "noSalesChannelsPeriod")}</p></NotebookRow> : visibleChannels.map((channel) => <NotebookRow key={channel.id}><div className="flex w-full items-end justify-between text-sm"><span className="font-bold">{channelName(channel, lang)}</span><strong className="tabular-nums font-bold"><MoneyValue value={money(channel.amount, lang)} /></strong></div></NotebookRow>)}</div>}
            {tab === "expenses" && <OutflowAnalysis lang={lang} period={period} selectedBusiness={safeSelectedBusiness} selectedDay={selectedReportDay} selectedDate={selectedReportDate} selectedMonth={selectedReportMonth} selectedYear={selectedReportYear} customFrom={customFrom} customTo={customTo} businessesList={visibleReportBusinesses} operationalEntries={operationalEntries.filter((entry) => safeSelectedBusiness !== "all" || activeReportBusinesses.some((business) => business.id === entry.businessId))} category={outflowCategory} setCategory={(value) => { setOutflowCategory(value); setShowOutflowTransactions(false); }} showTransactions={showOutflowTransactions} setShowTransactions={setShowOutflowTransactions} apiTransactions={useApiDetailTabs ? apiOutflowTransactions : null} apiTotal={useApiDetailTabs ? apiOutflowTotal : null} apiCount={useApiDetailTabs ? apiOutflowTransactionCount : null} />}
            {tab === "proofs" && <div><NotebookRow><NumberLine label={text(lang, "totalAttachments")} value={`${proofsTotals.proofs}`} /></NotebookRow>{effectiveReviewEnabled ? <NotebookRow><NumberLine label={text(lang, "notReviewedItems")} value={`${proofsTotals.pending}`} valueClassName="text-[#B96725]" /></NotebookRow> : <NotebookRow lines={2}><p className="text-taq-meta font-bold text-[#806528]">{text(lang, "reviewDisabled")}</p></NotebookRow>}</div>}
          </div>
        )}
      </Notebook>
      <p className="mt-4 text-center text-taq-meta font-bold text-[#8B8274]">{text(lang, "operationalOnly")}</p>
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
  const { captureNotebookShareBlob } = await import("@/features/daily-closeouts/notebook-share-capture");
  return captureNotebookShareBlob(element, backgroundColor);
}

/** Share image via OS sheet (WhatsApp on mobile). Never downloads — wa.me cannot attach files. */
async function shareNotebookImageToWhatsApp(file, caption, lang) {
  return shareImageThroughWhatsApp({
    file,
    caption,
    lang,
    pasteHint: text(lang, "shareImagePasteHint"),
  });
}

function NotebookShareModal({ lang, snapshot, onClose, businessesList = businesses, operationalEntries = [], archivedBusinessIds = [], notebookExportApiEnabled = false, notebookExportAuth = {} }) {
  const [format, setFormat] = useState("image");
  const [imageBusy, setImageBusy] = useState(false);
  const [imageError, setImageError] = useState("");
  const [shareHint, setShareHint] = useState("");
  const previewRef = useRef(null);
  const cachedImageFileRef = useRef(null);
  const preCaptureTokenRef = useRef(0);
  const {
    apiEntries,
    apiRecord,
    apiChannelRows,
    apiDayRows,
    apiPendingProofs,
  } = useNotebookExportShareData({
    enabled: notebookExportApiEnabled,
    auth: notebookExportAuth,
    snapshot,
  });
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
  const selectedDayItem = apiRecord
    ? {
      id: shareDate,
      dayAr: formatCalendarDate(shareDate, "ar"),
      dayEn: formatCalendarDate(shareDate, "en"),
      fullAr: formatCalendarDate(shareDate, "ar"),
      fullEn: formatCalendarDate(shareDate, "en"),
      ...apiRecord,
    }
    : summaryDayFromEntries(operationalEntries, business.id, shareDate);
  const selectedMonthItem = formatSelectedMonth(snapshot.selectedMonth, lang);
  const scopedShareEntries = apiEntries || operationalEntries.filter((entry) => (combined ? includedBusinessIds.includes(entry.businessId) : entry.businessId === snapshot.selectedBusiness) && entryDateMatches(entry, sharePeriod, shareDate, snapshot.selectedMonth, shareYear, shareFrom, shareTo));
  const outflowCategory = snapshot.outflowCategory || "all";
  const filteredOutflowEntries = scopedShareEntries.filter((entry) => entryIsActive(entry) && entryIsOutflow(entry) && (outflowCategory === "all" || entryCategory(entry) === outflowCategory));
  const shareChannelMap = new Map();
  if (!apiChannelRows) {
    scopedShareEntries.filter((entry) => entryIsActive(entry) && entry.type === "summary").forEach((entry) => (entry.salesChannels || []).forEach((row) => { const current = shareChannelMap.get(row.channelId) || { id: row.channelId, label: row.name || row.channelId, amount: 0 }; shareChannelMap.set(row.channelId, { ...current, amount: current.amount + row.amount }); }));
  }
  const shareChannelRows = apiChannelRows || [...shareChannelMap.values()].filter((row) => row.amount > 0);
  const shareDayRows = apiDayRows || [...new Set(scopedShareEntries.filter(entryIsActive).map((entry) => entry.date))].sort().reverse().map((date) => ({ date, ...summarizeEntries(scopedShareEntries.filter((entry) => entry.date === date)) }));
  const shareProofEntries = scopedShareEntries.filter((entry) => entryIsActive(entry) && entryHasAttachment(entry));
  const sharePendingProofs = typeof apiPendingProofs === "number" ? apiPendingProofs : shareProofEntries.filter((entry) => !entry.reviewed).length;
  const shareBusinessRows = includedBusinessIds.map((businessId) => { const item = businessesList.find((business) => business.id === businessId); return { business: item, ...summarizeEntries(scopedShareEntries.filter((entry) => entry.businessId === businessId)) }; }).filter((row) => row.business);
  const outflowTotal = filteredOutflowEntries.reduce((sum, entry) => sum + entry.amount, 0);
  const outflowAverage = filteredOutflowEntries.length ? outflowTotal / filteredOutflowEntries.length : 0;
  const normalRecord = combined
    ? summarizeEntries(scopedShareEntries)
    : apiRecord
      ? apiRecord
      : monthly
        ? summaryMonthFromEntries(operationalEntries, business.id, snapshot.selectedMonth)
        : selectedDayItem;
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
    shareOperations.forEach((item) => exportTable.rows.push([operationDisplayLabel(item, lang), money(signedEntryAmount(item), lang), `${opTime(item, lang)} · ${entryHasAttachment(item) ? text(lang, "attachmentExists") : text(lang, "noAttachment")}`]));
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
            <p className="text-taq-meta font-bold text-[#827762]">{text(lang, "shareOptions")}</p>
            <h3 className="text-base font-black">{format === "image" ? text(lang, "notebookImagePreview") : text(lang, "professionalReportPreview")}</h3>
          </div>
          <button onClick={onClose} className="flex h-9 w-9 items-center justify-center rounded-xl bg-white"><X className="h-4 w-4" /></button>
        </div>
        <div className="mb-4 grid grid-cols-3 gap-2">
          {formats.map((item) => {
            const Icon = item.icon;
            const active = format === item.id;
            return (
              <button type="button" key={item.id} onClick={() => setFormat(item.id)} className={`flex flex-col items-center gap-2 rounded-2xl px-2 py-3 text-taq-meta font-black transition ${active ? "bg-[#112A46] text-white" : "bg-white text-[#716753] ring-1 ring-black/[0.045]"}`}>
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
                  <div className="flex h-[44px] items-end justify-center gap-3 pb-[8px] text-taq-meta font-black text-[#112A46]">
                    <ChevronDown className="h-3.5 w-3.5 shrink-0" />
                    <span>{periodLabel}</span>
                    <CalendarDays className="h-4 w-4 shrink-0" />
                  </div>
                  <div className="flex h-[58px] items-end justify-center pb-[8px]">
                    <div className="inline-flex flex-col items-center">
                      <p className="whitespace-nowrap text-taq-body font-black leading-none text-[#112A46]">{snapshot.screen === "reports" ? text(lang, "reportNotebook") : monthly ? text(lang, "monthlySummary") : text(lang, "dailySummary")}</p>
                      <span className="mt-2 block h-[2px] w-full rounded-full bg-[#C28A30]" />
                    </div>
                  </div>
                  {combined ? <>
                    <div className="flex h-[44px] items-end pb-2 text-taq-meta font-bold text-[#806528]">{text(lang, "shopsComparisonReport")}</div>
                    <div className="grid h-[44px] grid-cols-[1.05fr_0.9fr_0.9fr_0.9fr] items-end gap-1 pb-2 text-taq-nav font-bold text-[#806528]"><span>{text(lang, "store")}</span><span className="text-center">{text(lang, "salesShort")}</span><span className="text-center">{text(lang, "outflowShort")}</span><span className="text-center">{text(lang, "result")}</span></div>
                    {shareBusinessRows.map((row) => <div key={row.business.id} className="grid h-[44px] grid-cols-[1.05fr_0.9fr_0.9fr_0.9fr] items-end gap-1 pb-2 text-taq-meta"><span className="truncate font-bold">{businessName(row.business, lang, true) || businessName(row.business, lang)}</span><strong className="text-center tabular-nums">{money(row.sales, lang)}</strong><strong className="text-center tabular-nums text-[#B44747]">{money(row.expense, lang)}</strong><strong className={`text-center tabular-nums ${row.net < 0 ? "text-[#B44747]" : "text-[#257844]"}`}>{money(row.net, lang)}</strong></div>)}
                    <div className="mt-1 grid h-[55px] grid-cols-[1.05fr_0.9fr_0.9fr_0.9fr] items-end gap-1 border-t-2 border-[#112A46]/55 pb-2 text-taq-meta"><span className="font-bold">{text(lang, "combinedTotal")}</span><strong className="text-center tabular-nums">{money(record.sales, lang)}</strong><strong className="text-center tabular-nums text-[#B44747]">{money(record.expense, lang)}</strong><strong className={`text-center tabular-nums ${record.net < 0 ? "text-[#B44747]" : "text-[#257844]"}`}>{money(record.net, lang)}</strong></div>
                  </> : isOutflowReport ? <>
                    <div className="flex min-h-[44px] items-end pb-2 text-taq-meta font-bold text-[#806528]">{text(lang, "detailedOutflowReport")} · {outflowCategoryLabel}</div>
                    <FinancialRows lang={lang} rows={[
                      { id: "share-total", label: text(lang, "totalOutflow"), value: money(outflowTotal, lang), valueClassName: "text-[#B44747]" },
                      { id: "share-count", label: text(lang, "numberTransactions"), value: `${filteredOutflowEntries.length}` },
                      { id: "share-average", label: text(lang, "averageTransaction"), value: money(outflowAverage, lang), valueClassName: "text-[#806528]" },
                    ]} />
                    {showOutflowOperations && (
                      <div className="pt-1">
                        <div className="flex h-[44px] items-end pb-[8px]">
                          <p className="inline-flex flex-col text-taq-meta font-black text-[#112A46]">
                            <span>{text(lang, "operations")}</span>
                            <span className="mt-1.5 h-[2px] w-full rounded-full bg-[#C28A30]" />
                          </p>
                        </div>
                        {shareOutflowOperations.length ? shareOutflowOperations.map((item, index) => (
                          <div key={`share-outflow-operation-${item.id}`} className={`grid min-h-[44px] w-full grid-cols-[max-content_minmax(0,1fr)] items-center gap-3 py-2 ${index < shareOutflowOperations.length - 1 ? "border-b border-[#D9DFE3]/70" : ""}`}>
                            <strong dir="ltr" className="min-w-[68px] whitespace-nowrap text-start tabular-nums text-taq-meta font-black text-[#B44747]">
                              <MoneyValue value={money(signedEntryAmount(item), lang)} />
                            </strong>
                            <span className="min-w-0 text-end">
                              <span className="block truncate text-taq-meta font-bold text-[#112A46]">{operationDisplayLabel(item, lang)}</span>
                              <small className="mt-0.5 block truncate text-taq-nav font-bold text-[#8A816F]">{formatCalendarDate(item.date, lang)} · {opTime(item, lang)} · {entryHasAttachment(item) ? text(lang, "attachmentExists") : text(lang, "noAttachment")}</small>
                            </span>
                          </div>
                        )) : (
                          <div className="flex h-[44px] items-end pb-2 text-taq-meta font-bold text-[#806528]">{text(lang, "noOutflowPeriod")}</div>
                        )}
                      </div>
                    )}
                  </> : isChannelsReport ? <>
                    <div className="flex h-[44px] items-end pb-2 text-taq-meta font-bold text-[#806528]">{text(lang, "channelsReport")}</div>
                    {shareChannelRows.length ? shareChannelRows.map((row) => <div key={row.id} className="flex h-[44px] items-end justify-between pb-2 text-sm"><span>{row.label}</span><strong className="tabular-nums">{money(row.amount, lang)}</strong></div>) : <div className="flex h-[44px] items-end pb-2 text-xs text-[#806528]">{text(lang, "noSalesChannelsPeriod")}</div>}
                  </> : isDaysReport ? <>
                    <div className="flex h-[44px] items-end pb-2 text-taq-meta font-bold text-[#806528]">{text(lang, "daysReport")}</div>
                    {shareDayRows.length ? <><div className="grid h-[44px] grid-cols-[1.25fr_1fr_1fr] items-end gap-1 pb-2 text-taq-nav font-bold text-[#806528]"><span>{text(lang, "day")}</span><span className="text-center">{text(lang, "salesShort")}</span><span className="text-center">{text(lang, "outflowShort")}</span></div>{shareDayRows.map((row) => <div key={row.date} className="grid h-[44px] grid-cols-[1.25fr_1fr_1fr] items-end gap-1 pb-2 text-taq-meta"><span className="truncate font-bold">{formatCalendarDate(row.date, lang)}</span><strong className="text-center tabular-nums">{money(row.sales, lang)}</strong><strong className="text-center tabular-nums text-[#B44747]">{money(row.expense, lang)}</strong></div>)}</> : <div className="flex h-[44px] items-end pb-2 text-xs text-[#806528]">{text(lang, "noCloseoutsPeriod")}</div>}
                  </> : isProofsReport ? <>
                    <div className="flex h-[44px] items-end pb-2 text-taq-meta font-bold text-[#806528]">{text(lang, "attachmentsReport")}</div>
                    <div className="flex h-[44px] items-end justify-between pb-2 text-sm"><span>{text(lang, "totalAttachments")}</span><strong className="tabular-nums">{shareProofEntries.length}</strong></div>
                    {snapshot.reviewEnabled !== false && <div className="flex h-[44px] items-end justify-between pb-2 text-sm text-[#B96725]"><span>{text(lang, "notReviewedItems")}</span><strong className="tabular-nums">{sharePendingProofs}</strong></div>}
                    {snapshot.reviewEnabled === false && <div className="flex h-[44px] items-end pb-2 text-taq-meta font-bold text-[#806528]">{text(lang, "reviewDisabled")}</div>}
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
                          <p className="inline-flex flex-col text-taq-meta font-black text-[#112A46]">
                            <span>{text(lang, "operations")} {formatCalendarDate(shareDate, lang)}</span>
                            <span className="mt-1.5 h-[2px] w-full rounded-full bg-[#C28A30]" />
                          </p>
                        </div>
                        {shareOperations.length ? shareOperations.map((item, index) => {
                          const isSale = item.type === "summary";
                          return (
                            <div key={`share-operation-${item.id}`} className={`grid min-h-[44px] w-full grid-cols-[max-content_minmax(0,1fr)] items-center gap-3 py-2 ${index < shareOperations.length - 1 ? "border-b border-[#D9DFE3]/70" : ""}`}>
                              <strong dir="ltr" className={`min-w-[68px] whitespace-nowrap text-start tabular-nums text-taq-meta font-black ${isSale ? "text-[#257844]" : "text-[#B44747]"}`}>
                                <MoneyValue value={money(signedEntryAmount(item), lang)} />
                              </strong>
                              <span className="min-w-0 text-end">
                                <span className="block truncate text-taq-meta font-bold text-[#112A46]">{operationDisplayLabel(item, lang)}</span>
                                <small className="mt-0.5 block truncate text-taq-nav font-bold text-[#8A816F]">{opTime(item, lang)} · {entryHasAttachment(item) ? text(lang, "attachmentExists") : text(lang, "noAttachment")}</small>
                              </span>
                            </div>
                          );
                        }) : (
                          <div className="flex h-[44px] items-end pb-2 text-taq-meta font-bold text-[#806528]">{text(lang, "noEntriesDay")}</div>
                        )}
                      </div>
                    )}
                  </>}
                </div>
              </div>
            </div>
            <p className="mb-2 text-center text-taq-meta font-bold text-[#827762]">{text(lang, "imageReadyToShare")}</p>
            {shareHint && <p className="mb-3 rounded-xl bg-[#E6F5E9] px-3 py-2 text-center text-taq-meta font-bold text-[#257844]">{shareHint}</p>}
            {imageError && <p className="mb-3 rounded-xl bg-[#FFF1EE] px-3 py-2 text-center text-taq-meta font-bold text-[#B44747]">{imageError}</p>}
          </>
        ) : (
          <div className="mb-5 overflow-hidden rounded-[22px] bg-white ring-1 ring-black/[0.055]">
            <div className="bg-[#112A46] p-4 text-white">
              <div className="flex items-start justify-between gap-2"><div><p className="text-taq-meta font-medium text-white/65">{text(lang, "reportFor")}</p><h4 className="mt-1 text-sm font-extrabold">{title}</h4></div><span className={`rounded-lg px-2 py-1 text-taq-meta font-black ${format === "pdf" ? "bg-[#B44747]" : "bg-[#217346]"}`}>{format === "pdf" ? "PDF" : "Excel"}</span></div>
              <div className="mt-3 flex items-center justify-between text-taq-meta font-medium text-white/70"><span>{text(lang, "selectedPeriod")}</span><span>{periodLabel}</span></div>
            </div>
            <div className="p-3">
              <div className="grid rounded-t-lg bg-[#F4F2ED] px-3 py-2 text-taq-meta font-bold text-[#716753]" style={{ gridTemplateColumns: `repeat(${exportTable.headers.length}, minmax(0, 1fr))` }}>
                {exportTable.headers.map((header, index) => <span key={`export-head-${index}`} className={index > 0 ? "text-end" : ""}>{header}</span>)}
              </div>
              {exportTable.rows.map((row, index) => (
                <div key={`export-row-${index}`} className={`grid px-3 py-3 text-taq-meta ${index < exportTable.rows.length - 1 ? "border-b border-[#ECE6DA]" : ""} ${row[0] === text(lang, "operations") ? "bg-[#FFF4D2] font-black text-[#112A46]" : "font-bold"}`} style={{ gridTemplateColumns: `repeat(${exportTable.headers.length}, minmax(0, 1fr))` }}>
                  {exportTable.headers.map((_, cellIndex) => <span key={`export-cell-${index}-${cellIndex}`} className={`${cellIndex > 0 ? "text-end tabular-nums" : "text-[#112A46]"} truncate`}>{row[cellIndex] || ""}</span>)}
                </div>
              ))}
            </div>
            <div className="flex items-center justify-between border-t border-[#ECE6DA] px-4 py-3 text-taq-meta font-bold text-[#827762]"><span>{text(lang, "appName")}</span><span>{text(lang, "preparedForExport")}</span></div>
          </div>
        )}
        {format === "image" ? (
          <div className="grid grid-cols-3 gap-2">
            <button type="button" onClick={onClose} className="rounded-2xl bg-white py-3.5 text-taq-meta font-black text-[#112A46] ring-1 ring-black/[0.06]">{lang === "ar" ? "إغلاق" : "Close"}</button>
            <button type="button" disabled={imageBusy} onClick={downloadNotebookImage} className="flex items-center justify-center gap-1.5 rounded-2xl bg-white py-3.5 text-taq-meta font-black text-[#112A46] ring-1 ring-black/[0.06] disabled:opacity-60">
              <Download className="h-3.5 w-3.5" />{text(lang, "downloadNotebookImage")}
            </button>
            <button type="button" disabled={imageBusy} onClick={shareImageViaWhatsApp} className="flex items-center justify-center gap-1.5 rounded-2xl bg-[#25D366] py-3.5 text-taq-meta font-black text-white disabled:opacity-60">
              <Send className="h-3.5 w-3.5" />{imageBusy ? (lang === "ar" ? "جاري التجهيز…" : "Preparing…") : text(lang, "shareViaWhatsApp")}
            </button>
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
  return <AnimatePresence><motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 z-[60] flex items-end bg-[#112A46]/50 sm:items-center sm:justify-center sm:p-6 lg:items-end lg:justify-start lg:p-0"><motion.div initial={{ y: 18 }} animate={{ y: 0 }} exit={{ y: 18 }} className="relative z-10 w-full rounded-t-[30px] bg-[#F8F6F0] p-5 pb-8 sm:max-w-[560px] sm:rounded-[30px] sm:p-6 lg:max-w-none lg:rounded-t-[30px] lg:rounded-b-none lg:p-5 lg:pb-8"><div className="mb-4 flex items-start justify-between"><div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#E6F5E9] text-[#257844]"><Check className="h-5 w-5" /></div><button onClick={onClose} className="flex h-9 w-9 items-center justify-center rounded-xl bg-white ring-1 ring-black/[0.05]"><X className="h-4 w-4" /></button></div><h3 className="text-base font-black">{text(lang, "outflowSavedTitle")}</h3><p className="mt-2 text-taq-meta font-bold leading-6 text-[#716753]">{text(lang, "outflowSavedDesc")}</p><div className="mt-4 rounded-2xl bg-white p-4 ring-1 ring-black/[0.045]"><div className="flex items-center justify-between gap-2"><div><p className="text-xs font-black text-[#112A46]">{categoryLabel}</p><p className="mt-1 text-taq-meta font-bold text-[#827762]">{businessName(store, lang)} · {formatCalendarDate(item.date, lang)}</p></div><strong className="tabular-nums text-sm font-black text-[#B44747]">{money(signedEntryAmount(item), lang)}</strong></div></div><p className="mt-4 text-xs font-bold text-[#716753]">{text(lang, "sendOutflowQuestion")}</p><div className="mt-5 grid grid-cols-[1fr_1.15fr] gap-3"><button onClick={onClose} className="rounded-2xl bg-white py-3.5 text-taq-meta font-black text-[#112A46] ring-1 ring-black/[0.06]">{text(lang, "keepWithoutSending")}</button><button onClick={sendWhatsApp} className="flex items-center justify-center gap-2 rounded-2xl bg-[#25D366] py-3.5 text-taq-meta font-black text-white"><Send className="h-4 w-4" />{text(lang, "saveShareWhatsApp")}</button></div></motion.div></motion.div></AnimatePresence>;
}

function OperationModal({ lang, item, onClose, onReview, onVoid, onRestore, reviewEnabled = false, canVoid = true, canRestore = true }) {
  if (!item) return null;
  const isSale = item.type === "summary";
  const voided = entryIsVoided(item);
  const attachmentSource = useAttachmentSource(item.attachment);
  const [attachmentOpen, setAttachmentOpen] = useState(false);

  useEffect(() => {
    setAttachmentOpen(false);
  }, [item?.id]);

  return (
    <>
      <AnimatePresence>
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 z-40 flex items-end bg-[#112A46]/35 sm:items-center sm:justify-center sm:p-6 lg:items-end lg:justify-start lg:p-0">
          <div className="relative z-10 w-full rounded-t-[30px] bg-[#F8F6F0] p-5 pb-8 sm:max-w-[560px] sm:rounded-[30px] sm:p-6 lg:max-w-none lg:rounded-t-[30px] lg:rounded-b-none lg:p-5 lg:pb-8">
            <div className="mb-4 flex justify-between">
              <div className="flex flex-wrap items-center gap-2">
                <Badge tone={isSale ? "success" : "warning"}>{operationDisplayLabel(item, lang)}</Badge>
                {voided && <Badge tone="warning">{text(lang, "voided")}</Badge>}
                {!voided && entryWasRestored(item) && <Badge tone="success">{text(lang, "restored")}</Badge>}
                {!voided && item.reviewed && <Badge tone="success">{text(lang, "reviewed")}</Badge>}
                <h3 className="mt-2 w-full text-lg font-black">{noteLabel(item, lang)}</h3>
              </div>
              <button type="button" onClick={onClose}><X className="h-5 w-5" /></button>
            </div>

            <div className="mb-4 rounded-2xl bg-white p-4 text-sm">
              <div className="mb-2 flex justify-between"><span>{text(lang, "amount")}</span><strong className={`${voided ? "line-through opacity-60" : ""} ${isSale ? "text-[#257844]" : "text-[#B44747]"}`}>{money(signedEntryAmount(item), lang)}</strong></div>
              <div className="mb-2 flex justify-between"><span>{text(lang, "time")}</span><strong>{opDate(item, lang)} · {opTime(item, lang)}</strong></div>
              <div className="flex justify-between"><span>{text(lang, "enteredBy")}</span><strong>{employeeName(item, lang)}</strong></div>
              {voided && (
                <div className="mt-3 border-t border-[#F0ECE2] pt-3">
                  <div className="flex justify-between text-[#B44747]"><span>{text(lang, "status")}</span><strong>{text(lang, "voidedByOwner")}</strong></div>
                  {item.voidReason && <div className="mt-2 flex justify-between gap-3 text-taq-meta text-[#716753]"><span>{text(lang, "voidReason")}</span><strong className="text-end">{item.voidReason}</strong></div>}
                </div>
              )}
              {!voided && entryWasRestored(item) && (
                <div className="mt-3 border-t border-[#F0ECE2] pt-3">
                  <div className="flex justify-between text-[#257844]"><span>{text(lang, "status")}</span><strong>{text(lang, "restoredByOwner")}</strong></div>
                  {item.restoreReason && <div className="mt-2 flex justify-between gap-3 text-taq-meta text-[#716753]"><span>{text(lang, "restoreReason")}</span><strong className="text-end">{item.restoreReason}</strong></div>}
                </div>
              )}
            </div>

            {(item.auditTrail || []).length > 0 && (
              <div className="mb-4 rounded-2xl bg-white p-4">
                <p className="mb-3 text-xs font-black text-[#112A46]">{text(lang, "auditTrail")}</p>
                <div className="space-y-2">
                  {item.auditTrail.map((action, index) => (
                    <div key={`${action.action}-${action.at}-${index}`} className="flex items-start justify-between gap-3 text-taq-meta font-bold">
                      <div className="flex items-start gap-2">
                        <span className={`mt-1 h-2 w-2 rounded-full ${action.action === "voided" ? "bg-[#B44747]" : action.action === "restored" || action.action === "reviewed" || action.action === "duplicate_approved" ? "bg-[#257844]" : "bg-[#806528]"}`} />
                        <div>
                          <p>{text(lang, action.action === "created" ? "actionCreated" : action.action === "voided" ? "actionVoided" : action.action === "restored" ? "actionRestored" : action.action === "reviewed" ? "actionReviewed" : "actionDuplicateApproved")}</p>
                          <p className="mt-0.5 font-medium text-[#827762]">{action.by ? (lang === "ar" ? action.by.nameAr : action.by.nameEn) : "-"}</p>
                          {action.reason && <p className="mt-0.5 font-medium text-[#827762]">{action.reason}</p>}
                        </div>
                      </div>
                      <span className="shrink-0 text-end text-[#827762]">{auditDateTime(action.at, lang)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {entryHasAttachment(item) && (
              <div className="mb-4 overflow-hidden rounded-2xl bg-[#E9E2D5]">
                <button
                  type="button"
                  className="w-full"
                  onClick={() => {
                    if (attachmentSource) setAttachmentOpen(true);
                  }}
                >
                  <AttachmentPreview attachment={item.attachment} className="h-52 w-full" />
                </button>
                <p className="border-t border-[#D9CEBA] px-3 py-2 text-center text-taq-meta font-bold text-[#716753]">
                  {text(lang, "openAttachment")}
                </p>
              </div>
            )}

            {reviewEnabled && !voided && entryHasAttachment(item) && !item.reviewed && <button onClick={() => onReview(item.id)} className="mb-3 w-full rounded-2xl bg-[#39A160] py-4 text-sm font-extrabold text-white">{text(lang, "confirmReview")}</button>}
            {canRestore && voided && <button onClick={() => onRestore(item.id)} className="w-full rounded-2xl bg-[#E6F5E9] py-4 text-sm font-extrabold text-[#257844]">{text(lang, "restoreEntry")}</button>}
            {canVoid && !voided && <button onClick={() => onVoid(item.id)} className="w-full rounded-2xl bg-[#FFF1EE] py-4 text-sm font-extrabold text-[#B44747]">{text(lang, "voidEntry")}</button>}
          </div>
        </motion.div>
      </AnimatePresence>
      <AttachmentLightbox
        open={attachmentOpen}
        src={attachmentSource}
        lang={lang}
        onClose={() => setAttachmentOpen(false)}
      />
    </>
  );
}

function DuplicateSalesDialog({ lang, draft, previousEntries = [], businessesList = businesses, onCancel, onConfirm }) {
  if (!draft) return null;
  const store = businessesList.find((business) => business.id === draft.businessId);
  const newAmount = (draft.salesChannels || []).reduce((sum, row) => sum + row.amount, 0);
  const previousTotal = previousEntries.reduce((sum, entry) => sum + entry.amount, 0);
  return <AnimatePresence><motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 z-[60] flex items-end bg-[#112A46]/50 sm:items-center sm:justify-center sm:p-6 lg:items-end lg:justify-start lg:p-0"><motion.div initial={{ y: 18 }} animate={{ y: 0 }} exit={{ y: 18 }} className="relative z-10 w-full rounded-t-[30px] bg-[#F8F6F0] p-5 pb-8 sm:max-w-[560px] sm:rounded-[30px] sm:p-6 lg:max-w-none lg:rounded-t-[30px] lg:rounded-b-none lg:p-5 lg:pb-8"><div className="mb-4 flex items-start justify-between"><div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#FFF1EE] text-[#B44747]"><Bell className="h-5 w-5" /></div><button onClick={onCancel} className="flex h-9 w-9 items-center justify-center rounded-xl bg-white ring-1 ring-black/[0.05]"><X className="h-4 w-4" /></button></div><h3 className="text-base font-black">{text(lang, "duplicateSalesTitle")}</h3><p className="mt-2 text-taq-meta font-bold leading-6 text-[#716753]">{text(lang, "duplicateSalesWarning")}</p><div className="mt-4 rounded-2xl bg-white p-4 ring-1 ring-black/[0.045]"><p className="text-taq-meta font-black text-[#112A46]">{businessName(store, lang)} · {formatCalendarDate(draft.date, lang)}</p><div className="mt-3 flex justify-between text-xs font-bold text-[#827762]"><span>{text(lang, "previousSalesEntries")} ({previousEntries.length})</span><strong>{money(previousTotal, lang)}</strong></div><div className="mt-2 flex justify-between border-t border-[#F0ECE2] pt-2 text-xs font-black"><span>{text(lang, "summary")}</span><strong className="text-[#257844]">+{money(newAmount, lang)}</strong></div></div><div className="mt-5 grid grid-cols-[0.9fr_1.35fr] gap-3"><button onClick={onCancel} className="rounded-2xl bg-white py-3.5 text-xs font-black ring-1 ring-black/[0.06]">{text(lang, "cancel")}</button><button onClick={onConfirm} className="rounded-2xl bg-[#B44747] py-3.5 text-xs font-black text-white">{text(lang, "saveAdditionalEntry")}</button></div></motion.div></motion.div></AnimatePresence>;
}

function VoidOperationDialog({ lang, item, onCancel, onConfirm }) {
  const [reason, setReason] = useState("");
  useEffect(() => { setReason(""); }, [item?.id]);
  if (!item) return null;
  const isSale = item.type === "summary";
  return <AnimatePresence><motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 z-[60] flex items-end bg-[#112A46]/50 sm:items-center sm:justify-center sm:p-6 lg:items-end lg:justify-start lg:p-0"><motion.div initial={{ y: 18 }} animate={{ y: 0 }} exit={{ y: 18 }} className="relative z-10 w-full rounded-t-[30px] bg-[#F8F6F0] p-5 pb-8 sm:max-w-[560px] sm:rounded-[30px] sm:p-6 lg:max-w-none lg:rounded-t-[30px] lg:rounded-b-none lg:p-5 lg:pb-8"><div className="mb-4 flex items-start justify-between"><div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#FFF1EE] text-[#B44747]"><X className="h-5 w-5" /></div><button onClick={onCancel} className="flex h-9 w-9 items-center justify-center rounded-xl bg-white ring-1 ring-black/[0.05]"><X className="h-4 w-4" /></button></div><h3 className="text-base font-black">{text(lang, "voidDialogTitle")}</h3><p className="mt-2 text-taq-meta font-bold leading-6 text-[#716753]">{text(lang, "voidConfirm")}</p><div className="mt-4 rounded-2xl bg-white p-4 ring-1 ring-black/[0.045]"><div className="flex items-center justify-between gap-2"><div className="flex items-center gap-2"><Badge tone={isSale ? "success" : "warning"}>{operationDisplayLabel(item, lang)}</Badge><span className="text-taq-meta font-bold text-[#827762]">{opDate(item, lang)}</span></div><strong className={`tabular-nums text-sm font-black ${isSale ? "text-[#257844]" : "text-[#B44747]"}`}>{money(signedEntryAmount(item), lang)}</strong></div></div><div className="mt-4"><p className="mb-2 text-xs font-bold text-[#716753]">{text(lang, "voidReasonPrompt")}</p><textarea value={reason} onChange={(event) => setReason(event.target.value)} maxLength={160} placeholder={text(lang, "voidReasonPrompt")} className="min-h-[72px] w-full resize-none rounded-2xl bg-white px-4 py-3 text-sm font-bold outline-none ring-1 ring-black/[0.05]" /></div><div className="mt-5 grid grid-cols-[0.9fr_1.35fr] gap-3"><button onClick={onCancel} className="rounded-2xl bg-white py-3.5 text-xs font-black ring-1 ring-black/[0.06]">{text(lang, "cancel")}</button><button onClick={() => onConfirm(reason.trim())} className="rounded-2xl bg-[#B44747] py-3.5 text-xs font-black text-white">{text(lang, "confirmVoid")}</button></div></motion.div></motion.div></AnimatePresence>;
}
function RestoreOperationDialog({ lang, item, onCancel, onConfirm }) {
  const [reason, setReason] = useState("");
  useEffect(() => { setReason(""); }, [item?.id]);
  if (!item) return null;
  const isSale = item.type === "summary";
  return <AnimatePresence><motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 z-[60] flex items-end bg-[#112A46]/50 sm:items-center sm:justify-center sm:p-6 lg:items-end lg:justify-start lg:p-0"><motion.div initial={{ y: 18 }} animate={{ y: 0 }} exit={{ y: 18 }} className="relative z-10 w-full rounded-t-[30px] bg-[#F8F6F0] p-5 pb-8 sm:max-w-[560px] sm:rounded-[30px] sm:p-6 lg:max-w-none lg:rounded-t-[30px] lg:rounded-b-none lg:p-5 lg:pb-8"><div className="mb-4 flex items-start justify-between"><div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#E6F5E9] text-[#257844]"><Check className="h-5 w-5" /></div><button onClick={onCancel} className="flex h-9 w-9 items-center justify-center rounded-xl bg-white ring-1 ring-black/[0.05]"><X className="h-4 w-4" /></button></div><h3 className="text-base font-black">{text(lang, "restoreDialogTitle")}</h3><p className="mt-2 text-taq-meta font-bold leading-6 text-[#716753]">{text(lang, "restoreConfirm")}</p><div className="mt-4 rounded-2xl bg-white p-4 ring-1 ring-black/[0.045]"><div className="flex items-center justify-between gap-2"><div className="flex items-center gap-2"><Badge tone={isSale ? "success" : "warning"}>{operationDisplayLabel(item, lang)}</Badge><span className="text-taq-meta font-bold text-[#827762]">{opDate(item, lang)}</span></div><strong className={`tabular-nums text-sm font-black ${isSale ? "text-[#257844]" : "text-[#B44747]"}`}>{money(signedEntryAmount(item), lang)}</strong></div></div><div className="mt-4"><p className="mb-2 text-xs font-bold text-[#716753]">{text(lang, "restoreReasonPrompt")}</p><textarea value={reason} onChange={(event) => setReason(event.target.value)} maxLength={160} placeholder={text(lang, "restoreReasonPrompt")} className="min-h-[72px] w-full resize-none rounded-2xl bg-white px-4 py-3 text-sm font-bold outline-none ring-1 ring-black/[0.05]" /></div><div className="mt-5 grid grid-cols-[0.9fr_1.35fr] gap-3"><button onClick={onCancel} className="rounded-2xl bg-white py-3.5 text-xs font-black ring-1 ring-black/[0.06]">{text(lang, "cancel")}</button><button onClick={() => onConfirm(reason.trim())} className="rounded-2xl bg-[#257844] py-3.5 text-xs font-black text-white">{text(lang, "confirmRestore")}</button></div></motion.div></motion.div></AnimatePresence>;
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
              <p className="text-taq-meta font-bold text-[#827762]">{text(lang, "addOutflow")}</p>
              <h3 className="text-base font-black text-[#112A46]">{lang === "ar" ? "إضافة عملية" : "Add entry"}</h3>
            </div>
            <button onClick={onClose} className="flex h-9 w-9 items-center justify-center rounded-xl bg-white ring-1 ring-black/[0.05]"><X className="h-4 w-4" /></button>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <button onClick={onSummary} className="flex min-h-[142px] flex-col items-start justify-between rounded-[24px] bg-[#112A46] p-4 text-start text-white">
              <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/10"><ReceiptText className="h-5 w-5" /></span>
              <span><strong className="block text-taq-meta font-black leading-5">{employee ? text(lang, "enterDailySummary") : text(lang, "enterOwnerSummary")}</strong><small className="mt-1 block text-taq-nav font-bold leading-4 text-white/65">{text(lang, "salesChannelsAndTotal")}</small></span>
            </button>
            <button onClick={onExpense} className="flex min-h-[142px] flex-col items-start justify-between rounded-[24px] bg-white p-4 text-start text-[#112A46] ring-1 ring-black/[0.055]">
              <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#FFF0CB] text-[#806528]"><Plus className="h-5 w-5" /></span>
              <span><strong className="block text-taq-meta font-black leading-5">{secondaryTitle}</strong><small className="mt-1 block text-taq-nav font-bold leading-4 text-[#827762]">{text(lang, "amountNoteOptionalPhoto")}</small></span>
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

function OwnerHomeConnected(props) {
  const { pendingSubmittedCloseouts } = useDailyCloseouts();
  const storeIds = props.businessesList?.map((business) => business.id) || [];
  const pending = pendingSubmittedCloseouts(storeIds, props.closeoutReviewEnabledForBusiness);
  return (
    <OwnerHome
      {...props}
      pendingEmployeeCloseouts={pending}
      onViewPendingCloseouts={() => {
        const first = pending[0];
        if (first) props.onViewPendingCloseouts?.(first);
      }}
    />
  );
}

function OwnerRegisterConnected(props) {
  const { events } = useDailyCloseouts();
  return <OwnerRegisterScreen {...props} closeoutEvents={events} />;
}

function formatDateTimeLabel(iso, lang) {
  if (!iso) return "";
  const datePart = iso.slice(0, 10);
  const time = new Date(iso).toLocaleTimeString(lang === "ar" ? "ar-SA" : "en-US", { hour: "2-digit", minute: "2-digit" });
  return `${formatCalendarDate(datePart, lang)} · ${time}`;
}

function OwnerCloseoutModals({
  lang,
  ownerReviewCloseout,
  returnCloseoutTarget,
  ownerDisplayName,
  reviewWorkflowEnabled,
  ownerNotebookTheme = "yellow",
  resolveSalesChannels = () => [],
  channelLabel,
  onCloseoutUpdated = async () => {},
  onCloseoutDeleted = async () => {},
  onCloseReview,
  onRequestReturn,
}) {
  const { approveCloseout, returnCloseout, upsertCloseout, deleteCloseout } = useDailyCloseouts();
  const [editCloseout, setEditCloseout] = useState(null);

  if (editCloseout) {
    return (
      <DailyCloseoutEntryFlow
        lang={lang}
        notebookTheme={editCloseout.notebookTheme || ownerNotebookTheme}
        closeout={editCloseout}
        salesChannels={resolveSalesChannels(editCloseout.storeId)}
        storeName={editCloseout.storeName}
        isResubmit={false}
        saving={false}
        channelLabel={channelLabel}
        onCancel={() => setEditCloseout(null)}
        onSaveDraft={(draft) => setEditCloseout(draft)}
        onSubmit={async (nextCloseout) => {
          const updated = upsertCloseout(nextCloseout);
          await onCloseoutUpdated(updated);
          setEditCloseout(null);
          onCloseReview();
        }}
        findForStoreDate={() => null}
      />
    );
  }

  return (
    <>
      <OwnerCloseoutReviewPanel
        lang={lang}
        closeout={ownerReviewCloseout}
        formatCalendarDate={formatCalendarDate}
        formatDateTime={formatDateTimeLabel}
        reviewWorkflowEnabled={reviewWorkflowEnabled}
        onClose={onCloseReview}
        onApprove={async () => {
          if (!ownerReviewCloseout) return;
          const approved = await approveCloseout(ownerReviewCloseout.id, ownerDisplayName);
          if (!approved) {
            window.alert(lang === "ar" ? "تعذر اعتماد التقفيلة على الخادم." : "Failed to approve closeout on server.");
            return;
          }
          await onCloseoutUpdated(approved);
          onCloseReview();
        }}
        onReturn={() => {
          if (!ownerReviewCloseout) return;
          onRequestReturn(ownerReviewCloseout);
        }}
        onEdit={() => {
          if (!ownerReviewCloseout) return;
          setEditCloseout(ownerReviewCloseout);
        }}
        onDelete={async () => {
          if (!ownerReviewCloseout) return;
          const confirmed = window.confirm(lang === "ar" ? "هل تريد حذف هذه التقفيلة نهائيًا؟" : "Delete this closeout permanently?");
          if (!confirmed) return;
          deleteCloseout(ownerReviewCloseout.id);
          await onCloseoutDeleted(ownerReviewCloseout);
          onCloseReview();
        }}
      />
      <ReturnCloseoutModal
        lang={lang}
        open={Boolean(returnCloseoutTarget)}
        closeout={returnCloseoutTarget}
        onCancel={onCloseReview}
        onConfirm={async (reason) => {
          if (!returnCloseoutTarget) return;
          const returned = await returnCloseout(returnCloseoutTarget.id, ownerDisplayName, reason);
          if (!returned) {
            window.alert(lang === "ar" ? "تعذر إرجاع التقفيلة على الخادم." : "Failed to return closeout on server.");
            return;
          }
          await onCloseoutUpdated(returned);
          onCloseReview();
        }}
      />
    </>
  );
}

function BottomNav({ lang, employee, active, onChange, onAdd = () => {} }) {
  const NavButton = ({ item }) => { const Icon = item.icon; return <button onClick={() => onChange(item.id)} className={`flex min-w-[60px] flex-col items-center gap-0.5 text-taq-nav font-bold ${active === item.id ? "text-[#112A46]" : "text-[#A99D87]"}`}><Icon className="h-4.5 w-4.5" />{text(lang, item.key)}</button>; };
  if (employee) {
    return <EmployeeFooterNav lang={lang} onAdd={onAdd} />;
  }
  const leftItems = [{ id: "home", key: "home", icon: Home }, { id: "reports", key: "reports", icon: FileText }];
  const rightItems = [{ id: "register", key: "register", icon: ReceiptText }, { id: "settings", key: "settings", icon: Settings }];
  return (
    <nav className="taq-owner-nav relative z-30 flex h-[64px] w-full shrink-0 items-center justify-between border-t border-[#ECE6DA] bg-white/95 px-4 pb-[env(safe-area-inset-bottom,0px)]">
      <div className="flex w-[122px] items-center justify-between">{leftItems.map((item) => <NavButton key={item.id} item={item} />)}</div>
      <button onClick={onAdd} aria-label={lang === "ar" ? "إضافة عملية" : "Add entry"} className="absolute left-1/2 top-0.5 flex h-[56px] w-[56px] -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border-[4px] border-[#F8F6F0] bg-[#E4B84A] text-[#112A46] shadow-sm"><Plus className="h-7 w-7" strokeWidth={2.4} /></button>
      <div className="w-[52px]" />
      <div className="flex w-[122px] items-center justify-between">{rightItems.map((item) => <NavButton key={item.id} item={item} />)}</div>
    </nav>
  );
}

export default function TaqfeelahPrototypeRuntime() {
  const [lang, setLang] = useState("ar");
  const [sessionUserId, setSessionUserId] = useState("");
  const [loggedIn, setLoggedIn] = useState(() => readPrototypeAuthBoot().loggedIn);
  const [authScreen, setAuthScreen] = useState("owner");
  const [employee, setEmployee] = useState(() => readPrototypeAuthBoot().employee);
  const [loggedInEmployeeId, setLoggedInEmployeeId] = useState(() => readPrototypeAuthBoot().loggedInEmployeeId);
  const [closeoutAlerts, setCloseoutAlerts] = useState(() => readCloseoutAlerts());
  const [helpOpen, setHelpOpen] = useState(false);
  const [employeePage, setEmployeePage] = useState("closeouts");
  const [ownerReviewCloseout, setOwnerReviewCloseout] = useState(null);
  const [returnCloseoutTarget, setReturnCloseoutTarget] = useState(null);
  const [employeeThemeOverride, setEmployeeThemeOverride] = useState(() => {
    const boot = readPrototypeAuthBoot();
    return boot.employee && boot.loggedInEmployeeId ? readEmployeeNotebookTheme(boot.loggedInEmployeeId) : null;
  });
  const employeeAddHandlerRef = useRef(() => {});
  const employeeSettingsOpenerRef = useRef(() => {});
  const [employeeEntryActive, setEmployeeEntryActive] = useState(false);
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
  const [operationalEntriesSyncError, setOperationalEntriesSyncError] = useState("");
  const [summaryRefreshKey, setSummaryRefreshKey] = useState(0);
  const [acknowledgedDuplicateSales, setAcknowledgedDuplicateSales] = useState(() => readAcknowledgedDuplicateSales());
  const [notebookTheme, setNotebookTheme] = useState(() => { if (typeof window === "undefined") return "yellow"; return window.localStorage.getItem("taqfeelah_notebook_theme") || "yellow"; });
  const [selectedBusiness, setSelectedBusiness] = useState("all");
  const [shareSnapshot, setShareSnapshot] = useState(null);
  const [quickAddOpen, setQuickAddOpen] = useState(false);
  const [archivedReadOnlyBusinessId, setArchivedReadOnlyBusinessId] = useState(null);
  const initialSettings = readSavedSettings();
  const initialAuthConfig = initialSettings?.authConfig || {};
  const initialBusinesses = initialSettings?.configuredBusinesses || (BINDS_TO_SERVER_AUTH ? [] : businesses);
  const [configuredBusinesses, setConfiguredBusinesses] = useState(initialBusinesses);
  const [archivedBusinessIds, setArchivedBusinessIds] = useState(initialSettings?.archivedBusinessIds || initialSettings?.archivedStores || []);
  const [staff, setStaff] = useState(initialSettings?.staff || (BINDS_TO_SERVER_AUTH ? [] : PROTOTYPE_DEFAULT_STAFF));
  const [ownerProfile, setOwnerProfile] = useState(initialSettings?.ownerProfile || { name: "محمد الهاجري" });
  const currentOwnerActor = { ...ownerActor, nameAr: ownerProfile.name, nameEn: ownerProfile.name };
  const [storeChannelSettings, setStoreChannelSettings] = useState(() => buildInitialStoreChannelSettings(initialSettings, initialBusinesses));
  const [storeOperationalSettings, setStoreOperationalSettings] = useState(() => buildInitialStoreOperationalSettings(initialSettings, initialBusinesses));
  const [authOwnerUsername, setAuthOwnerUsername] = useState(() => initialAuthConfig.ownerUsername || PROTOTYPE_OWNER_USERNAME || "hajri");
  const [authOwnerPassword, setAuthOwnerPassword] = useState(() => initialAuthConfig.ownerPassword || PROTOTYPE_OWNER_PASSWORD || "123");
  const [authEmployeePins, setAuthEmployeePins] = useState(() => (initialAuthConfig.employeePins && typeof initialAuthConfig.employeePins === "object" ? initialAuthConfig.employeePins : {}));
  const [lastCloseoutDates, setLastCloseoutDates] = useState(() => readDemoLastCloseoutDates());
  const [employeeBusinessId, setEmployeeBusinessId] = useState(() => readPrototypeAuthBoot().employeeBusinessId);
  const loadOperationalEntriesFromApiRef = useRef(async () => []);
  useEffect(() => {
    if (!BINDS_TO_SERVER_AUTH) return;
    let cancelled = false;
    getSessionStatusViaApi()
      .then((session) => {
        if (cancelled || !session?.authenticated) return;
        setSessionUserId(typeof session.userId === "string" ? session.userId : "");
        setLoggedIn(true);
        setAuthScreen("owner");
        if (session.role === "employee") {
          setEmployee(true);
          setLoggedInEmployeeId(session.userId);
          setEmployeePage("closeouts");
          return;
        }
        setEmployee(false);
        setLoggedInEmployeeId(null);
        setOwnerPage("home");
      })
      .catch((error) => {
        if (cancelled) return;
        console.warn("session bootstrap failed", error);
        setSessionUserId("");
      });
    return () => {
      cancelled = true;
    };
  }, []);
  useEffect(() => {
    if (!BINDS_TO_SERVER_AUTH || !employee || !sessionUserId) return;
    const matchedStaff = staff.find(
      (person) => person.apiUserId === sessionUserId || person.id === loggedInEmployeeId,
    );
    if (matchedStaff?.id && matchedStaff.id !== loggedInEmployeeId) {
      setLoggedInEmployeeId(matchedStaff.id);
    }
  }, [employee, loggedInEmployeeId, sessionUserId, staff]);
  const activeBusinesses = configuredBusinesses.filter((business) => !archivedBusinessIds.includes(business.id));
  const reportingBusinesses = configuredBusinesses;
  const activeViewBusiness = activeBusinesses.length === 1 ? activeBusinesses[0].id : selectedBusiness === "all" || activeBusinesses.some((business) => business.id === selectedBusiness) ? selectedBusiness : "all";
  const activeEmployee = employee && loggedInEmployeeId
    ? staff.find((person) => (person.id === loggedInEmployeeId || person.apiUserId === loggedInEmployeeId) && person.active && !person.removed) || null
    : null;
  const assignedEmployeeBusinesses = activeBusinesses.filter((business) => (activeEmployee?.storeIds || []).includes(business.id));
  const currentEmployeeBusiness = assignedEmployeeBusinesses.find((business) => business.id === employeeBusinessId) || assignedEmployeeBusinesses[0] || null;
  const currentEmployeeChannelConfig = getStoreChannelConfig(storeChannelSettings, currentEmployeeBusiness?.id);
  const currentEmployeeOperationalConfig = getStoreOperationalConfig(storeOperationalSettings, currentEmployeeBusiness?.id);
  const resolveStoreSalesChannels = useCallback((storeId) => {
    const channelConfig = getStoreChannelConfig(storeChannelSettings, storeId);
    return channelConfig.channels
      .filter((channel) => channelConfig.activeIds.includes(channel.id) && !channel.retired)
      .map((channel) => ({ ...channel, displayName: channelName(channel, lang) }));
  }, [storeChannelSettings, lang]);
  const currentEmployeeCategories = expenseCategories.filter((item) => currentEmployeeOperationalConfig.activeCategories.includes(item.id));
  const activeOwnerStoreId = activeViewBusiness === "all" ? activeBusinesses[0]?.id : activeViewBusiness;
  const reportSettingsStoreId = archivedReadOnlyBusinessId || activeOwnerStoreId;
  const reportChannelConfig = getStoreChannelConfig(storeChannelSettings, reportSettingsStoreId);
  const {
    reviewEnabledForBusiness,
    closeoutReviewEnabledForBusiness,
    attachmentAlertEnabledForBusiness,
    closeoutAlertEnabledForBusiness,
  } = useMemo(
    () => buildStoreOperationalPolicy(storeOperationalSettings),
    [storeOperationalSettings],
  );
  const employeeNotebookTheme = resolveNotebookTheme({
    storeOperationalSettings,
    storeId: currentEmployeeBusiness?.id,
    globalTheme: notebookTheme,
    employeeThemeOverride: employeeThemeOverride || (activeEmployee ? readEmployeeNotebookTheme(activeEmployee.id) : null),
  });
  const ownerReviewEnabled = activeViewBusiness === "all" ? activeBusinesses.some((business) => reviewEnabledForBusiness(business.id)) : reviewEnabledForBusiness(activeOwnerStoreId);
  const selectedOperationReviewEnabled = selected ? reviewEnabledForBusiness(selected.businessId) && !archivedBusinessIds.includes(selected.businessId) : ownerReviewEnabled;
  const runtimeSettingsSnapshot = useMemo(
    () => buildRuntimeSettingsSnapshot({
      orgConfigApiEnabled: ORG_CONFIG_API_ENABLED,
      storeOperationalSettings,
      notebookTheme,
      ownerProfile,
      authConfig: {
        ownerUsername: authOwnerUsername,
        ownerPassword: authOwnerPassword,
        employeePins: authEmployeePins,
      },
      configuredBusinesses,
      archivedBusinessIds,
      storeChannelSettings,
      staff,
    }),
    [
      configuredBusinesses,
      archivedBusinessIds,
      storeChannelSettings,
      storeOperationalSettings,
      notebookTheme,
      staff,
      ownerProfile,
      authOwnerUsername,
      authOwnerPassword,
      authEmployeePins,
    ],
  );

  const { error: orgConfigSyncError } = useOrgConfigRuntimeBridge({
    enabled: ORG_CONFIG_API_ENABLED && usesRuntimeSettingsApi(),
    auth: readOwnerSettingsApiAuth(),
    loggedIn,
    isEmployee: employee,
    employeePins: authEmployeePins,
    configuredBusinesses,
    archivedBusinessIds,
    storeChannelSettings,
    storeOperationalSettings,
    staff,
    setConfiguredBusinesses,
    setArchivedBusinessIds,
    setStoreChannelSettings,
    setStoreOperationalSettings,
    setStaff,
  });

  const applyRuntimeSettingsSnapshot = useCallback((rawSettings) => {
    applyRuntimeSettingsSnapshotPatch({
      migrated: migrateSavedSettings(rawSettings),
      orgConfigApiEnabled: ORG_CONFIG_API_ENABLED,
      apply: {
        setConfiguredBusinesses,
        setArchivedBusinessIds,
        setStoreChannelSettings,
        setStaff,
        setStoreOperationalSettings,
        setNotebookTheme,
        setOwnerProfile,
        setAuthOwnerUsername,
        setAuthOwnerPassword,
        setAuthEmployeePins,
      },
    });
  }, []);

  const {
    syncError: runtimeSettingsSyncError,
    persistNow: persistRuntimeSettingsNow,
  } = useRuntimeSettingsFromApi({
    enabled: usesRuntimeSettingsApi(),
    auth: readOwnerSettingsApiAuth(),
    loggedIn,
    isEmployee: employee,
    lang,
    snapshot: runtimeSettingsSnapshot,
    onHydrate: applyRuntimeSettingsSnapshot,
  });

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
  const unseenCloseoutAlerts = closeoutAlerts.filter((alert) => !alert.seen && closeoutAlertEnabledForBusiness(alert.businessId));
  const ownerNotificationsVisible = duplicateSalesAlerts.length > 0 || ownerHasPendingReview || unseenCloseoutAlerts.length > 0;
  const ownerNotificationBadge = ownerHasPendingReview || duplicateSalesAlerts.length > 0 || unseenCloseoutAlerts.length > 0;
  useEffect(() => { if (typeof window !== "undefined") window.localStorage.setItem("taqfeelah_notebook_theme", notebookTheme); }, [notebookTheme]);
  useEffect(() => {
    applyNotebookThemeCssVariables(employee ? employeeNotebookTheme : notebookTheme);
  }, [employee, employeeNotebookTheme, notebookTheme]);
  useEffect(() => {
    if (BINDS_TO_SERVER_AUTH || ENTRIES_API_DB_SOURCE || typeof window === "undefined") return;
    window.localStorage.setItem(OPERATIONAL_ENTRIES_STORAGE_KEY, JSON.stringify(stripEmbeddedAttachmentImages(operationalEntries)));
  }, [operationalEntries]);
  useEffect(() => {
    if (BINDS_TO_SERVER_AUTH || typeof window === "undefined") return;
    window.localStorage.setItem(ACKNOWLEDGED_DUPLICATE_SALES_STORAGE_KEY, JSON.stringify(acknowledgedDuplicateSales));
  }, [acknowledgedDuplicateSales]);
  useEffect(() => {
    if (BINDS_TO_SERVER_AUTH || typeof window === "undefined") return;
    window.localStorage.setItem(LAST_CLOSEOUT_STORAGE_KEY, JSON.stringify(lastCloseoutDates));
  }, [lastCloseoutDates]);
  useEffect(() => { writeCloseoutAlerts(closeoutAlerts); }, [closeoutAlerts]);
  useEffect(() => {
    if (BINDS_TO_SERVER_AUTH || CLOSEOUTS_API_DB_SOURCE) return;
    autoResolveSubmittedCloseoutsWithoutReview((storeId) => Boolean(getStoreOperationalConfig(storeOperationalSettings, storeId).closeoutReviewEnabled));
  }, [storeOperationalSettings]);
  useEffect(() => {
    setCloseoutAlerts((current) => current.filter((alert) => getStoreOperationalConfig(storeOperationalSettings, alert.businessId).closeoutAlert));
  }, [storeOperationalSettings]);
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
      if (entriesApiEnabled) {
        const created = await createOperationalEntryInApi({
          payload,
          actorUserId: activeEmployee.id,
          actorRole: "employee",
        });
        if (!created) {
          window.alert(lang === "ar" ? "تعذر حفظ العملية على الخادم." : "Failed to save entry on server.");
          return;
        }
        const refreshed = await loadOperationalEntriesFromApi();
        if (payload.type === "summary") {
          const latestActiveCloseoutDate = refreshed
            .filter((entry) => entry.businessId === payload.businessId && entry.type === "summary" && entryIsActive(entry))
            .map((entry) => entry.date)
            .sort()
            .pop();
          setLastCloseoutDates((current) => ({
            ...current,
            [payload.businessId]: latestActiveCloseoutDate || payload.date,
          }));
          const createdEntry = refreshed.find((entry) => entry.id === created.id);
          if (createdEntry) pushCloseoutAlert(payload, createdEntry, actor);
        }
        setEmployeePage("home"); setSaved(true); window.setTimeout(() => setSaved(false), 2200);
        return;
      }
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
      if (entriesApiEnabled) {
        const created = await createOperationalEntryInApi({
          payload,
          actorUserId: ownerApiUserId,
          actorRole: "owner",
        });
        if (!created) {
          window.alert(lang === "ar" ? "تعذر حفظ العملية على الخادم." : "Failed to save entry on server.");
          return;
        }
        const refreshed = await loadOperationalEntriesFromApi();
        if (payload.type === "summary") {
          const latestActiveCloseoutDate = refreshed
            .filter((entry) => entry.businessId === payload.businessId && entry.type === "summary" && entryIsActive(entry))
            .map((entry) => entry.date)
            .sort()
            .pop();
          setLastCloseoutDates((current) => ({
            ...current,
            [payload.businessId]: latestActiveCloseoutDate || payload.date,
          }));
        }
        setOwnerPage("home");
        if (payload.type !== "summary") {
          const createdEntry = refreshed.find((entry) => entry.id === created.id);
          setSavedOutflowShareTarget(createdEntry || null);
        } else {
          setSaved(true); window.setTimeout(() => setSaved(false), 2200);
        }
        return;
      }
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
  const confirmReview = async (entryId) => {
    if (entriesApiEnabled) {
      const target = operationalEntries.find((entry) => entry.id === entryId);
      if (!target) return;
      try {
        const reviewed = await reviewStoreEntryViaApi({
          organizationId: closeoutsApiOrganizationId,
          actorUserId: ownerApiUserId,
          actorRole: "owner",
          entry: target,
        });
        if (!reviewed) {
          window.alert(lang === "ar" ? "تعذر تحديث المراجعة على الخادم." : "Failed to update review on server.");
          return;
        }
        await loadOperationalEntriesFromApi();
        setSelected(null);
      } catch (error) {
        console.warn("entry review api failed", error);
        window.alert(lang === "ar" ? "تعذر تحديث المراجعة على الخادم." : "Failed to update review on server.");
      }
      return;
    }
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
    if (phase9ApiEnabled && entriesApiEnabled) {
      const payload = pending.payload;
      const actorUserId = pending.actor === "owner" ? ownerApiUserId : activeEmployee?.id;
      const actorRole = pending.actor === "owner" ? "owner" : "employee";
      if (!actorUserId || !payload?.businessId) return;
      savingRef.current = true;
      setSaving(true);
      try {
        const apiPayload = await resolvePayloadAttachmentForPhase9Api({
          enabled: phase9ApiEnabled,
          organizationId: closeoutsApiOrganizationId,
          actorUserId,
          actorRole,
          storeId: payload.businessId,
          payload,
        });
        const created = await approveDuplicateSummaryViaApi({
          organizationId: closeoutsApiOrganizationId,
          actorUserId,
          actorRole,
          storeId: payload.businessId,
          date: payload.date,
          payload: apiPayload,
        });
        if (!created) {
          window.alert(lang === "ar" ? "تعذر حفظ الملخص المكرر على الخادم." : "Failed to save duplicate summary on server.");
          return;
        }
        const refreshed = await loadOperationalEntriesFromApi();
        if (payload.type === "summary") {
          const latestActiveCloseoutDate = refreshed
            .filter((entry) => entry.businessId === payload.businessId && entry.type === "summary" && entryIsActive(entry))
            .map((entry) => entry.date)
            .sort()
            .pop();
          setLastCloseoutDates((current) => ({
            ...current,
            [payload.businessId]: latestActiveCloseoutDate || payload.date,
          }));
        }
        if (pending.actor === "owner") {
          setOwnerPage("home");
          setSaved(true);
          window.setTimeout(() => setSaved(false), 2200);
        } else {
          const actor = { role: "employee", userId: activeEmployee.id, nameAr: activeEmployee.nameAr, nameEn: activeEmployee.nameEn };
          const createdEntry = refreshed.find((entry) => entry.id === created.id);
          if (createdEntry) pushCloseoutAlert(payload, createdEntry, actor);
          setEmployeePage("home");
          setSaved(true);
          window.setTimeout(() => setSaved(false), 2200);
        }
      } catch (error) {
        console.warn("duplicate summary approve api failed", error);
        window.alert(lang === "ar" ? "تعذر حفظ الملخص المكرر على الخادم." : "Failed to save duplicate summary on server.");
      } finally {
        savingRef.current = false;
        setSaving(false);
      }
      return;
    }
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
  const acknowledgeDuplicateSales = async (alert) => {
    if (!alert?.businessId || !alert?.date || !alert.entries?.length) return;
    if (phase9ApiEnabled && entriesApiEnabled) {
      try {
        const acknowledged = await acknowledgeDuplicateSummariesViaApi({
          organizationId: closeoutsApiOrganizationId,
          actorUserId: ownerApiUserId,
          actorRole: "owner",
          storeId: alert.businessId,
          date: alert.date,
          entryIds: alert.entries.map((entry) => entry.id),
        });
        if (!acknowledged) {
          window.alert(lang === "ar" ? "تعذر تأكيد الملخصات المكررة على الخادم." : "Failed to acknowledge duplicate summaries on server.");
          return;
        }
        setAcknowledgedDuplicateSales((current) => ({ ...current, [duplicateSalesGroupKey(alert)]: duplicateSalesSignature(alert.entries) }));
      } catch (error) {
        console.warn("duplicate summary acknowledge api failed", error);
        window.alert(lang === "ar" ? "تعذر تأكيد الملخصات المكررة على الخادم." : "Failed to acknowledge duplicate summaries on server.");
      }
      return;
    }
    const actionAt = new Date().toISOString();
    const approvedIds = new Set(alert.entries.map((entry) => entry.id));
    setOperationalEntries((current) => current.map((entry) => approvedIds.has(entry.id) ? { ...entry, auditTrail: [...(entry.auditTrail || []), { action: "duplicate_approved", at: actionAt, by: currentOwnerActor, reason: "" }] } : entry));
    setAcknowledgedDuplicateSales((current) => ({ ...current, [duplicateSalesGroupKey(alert)]: duplicateSalesSignature(alert.entries) }));
  };
  const confirmVoidOperation = async (reason = "") => {
    if (entriesApiEnabled) {
      const target = voidTarget;
      if (!target || entryIsVoided(target) || archivedBusinessIds.includes(target.businessId)) { setVoidTarget(null); return; }
      try {
        const voided = await voidStoreEntryViaApi({
          organizationId: closeoutsApiOrganizationId,
          actorUserId: ownerApiUserId,
          actorRole: "owner",
          entry: target,
          reason: reason.trim(),
        });
        if (!voided) {
          window.alert(lang === "ar" ? "تعذر إلغاء العملية على الخادم." : "Failed to void entry on server.");
          return;
        }
        const refreshed = await loadOperationalEntriesFromApi();
        if (target.type === "summary") {
          const latestActiveCloseoutDate = refreshed
            .filter((entry) => entry.businessId === target.businessId && entry.type === "summary" && entryIsActive(entry))
            .map((entry) => entry.date)
            .sort()
            .pop();
          setLastCloseoutDates((current) => {
            const next = { ...current };
            if (latestActiveCloseoutDate) next[target.businessId] = latestActiveCloseoutDate;
            else delete next[target.businessId];
            return next;
          });
        }
        setVoidTarget(null);
        setSelected(null);
      } catch (error) {
        console.warn("entry void api failed", error);
        window.alert(lang === "ar" ? "تعذر إلغاء العملية على الخادم." : "Failed to void entry on server.");
      }
      return;
    }
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
  const confirmRestoreOperation = async (reason = "") => {
    if (entriesApiEnabled) {
      const target = restoreTarget;
      if (!target || !entryIsVoided(target) || archivedBusinessIds.includes(target.businessId)) { setRestoreTarget(null); return; }
      try {
        const restored = await restoreStoreEntryViaApi({
          organizationId: closeoutsApiOrganizationId,
          actorUserId: ownerApiUserId,
          actorRole: "owner",
          entry: target,
          reason: reason.trim(),
        });
        if (!restored) {
          window.alert(lang === "ar" ? "تعذر استرجاع العملية على الخادم." : "Failed to restore entry on server.");
          return;
        }
        const refreshed = await loadOperationalEntriesFromApi();
        if (target.type === "summary") {
          const latestActiveCloseoutDate = refreshed
            .filter((entry) => entry.businessId === target.businessId && entry.type === "summary" && entryIsActive(entry))
            .map((entry) => entry.date)
            .sort()
            .pop();
          setLastCloseoutDates((current) => ({ ...current, [target.businessId]: latestActiveCloseoutDate || target.date }));
        }
        setRestoreTarget(null);
        setSelected(null);
      } catch (error) {
        console.warn("entry restore api failed", error);
        window.alert(lang === "ar" ? "تعذر استرجاع العملية على الخادم." : "Failed to restore entry on server.");
      }
      return;
    }
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
  const completeOwnerLogin = (apiUserId = "") => {
    if (!PROTOTYPE_ACCESS_MODE) {
      saveAuthSession({ role: "owner" });
    }
    setSessionUserId(typeof apiUserId === "string" ? apiUserId : "");
    setLoggedIn(true);
    setEmployee(false);
    setLoggedInEmployeeId(null);
    setAuthScreen("owner");
    setOwnerPage("home");
  };
  const completeEmployeeLogin = (personId, apiUserId = "") => {
    const person = staff.find((item) => item.id === personId && item.active && !item.removed);
    const resolvedEmployeeId = person?.id || (typeof apiUserId === "string" && apiUserId ? apiUserId : personId);
    if (!resolvedEmployeeId) return;
    if (!PROTOTYPE_ACCESS_MODE) {
      saveAuthSession({ role: "employee", employeeId: resolvedEmployeeId });
    }
    setSessionUserId(typeof apiUserId === "string" ? apiUserId : "");
    setLoggedIn(true);
    setEmployee(true);
    setLoggedInEmployeeId(resolvedEmployeeId);
    setEmployeeBusinessId(person?.storeIds?.[0] || activeBusinesses[0]?.id || "");
    setEmployeeThemeOverride(readEmployeeNotebookTheme(resolvedEmployeeId));
    setEmployeePage("closeouts");
    setAuthScreen("owner");
  };
  const removeOperationalEntriesForCloseout = useCallback((closeoutId, storeId = null) => {
    if (!closeoutId) return;
    setOperationalEntries((current) => {
      const next = current.filter((entry) => entry.closeoutId !== closeoutId);
      if (storeId) {
        const latestActiveCloseoutDate = next
          .filter((entry) => entry.businessId === storeId && entry.type === "summary" && entryIsActive(entry))
          .map((entry) => entry.date)
          .sort()
          .pop();
        setLastCloseoutDates((prev) => {
          const updated = { ...prev };
          if (latestActiveCloseoutDate) updated[storeId] = latestActiveCloseoutDate;
          else delete updated[storeId];
          return updated;
        });
      }
      return next;
    });
  }, []);

  const syncCloseoutToOperationalEntries = useCallback(async (closeout, { force = false } = {}) => {
    if (ENTRIES_API_DB_SOURCE) {
      if (typeof loadOperationalEntriesFromApiRef.current === "function") {
        await loadOperationalEntriesFromApiRef.current();
      }
      return;
    }
    if (!closeout) return;
    if (!force && closeout.syncedToEntries) return;
    if (force) {
      removeOperationalEntriesForCloseout(closeout.id, closeout.storeId);
    }
    const actor = {
      role: "employee",
      userId: closeout.submittedByUserId || closeout.openedByUserId,
      nameAr: closeout.submittedByName || closeout.openedByName,
      nameEn: closeout.submittedByName || closeout.openedByName,
    };
    const { entries } = buildOperationalEntriesFromCloseout(closeout, actor);
    const created = [];
    for (const item of entries) {
      const entry = buildEntry(item.payload, actor);
      if (item.payload.attachment || item.attachment) {
        const attachmentPayload = item.payload.attachment || item.attachment;
        try {
          await storeAttachmentPayload(attachmentPayload);
          entry.attachment = makeAttachment(entry.id, attachmentPayload);
        } catch {
          window.alert(text(lang, "attachmentSaveFailed"));
        }
      }
      created.push(entry);
    }
    if (created.length) {
      setOperationalEntries((current) => [...created, ...current]);
      const summaryEntry = created.find((entry) => entry.type === "summary");
      if (summaryEntry) {
        setLastCloseoutDates((current) => ({
          ...current,
          [summaryEntry.businessId]: !current[summaryEntry.businessId] || summaryEntry.date > current[summaryEntry.businessId] ? summaryEntry.date : current[summaryEntry.businessId],
        }));
      }
    }
  }, [lang, removeOperationalEntriesForCloseout]);

  const handleOwnerCloseoutUpdated = useCallback(async (closeout) => {
    if (!closeout) return;
    if (closeout.status === "reviewed") {
      await syncCloseoutToOperationalEntries({ ...closeout, syncedToEntries: false }, { force: true });
      return;
    }
    if (ENTRIES_API_DB_SOURCE) {
      if (typeof loadOperationalEntriesFromApiRef.current === "function") {
        await loadOperationalEntriesFromApiRef.current();
      }
      return;
    }
    removeOperationalEntriesForCloseout(closeout.id, closeout.storeId);
  }, [removeOperationalEntriesForCloseout, syncCloseoutToOperationalEntries]);

  const handleOwnerCloseoutDeleted = useCallback(async (closeout) => {
    if (!closeout) return;
    if (ENTRIES_API_DB_SOURCE) {
      if (typeof loadOperationalEntriesFromApiRef.current === "function") {
        await loadOperationalEntriesFromApiRef.current();
      }
    } else {
      removeOperationalEntriesForCloseout(closeout.id, closeout.storeId);
    }
    setCloseoutAlerts((current) => current.filter((item) => !(item.businessId === closeout.storeId && item.date === closeout.date)));
    setOwnerReviewCloseout((current) => (current?.id === closeout.id ? null : current));
    setReturnCloseoutTarget((current) => (current?.id === closeout.id ? null : current));
  }, [removeOperationalEntriesForCloseout]);
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
  const handleOpenOwnerOperation = useCallback((entry) => {
    if (!BINDS_TO_SERVER_AUTH && !CLOSEOUTS_API_DB_SOURCE && entry?.type === "summary" && entry.closeoutId) {
      const closeout = readDailyCloseouts().find((item) => item.id === entry.closeoutId);
      if (closeout) {
        setReturnCloseoutTarget(null);
        setOwnerReviewCloseout(closeout);
        return;
      }
    }
    setSelected(entry || null);
  }, []);
  const logout = async () => {
    if (BINDS_TO_SERVER_AUTH) {
      try {
        await logoutSessionViaApi();
      } catch (error) {
        console.warn("logout api failed", error);
      }
    }
    clearAuthSession();
    setSessionUserId("");
    setLoggedIn(false);
    setEmployee(false);
    setLoggedInEmployeeId(null);
    setAuthScreen("owner");
    setEmployeePage("closeouts");
    setOwnerPage("home");
    setOwnerReviewCloseout(null);
    setReturnCloseoutTarget(null);
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
    if (BINDS_TO_SERVER_AUTH) {
      setOperationalEntries([]);
      setStaff([]);
      setConfiguredBusinesses([]);
      setArchivedBusinessIds([]);
      setAuthOwnerUsername("");
      setAuthOwnerPassword("");
      setAuthEmployeePins({});
      setOwnerProfile({ name: "" });
    }
  };
  const ownerDisplayName = ownerProfile?.name || (lang === "ar" ? "المالك" : "Owner");
  const closeoutsApiEnabled = process.env.NEXT_PUBLIC_CLOSEOUTS_API_ENABLED === "true";
  const closeoutsApiStrictMode = isCloseoutsApiStrictMode();
  const closeoutsApiOrganizationId = process.env.NEXT_PUBLIC_CLOSEOUTS_API_ORGANIZATION_ID || "";
  const closeoutsApiOwnerUserId = process.env.NEXT_PUBLIC_CLOSEOUTS_API_OWNER_USER_ID || "";
  const ownerApiUserId = sessionUserId || closeoutsApiOwnerUserId;
  const apiActorRole = employee ? "employee" : "owner";
  const apiActorUserId = employee
    ? (sessionUserId || activeEmployee?.apiUserId || activeEmployee?.id || "")
    : ownerApiUserId;
  const apiTargetStoreIdsKey = (employee ? assignedEmployeeBusinesses : reportingBusinesses)
    .map((store) => store.id)
    .filter(Boolean)
    .join("|");
  const entriesApiEnabled = process.env.NEXT_PUBLIC_ENTRIES_API_ENABLED
    ? process.env.NEXT_PUBLIC_ENTRIES_API_ENABLED === "true"
    : closeoutsApiEnabled;
  const phase9ApiEnabled = process.env.NEXT_PUBLIC_PHASE9_API_ENABLED
    ? process.env.NEXT_PUBLIC_PHASE9_API_ENABLED === "true"
    : entriesApiEnabled;
  const entriesApiStrictMode = isEntriesApiStrictMode();

  const createOperationalEntryInApi = useCallback(async ({ payload, actorUserId, actorRole }) => {
    if (!entriesApiEnabled) {
      if (entriesApiStrictMode) throw new Error("entries API is disabled in production mode.");
      return null;
    }
    if (!isUuid(closeoutsApiOrganizationId)) {
      if (entriesApiStrictMode) throw new Error("organization id is missing/invalid for entries API.");
      return null;
    }
    const apiPayload = await resolvePayloadAttachmentForPhase9Api({
      enabled: phase9ApiEnabled,
      organizationId: closeoutsApiOrganizationId,
      actorUserId,
      actorRole,
      storeId: payload?.businessId,
      payload,
    });
    return createStoreEntryViaApi({
      organizationId: closeoutsApiOrganizationId,
      actorUserId,
      actorRole,
      payload: apiPayload,
    });
  }, [closeoutsApiOrganizationId, entriesApiEnabled, entriesApiStrictMode, phase9ApiEnabled]);

  const loadOperationalEntriesFromApi = useCallback(async () => {
    if (!entriesApiEnabled) {
      if (entriesApiStrictMode) throw new Error("entries API is disabled in production mode.");
      return [];
    }
    if (!isUuid(closeoutsApiOrganizationId)) {
      if (entriesApiStrictMode) throw new Error("organization id is missing/invalid for entries API.");
      return [];
    }
    if (!hasCloseoutApiActorMapping(apiActorUserId)) {
      if (entriesApiStrictMode) throw new Error("actor user id is missing/invalid for entries API.");
      return [];
    }

    const targetStoreIds = apiTargetStoreIdsKey ? apiTargetStoreIdsKey.split("|").filter(Boolean) : [];
    if (!targetStoreIds.length) {
      setOperationalEntries([]);
      setOperationalEntriesSyncError("");
      return [];
    }

    const dateTo = todayIsoDate();
    const useRegisterPagination = REGISTER_ENTRIES_PAGINATION_ENABLED;
    const dateFrom = isoDaysAgo(useRegisterPagination ? OPERATIONAL_ENTRIES_WORKING_DAYS : 365);
    const bulkLimit = useRegisterPagination ? OPERATIONAL_ENTRIES_WORKING_LIMIT : 1000;

    const fetched = await Promise.all(
      targetStoreIds.map((storeId) => fetchStoreEntriesViaApi({
        organizationId: closeoutsApiOrganizationId,
        actorUserId: apiActorUserId,
        actorRole: apiActorRole,
        storeId,
        dateFrom,
        dateTo,
        status: "all",
        limit: bulkLimit,
      })),
    );

    const merged = fetched.flatMap((items) => (Array.isArray(items) ? items : []));
    const seen = new Set();
    const deduped = merged.filter((item) => {
      const itemId = typeof item?.id === "string" ? item.id : "";
      if (!itemId || seen.has(itemId)) return false;
      seen.add(itemId);
      return true;
    });

    setOperationalEntries(deduped);
    setOperationalEntriesSyncError("");
    setSummaryRefreshKey((current) => current + 1);
    return deduped;
  }, [
    apiActorRole,
    apiActorUserId,
    apiTargetStoreIdsKey,
    closeoutsApiOrganizationId,
    entriesApiEnabled,
    entriesApiStrictMode,
  ]);

  const syncSubmitCloseoutToApi = useCallback(async ({ action, closeout, employee, reviewWorkflowEnabled }) => {
    if (!closeoutsApiEnabled) {
      if (closeoutsApiStrictMode) throw new Error("closeouts API is disabled in production mode.");
      return null;
    }
    const actorUserId = employee?.apiUserId || employee?.id;
    const submitFailure = diagnoseCloseoutSubmitFailure({
      organizationId: closeoutsApiOrganizationId,
      actorUserId,
      closeout,
    });
    if (submitFailure) {
      const channelNames = (submitFailure.unmappedChannels || [])
        .map((row) => row.name || row.channelId)
        .filter(Boolean)
        .join(", ");
      const message = submitFailure.code === "unmapped_sales_channels"
        ? (lang === "ar"
          ? `تعذر إرسال التقفيلة: قنوات البيع غير مربوطة بالخادم (${channelNames || "غير معروف"}). اطلب من المالك حفظ الإعدادات ثم أعد المحاولة.`
          : `Closeout submit blocked: sales channels are not mapped to the server (${channelNames || "unknown"}). Ask the owner to save settings, then retry.`)
        : (lang === "ar"
          ? "تعذر إرسال التقفيلة: معرفات المستخدم أو المحل غير مربوطة بالخادم."
          : "Closeout submit blocked: user or store id is not mapped to the server.");
      if (closeoutsApiStrictMode) throw new Error(message);
      console.warn("closeout submit mapping blocked", submitFailure);
      return null;
    }
    if (
      !isUuid(closeoutsApiOrganizationId)
      || !hasCloseoutApiActorMapping(actorUserId)
      || !hasCloseoutApiStoreMapping(closeout?.storeId)
    ) {
      if (closeoutsApiStrictMode) throw new Error("closeouts API mapping is invalid for submit.");
      return null;
    }
    const result = await submitCloseoutViaApi({
      organizationId: closeoutsApiOrganizationId,
      actorUserId,
      actorRole: "employee",
      closeout,
      mode: action === "resubmit" ? "resubmit" : "submit",
      autoReview: !reviewWorkflowEnabled,
      requireReview: reviewWorkflowEnabled === true,
    });
    if (entriesApiEnabled) {
      await loadOperationalEntriesFromApi();
    }
    return result;
  }, [
    closeoutsApiEnabled,
    closeoutsApiOrganizationId,
    closeoutsApiStrictMode,
    entriesApiEnabled,
    lang,
    loadOperationalEntriesFromApi,
  ]);

  const syncReviewCloseoutToApi = useCallback(async ({ action, closeout, reason = "" }) => {
    if (!closeoutsApiEnabled) {
      if (closeoutsApiStrictMode) throw new Error("closeouts API is disabled in production mode.");
      return null;
    }
    if (
      !isUuid(closeoutsApiOrganizationId)
      || !hasCloseoutApiActorMapping(ownerApiUserId)
      || !hasCloseoutApiStoreMapping(closeout?.storeId)
    ) {
      if (closeoutsApiStrictMode) throw new Error("closeouts API mapping is invalid for review.");
      return null;
    }
    const result = await reviewCloseoutViaApi({
      organizationId: closeoutsApiOrganizationId,
      actorUserId: ownerApiUserId,
      actorRole: "owner",
      closeout,
      action,
      reason,
    });
    if (entriesApiEnabled) {
      await loadOperationalEntriesFromApi();
    }
    return result;
  }, [
    closeoutsApiEnabled,
    closeoutsApiOrganizationId,
    ownerApiUserId,
    closeoutsApiStrictMode,
    entriesApiEnabled,
    loadOperationalEntriesFromApi,
  ]);

  loadOperationalEntriesFromApiRef.current = loadOperationalEntriesFromApi;

  const loadCloseoutsFromApi = useCallback(async () => {
    if (!closeoutsApiEnabled) {
      if (closeoutsApiStrictMode) throw new Error("closeouts API is disabled in production mode.");
      return [];
    }
    if (!isUuid(closeoutsApiOrganizationId)) {
      if (closeoutsApiStrictMode) throw new Error("organization id is missing/invalid for closeouts API.");
      return [];
    }

    if (!hasCloseoutApiActorMapping(apiActorUserId)) {
      if (closeoutsApiStrictMode) throw new Error("actor user id is missing/invalid for closeouts API.");
      return [];
    }

    const targetStoreIds = apiTargetStoreIdsKey ? apiTargetStoreIdsKey.split("|").filter(Boolean) : [];
    if (!targetStoreIds.length) return [];

    const fetched = await Promise.all(
      targetStoreIds.map((storeId) => fetchStoreCloseoutsViaApi({
        organizationId: closeoutsApiOrganizationId,
        actorUserId: apiActorUserId,
        actorRole: apiActorRole,
        storeId,
      })),
    );

    const merged = fetched.flatMap((items) => (Array.isArray(items) ? items : []));
    const seen = new Set();
    return merged.filter((item) => {
      const itemId = typeof item?.id === "string" ? item.id : "";
      const itemDate = typeof item?.date === "string" ? item.date : "";
      if (!itemId || !itemDate) return false;
      const key = `${itemId}:${itemDate}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }, [
    apiActorRole,
    apiActorUserId,
    apiTargetStoreIdsKey,
    closeoutsApiEnabled,
    closeoutsApiOrganizationId,
    closeoutsApiStrictMode,
  ]);

  useEffect(() => {
    if (!loggedIn) return;
    if (!entriesApiEnabled) {
      if (entriesApiStrictMode) {
        setOperationalEntriesSyncError(
          lang === "ar"
            ? "مسار API للسجل التشغيلي غير مفعّل في وضع الإنتاج."
            : "Operational entries API is disabled in production mode.",
        );
      }
      return;
    }
    loadOperationalEntriesFromApi().catch((error) => {
      console.warn("operational entries API load failed", error);
      setOperationalEntriesSyncError(
        lang === "ar"
          ? "تعذر تحديث السجل التشغيلي من الخادم."
          : "Failed to refresh operational register from server.",
      );
    });
  }, [entriesApiEnabled, entriesApiStrictMode, lang, loadOperationalEntriesFromApi, loggedIn]);

  useEffect(() => {
    if (!operationalEntriesSyncError) return;
    console.warn(operationalEntriesSyncError);
  }, [operationalEntriesSyncError]);
  useEffect(() => {
    if (!runtimeSettingsSyncError) return;
    console.warn(runtimeSettingsSyncError);
  }, [runtimeSettingsSyncError]);
  useEffect(() => {
    if (!orgConfigSyncError) return;
    console.warn(orgConfigSyncError);
  }, [orgConfigSyncError]);

  const enterPrototypeAsEmployee = () => {
    const person = staff.find((item) => item.active && !item.removed) || PROTOTYPE_DEFAULT_STAFF[0];
    if (!person?.id) return;
    completeEmployeeLogin(person.id, person.apiUserId || "");
  };

  useEffect(() => {
    if (!closeoutsApiEnabled && !entriesApiEnabled) {
      setRuntimeApiIdMaps(null);
      return;
    }
    let envStoreIdMap = {};
    let envUserIdMap = {};
    let envSalesChannelIdMap = {};
    try {
      envStoreIdMap = JSON.parse(process.env.NEXT_PUBLIC_CLOSEOUTS_STORE_ID_MAP || "{}");
      envUserIdMap = JSON.parse(process.env.NEXT_PUBLIC_CLOSEOUTS_USER_ID_MAP || "{}");
      envSalesChannelIdMap = JSON.parse(process.env.NEXT_PUBLIC_CLOSEOUTS_SALES_CHANNEL_ID_MAP || "{}");
    } catch {
      envStoreIdMap = {};
      envUserIdMap = {};
      envSalesChannelIdMap = {};
    }
    const maps = buildRuntimeApiIdMaps({
      configuredBusinesses,
      staff,
      storeChannelSettings,
      envStoreIdMap,
      envUserIdMap,
      envSalesChannelIdMap,
    });
    setRuntimeApiIdMaps(maps);
  }, [closeoutsApiEnabled, configuredBusinesses, entriesApiEnabled, staff, storeChannelSettings]);

  if (!loggedIn) {
    return (
      <div dir={lang === "ar" ? "rtl" : "ltr"} className="min-h-[100dvh] bg-[#F8F6F0] font-sans text-[#112A46]">
        <AppFontStyles />
        {PROTOTYPE_ACCESS_MODE ? (
          <PrototypeAccessScreen
            lang={lang}
            setLang={setLang}
            onOwner={() => completeOwnerLogin()}
            onEmployee={enterPrototypeAsEmployee}
          />
        ) : authScreen === "owner" ? (
          <LoginScreen lang={lang} setLang={setLang} onOwnerLogin={completeOwnerLogin} onEmployeePortal={() => setAuthScreen("employee")} />
        ) : (
          <EmployeeLoginScreen lang={lang} setLang={setLang} staff={staff} onBack={() => setAuthScreen("owner")} onLogin={completeEmployeeLogin} />
        )}
      </div>
    );
  }
  return (
    <DailyCloseoutsProvider
      lang={lang}
      ownerName={ownerDisplayName}
      onSyncToOperationalEntries={syncCloseoutToOperationalEntries}
      onSubmitCloseoutToApi={syncSubmitCloseoutToApi}
      onReviewCloseoutInApi={syncReviewCloseoutToApi}
      loadCloseoutsFromApi={closeoutsApiEnabled ? loadCloseoutsFromApi : null}
      closeoutReviewRequiredForStore={closeoutReviewEnabledForBusiness}
      apiStrictMode={closeoutsApiStrictMode}
      dbSourceMode={CLOSEOUTS_API_DB_SOURCE}
    >
    <div dir={lang === "ar" ? "rtl" : "ltr"} className="min-h-[100dvh] bg-[#F8F6F0] font-sans text-[#112A46]">
      <AppFontStyles />
      <main className="taq-shell relative flex min-h-[100dvh] w-full flex-col overflow-hidden bg-[#F8F6F0]">
        <div className="taq-screen relative grid h-[100dvh] max-h-[100dvh] grid-rows-[auto_1fr_auto] overflow-hidden bg-[#F8F6F0]">
          <TopBar
            lang={lang}
            setLang={setLang}
            employee={employee}
            employeeName={employee && activeEmployee ? (lang === "ar" ? activeEmployee.nameAr : activeEmployee.nameEn) : ""}
            notebookMode={employee || (!employee && (ownerPage === "home" || ownerPage === "reports" || ownerPage === "register"))}
            notebookTheme={employee ? employeeNotebookTheme : notebookTheme}
            onLogout={logout}
            onEmployeeSettings={() => employeeSettingsOpenerRef.current?.()}
            onNotifications={() => { setArchivedReadOnlyBusinessId(null); if (duplicateSalesAlerts.length > 0) { setAttachmentReviewRequest(null); reviewDuplicateSales(duplicateSalesAlerts[0]); } else if (firstPendingAttachmentReview) { setDuplicateReviewFocus(null); setAttachmentReviewRequest({ businessId: firstPendingAttachmentReview.businessId, date: firstPendingAttachmentReview.date, entryId: firstPendingAttachmentReview.id, openedAt: Date.now() }); setOwnerPage("register"); } else if (unseenCloseoutAlerts[0]) { reviewCloseoutAlert(unseenCloseoutAlerts[0]); } }}
            showNotifications={ownerNotificationsVisible}
            hasNotificationBadge={ownerNotificationBadge}
          />
          <div className="taq-scroll relative min-h-0 overflow-y-auto overscroll-y-contain">{employee && !activeEmployee && <section className="px-5 pb-24"><div className="rounded-3xl bg-white p-8 text-center text-sm font-bold text-[#827762] ring-1 ring-black/[0.045]">{text(lang, "noActiveEmployee")}</div></section>}{employee && activeEmployee && employeePage === "closeouts" && <EmployeeCloseoutsView lang={lang} employee={activeEmployee} currentStore={currentEmployeeBusiness} assignedStores={assignedEmployeeBusinesses} onSelectStore={setEmployeeBusinessId} salesChannels={currentEmployeeChannelConfig.channels.filter((channel) => currentEmployeeChannelConfig.activeIds.includes(channel.id) && !channel.retired).map((channel) => ({ ...channel, displayName: channelName(channel, lang) }))} notebookTheme={employeeNotebookTheme} reviewWorkflowEnabled={closeoutReviewEnabledForBusiness(currentEmployeeBusiness?.id)} employeeHistoryVisibility={currentEmployeeOperationalConfig.employeeHistoryVisibility || "all"} formatCalendarDate={formatCalendarDate} channelLabel={(channel) => channel.displayName || channelName(channel, lang)} settingsPanel={({ onBack }) => <EmployeeSettingsScreen lang={lang} onBack={onBack} currentStore={currentEmployeeBusiness} assignedStores={assignedEmployeeBusinesses} onSelectStore={setEmployeeBusinessId} employeeNotebookTheme={employeeThemeOverride || readEmployeeNotebookTheme(activeEmployee.id) || employeeNotebookTheme} setEmployeeNotebookTheme={(theme) => { writeEmployeeNotebookTheme(activeEmployee.id, theme); setEmployeeThemeOverride(theme); }} onOpenSupport={() => openWhatsAppSupport(lang)} onOpenHelp={() => setHelpOpen(true)} />} onEntryActiveChange={setEmployeeEntryActive} onRegisterAdd={(handler) => { employeeAddHandlerRef.current = handler || (() => {}); }} onRegisterSettingsOpener={(handler) => { employeeSettingsOpenerRef.current = handler || (() => {}); }} saving={saving} />}{!employee && ownerPage === "home" && <NotebookScrollSurface theme={notebookTheme} lang={lang}><OwnerHomeConnected lang={lang} operationalEntries={operationalEntries} duplicateSalesAlerts={duplicateSalesAlerts} closeoutAlerts={unseenCloseoutAlerts} closeoutReviewEnabledForBusiness={closeoutReviewEnabledForBusiness} onViewPendingCloseouts={(closeout) => { setOwnerReviewCloseout(closeout); setSelectedBusiness(closeout.storeId); }} onReviewCloseout={reviewCloseoutAlert} onDismissCloseout={dismissCloseoutAlert} onReviewDuplicate={reviewDuplicateSales} onAcknowledgeDuplicate={acknowledgeDuplicateSales} reviewEnabledForBusiness={reviewEnabledForBusiness} onOpenOperation={handleOpenOwnerOperation} onShareNotebook={setShareSnapshot} notebookTheme={notebookTheme} selectedBusiness={activeViewBusiness} setSelectedBusiness={setSelectedBusiness} reviewEnabled={ownerReviewEnabled} businessesList={activeBusinesses} summaryApiEnabled={entriesApiEnabled} summaryApiOrganizationId={closeoutsApiOrganizationId} summaryApiActorUserId={ownerApiUserId} summaryApiActorRole="owner" summaryRefreshKey={summaryRefreshKey} /></NotebookScrollSurface>}{!employee && ownerPage === "add-summary" && <OwnerSummaryScreen lang={lang} saving={saving} selectedBusiness={activeViewBusiness} businessesList={activeBusinesses} storeChannelSettings={storeChannelSettings} onBack={() => setOwnerPage("home")} onSave={saveOwnerSummary} />}{!employee && ownerPage === "add-expense" && <OwnerExpenseScreen lang={lang} saving={saving} selectedBusiness={activeViewBusiness} businessesList={activeBusinesses} storeOperationalSettings={storeOperationalSettings} onBack={() => setOwnerPage("home")} onSave={saveOwner} />}{!employee && ownerPage === "reports" && <NotebookScrollSurface theme={notebookTheme} lang={lang}><ReportsScreen lang={lang} operationalEntries={operationalEntries} archivedReadOnlyBusinessId={archivedReadOnlyBusinessId} reviewEnabledForBusiness={reviewEnabledForBusiness} onShareNotebook={setShareSnapshot} notebookTheme={notebookTheme} setNotebookTheme={setNotebookTheme} selectedBusiness={selectedBusiness} setSelectedBusiness={setSelectedBusiness} configuredChannels={reportChannelConfig.channels} reviewEnabled={ownerReviewEnabled} businessesList={reportingBusinesses} archivedBusinessIds={archivedBusinessIds} reportsApiEnabled={entriesApiEnabled} reportsApiOrganizationId={closeoutsApiOrganizationId} reportsApiActorUserId={ownerApiUserId} reportsApiActorRole="owner" summaryRefreshKey={summaryRefreshKey} /></NotebookScrollSurface>}{!employee && ownerPage === "register" && <OwnerRegisterConnected lang={lang} onOpenOperation={handleOpenOwnerOperation} reviewFocus={duplicateReviewFocus} attachmentReviewRequest={attachmentReviewRequest} archivedReadOnlyBusinessId={archivedReadOnlyBusinessId} operationalEntries={operationalEntries} selectedBusiness={selectedBusiness} setSelectedBusiness={setSelectedBusiness} businessesList={reportingBusinesses} archivedBusinessIds={archivedBusinessIds} notebookTheme={notebookTheme} registerEntriesApiEnabled={entriesApiEnabled && REGISTER_ENTRIES_PAGINATION_ENABLED} registerEntriesApiOrganizationId={closeoutsApiOrganizationId} registerEntriesApiActorUserId={ownerApiUserId} registerEntriesApiActorRole="owner" registerEntriesRefreshKey={summaryRefreshKey} />}{!employee && ownerPage === "settings" && <OwnerSettingsScreen lang={lang} operationalEntries={operationalEntries} selectedBusiness={selectedBusiness} setSelectedBusiness={setSelectedBusiness} setOwnerPage={setOwnerPage} setArchivedReadOnlyBusinessId={setArchivedReadOnlyBusinessId} setLastCloseoutDates={setLastCloseoutDates} notebookTheme={notebookTheme} setNotebookTheme={setNotebookTheme} storeChannelSettings={storeChannelSettings} setStoreChannelSettings={setStoreChannelSettings} storeOperationalSettings={storeOperationalSettings} setStoreOperationalSettings={setStoreOperationalSettings} configuredBusinesses={configuredBusinesses} setConfiguredBusinesses={setConfiguredBusinesses} archivedBusinessIds={archivedBusinessIds} setArchivedBusinessIds={setArchivedBusinessIds} staff={staff} setStaff={setStaff} ownerProfile={ownerProfile} setOwnerProfile={setOwnerProfile} authOwnerUsername={authOwnerUsername} setAuthOwnerUsername={setAuthOwnerUsername} authOwnerPassword={authOwnerPassword} setAuthOwnerPassword={setAuthOwnerPassword} authEmployeePins={authEmployeePins} setAuthEmployeePins={setAuthEmployeePins} onPersistSettingsNow={persistRuntimeSettingsNow} onLogout={logout} onOpenSupport={() => openWhatsAppSupport(lang)} onOpenHelp={() => setHelpOpen(true)} />}{saved && <div className="sticky bottom-4 left-4 right-4 z-30 mx-auto max-w-md rounded-2xl bg-[#112A46] p-4 text-xs font-bold text-white">{text(lang, "savedNotice")}</div>}
          </div>
          {!(employee && employeeEntryActive) && <BottomNav lang={lang} employee={employee} active={employee ? employeePage : ownerPage} onAdd={() => { if (employee) employeeAddHandlerRef.current?.(); else setQuickAddOpen(true); }} onChange={(page) => { setQuickAddOpen(false); if (employee) { if (page === "home") setEmployeePage("closeouts"); else setEmployeePage(page); } else { setArchivedReadOnlyBusinessId(null); setDuplicateReviewFocus(null); setAttachmentReviewRequest(null); setSelectedBusiness("all"); setOwnerPage(page); } }} />}{!employee && <QuickAddSheet lang={lang} employee={false} open={quickAddOpen} onClose={() => setQuickAddOpen(false)} onSummary={() => { setQuickAddOpen(false); setOwnerPage("add-summary"); }} onExpense={() => { setQuickAddOpen(false); setOwnerPage("add-expense"); }} />}<OperationModal lang={lang} item={selected} onClose={() => setSelected(null)} onReview={confirmReview} onVoid={requestVoidOperation} onRestore={requestRestoreOperation} reviewEnabled={selectedOperationReviewEnabled} canVoid={Boolean(selected) && !archivedBusinessIds.includes(selected?.businessId)} canRestore={Boolean(selected) && !archivedBusinessIds.includes(selected?.businessId)} /><DuplicateSalesDialog lang={lang} draft={pendingDuplicateSummary?.payload || null} previousEntries={pendingDuplicateSummary?.previousEntries || []} businessesList={activeBusinesses} onCancel={() => setPendingDuplicateSummary(null)} onConfirm={confirmDuplicateSummary} /><VoidOperationDialog lang={lang} item={voidTarget} onCancel={() => setVoidTarget(null)} onConfirm={confirmVoidOperation} /><RestoreOperationDialog lang={lang} item={restoreTarget} onCancel={() => setRestoreTarget(null)} onConfirm={confirmRestoreOperation} /><SavedOutflowShareDialog lang={lang} item={savedOutflowShareTarget} businessesList={activeBusinesses} onClose={() => setSavedOutflowShareTarget(null)} /><NotebookShareModal lang={lang} snapshot={shareSnapshot} onClose={() => setShareSnapshot(null)} businessesList={reportingBusinesses} operationalEntries={operationalEntries} archivedBusinessIds={archivedBusinessIds} notebookExportApiEnabled={phase9ApiEnabled && entriesApiEnabled} notebookExportAuth={readOwnerSettingsApiAuth()} />
          <OwnerCloseoutModals
            lang={lang}
            ownerReviewCloseout={ownerReviewCloseout}
            returnCloseoutTarget={returnCloseoutTarget}
            ownerDisplayName={ownerDisplayName}
            reviewWorkflowEnabled={ownerReviewCloseout ? closeoutReviewEnabledForBusiness(ownerReviewCloseout.storeId) : false}
            ownerNotebookTheme={notebookTheme}
            resolveSalesChannels={resolveStoreSalesChannels}
            channelLabel={(channel) => channel.displayName || channelName(channel, lang)}
            onCloseoutUpdated={handleOwnerCloseoutUpdated}
            onCloseoutDeleted={handleOwnerCloseoutDeleted}
            onCloseReview={() => { setOwnerReviewCloseout(null); setReturnCloseoutTarget(null); }}
            onRequestReturn={(closeout) => { setReturnCloseoutTarget(closeout); setOwnerReviewCloseout(null); }}
          />
          <HelpCenterSheet lang={lang} open={helpOpen} onClose={() => setHelpOpen(false)} />
        </div>
      </main>
    </div>
    </DailyCloseoutsProvider>
  );
}

