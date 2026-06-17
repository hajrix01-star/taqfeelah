"use client";

import { useEffect, useRef, useState } from "react";
import { Camera, Check, Image as ImageIcon, Plus, Send } from "lucide-react";
import {
  prepareAttachment,
} from "@/features/attachments/client/prototype-attachment-storage";
import { useEntryAttachmentSource } from "@/features/entries/client/use-entry-attachment-source";
import {
  buildEntryAttachmentShareCaption,
  dataUrlToShareFile,
  shareEntryAttachmentImage,
} from "@/features/entries/client/entry-attachment-share";
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

/**
 * @param {Record<string, unknown> | null | undefined} attachmentApiContext
 * @param {string} [storeId]
 */
export function mergeAttachmentApiContext(attachmentApiContext, storeId = "") {
  const base = attachmentApiContext && typeof attachmentApiContext === "object"
    ? attachmentApiContext
    : {};
  return storeId ? { ...base, storeId } : { ...base };
}

export function useAttachmentSource(attachment, attachmentApiContext = null, storeId = "") {
  return useEntryAttachmentSource(attachment, mergeAttachmentApiContext(attachmentApiContext, storeId));
}

export function ProofThumb({ paper = false, loading = false, unavailable = false }) {
  return (
    <div className={`${paper ? "h-12 w-10" : "h-14 w-14 bg-[#E8E1D4]"} flex shrink-0 items-center justify-center rounded-xl`}>
      {loading ? (
        <span className="text-[10px] font-bold text-[#827762]">…</span>
      ) : unavailable ? (
        <span className="px-1 text-center text-[9px] font-black leading-3 text-[#B44747]">!</span>
      ) : (
        <div className={`${paper ? "w-9 border border-[#CFBC82]" : "w-9"} rotate-[-3deg] rounded bg-white p-1.5 shadow-sm`}>
          <div className="mb-1 h-1 w-5 rounded bg-[#D8D1C4]" />
          <div className="mb-1 h-1 w-full rounded bg-[#E9E2D6]" />
          <div className="h-1 w-7 rounded bg-[#E9E2D6]" />
        </div>
      )}
    </div>
  );
}

export function AttachmentPreview({ attachment, className = "", attachmentApiContext = null, storeId = "" }) {
  const { source, loading, unavailable } = useAttachmentSource(attachment, attachmentApiContext, storeId);
  if (!source) return <ProofThumb loading={loading} unavailable={unavailable} />;
  return <img src={source} alt="" className={`object-cover ${className}`} />;
}

export function AttachmentThumbButton({
  attachment,
  onOpen,
  className = "h-14 w-14",
  buttonClassName = "shrink-0 overflow-hidden rounded-xl ring-1 ring-black/[0.06] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#112A46]/50 disabled:opacity-70",
  storeId = "",
  attachmentApiContext = null,
  lang = "ar",
}) {
  const { source, loading, unavailable } = useAttachmentSource(attachment, attachmentApiContext, storeId);
  const unavailableLabel = lang === "ar" ? "تعذر تحميل الصورة" : "Image unavailable";
  return (
    <button
      type="button"
      onClick={(event) => {
        event.stopPropagation();
        if (source) onOpen(source);
      }}
      disabled={!source}
      className={buttonClassName}
      aria-busy={loading || undefined}
      title={unavailable ? unavailableLabel : undefined}
    >
      {source ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={source} alt="" className={`${className} object-cover`} />
      ) : (
        <ProofThumb loading={loading} unavailable={unavailable} />
      )}
    </button>
  );
}

