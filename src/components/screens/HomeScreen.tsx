'use client';

import React from 'react';
import { usePrintVault } from '@/context/PrintVaultContext';
import { NearbyXeroxMap } from '@/components/common/NearbyXeroxMap';
import { mockShops } from '@/data/mockData';

export const HomeScreen: React.FC = () => {
  const {
    activeJob,
    setCurrentScreen,
    countdown,
    formatCountdown,
    currentUser,
    userLocation,
    isFetchingLocation,
    fetchUserLocation,
    initiateChatWithShop,
  } = usePrintVault();

  const customerName = currentUser?.name || 'Tanishq Mudaliyar';
  const customerFirstName = customerName.split(' ')[0];

  return (
    <div className="flex flex-col w-full pb-8">
      {/* Greeting Banner */}
      <div className="pt-2 pb-4 flex flex-col gap-1">
        <div className="flex items-center justify-between">
          <h1 className="font-heading font-bold text-[26px] text-[#1b1c1a] tracking-tight leading-tight">
            Good morning, {customerFirstName}
          </h1>
          <span className="font-mono text-[10px] bg-[#e1e0ff] text-[#07006c] px-2.5 py-1 rounded-full font-semibold">
            {currentUser?.vaultTier || 'Hardware Enclave'}
          </span>
        </div>
        <p className="font-sans text-[13px] text-[#454556]">
          Zero-store document printing and live Xerox operator network
        </p>
      </div>

      {/* ACTIVE PRINT JOB BANNER (If one is printing or active) */}
      {activeJob && (
        <section className="w-full relative overflow-hidden rounded-[24px] bg-[#e1e0ff] p-5 shadow-sm text-[#07006c] mb-6 border border-[#c0c1ff]/60 transition-all hover:shadow-md">
          {/* Header pill status */}
          <div className="flex items-center justify-between gap-2 mb-3">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/80 text-[#3d3bf3] shadow-xs">
              <span className="w-2 h-2 rounded-full bg-[#3d3bf3] animate-pulse"></span>
              <span className="font-mono text-[11px] font-semibold tracking-wide">
                1 active print job
              </span>
            </div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/90 text-[#454556] font-mono text-[11px] shadow-xs">
              <span className="material-symbols-outlined text-[15px] text-[#3d3bf3]">
                timer
              </span>
              <span className="font-semibold text-[#1b1c1a]">
                {formatCountdown(countdown)} left
              </span>
            </div>
          </div>

          {/* Document File details */}
          <div className="flex items-start gap-3.5 mb-4">
            <div className="w-11 h-11 rounded-2xl bg-white flex items-center justify-center text-[#3d3bf3] shadow-xs shrink-0">
              <span className="material-symbols-outlined text-[24px]">description</span>
            </div>
            <div className="flex flex-col min-w-0 pr-1">
              <span className="font-heading font-semibold text-[16px] text-[#07006c] truncate">
                {activeJob.fileName}
              </span>
              <div className="flex items-center gap-1.5 text-[#454556] mt-0.5">
                <span className="material-symbols-outlined text-[15px] shrink-0 text-[#3d3bf3]">
                  storefront
                </span>
                <span className="font-sans text-[12px] truncate">
                  {activeJob.shop.name}
                </span>
              </div>
            </div>
          </div>

          {/* Token & Pin Container */}
          <div className="bg-white/75 backdrop-blur-xs rounded-2xl p-3 mb-3 flex items-center justify-between border border-white/50">
            <div className="flex flex-col">
              <span className="font-sans text-[10px] text-[#454556] uppercase tracking-wider font-medium">
                Ephemeral Token
              </span>
              <span className="font-mono text-[18px] text-[#3d3bf3] tracking-wider font-bold">
                {activeJob.token}
              </span>
            </div>
            <div className="h-7 w-px bg-[#c6c4d9]/50"></div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentScreen('shop_qr')}
                className="px-3 py-1.5 rounded-xl bg-white text-[#1b1c1a] font-sans text-[12px] font-medium shadow-xs hover:bg-[#fbf9f5] cursor-pointer"
                type="button"
              >
                QR Code
              </button>
              <button
                onClick={() => setCurrentScreen('live_tracker')}
                className="px-3 py-1.5 rounded-xl bg-[#3d3bf3] text-white font-sans text-[12px] font-semibold shadow-xs hover:bg-[#2e2cd4] cursor-pointer"
                type="button"
              >
                Tracker
              </button>
            </div>
          </div>
        </section>
      )}

      {/* STEP 1: FETCH LOCATION & MAP SECTION */}
      {!userLocation ? (
        /* Prompt to Fetch Location */
        <section className="w-full rounded-[28px] bg-gradient-to-br from-white to-[#f5f3ef] p-6 shadow-sm border border-[#ece8e1] mb-6 text-center space-y-4">
          <div className="w-16 h-16 rounded-3xl bg-[#e1e0ff] text-[#3d3bf3] flex items-center justify-center mx-auto shadow-md shadow-[#3d3bf3]/15">
            <span className="material-symbols-outlined text-[32px] animate-pulse">
              location_searching
            </span>
          </div>

          <div className="max-w-[320px] mx-auto space-y-1">
            <span className="font-mono text-[11px] text-[#3d3bf3] font-bold uppercase tracking-wider">
              Step 1: Nearby Xerox Scanner
            </span>
            <h3 className="font-heading font-bold text-[19px] text-[#1b1c1a]">
              Find Nearby Xerox Stores
            </h3>
            <p className="font-sans text-[13px] text-[#454556] leading-relaxed">
              Detect your current GPS location to discover certified Xerox hubs within 1 km, inspect live queues, and start a direct print chat.
            </p>
          </div>

          <button
            type="button"
            onClick={fetchUserLocation}
            disabled={isFetchingLocation}
            className="w-full h-[52px] rounded-full bg-[#3d3bf3] hover:bg-[#2e2cd4] text-white font-sans text-[15px] font-semibold flex items-center justify-center gap-2 shadow-md shadow-[#3d3bf3]/25 active:scale-[0.98] transition-all cursor-pointer disabled:opacity-75"
          >
            {isFetchingLocation ? (
              <>
                <span className="material-symbols-outlined text-[20px] animate-spin">sync</span>
                <span>Acquiring GPS Coordinates...</span>
              </>
            ) : (
              <>
                <span className="material-symbols-outlined text-[20px]">near_me</span>
                <span>Fetch My Location</span>
              </>
            )}
          </button>

          <p className="font-sans text-[11px] text-[#767588]">
            🔒 Location is processed on-device. No GPS tracking stored.
          </p>
        </section>
      ) : (
        /* Once Location is Fetched: Show Interactive Map */
        <section className="w-full mb-6 space-y-3">
          <div className="flex items-center justify-between px-1">
            <div>
              <h2 className="font-heading font-bold text-[18px] text-[#1b1c1a] tracking-tight">
                Nearby Xerox Radar
              </h2>
              <p className="font-sans text-[12px] text-[#454556]">
                Interactive map of current location &amp; verified Xerox operators
              </p>
            </div>
            <button
              type="button"
              onClick={fetchUserLocation}
              disabled={isFetchingLocation}
              className="px-3 py-1.5 rounded-full bg-white hover:bg-[#f5f3ef] border border-[#ece8e1] text-[#3d3bf3] font-sans text-[11px] font-semibold flex items-center gap-1 shadow-2xs cursor-pointer disabled:opacity-50"
            >
              <span className={`material-symbols-outlined text-[14px] ${isFetchingLocation ? 'animate-spin' : ''}`}>
                sync
              </span>
              <span>Refresh</span>
            </button>
          </div>

          {/* Interactive Map Component */}
          <NearbyXeroxMap />
        </section>
      )}

      {/* STEP 2: ALL NEARBY XEROX STORES LIST */}
      <section className="w-full mb-6 space-y-3">
        <div className="flex items-center justify-between px-1">
          <h2 className="font-heading font-bold text-[18px] text-[#1b1c1a] tracking-tight">
            Certified Xerox Hubs ({mockShops.length})
          </h2>
          <span className="font-mono text-[11px] text-[#3d3bf3] font-semibold bg-[#e1e0ff] px-2.5 py-0.5 rounded-full">
            Within 1km
          </span>
        </div>

        <div className="space-y-3">
          {mockShops.map((shop) => (
            <div
              key={shop.id}
              className="p-4 rounded-3xl bg-white border border-[#ece8e1] shadow-xs hover:border-[#3d3bf3]/40 hover:shadow-sm transition-all"
            >
              <div className="flex items-start gap-3.5">
                <img
                  src={shop.image}
                  alt={shop.name}
                  className="w-14 h-14 rounded-2xl object-cover shrink-0 border border-[#ece8e1]"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-1">
                    <h3 className="font-heading font-bold text-[14px] text-[#1b1c1a] truncate">
                      {shop.name}
                    </h3>
                    <span className="font-mono text-[11px] font-bold text-[#1e0cde] bg-[#e1e0ff] px-2 py-0.5 rounded-md shrink-0">
                      {shop.distance}
                    </span>
                  </div>

                  <p className="font-sans text-[12px] text-[#454556] truncate mt-0.5">
                    Operator: <strong className="text-[#1b1c1a]">{shop.operatorName || 'Mohan Kumar'}</strong> • {shop.location}
                  </p>

                  <div className="flex flex-wrap items-center gap-2 mt-2">
                    <span className="inline-flex items-center gap-0.5 bg-[#fbf9f5] px-2 py-0.5 rounded-md text-[11px] font-bold text-[#1b1c1a] border border-[#ece8e1]">
                      <span className="material-symbols-outlined text-[#e5a000] text-[13px]">
                        star
                      </span>
                      {shop.rating}
                    </span>

                    <span className="font-mono text-[11px] text-[#0a542a] bg-[#ddf5e6] px-2 py-0.5 rounded-md font-semibold">
                      ₹{shop.pricePerBw || 2}/pg B&amp;W
                    </span>

                    <span className="font-sans text-[11px] text-[#454556] bg-[#f5f3ef] px-2 py-0.5 rounded-md">
                      {shop.statusBadge}
                    </span>
                  </div>

                  {/* Connect & Chat CTA Button */}
                  <div className="mt-3 pt-3 border-t border-[#ece8e1]/70 flex items-center justify-between">
                    <span className="font-mono text-[10px] text-[#767588]">
                      {shop.printerModel?.split(' ')[0] || 'Canon'} High-Speed Spooler
                    </span>

                    <button
                      type="button"
                      onClick={() => initiateChatWithShop(shop)}
                      className="px-4 py-2 rounded-xl bg-[#3d3bf3] hover:bg-[#2e2cd4] text-white font-sans text-[12px] font-semibold flex items-center gap-1.5 shadow-xs active:scale-95 transition-all cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-[16px]">chat</span>
                      <span>Connect &amp; Chat</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};
