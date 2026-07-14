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

export type MarketingAudience = {
  title: string;
  description: string;
};

export type MarketingOutcome = {
  title: string;
  description: string;
};

export const MARKETING_AUDIENCES: MarketingAudience[] = [
  {
    title: "أصحاب المحلات اليومية",
    description: "للمالك الذي يريد معرفة مبيعات اليوم ومصروفاته ونتيجته بدون الرجوع لدفاتر متفرقة.",
  },
  {
    title: "المقاهي والمطاعم الخفيفة",
    description: "مناسب للفرق التي تحتاج تقفيل نهاية اليوم بسرعة مع وضوح الكاش والشبكة والتوصيل.",
  },
  {
    title: "المنشآت متعددة الفروع",
    description: "يعطي المالك رؤية موحدة لكل محل، مع صلاحيات للموظفين وتقارير تساعده على المتابعة.",
  },
];

export const MARKETING_OUTCOMES: MarketingOutcome[] = [
  {
    title: "تقفيل يومية المحل",
    description: "سجل الداخل والخارج واعرف الناتج اليومي بطريقة قريبة من الدفتر ولكن محفوظة ومنظمة.",
  },
  {
    title: "متابعة المصروفات والسحب",
    description: "افصل المشتريات والمصروفات والسحوبات عن المبيعات حتى لا تختلط الأرقام وقت المراجعة.",
  },
  {
    title: "تقارير تساعد القرار",
    description: "راجع ملخصات يومية وشهرية وأهداف المبيعات لتفهم أداء المحل بدل الاكتفاء بالأرقام الخام.",
  },
];

export const MARKETING_FEATURES = [
  {
    title: "ملخص داخل يومي",
    description: "سجّل مبيعات اليوم حسب طرق الدفع وقنوات البيع في دقائق، بدون تعقيد محاسبي.",
  },
  {
    title: "الخارج منفصل وواضح",
    description: "مشتريات، مصروف، وسحب؛ كل عملية بسجلها الخاص حتى تبقى نتيجة اليوم مفهومة.",
  },
  {
    title: "تقفيلة الموظف",
    description: "الموظف يقفّل يومه بسرعة؛ المالك يتابع ويعدّل عند الحاجة.",
  },
  {
    title: "تقارير تشغيلية",
    description: "ملخص يومي وشهري وتقويم أهداف يساعدك على قرارات التشغيل لا القيود المحاسبية.",
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
    answer: "لا. تقفيلة متابعة تشغيل يومية للمبيعات والمصروفات: الداخل − الخارج = الناتج، بدون قيود أو ضرائب.",
  },
  {
    question: "هل يعمل على الجوال والكمبيوتر؟",
    answer: "نعم. نفس التجربة على المتصفح، ويمكن تثبيته كتطبيق PWA على الشاشة الرئيسية.",
  },
  {
    question: "هل يغني عن المحاسب؟",
    answer: "لا. تقفيلة ينظم التشغيل اليومي ويعطيك أرقامًا أوضح، لكنه لا يستبدل المحاسب أو النظام الضريبي.",
  },
  {
    question: "هل يناسب أكثر من محل؟",
    answer: "نعم. صُمم ليتعامل مع منشأة لديها محل واحد أو عدة محلات مع صلاحيات للمالك والموظفين.",
  },
] as const;
