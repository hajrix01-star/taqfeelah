import { ImageResponse } from "next/og";
import { TAQ_BRAND } from "@/core/design-tokens/taq-brand";
import { SEO_DESCRIPTION, SEO_SITE_NAME } from "@/core/config/seo";

export const runtime = "edge";
export const alt = "تقفيلة - متابعة تشغيل يومية للمحلات";
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          direction: "rtl",
          background: TAQ_BRAND.cream,
          color: TAQ_BRAND.ink,
          fontFamily: "Arial, sans-serif",
          padding: "56px",
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: 0,
            backgroundImage: `linear-gradient(${TAQ_BRAND.border} 1px, transparent 1px), linear-gradient(90deg, ${TAQ_BRAND.border} 1px, transparent 1px)`,
            backgroundSize: "44px 44px",
            opacity: 0.55,
          }}
        />
        <div
          style={{
            position: "relative",
            width: "100%",
            height: "100%",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            border: `2px solid ${TAQ_BRAND.border}`,
            borderRadius: "36px",
            background: "rgba(255, 253, 248, 0.92)",
            padding: "54px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              <div style={{ display: "flex", fontSize: "28px", fontWeight: 800, color: TAQ_BRAND.gold }}>
                تشغيل يومي للمحلات
              </div>
              <div style={{ display: "flex", fontSize: "58px", fontWeight: 900, letterSpacing: "0" }}>
                {SEO_SITE_NAME}
              </div>
            </div>
            <div
              style={{
                width: "130px",
                height: "130px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                borderRadius: "32px",
                background: TAQ_BRAND.ink,
                color: "white",
                fontSize: "58px",
                fontWeight: 900,
              }}
            >
              تق
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "22px", maxWidth: "820px" }}>
            <div style={{ display: "flex", fontSize: "62px", fontWeight: 900, lineHeight: 1.18 }}>
              تقفيلة محلك اليومية من الجوال
            </div>
            <div style={{ display: "flex", fontSize: "30px", lineHeight: 1.6, color: TAQ_BRAND.soft }}>
              {SEO_DESCRIPTION}
            </div>
          </div>

          <div style={{ display: "flex", gap: "16px", fontSize: "26px", fontWeight: 800 }}>
            {["مبيعات", "مصروفات", "تقارير"].map((item) => (
              <div
                key={item}
                style={{
                  display: "flex",
                  borderRadius: "999px",
                  background: TAQ_BRAND.warningBg,
                  color: TAQ_BRAND.warningText,
                  padding: "14px 24px",
                }}
              >
                {item}
              </div>
            ))}
          </div>
        </div>
      </div>
    ),
    size,
  );
}
