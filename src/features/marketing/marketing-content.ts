export type MarketingPlan = {
  id: string;
  name: string;
  priceLabel: string;
  periodLabel: string;
  description: string;
  highlights: string[];
  ctaLabel: string;
  featured?: boolean;
};

export const MARKETING_AUDIENCE = [
  "مطاعم",
  "كافيهات",
  "بقالات",
  "محلات تجزئة",
  "مشاريع صغيرة",
] as const;

export const MARKETING_PROBLEMS = [
  { question: "كم دخل اليوم؟", hint: "الداخل واضح" },
  { question: "كم خرج اليوم؟", hint: "الخارج مسجّل" },
  { question: "كم بقي فعليًا؟", hint: "الباقي يظهر فورًا" },
  { question: "هل اليوم جيد أو سيئ؟", hint: "نتيجة يومك بدون تعقيد" },
] as const;

export const MARKETING_QUOTES = [
  "مو لازم تكون محاسب. اعرف بس: داخل، خارج، والباقي.",
  "عقدوها بدائن ومدين. حنا خليناها: داخل، خارج، والباقي.",
  "دفتر يومك صار في جوالك.",
] as const;

export const MARKETING_FEATURES = [
  {
    title: "داخل اليوم",
    description: "سجّل المبيعات حسب طريقة الدفع وقناة البيع — بدون مصطلحات محاسبية.",
    keyword: "داخل",
  },
  {
    title: "خارج اليوم",
    description: "مشتريات، مصروف، وسحب — كل عملية بسجلها الخاص ووقتها.",
    keyword: "خارج",
  },
  {
    title: "الباقي",
    description: "المعادلة الأساسية تظهر فورًا: داخل − خارج = الباقي.",
    keyword: "الباقي",
  },
  {
    title: "تقفيلة الموظف",
    description: "الموظف يقفّل يومه بسرعة؛ المالك يتابع ويعدّل عند الحاجة.",
    keyword: "تقفيلة",
  },
  {
    title: "تقارير بسيطة",
    description: "يومي وشهري حسب المحل — بدون شارتات معقدة.",
    keyword: "تقارير",
  },
  {
    title: "سجل الحركة",
    description: "كل إضافة وتعديل وإلغاء ومرفق محفوظ بوقت العملية.",
    keyword: "سجل",
  },
] as const;

export const MARKETING_APP_SECTIONS = [
  {
    title: "الرئيسية",
    description: "داخل اليوم، خارج اليوم، الباقي، وحركة اليوم — بأسلوب دفتر.",
  },
  {
    title: "التقارير",
    description: "ملخص يومي وشهري حسب المحل — واضح ومباشر.",
  },
  {
    title: "السجل",
    description: "كل حركة محفوظة: إضافة، تعديل، إلغاء، مرفق، ووقت العملية.",
  },
  {
    title: "الإعدادات",
    description: "المحلات، قنوات البيع، الموظفين، التصدير، والنسخ الاحتياطي.",
  },
] as const;

export const MARKETING_NOT_ITEMS = [
  "ليس برنامج محاسبة",
  "ليس ERP",
  "ليس نظام تقارير ثقيل",
] as const;

export const MARKETING_PLANS: MarketingPlan[] = [
  {
    id: "starter",
    name: "أساسي",
    priceLabel: "مجانًا",
    periodLabel: "لفترة الإطلاق",
    description: "للمحل الواحد الذي يبدأ رقمنة دفتره اليومي.",
    highlights: ["محل واحد", "مالك + موظفين", "داخل وخارج والباقي"],
    ctaLabel: "ابدأ مجانًا",
  },
  {
    id: "growth",
    name: "نمو",
    priceLabel: "قريبًا",
    periodLabel: "شهريًا",
    description: "للمنشآت التي تدير أكثر من محل وتريد متابعة موحّدة.",
    highlights: ["عدة محلات", "صلاحيات مالك وموظف", "دعم أولوية"],
    ctaLabel: "تواصل للتسعير",
    featured: true,
  },
  {
    id: "enterprise",
    name: "مؤسسات",
    priceLabel: "حسب الطلب",
    periodLabel: "سنويًا",
    description: "للمجموعات والامتيازات التي تحتاج تفعيلًا مخصصًا.",
    highlights: ["عدد محلات مخصص", "تفعيل مخصص", "مدير نجاح"],
    ctaLabel: "تواصل معنا",
  },
];

export const MARKETING_FAQ = [
  {
    question: "هل تقفيلة نظام محاسبة؟",
    answer:
      "لا. تقفيلة دفتر تشغيل يومي ذكي — داخل، خارج، والباقي. بدون قيود ولا ضرائب ولا مصطلحات محاسبية.",
  },
  {
    question: "ما الفرق بين تقفيلة وبرنامج محاسبة؟",
    answer:
      "تقفيلة يبيع الوضوح اليومي: اعرف نتيجة يومك بسرعة. ليس بديلًا لمحاسب قانوني ولا نظام محاسبة كامل.",
  },
  {
    question: "هل يعمل على الجوال والكمبيوتر؟",
    answer:
      "نعم. نفس التجربة على المتصفح، ويمكن تثبيته كتطبيق PWA على الشاشة الرئيسية.",
  },
  {
    question: "ماذا يعني «حسبة بدو»؟",
    answer:
      "حسبة بسيطة ومباشرة ومفهومة — على السليقة وقريبة من عقل صاحب المحل، بدون تعقيد.",
  },
] as const;
