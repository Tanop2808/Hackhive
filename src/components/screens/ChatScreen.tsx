'use client';

import React, { useState, useRef } from 'react';
import { usePrintVault } from '@/context/PrintVaultContext';
import { ColorMode, ChatDocumentAttachment } from '@/types/printvault';
import { SecureDocumentPreviewModal } from '@/components/common/SecureDocumentPreviewModal';
import { ConfirmPrintModal } from '@/components/common/ConfirmPrintModal';

export const ChatScreen: React.FC = () => {
  const {
    activeChatSession,
    acceptChatRequest,
    declineChatRequest,
    sendChatMessage,
    sendDocumentInChat,
    setCurrentScreen,
    currentUser,
    isShopkeeperMode,
    setIsShopkeeperMode,
    triggerToast,
    countdown,
    formatCountdown,
  } = usePrintVault();

  const [inputMessage, setInputMessage] = useState('');
  const [showDocumentModal, setShowDocumentModal] = useState(false);

  // Document Send Form State
  const [selectedFileName, setSelectedFileName] = useState('e-Aadhaar_Card_Tanishq.pdf');
  const [fileSize, setFileSize] = useState('1.4 MB');
  const [pageCount, setPageCount] = useState(2);
  const [copies, setCopies] = useState(2);
  const [colorMode, setColorMode] = useState<ColorMode>('bw');
  const [isMaskedAadhaar, setIsMaskedAadhaar] = useState(true);
  const [printNote, setPrintNote] = useState('Please print back-to-back (duplex)');
  const [fileType, setFileType] = useState<string>('pdf');
  const [previewDataUrl, setPreviewDataUrl] = useState<string | undefined>(undefined);

  // Device file upload state
  const [uploadedFile, setUploadedFile] = useState<{
    name: string;
    size: string;
    pages: number;
    type: string;
    previewDataUrl?: string;
  } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Secure In-Memory Document Preview Modal (Download Blocked)
  const [previewModalDoc, setPreviewModalDoc] = useState<ChatDocumentAttachment | null>(null);
  const [confirmModalDoc, setConfirmModalDoc] = useState<ChatDocumentAttachment | null>(null);
  const [confirmedTokens, setConfirmedTokens] = useState<Record<string, boolean>>({});

  if (!activeChatSession) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center min-h-[400px]">
        <div className="w-12 h-12 rounded-2xl bg-[#f5f3ef] flex items-center justify-center text-[#767588] mb-3">
          <span className="material-symbols-outlined text-[24px]">chat_bubble_outline</span>
        </div>
        <h3 className="font-heading font-semibold text-[16px] text-[#1b1c1a]">No Active Chat</h3>
        <p className="font-sans text-[13px] text-[#6b6760] mt-1 max-w-[280px]">
          Select a nearby Xerox shop to connect with the operator and send your documents.
        </p>
        <button
          type="button"
          onClick={() => setCurrentScreen('home')}
          className="mt-4 px-5 py-2.5 rounded-full bg-[#3d3bf3] text-white text-[13px] font-sans font-semibold hover:bg-[#2e2cd4] transition-all cursor-pointer"
        >
          View Nearby Xerox Stores
        </button>
      </div>
    );
  }

  const { shop, customer, status, messages } = activeChatSession;
  const operatorName = shop.operatorName || 'Mohan Kumar';
  const customerName = customer.name || currentUser?.name || 'Tanishq Mudaliyar';

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMessage.trim()) return;
    sendChatMessage(inputMessage);
    setInputMessage('');
  };

  const handleDeviceFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const sizeInMB = file.size / (1024 * 1024);
    const sizeFormatted = sizeInMB >= 1 ? `${sizeInMB.toFixed(1)} MB` : `${Math.max(1, Math.round(file.size / 1024))} KB`;

    // Estimate page count based on format & size
    let estimatedPages = 1;
    const lowerName = file.name.toLowerCase();
    if (lowerName.endsWith('.pdf')) {
      estimatedPages = Math.max(1, Math.min(25, Math.round(sizeInMB * 3) || 2));
    } else if (lowerName.endsWith('.doc') || lowerName.endsWith('.docx')) {
      estimatedPages = Math.max(1, Math.min(20, Math.round(sizeInMB * 2) || 3));
    } else if (file.type.startsWith('image/')) {
      estimatedPages = 1;
    } else {
      estimatedPages = 1;
    }

    let detectedType = 'pdf';
    if (lowerName.endsWith('.doc') || lowerName.endsWith('.docx')) {
      detectedType = 'doc';
    } else if (file.type.startsWith('image/') || lowerName.match(/\.(png|jpg|jpeg|webp)$/)) {
      detectedType = 'image';
    } else if (lowerName.endsWith('.txt')) {
      detectedType = 'txt';
    }

    // Auto-detect Aadhaar or government ID documents
    const isIdDoc =
      lowerName.includes('aadhaar') ||
      lowerName.includes('aadhar') ||
      lowerName.includes('uidai') ||
      lowerName.includes('pan') ||
      lowerName.includes('id_card');

    if (isIdDoc) {
      setIsMaskedAadhaar(true);
      triggerToast('Aadhaar / ID document detected! Auto-masking enabled for your privacy.');
    }

    setSelectedFileName(file.name);
    setFileSize(sizeFormatted);
    setPageCount(estimatedPages);
    setFileType(detectedType);

    // Read image data if it's an image
    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const result = event.target?.result as string;
        setPreviewDataUrl(result);
        setUploadedFile({
          name: file.name,
          size: sizeFormatted,
          pages: estimatedPages,
          type: detectedType,
          previewDataUrl: result,
        });
      };
      reader.readAsDataURL(file);
    } else {
      setPreviewDataUrl(undefined);
      setUploadedFile({
        name: file.name,
        size: sizeFormatted,
        pages: estimatedPages,
        type: detectedType,
      });
    }

    triggerToast(`Loaded "${file.name}" from device (${sizeFormatted})`);
  };

  const handleSendDocument = () => {
    sendDocumentInChat({
      fileName: selectedFileName,
      fileSize,
      pageCount,
      copies,
      colorMode,
      isMaskedAadhaar,
      note: printNote,
      fileType,
      previewDataUrl,
      maskedDetails: isMaskedAadhaar
        ? {
            name: customerName,
            aadhaarNumber: 'XXXX-XXXX-4892',
            address: 'Section 29(4) Aadhaar Act Masked Residential Details',
            photoMasked: true,
            qrMasked: true,
          }
        : undefined,
    });
    setShowDocumentModal(false);
  };

  const handleDirectPrint = (doc: ChatDocumentAttachment) => {
    setPreviewModalDoc(doc);
    triggerToast(`Spooling "${doc.fileName}" directly to ${shop.name} printer...`);
    setTimeout(() => {
      if (typeof window !== 'undefined') {
        window.print();
      }
    }, 400);
  };

  const handleConfirmAndAddPrint = () => {
    if (!confirmModalDoc) return;
    const doc = confirmModalDoc;
    setConfirmedTokens((prev) => ({ ...prev, [doc.token]: true }));
    setConfirmModalDoc(null);
    triggerToast(`Added "${doc.fileName}" to print queue! Spooling to printer...`);
    sendChatMessage(`Document "${doc.fileName}" confirmed and added to the printer queue. Printing now!`);
    setTimeout(() => {
      if (typeof window !== 'undefined') {
        window.print();
      }
    }, 300);
  };

  return (
    <div className="flex flex-col w-full h-full pb-3 sm:pb-6 relative">
      {/* Top Shopkeeper & Session Header Bar */}
      <div className="bg-white rounded-3xl p-4 border border-[#ece8e1] shadow-xs mb-3">
        <div className="flex items-center justify-between gap-2.5">
          {/* Shop and Operator Info */}
          <div className="flex items-center gap-2.5 min-w-0">
            <button
              type="button"
              onClick={() => setCurrentScreen('home')}
              className="w-8 h-8 rounded-full bg-[#f5f3ef] hover:bg-[#efeeea] flex items-center justify-center text-[#1b1c1a] active:scale-95 transition-all cursor-pointer shrink-0"
              title="Back to Map"
            >
              <span className="material-symbols-outlined text-[18px]">arrow_back</span>
            </button>

            <div className="relative shrink-0">
              <img
                src={shop.image}
                alt={shop.name}
                className="w-10 h-10 rounded-2xl object-cover border border-[#ece8e1]"
              />
              <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 rounded-full border-2 border-white"></span>
            </div>

            <div className="min-w-0">
              <h3 className="font-heading font-bold text-[14px] sm:text-[15px] text-[#1b1c1a] truncate leading-tight">
                {shop.name}
              </h3>
              <p className="font-sans text-[11px] text-[#454556] truncate">
                <span className="font-semibold text-[#1b1c1a]">{operatorName}</span> • {shop.distance}
              </p>
            </div>
          </div>

          {/* Top Quick Actions: Send Document Button & Role Switcher */}
          <div className="flex items-center gap-1.5 shrink-0">
            {/* Quick Send Document Button for Customer */}
            {!isShopkeeperMode && (
              <button
                type="button"
                id="mobile-header-send-doc-btn"
                onClick={() => {
                  if (status === 'pending') {
                    acceptChatRequest();
                  }
                  setShowDocumentModal(true);
                }}
                className="px-3 py-1.5 rounded-full bg-[#3d3bf3] hover:bg-[#2e2cd4] text-white font-sans text-[11px] font-bold flex items-center gap-1 shadow-xs active:scale-95 transition-all cursor-pointer shrink-0"
                title="Send document to print"
              >
                <span className="material-symbols-outlined text-[15px]">upload_file</span>
                <span>Send Doc</span>
              </button>
            )}

            {/* Shopkeeper Perspective Simulator Switch */}
            <button
              type="button"
              onClick={() => {
                setIsShopkeeperMode(!isShopkeeperMode);
                triggerToast(
                  !isShopkeeperMode
                    ? `Switched to Shopkeeper View (${operatorName})`
                    : `Switched to Customer View (${customerName})`
                );
              }}
              className={`px-2.5 sm:px-3 py-1.5 rounded-full text-[11px] font-sans font-semibold border flex items-center gap-1.5 transition-all cursor-pointer ${
                isShopkeeperMode
                  ? 'bg-[#ffe8d6] text-[#8a3800] border-[#ffb27d]'
                  : 'bg-[#f5f3ef] text-[#454556] border-[#ece8e1] hover:bg-[#efeeea]'
              }`}
            >
              <span className="material-symbols-outlined text-[15px]">
                {isShopkeeperMode ? 'storefront' : 'person'}
              </span>
              <span className="hidden xs:inline">{isShopkeeperMode ? 'Shopkeeper' : 'Customer'}</span>
            </button>
          </div>
        </div>

        {/* Customer Context Ribbon */}
        <div className="mt-3 pt-2.5 border-t border-[#ece8e1] flex items-center justify-between text-[11px] text-[#6b6760]">
          <div className="flex items-center gap-1.5 truncate">
            <span className="material-symbols-outlined text-[15px] text-[#3d3bf3]">badge</span>
            <span>Customer: <strong className="text-[#1b1c1a]">{customerName}</strong></span>
          </div>
          <span className="font-sans text-[10px] bg-[#e1e0ff] text-[#07006c] px-2.5 py-0.5 rounded-full font-medium shrink-0">
            Secure Session
          </span>
        </div>
      </div>

      {/* PENDING STATE: Customer waiting for Shopkeeper to Accept */}
      {status === 'pending' && (
        <div className="bg-white rounded-3xl p-6 border border-[#ece8e1] shadow-xs mb-4 space-y-5 animate-in fade-in duration-200">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl bg-[#e1e0ff] text-[#3d3bf3] flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-[24px] animate-spin">sync</span>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping"></span>
                <span className="font-sans text-[11px] text-amber-700 font-semibold uppercase tracking-wide">
                  Waiting for Shopkeeper
                </span>
              </div>
              <h4 className="font-heading font-semibold text-[17px] text-[#1b1c1a] mt-1">
                Print Request Sent to {operatorName}
              </h4>
              <p className="font-sans text-[13px] text-[#6b6760] mt-1 leading-relaxed">
                Your request was sent to <strong>{shop.name}</strong>. The chat and document upload will pop up automatically as soon as <strong>{operatorName}</strong> accepts on the shopkeeper terminal.
              </p>
            </div>
          </div>

          {/* Stepper Progress Indicator */}
          <div className="p-4 bg-[#fbf9f5] rounded-2xl border border-[#ece8e1] space-y-3 text-[12px]">
            <div className="flex items-center gap-3">
              <div className="w-6 h-6 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[11px] font-bold shrink-0">
                ✓
              </div>
              <div className="flex-1">
                <span className="font-sans font-semibold text-[#1b1c1a] block">
                  Request Dispatched
                </span>
                <span className="font-sans text-[11px] text-[#6b6760]">
                  {shop.name} • {shop.distance}
                </span>
              </div>
            </div>

            <div className="ml-3 w-0.5 h-3 bg-[#c0c1ff]"></div>

            <div className="flex items-center gap-3">
              <div className="w-6 h-6 rounded-full bg-amber-500 text-white flex items-center justify-center text-[11px] font-bold shrink-0 animate-pulse">
                •
              </div>
              <div className="flex-1">
                <span className="font-sans font-semibold text-[#1b1c1a] block">
                  Shopkeeper Acceptance
                </span>
                <span className="font-sans text-[11px] text-amber-700 font-medium">
                  Waiting for {operatorName} to accept on the shopkeeper terminal...
                </span>
              </div>
            </div>

            <div className="ml-3 w-0.5 h-3 bg-[#ece8e1]"></div>

            <div className="flex items-center gap-3 opacity-60">
              <div className="w-6 h-6 rounded-full bg-[#efeeea] text-[#767588] flex items-center justify-center text-[11px] font-bold shrink-0">
                3
              </div>
              <div className="flex-1">
                <span className="font-sans font-semibold text-[#1b1c1a] block">
                  Chat &amp; Document Send
                </span>
                <span className="font-sans text-[11px] text-[#8a8780]">
                  Attach file, set copies &amp; receive pickup PIN
                </span>
              </div>
            </div>
          </div>

          {/* Action Row for Customer */}
          <div className="pt-2 flex flex-col gap-3">
            {/* Direct Send Document CTA Button for sender in mobile/desktop view */}
            <button
              type="button"
              id="pending-send-document-cta"
              onClick={() => {
                acceptChatRequest();
                setShowDocumentModal(true);
              }}
              className="w-full py-3.5 px-4 rounded-2xl bg-[#3d3bf3] hover:bg-[#2e2cd4] text-white font-sans text-[13px] font-bold flex items-center justify-center gap-2 shadow-sm active:scale-98 transition-all cursor-pointer"
            >
              <span className="material-symbols-outlined text-[20px]">upload_file</span>
              <span>Send Document to Print</span>
            </button>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
              <button
                type="button"
                onClick={() => {
                  declineChatRequest();
                  setCurrentScreen('home');
                  triggerToast('Print request cancelled.');
                }}
                className="px-4 py-2.5 rounded-xl bg-white hover:bg-[#ffebee] text-[#ba1a1a] font-sans text-[12px] font-medium border border-[#ffcdd2] transition-all cursor-pointer text-center"
              >
                Cancel Request
              </button>

              {/* Switch Helper to view shopkeeper screen */}
              <button
                type="button"
                onClick={() => setCurrentScreen('shopkeeper_dashboard')}
                className="px-4 py-2.5 rounded-xl bg-[#07006c] hover:bg-[#12009e] text-white font-sans text-[12px] font-medium transition-all cursor-pointer inline-flex items-center justify-center gap-1.5 shadow-xs"
              >
                <span className="material-symbols-outlined text-[16px]">storefront</span>
                <span>Open Shopkeeper Portal to Accept</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DECLINED STATE */}
      {status === 'declined' && (
        <div className="bg-white rounded-3xl p-6 border border-[#ffdad6] shadow-sm mb-4 text-center space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-[#ffdad6] text-[#ba1a1a] flex items-center justify-center mx-auto">
            <span className="material-symbols-outlined text-[24px]">do_not_disturb_on</span>
          </div>
          <h4 className="font-heading font-semibold text-[16px] text-[#ba1a1a]">
            Request Declined
          </h4>
          <p className="font-sans text-[12px] text-[#6b6760] max-w-[300px] mx-auto">
            {shop.name} is unable to take new print orders right now. Please select another nearby shop.
          </p>
          <button
            type="button"
            onClick={() => setCurrentScreen('home')}
            className="px-5 py-2 rounded-full bg-[#1b1c1a] text-white text-[12px] font-sans font-semibold hover:bg-black transition-all cursor-pointer"
          >
            Back to GPS Map
          </button>
        </div>
      )}

      {/* ACCEPTED STATE: ACTIVE CHAT TIMELINE */}
      {status === 'accepted' && (
        <>
          {/* Messages Stream Container */}
          <div className="flex-1 bg-[#f5f3ef]/80 rounded-3xl p-3 sm:p-4 border border-[#ece8e1] space-y-3 overflow-y-auto min-h-[220px] max-h-[460px] mb-2 shadow-inner">
            {messages.map((msg) => {
              // System Announcement Message
              if (msg.senderRole === 'system') {
                return (
                  <div key={msg.id} className="text-center py-2 animate-in fade-in duration-200">
                    <span className="inline-flex items-center gap-1 font-mono text-[10px] font-semibold bg-[#e1e0ff] text-[#07006c] px-3 py-1 rounded-full border border-[#c0c1ff]">
                      {msg.text}
                    </span>
                  </div>
                );
              }

              const isCustomer = msg.senderRole === 'customer';

              return (
                <div
                  key={msg.id}
                  className={`flex flex-col ${isCustomer ? 'items-end' : 'items-start'} animate-in fade-in slide-in-from-bottom-1 duration-150`}
                >
                  <div className="flex items-center gap-1.5 mb-1 px-1">
                    <span className="font-sans text-[11px] font-semibold text-[#454556]">
                      {msg.senderName}
                    </span>
                    <span className="font-mono text-[9px] text-[#767588]">{msg.timestamp}</span>
                  </div>

                  {/* Document Card Attachment Message */}
                  {msg.document ? (
                    <div className="w-full max-w-[340px] bg-white rounded-2xl p-4 border-2 border-[#3d3bf3] shadow-md space-y-3">
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-xl bg-[#e1e0ff] text-[#3d3bf3] flex items-center justify-center shrink-0">
                          <span className="material-symbols-outlined text-[22px]">
                            {msg.document.fileType === 'doc'
                              ? 'article'
                              : msg.document.fileType === 'image'
                              ? 'image'
                              : 'description'}
                          </span>
                        </div>
                        <div className="min-w-0 flex-1">
                          <h5 className="font-heading font-bold text-[13px] text-[#1b1c1a] truncate">
                            {msg.document.fileName}
                          </h5>
                          <p className="font-sans text-[11px] text-[#454556]">
                            {msg.document.fileSize} • {msg.document.pageCount} pgs • {msg.document.copies} {msg.document.copies > 1 ? 'copies' : 'copy'}
                          </p>
                        </div>
                      </div>

                      {/* Aadhaar Masking Indicator */}
                      {msg.document.isMaskedAadhaar ? (
                        <div className="bg-[#ddf5e6] text-[#0a542a] px-3 py-1.5 rounded-xl text-[10px] font-mono font-semibold flex items-center gap-1.5 border border-[#b2e5c5]">
                          <span className="material-symbols-outlined text-[14px]">verified_user</span>
                          <span>Aadhaar Masked (Name, Address, Photo &amp; Number)</span>
                        </div>
                      ) : (
                        <div className="bg-[#f5f3ef] text-[#454556] px-3 py-1 rounded-xl text-[10px] font-sans flex items-center gap-1 border border-[#ece8e1]">
                          <span className="material-symbols-outlined text-[13px]">lock</span>
                          <span>Standard Spool (Encrypted in RAM)</span>
                        </div>
                      )}

                      {/* Ephemeral Token Chip */}
                      <div className="bg-[#f5f3ef] p-2.5 rounded-xl border border-[#ece8e1] flex items-center justify-between">
                        <div>
                          <span className="font-sans text-[9px] uppercase tracking-wide text-[#767588] block">
                            PICKUP PIN
                          </span>
                          <span className="font-mono text-[16px] font-bold text-[#3d3bf3]">
                            {msg.document.token}
                          </span>
                        </div>
                        <div className="text-right">
                          <span className="font-sans text-[9px] uppercase tracking-wide text-[#767588] block">
                            EST. TOTAL
                          </span>
                          <span className="font-mono text-[14px] font-bold text-[#1b1c1a]">
                            ₹{msg.document.totalPrice}
                          </span>
                        </div>
                      </div>

                      {/* Shopkeeper vs Customer Actions */}
                      {isShopkeeperMode ? (
                        /* SHOPKEEPER ACTIONS: PREVIEW & DIRECT PRINT ONLY (NO DOWNLOAD) */
                        <div className="space-y-2 pt-1">
                          {confirmedTokens[msg.document.token] ? (
                            <div className="flex items-center justify-between p-2.5 bg-emerald-50 rounded-xl border border-emerald-200 text-emerald-800 text-[11px] font-semibold">
                              <div className="flex items-center gap-1.5">
                                <span className="material-symbols-outlined text-[16px] text-emerald-600">check_circle</span>
                                <span>Added to Print Queue • Spooled to Printer</span>
                              </div>
                              <button
                                type="button"
                                onClick={() => setConfirmModalDoc(msg.document!)}
                                className="px-2 py-0.5 bg-white border border-emerald-300 rounded text-[#3d3bf3] hover:bg-emerald-100 text-[10px] font-bold cursor-pointer"
                              >
                                Reprint
                              </button>
                            </div>
                          ) : (
                            <button
                              type="button"
                              id="chat-confirm-the-print-btn"
                              onClick={() => setConfirmModalDoc(msg.document!)}
                              className="w-full py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-[12px] font-sans font-bold transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm active:scale-98"
                            >
                              <span className="material-symbols-outlined text-[18px]">print</span>
                              <span>Confirm the Print</span>
                            </button>
                          )}

                          {/* Security Notice: Download Blocked */}
                          <div className="bg-[#fff3c4] border border-[#ffe082] rounded-xl px-2.5 py-1.5 flex items-center gap-1.5 text-[10px] text-[#5d4037] font-sans font-medium">
                            <span className="material-symbols-outlined text-[14px] text-[#e65100]">block</span>
                            <span>Direct file download is permanently disabled for customer privacy.</span>
                          </div>
                        </div>
                      ) : (
                        /* CUSTOMER ACTIONS */
                        <div className="space-y-1.5 pt-1">
                          <div className="grid grid-cols-3 gap-1.5">
                            <button
                              type="button"
                              onClick={() => setPreviewModalDoc(msg.document!)}
                              className="py-1.5 px-2 rounded-lg bg-[#e1e0ff] text-[#07006c] hover:bg-[#d1d0ff] text-[10px] font-sans font-semibold transition-all flex items-center justify-center gap-1 cursor-pointer"
                              title="Verify that your identity details are masked"
                            >
                              <span className="material-symbols-outlined text-[13px]">visibility</span>
                              <span>Preview</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => setCurrentScreen('live_tracker')}
                              className="py-1.5 px-2 rounded-lg bg-[#3d3bf3] text-white text-[10px] font-sans font-semibold hover:bg-[#2e2cd4] transition-all flex items-center justify-center gap-1 cursor-pointer shadow-2xs"
                            >
                              <span className="material-symbols-outlined text-[13px]">sensors</span>
                              <span>Tracker</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => setCurrentScreen('shop_qr')}
                              className="py-1.5 px-2 rounded-lg bg-[#f5f3ef] hover:bg-[#efeeea] text-[#1b1c1a] text-[10px] font-sans font-medium border border-[#ece8e1] transition-all flex items-center justify-center gap-1 cursor-pointer"
                            >
                              <span className="material-symbols-outlined text-[13px]">qr_code_2</span>
                              <span>Show QR</span>
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    /* Regular Text Bubble */
                    <div
                      className={`max-w-[300px] px-4 py-2.5 rounded-2xl text-[13px] font-sans leading-relaxed shadow-xs ${
                        isCustomer
                          ? 'bg-[#3d3bf3] text-white rounded-tr-none'
                          : 'bg-white text-[#1b1c1a] border border-[#ece8e1] rounded-tl-none'
                      }`}
                    >
                      {msg.text}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Action Row: Send Document CTA & Text Composer - ALWAYS VISIBLE & STICKY AT BOTTOM IN MOBILE */}
          <div className="sticky bottom-0 bg-[#fbf9f5] pt-2 pb-2 z-30 space-y-2 border-t border-[#ece8e1]/60">
            {/* Direct Send Document CTA Button for sender in mobile view */}
            {!isShopkeeperMode && (
              <button
                type="button"
                id="mobile-chat-send-document-cta"
                onClick={() => setShowDocumentModal(true)}
                className="w-full py-3 px-4 rounded-2xl bg-[#3d3bf3] hover:bg-[#2e2cd4] text-white font-sans text-[13px] font-bold flex items-center justify-between shadow-md shadow-[#3d3bf3]/20 active:scale-[0.99] transition-all cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-[19px]">upload_file</span>
                  <span>Send Document to Print</span>
                </div>
                <span className="font-sans text-[11px] bg-white/20 px-2.5 py-0.5 rounded-full font-medium">
                  ₹{shop.pricePerBw || 2}/pg
                </span>
              </button>
            )}

            {/* Chat Input Bar */}
            <form onSubmit={handleSendMessage} className="flex items-center gap-2">
              <button
                type="button"
                id="composer-attach-doc-btn"
                onClick={() => setShowDocumentModal(true)}
                className="w-11 h-11 rounded-2xl bg-white border border-[#ece8e1] flex items-center justify-center text-[#454556] hover:text-[#3d3bf3] hover:border-[#3d3bf3] transition-all cursor-pointer shrink-0"
                title="Attach Document"
              >
                <span className="material-symbols-outlined text-[20px]">attach_file</span>
              </button>

              <input
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                placeholder={`Message ${operatorName}...`}
                className="flex-1 h-11 px-4 bg-white border border-[#ece8e1] rounded-2xl font-sans text-[13px] text-[#1b1c1a] focus:outline-none focus:border-[#3d3bf3] transition-all"
              />

              <button
                type="submit"
                disabled={!inputMessage.trim()}
                className="w-11 h-11 rounded-2xl bg-[#3d3bf3] hover:bg-[#2e2cd4] disabled:bg-[#f5f3ef] disabled:text-[#767588] text-white flex items-center justify-center transition-all cursor-pointer shrink-0"
              >
                <span className="material-symbols-outlined text-[19px]">send</span>
              </button>
            </form>
          </div>
        </>
      )}

      {/* DOCUMENT SELECTION & SENDER MODAL */}
      {showDocumentModal && (
        <div className="fixed inset-0 z-[90] bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-150">
          <div className="w-full sm:max-w-[460px] bg-[#fbf9f5] rounded-t-[32px] sm:rounded-[32px] border border-[#ece8e1] shadow-2xl flex flex-col max-h-[88dvh] sm:max-h-[85vh] overflow-hidden">
            {/* Fixed Modal Header */}
            <div className="bg-white px-5 py-4 border-b border-[#ece8e1] flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-[#3d3bf3] text-white flex items-center justify-center shadow-xs">
                  <span className="material-symbols-outlined text-[18px]">lock</span>
                </div>
                <div>
                  <h4 className="font-heading font-bold text-[15px] text-[#1b1c1a]">
                    Send Document to Print
                  </h4>
                  <p className="font-sans text-[11px] text-[#6b6760]">
                    {shop.name} • {operatorName}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowDocumentModal(false)}
                className="w-8 h-8 rounded-full bg-[#f5f3ef] hover:bg-[#efeeea] flex items-center justify-center text-[#1b1c1a] cursor-pointer"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>

            {/* Scrollable Content Body */}
            <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
              {/* Hidden Device File Picker Input */}
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleDeviceFileUpload}
                className="hidden"
                accept=".pdf,.doc,.docx,.txt,.png,.jpg,.jpeg,image/*,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
              />

              {/* Document Selection: Upload from Device or Presets */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="font-sans text-[12px] font-semibold text-[#1b1c1a]">
                    Choose Document File
                  </label>
                  <span className="font-sans text-[10px] text-[#6b6760]">
                    PDF, Word, Images, TXT
                  </span>
                </div>

                {/* Upload from Device Target */}
                {uploadedFile ? (
                  <div className="p-3.5 rounded-2xl bg-[#ddf5e6]/50 border-2 border-emerald-600 shadow-xs flex items-center justify-between mb-3 animate-in fade-in duration-150">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0">
                        <span className="material-symbols-outlined text-[22px]">
                          {uploadedFile.type === 'doc'
                            ? 'article'
                            : uploadedFile.type === 'image'
                            ? 'image'
                            : 'picture_as_pdf'}
                        </span>
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <p className="font-sans text-[13px] font-bold text-[#1b1c1a] truncate">
                            {uploadedFile.name}
                          </p>
                          <span className="font-mono text-[9px] bg-emerald-600 text-white px-1.5 py-0.2 rounded-full font-bold shrink-0">
                            Device
                          </span>
                        </div>
                        <p className="font-sans text-[11px] text-[#454556]">
                          {uploadedFile.size} • {uploadedFile.pages} pages estimated
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="px-2.5 py-1 text-[11px] font-semibold text-[#3d3bf3] hover:bg-white rounded-lg transition-all cursor-pointer shrink-0 border border-emerald-200"
                    >
                      Replace
                    </button>
                  </div>
                ) : (
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full bg-white rounded-2xl p-4 border-2 border-dashed border-[#c0c1ff] hover:border-[#3d3bf3] flex items-center gap-3 cursor-pointer transition-all hover:bg-[#fbf9f5] group mb-3 shadow-2xs"
                  >
                    <div className="w-10 h-10 rounded-xl bg-[#e1e0ff] text-[#3d3bf3] flex items-center justify-center group-hover:scale-105 transition-transform shrink-0">
                      <span className="material-symbols-outlined text-[22px]">cloud_upload</span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-sans text-[13px] font-bold text-[#1b1c1a] group-hover:text-[#3d3bf3] transition-colors leading-tight">
                        Upload from Device
                      </p>
                      <p className="font-sans text-[11px] text-[#6b6760] mt-0.5">
                        Select any PDF, Word (.docx), Image, or TXT
                      </p>
                    </div>
                    <span className="px-3 py-1.5 rounded-full bg-[#3d3bf3] text-white font-sans text-[11px] font-semibold shrink-0 group-hover:bg-[#2e2cd4] transition-all">
                      Browse
                    </span>
                  </div>
                )}

                {/* Preset Sample Documents Divider */}
                <div className="flex items-center gap-2 py-1 mb-2">
                  <div className="h-[1px] bg-[#ece8e1] flex-1"></div>
                  <span className="font-sans text-[10px] uppercase font-semibold text-[#767588] tracking-wider">
                    Or select a preset test file
                  </span>
                  <div className="h-[1px] bg-[#ece8e1] flex-1"></div>
                </div>

                <div className="space-y-2">
                  {[
                    {
                      name: `e-Aadhaar_Card_${customerName.split(' ')[0]}.pdf`,
                      size: '1.4 MB',
                      pages: 2,
                      isAadhaar: true,
                      type: 'pdf',
                    },
                    {
                      name: 'College_Project_Final_Submission.pdf',
                      size: '3.8 MB',
                      pages: 12,
                      isAadhaar: false,
                      type: 'pdf',
                    },
                    {
                      name: 'Rental_Agreement_Indiranagar.pdf',
                      size: '2.1 MB',
                      pages: 5,
                      isAadhaar: false,
                      type: 'pdf',
                    },
                  ].map((doc) => (
                    <div
                      key={doc.name}
                      onClick={() => {
                        setSelectedFileName(doc.name);
                        setFileSize(doc.size);
                        setPageCount(doc.pages);
                        setIsMaskedAadhaar(doc.isAadhaar);
                        setFileType(doc.type);
                        setPreviewDataUrl(undefined);
                        setUploadedFile(null);
                      }}
                      className={`p-3 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
                        selectedFileName === doc.name
                          ? 'bg-[#e1e0ff]/50 border-[#3d3bf3] shadow-xs'
                          : 'bg-white border-[#ece8e1] hover:bg-[#f5f3ef]'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span className="material-symbols-outlined text-[20px] text-[#3d3bf3]">
                          {doc.isAadhaar ? 'badge' : 'description'}
                        </span>
                        <div className="min-w-0">
                          <p className="font-sans text-[12px] font-semibold text-[#1b1c1a] truncate">
                            {doc.name}
                          </p>
                          <p className="font-sans text-[10px] text-[#767588]">
                            {doc.size} • {doc.pages} pages {doc.isAadhaar ? '• Aadhaar ID' : ''}
                          </p>
                        </div>
                      </div>
                      {selectedFileName === doc.name && (
                        <span className="material-symbols-outlined text-[18px] text-[#3d3bf3]">
                          check_circle
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Print Options: Copies & Color Mode */}
              <div className="grid grid-cols-2 gap-3">
                {/* Copies */}
                <div>
                  <label className="block font-sans text-[11px] font-semibold text-[#1b1c1a] mb-1">
                    Copies
                  </label>
                  <div className="flex items-center bg-white border border-[#ece8e1] rounded-2xl p-1 justify-between">
                    <button
                      type="button"
                      onClick={() => setCopies((c) => Math.max(1, c - 1))}
                      className="w-8 h-8 rounded-xl bg-[#f5f3ef] hover:bg-[#efeeea] font-bold text-[14px] flex items-center justify-center cursor-pointer"
                    >
                      -
                    </button>
                    <span className="font-mono text-[14px] font-bold text-[#1b1c1a]">
                      {copies}
                    </span>
                    <button
                      type="button"
                      onClick={() => setCopies((c) => c + 1)}
                      className="w-8 h-8 rounded-xl bg-[#f5f3ef] hover:bg-[#efeeea] font-bold text-[14px] flex items-center justify-center cursor-pointer"
                    >
                      +
                    </button>
                  </div>
                </div>

                {/* Color Mode */}
                <div>
                  <label className="block font-sans text-[11px] font-semibold text-[#1b1c1a] mb-1">
                    Color Mode
                  </label>
                  <div className="grid grid-cols-2 bg-white border border-[#ece8e1] rounded-2xl p-1 gap-1">
                    <button
                      type="button"
                      onClick={() => setColorMode('bw')}
                      className={`py-1.5 text-[11px] font-sans font-semibold rounded-xl transition-all cursor-pointer ${
                        colorMode === 'bw'
                          ? 'bg-[#3d3bf3] text-white shadow-2xs'
                          : 'text-[#454556]'
                      }`}
                    >
                      B&amp;W
                    </button>
                    <button
                      type="button"
                      onClick={() => setColorMode('color')}
                      className={`py-1.5 text-[11px] font-sans font-semibold rounded-xl transition-all cursor-pointer ${
                        colorMode === 'color'
                          ? 'bg-[#3d3bf3] text-white shadow-2xs'
                          : 'text-[#454556]'
                      }`}
                    >
                      Color
                    </button>
                  </div>
                </div>
              </div>

              {/* Enhanced Aadhaar & ID Auto-Masking Toggle */}
              <div className="p-3.5 rounded-2xl bg-white border border-[#ece8e1] space-y-2">
                <div className="flex items-center justify-between">
                  <div className="pr-2">
                    <span className="font-sans text-[13px] font-bold text-[#1b1c1a] block">
                      Aadhaar &amp; ID Auto-Masking
                    </span>
                    <span className="font-sans text-[11px] text-[#6b6760]">
                      Masks address, full name, photo, and first 8 Aadhaar digits
                    </span>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer shrink-0">
                    <input
                      type="checkbox"
                      checked={isMaskedAadhaar}
                      onChange={(e) => setIsMaskedAadhaar(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-[#eae8e4] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#3d3bf3]"></div>
                  </label>
                </div>

                {isMaskedAadhaar && (
                  <div className="pt-2 border-t border-[#f5f3ef] flex flex-wrap gap-1.5 animate-in fade-in duration-150">
                    <span className="font-mono text-[9.5px] bg-[#ddf5e6] text-[#0a542a] px-2 py-0.5 rounded-md font-semibold">
                      👤 Name Masked
                    </span>
                    <span className="font-mono text-[9.5px] bg-[#ddf5e6] text-[#0a542a] px-2 py-0.5 rounded-md font-semibold">
                      📍 Address Redacted
                    </span>
                    <span className="font-mono text-[9.5px] bg-[#ddf5e6] text-[#0a542a] px-2 py-0.5 rounded-md font-semibold">
                      🖼️ Photo Obscured
                    </span>
                    <span className="font-mono text-[9.5px] bg-[#ddf5e6] text-[#0a542a] px-2 py-0.5 rounded-md font-semibold">
                      🔢 XXXX-XXXX-4892
                    </span>
                  </div>
                )}
              </div>

              {/* Note to Shopkeeper */}
              <div>
                <label className="block font-sans text-[11px] font-semibold text-[#1b1c1a] mb-1">
                  Instruction for {operatorName}
                </label>
                <input
                  type="text"
                  value={printNote}
                  onChange={(e) => setPrintNote(e.target.value)}
                  placeholder="e.g. Duplex back-to-back, staple top left"
                  className="w-full h-10 px-3 bg-white border border-[#ece8e1] rounded-xl font-sans text-[12px] text-[#1b1c1a] focus:outline-none focus:border-[#3d3bf3]"
                />
              </div>
            </div>

            {/* Sticky / Fixed Modal Footer: ALWAYS 100% VISIBLE in Mobile View */}
            <div className="bg-white px-5 pt-3 pb-8 sm:pb-4 pb-safe border-t border-[#ece8e1] shadow-[0_-6px_20px_rgba(0,0,0,0.06)] shrink-0 space-y-2.5 z-20">
              <div className="flex items-center justify-between text-[12px] px-1">
                <span className="font-sans font-medium text-[#454556]">Estimated Total Fee</span>
                <span className="font-mono font-bold text-[17px] text-[#3d3bf3]">
                  ₹{((colorMode === 'bw' ? (shop.pricePerBw || 2) : (shop.pricePerColor || 5)) * pageCount * copies).toFixed(2)}
                </span>
              </div>

              {/* Send Document CTA - ALWAYS VISIBLE */}
              <button
                type="button"
                id="modal-send-document-btn"
                onClick={handleSendDocument}
                className="w-full h-12 rounded-xl bg-[#3d3bf3] hover:bg-[#2e2cd4] text-white font-sans text-[14px] font-bold flex items-center justify-center gap-2 shadow-md shadow-[#3d3bf3]/25 active:scale-98 transition-all cursor-pointer"
              >
                <span className="material-symbols-outlined text-[20px]">send</span>
                <span>Send Document</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SECURE IN-MEMORY DOCUMENT PREVIEW MODAL (DOWNLOAD STRICTLY DISABLED)       */}
      {/* ========================================================================= */}
      <SecureDocumentPreviewModal
        doc={previewModalDoc}
        onClose={() => setPreviewModalDoc(null)}
        onPrint={handleDirectPrint}
        shopName={shop.name}
        triggerToast={triggerToast}
      />

      {/* CONFIRM THE PRINT MODAL */}
      <ConfirmPrintModal
        isOpen={!!confirmModalDoc}
        doc={confirmModalDoc}
        customerName={customerName}
        printerModel={shop.printerModel || 'Canon Laser Printer'}
        onConfirm={handleConfirmAndAddPrint}
        onCancel={() => setConfirmModalDoc(null)}
      />
    </div>
  );
};