export function EntryAttachmentShareButton({
  lang,
  attachment,
  entry,
  storeName = "",
  operationLabel = "",
  entryTime = "",
  daySequence = null,
  sameDayCloseoutCount = 1,
  storeId = "",
  attachmentApiContext = null,
  compact = false,
  className = "",
}) {
  const { source } = useAttachmentSource(attachment, attachmentApiContext, storeId);
  const [sharing, setSharing] = useState(false);

  if (!attachment) return null;

  const handleShare = async (event) => {
    event.stopPropagation();
    if (!source || sharing) return;
    setSharing(true);
    try {
      const file = await dataUrlToShareFile(source, `invoice-${entry?.id || "attachment"}`);
      const caption = buildEntryAttachmentShareCaption({
        lang,
        storeName,
        operationLabel,
        entryDate: entry?.date || "",
        entryTime,
        daySequence,
        sameDayCloseoutCount,
      });
      await shareEntryAttachmentImage({ file, caption, lang });
    } finally {
      setSharing(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handleShare}
      disabled={!source || sharing}
      className={`inline-flex items-center justify-center gap-1.5 rounded-xl bg-[#25D366] text-white ring-1 ring-[#1DA851]/30 transition enabled:hover:bg-[#1EBE5D] disabled:cursor-not-allowed disabled:opacity-60 ${compact ? "h-9 w-9" : "px-3 py-2 text-taq-nav font-black"} ${className}`}
      aria-label={text(lang, "shareAttachmentWhatsApp")}
      title={text(lang, "shareAttachmentWhatsApp")}
    >
      <Send className={compact ? "h-4 w-4" : "h-3.5 w-3.5"} />
      {!compact ? text(lang, "shareViaWhatsApp") : null}
    </button>
  );
}

const attachmentSourceButtonClass = "flex flex-col items-center justify-center gap-1.5 rounded-2xl bg-white px-3 py-3 text-xs font-extrabold text-[#112A46] ring-1 ring-black/[0.05] transition enabled:hover:bg-[#FFF4D2] disabled:cursor-not-allowed disabled:opacity-60";
const proofSourceCardClass = "flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white ring-1 ring-black/[0.06] transition enabled:hover:bg-[#FFF4D2] disabled:cursor-not-allowed disabled:opacity-60";

export function ProofAddButton({
  lang,
  onSelect,
  multiple = false,
  disabled = false,
  processing = false,
  className = "",
}) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef(null);
  const cameraInputRef = useRef(null);
  const galleryInputRef = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    const closeOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setOpen(false);
      }
    };
    const closeEscape = (event) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("pointerdown", closeOutside);
    document.addEventListener("keydown", closeEscape);
    return () => {
      document.removeEventListener("pointerdown", closeOutside);
      document.removeEventListener("keydown", closeEscape);
    };
  }, [open]);

  const handleChange = (event) => {
    onSelect(event);
    event.target.value = "";
    setOpen(false);
  };

  return (
    <div ref={containerRef} className={`min-w-0 ${className}`}>
      <button
        type="button"
        disabled={disabled || processing}
        onClick={() => setOpen((current) => !current)}
        className="inline-flex items-center gap-1 rounded-xl bg-[#FFF4D2] px-2.5 py-1.5 text-taq-nav font-black text-[#806528] ring-1 ring-[#E4B84A]/40 transition enabled:hover:bg-[#FFE9A8] disabled:cursor-not-allowed disabled:opacity-60"
      >
        <Plus className="h-3.5 w-3.5" strokeWidth={2.6} />
        <span>{text(lang, "addProof")}</span>
      </button>
      {open && !processing && (
        <div className="mt-2 flex items-center gap-2">
          <button
            type="button"
            disabled={disabled}
            onClick={() => cameraInputRef.current?.click()}
            className={proofSourceCardClass}
            aria-label={text(lang, "openCamera")}
            title={text(lang, "openCamera")}
          >
            <Camera className="h-5 w-5 text-[#B99844]" />
          </button>
          <button
            type="button"
            disabled={disabled}
            onClick={() => galleryInputRef.current?.click()}
            className={proofSourceCardClass}
            aria-label={text(lang, "openGallery")}
            title={text(lang, "openGallery")}
          >
            <ImageIcon className="h-5 w-5 text-[#806528]" />
          </button>
        </div>
      )}
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        multiple={multiple || undefined}
        onChange={handleChange}
        className="sr-only"
      />
      <input
        ref={galleryInputRef}
        type="file"
        accept="image/*"
        multiple={multiple || undefined}
        onChange={handleChange}
        className="sr-only"
      />
    </div>
  );
}

