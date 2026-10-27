export type ScreenType =
  | 'home'
  | 'new_job'
  | 'shop_qr'
  | 'live_tracker'
  | 'receipt'
  | 'receipts_list'
  | 'profile'
  | 'auth';

export type ViewMode = 'auto' | 'mobile' | 'desktop';

export interface Customer {
  id: string;
  name: string;
  age: number;
  email: string;
  avatarUrl?: string;
  vaultTier?: string;
}

export type JobStatus =
  | 'draft'
  | 'ready_for_scan'
  | 'scanned'
  | 'viewing'
  | 'printing'
  | 'completed_purged'
  | 'revoked';

export type ColorMode = 'bw' | 'color';

export interface PrintShop {
  id: string;
  name: string;
  distance: string;
  location: string;
  rating: number;
  jobsCount: string;
  statusBadge: string;
  image: string;
}

export interface PrintJob {
  id: string;
  token: string;
  fileName: string;
  fileSize: string;
  pageCount: number;
  copies: number;
  colorMode: ColorMode;
  totalPrice: number;
  shop: PrintShop;
  status: JobStatus;
  createdAt: string;
  expiresInSeconds: number;
  isMaskedAadhaar: boolean;
  sha256Hash: string;
  verificationKey: string;
}

export interface RecentPrintItem {
  id: string;
  fileName: string;
  shopName: string;
  timestamp: string;
  status: 'Done' | 'Access ended';
  pageCount: number;
  colorMode: ColorMode;
  receiptId?: string;
}
