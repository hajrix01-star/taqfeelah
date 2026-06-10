"use client";

export function EntrySection({ number, title, children, lang }) {
  const badgeOnLeft = lang === "ar";
  return (
    <div className={`relative mb-4 space-y-4 rounded-2xl border border-[#E8E1D4] bg-[rgba(255,253,246,0.72)] p-4 ${badgeOnLeft ? "pl-12" : "pr-12"}`}>
      <span
        className={`absolute -top-px flex h-8 w-8 items-center justify-center bg-[#D69C2F] text-sm font-black text-white ${badgeOnLeft ? "-left-px rounded-br-2xl rounded-tl-2xl" : "-right-px rounded-bl-2xl rounded-tr-2xl"}`}
      >
        {number}
      </span>
      <h2 className="text-base font-black text-[#112A46]">{title}</h2>
      {children}
    </div>
  );
}
