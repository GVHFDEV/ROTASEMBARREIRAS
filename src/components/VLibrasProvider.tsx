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
    // Guards against instantiating the widget more than once (mount effect
    // + Script onLoad both call initVLibras, and React Strict Mode / Fast
    // Refresh can invoke the mount effect again). A second `new Widget(...)`
    // call makes VLibras inject a duplicate access button/dialog into the
    // DOM — that leftover, unbound instance is what looked like a broken
    // "second button" that only replays the translation instead of reacting.
    __vlibrasWidgetInstantiated?: boolean;
  }
}

/**
 * VLibrasProvider – Componente nativo de carregamento seguro do VLibras (Gov.br)
 * Evita o erro 'window.onload is not a function' presente na biblioteca @djpfs/react-vlibras.
 */
export default function VLibrasProvider() {
  const initVLibras = () => {
    if (typeof window === "undefined" || !window.VLibras) return;
    // Instantiate exactly once for the lifetime of the page. Without this
    // guard, calling `new Widget()` a second time creates a duplicate,
    // non-functional overlay instead of reusing the existing one.
    if (window.__vlibrasWidgetInstantiated) return;
    try {
      new window.VLibras.Widget("https://vlibras.gov.br/app");
      window.__vlibrasWidgetInstantiated = true;
    } catch {
      // Ignora caso já esteja instanciado
    }
  };

  useEffect(() => {
    initVLibras();
  }, []);

  // VLibras intercepts clicks on any element it thinks is "content" (its
  // own heuristic checks tag name, onclick presence, role, etc — see the
  // Ls()/Is() helpers in vlibras-initial-*.js) and replaces the first click
  // with a translate-and-confirm flow: it shows a floating "Interagir"
  // button near the element, and only THAT click actually re-dispatches the
  // original click. Our app's <button> elements are functional UI controls
  // (nav, filters, toggles), not translatable content, so getting caught in
  // that flow means a normal tap just plays a Libras translation instead of
  // performing the action — and if anything on the page reflows between
  // the two clicks (map panning, category bar animating, etc.), VLibras's
  // stored reference/position goes stale and the "Interagir" click misses
  // entirely, which reads as "clicking it does nothing, just re-translates".
  //
  // VLibras itself exposes the officially supported opt-out for this: any
  // element matching the `.vlibras-links` selector is skipped by its click
  // interceptor entirely (see the `e.matches('.vlibras-links')` check in
  // its own source), so native clicks reach our handlers immediately, in
  // one tap. Real page copy (descriptions, paragraphs) is untouched and
  // stays translatable — only <button> elements are opted out, since none
  // of them carry content meant for Libras translation.
  useEffect(() => {
    const tagButtons = (root: ParentNode) => {
      root.querySelectorAll("button:not(.vlibras-links)").forEach((el) => {
        el.classList.add("vlibras-links");
      });
    };

    tagButtons(document);

    const observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        mutation.addedNodes.forEach((node) => {
          if (!(node instanceof Element)) return;
          if (node.tagName === "BUTTON") node.classList.add("vlibras-links");
          tagButtons(node);
        });
      }
    });
    observer.observe(document.body, { childList: true, subtree: true });

    return () => observer.disconnect();
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
