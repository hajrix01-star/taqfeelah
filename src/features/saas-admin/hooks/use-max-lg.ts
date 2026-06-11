"use client";

import { useEffect, useState } from "react";

export function useMaxLg() {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    const media = window.matchMedia("(max-width: 1023px)");
    const update = () => setMatches(media.matches);
    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);

  return matches;
}
