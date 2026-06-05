"use client";

import { useAttachmentSource } from "@/features/entries/client/attachment-storage";

function ProofThumb({ paper = false }) {
  return (
    <div className={`${paper ? "h-12 w-10" : "h-14 w-14 bg-[#E8E1D5]"} flex items-center justify-center rounded-xl`}>
      <span className="h-4 w-3 rounded-sm bg-[#C8BCA4]" />
    </div>
  );
}

export default function AttachmentPreview({ attachment, className = "" }) {
  const source = useAttachmentSource(attachment);
  if (!source) return <ProofThumb />;
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={source} alt="" className={`object-cover ${className}`} />
  );
}
