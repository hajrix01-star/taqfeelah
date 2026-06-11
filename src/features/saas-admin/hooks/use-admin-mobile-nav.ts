"use client";

import { useEffect, type RefObject } from "react";

export function useAdminMobileNav({
  navOpen,
  onClose,
  menuButtonRef,
  sidebarRef,
}: {
  navOpen: boolean;
  onClose: () => void;
  menuButtonRef: RefObject<HTMLButtonElement | null>;
  sidebarRef: RefObject<HTMLElement | null>;
}) {
  useEffect(() => {
    if (!navOpen) return undefined;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
        menuButtonRef.current?.focus();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    const firstLink = sidebarRef.current?.querySelector("a");
    if (firstLink instanceof HTMLElement) {
      firstLink.focus();
    }

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [menuButtonRef, navOpen, onClose, sidebarRef]);
}
