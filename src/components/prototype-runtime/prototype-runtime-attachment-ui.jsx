"use client";

import { useEffect, useState } from "react";
import { Camera, Check } from "lucide-react";
import {
  prepareAttachment,
  readAttachmentPayload,
} from "@/features/attachments/client/prototype-attachment-storage";
import { text } from "./prototype-runtime-demo-data";

export function useAttachmentCapture(lang) {
  const [attachment, setAttachment] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState("");
  const selectAttachment = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    setProcessing(true);
    setError("");
    try {
      setAttachment(await prepareAttachment(file));
    } catch (failure) {
      setError(text(lang, failure?.message === "invalid" ? "invalidAttachment" : "attachmentTooLarge"));
    } finally {
      setProcessing(false);
    }
  };
  const clearAttachment = () => {
    setAttachment(null);
    setError("");
  };
  return { attachment, processing, error, selectAttachment, clearAttachment };
}

export function useAttachmentSource(attachment) {
  const [source, setSource] = useState(attachment?.dataUrl || null);
  useEffect(() => {
    let mounted = true;
    setSource(attachment?.dataUrl || null);
    if (!attachment?.dataUrl && attachment?.id) {
      readAttachmentPayload(attachment.id).then((saved) => {
        if (mounted) setSource(saved);
      });
    }
    return () => {
      mounted = false;
    };
  }, [attachment?.id, attachment?.dataUrl]);
  return source;
}

export function ProofThumb({ paper = false }) {
  return (
    <div className={`${paper ? "h-12 w-10" : "h-14 w-14 bg-[#E8E1D4]"} flex shrink-0 items-center justify-center rounded-xl`}>
      <div className={`${paper ? "w-9 border border-[#CFBC82]" : "w-9"} rotate-[-3deg] rounded bg-white p-1.5 shadow-sm`}>
        <div className="mb-1 h-1 w-5 rounded bg-[#D8D1C4]" />
        <div className="mb-1 h-1 w-full rounded bg-[#E9E2D6]" />
        <div className="h-1 w-7 rounded bg-[#E9E2D6]" />
      </div>
    </div>
  );
}

export function AttachmentPreview({ attachment, className = "" }) {
  const source = useAttachmentSource(attachment);
  if (!source) return <ProofThumb />;
  return <img src={source} alt="" className={`object-cover ${className}`} />;
}

export function AttachmentCapture({
  lang,
  attachment,
  processing,
  error,
  onSelect,
  onClear,
  tall = false,
}) {
  return (
    <div>
      <label className={`relative flex w-full cursor-pointer items-center justify-center gap-3 overflow-hidden rounded-3xl border-2 border-dashed border-[#D7CBAF] bg-[#FFFDF7] ${tall ? "h-40 flex-col" : "min-h-24 px-4 py-3"}`}>
        <input type="file" accept="image/*" capture="environment" onChange={onSelect} className="sr-only" />
        {attachment ? (
          <>
            <AttachmentPreview attachment={attachment} className="absolute inset-0 h-full w-full opacity-25" />
            <Check className={`${tall ? "h-8 w-8" : "h-6 w-6"} relative text-[#39A160]`} />
          </>
        ) : (
          <Camera className={`${tall ? "h-8 w-8" : "h-6 w-6"} text-[#B99844]`} />
        )}
        <div className={`relative ${tall ? "text-center" : "text-start"}`}>
          <p className="text-sm font-extrabold">
            {processing ? text(lang, "processingPhoto") : attachment ? text(lang, "replacePhoto") : text(lang, "cameraOrGallery")}
          </p>
          <p className="text-taq-meta text-[#827762]">
            {attachment ? text(lang, "attachmentStoredLocally") : text(lang, "optional")}
          </p>
        </div>
      </label>
      {attachment && (
        <button type="button" onClick={onClear} className="mt-2 text-taq-meta font-bold text-[#B44747]">
          {text(lang, "removePhoto")}
        </button>
      )}
      {error && <p className="mt-2 text-taq-meta font-bold text-[#B44747]">{error}</p>}
    </div>
  );
}