export function ProofAttachmentPreview({
  lang,
  src,
  onOpen,
  onRemove,
  compact = false,
}) {
  if (!src) return null;
  const image = (
    /* eslint-disable-next-line @next/next/no-img-element */
    <img src={src} alt="" className={`object-cover ${compact ? "h-10 w-10" : "h-12 w-12"} ${onOpen ? "" : "rounded-xl ring-1 ring-black/[0.06]"}`} />
  );
  return (
    <div className={`flex items-center gap-2 ${compact ? "" : "mt-2"}`}>
      {onOpen ? (
        <button
          type="button"
          onClick={() => onOpen(src)}
          className="overflow-hidden rounded-xl ring-1 ring-black/[0.06] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#112A46]/50"
        >
          {image}
        </button>
      ) : (
        <div className="overflow-hidden rounded-xl ring-1 ring-black/[0.06]">{image}</div>
      )}
      {onRemove ? (
        <button type="button" onClick={onRemove} className="text-taq-nav font-black text-[#B44747]">
          {text(lang, "removePhoto")}
        </button>
      ) : null}
    </div>
  );
}

export function AttachmentImageSourcePicker({
  lang,
  onSelect,
  multiple = false,
  disabled = false,
  className = "",
}) {
  const cameraInputRef = useRef(null);
  const galleryInputRef = useRef(null);

  const handleChange = (event) => {
    onSelect(event);
    event.target.value = "";
  };

  return (
    <div className={className}>
      <div className="grid grid-cols-2 gap-2">
        <button
          type="button"
          disabled={disabled}
          onClick={() => cameraInputRef.current?.click()}
          className={attachmentSourceButtonClass}
        >
          <Camera className="h-5 w-5 text-[#B99844]" />
          <span>{text(lang, "openCamera")}</span>
        </button>
        <button
          type="button"
          disabled={disabled}
          onClick={() => galleryInputRef.current?.click()}
          className={attachmentSourceButtonClass}
        >
          <ImageIcon className="h-5 w-5 text-[#806528]" />
          <span>{text(lang, "openGallery")}</span>
        </button>
      </div>
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        multiple={multiple || undefined}
        onChange={handleChange}
        className="sr-only"
      />
      <input
        ref={galleryInputRef}
        type="file"
        accept="image/*"
        multiple={multiple || undefined}
        onChange={handleChange}
        className="sr-only"
      />
    </div>
  );
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
  const iconSize = tall ? "h-8 w-8" : "h-6 w-6";

  return (
    <div>
      <div className={`relative flex w-full flex-col items-center justify-center gap-3 overflow-hidden rounded-3xl border-2 border-dashed border-[#D7CBAF] bg-[#FFFDF7] ${tall ? "h-40 px-4 py-4" : "min-h-24 px-4 py-3"}`}>
        {attachment ? (
          <>
            <AttachmentPreview attachment={attachment} className="absolute inset-0 h-full w-full opacity-25" />
            <Check className={`${iconSize} relative text-[#39A160]`} />
          </>
        ) : (
          <Camera className={`${iconSize} text-[#B99844]`} />
        )}
        <div className={`relative w-full ${tall ? "text-center" : "text-start"}`}>
          <p className="text-sm font-extrabold">
            {processing ? text(lang, "processingPhoto") : attachment ? text(lang, "replacePhoto") : text(lang, "cameraOrGallery")}
          </p>
          <p className="text-taq-meta text-[#827762]">
            {attachment ? text(lang, "attachmentStoredLocally") : text(lang, "optional")}
          </p>
        </div>
        {!processing && (
          <AttachmentImageSourcePicker
            lang={lang}
            onSelect={onSelect}
            disabled={processing}
            className="relative w-full"
          />
        )}
      </div>
      {attachment && (
        <button type="button" onClick={onClear} className="mt-2 text-taq-meta font-bold text-[#B44747]">
          {text(lang, "removePhoto")}
        </button>
      )}
      {error && <p className="mt-2 text-taq-meta font-bold text-[#B44747]">{error}</p>}
    </div>
  );
}
