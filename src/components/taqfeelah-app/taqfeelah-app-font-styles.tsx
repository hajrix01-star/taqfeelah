"use client";

import React from "react";

export function AppFontStyles() {
  return (
    <style>{`
      :root {
        --taq-page-gutter: 16px;
        --taq-app-desktop-width: 430px;
      }
      @media (min-width: 640px) and (max-width: 1023px) {
        :root { --taq-page-gutter: 18px; }
      }
      @media (min-width: 1024px) {
        :root { --taq-page-gutter: 20px; }
      }
      .taq-page-gutter {
        box-sizing: border-box;
        padding-inline: var(--taq-page-gutter);
      }
      .taq-notch { display: none !important; }
      .taq-app-root {
        min-height: 100dvh;
        background: #F8F6F0;
      }
      .taq-shell { width: 100% !important; max-width: none !important; min-height: 100dvh !important; border: none !important; border-radius: 0 !important; box-shadow: none !important; }
      .taq-screen { height: 100dvh !important; max-height: 100dvh !important; min-height: 100dvh !important; display: grid !important; grid-template-rows: auto 1fr auto !important; overflow: hidden !important; }
      .taq-scroll { min-height: 0 !important; -webkit-overflow-scrolling: touch; }
      .taq-topbar { padding-inline: var(--taq-page-gutter) !important; }
      .taq-owner-nav { position: relative !important; bottom: auto !important; left: auto !important; right: auto !important; transform: none !important; width: 100% !important; max-width: none !important; border-radius: 0 !important; box-shadow: none !important; }
      .taq-notebook-surface .taq-notebook-content {
        box-sizing: border-box;
        padding-inline: var(--taq-page-gutter);
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
      }
      @media (min-width: 1024px) {
        .taq-topbar { max-width: 560px; margin-inline: auto; }
        .taq-owner-page { max-width: 540px; margin-inline: auto; padding-inline: 0 !important; }
        .taq-scroll > section:not(.taq-owner-page) { max-width: 560px; margin-inline: auto; }
      }
      @media (min-width: 768px) {
        .taq-app-root {
          display: flex;
          justify-content: center;
          align-items: stretch;
          overflow-x: hidden;
          background:
            linear-gradient(90deg, rgba(17, 42, 70, 0.04), transparent 18%, transparent 82%, rgba(17, 42, 70, 0.04)),
            #EDE6D7;
        }
        .taq-app-root > .taq-shell,
        .taq-app-root > section {
          width: 100% !important;
          max-width: var(--taq-app-desktop-width) !important;
          min-height: 100dvh !important;
          background: #F8F6F0;
          border-inline: 1px solid rgba(17, 42, 70, 0.08) !important;
          box-shadow: 0 18px 42px rgba(17, 42, 70, 0.12) !important;
        }
        .taq-screen {
          width: 100% !important;
        }
      }
    `}</style>
  );
}
