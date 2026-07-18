"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import { Camera, X, QrCode, Keyboard, AlertTriangle, Loader2, ArrowLeft } from "lucide-react";
import { motion } from "framer-motion";
import { BrowserMultiFormatReader, NotFoundException } from "@zxing/library";
import { TouristPoint } from "@/types/point";
import { fetchPointByQrCode } from "@/services/pointsService";

interface QRCodeScannerProps {
  onClose: () => void;
  onScanSuccess: (point: TouristPoint) => void;
}

type ScanState = "scanning" | "looking_up" | "not_found" | "camera_error" | "manual";

/** Short beep via Web Audio — no asset file needed. Created inside a user
 * gesture (modal open = tap), so AudioContext autoplay lock is satisfied
 * on iOS Safari too. */
function playBeep() {
  try {
    const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    const ctx = new AudioCtx();
    const oscillator = ctx.createOscillator();
    const gain = ctx.createGain();
    oscillator.type = "sine";
    oscillator.frequency.value = 880;
    gain.gain.value = 0.2;
    oscillator.connect(gain);
    gain.connect(ctx.destination);
    oscillator.start();
    oscillator.stop(ctx.currentTime + 0.15);
    oscillator.onended = () => ctx.close();
  } catch {
    // non-critical — silently skip if AudioContext blocked/unsupported
  }
}

/** Vibration API — Android Chrome supports it, iOS Safari does not (no
 * workaround possible, Apple doesn't expose vibration to web content). */
function vibrate() {
  if (typeof navigator !== "undefined" && "vibrate" in navigator) {
    navigator.vibrate(200);
  }
}

