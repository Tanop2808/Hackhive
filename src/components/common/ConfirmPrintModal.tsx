'use client';

import React from 'react';
import { ChatDocumentAttachment } from '@/types/printvault';

interface ConfirmPrintModalProps {
  isOpen: boolean;
  doc: ChatDocumentAttachment | null;
  customerName?: string;
  printerModel?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export const ConfirmPrintModal: React.FC<ConfirmPrintModalProps> = ({
  isOpen,
  doc,
  customerName = 'Customer',
  printerModel = 'Canon Laser Printer',
  onConfirm,
  onCancel,
}) => {
  if (!isOpen || !doc) return null;

  const isAadhaar =
    doc.isMaskedAadhaar !== false ||
    doc.fileName.toLowerCase().includes('aadhaar') ||
    doc.fileName.toLowerCase().includes('aadhar');

  return (
    <div
      className="fixed inset-0 z-[100] bg-black/75 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-150 select-none"
      onClick={onCancel}
    >
      <div
        className="w-full max-w-[420px] bg-[#fbf9f5] rounded-[32px] border border-[#ece8e1] shadow-2xl p-6 sm:p-7 flex flex-col space-y-5 animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header with Printer Badge */}
        <div className="flex items-start gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0 shadow-xs">
            <span className="material-symbols-outlined text-[26px]">print</span>
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-heading font-bold text-[18px] text-[#1b1c1a] leading-tight">
              Confirm the Print
            </h3>
            <p className="font-sans text-[12px] text-[#6b6760] mt-0.5">
              Spool directly to <strong>{printerModel}</strong>
            </p>
          </div>
          <button
            type="button"
            onClick={onCancel}
            className="w-8 h-8 rounded-full bg-[#f5f3ef] hover:bg-[#efeeea] flex items-center justify-center text-[#1b1c1a] cursor-pointer shrink-0 transition-all"
            title="Cancel"
          >
            <span className="material-symbols-outlined text-[18px]">close</span>
          </button>
        </div>

        {/* Document Job Summary Card */}
        <div className="p-4 rounded-2xl bg-white border border-[#ece8e1] shadow-xs space-y-3 text-[12px]">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0 flex-1">
              <span className="font-sans text-[10px] text-[#767588] uppercase tracking-wide block">
                DOCUMENT FILE
              </span>
              <p className="font-heading font-bold text-[14px] text-[#1b1c1a] truncate mt-0.5">
                {doc.fileName}
              </p>
              <p className="font-sans text-[11px] text-[#454556] mt-0.5">
                From <strong className="text-[#1b1c1a]">{customerName}</strong>
              </p>
            </div>
            <div className="text-right shrink-0">
              <span className="font-sans text-[9px] text-[#767588] uppercase tracking-wide block">
                PICKUP PIN
              </span>
              <span className="font-mono font-bold text-[15px] text-[#3d3bf3]">
                {doc.token}
              </span>
            </div>
          </div>

          {/* Specs Grid */}
          <div className="grid grid-cols-3 gap-2 pt-2 border-t border-[#ece8e1] text-center">
            <div className="p-2 bg-[#fbf9f5] rounded-xl">
              <span className="text-[10px] text-[#767588] block">COPIES</span>
              <span className="font-bold text-[#1b1c1a] mt-0.5 block">
                {doc.copies} ({doc.pageCount} pgs)
              </span>
            </div>
            <div className="p-2 bg-[#fbf9f5] rounded-xl">
              <span className="text-[10px] text-[#767588] block">COLOR</span>
              <span className="font-bold text-[#1b1c1a] mt-0.5 block">
                {doc.colorMode === 'bw' ? 'B&W' : 'Color'}
              </span>
            </div>
            <div className="p-2 bg-[#fbf9f5] rounded-xl">
              <span className="text-[10px] text-[#767588] block">TOTAL FEE</span>
              <span className="font-mono font-bold text-[#0a542a] mt-0.5 block">
                ₹{doc.totalPrice.toFixed(2)}
              </span>
            </div>
          </div>

          {/* Privacy Compliance Notice */}
          {isAadhaar && (
            <div className="p-2.5 rounded-xl bg-[#ddf5e6] text-[#0a542a] text-[10.5px] font-mono flex items-center gap-1.5 border border-[#b2e5c5]">
              <span className="material-symbols-outlined text-[15px]">verified_user</span>
              <span>Aadhaar Masked per UIDAI Sec 29(4)</span>
            </div>
          )}
        </div>

        {/* Security & Action Note */}
        <div className="bg-[#fff9db] border border-[#ffe082] rounded-xl p-3 flex items-start gap-2 text-[11px] text-[#5d4037] leading-relaxed">
          <span className="material-symbols-outlined text-[17px] text-amber-700 shrink-0 mt-0.5">
            lock
          </span>
          <p>
            When you click <strong>Yes</strong>, this job gets added to the printer queue and spooled directly to the Canon laser printer with zero disk storage.
          </p>
        </div>

        {/* Modal Action Buttons: Cancel and Yes */}
        <div className="grid grid-cols-2 gap-3 pt-1">
          <button
            type="button"
            onClick={onCancel}
            className="w-full h-12 rounded-2xl bg-[#f5f3ef] hover:bg-[#efeeea] text-[#1b1c1a] font-sans text-[13px] font-semibold transition-all cursor-pointer border border-[#ece8e1] flex items-center justify-center active:scale-98"
          >
            Cancel
          </button>

          <button
            type="button"
            id="confirm-print-yes-btn"
            onClick={onConfirm}
            className="w-full h-12 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-sans text-[14px] font-bold shadow-md shadow-emerald-600/25 transition-all cursor-pointer flex items-center justify-center gap-2 active:scale-98"
          >
            <span className="material-symbols-outlined text-[19px]">check</span>
            <span>Yes</span>
          </button>
        </div>
      </div>
    </div>
  );
};
