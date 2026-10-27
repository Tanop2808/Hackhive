'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { ScreenType, PrintJob, RecentPrintItem, PrintShop, ViewMode, Customer } from '@/types/printvault';
import { initialActiveJob, mockRecentPrints, mockShops, userProfile } from '@/data/mockData';

interface PrintVaultContextType {
  currentScreen: ScreenType;
  setCurrentScreen: (screen: ScreenType) => void;
  viewMode: ViewMode;
  setViewMode: (mode: ViewMode) => void;
  currentUser: Customer | null;
  signIn: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signUp: (name: string, age: number, email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signOut: () => void;
  activeJob: PrintJob | null;
  setActiveJob: React.Dispatch<React.SetStateAction<PrintJob | null>>;
  recentPrints: RecentPrintItem[];
  toastMessage: string | null;
  triggerToast: (msg: string) => void;
  createNewJob: (jobData: {
    fileName: string;
    fileSize: string;
    pageCount: number;
    copies: number;
    colorMode: 'bw' | 'color';
    shop: PrintShop;
    isMaskedAadhaar: boolean;
  }) => void;
  revokeActiveJob: () => void;
  completeAndPurgeActiveJob: () => void;
  selectedReceipt: PrintJob | null;
  viewReceipt: (receipt?: PrintJob | RecentPrintItem) => void;
  countdown: number;
  formatCountdown: (seconds: number) => string;

  // Location & Map State
  userLocation: import('@/types/printvault').UserLocation | null;
  isFetchingLocation: boolean;
  fetchUserLocation: () => Promise<void>;

  // Chat & Xerox Store Request State
  activeShop: PrintShop | null;
  setActiveShop: (shop: PrintShop | null) => void;
  activeChatSession: import('@/types/printvault').ChatSession | null;
  isShopkeeperMode: boolean;
  setIsShopkeeperMode: (val: boolean) => void;
  initiateChatWithShop: (shop: PrintShop) => void;
  acceptChatRequest: (requestId?: string) => void;
  declineChatRequest: (requestId?: string) => void;
  sendChatMessage: (text: string) => void;
  sendDocumentInChat: (docData: {
    fileName: string;
    fileSize: string;
    pageCount: number;
    copies: number;
    colorMode: 'bw' | 'color';
    isMaskedAadhaar: boolean;
    note?: string;
  }) => void;

  // App Role & Shopkeeper Terminal
  appRole: import('@/types/printvault').AppRole;
  setAppRole: (role: import('@/types/printvault').AppRole) => void;
  currentShopkeeper: import('@/types/printvault').Shopkeeper | null;
  shopkeeperSignIn: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  shopkeeperSignUp: (data: {
    shopName: string;
    operatorName: string;
    email: string;
    password: string;
    printerModel?: string;
    location?: string;
  }) => Promise<{ success: boolean; error?: string }>;
  shopkeeperSignOut: () => void;
}

const PrintVaultContext = createContext<PrintVaultContextType | undefined>(undefined);

export function PrintVaultProvider({ children }: { children: React.ReactNode }) {
  const [currentScreen, setCurrentScreen] = useState<ScreenType>('home');
  const [viewMode, setViewMode] = useState<ViewMode>('auto');
  const [appRole, setAppRole] = useState<import('@/types/printvault').AppRole>('customer');
  const [currentShopkeeper, setCurrentShopkeeper] = useState<import('@/types/printvault').Shopkeeper | null>({
    id: 'b2c3d4e5-f6a7-8b9c-0d1e-2f3a4b5c6d7e',
    shopId: 'shop-1',
    shopName: 'QuickPrint Corner & Xerox',
    operatorName: 'Mohan Kumar',
    email: 'mohan.quickprint@domain.in',
    printerModel: 'Canon imageRUNNER ADVANCE C5560i',
    location: 'Station Road, MG Road, Bengaluru',
    avatarUrl: 'https://images.unsplash.com/photo-1563986768609-322da13575f3?auto=format&fit=crop&w=300&q=80',
    isOnline: true,
    todayJobsCount: 42,
    todayEarnings: 1280,
  });
  const [currentUser, setCurrentUser] = useState<Customer | null>({
    id: 'a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d',
    name: userProfile.name,
    age: 24,
    email: userProfile.email,
    avatarUrl: userProfile.avatar,
    vaultTier: userProfile.vaultSecurityLevel,
  });
  const [activeJob, setActiveJob] = useState<PrintJob | null>(initialActiveJob);
  const [recentPrints, setRecentPrints] = useState<RecentPrintItem[]>(mockRecentPrints);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [selectedReceipt, setSelectedReceipt] = useState<PrintJob | null>(null);
  const [countdown, setCountdown] = useState<number>(582); // ~9m 42s

  // Countdown timer effect
  useEffect(() => {
    if (!activeJob || countdown <= 0) return;
    const interval = setInterval(() => {
      setCountdown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, [activeJob, countdown]);

  const formatCountdown = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 2500);
  };

  const signIn = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const res = await fetch('/api/auth/signin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (data.success && data.customer) {
        setCurrentUser(data.customer);
        triggerToast(`Welcome back, ${data.customer.name}!`);
        setCurrentScreen('home');
        return { success: true };
      } else {
        return { success: false, error: data.error || 'Invalid credentials' };
      }
    } catch (err: any) {
      return { success: false, error: err.message || 'Network connection failed' };
    }
  };