export default function QRCodeScanner({ onClose, onScanSuccess }: QRCodeScannerProps) {
  const [scanState, setScanState] = useState<ScanState>("scanning");
  const [errorMessage, setErrorMessage] = useState("");
  const [manualValue, setManualValue] = useState("");

  const videoRef = useRef<HTMLVideoElement>(null);
  const readerRef = useRef<BrowserMultiFormatReader | null>(null);
  const hasScannedRef = useRef(false);

  const lookupAndResolve = useCallback(
    async (qrValue: string) => {
      if (hasScannedRef.current) return; // guard against duplicate decode callbacks
      hasScannedRef.current = true;

      playBeep();
      vibrate();
      setScanState("looking_up");

      try {
        const point = await fetchPointByQrCode(qrValue.trim());
        if (point) {
          onScanSuccess(point);
        } else {
          setErrorMessage(`Nenhum ponto turístico encontrado para o código "${qrValue.trim()}".`);
          setScanState("not_found");
        }
      } catch {
        setErrorMessage("Erro ao consultar o ponto. Verifique sua conexão e tente novamente.");
        setScanState("not_found");
      }
    },
    [onScanSuccess]
  );

  // Start / stop camera stream tied to scanState === "scanning"
  useEffect(() => {
    if (scanState !== "scanning" || !videoRef.current) return;

    hasScannedRef.current = false;
    const reader = new BrowserMultiFormatReader();
    readerRef.current = reader;

    // facingMode: "environment" forces back camera on phones — required for
    // consistent behavior on iOS Safari, which otherwise may default front-facing.
    reader
      .decodeFromConstraints({ video: { facingMode: "environment" } }, videoRef.current, (result, err) => {
        if (result) {
          lookupAndResolve(result.getText());
        } else if (err && !(err instanceof NotFoundException)) {
          // NotFoundException fires continuously while no code is in frame —
          // that's normal scanning noise, not a real error. Anything else
          // (permission denial, no camera, etc.) surfaces as camera_error.
          console.warn("QR decode error:", err);
        }
      })
      .catch((err: Error) => {
        setErrorMessage(
          err.name === "NotAllowedError"
            ? "Permissão de câmera negada. Ative o acesso à câmera nas configurações do navegador."
            : "Não foi possível acessar a câmera neste dispositivo."
        );
        setScanState("camera_error");
      });

    return () => {
      reader.reset();
      readerRef.current = null;
    };
  }, [scanState, lookupAndResolve]);

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualValue.trim()) return;
    lookupAndResolve(manualValue);
  };

  const retryScanning = () => {
    setErrorMessage("");
    setManualValue("");
    setScanState("scanning");
  };

  return (
    <motion.div
      initial={{ x: "100%" }}
      animate={{ x: 0 }}
      exit={{ x: "100%" }}
      transition={{ type: "spring", damping: 28, stiffness: 220 }}
      className="absolute inset-0 bg-zinc-950 z-50 flex flex-col px-6 pb-10 pt-[calc(env(safe-area-inset-top)+20px)] text-white overflow-y-auto no-scrollbar"
    >
      {/* Header */}
      <div className="flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-2">
          <Camera className="w-6 h-6 text-brand" />
          <span className="font-extrabold text-sm tracking-wider uppercase text-zinc-200">Leitor QR Code</span>
        </div>
        <button
          onClick={onClose}
          className="p-3 bg-white/10 hover:bg-white/20 rounded-full transition-colors active:scale-90"
          title="Fechar"
        >
          <X className="w-6 h-6" />
        </button>
      </div>

      {/* ---------- Camera scanning view ---------- */}
      {scanState === "scanning" && (
        <div className="relative flex flex-col items-center justify-center flex-1 my-6">
          <div className="relative w-72 h-72 rounded-3xl overflow-hidden bg-zinc-900 shadow-inner">
            <video ref={videoRef} muted playsInline className="w-full h-full object-cover" />
            {/* Scanning frame corners, overlaid on top of video */}
            <div className="absolute top-4 left-4 w-7 h-7 border-t-4 border-l-4 border-brand rounded-tl-md pointer-events-none" />
            <div className="absolute top-4 right-4 w-7 h-7 border-t-4 border-r-4 border-brand rounded-tr-md pointer-events-none" />
            <div className="absolute bottom-4 left-4 w-7 h-7 border-b-4 border-l-4 border-brand rounded-bl-md pointer-events-none" />
            <div className="absolute bottom-4 right-4 w-7 h-7 border-b-4 border-r-4 border-brand rounded-br-md pointer-events-none" />
            <motion.div
              animate={{ y: [-110, 110] }}
              transition={{ repeat: Infinity, repeatType: "reverse", duration: 2, ease: "easeInOut" }}
              className="absolute left-0 right-0 h-1 bg-gradient-to-r from-transparent via-brand to-transparent shadow-[0_0_10px_#ff7f00] pointer-events-none"
            />
          </div>

          <p className="text-center text-zinc-300 text-sm mt-6 max-w-xs font-bold px-4 leading-relaxed">
            Aponte a câmera para o QR Code físico localizado na placa do ponto turístico.
          </p>

          <button
            onClick={() => setScanState("manual")}
            className="flex items-center gap-2 mt-6 px-5 py-3 bg-white/10 hover:bg-white/20 rounded-full text-sm font-bold transition-colors active:scale-95"
          >
            <Keyboard className="w-4 h-4" />
            Digitar código manualmente
          </button>
        </div>
      )}

      {/* ---------- Looking up in Supabase ---------- */}
      {scanState === "looking_up" && (
        <div className="flex flex-col items-center justify-center flex-1 gap-4">
          <Loader2 className="w-10 h-10 text-brand animate-spin" />
          <p className="text-zinc-300 text-sm font-bold">Buscando ponto turístico...</p>
        </div>
      )}

      {/* ---------- Camera permission / hardware error ---------- */}
      {scanState === "camera_error" && (
        <div className="flex flex-col items-center justify-center flex-1 gap-5 max-w-sm mx-auto text-center">
          <AlertTriangle className="w-12 h-12 text-red-400" />
          <p className="text-zinc-200 text-base font-bold leading-relaxed">{errorMessage}</p>
          <div className="flex flex-col gap-3 w-full">
            <button
              onClick={retryScanning}
              className="w-full py-4 bg-brand hover:bg-brand-dark rounded-full font-extrabold text-sm transition-colors active:scale-95"
            >
              Tentar Novamente
            </button>
            <button
              onClick={() => setScanState("manual")}
              className="flex items-center justify-center gap-2 w-full py-4 bg-white/10 hover:bg-white/20 rounded-full font-bold text-sm transition-colors active:scale-95"
            >
              <Keyboard className="w-4 h-4" />
              Digitar código manualmente
            </button>
          </div>
        </div>
      )}

      {/* ---------- Point not found ---------- */}
      {scanState === "not_found" && (
        <div className="flex flex-col items-center justify-center flex-1 gap-5 max-w-sm mx-auto text-center">
          <AlertTriangle className="w-12 h-12 text-red-400" />
          <p className="text-zinc-200 text-base font-bold leading-relaxed">{errorMessage}</p>
          <div className="flex flex-col gap-3 w-full">
            <button
              onClick={retryScanning}
              className="w-full py-4 bg-brand hover:bg-brand-dark rounded-full font-extrabold text-sm transition-colors active:scale-95"
            >
              Escanear Novamente
            </button>
            <button
              onClick={() => setScanState("manual")}
              className="flex items-center justify-center gap-2 w-full py-4 bg-white/10 hover:bg-white/20 rounded-full font-bold text-sm transition-colors active:scale-95"
            >
              <Keyboard className="w-4 h-4" />
              Digitar outro código
            </button>
          </div>
        </div>
      )}

      {/* ---------- Manual entry ---------- */}
      {scanState === "manual" && (
        <div className="flex flex-col items-center justify-center flex-1 gap-5 max-w-sm mx-auto w-full">
          <button
            onClick={retryScanning}
            className="flex items-center gap-2 self-start text-sm font-bold text-zinc-300 hover:text-white transition-colors mb-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Voltar para câmera
          </button>

          <QrCode className="w-14 h-14 text-brand" />
          <p className="text-center text-zinc-300 text-sm font-bold leading-relaxed">
            Digite o código impresso na placa do ponto turístico, útil para quem tem dificuldade de mirar a câmera ou baixa visão.
          </p>

          <form onSubmit={handleManualSubmit} className="w-full flex flex-col gap-4">
            <input
              type="text"
              autoFocus
              value={manualValue}
              onChange={(e) => setManualValue(e.target.value)}
              placeholder="ex: rota-ibituruna"
              className="w-full h-14 px-5 bg-white/10 border border-white/15 rounded-full text-base font-semibold text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-brand/50 focus:border-brand/50 transition-all"
            />
            <button
              type="submit"
              disabled={!manualValue.trim()}
              className="w-full py-4 bg-brand hover:bg-brand-dark rounded-full font-extrabold text-sm transition-colors active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Buscar Ponto
            </button>
          </form>
        </div>
      )}
    </motion.div>
  );
}
