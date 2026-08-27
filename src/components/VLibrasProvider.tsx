"use client";

import { useEffect } from "react";
import Script from "next/script";

declare module "react" {
  interface HTMLAttributes<T> extends AriaAttributes, DOMAttributes<T> {
    vw?: string;
    "vw-access-button"?: string;
    "vw-plugin-wrapper"?: string;
  }
}

declare global {
  interface Window {
    VLibras?: {
      Widget: new (url: string) => unknown;
    };
  }
}

/**
 * VLibrasProvider – Componente nativo de carregamento seguro do VLibras (Gov.br)
 * Evita o erro 'window.onload is not a function' presente na biblioteca @djpfs/react-vlibras.
 */
export default function VLibrasProvider() {
  const initVLibras = () => {
    if (typeof window !== "undefined" && window.VLibras) {
      try {
        new window.VLibras.Widget("https://vlibras.gov.br/app");
      } catch {
        // Ignora caso já esteja instanciado
      }
    }
  };

  useEffect(() => {
    initVLibras();
  }, []);

  return (
    <>
      <div
        vw="true"
        className="enabled"
      >
        <div
          vw-access-button="true"
          className="active"
        />
        <div
          vw-plugin-wrapper="true"
        >
          <div className="vw-plugin-top-wrapper" />
        </div>
      </div>
      <Script
        src="https://vlibras.gov.br/app/vlibras-plugin.js"
        strategy="afterInteractive"
        onLoad={initVLibras}
      />
    </>
  );
}
