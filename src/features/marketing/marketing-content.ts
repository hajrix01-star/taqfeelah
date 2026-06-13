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

export const MARKETING_FEATURES = [
  {
    title: "ملخص داخل يومي",
    description: "سجّل الداخل حسب قنوات البيع في دقائق — بدون تعقيد محاسبي.",
  },
  {
    title: "الخارج منفصل وواضح",
    description: "مشتريات، مصروف، وسحب — كل عملية بسجلها الخاص.",
  },
  {
    title: "تقفيلة الموظف",
    description: "الموظف يقفّل يومه بسرعة؛ المالك يتابع ويعدّل عند الحاجة.",
  },
  {
    title: "تقارير تشغيلية",
    description: "ملخص يومي وشهري يساعدك على قرارات التشغيل لا القيود المحاسبية.",
  },
  {
    title: "تعدد المحلات",
    description: "منشأة واحدة بعدة فروع ضمن اشتراك منظم.",
  },
] as const;

export const MARKETING_PLANS: MarketingPlan[] = [
  {
    id: "starter",
    name: "أساسي",
    priceLabel: "مجانًا",
    periodLabel: "لفترة الإطلاق",
    description: "للمحل الواحد الذي يبدأ رقمنة التشغيل اليومي.",
    highlights: ["محل واحد", "مالك + موظفين", "تقارير يومية وشهرية"],
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
    description: "للمجموعات والامتيازات التي تحتاج onboarding مخصص.",
    highlights: ["عدد محلات مخصص", "تفعيل مخصص", "مدير نجاح"],
    ctaLabel: "تواصل معنا",
  },
];

export const MARKETING_FAQ = [
  {
    question: "هل تقفيلة نظام محاسبة؟",
    answer: "لا. تقفيلة متابعة تشغيل يومية: الداخل − الخارج = الناتج — بدون قيود أو ضرائب.",
  },
  {
    question: "هل يعمل على الجوال والكمبيوتر؟",
    answer: "نعم. نفس التجربة على المتصفح، ويمكن تثبيته كتطبيق PWA على الشاشة الرئيسية.",
  },
] as const;
