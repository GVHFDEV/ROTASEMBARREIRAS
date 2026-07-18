"use client";

import React from "react";
import { Camera, X, QrCode, MapPin } from "lucide-react";
import { TouristPoint, touristPoints } from "../data/mockData";
import { motion } from "framer-motion";

interface QRCodeScannerProps {
  onClose: () => void;
  onScanSuccess: (point: TouristPoint) => void;
}

export default function QRCodeScanner({ onClose, onScanSuccess }: QRCodeScannerProps) {
  const handleSimulateScan = (point: TouristPoint) => {
    onScanSuccess(point);
  };

  return (
    <motion.div
      initial={{ x: "100%" }}
      animate={{ x: 0 }}
      exit={{ x: "100%" }}
      transition={{ type: "spring", damping: 28, stiffness: 220 }}
      className="absolute inset-0 bg-zinc-950 z-50 flex flex-col justify-between p-6 text-white overflow-y-auto no-scrollbar pb-10"
    >
      {/* Header - larger text */}
      <div className="flex items-center justify-between mt-6">
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

      {/* Scanner Screen Area - larger visual components */}
      <div className="relative flex flex-col items-center justify-center my-6 flex-shrink-0">
        <div className="relative w-64 h-64 border-2 border-white/10 rounded-3xl overflow-hidden flex items-center justify-center bg-zinc-900/50 shadow-inner">
          {/* Scanning frame corners */}
          <div className="absolute top-4 left-4 w-7 h-7 border-t-4 border-l-4 border-brand rounded-tl-md"></div>
          <div className="absolute top-4 right-4 w-7 h-7 border-t-4 border-r-4 border-brand rounded-tr-md"></div>
          <div className="absolute bottom-4 left-4 w-7 h-7 border-b-4 border-l-4 border-brand rounded-bl-md"></div>
          <div className="absolute bottom-4 right-4 w-7 h-7 border-b-4 border-r-4 border-brand rounded-br-md"></div>

          {/* Glowing/Moving scan line */}
          <motion.div
            animate={{
              y: [-100, 100],
            }}
            transition={{
              repeat: Infinity,
              repeatType: "reverse",
              duration: 2,
              ease: "easeInOut",
            }}
            className="absolute left-0 right-0 h-1 bg-gradient-to-r from-transparent via-brand to-transparent shadow-[0_0_10px_#ff7f00]"
          />

          <QrCode className="w-20 h-20 text-white/10 stroke-[1.2]" />
        </div>
        
        {/* Larger description text for accessibility */}
        <p className="text-center text-zinc-300 text-sm mt-6 max-w-xs font-bold px-4 leading-relaxed">
          Aponte a câmera para o QR Code físico localizado na placa do ponto turístico.
        </p>
      </div>

      {/* Simulator Actions - Larger mock scan buttons */}
      <div className="w-full max-w-sm mx-auto bg-white/5 backdrop-blur-md rounded-3xl p-5 border border-white/10 flex-shrink-0">
        <span className="block text-center text-xs font-black tracking-widest text-brand uppercase mb-4">
          Simular Leitura (Protótipo)
        </span>
        <div className="grid grid-cols-2 gap-3 max-h-48 overflow-y-auto no-scrollbar">
          {touristPoints.map((point) => (
            <button
              key={point.id}
              onClick={() => handleSimulateScan(point)}
              className="flex items-center gap-2 px-4 py-3 bg-white/10 hover:bg-brand hover:text-white rounded-2xl text-xs font-extrabold text-left border border-white/5 transition-all truncate active:scale-95"
            >
              <MapPin className="w-4 h-4 text-brand flex-shrink-0" />
              <span className="truncate">{point.name}</span>
            </button>
          ))}
        </div>
      </div>
    </motion.div>
  );
}