  const signUp = async (
    name: string,
    age: number,
    email: string,
    password: string
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, age, email, password }),
      });
      const data = await res.json();
      if (data.success && data.customer) {
        setCurrentUser(data.customer);
        triggerToast(`Welcome to PrintVault, ${data.customer.name}!`);
        setCurrentScreen('home');
        return { success: true };
      } else {
        return { success: false, error: data.error || 'Failed to create customer account' };
      }
    } catch (err: any) {
      return { success: false, error: err.message || 'Network connection failed' };
    }
  };

  const signOut = () => {
    setCurrentUser(null);
    triggerToast('Signed out of hardware enclave.');
    setCurrentScreen('auth');
  };

  const createNewJob = async (jobData: {
    fileName: string;
    fileSize: string;
    pageCount: number;
    copies: number;
    colorMode: 'bw' | 'color';
    shop: PrintShop;
    isMaskedAadhaar: boolean;
  }) => {
    const unitPrice = jobData.colorMode === 'bw' ? 3 : 10;
    const totalPrice = unitPrice * jobData.pageCount * jobData.copies;
    const randPart = Math.random().toString(36).substring(2, 6).toUpperCase();
    const randTokenNum = Math.floor(100000 + Math.random() * 900000).toString();
    const formattedToken = `${randTokenNum.slice(0, 3)} ${randTokenNum.slice(3)}`;

    const newJob: PrintJob = {
      id: `PV-${randPart}-2026`,
      token: formattedToken,
      fileName: jobData.fileName,
      fileSize: jobData.fileSize,
      pageCount: jobData.pageCount,
      copies: jobData.copies,
      colorMode: jobData.colorMode,
      totalPrice,
      shop: jobData.shop,
      status: 'ready_for_scan',
      createdAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      expiresInSeconds: 600,
      isMaskedAadhaar: jobData.isMaskedAadhaar,
      sha256Hash: `${Math.random().toString(16).substring(2, 6)}...${Math.random().toString(16).substring(2, 6)}`,
      verificationKey: `${Math.random().toString(16).substring(2, 6)}...${Math.random().toString(16).substring(2, 6)}`,
    };

    setActiveJob(newJob);
    setCountdown(600);
    setCurrentScreen('shop_qr');
    triggerToast('Secure Print Token Generated');

    // Async persist to Backend API / Supabase
    try {
      await fetch('/api/jobs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fileName: newJob.fileName,
          fileSize: newJob.fileSize,
          pageCount: newJob.pageCount,
          copies: newJob.copies,
          colorMode: newJob.colorMode,
          shopId: newJob.shop.id,
          isMaskedAadhaar: newJob.isMaskedAadhaar,
          shop: newJob.shop,
        }),
      });
    } catch {
      // Ignored: optimistic UI already applied
    }
  };

  const revokeActiveJob = async () => {
    if (!activeJob) return;
    const jobId = activeJob.id;
    const revokedItem: RecentPrintItem = {
      id: `rev-${Date.now()}`,
      fileName: activeJob.fileName,
      shopName: activeJob.shop.name,
      timestamp: 'Just now (Revoked)',
      status: 'Access ended',
      pageCount: activeJob.pageCount,
      colorMode: activeJob.colorMode,
    };
    setRecentPrints((prev) => [revokedItem, ...prev]);
    setActiveJob(null);
    triggerToast('Access Revoked. Volatile buffer purged.');
    setCurrentScreen('home');

    // Trigger backend revocation & purge receipt creation
    try {
      await fetch(`/api/jobs/${encodeURIComponent(jobId)}/revoke`, {
        method: 'POST',
      });
    } catch {
      // Handled optimistically
    }
  };

  const completeAndPurgeActiveJob = async () => {
    if (!activeJob) return;
    const jobId = activeJob.id;
    const completedItem: RecentPrintItem = {
      id: `done-${Date.now()}`,
      fileName: activeJob.fileName,
      shopName: activeJob.shop.name,
      timestamp: 'Just now',
      status: 'Done',
      pageCount: activeJob.pageCount,
      colorMode: activeJob.colorMode,
    };
    setSelectedReceipt({
      ...activeJob,
      status: 'completed_purged',
    });
    setRecentPrints((prev) => [completedItem, ...prev]);
    setActiveJob(null);
    setCurrentScreen('receipt');

    // Trigger backend DoD shred & verified purge receipt
    try {
      await fetch(`/api/jobs/${encodeURIComponent(jobId)}/purge`, {
        method: 'POST',
      });
    } catch {
      // Handled optimistically
    }
  };

  const viewReceipt = (item?: PrintJob | RecentPrintItem) => {
    if (!item) {
      // Default to initial receipt
      setSelectedReceipt(initialActiveJob);
    } else if ('totalPrice' in item) {
      setSelectedReceipt(item);
    } else {
      // Convert recent print to receipt view
      setSelectedReceipt({
        id: 'PV-8F3K-29XA',
        token: '849 201',
        fileName: item.fileName,
        fileSize: '1.8 MB',
        pageCount: item.pageCount,
        copies: 1,
        colorMode: item.colorMode,
        totalPrice: item.pageCount * (item.colorMode === 'bw' ? 3 : 10),
        shop: mockShops.find((s) => s.name === item.shopName) || mockShops[0],
        status: 'completed_purged',
        createdAt: item.timestamp,
        expiresInSeconds: 0,
        isMaskedAadhaar: true,
        sha256Hash: '9e7b...4c19',
        verificationKey: 'e98a...f201',
      });
    }
    setCurrentScreen('receipt');
  };

  // Location & Map State
  const [userLocation, setUserLocation] = useState<import('@/types/printvault').UserLocation | null>(null);
  const [isFetchingLocation, setIsFetchingLocation] = useState<boolean>(false);

  // Chat & Xerox Request State
  const [activeShop, setActiveShop] = useState<PrintShop | null>(null);
  const [activeChatSession, setActiveChatSession] = useState<import('@/types/printvault').ChatSession | null>(null);
  const [isShopkeeperMode, setIsShopkeeperMode] = useState<boolean>(false);

  const fetchUserLocation = async () => {
    setIsFetchingLocation(true);
    triggerToast('Acquiring GPS coordinates & scanning 1km radius...');

    if (typeof window !== 'undefined' && 'geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const loc: import('@/types/printvault').UserLocation = {
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude,
            accuracyMeters: Math.round(pos.coords.accuracy || 15),
            address: 'MG Road Hub, Bengaluru (GPS Live)',
          };
          setUserLocation(loc);
          setIsFetchingLocation(false);
          triggerToast('📍 Location locked: 4 nearby Xerox stores found');
        },
        () => {
          // Fallback to Bengaluru Central Xerox Cluster
          const fallbackLoc: import('@/types/printvault').UserLocation = {
            latitude: 12.9716,
            longitude: 77.5946,
            accuracyMeters: 20,
            address: 'MG Road Hub, Bengaluru',
          };
          setUserLocation(fallbackLoc);
          setIsFetchingLocation(false);
          triggerToast('📍 Location acquired: MG Road Hub (4 nearby Xerox stores found)');
        },
        { enableHighAccuracy: true, timeout: 6000 }
      );
    } else {
      const fallbackLoc: import('@/types/printvault').UserLocation = {
        latitude: 12.9716,
        longitude: 77.5946,
        accuracyMeters: 20,
        address: 'MG Road Hub, Bengaluru',
      };
      setUserLocation(fallbackLoc);
      setIsFetchingLocation(false);
      triggerToast('📍 Location set to MG Road Hub, Bengaluru');
    }
  };

  const initiateChatWithShop = (shop: PrintShop) => {
    setActiveShop(shop);
    const reqId = `req-${Date.now()}`;
    const cust: Customer = currentUser || {
      id: 'c1d2e3f4-a5b6-7c8d-9e0f-1a2b3c4d5e6f',
      name: userProfile.name,
      age: 23,
      email: userProfile.email,
      avatarUrl: userProfile.avatar,
      vaultTier: 'Hardware Enclave Tier 4',
    };

    const newSession: import('@/types/printvault').ChatSession = {
      requestId: reqId,
      customer: cust,
      shop,
      status: 'pending',
      createdAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      messages: [],
    };

    setActiveChatSession(newSession);
    setCurrentScreen('chat');
    triggerToast(`Connection request dispatched to ${shop.name}`);

    // Persist to backend /api/chat/request
    fetch('/api/chat/request', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        requestId: reqId,
        customerId: cust.id,
        customerName: cust.name,
        shopId: shop.id,
        shopName: shop.name,
        operatorName: shop.operatorName,
      }),
    }).catch(() => {});
  };

  const acceptChatRequest = (requestId?: string) => {
    if (!activeChatSession) return;
    const customerFirstName = activeChatSession.customer.name.split(' ')[0];
    const operator = activeChatSession.shop.operatorName || 'Shop Operator';

    const systemMsg: import('@/types/printvault').ChatMessage = {
      id: `msg-sys-${Date.now()}`,
      requestId: activeChatSession.requestId,
      senderRole: 'system',
      senderName: 'PrintVault Security Enclave',
      text: `🔒 Ephemeral Encrypted Channel established between ${activeChatSession.customer.name} and ${activeChatSession.shop.name} (${operator})`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    const shopkeeperWelcome: import('@/types/printvault').ChatMessage = {
      id: `msg-shop-${Date.now() + 1}`,
      requestId: activeChatSession.requestId,
      senderRole: 'shopkeeper',
      senderName: `${activeChatSession.shop.name} (${operator})`,
      text: `Hello ${customerFirstName}! Welcome to ${activeChatSession.shop.name}. Our high-speed ${activeChatSession.shop.printerModel || 'laser printer'} is online and warm. Please tap "Send Document" to transfer your file securely.`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setActiveChatSession((prev) => {
      if (!prev) return null;
      return {
        ...prev,
        status: 'accepted',
        messages: [...prev.messages, systemMsg, shopkeeperWelcome],
      };
    });

    triggerToast(`Request accepted! Secure chat session active.`);

    fetch(`/api/chat/request/${encodeURIComponent(activeChatSession.requestId)}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'accepted' }),
    }).catch(() => {});
  };

  const declineChatRequest = (requestId?: string) => {
    if (!activeChatSession) return;
    const systemMsg: import('@/types/printvault').ChatMessage = {
      id: `msg-sys-dec-${Date.now()}`,
      requestId: activeChatSession.requestId,
      senderRole: 'system',
      senderName: 'PrintVault Security',
      text: `Connection request was declined by ${activeChatSession.shop.name}. Queue capacity full.`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setActiveChatSession((prev) => {
      if (!prev) return null;
      return {
        ...prev,
        status: 'declined',
        messages: [...prev.messages, systemMsg],
      };
    });

    triggerToast(`Connection request was declined.`);

    fetch(`/api/chat/request/${encodeURIComponent(activeChatSession.requestId)}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'declined' }),
    }).catch(() => {});
  };

  const sendChatMessage = (text: string) => {
    if (!activeChatSession || !text.trim()) return;
    const custMsg: import('@/types/printvault').ChatMessage = {
      id: `msg-cust-${Date.now()}`,
      requestId: activeChatSession.requestId,
      senderRole: 'customer',
      senderName: activeChatSession.customer.name,
      text: text.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setActiveChatSession((prev) => (prev ? { ...prev, messages: [...prev.messages, custMsg] } : null));

    fetch(`/api/chat/${encodeURIComponent(activeChatSession.requestId)}/messages`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(custMsg),
    }).catch(() => {});
  };

  const sendDocumentInChat = (docData: {
    fileName: string;
    fileSize: string;
    pageCount: number;
    copies: number;
    colorMode: 'bw' | 'color';
    isMaskedAadhaar: boolean;
    note?: string;
  }) => {
    if (!activeChatSession) return;
    const shop = activeChatSession.shop;
    const unitPrice = docData.colorMode === 'bw' ? (shop.pricePerBw || 2) : (shop.pricePerColor || 5);
    const totalPrice = unitPrice * docData.pageCount * docData.copies;
    const randPart = Math.random().toString(36).substring(2, 6).toUpperCase();
    const randPin = Math.floor(100000 + Math.random() * 900000).toString();
    const formattedToken = `${randPin.slice(0, 3)} ${randPin.slice(3)}`;
    const jobId = `PV-${randPart}-2026`;
    const currentTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    const docAttachment: import('@/types/printvault').ChatDocumentAttachment = {
      fileName: docData.fileName,
      fileSize: docData.fileSize,
      pageCount: docData.pageCount,
      copies: docData.copies,
      colorMode: docData.colorMode,
      isMaskedAadhaar: docData.isMaskedAadhaar,
      token: formattedToken,
      jobId,
      totalPrice,
      note: docData.note,
      sentAt: currentTime,
      expiresInSeconds: 600,
    };

    const docMsg: import('@/types/printvault').ChatMessage = {
      id: `msg-doc-${Date.now()}`,
      requestId: activeChatSession.requestId,
      senderRole: 'customer',
      senderName: activeChatSession.customer.name,
      document: docAttachment,
      text: docData.note || `Sent ${docData.fileName} (${docData.copies} copies, ${docData.colorMode.toUpperCase()})`,
      timestamp: currentTime,
    };

    // Update activeJob for global synchronization
    const newJob: PrintJob = {
      id: jobId,
      token: formattedToken,
      fileName: docData.fileName,
      fileSize: docData.fileSize,
      pageCount: docData.pageCount,
      copies: docData.copies,
      colorMode: docData.colorMode,
      totalPrice,
      shop,
      status: 'printing',
      createdAt: currentTime,
      expiresInSeconds: 600,
      isMaskedAadhaar: docData.isMaskedAadhaar,
      sha256Hash: `${Math.random().toString(16).substring(2, 6)}...${Math.random().toString(16).substring(2, 6)}`,
      verificationKey: `${Math.random().toString(16).substring(2, 6)}...${Math.random().toString(16).substring(2, 6)}`,
    };

    setActiveJob(newJob);
    setCountdown(600);

    // Operator acknowledgment
    const shopReply: import('@/types/printvault').ChatMessage = {
      id: `msg-reply-${Date.now() + 1}`,
      requestId: activeChatSession.requestId,
      senderRole: 'shopkeeper',
      senderName: `${shop.name} (${shop.operatorName || 'Operator'})`,
      text: `Document "${docData.fileName}" received into encrypted RAM buffer! Token ${formattedToken} verified. Spooling ${docData.copies} ${docData.copies > 1 ? 'copies' : 'copy'} in ${docData.colorMode === 'bw' ? 'B&W' : 'Color'} now. Total: ₹${totalPrice}. Spooler will shred volatile memory post-print.`,
      timestamp: currentTime,
    };

    setActiveChatSession((prev) => {
      if (!prev) return null;
      return {
        ...prev,
        messages: [...prev.messages, docMsg, shopReply],
      };
    });

    triggerToast(`Document sent to ${shop.name} printer`);
  };

  const shopkeeperSignIn = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const res = await fetch('/api/auth/shopkeeper/signin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (data.success && data.shopkeeper) {
        setCurrentShopkeeper(data.shopkeeper);
        setAppRole('shopkeeper');
        triggerToast(`Welcome, Operator ${data.shopkeeper.operatorName}!`);
        setCurrentScreen('shopkeeper_dashboard');
        return { success: true };
      } else {
        return { success: false, error: data.error || 'Authentication failed' };
      }
    } catch (err: any) {
      return { success: false, error: err.message || 'Network connection failed' };
    }
  };

  const shopkeeperSignUp = async (data: {
    shopName: string;
    operatorName: string;
    email: string;
    password: string;
    printerModel?: string;
    location?: string;
  }): Promise<{ success: boolean; error?: string }> => {
    try {
      const res = await fetch('/api/auth/shopkeeper/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      const resData = await res.json();
      if (resData.success && resData.shopkeeper) {
        setCurrentShopkeeper(resData.shopkeeper);
        setAppRole('shopkeeper');
        triggerToast(`Store registered! Welcome, ${resData.shopkeeper.operatorName}`);
        setCurrentScreen('shopkeeper_dashboard');
        return { success: true };
      } else {
        return { success: false, error: resData.error || 'Registration failed' };
      }
    } catch (err: any) {
      return { success: false, error: err.message || 'Network connection failed' };
    }
  };

  const shopkeeperSignOut = () => {
    setCurrentShopkeeper(null);
    triggerToast('Signed out of Xerox Kiosk Terminal.');
    setCurrentScreen('shopkeeper_auth');
  };

  return (
    <PrintVaultContext.Provider
      value={{
        currentScreen,
        setCurrentScreen,
        viewMode,
        setViewMode,
        currentUser,
        signIn,
        signUp,
        signOut,
        activeJob,
        setActiveJob,
        recentPrints,
        toastMessage,
        triggerToast,
        createNewJob,
        revokeActiveJob,
        completeAndPurgeActiveJob,
        selectedReceipt,
        viewReceipt,
        countdown,
        formatCountdown,
        userLocation,
        isFetchingLocation,
        fetchUserLocation,
        activeShop,
        setActiveShop,
        activeChatSession,
        isShopkeeperMode,
        setIsShopkeeperMode,
        initiateChatWithShop,
        acceptChatRequest,
        declineChatRequest,
        sendChatMessage,
        sendDocumentInChat,
        appRole,
        setAppRole,
        currentShopkeeper,
        shopkeeperSignIn,
        shopkeeperSignUp,
        shopkeeperSignOut,
      }}
    >
      {children}
    </PrintVaultContext.Provider>
  );
}

export function usePrintVault() {
  const context = useContext(PrintVaultContext);
  if (!context) {
    throw new Error('usePrintVault must be used within a PrintVaultProvider');
  }
  return context;
}
