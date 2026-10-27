'use client';

import React, { useState } from 'react';
import { ChatDocumentAttachment } from '@/types/printvault';

interface SecureDocumentPreviewModalProps {
  doc: ChatDocumentAttachment | null;
  onClose: () => void;
  onPrint?: (doc: ChatDocumentAttachment) => void;
  shopName?: string;
  triggerToast?: (message: string) => void;
}

type MaskPreset = 'standard_front' | 'card_back' | 'full_letter';

export const SecureDocumentPreviewModal: React.FC<SecureDocumentPreviewModalProps> = ({
  doc,
  onClose,
  onPrint,
  shopName = 'PrintVault',
  triggerToast,
}) => {
  const [activePreset, setActivePreset] = useState<MaskPreset>('standard_front');
  const [photoOffset, setPhotoOffset] = useState({ top: 28, left: 6, width: 26, height: 38 });
  const [numberOffset, setNumberOffset] = useState({ top: 76, left: 16, width: 72, height: 11 });
  const [addressOffset, setAddressOffset] = useState({ top: 40, left: 36, width: 58, height: 28 });
  const [qrOffset, setQrOffset] = useState({ top: 28, left: 74, width: 21, height: 26 });
  const [isAdjusting, setIsAdjusting] = useState(false);

  if (!doc) return null;

  const isAadhaar =
    doc.isMaskedAadhaar !== false ||
    doc.fileName.toLowerCase().includes('aadhaar') ||
    doc.fileName.toLowerCase().includes('aadhar') ||
    doc.fileName.toLowerCase().includes('uidai');

  const hasRealImage = !!doc.previewDataUrl;

  const handlePrint = () => {
    if (onPrint) {
      onPrint(doc);
    } else {
      if (triggerToast) {
        triggerToast(`Spooling "${doc.fileName}" directly to printer...`);
      }
      setTimeout(() => {
        if (typeof window !== 'undefined') {
          window.print();
        }
      }, 400);
    }
  };

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    if (triggerToast) {
      triggerToast('Direct document download is disabled for privacy protection.');
    }
  };

  // Switch presets for different Aadhaar layouts
  const applyPreset = (preset: MaskPreset) => {
    setActivePreset(preset);
    if (preset === 'standard_front') {
      setPhotoOffset({ top: 28, left: 6, width: 26, height: 38 });
      setNumberOffset({ top: 76, left: 16, width: 72, height: 11 });
      setAddressOffset({ top: 40, left: 36, width: 58, height: 28 });
      setQrOffset({ top: 28, left: 74, width: 21, height: 26 });
    } else if (preset === 'card_back') {
      setPhotoOffset({ top: 0, left: 0, width: 0, height: 0 }); // No photo on back
      setNumberOffset({ top: 82, left: 16, width: 72, height: 10 });
      setAddressOffset({ top: 24, left: 8, width: 84, height: 50 }); // Full address block on back
      setQrOffset({ top: 24, left: 68, width: 24, height: 30 });
    } else if (preset === 'full_letter') {
      setPhotoOffset({ top: 58, left: 10, width: 22, height: 22 });
      setNumberOffset({ top: 86, left: 18, width: 64, height: 6 });
      setAddressOffset({ top: 35, left: 10, width: 80, height: 18 });
      setQrOffset({ top: 58, left: 70, width: 20, height: 20 });
    }
  };

  return (
    <div
      className="fixed inset-0 z-[95] bg-black/80 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 animate-in fade-in duration-150 select-none"
      onContextMenu={handleContextMenu}
    >
      <div className="w-full max-w-2xl bg-[#fbf9f5] rounded-[28px] border border-[#ece8e1] shadow-2xl flex flex-col max-h-[94vh] overflow-hidden">
        {/* Modal Security Header */}
        <div className="bg-white px-5 py-3.5 border-b border-[#ece8e1] flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-[#3d3bf3] text-white flex items-center justify-center shrink-0 shadow-xs">
              <span className="material-symbols-outlined text-[20px]">visibility</span>
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h4 className="font-heading font-bold text-[15px] text-[#1b1c1a] truncate">
                  Secure Document Preview
                </h4>
                <span className="font-mono text-[9px] bg-red-100 text-red-800 border border-red-200 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider shrink-0 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-600"></span>
                  Download Disabled
                </span>
              </div>
              <p className="font-sans text-[11px] text-[#6b6760] truncate">
                {doc.fileName} • {doc.fileSize} • Ephemeral RAM Buffer
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-[#f5f3ef] hover:bg-[#efeeea] flex items-center justify-center text-[#1b1c1a] cursor-pointer shrink-0 transition-all"
            title="Close Preview"
          >
            <span className="material-symbols-outlined text-[18px]">close</span>
          </button>
        </div>

        {/* Mask Alignment Toolbar for Real Uploaded Aadhaar Images */}
        {hasRealImage && isAadhaar && (
          <div className="bg-[#f5f3ef] px-4 py-2 border-b border-[#ece8e1] flex flex-wrap items-center justify-between gap-2 text-[11px] shrink-0">
            <div className="flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[16px] text-[#3d3bf3]">verified_user</span>
              <span className="font-sans font-semibold text-[#1b1c1a]">Mask Preset:</span>
              <div className="flex items-center gap-1 bg-white p-0.5 rounded-lg border border-[#ece8e1]">
                <button
                  type="button"
                  onClick={() => applyPreset('standard_front')}
                  className={`px-2 py-0.5 rounded font-sans text-[10px] font-medium transition-all ${
                    activePreset === 'standard_front'
                      ? 'bg-[#3d3bf3] text-white font-bold'
                      : 'text-[#454556] hover:bg-[#f5f3ef]'
                  }`}
                >
                  Standard Front
                </button>
                <button
                  type="button"
                  onClick={() => applyPreset('card_back')}
                  className={`px-2 py-0.5 rounded font-sans text-[10px] font-medium transition-all ${
                    activePreset === 'card_back'
                      ? 'bg-[#3d3bf3] text-white font-bold'
                      : 'text-[#454556] hover:bg-[#f5f3ef]'
                  }`}
                >
                  Back (Address)
                </button>
                <button
                  type="button"
                  onClick={() => applyPreset('full_letter')}
                  className={`px-2 py-0.5 rounded font-sans text-[10px] font-medium transition-all ${
                    activePreset === 'full_letter'
                      ? 'bg-[#3d3bf3] text-white font-bold'
                      : 'text-[#454556] hover:bg-[#f5f3ef]'
                  }`}
                >
                  Full Letter
                </button>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setIsAdjusting(!isAdjusting)}
              className="text-[#3d3bf3] hover:text-[#2e2cd4] font-medium inline-flex items-center gap-1 text-[11px] cursor-pointer"
            >
              <span className="material-symbols-outlined text-[14px]">
                {isAdjusting ? 'check' : 'tune'}
              </span>
              <span>{isAdjusting ? 'Done Adjusting' : 'Nudge Masks'}</span>
            </button>
          </div>
        )}

        {/* Nudge Controls Bar when adjusting */}
        {isAdjusting && hasRealImage && (
          <div className="bg-[#fff9db] border-b border-[#ffe082] px-4 py-2 text-[11px] text-[#5d4037] flex flex-wrap items-center justify-between gap-2 shrink-0 animate-in fade-in duration-150">
            <span>Fine-tune Mask Offsets:</span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setPhotoOffset((p) => ({ ...p, top: Math.max(0, p.top - 2) }))}
                className="px-2 py-0.5 rounded bg-white border border-[#ffe082] font-mono text-[10px]"
              >
                Photo ▲
              </button>
              <button
                type="button"
                onClick={() => setPhotoOffset((p) => ({ ...p, top: Math.min(80, p.top + 2) }))}
                className="px-2 py-0.5 rounded bg-white border border-[#ffe082] font-mono text-[10px]"
              >
                Photo ▼
              </button>
              <button
                type="button"
                onClick={() => setNumberOffset((p) => ({ ...p, top: Math.max(0, p.top - 2) }))}
                className="px-2 py-0.5 rounded bg-white border border-[#ffe082] font-mono text-[10px]"
              >
                Number ▲
              </button>
              <button
                type="button"
                onClick={() => setNumberOffset((p) => ({ ...p, top: Math.min(90, p.top + 2) }))}
                className="px-2 py-0.5 rounded bg-white border border-[#ffe082] font-mono text-[10px]"
              >
                Number ▼
              </button>
            </div>
          </div>
        )}

        {/* Scrollable Document Container */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-6 bg-[#efeeea]/60 relative flex flex-col items-center justify-start">
          {/* Background Security Watermark */}
          <div className="pointer-events-none select-none absolute inset-0 opacity-[0.03] flex flex-wrap items-center justify-center gap-16 font-mono text-xl font-bold rotate-[-22deg] text-black overflow-hidden">
            <span>PRINTVAULT ZERO-STORE</span>
            <span>DOWNLOAD DISABLED</span>
            <span>EPHEMERAL SPOOL ONLY</span>
            <span>SECTION 29(4) PRIVACY</span>
            <span>RAM BUFFER</span>
          </div>

          {/* ===================================================================== */}
          {/* PHYSICAL PRINTABLE DOCUMENT CONTAINER                                 */}
          {/* Target of @media print (Printed directly to hardware)                */}
          {/* ===================================================================== */}
          <div
            id="printable-spool-document"
            className="bg-white rounded-2xl p-4 sm:p-6 shadow-md border border-[#ece8e1] relative w-full max-w-xl mx-auto"
            style={{
              printColorAdjust: 'exact',
              WebkitPrintColorAdjust: 'exact',
            }}
          >
            {/* Top Official Masking Status Banner */}
            {isAadhaar && (
              <div className="mb-3 px-3 py-1.5 bg-[#ddf5e6] text-[#0a542a] rounded-xl flex items-center justify-between text-[11px] font-mono font-semibold border border-[#b2e5c5]">
                <div className="flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[15px]">verified_user</span>
                  <span>UIDAI SECTION 29(4) COMPLIANT MASKED COPY</span>
                </div>
                <span className="text-[9px] bg-white/70 px-2 py-0.5 rounded font-bold">
                  SPOOL PIN: {doc.token}
                </span>
              </div>
            )}

            {/* =================================================================== */}
            {/* REAL DOCUMENT WITH DYNAMIC LIVE MASKING OVERLAYS                   */}
            {/* =================================================================== */}
            {hasRealImage ? (
              <div className="relative inline-block w-full rounded-2xl overflow-hidden border-2 border-[#1b1c1a]/15 shadow-inner bg-white select-none">
                {/* 1. Real Uploaded Document Image */}
                <img
                  src={doc.previewDataUrl}
                  alt={doc.fileName}
                  draggable={false}
                  className="w-full h-auto block select-none pointer-events-none"
                  style={{
                    userSelect: 'none',
                    WebkitUserSelect: 'none',
                  } as React.CSSProperties}
                />

                {/* 2. DYNAMIC LIVE MASKS (Stamped on top of real document) */}
                {isAadhaar && (
                  <>
                    {/* PHOTO MASK */}
                    {photoOffset.width > 0 && (
                      <div
                        className="absolute z-20 rounded-xl bg-black border-2 border-amber-400 shadow-2xl flex flex-col items-center justify-center text-center p-1.5 text-white select-none pointer-events-none"
                        style={{
                          top: `${photoOffset.top}%`,
                          left: `${photoOffset.left}%`,
                          width: `${photoOffset.width}%`,
                          height: `${photoOffset.height}%`,
                          printColorAdjust: 'exact',
                          WebkitPrintColorAdjust: 'exact',
                        }}
                      >
                        <span className="material-symbols-outlined text-[24px] sm:text-[28px] text-amber-400 mb-0.5">
                          no_photography
                        </span>
                        <span className="font-mono text-[9px] sm:text-[10px] font-bold text-amber-300 tracking-wider leading-tight">
                          PHOTO MASKED
                        </span>
                        <span className="text-[7px] text-white/70 uppercase tracking-widest mt-0.5">
                          UIDAI Sec 29
                        </span>
                      </div>
                    )}

                    {/* FIRST 8 AADHAAR DIGITS MASK */}
                    {numberOffset.width > 0 && (
                      <div
                        className="absolute z-20 rounded-lg bg-black border-2 border-emerald-400 shadow-xl flex items-center justify-center px-3 py-1 text-white select-none pointer-events-none"
                        style={{
                          top: `${numberOffset.top}%`,
                          left: `${numberOffset.left}%`,
                          width: `${numberOffset.width}%`,
                          height: `${numberOffset.height}%`,
                          printColorAdjust: 'exact',
                          WebkitPrintColorAdjust: 'exact',
                        }}
                      >
                        <div className="flex items-center gap-2 font-mono text-[13px] sm:text-[15px] font-bold tracking-widest text-white">
                          <span className="text-amber-300">XXXX  XXXX</span>
                          <span className="text-[8px] sm:text-[9px] font-sans font-semibold bg-emerald-600 text-white px-1.5 py-0.2 rounded">
                            FIRST 8 MASKED
                          </span>
                        </div>
                      </div>
                    )}

                    {/* ADDRESS REDACTION MASK */}
                    {addressOffset.width > 0 && (
                      <div
                        className="absolute z-20 rounded-lg bg-black border border-red-500 shadow-lg flex flex-col items-center justify-center p-2 text-center text-white select-none pointer-events-none"
                        style={{
                          top: `${addressOffset.top}%`,
                          left: `${addressOffset.left}%`,
                          width: `${addressOffset.width}%`,
                          height: `${addressOffset.height}%`,
                          printColorAdjust: 'exact',
                          WebkitPrintColorAdjust: 'exact',
                        }}
                      >
                        <span className="font-mono text-[9px] sm:text-[10px] font-bold text-red-300 tracking-wide leading-tight">
                          CONFIDENTIAL • RESIDENTIAL ADDRESS REDACTED
                        </span>
                        <span className="text-[7.5px] text-white/70 mt-0.5">
                          Section 29(4) Aadhaar Act Masked Details
                        </span>
                      </div>
                    )}

                    {/* QR CODE SEALED MASK */}
                    {qrOffset.width > 0 && (
                      <div
                        className="absolute z-20 rounded-lg bg-[#07006c] border border-amber-400 shadow-md flex flex-col items-center justify-center p-1 text-white select-none pointer-events-none"
                        style={{
                          top: `${qrOffset.top}%`,
                          left: `${qrOffset.left}%`,
                          width: `${qrOffset.width}%`,
                          height: `${qrOffset.height}%`,
                          printColorAdjust: 'exact',
                          WebkitPrintColorAdjust: 'exact',
                        }}
                      >
                        <span className="material-symbols-outlined text-[18px] text-amber-300">lock</span>
                        <span className="text-[7px] font-mono font-bold tracking-tight text-center leading-tight">
                          QR SEALED
                        </span>
                      </div>
                    )}
                  </>
                )}
              </div>
            ) : isAadhaar ? (
              /* =================================================================== */
              /* HIGH-FIDELITY SYNTHETIC AADHAAR TEMPLATE (Fallback for presets)    */
              /* =================================================================== */
              <div className="space-y-4">
                {/* Top Government Emblem Banner */}
                <div className="border-b-2 border-[#1b1c1a]/15 pb-3 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-xl bg-[#fff3c4] border border-[#ffd54f] flex flex-col items-center justify-center text-center p-1 text-[#422006] shrink-0">
                      <span className="material-symbols-outlined text-[22px]">account_balance</span>
                      <span className="text-[6.5px] font-bold uppercase leading-none mt-0.5">सत्यमेव जयते</span>
                    </div>
                    <div>
                      <p className="font-heading font-bold text-[13px] text-[#1b1c1a] leading-tight">
                        भारत सरकार / GOVERNMENT OF INDIA
                      </p>
                      <p className="font-sans text-[11px] text-[#6b6760]">
                        भारतीय विशिष्ट पहचान प्राधिकरण / UIDAI
                      </p>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="inline-block px-2.5 py-1 rounded-full bg-[#ddf5e6] text-[#0a542a] text-[10px] font-mono font-bold border border-[#b2e5c5]">
                      ✓ MASKED AADHAAR
                    </span>
                    <p className="font-mono text-[9px] text-[#767588] mt-0.5">Circular No. 4(4)/57</p>
                  </div>
                </div>

                {/* Two-Column Card Layout */}
                <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 py-2">
                  {/* Left: Masked Photo & Sealed QR */}
                  <div className="sm:col-span-4 flex flex-col items-center gap-3 border-b sm:border-b-0 sm:border-r border-[#ece8e1] pb-3 sm:pb-0 sm:pr-3">
                    <div className="w-28 h-32 rounded-xl bg-[#1b1c1a] relative flex flex-col items-center justify-center text-center p-2 text-white overflow-hidden shadow-inner">
                      <span className="material-symbols-outlined text-[32px] text-amber-400 mb-1 z-10">
                        no_photography
                      </span>
                      <span className="font-mono text-[9.5px] font-bold text-amber-300 tracking-wider z-10">
                        PHOTO MASKED
                      </span>
                      <span className="text-[7.5px] text-white/60 uppercase tracking-widest mt-0.5 z-10">
                        Privacy Shield
                      </span>
                    </div>

                    <div className="w-24 h-24 rounded-lg bg-[#07006c] border border-amber-400 relative flex flex-col items-center justify-center p-1 text-center text-white">
                      <span className="material-symbols-outlined text-[20px] text-amber-300">lock</span>
                      <span className="text-[7.5px] font-mono font-bold tracking-tight text-center leading-tight mt-0.5">
                        QR CODE SEALED
                      </span>
                    </div>
                  </div>

                  {/* Right: Redacted Fields & Number */}
                  <div className="sm:col-span-8 flex flex-col justify-between space-y-3">
                    <div>
                      <span className="text-[10px] font-sans uppercase font-bold text-[#6b6760] block tracking-wide">
                        Name / नाव
                      </span>
                      <div className="flex items-center gap-2 mt-1">
                        <div className="h-6 w-44 bg-[#1b1c1a] rounded flex items-center px-2">
                          <span className="font-mono text-[10px] text-white/70 tracking-widest">
                            ██████████████
                          </span>
                        </div>
                        <span className="text-[9.5px] font-mono font-bold bg-[#ffdad6] text-[#ba1a1a] px-2 py-0.5 rounded">
                          NAME REDACTED
                        </span>
                      </div>
                    </div>

                    <div>
                      <span className="text-[10px] font-sans uppercase font-bold text-[#6b6760] block tracking-wide">
                        Address / पत्ता
                      </span>
                      <div className="mt-1 space-y-1">
                        <div className="h-3.5 w-full bg-[#1b1c1a] rounded"></div>
                        <div className="h-3.5 w-5/6 bg-[#1b1c1a] rounded"></div>
                      </div>
                      <span className="text-[9px] font-mono font-semibold text-[#ba1a1a] bg-[#ffdad6] px-2 py-0.5 rounded mt-1.5 inline-block">
                        RESIDENTIAL ADDRESS REDACTED (SEC. 29)
                      </span>
                    </div>

                    <div className="pt-2 border-t border-[#ece8e1]">
                      <span className="text-[9px] font-sans uppercase font-bold text-[#6b6760] block tracking-wider mb-1">
                        Aadhaar Number / आधार क्रमांक
                      </span>
                      <div className="bg-[#f5f3ef] border border-[#ece8e1] rounded-xl px-4 py-2 flex items-center justify-between">
                        <span className="font-mono text-[18px] sm:text-[20px] font-bold tracking-widest text-[#1b1c1a]">
                          <span className="text-[#3d3bf3] select-none">XXXX  XXXX</span>  4892
                        </span>
                        <span className="text-[9.5px] font-mono font-bold bg-[#ddf5e6] text-[#0a542a] px-2 py-0.5 rounded">
                          First 8 Masked
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="pt-2 text-center border-t border-[#ece8e1]">
                  <p className="font-heading font-semibold text-[11px] text-[#1b1c1a]">
                    मेरा आधार, मेरी पहचान (Proof of Identity, not of Citizenship)
                  </p>
                </div>
              </div>
            ) : (
              /* Non-Aadhaar General Document (PDF, Word, TXT) */
              <div className="space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-[#ece8e1]">
                  <div>
                    <h4 className="font-heading font-bold text-[16px] text-[#1b1c1a]">
                      {doc.fileName}
                    </h4>
                    <p className="font-sans text-[11px] text-[#6b6760]">
                      Format: {doc.fileType?.toUpperCase() || 'DOCUMENT'} • {doc.pageCount} Pages • {doc.copies} Copies
                    </p>
                  </div>
                  <span className="font-mono text-[10px] bg-[#e1e0ff] text-[#07006c] px-2.5 py-1 rounded-full font-semibold">
                    RAM Spool Buffer
                  </span>
                </div>

                <div className="space-y-3 font-sans text-[13px] text-[#1b1c1a] leading-relaxed">
                  <div className="p-3 bg-[#f5f3ef] rounded-xl border border-[#ece8e1] flex items-center justify-between text-[11px] text-[#454556]">
                    <span>Spool Job ID: <strong>{doc.jobId}</strong></span>
                    <span>Pickup PIN: <strong className="font-mono text-[#3d3bf3]">{doc.token}</strong></span>
                  </div>
                  <p className="text-[#454556]">
                    This document is held exclusively in volatile RAM cache for zero-trace printing. No permanent copy is stored on disk.
                  </p>
                  <div className="space-y-2 py-2">
                    <div className="h-3.5 bg-[#f0eee9] rounded w-11/12"></div>
                    <div className="h-3.5 bg-[#f0eee9] rounded w-full"></div>
                    <div className="h-3.5 bg-[#f0eee9] rounded w-4/5"></div>
                  </div>
                  <div className="pt-2 border-t border-[#ece8e1] flex items-center justify-between text-[11px] text-[#767588]">
                    <span>Color Mode: {doc.colorMode.toUpperCase()}</span>
                    <span>Total Fee: ₹{doc.totalPrice.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Official Print Footer */}
            <div className="mt-4 pt-3 border-t border-[#ece8e1] flex items-center justify-between text-[10px] text-[#767588]">
              <span>Printed via {shopName} Canon Laser Spool</span>
              <span className="font-mono">PIN: {doc.token} • Zero-Store Protocol</span>
            </div>
          </div>
        </div>

        {/* Modal Action Controls: Direct Print Only (NO DOWNLOAD) */}
        <div className="bg-white px-5 py-4 border-t border-[#ece8e1] flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2 text-[11px] text-[#6b6760]">
            <span className="material-symbols-outlined text-[16px] text-amber-600">security</span>
            <span>Direct file download is permanently disabled. Only direct hardware print is permitted.</span>
          </div>

          <div className="flex items-center gap-2.5 justify-end">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl bg-[#f5f3ef] hover:bg-[#efeeea] text-[#1b1c1a] font-sans text-[12px] font-semibold transition-all cursor-pointer"
            >
              Close
            </button>

            <button
              type="button"
              id="modal-direct-print-btn"
              onClick={handlePrint}
              className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-sans text-[13px] font-bold flex items-center justify-center gap-2 shadow-md shadow-emerald-600/25 active:scale-98 transition-all cursor-pointer"
            >
              <span className="material-symbols-outlined text-[18px]">print</span>
              <span>Confirm the Print</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
