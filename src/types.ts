/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface Product {
  id: string;
  name: string;
  description: string;
  category: 'Software & License' | 'Design Template' | 'Creative Asset' | 'E-Book / Course';
  price: number;
  image: string;
  fileUrl: string;
  fileSize: string;
  rating: number;
  reviewsCount: number;
  sellerName: string;
  licenseType: 'Single Use' | 'Commercial' | 'GPL' | 'SaaS License';
  isFeatured: boolean;
  licenseKeysPool: string[];
}

export interface CartItem {
  product: Product;
  quantity: number;
}

export enum PaymentStatus {
  PENDING = 'PENDING',
  VERIFYING = 'VERIFYING',
  SUCCESS = 'SUCCESS',
  FAILED = 'FAILED',
}

export interface Transaction {
  id: string;
  buyerName: string;
  buyerEmail: string;
  buyerPhone?: string;
  items: {
    productId: string;
    productName: string;
    price: number;
    licenseKey?: string;
    fileUrl: string;
    fileSize: string;
    decryptPassword?: string;
  }[];
  totalPrice: number;
  originalPrice?: number; // Original price before discount
  promoCodeUsed?: string; // Applied promo code
  discountAmount?: number; // Calculated discount deduction amount
  paymentMethod: string;
  paymentStatus: PaymentStatus;
  createdAt: string;
  paymentConfirmedAt?: string;
  fileDownloaded: boolean;
  emailSent: boolean;
  senderBank?: string;
  senderName?: string;
  senderNotes?: string;
  paymentProof?: string; // Base64 string or mock image url/file name of payment proof
}

export interface PromoCode {
  id: string;
  code: string;
  type: 'percentage' | 'flat';
  value: number;
  minPurchase?: number;
  maxDiscount?: number;
  isActive: boolean;
  expiryDate?: string;
  usageLimit?: number;
  usageCount: number;
}

export interface Review {
  id: string;
  productId: string;
  buyerName: string;
  rating: number;
  comment: string;
  createdAt: string;
}

export interface SystemLog {
  id: string;
  type: 'payment_pending' | 'payment_confirmed' | 'license_sent' | 'email_sent' | 'system';
  title: string;
  message: string;
  timestamp: string;
  recipientEmail?: string;
  details?: string;
}

export interface DailySales {
  date: string;
  revenue: number;
  salesCount: number;
}

export interface ShopBranding {
  name: string;
  slogan: string;
  logoIcon: string;
  logoColor: string;
  logoUrl?: string;
  themeSkin?: 'default' | 'emerald' | 'sunset' | 'midnight' | 'cyberpunk';
  heroTitle?: string;
  heroSubtitle?: string;
  heroBgGradient?: string;
  heroBannerUrl?: string;
  layoutStyle?: 'grid' | 'bento' | 'minimal';
  defaultNotes?: string;
  address?: string;
  smtpHost?: string;
  smtpPort?: string | number;
  smtpUser?: string;
  smtpPassword?: string;
  smtpSecure?: boolean;
  whatsappNumber?: string;
}

export interface PaymentMethodConfig {
  id: string;
  name: string;
  description: string;
  icon: 'CreditCard' | 'QrCode' | 'Smartphone' | 'Bank';
  instructions: string;
  accountNumber: string;
  accountName: string;
  isActive: boolean;
}

export interface Complaint {
  id: string;
  buyerName: string;
  buyerEmail: string;
  transactionId?: string;
  category: 'Lisensi Tidak Valid' | 'Gagal Download' | 'Masalah Pembayaran' | 'Sandi Dekripsi Salah' | 'Lainnya';
  message: string;
  status: 'PENDING' | 'DIPROSES' | 'SELESAI';
  replyMessage?: string;
  createdAt: string;
}

export interface VaultUser {
  id: string;
  name: string;
  email: string;
  accessCode: string;
  createdAt: string;
}

export interface AdminUser {
  id: string;
  username: string;
  password?: string;
  fullName: string;
  email: string;
  role: 'Super Admin' | 'Finance Admin' | 'Support Admin';
  createdAt: string;
}

export interface GithubUser {
  login: string;
  name: string;
  email: string;
  avatar_url: string;
}


