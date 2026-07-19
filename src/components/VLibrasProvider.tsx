"use client";

import VLibras from "@djpfs/react-vlibras";
import { useEffect } from "react";
import { useAuth } from "@/context/AuthContext";

/**
 * VLibrasProvider – Global VLibras Widget using @djpfs/react-vlibras
 *
 * This package is the community-standard React wrapper for the official
 * VLibras widget from Gov.br. It handles:
 *   - Script loading and initialization
 *   - forceOnload for SPA environments (Next.js App Router)
 *   - Proper DOM structure creation
 *   - Click handlers and avatar rendering
 *
 * We toggle visibility via CSS based on the user's accessibility preference.
 */

export default function VLibrasProvider() {
  const { preferences } = useAuth();
  const active = preferences?.libras_enabled ?? false;

  // Toggle visibility of the VLibras widget container
  useEffect(() => {
    const timer = setTimeout(() => {
      // The react-vlibras package creates a div[vw] element
      const container = document.querySelector<HTMLElement>("div[vw]");
      if (!container) return;

      if (active) {
        container.style.setProperty("display", "block", "important");
      } else {
        container.style.setProperty("display", "none", "important");
      }
    }, 1000);

    return () => clearTimeout(timer);
  }, [active]);

  return <VLibras forceOnload />;
}
