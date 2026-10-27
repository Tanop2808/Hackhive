'use client';

import React, { useState } from 'react';
import { usePrintVault } from '@/context/PrintVaultContext';
import { ChatDocumentAttachment } from '@/types/printvault';
import { SecureDocumentPreviewModal } from '@/components/common/SecureDocumentPreviewModal';
import { ConfirmPrintModal } from '@/components/common/ConfirmPrintModal';

export const ShopkeeperDashboardScreen: React.FC = () => {
  const {
    currentShopkeeper,
    shopkeeperSignOut,
    activeChatSession,
    acceptChatRequest,
    declineChatRequest,
    sendDocumentInChat,
    sendChatMessage,
    activeJob,
    setCurrentScreen,
    setAppRole,
    triggerToast,
    initiateChatWithShop,
  } = usePrintVault();

  const [previewDoc, setPreviewDoc] = useState<ChatDocumentAttachment | null>(null);
  const [confirmModalDoc, setConfirmModalDoc] = useState<ChatDocumentAttachment | null>(null);
  const [confirmedTokens, setConfirmedTokens] = useState<Record<string, boolean>>({});

  const shopName = currentShopkeeper?.shopName || 'QuickPrint Corner & Xerox';
  const operatorName = currentShopkeeper?.operatorName || 'Mohan Kumar';
  const printerModel = currentShopkeeper?.printerModel || 'Canon imageRUNNER ADVANCE C5560i';

  // Check if there is an active session for this shop
  const hasPendingRequest = activeChatSession && activeChatSession.status === 'pending';
  const hasAcceptedChat = activeChatSession && activeChatSession.status === 'accepted';

  // Collect all documents received from customer chat messages
  const chatDocuments = (activeChatSession?.messages || [])
    .filter((m) => !!m.document)
    .map((m) => ({
      document: m.document!,
      customerName: m.senderRole === 'customer' ? m.senderName : (activeChatSession?.customer.name || 'Customer'),
      timestamp: m.timestamp,
      instruction: m.document?.note,
    }));

  // If activeJob exists and isn't already in chatDocuments, make it available
  const activeJobDoc: ChatDocumentAttachment | null = activeJob
    ? {
        fileName: activeJob.fileName,
        fileSize: activeJob.fileSize,
        pageCount: activeJob.pageCount,
        copies: activeJob.copies,
        colorMode: activeJob.colorMode,
        isMaskedAadhaar: activeJob.isMaskedAadhaar ?? true,
        token: activeJob.token,
        jobId: activeJob.id,
        totalPrice: activeJob.totalPrice,
        sentAt: activeJob.createdAt,
        expiresInSeconds: activeJob.expiresInSeconds,
        fileType: activeJob.fileName.endsWith('.pdf') ? 'pdf' : 'doc',
        maskedDetails: {
          name: 'Tanishq Mudaliyar',
          aadhaarNumber: 'XXXX-XXXX-4892',
          address: 'Section 29(4) Aadhaar Act Masked Residential Details',
          photoMasked: true,
          qrMasked: true,
        },
      }
    : null;

  const allReceivedDocs = [
    ...chatDocuments,
    ...(activeJobDoc && !chatDocuments.some((c) => c.document.token === activeJobDoc.token)
      ? [{
          document: activeJobDoc,
          customerName: 'Tanishq Mudaliyar',
          timestamp: activeJobDoc.sentAt,
          instruction: 'PrintVault Spool via PIN verification',
        }]
      : []),
  ];

  const handleDirectPrint = (doc: ChatDocumentAttachment) => {
    setPreviewDoc(null);
    setConfirmModalDoc(doc);
  };

  const handleConfirmAndAddPrint = () => {
    if (!confirmModalDoc) return;
    const doc = confirmModalDoc;
    setConfirmedTokens((prev) => ({ ...prev, [doc.token]: true }));
    setConfirmModalDoc(null);
    triggerToast(`Added "${doc.fileName}" to print queue! Spooled to ${printerModel}...`);
    sendChatMessage(`Document "${doc.fileName}" confirmed and added to the printer queue. Printing now!`);
  };

  const simulateIncomingRequest = () => {
    // If no active session, initiate one from Tanishq Mudaliyar
    if (!activeChatSession) {
      initiateChatWithShop({
        id: currentShopkeeper?.shopId || 'shop-1',
        name: shopName,
        distance: '120m away',
        location: currentShopkeeper?.location || 'MG Road, Bengaluru',
        rating: 4.9,
        jobsCount: '340+ jobs today',
        statusBadge: 'Ready to pick',
        image: 'https://images.unsplash.com/photo-1563986768609-322da13575f3?auto=format&fit=crop&w=300&q=80',
        lat: 12.9723,
        lng: 77.5952,
        operatorName,
        pricePerBw: 2.0,
        pricePerColor: 5.0,
        printerModel,
        isOnline: true,
      });
      triggerToast('Simulated new incoming request from customer Tanishq Mudaliyar!');
    } else {
      triggerToast('A request or chat session is already active!');
    }
  };

  const simulateIncomingDocument = () => {
    if (!activeChatSession) {
      initiateChatWithShop({
        id: currentShopkeeper?.shopId || 'shop-1',
        name: shopName,
        distance: '120m away',
        location: currentShopkeeper?.location || 'MG Road, Bengaluru',
        rating: 4.9,
        jobsCount: '340+ jobs today',
        statusBadge: 'Ready to pick',
        image: 'https://images.unsplash.com/photo-1563986768609-322da13575f3?auto=format&fit=crop&w=300&q=80',
        lat: 12.9723,
        lng: 77.5952,
        operatorName,
        pricePerBw: 2.0,
        pricePerColor: 5.0,
        printerModel,
        isOnline: true,
      });
      acceptChatRequest();
    } else if (activeChatSession.status === 'pending') {
      acceptChatRequest();
    }

    setTimeout(() => {
      sendDocumentInChat({
        fileName: 'e-Aadhaar_Card_Tanishq.pdf',
        fileSize: '1.4 MB',
        pageCount: 2,
        copies: 2,
        colorMode: 'bw',
        isMaskedAadhaar: true,
        note: 'Please print duplex back-to-back, staple top left',
        fileType: 'pdf',
        maskedDetails: {
          name: 'Tanishq Mudaliyar',
          aadhaarNumber: 'XXXX-XXXX-4892',
          address: 'Section 29(4) Aadhaar Act Masked Residential Details',
          photoMasked: true,
          qrMasked: true,
        },
      });
      triggerToast('Document received in print queue: e-Aadhaar_Card_Tanishq.pdf');
    }, 150);
  };

  return (
    <div className="flex flex-col w-full pb-8 pt-1">
      {/* Top Operator Terminal Banner */}
      <div className="bg-[#07006c] text-white rounded-3xl p-5 shadow-md mb-5 border border-[#1b1c7d]">
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center text-white border border-white/20">
              <span className="material-symbols-outlined text-[26px]">storefront</span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-heading font-bold text-[18px] tracking-tight leading-tight">
                  {shopName}
                </h2>
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
              </div>
              <p className="font-sans text-[12px] text-white/80 mt-0.5">
                Operator: <strong className="text-white">{operatorName}</strong>
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={shopkeeperSignOut}
            className="px-3 py-1.5 rounded-full bg-white/15 hover:bg-white/25 text-white font-sans text-[11px] font-semibold border border-white/20 transition-all cursor-pointer"
          >
            Sign Out
          </button>
        </div>

        {/* Hardware Status Strip */}
        <div className="p-3 bg-white/10 rounded-2xl border border-white/10 flex items-center justify-between text-[11px]">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[17px] text-emerald-400">print</span>
            <span className="font-sans font-medium">{printerModel}</span>
          </div>
          <span className="font-sans text-emerald-300 font-semibold bg-emerald-950/40 px-2 py-0.5 rounded">
            Printer Ready
          </span>
        </div>

        {/* Real-time stats */}
        <div className="grid grid-cols-3 gap-2 mt-3 pt-3 border-t border-white/15 text-center">
          <div>
            <span className="font-sans text-[10px] text-white/70 block uppercase tracking-wider">
              Jobs Today
            </span>
            <span className="font-mono text-[19px] font-bold text-white">42</span>
          </div>
          <div>
            <span className="font-sans text-[10px] text-white/70 block uppercase tracking-wider">
              Ready in RAM
            </span>
            <span className="font-mono text-[19px] font-bold text-amber-300">
              {allReceivedDocs.length}
            </span>
          </div>
          <div>
            <span className="font-sans text-[10px] text-white/70 block uppercase tracking-wide">
              Revenue
            </span>
            <span className="font-mono text-[19px] font-bold text-emerald-300">₹1,280</span>
          </div>
        </div>
      </div>

      {/* SECTION 1: INCOMING PRINT REQUESTS QUEUE */}
      <section className="mb-6 space-y-3">
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-2">
            <h3 className="font-heading font-bold text-[17px] text-[#1b1c1a] tracking-tight">
              Incoming Customer Requests
            </h3>
            {hasPendingRequest && (
              <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping"></span>
            )}
          </div>
          <span className="font-mono text-[11px] font-semibold bg-[#ffe8d6] text-[#8a3800] px-2.5 py-0.5 rounded-full">
            {hasPendingRequest ? '1 Pending' : '0 Pending'}
          </span>
        </div>

        {hasPendingRequest ? (
          /* Active Incoming Request from Customer (e.g. Tanishq Mudaliyar) */
          <div className="p-5 rounded-3xl bg-white border-2 border-amber-400 shadow-md space-y-4 animate-in fade-in duration-200">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-[#e1e0ff] text-[#3d3bf3] flex items-center justify-center font-bold text-[18px]">
                  {activeChatSession.customer.name.charAt(0)}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="font-heading font-bold text-[16px] text-[#1b1c1a]">
                      {activeChatSession.customer.name}
                    </h4>
                    <span className="font-mono text-[10px] bg-[#e1e0ff] text-[#07006c] px-2 py-0.2 rounded-full font-semibold">
                      New Customer
                    </span>
                  </div>
                  <p className="font-sans text-[12px] text-[#454556] mt-0.5">
                    {activeChatSession.customer.email} • 120m away • Just now
                  </p>
                </div>
              </div>

              <span className="font-mono text-[11px] text-amber-700 bg-[#fff3c4] px-2.5 py-1 rounded-full font-bold">
                Awaiting Response
              </span>
            </div>

            <div className="p-3 bg-[#fbf9f5] rounded-2xl border border-[#ece8e1] flex items-center justify-between text-[12px]">
              <div className="flex items-center gap-2 text-[#454556]">
                <span className="material-symbols-outlined text-[17px] text-[#3d3bf3]">
                  near_me
                </span>
                <span>Customer waiting for print</span>
              </div>
              <span className="font-sans text-[11px] text-[#6b6760]">120m away</span>
            </div>

            {/* Accept / Decline Action Buttons */}
            <div className="grid grid-cols-2 gap-3 pt-1">
              <button
                type="button"
                onClick={() => {
                  acceptChatRequest();
                  setCurrentScreen('chat');
                  triggerToast(`Accepted request from ${activeChatSession.customer.name}!`);
                }}
                className="w-full py-3 px-4 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-sans text-[14px] font-semibold flex items-center justify-center gap-2 shadow-md shadow-emerald-600/25 active:scale-98 transition-all cursor-pointer"
              >
                <span className="material-symbols-outlined text-[20px]">check_circle</span>
                <span>Accept &amp; Open Chat</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  declineChatRequest();
                  triggerToast('Declined customer connection request.');
                }}
                className="w-full py-3 px-4 rounded-2xl bg-white hover:bg-[#ffebee] text-[#ba1a1a] font-sans text-[14px] font-semibold border border-[#ffcdd2] flex items-center justify-center gap-2 active:scale-98 transition-all cursor-pointer"
              >
                <span className="material-symbols-outlined text-[20px]">cancel</span>
                <span>Decline</span>
              </button>
            </div>
          </div>
        ) : (
          /* Empty Queue State with Simulation Trigger */
          <div className="p-6 rounded-3xl bg-white border border-[#ece8e1] shadow-xs text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-[#f5f3ef] text-[#767588] flex items-center justify-center mx-auto">
              <span className="material-symbols-outlined text-[24px]">inbox</span>
            </div>
            <h4 className="font-heading font-semibold text-[15px] text-[#1b1c1a]">
              No Incoming Requests Right Now
            </h4>
            <p className="font-sans text-[12px] text-[#6b6760] max-w-[300px] mx-auto">
              Your shop is visible to nearby customers. New print requests will appear here instantly.
            </p>

            <button
              type="button"
              onClick={simulateIncomingRequest}
              className="mt-2 px-4 py-2 rounded-full bg-[#e1e0ff] hover:bg-[#d4d2ff] text-[#07006c] font-sans text-[12px] font-medium transition-all inline-flex items-center gap-1.5 cursor-pointer"
            >
              <span className="material-symbols-outlined text-[16px]">bolt</span>
              <span>Simulate Customer Request (Tanishq)</span>
            </button>
          </div>
        )}
      </section>

      {/* SECTION 2: RECEIVED PRINT DOCUMENTS & LIVE SPOOL QUEUE */}
      <section className="mb-6 space-y-3">
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-2">
            <h3 className="font-heading font-bold text-[17px] text-[#1b1c1a] tracking-tight">
              Received Documents to Print
            </h3>
            {allReceivedDocs.length > 0 && (
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
            )}
          </div>
          <span className="font-mono text-[11px] font-semibold bg-[#ddf5e6] text-[#0a542a] px-2.5 py-0.5 rounded-full border border-[#b2e5c5]">
            {allReceivedDocs.length} {allReceivedDocs.length === 1 ? 'Doc Ready' : 'Docs Ready'}
          </span>
        </div>

        {allReceivedDocs.length > 0 ? (
          <div className="space-y-3">
            {allReceivedDocs.map((item, index) => {
              const doc = item.document;
              const isAadhaar =
                doc.isMaskedAadhaar ||
                doc.fileName.toLowerCase().includes('aadhaar') ||
                doc.fileName.toLowerCase().includes('aadhar');

              return (
                <div
                  key={`${doc.token}-${index}`}
                  className="p-5 rounded-3xl bg-white border-2 border-[#3d3bf3]/30 shadow-md space-y-4 hover:border-[#3d3bf3] transition-all animate-in fade-in duration-200"
                >
                  {/* Top Row: File icon, Title, Token, Status */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3 min-w-0">
                      <div className="w-12 h-12 rounded-2xl bg-[#e1e0ff] text-[#3d3bf3] flex items-center justify-center shrink-0 shadow-xs">
                        <span className="material-symbols-outlined text-[24px]">
                          {doc.fileType === 'doc'
                            ? 'article'
                            : doc.fileType === 'image'
                            ? 'image'
                            : 'picture_as_pdf'}
                        </span>
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <h4 className="font-heading font-bold text-[15px] text-[#1b1c1a] truncate">
                            {doc.fileName}
                          </h4>
                          <span className="font-mono text-[9px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full font-bold uppercase shrink-0">
                            RAM SPOOL
                          </span>
                        </div>
                        <p className="font-sans text-[12px] text-[#454556] mt-0.5">
                          From <strong className="text-[#1b1c1a]">{item.customerName}</strong> • {item.timestamp}
                        </p>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="font-sans text-[9px] uppercase tracking-wide text-[#767588] block">
                        PICKUP PIN
                      </span>
                      <span className="font-mono text-[16px] font-bold text-[#3d3bf3]">
                        {doc.token}
                      </span>
                    </div>
                  </div>

                  {/* Print Specs & Fee */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px] font-sans">
                    <div className="p-2.5 bg-[#fbf9f5] rounded-xl border border-[#ece8e1]">
                      <span className="text-[#767588] block text-[10px]">PAGES &amp; COPIES</span>
                      <span className="font-semibold text-[#1b1c1a] mt-0.5 block">
                        {doc.pageCount} pgs • {doc.copies} {doc.copies > 1 ? 'copies' : 'copy'}
                      </span>
                    </div>
                    <div className="p-2.5 bg-[#fbf9f5] rounded-xl border border-[#ece8e1]">
                      <span className="text-[#767588] block text-[10px]">COLOR MODE</span>
                      <span className="font-semibold text-[#1b1c1a] mt-0.5 block">
                        {doc.colorMode === 'bw' ? 'Black & White' : 'Color'}
                      </span>
                    </div>
                    <div className="p-2.5 bg-[#fbf9f5] rounded-xl border border-[#ece8e1]">
                      <span className="text-[#767588] block text-[10px]">TOTAL FEE</span>
                      <span className="font-mono font-bold text-[#0a542a] mt-0.5 block">
                        ₹{doc.totalPrice.toFixed(2)}
                      </span>
                    </div>
                    <div className="p-2.5 bg-[#fbf9f5] rounded-xl border border-[#ece8e1]">
                      <span className="text-[#767588] block text-[10px]">STORAGE STATE</span>
                      <span className="font-semibold text-[#3d3bf3] mt-0.5 block">
                        Zero Disk Write
                      </span>
                    </div>
                  </div>

                  {/* Privacy Badge: Aadhaar Masked Indicator */}
                  {isAadhaar ? (
                    <div className="bg-[#ddf5e6] text-[#0a542a] px-3.5 py-2 rounded-2xl text-[11px] font-mono font-semibold flex items-center justify-between border border-[#b2e5c5]">
                      <div className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-[16px]">verified_user</span>
                        <span>Aadhaar Masked (Photo, Name, Address &amp; Number Redacted)</span>
                      </div>
                      <span className="text-[10px] bg-white/70 px-2 py-0.5 rounded-full font-bold">
                        UIDAI Sec 29
                      </span>
                    </div>
                  ) : (
                    <div className="bg-[#f5f3ef] text-[#454556] px-3 py-1.5 rounded-2xl text-[11px] font-sans flex items-center gap-1.5 border border-[#ece8e1]">
                      <span className="material-symbols-outlined text-[15px] text-[#3d3bf3]">lock</span>
                      <span>Decoded in volatile RAM buffer • Discarded upon completion</span>
                    </div>
                  )}

                  {/* Customer Instructions / Note */}
                  {item.instruction && (
                    <div className="p-2.5 bg-[#fff8e1] rounded-xl border border-[#ffe082] text-[11px] font-sans text-[#5d4037] flex items-center gap-2">
                      <span className="material-symbols-outlined text-[16px] text-amber-700">edit_note</span>
                      <span>Customer Note: <strong>&ldquo;{item.instruction}&rdquo;</strong></span>
                    </div>
                  )}

                  {/* Shopkeeper Action Controls: Direct Confirm the Print Only */}
                  <div className="space-y-2 pt-1">
                    {confirmedTokens[doc.token] ? (
                      <div className="flex items-center justify-between p-3 bg-emerald-50 rounded-2xl border border-emerald-200 text-emerald-800 text-[12px] font-semibold">
                        <div className="flex items-center gap-2">
                          <span className="material-symbols-outlined text-[19px] text-emerald-600">check_circle</span>
                          <span>Added to Print Queue • Spooled to {printerModel.split(' ')[0]}</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => setConfirmModalDoc(doc)}
                          className="px-3 py-1 bg-white border border-emerald-300 rounded-lg text-[#3d3bf3] hover:bg-emerald-100 text-[11px] font-bold cursor-pointer"
                        >
                          Reprint
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          id={`confirm-print-${index}`}
                          onClick={() => setConfirmModalDoc(doc)}
                          className="flex-1 py-3 px-4 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-sans text-[13px] font-bold flex items-center justify-center gap-2 shadow-md shadow-emerald-600/25 active:scale-98 transition-all cursor-pointer"
                        >
                          <span className="material-symbols-outlined text-[19px]">print</span>
                          <span>Confirm Print</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => setCurrentScreen('chat')}
                          className="px-4 py-3 rounded-2xl bg-[#f5f3ef] hover:bg-[#efeeea] text-[#1b1c1a] font-sans text-[12px] font-semibold flex items-center justify-center gap-1.5 border border-[#ece8e1] active:scale-98 transition-all cursor-pointer shrink-0"
                        >
                          <span className="material-symbols-outlined text-[17px]">chat</span>
                          <span>Open Chat</span>
                        </button>
                      </div>
                    )}

                    {/* Security Notice: Download Blocked */}
                    <div className="bg-[#fff3c4] border border-[#ffe082] rounded-xl px-3 py-1.5 flex items-center gap-2 text-[10.5px] text-[#5d4037] font-sans font-medium">
                      <span className="material-symbols-outlined text-[15px] text-[#e65100]">block</span>
                      <span>Direct file download is permanently disabled for customer privacy. Print directly to hardware.</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* Empty Queue State with Simulation Option */
          <div className="p-6 rounded-3xl bg-white border border-[#ece8e1] shadow-xs text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-[#f5f3ef] text-[#767588] flex items-center justify-center mx-auto">
              <span className="material-symbols-outlined text-[24px]">description</span>
            </div>
            <h4 className="font-heading font-semibold text-[15px] text-[#1b1c1a]">
              No Documents in Print Queue
            </h4>
            <p className="font-sans text-[12px] text-[#6b6760] max-w-[320px] mx-auto leading-relaxed">
              When customers send print files in chat, they will arrive here instantly in RAM for masked preview and direct hardware printing.
            </p>

            <button
              type="button"
              onClick={simulateIncomingDocument}
              className="mt-1 px-4 py-2.5 rounded-full bg-[#3d3bf3] hover:bg-[#2e2cd4] text-white font-sans text-[12px] font-semibold transition-all inline-flex items-center gap-2 shadow-xs cursor-pointer"
            >
              <span className="material-symbols-outlined text-[16px]">upload_file</span>
              <span>Simulate Customer Sending e-Aadhaar</span>
            </button>
          </div>
        )}
      </section>

      {/* SECTION 3: ACTIVE CUSTOMER CHAT SESSIONS */}
      <section className="mb-6 space-y-3">
        <div className="flex items-center justify-between px-1">
          <h3 className="font-heading font-bold text-[17px] text-[#1b1c1a] tracking-tight">
            Active Customer Chat Sessions
          </h3>
          <span className="font-mono text-[11px] text-[#07006c] font-semibold bg-[#e1e0ff] px-2.5 py-0.5 rounded-full">
            {hasAcceptedChat ? '1 Active' : '0 Active'}
          </span>
        </div>

        {hasAcceptedChat ? (
          <div
            onClick={() => setCurrentScreen('chat')}
            className="p-4 rounded-3xl bg-white border border-[#ece8e1] hover:border-[#3d3bf3] shadow-xs flex items-center justify-between gap-3 transition-all cursor-pointer group"
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-11 h-11 rounded-2xl bg-[#ddf5e6] text-[#0a542a] flex items-center justify-center font-bold text-[16px] shrink-0">
                {activeChatSession.customer.name.charAt(0)}
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h4 className="font-heading font-bold text-[14px] text-[#1b1c1a] truncate group-hover:text-[#3d3bf3] transition-colors">
                    {activeChatSession.customer.name}
                  </h4>
                  <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                </div>
                <p className="font-sans text-[11px] text-[#454556] truncate mt-0.5">
                  {activeChatSession.messages[activeChatSession.messages.length - 1]?.text ||
                    'Ready to receive documents'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              <span className="px-3 py-1.5 rounded-xl bg-[#3d3bf3] text-white text-[12px] font-sans font-semibold group-hover:bg-[#2e2cd4] transition-all flex items-center gap-1">
                <span className="material-symbols-outlined text-[15px]">chat</span>
                <span>Open Chat</span>
              </span>
            </div>
          </div>
        ) : (
          <div className="p-4 rounded-2xl bg-[#f5f3ef] border border-[#ece8e1] text-center text-[#767588] text-[12px]">
            Accepted requests establish a direct ephemeral chat where customer documents are received and printed.
          </div>
        )}
      </section>

      {/* Switch to Customer Portal Mode */}
      <div className="pt-2 text-center">
        <button
          type="button"
          onClick={() => {
            setAppRole('customer');
            setCurrentScreen('home');
          }}
          className="text-[#454556] hover:text-[#3d3bf3] font-sans text-[13px] font-medium inline-flex items-center gap-1.5 transition-colors cursor-pointer"
        >
          <span className="material-symbols-outlined text-[18px]">swap_horiz</span>
          <span>Switch back to Customer Portal</span>
        </button>
      </div>

      {/* Secure In-Memory Document Preview Modal */}
      <SecureDocumentPreviewModal
        doc={previewDoc}
        onClose={() => setPreviewDoc(null)}
        onPrint={handleDirectPrint}
        shopName={shopName}
        triggerToast={triggerToast}
      />

      {/* Confirm Print Confirmation Modal */}
      <ConfirmPrintModal
        isOpen={!!confirmModalDoc}
        doc={confirmModalDoc}
        customerName={
          allReceivedDocs.find((d) => d.document.token === confirmModalDoc?.token)?.customerName || 'Customer'
        }
        printerModel={printerModel}
        onConfirm={handleConfirmAndAddPrint}
        onCancel={() => setConfirmModalDoc(null)}
      />
    </div>
  );
};
