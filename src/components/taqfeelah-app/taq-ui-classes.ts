export const taqUi = {
  text: {
    primary: "text-[#112A46]",
    muted: "text-[#716753]",
    subtle: "text-[#827762]",
    meta: "text-[#A99D87]",
    success: "text-[#257844]",
    danger: "text-[#B44747]",
    amber: "text-[#806528]",
    blue: "text-[#214B7B]",
  },
  bg: {
    primary: "bg-[#112A46]",
    paper: "bg-[#F7F5EF]",
    softPaper: "bg-[#F3F0E8]",
    inactive: "bg-[#F0ECE2]",
    accent: "bg-[#E4B84A]",
    success: "bg-[#257844]",
    danger: "bg-[#B44747]",
    amber: "bg-[#806528]",
    blue: "bg-[#214B7B]",
    white: "bg-white",
  },
  ring: {
    line: "ring-1 ring-[#E8E1D4]",
    soft: "ring-1 ring-black/[0.05]",
    card: "ring-1 ring-[#ECE6DA]/90",
  },
  border: {
    line: "border-[#E8E1D4]",
    soft: "border-[#F0EBE0]",
  },
  shadow: {
    soft: "shadow-[0_1px_6px_rgba(17,42,70,0.07)]",
    active: "shadow-[0_1px_6px_rgba(17,42,70,0.18)]",
    card: "shadow-[0_2px_4px_rgba(17,42,70,0.04),0_8px_20px_rgba(17,42,70,0.06)]",
  },
  surface: {
    cardGradient: "bg-gradient-to-b from-white to-[#FDFBF7]",
    error: "bg-[#FFF7F5] ring-1 ring-[#F0C7C1]",
  },
} as const;
