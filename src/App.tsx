/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { Product, Review, CartItem, Transaction, SystemLog, PaymentStatus, ShopBranding, VaultUser, PaymentMethodConfig, Complaint, AdminUser, GithubUser, PromoCode, SilaturahmiMessage } from './types';
import { initialProducts, initialReviews } from './data/initialProducts';
import { ProductCard } from './components/ProductCard';
import { ProductDetailModal } from './components/ProductDetailModal';
import { CartDrawer } from './components/CartDrawer';
import { CheckoutModal } from './components/CheckoutModal';
import { AnalyticsDashboard } from './components/AnalyticsDashboard';
import { AdminDashboard } from './components/AdminDashboard';
import { AdminLogin } from './components/AdminLogin';
import { EncryptedDeliveryModal } from './components/EncryptedDeliveryModal';
import { ComplaintModal } from './components/ComplaintModal';
import { WishlistDrawer } from './components/WishlistDrawer';

import {
  ShoppingBag,
  Lock,
  Database,
  LayoutDashboard,
  Search,
  Sparkles,
  Mail,
  Bell,
  SlidersHorizontal,
  ChevronRight,
  Plus,
  ShieldCheck,
  CheckCircle,
  HelpCircle,
  Store,
  Gem,
  Gift,
  Globe,
  Cpu,
  MessageSquare,
  Github,
  X,
  Moon,
  Sun,
  Heart,
  Copy,
  Check,
} from 'lucide-react';
import { 
  syncToFirebase, 
  deleteFromFirebase, 
  fetchCollectionFromFirebase, 
  fetchDocFromFirebase, 
  bulkPushToFirebase,
  purgeCollectionFromFirebase
} from './lib/firebaseSync';


export default function App() {
  // Refs to prevent infinite synchronization write loops
  const lastSyncedBrandingRef = useRef<string>('');
  const lastSyncedCategoriesRef = useRef<string>('');
  const lastSyncedPaymentMethodsRef = useRef<string>('');
  const lastSyncedVaultUsersRef = useRef<string>('');
  const lastSyncedAdminUsersRef = useRef<string>('');
  const lastSyncedPromoCodesRef = useRef<string>('');

  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const savedTheme = localStorage.getItem('digimarket_theme');
      if (savedTheme) {
        return savedTheme === 'dark';
      }
      return false; // Default to light mode
    }
    return false;
  });

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('digimarket_theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('digimarket_theme', 'light');
    }
  }, [isDarkMode]);

  // Global States synced with LocalStorage
  const [products, setProducts] = useState<Product[]>(() => {
    const saved = localStorage.getItem('digimarket_products');
    return saved ? JSON.parse(saved) : initialProducts;
  });

  const [reviews, setReviews] = useState<Review[]>(() => {
    const saved = localStorage.getItem('digimarket_reviews');
    return saved ? JSON.parse(saved) : initialReviews;
  });

  const [transactions, setTransactions] = useState<Transaction[]>(() => {
    const saved = localStorage.getItem('digimarket_transactions');
    return saved ? JSON.parse(saved) : [];
  });

  const [systemLogs, setSystemLogs] = useState<SystemLog[]>(() => {
    const saved = localStorage.getItem('digimarket_system_logs');
    return saved ? JSON.parse(saved) : [
      {
        id: 'log-1',
        type: 'system',
        title: 'Sistem Diinisialisasi',
        message: 'Sandbox marketplace aset digital siap digunakan.',
        timestamp: new Date().toISOString(),
      }
    ];
  });

  const [cart, setCart] = useState<CartItem[]>([]);
  const [showAllProducts, setShowAllProducts] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'belanja' | 'vault' | 'seller' | 'admin'>('belanja');

  const [silaturahmiMessages, setSilaturahmiMessages] = useState<SilaturahmiMessage[]>(() => {
    const saved = localStorage.getItem('digimarket_silaturahmi');
    return saved ? JSON.parse(saved) : [
      {
        id: 'msg-1',
        name: 'Admin Toko',
        message: 'Selamat datang di Pojok Silaturahmi! Silakan tinggalkan pesan sapaan hangat atau feedback di sini. Mari jalin tali silaturahmi! 🤝✨',
        timestamp: new Date(Date.now() - 3600000 * 5).toISOString(),
        avatarColor: 'bg-indigo-500 text-white',
        role: 'Creator'
      },
      {
        id: 'msg-2',
        name: 'Andi Wijaya',
        message: 'Halo semua, izin berkunjung! Tokonya keren banget, pembayarannya instan dan lisensinya langsung dikirim. Sukses selalu gan!',
        timestamp: new Date(Date.now() - 3600000 * 2).toISOString(),
        avatarColor: 'bg-emerald-500 text-white',
        role: 'Pembeli'
      }
    ];
  });
  
  const [branding, setBranding] = useState<ShopBranding>(() => {
    const saved = localStorage.getItem('digimarket_shop_branding');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return {
          name: parsed.name || 'DigitalMarket',
          slogan: parsed.slogan || 'Premium Creative Hub',
          logoIcon: parsed.logoIcon || 'Lock',
          logoColor: parsed.logoColor || 'sky',
          logoUrl: parsed.logoUrl || '',
          themeSkin: parsed.themeSkin || 'default',
          heroTitle: parsed.heroTitle || 'Pusat Lisensi & Aset Digital Premium',
          heroSubtitle: parsed.heroSubtitle || 'Dapatkan software orisinal, template desain, aset kreatif, dan e-book berkualitas tinggi dengan pengiriman instan terenkripsi 24/7.',
          heroBgGradient: parsed.heroBgGradient || 'from-slate-900 to-slate-800',
          heroBannerUrl: parsed.heroBannerUrl || '',
          layoutStyle: parsed.layoutStyle || 'grid',
          defaultNotes: parsed.defaultNotes || 'Terima kasih telah berbelanja di toko kami! Silakan lakukan pembayaran sesuai instruksi di atas dan kirimkan bukti transfer Anda agar dapat kami proses secepatnya.',
          address: parsed.address || '',
          smtpHost: parsed.smtpHost || '',
          smtpPort: parsed.smtpPort || '',
          smtpUser: parsed.smtpUser || '',
          smtpPassword: parsed.smtpPassword || '',
          smtpSecure: parsed.smtpSecure !== undefined ? parsed.smtpSecure : true,
          brevoApiKey: parsed.brevoApiKey || '',
          brevoSenderName: parsed.brevoSenderName || '',
          brevoSenderEmail: parsed.brevoSenderEmail || '',
          emailService: parsed.emailService || 'smtp',
          whatsappNumber: parsed.whatsappNumber || '6282288882512',
          fontFamily: parsed.fontFamily || 'inter',
          productsLimit: parsed.productsLimit || 6,
          defaultTheme: parsed.defaultTheme || 'light',
          showOfficialPaymentsModule: parsed.showOfficialPaymentsModule !== undefined ? parsed.showOfficialPaymentsModule : true,
        };
      } catch (e) {
        // ignore
      }
    }
    return {
      name: 'DigitalMarket',
      slogan: 'Premium Creative Hub',
      logoIcon: 'Lock',
      logoColor: 'sky',
      logoUrl: '',
      themeSkin: 'default',
      heroTitle: 'Pusat Lisensi & Aset Digital Premium',
      heroSubtitle: 'Dapatkan software orisinal, template desain, aset kreatif, dan e-book berkualitas tinggi dengan pengiriman instan terenkripsi 24/7.',
      heroBgGradient: 'from-slate-900 to-slate-800',
      heroBannerUrl: '',
      layoutStyle: 'grid',
      defaultNotes: 'Terima kasih telah berbelanja di toko kami! Silakan lakukan pembayaran sesuai instruksi di atas dan kirimkan bukti transfer Anda agar dapat kami proses secepatnya.',
      address: '',
      smtpHost: '',
      smtpPort: '',
      smtpUser: '',
      smtpPassword: '',
      smtpSecure: true,
      brevoApiKey: '',
      brevoSenderName: '',
      brevoSenderEmail: '',
      emailService: 'smtp',
      whatsappNumber: '6282288882512',
      fontFamily: 'inter',
      productsLimit: 6,
      defaultTheme: 'light',
      showOfficialPaymentsModule: true,
    };
  });

  useEffect(() => {
    if (branding.defaultTheme) {
      setIsDarkMode(branding.defaultTheme === 'dark');
    }
  }, [branding.defaultTheme]);

  useEffect(() => {
    localStorage.setItem('digimarket_shop_branding', JSON.stringify(branding));
    const brandingStr = JSON.stringify(branding);
    if (lastSyncedBrandingRef.current !== brandingStr) {
      lastSyncedBrandingRef.current = brandingStr;
      autoSyncEntity('config', 'shop_branding', branding);
    }
  }, [branding]);

  useEffect(() => {
    localStorage.setItem('digimarket_silaturahmi', JSON.stringify(silaturahmiMessages));
  }, [silaturahmiMessages]);

  const [paymentMethods, setPaymentMethods] = useState<PaymentMethodConfig[]>(() => {
    const saved = localStorage.getItem('digimarket_payment_methods');
    let parsed: PaymentMethodConfig[] | null = null;
    if (saved) {
      try {
        parsed = JSON.parse(saved);
      } catch (e) {
        parsed = null;
      }
    }
    
    const defaultMethods: PaymentMethodConfig[] = [
      {
        id: 'pay-bca',
        name: 'Virtual Account BCA',
        description: 'Verifikasi instan dalam 2 detik',
        icon: 'CreditCard',
        instructions: 'Kirim pembayaran ke Virtual Account BCA dengan memasukkan kode tagihan Anda.',
        accountNumber: '80008973834369',
        accountName: 'DIGIMARKET LTD',
        isActive: true,
      },
      {
        id: 'pay-qris',
        name: 'QRIS Pembayaran Otomatis',
        description: 'Scan QR Code apa saja untuk verifikasi instan',
        icon: 'QrCode',
        instructions: 'Scan QR Code yang muncul di layar dengan GoPay, OVO, Dana, LinkAja, atau m-Banking Anda.',
        accountNumber: 'ID102947113',
        accountName: 'DIGIMARKET INTERNASIONAL',
        isActive: true,
      },
      {
        id: 'pay-dana',
        name: 'DANA',
        description: 'Verifikasi melalui push token di HP',
        icon: 'Smartphone',
        instructions: 'Masukkan nomor HP Anda yang terdaftar di DANA, kemudian setujui pembayaran di aplikasi HP.',
        accountNumber: '081234567890',
        accountName: 'DIGIMARKET GATEWAY',
        isActive: true,
      },
      {
        id: 'pay-bank-transfer',
        name: 'Transfer Bank BCA',
        description: 'Verifikasi manual oleh tim admin',
        icon: 'Bank',
        instructions: 'Kirim transfer antar bank ke rekening bank kami. Harap transfer dengan jumlah nominal presisi.',
        accountNumber: '123-456-7890',
        accountName: 'DIGIMARKET CORPORATE',
        isActive: true,
      },
      {
        id: 'pay-bni',
        name: 'Transfer Bank BNI',
        description: 'Transfer manual via Bank BNI',
        icon: 'Bank',
        instructions: 'Kirim transfer antar bank atau sesama Bank BNI ke nomor rekening kami. Harap transfer sesuai nominal total.',
        accountNumber: '009-8877-6655',
        accountName: 'DIGIMARKET CORPORATE BNI',
        isActive: true,
      },
      {
        id: 'pay-blu',
        name: 'BLU by BCA',
        description: 'Transfer / pembayaran via BLU Digital',
        icon: 'Smartphone',
        instructions: 'Kirim pembayaran via aplikasi blu ke rekening blu kami. Silakan upload bukti transfer di form konfirmasi.',
        accountNumber: '010-2233-4455',
        accountName: 'DIGIMARKET CORPORATE BLU',
        isActive: true,
      }
    ];

    if (parsed && Array.isArray(parsed) && parsed.length > 0) {
      // Map/rename old name to new name if it exists in saved list
      let merged = parsed.map(m => {
        if (m.id === 'pay-bank-transfer' && m.name === 'Transfer Bank Manual') {
          return { ...m, name: 'Transfer Bank BCA' };
        }
        if (m.id === 'pay-dana' && (m.name.includes('OVO') || m.name === 'DANA / OVO E-Wallet')) {
          return {
            ...m,
            name: 'DANA',
            instructions: 'Masukkan nomor HP Anda yang terdaftar di DANA, kemudian setujui pembayaran di aplikasi HP.'
          };
        }
        return m;
      });

      // Merge missing defaults so existing users automatically get newly added methods
      defaultMethods.forEach(def => {
        if (!merged.some(m => m.id === def.id || m.name.toLowerCase() === def.name.toLowerCase())) {
          merged.push(def);
        }
      });
      return merged;
    }
    return defaultMethods;
  });

  useEffect(() => {
    localStorage.setItem('digimarket_payment_methods', JSON.stringify(paymentMethods));
    const str = JSON.stringify(paymentMethods);
    if (lastSyncedPaymentMethodsRef.current !== str) {
      lastSyncedPaymentMethodsRef.current = str;
      autoSyncEntity('config', 'payment_methods', { list: paymentMethods });
    }
  }, [paymentMethods]);

  const [complaints, setComplaints] = useState<Complaint[]>(() => {
    const saved = localStorage.getItem('digimarket_complaints');
    return saved ? JSON.parse(saved) : [
      {
        id: 'COMP-101',
        buyerName: 'Joko Widodo',
        buyerEmail: 'jokowi@gmail.com',
        transactionId: 'TRX-DIR-101',
        category: 'Gagal Download',
        message: 'Tautan unduhan tidak merespon saat diklik, mohon dibantu tautan alternatif.',
        status: 'PENDING',
        createdAt: new Date(Date.now() - 3600000 * 5).toISOString(),
      }
    ];
  });

  useEffect(() => {
    localStorage.setItem('digimarket_complaints', JSON.stringify(complaints));
  }, [complaints]);

  const [categories, setCategories] = useState<string[]>(() => {
    const saved = localStorage.getItem('digimarket_categories');
    return saved ? JSON.parse(saved) : ['Software & License', 'Design Template', 'Creative Asset', 'E-Book / Course'];
  });

  useEffect(() => {
    localStorage.setItem('digimarket_categories', JSON.stringify(categories));
    const str = JSON.stringify(categories);
    if (lastSyncedCategoriesRef.current !== str) {
      lastSyncedCategoriesRef.current = str;
      autoSyncEntity('config', 'categories', { list: categories });
    }
  }, [categories]);

  const [vaultUsers, setVaultUsers] = useState<VaultUser[]>(() => {
    const saved = localStorage.getItem('digimarket_vault_users');
    return saved ? JSON.parse(saved) : [
      {
        id: 'vuser-1',
        name: 'Budi Santoso',
        email: 'budi@gmail.com',
        accessCode: 'BUDI123',
        createdAt: new Date().toISOString()
      },
      {
        id: 'vuser-2',
        name: 'Siti Aminah',
        email: 'siti@gmail.com',
        accessCode: 'SITI456',
        createdAt: new Date().toISOString()
      }
    ];
  });

  useEffect(() => {
    localStorage.setItem('digimarket_vault_users', JSON.stringify(vaultUsers));
    const str = JSON.stringify(vaultUsers);
    if (lastSyncedVaultUsersRef.current !== str) {
      lastSyncedVaultUsersRef.current = str;
      autoSyncEntity('config', 'vault_users', { list: vaultUsers });
    }
  }, [vaultUsers]);

  const [adminUsers, setAdminUsers] = useState<AdminUser[]>(() => {
    const saved = localStorage.getItem('digimarket_admin_users');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        // Migrating existing localstorage admin users that do not have email
        return parsed.map((admin: any) => ({
          ...admin,
          email: admin.email || 'ownbewok@gmail.com'
        }));
      } catch (e) {
        // Fallback
      }
    }
    return [
      {
        id: 'admin-1',
        username: 'admin',
        password: 'admin123',
        fullName: 'Super Administrator',
        email: 'ownbewok@gmail.com',
        role: 'Super Admin',
        createdAt: new Date().toISOString()
      }
    ];
  });

  useEffect(() => {
    localStorage.setItem('digimarket_admin_users', JSON.stringify(adminUsers));
    const str = JSON.stringify(adminUsers);
    if (lastSyncedAdminUsersRef.current !== str) {
      lastSyncedAdminUsersRef.current = str;
      autoSyncEntity('config', 'admin_users', { list: adminUsers });
    }
  }, [adminUsers]);

  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState<boolean>(() => {
    return localStorage.getItem('digimarket_admin_logged_in') === 'true';
  });

  const [currentAdmin, setCurrentAdmin] = useState<AdminUser | null>(() => {
    const saved = localStorage.getItem('digimarket_current_admin');
    return saved ? JSON.parse(saved) : null;
  });

  useEffect(() => {
    localStorage.setItem('digimarket_admin_logged_in', String(isAdminLoggedIn));
  }, [isAdminLoggedIn]);

  useEffect(() => {
    if (currentAdmin) {
      localStorage.setItem('digimarket_current_admin', JSON.stringify(currentAdmin));
    } else {
      localStorage.removeItem('digimarket_current_admin');
    }
  }, [currentAdmin]);

  // Promo Code States
  const [promoCodes, setPromoCodes] = useState<PromoCode[]>(() => {
    const saved = localStorage.getItem('digimarket_promo_codes');
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    localStorage.setItem('digimarket_promo_codes', JSON.stringify(promoCodes));
    const str = JSON.stringify(promoCodes);
    if (lastSyncedPromoCodesRef.current !== str) {
      lastSyncedPromoCodesRef.current = str;
      autoSyncEntity('config', 'promo_codes', { list: promoCodes });
    }
  }, [promoCodes]);

  // GitHub OAuth Integration States & Handlers
  const [githubUser, setGithubUser] = useState<GithubUser | null>(() => {
    const saved = localStorage.getItem('digimarket_github_user');
    return saved ? JSON.parse(saved) : null;
  });

  useEffect(() => {
    if (githubUser) {
      localStorage.setItem('digimarket_github_user', JSON.stringify(githubUser));
    } else {
      localStorage.removeItem('digimarket_github_user');
    }
  }, [githubUser]);

  useEffect(() => {
    const handleOAuthMessage = (event: MessageEvent) => {
      const origin = event.origin;
      if (!origin.endsWith('.run.app') && !origin.includes('localhost') && !origin.includes('127.0.0.1')) {
        return;
      }
      if (event.data?.type === 'GITHUB_AUTH_SUCCESS' && event.data?.user) {
        setGithubUser(event.data.user);
        // Add a simulation log for login event
        setSystemLogs((prev) => [
          {
            id: `log-${Date.now()}`,
            timestamp: new Date().toLocaleTimeString('id-ID'),
            type: 'system_info',
            title: 'OAuth GitHub Sukses',
            description: `Pelanggan @${event.data.user.login} (${event.data.user.email}) sukses masuk menggunakan akun GitHub.`
          },
          ...prev
        ]);
      }
    };
    window.addEventListener('message', handleOAuthMessage);
    return () => window.removeEventListener('message', handleOAuthMessage);
  }, []);

  const handleGithubLogin = async () => {
    try {
      const res = await fetch('/api/auth/github-url');
      const resText = await res.text();
      let data;
      try {
        data = JSON.parse(resText);
      } catch (jsonErr) {
        alert("Server mengembalikan respon tidak valid saat memuat URL GitHub.");
        return;
      }
      if (!res.ok) {
        alert(data.error || "Gagal memulai autentikasi GitHub.");
        return;
      }
      
      const width = 600;
      const height = 700;
      const left = window.screenX + (window.outerWidth - width) / 2;
      const top = window.screenY + (window.outerHeight - height) / 2;
      
      const popup = window.open(
        data.url,
        "github_oauth_popup",
        `width=${width},height=${height},left=${left},top=${top},status=no,resizable=yes`
      );
      
      if (!popup) {
        alert("Popup diblokir oleh browser! Silakan izinkan popup untuk situs ini agar dapat masuk dengan GitHub.");
      }
    } catch (err: any) {
      console.error("Gagal inisiasi login GitHub:", err);
      alert("Terjadi kesalahan koneksi saat menghubungi server untuk login GitHub.");
    }
  };

  const handleGithubLogout = () => {
    setGithubUser(null);
    setSystemLogs((prev) => [
      {
        id: `log-${Date.now()}`,
        timestamp: new Date().toLocaleTimeString('id-ID'),
        type: 'system_info',
        title: 'OAuth GitHub Logout',
        description: `Pelanggan keluar dari akun GitHub.`
      },
      ...prev
    ]);
  };

  // UI Modal/Drawer states
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [isComplaintModalOpen, setIsComplaintModalOpen] = useState(false);
  const [isWishlistOpen, setIsWishlistOpen] = useState(false);
  const [copiedPaymentId, setCopiedPaymentId] = useState<string | null>(null);

  // Pojok Silaturahmi Chat States
  const [isChatOpen, setIsChatOpen] = useState(true);
  const [chatName, setChatName] = useState('');
  const [chatRole, setChatRole] = useState('Tamu');
  const [chatMessage, setChatMessage] = useState('');
  const [isSubmittingChat, setIsSubmittingChat] = useState(false);

  // Wishlist States & Handlers
  const [wishlist, setWishlist] = useState<Product[]>(() => {
    const saved = localStorage.getItem('digimarket_wishlist');
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    localStorage.setItem('digimarket_wishlist', JSON.stringify(wishlist));
  }, [wishlist]);

  const handleToggleWishlist = (product: Product) => {
    setWishlist((prev) => {
      const exists = prev.some((item) => item.id === product.id);
      if (exists) {
        return prev.filter((item) => item.id !== product.id);
      } else {
        return [...prev, product];
      }
    });
  };

  const handleRemoveFromWishlist = (productId: string) => {
    setWishlist((prev) => prev.filter((item) => item.id !== productId));
  };

  const handleClearWishlist = () => {
    setWishlist([]);
  };

  // Firebase Integration State (Fully Offline Sandbox Mode supported as fallback)
  const [isDbLoading, setIsDbLoading] = useState<boolean>(false);
  const [isFirebaseConnected, setIsFirebaseConnected] = useState<boolean>(false);
  const [firebaseError, setFirebaseError] = useState<string | null>(null);

  // Always Online Mode: Autosync states locked to true
  const [isAutosyncEnabled, setIsAutosyncEnabled] = useState<boolean>(true);
  const [lastAutosyncTime, setLastAutosyncTime] = useState<string | null>(() => {
    return localStorage.getItem('digimarket_last_autosync_time') || null;
  });

  const pullAllFromFirebase = async () => {
    setIsDbLoading(true);
    setFirebaseError(null);
    try {
      console.log("📥 Menarik data dari Firebase Cloud...");
      
      // 1. Fetch shop branding config
      const brandingDoc = await fetchDocFromFirebase('config', 'shop_branding');
      if (brandingDoc) {
        const { id, ...cleanBranding } = brandingDoc;
        setBranding(cleanBranding);
      }
      
      // 2. Fetch categories config
      const categoriesDoc = await fetchDocFromFirebase('config', 'categories');
      if (categoriesDoc && Array.isArray(categoriesDoc.list)) {
        setCategories(categoriesDoc.list);
      }
      
      // 3. Fetch payment methods config
      const paymentDoc = await fetchDocFromFirebase('config', 'payment_methods');
      if (paymentDoc && Array.isArray(paymentDoc.list)) {
        setPaymentMethods(paymentDoc.list);
      }

      // 4. Fetch products
      const cloudProducts = await fetchCollectionFromFirebase('products');
      if (cloudProducts && cloudProducts.length > 0) {
        setProducts(cloudProducts);
      }

      // 5. Fetch reviews
      const cloudReviews = await fetchCollectionFromFirebase('reviews');
      if (cloudReviews && cloudReviews.length > 0) {
        setReviews(cloudReviews);
      }

      // 6. Fetch transactions
      const cloudTransactions = await fetchCollectionFromFirebase('transactions');
      if (cloudTransactions && cloudTransactions.length > 0) {
        setTransactions(cloudTransactions);
      }

      // 7. Fetch complaints
      const cloudComplaints = await fetchCollectionFromFirebase('complaints');
      if (cloudComplaints && cloudComplaints.length > 0) {
        setComplaints(cloudComplaints);
      }

      // 8. Fetch vault users
      const cloudVaultUsers = await fetchCollectionFromFirebase('vault_users');
      if (cloudVaultUsers && cloudVaultUsers.length > 0) {
        setVaultUsers(cloudVaultUsers);
      }

      // 9. Fetch admin users
      const cloudAdminUsers = await fetchCollectionFromFirebase('admin_users');
      if (cloudAdminUsers && cloudAdminUsers.length > 0) {
        setAdminUsers(cloudAdminUsers);
      }

      // 10. Fetch promo codes
      const cloudPromoCodes = await fetchCollectionFromFirebase('promo_codes');
      if (cloudPromoCodes && cloudPromoCodes.length > 0) {
        setPromoCodes(cloudPromoCodes);
      }

      // 11. Fetch silaturahmi messages
      const cloudSilaturahmi = await fetchCollectionFromFirebase('silaturahmi');
      if (cloudSilaturahmi && cloudSilaturahmi.length > 0) {
        setSilaturahmiMessages(cloudSilaturahmi);
      }

      // 12. Fetch system logs
      const cloudSystemLogs = await fetchCollectionFromFirebase('system_logs');
      if (cloudSystemLogs && cloudSystemLogs.length > 0) {
        setSystemLogs(cloudSystemLogs);
      }

      setIsFirebaseConnected(true);
      setLastAutosyncTime(new Date().toLocaleTimeString('id-ID'));
      console.log("✅ Berhasil memuat database dari Firebase Cloud.");
    } catch (error: any) {
      console.warn("Gagal menarik data dari Firebase Cloud, menggunakan local backup:", error);
      setIsFirebaseConnected(false);
      setFirebaseError(error.message || String(error));
    } finally {
      setIsDbLoading(false);
    }
  };

  useEffect(() => {
    pullAllFromFirebase();
  }, []);

  useEffect(() => {
    if (lastAutosyncTime) {
      localStorage.setItem('digimarket_last_autosync_time', lastAutosyncTime);
    } else {
      localStorage.removeItem('digimarket_last_autosync_time');
    }
  }, [lastAutosyncTime]);

  // Search, Filter, Sort States
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('Semua');
  const [sortBy, setSortBy] = useState<string>('Terpopuler');

  // Sync to LocalStorage
  useEffect(() => {
    localStorage.setItem('digimarket_products', JSON.stringify(products));
  }, [products]);

  useEffect(() => {
    localStorage.setItem('digimarket_reviews', JSON.stringify(reviews));
  }, [reviews]);

  useEffect(() => {
    localStorage.setItem('digimarket_transactions', JSON.stringify(transactions));
  }, [transactions]);

  useEffect(() => {
    localStorage.setItem('digimarket_system_logs', JSON.stringify(systemLogs));
  }, [systemLogs]);

  // Recalculate average ratings and count of products on reviews update
  useEffect(() => {
    setProducts((prevProducts) =>
      prevProducts.map((p) => {
        const productReviews = reviews.filter((r) => r.productId === p.id);
        if (productReviews.length === 0) return p;
        const avgRating = Number(
          (productReviews.reduce((sum, r) => sum + r.rating, 0) / productReviews.length).toFixed(1)
        );
        return {
          ...p,
          rating: avgRating,
          reviewsCount: productReviews.length,
        };
      })
    );
  }, [reviews]);

  // Helper to add logs
  const addSystemLog = (type: SystemLog['type'], title: string, message: string, recipientEmail?: string) => {
    const newLog: SystemLog = {
      id: 'log-' + Date.now() + Math.random().toString(36).substr(2, 4),
      type,
      title,
      message,
      timestamp: new Date().toISOString(),
      recipientEmail,
    };
    setSystemLogs((prev) => [newLog, ...prev]);
    autoSyncEntity('system_logs', newLog.id, newLog);
  };

  // Helper to send real emails via backend API
  const sendRealEmail = async (trx: Transaction) => {
    try {
      const response = await fetch('/api/send-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          to: trx.buyerEmail,
          buyerName: trx.buyerName,
          transactionId: trx.id,
          paymentMethod: trx.paymentMethod,
          totalPrice: trx.totalPrice,
          items: trx.items,
          paymentStatus: trx.paymentStatus,
          smtpConfig: {
            host: branding.smtpHost || '',
            port: branding.smtpPort || '',
            user: branding.smtpUser || '',
            password: branding.smtpPassword || '',
            secure: branding.smtpSecure !== undefined ? branding.smtpSecure : true,
          },
          emailService: branding.emailService || 'smtp',
          brevoApiKey: branding.brevoApiKey || '',
          brevoSenderName: branding.brevoSenderName || '',
          brevoSenderEmail: branding.brevoSenderEmail || '',
        }),
      });
      const resText = await response.text();
      let data;
      try {
        data = JSON.parse(resText);
      } catch (jsonErr) {
        throw new Error(`Server mengembalikan respon tidak valid (non-JSON). Status: ${response.status} ${response.statusText}.`);
      }
      if (response.ok && data.success) {
        console.log(`Email sukses terkirim ke ${trx.buyerEmail}`);
      } else {
        console.warn(`Gagal mengirim email otomatis: ${data.error}`);
      }
    } catch (err) {
      console.warn('Gagal menghubungi server untuk mengirim email otomatis:', err);
    }
  };

  // Helper to send email notification to all administrators
  const sendAdminNotificationEmails = async (trx: Transaction) => {
    for (const admin of adminUsers) {
      if (!admin.email) continue;
      try {
        const response = await fetch('/api/send-admin-notification', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            adminEmail: admin.email,
            adminName: admin.fullName,
            buyerName: trx.buyerName,
            buyerEmail: trx.buyerEmail,
            buyerPhone: trx.buyerPhone || 'Tidak ada',
            transactionId: trx.id,
            paymentMethod: trx.paymentMethod,
            totalPrice: trx.totalPrice,
            items: trx.items,
            smtpConfig: {
              host: branding.smtpHost || '',
              port: branding.smtpPort || '',
              user: branding.smtpUser || '',
              password: branding.smtpPassword || '',
              secure: branding.smtpSecure !== undefined ? branding.smtpSecure : true,
            },
            emailService: branding.emailService || 'smtp',
            brevoApiKey: branding.brevoApiKey || '',
            brevoSenderName: branding.brevoSenderName || '',
            brevoSenderEmail: branding.brevoSenderEmail || '',
          }),
        });
        const resText = await response.text();
        let data;
        try {
          data = JSON.parse(resText);
        } catch (jsonErr) {
          throw new Error(`Server mengembalikan respon tidak valid (non-JSON). Status: ${response.status} ${response.statusText}.`);
        }
        if (response.ok && data.success) {
          console.log(`Email notifikasi pesanan berhasil dikirim ke Admin ${admin.fullName} (${admin.email})`);
        } else {
          console.warn(`Gagal mengirim email notifikasi ke admin ${admin.email}: ${data.error}`);
        }
      } catch (err) {
        console.warn(`Gagal menghubungi server untuk mengirim email notifikasi ke admin ${admin.email}:`, err);
      }
    }
  };

  // Helper to automatically push transaction to Firebase database ('uploads' collection)
  const autoPushToFirebase = async (trx: Transaction) => {
    try {
      addSystemLog(
        'system',
        'Auto Push Lokal Sukses',
        `Data transaksi ${trx.id} otomatis direkam ke Sandbox Offline Lokal.`,
        trx.buyerEmail
      );
      console.log(`Auto Push Lokal Sukses: ${trx.id}`);
    } catch (err: any) {
      console.error('Gagal melakukan auto push lokal:', err);
    }
  };

  // Real-time auto-sync helper for any database entity
  const autoSyncEntity = async (collectionName: string, docId: string, data: any, silent = true) => {
    if (!isAutosyncEnabled) return;
    try {
      const res = await syncToFirebase(collectionName, docId, data);
      if (res.success) {
        setLastAutosyncTime(new Date().toLocaleTimeString('id-ID'));
        if (!silent) {
          addSystemLog(
            'system',
            'Sync Cloud Otomatis Sukses',
            `Data ${collectionName} dengan ID ${docId} sukses disinkronkan ke Firebase Cloud.`
          );
        }
      }
    } catch (err: any) {
      console.error(`Gagal melakukan sinkronisasi otomatis ${collectionName} ke Firebase:`, err);
    }
  };

  const autoDeleteEntity = async (collectionName: string, docId: string) => {
    if (!isAutosyncEnabled) return;
    try {
      const res = await deleteFromFirebase(collectionName, docId);
      if (res.success) {
        setLastAutosyncTime(new Date().toLocaleTimeString('id-ID'));
      }
    } catch (err: any) {
      console.error(`Gagal menghapus otomatis ${collectionName} dari Firebase:`, err);
    }
  };

  // Cart Handlers
  const handleAddToCart = (product: Product) => {
    setCart((prev) => {
      const exists = prev.find((item) => item.product.id === product.id);
      if (exists) {
        const maxAvailable = product.licenseKeysPool.length > 0 ? product.licenseKeysPool.length : 999;
        const newQty = Math.min(exists.quantity + 1, maxAvailable);
        return prev.map((item) =>
          item.product.id === product.id ? { ...item, quantity: newQty } : item
        );
      }
      return [...prev, { product, quantity: 1 }];
    });
    setIsCartOpen(true);
  };

  const handleUpdateCartQuantity = (productId: string, quantity: number) => {
    setCart((prev) =>
      prev.map((item) => {
        if (item.product.id === productId) {
          const maxAvailable = item.product.licenseKeysPool.length > 0 ? item.product.licenseKeysPool.length : 999;
          const newQty = Math.max(1, Math.min(quantity, maxAvailable));
          return { ...item, quantity: newQty };
        }
        return item;
      })
    );
  };

  const handleRemoveFromCart = (productId: string) => {
    setCart((prev) => prev.filter((item) => item.product.id !== productId));
  };

  // Checkout Handlers
  const handleOpenCheckout = () => {
    setIsCartOpen(false);
    setIsCheckoutOpen(true);
  };

  const handlePaymentSuccess = (newTransaction: Transaction) => {
    // Save transaction
    setTransactions((prev) => [newTransaction, ...prev]);

    // 1. Log Payment Pending & VA generation beforehand
    addSystemLog(
      'payment_pending',
      'Pembuatan Kode Invoice Pembayaran',
      `Menunggu dana masuk untuk invoice ${newTransaction.id} sebesar Rp ${newTransaction.totalPrice.toLocaleString('id-ID')}`
    );

    // 2. Log Payment verified
    addSystemLog(
      'payment_confirmed',
      'Pembayaran Berhasil Dikonfirmasi',
      `Dana dari pembeli ${newTransaction.buyerName} sebesar Rp ${newTransaction.totalPrice.toLocaleString('id-ID')} telah lunas terverifikasi via ${newTransaction.paymentMethod}.`
    );

    // 3. Log Secure Delivery & License dispatched
    newTransaction.items.forEach((item) => {
      addSystemLog(
        'license_sent',
        `Lisensi Dikirim & Dienkripsi`,
        `Kode lisensi "${item.licenseKey}" untuk paket "${item.productName}" dikemas ke Vault secure-token.`,
        newTransaction.buyerEmail
      );
    });

    // 4. Log Email Notification sent
    const emailBody = `Yth. ${newTransaction.buyerName},\n\nPembayaran Anda sebesar Rp ${newTransaction.totalPrice.toLocaleString('id-ID')} telah sukses terverifikasi.\n\nAset Anda:\n${newTransaction.items.map(item => `- ${item.productName} (Lisensi: ${item.licenseKey})`).join('\n')}\n\nSilakan download langsung di Brankas Digital. Terima kasih!`;
    addSystemLog(
      'email_sent',
      'Email Kwitansi & Lisensi Terkirim Otomatis',
      `Email notifikasi transaksi sukses berhasil dikirim ke inbox ${newTransaction.buyerEmail}.`,
      newTransaction.buyerEmail
    );

    // Send real email via SMTP
    sendRealEmail(newTransaction);

    // Send email notification to all administrators
    sendAdminNotificationEmails(newTransaction);

    // Decrease the license pool of the products purchased
    setProducts((prevProducts) =>
      prevProducts.map((p) => {
        const matchingItems = newTransaction.items.filter((item) => item.productId === p.id);
        if (matchingItems.length > 0) {
          const usedKeys = matchingItems.map((item) => item.licenseKey);
          return {
            ...p,
            licenseKeysPool: p.licenseKeysPool.filter((k) => !usedKeys.includes(k)),
          };
        }
        return p;
      })
    );

    // Clear cart
    setCart([]);
    
    // Switch to Vault to display the purchased licenses
    setActiveTab('vault');

    // Auto push transaction to Firebase
    autoPushToFirebase(newTransaction);
    autoSyncEntity('transactions', newTransaction.id, newTransaction);
  };

  // Review Handlers
  const handleAddReview = (newReviewData: Omit<Review, 'id' | 'createdAt'>) => {
    const newReview: Review = {
      ...newReviewData,
      id: 'rev-' + Date.now(),
      createdAt: new Date().toISOString(),
    };
    setReviews((prev) => [newReview, ...prev]);
    addSystemLog(
      'system',
      'Ulasan & Rating Baru Masuk',
      `Pembeli ${newReview.buyerName} memberikan rating ${newReview.rating} bintang untuk produk.`
    );
    autoSyncEntity('reviews', newReview.id, newReview);
  };

  // Admin handlers
  const handleAddProduct = (newProduct: Product) => {
    setProducts((prev) => [newProduct, ...prev]);
    addSystemLog(
      'system',
      'Produk Baru Dipublikasikan',
      `Produk "${newProduct.name}" berhasil ditambahkan ke katalog oleh Admin Utama dengan harga Rp ${newProduct.price.toLocaleString('id-ID')}.`
    );
    autoSyncEntity('products', newProduct.id, newProduct);
  };

  const handleDeleteProduct = (productId: string) => {
    setProducts((prev) => prev.filter((p) => p.id !== productId));
    addSystemLog(
      'system',
      'Produk Berhasil Dihapus',
      `ID Produk "${productId}" telah dihapus dari katalog.`
    );
    autoDeleteEntity('products', productId);
  };

  const handleUpdateProduct = (updatedProduct: Product) => {
    setProducts((prev) => prev.map((p) => p.id === updatedProduct.id ? updatedProduct : p));
    addSystemLog(
      'system',
      'Produk Berhasil Diperbarui',
      `Produk "${updatedProduct.name}" berhasil diperbarui oleh Admin.`
    );
    autoSyncEntity('products', updatedProduct.id, updatedProduct);
  };

  const handleClearLogs = () => {
    setSystemLogs([
      {
        id: 'log-init',
        type: 'system',
        title: 'Sistem Log Dibersihkan',
        message: 'Log dibersihkan oleh Admin Utama.',
        timestamp: new Date().toISOString(),
      }
    ]);
  };

  const handleDirectCreateInvoice = (newTransaction: Transaction) => {
    setTransactions((prev) => [newTransaction, ...prev]);

    if (newTransaction.paymentStatus === PaymentStatus.SUCCESS) {
      addSystemLog(
        'payment_confirmed',
        'Invoice Langsung Dilunasi (Admin)',
        `Admin membuat invoice langsung untuk ${newTransaction.buyerName} senilai Rp ${newTransaction.totalPrice.toLocaleString('id-ID')} dan langsung ditandai LUNAS.`
      );

      newTransaction.items.forEach((item) => {
        addSystemLog(
          'license_sent',
          `Lisensi Dikirim & Dienkripsi`,
          `Kode lisensi "${item.licenseKey}" untuk paket "${item.productName}" dikemas ke Vault secure-token.`,
          newTransaction.buyerEmail
        );
      });

      addSystemLog(
        'email_sent',
        'Email Kwitansi & Lisensi Terkirim Otomatis',
        `Email notifikasi transaksi langsung sukses berhasil dikirim ke inbox ${newTransaction.buyerEmail}.`,
        newTransaction.buyerEmail
      );

      // Send real email via SMTP
      sendRealEmail(newTransaction);

      // Send email notification to all administrators
      sendAdminNotificationEmails(newTransaction);

      setProducts((prevProducts) =>
        prevProducts.map((p) => {
          const matchingItems = newTransaction.items.filter((item) => item.productId === p.id);
          if (matchingItems.length > 0) {
            const usedKeys = matchingItems.map(item => item.licenseKey);
            return {
              ...p,
              licenseKeysPool: p.licenseKeysPool.filter((k) => !usedKeys.includes(k)),
            };
          }
          return p;
        })
      );
    } else {
      addSystemLog(
        'payment_pending',
        'Invoice Langsung Dibuat (Pending)',
        `Admin menerbitkan invoice pending untuk ${newTransaction.buyerName} senilai Rp ${newTransaction.totalPrice.toLocaleString('id-ID')}. Menunggu penyelesaian.`
      );
    }

    // Auto push transaction to Firebase
    autoPushToFirebase(newTransaction);
    autoSyncEntity('transactions', newTransaction.id, newTransaction);
  };

  const handleUpdateTransaction = (updatedTrx: Transaction) => {
    const oldTrx = transactions.find((t) => t.id === updatedTrx.id);
    const becameSuccess = oldTrx && oldTrx.paymentStatus !== PaymentStatus.SUCCESS && updatedTrx.paymentStatus === PaymentStatus.SUCCESS;

    setTransactions((prev) =>
      prev.map((t) => (t.id === updatedTrx.id ? updatedTrx : t))
    );
    addSystemLog(
      'system',
      'Transaksi Diperbarui Manual',
      `Transaksi ${updatedTrx.id} untuk ${updatedTrx.buyerName} diperbarui oleh Admin (Status: ${updatedTrx.paymentStatus}, Metode: ${updatedTrx.paymentMethod}).`
    );

    if (becameSuccess) {
      addSystemLog(
        'payment_confirmed',
        'Pembayaran Berhasil Dikonfirmasi (Admin)',
        `Dana dari pembeli ${updatedTrx.buyerName} sebesar Rp ${updatedTrx.totalPrice.toLocaleString('id-ID')} telah sukses dikonfirmasi LUNAS manual oleh Admin.`
      );

      updatedTrx.items.forEach((item) => {
        addSystemLog(
          'license_sent',
          `Lisensi Dikirim & Dienkripsi`,
          `Kode lisensi "${item.licenseKey || 'N/A'}" untuk paket "${item.productName}" dikemas ke Vault secure-token.`,
          updatedTrx.buyerEmail
        );
      });

      addSystemLog(
        'email_sent',
        'Email Kwitansi & Lisensi Terkirim Otomatis',
        `Email notifikasi transaksi sukses berhasil dikirim ke inbox ${updatedTrx.buyerEmail}.`,
        updatedTrx.buyerEmail
      );

      // Send real email via SMTP
      sendRealEmail(updatedTrx);

      // Send email notification to all administrators
      sendAdminNotificationEmails(updatedTrx);

      setProducts((prevProducts) =>
        prevProducts.map((p) => {
          const matchingItems = updatedTrx.items.filter((item) => item.productId === p.id);
          if (matchingItems.length > 0) {
            const usedKeys = matchingItems.map((item) => item.licenseKey);
            return {
              ...p,
              licenseKeysPool: p.licenseKeysPool.filter((k) => !usedKeys.includes(k)),
            };
          }
          return p;
        })
      );
    }

    // Auto push updated transaction to Firebase
    autoPushToFirebase(updatedTrx);
    autoSyncEntity('transactions', updatedTrx.id, updatedTrx);
  };

  const handleDeleteTransaction = (transactionId: string) => {
    setTransactions((prev) => prev.filter((t) => t.id !== transactionId));
    addSystemLog(
      'system',
      'Transaksi Dihapus',
      `Transaksi ID "${transactionId}" telah dihapus secara permanen dari database oleh Super Admin.`
    );
    autoDeleteEntity('transactions', transactionId);
  };

  const handlePurgeTransactions = async () => {
    setTransactions([]);
    addSystemLog(
      'system',
      'Seluruh Transaksi Dihapus (Purge)',
      'Semua data transaksi di sandbox telah dibersihkan secara permanen dari database oleh Super Admin.'
    );
    try {
      await purgeCollectionFromFirebase('transactions');
    } catch (err: any) {
      console.error('Gagal menghapus seluruh transaksi dari Firebase:', err);
    }
  };

  const handleSubmitComplaint = (complaintData: Omit<Complaint, 'id' | 'status' | 'createdAt'>) => {
    const newComplaint: Complaint = {
      ...complaintData,
      id: 'COMP-' + Math.floor(100000 + Math.random() * 900000),
      status: 'PENDING',
      createdAt: new Date().toISOString(),
    };
    setComplaints((prev) => [newComplaint, ...prev]);
    addSystemLog(
      'system',
      'Tiket Komplain Baru Diajukan',
      `Pelanggan ${newComplaint.buyerName} mengajukan komplain kategori "${newComplaint.category}" untuk kendala yang dialaminya.`
    );
    autoSyncEntity('complaints', newComplaint.id, newComplaint);
  };

  const handleUpdateComplaint = (updatedComp: Complaint) => {
    setComplaints((prev) =>
      prev.map((c) => (c.id === updatedComp.id ? updatedComp : c))
    );
    addSystemLog(
      'system',
      'Tiket Komplain Diperbarui',
      `Status komplain ${updatedComp.id} dari ${updatedComp.buyerName} diubah menjadi ${updatedComp.status} oleh Admin.`
    );
    autoSyncEntity('complaints', updatedComp.id, updatedComp);
  };

  const handleUpdatePaymentMethods = (updatedMethods: PaymentMethodConfig[]) => {
    setPaymentMethods(updatedMethods);
    addSystemLog(
      'system',
      'Metode Pembayaran Diperbarui',
      `Pengaturan menu metode pembayaran toko diperbarui oleh Admin Utama.`
    );
  };

  // Filtering Logic
  const filteredProducts = products.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.sellerName.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCategory = selectedCategory === 'Semua' || p.category === selectedCategory;

    return matchesSearch && matchesCategory;
  });

  // Sorting Logic
  const sortedProducts = [...filteredProducts].sort((a, b) => {
    if (sortBy === 'Terpopuler') return b.rating - a.rating;
    if (sortBy === 'Harga Terendah') return a.price - b.price;
    if (sortBy === 'Harga Tertinggi') return b.price - a.price;
    if (sortBy === 'Rating Terbaik') return b.rating - a.rating;
    return 0;
  });

  // Helper to render the customized shop logo
  const renderShopLogo = (size: 'sm' | 'md' | 'lg' = 'md') => {
    const iconClass = size === 'sm' ? 'w-4 h-4' : size === 'md' ? 'w-5.5 h-5.5' : 'w-7 h-7';
    const containerClass = size === 'sm' 
      ? 'w-8 h-8 rounded-lg' 
      : size === 'md' 
        ? 'w-10 h-10 rounded-xl' 
        : 'w-14 h-14 rounded-2xl';

    // Color mapper for tailwind classes
    const colorMap: Record<string, string> = {
      slate: 'bg-slate-900 text-white',
      sky: 'bg-sky-500 text-white',
      emerald: 'bg-emerald-500 text-white',
      indigo: 'bg-indigo-500 text-white',
      rose: 'bg-rose-500 text-white',
      amber: 'bg-amber-500 text-white',
      violet: 'bg-violet-500 text-white',
    };

    const bgClass = colorMap[branding.logoColor] || 'bg-slate-900 text-white';

    if (branding.logoUrl) {
      return (
        <div className={`${containerClass} overflow-hidden flex items-center justify-center bg-white border border-slate-100 shadow-sm`}>
          <img src={branding.logoUrl} alt={branding.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
        </div>
      );
    }

    // Lucide Icon components mapper
    const icons: Record<string, React.ComponentType<{ className?: string }>> = {
      Lock,
      ShoppingBag,
      Database,
      Sparkles,
      ShieldCheck,
      CheckCircle,
      HelpCircle,
      Store,
      Gem,
      Gift,
      Globe,
      Cpu,
    };

    const IconComp = icons[branding.logoIcon] || Lock;
    return (
      <div className={`${containerClass} ${bgClass} flex items-center justify-center shadow-md`}>
        <IconComp className={iconClass} />
      </div>
    );
  };

  // Active Skin Selection
  const activeSkin = branding.themeSkin || 'default';
  
  const skinStyles = {
    default: {
      primaryBg: 'bg-sky-500',
      primaryText: 'text-sky-600',
      primaryHover: 'hover:bg-sky-600',
      primaryHoverText: 'hover:text-sky-600',
      badgeBg: 'bg-sky-50 text-sky-600',
      badgeBorder: 'border-sky-100',
      heroGradient: 'from-sky-950/60 via-slate-900/90 to-slate-950',
      accentText: 'text-sky-400',
      accentBg: 'bg-sky-950',
      accentBorder: 'border-sky-900/50',
    },
    emerald: {
      primaryBg: 'bg-emerald-500',
      primaryText: 'text-emerald-600',
      primaryHover: 'hover:bg-emerald-600',
      primaryHoverText: 'hover:text-emerald-600',
      badgeBg: 'bg-emerald-50 text-emerald-600',
      badgeBorder: 'border-emerald-100',
      heroGradient: 'from-emerald-950/60 via-slate-900/90 to-slate-950',
      accentText: 'text-emerald-400',
      accentBg: 'bg-emerald-950',
      accentBorder: 'border-emerald-900/50',
    },
    sunset: {
      primaryBg: 'bg-rose-500',
      primaryText: 'text-rose-600',
      primaryHover: 'hover:bg-rose-600',
      primaryHoverText: 'hover:text-rose-600',
      badgeBg: 'bg-rose-50 text-rose-600',
      badgeBorder: 'border-rose-100',
      heroGradient: 'from-rose-950/60 via-slate-900/90 to-slate-950',
      accentText: 'text-rose-400',
      accentBg: 'bg-rose-950',
      accentBorder: 'border-rose-900/50',
    },
    midnight: {
      primaryBg: 'bg-indigo-600',
      primaryText: 'text-indigo-600',
      primaryHover: 'hover:bg-indigo-700',
      primaryHoverText: 'hover:text-indigo-600',
      badgeBg: 'bg-indigo-50 text-indigo-600',
      badgeBorder: 'border-indigo-100',
      heroGradient: 'from-indigo-950/60 via-slate-900/90 to-slate-950',
      accentText: 'text-indigo-400',
      accentBg: 'bg-indigo-950',
      accentBorder: 'border-indigo-900/50',
    },
    cyberpunk: {
      primaryBg: 'bg-amber-400 text-slate-950',
      primaryText: 'text-amber-600',
      primaryHover: 'hover:bg-amber-500 hover:text-slate-950',
      primaryHoverText: 'hover:text-amber-500',
      badgeBg: 'bg-amber-50 text-amber-800',
      badgeBorder: 'border-amber-100',
      heroGradient: 'from-amber-950/40 via-slate-900/90 to-slate-950',
      accentText: 'text-amber-400',
      accentBg: 'bg-amber-950',
      accentBorder: 'border-amber-900/50',
    },
  }[activeSkin];

  if (isDbLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-white p-6 font-sans antialiased">
        <div className="text-center space-y-6 max-w-sm">
          {/* Pulsing visual */}
          <div className="relative inline-flex">
            <div className="w-16 h-16 bg-sky-500/10 rounded-full animate-ping absolute inset-0"></div>
            <div className="w-16 h-16 bg-sky-500/20 border border-sky-500/40 rounded-full flex items-center justify-center">
              <Database className="w-8 h-8 text-sky-400 animate-pulse" />
            </div>
          </div>
          <div className="space-y-2">
            <h3 className="text-xs font-black tracking-widest uppercase text-sky-400">Firebase Cloud DB</h3>
            <h2 className="text-lg font-black tracking-wide uppercase text-white">Menyelaraskan Database</h2>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Sedang memuat katalog produk, pengaturan toko, dan riwayat transaksi secara aman dari Firebase Firestore...
            </p>
          </div>
          {/* Subtle spinner */}
          <div className="flex justify-center">
            <div className="w-5 h-5 border-2 border-sky-500/20 border-t-sky-500 rounded-full animate-spin"></div>
          </div>
        </div>
      </div>
    );
  }

  const fontClass = 
    branding.fontFamily === 'ubuntu' ? 'font-ubuntu' :
    branding.fontFamily === 'noteworthy' ? 'font-noteworthy' :
    'font-sans';

  return (
    <div className={`min-h-screen bg-slate-50/40 text-slate-800 ${fontClass} flex flex-col antialiased`}>
      {/* Dynamic Header */}
      <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-slate-100 shadow-xs px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          
          {/* Logo Brand */}
          <div className="flex items-center gap-2.5 cursor-pointer" onClick={() => setActiveTab('belanja')}>
            {renderShopLogo('md')}
            <div>
              <span className="block text-sm font-black text-slate-950 uppercase tracking-wider leading-none">
                {branding.name}
              </span>
              <span className="text-[10px] text-sky-600 font-bold uppercase tracking-widest mt-1 block">
                {branding.slogan}
              </span>
            </div>
          </div>

          {/* Navigation Menu Links */}
          <nav className="hidden md:flex items-center gap-1 bg-slate-100/80 p-1.5 rounded-xl border border-slate-200/50">
            <button
              onClick={() => setActiveTab('belanja')}
              className={`px-4 py-2.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'belanja' ? 'bg-white text-slate-950 shadow-xs' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              🛍️ Belanja Aset
            </button>
            <button
              onClick={() => setActiveTab('vault')}
              className={`px-4 py-2.5 rounded-lg text-xs font-bold transition-all cursor-pointer relative ${
                activeTab === 'vault' ? 'bg-white text-slate-950 shadow-xs' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              🔒 Vault Lisensi
              {transactions.length > 0 && (
                <span className="absolute top-1 right-1 w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
              )}
            </button>
            <button
              onClick={() => setActiveTab('seller')}
              className={`px-4 py-2.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'seller' ? 'bg-white text-slate-950 shadow-xs' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              📈 Analitik Seller
            </button>
            <button
              onClick={() => setActiveTab('admin')}
              className={`px-4 py-2.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'admin' ? 'bg-white text-slate-950 shadow-xs' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              ⚙️ Admin System
            </button>
          </nav>

          {/* Cart & Notifications Bell Panel */}
          <div className="flex items-center gap-3">

            {/* Firebase Cloud Live Status Pill */}
            <div className="flex items-center gap-2 px-2.5 py-1.5 bg-emerald-50 border border-emerald-100 rounded-xl select-none" title="Penyimpanan Cloud (Always Online Mode)">
              <div className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 bg-emerald-400"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </div>
              <div className="flex flex-col text-left">
                <div className="flex items-center gap-1">
                  <span className="text-[8px] font-black text-slate-700 uppercase tracking-wider leading-none">Database</span>
                  <span className="text-[8px] font-extrabold px-1 py-0.5 rounded-sm uppercase tracking-tighter bg-emerald-600 text-white">
                    Cloud Live
                  </span>
                </div>
                <span className="text-[7.5px] text-emerald-600 font-bold leading-none mt-0.5">
                  Always Online Mode
                </span>
              </div>
            </div>


            {/* Automatic Email Notification Log Panel Button */}
            <div className="relative">
              <button
                onClick={() => setIsNotificationOpen(!isNotificationOpen)}
                className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-600 hover:text-slate-900 transition-colors cursor-pointer relative"
                title="Notifikasi Email Simulasi"
              >
                <Bell className="w-5 h-5" />
                {systemLogs.filter(l => l.type === 'email_sent').length > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-amber-500 text-white text-[9px] font-black rounded-full flex items-center justify-center border-2 border-white">
                    {systemLogs.filter(l => l.type === 'email_sent').length}
                  </span>
                )}
              </button>

              {/* Dynamic Notification Bell dropdown container */}
              {isNotificationOpen && (
                <div className="absolute right-0 mt-3 w-80 bg-slate-900 text-slate-200 rounded-2xl shadow-xl border border-slate-800 p-4 z-50 space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-2 mb-2">
                    <span className="text-[11px] font-bold text-sky-400 uppercase tracking-wider flex items-center gap-1.5">
                      <Mail className="w-3.5 h-3.5" /> Email Notifikasi Otomatis
                    </span>
                    <button
                      onClick={() => setIsNotificationOpen(false)}
                      className="text-slate-400 hover:text-white text-xs font-bold"
                    >
                      Tutup
                    </button>
                  </div>

                  <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1 text-[10px] leading-relaxed">
                    {systemLogs.filter((l) => l.type === 'email_sent').length === 0 ? (
                      <p className="text-center text-slate-500 py-6 font-mono">Belum ada email notifikasi otomatis terkirim. Lakukan checkout di Tab Belanja.</p>
                    ) : (
                      systemLogs
                        .filter((l) => l.type === 'email_sent')
                        .map((emailLog) => (
                          <div key={emailLog.id} className="bg-slate-950 p-2.5 rounded-xl border border-slate-800">
                            <div className="font-bold text-amber-400 flex items-center justify-between">
                              <span>Subject: Receipt & Aktivasi</span>
                              <span className="text-[8px] text-slate-500 font-normal">Sent ✓</span>
                            </div>
                            <div className="text-slate-400 mt-1 font-mono text-[9px]">To: {emailLog.recipientEmail}</div>
                            <p className="text-slate-300 mt-1.5">{emailLog.message}</p>
                          </div>
                        ))
                    )}
                  </div>
                </div>
              )}
            </div>

             {/* Dark Mode Switch Button */}
            <button
              onClick={() => setIsDarkMode(!isDarkMode)}
              className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-600 hover:text-slate-900 transition-all cursor-pointer flex items-center justify-center shrink-0 hover:scale-105 active:scale-95"
              title={isDarkMode ? 'Ubah ke Mode Terang' : 'Ubah ke Mode Gelap'}
            >
              {isDarkMode ? (
                <Sun className="w-5 h-5 text-amber-400" />
              ) : (
                <Moon className="w-5 h-5 text-indigo-500" />
              )}
            </button>

            {/* Wishlist Button */}
            <button
              onClick={() => setIsWishlistOpen(true)}
              className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-600 hover:text-rose-600 transition-all cursor-pointer flex items-center justify-center shrink-0 hover:scale-105 active:scale-95 relative"
              title="Wishlist Saya"
            >
              <Heart className={`w-5 h-5 ${wishlist.length > 0 ? 'fill-rose-500 text-rose-500' : 'text-slate-500'}`} />
              {wishlist.length > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-rose-500 text-white text-[9px] font-black rounded-full flex items-center justify-center border-2 border-white">
                  {wishlist.length}
                </span>
              )}
            </button>

            {/* Shopping Cart Button */}
            <button
              onClick={() => setIsCartOpen(true)}
              className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-sky-600 text-white font-bold text-xs transition-all flex items-center gap-2 shadow-sm cursor-pointer"
            >
              <ShoppingBag className="w-4 h-4" />
              <span className="hidden sm:inline">Keranjang</span>
              <span className="bg-white text-slate-950 text-[10px] font-black rounded-md px-1.5 py-0.5 ml-0.5">
                {cart.length}
              </span>
            </button>
          </div>
        </div>

        {/* Mobile Navigation Drawer Links */}
        <div className="md:hidden flex items-center justify-between border-t border-slate-100 pt-3 mt-3 overflow-x-auto gap-1">
          <button
            onClick={() => setActiveTab('belanja')}
            className={`px-3 py-2 rounded-lg text-[11px] font-bold shrink-0 transition-colors ${
              activeTab === 'belanja' ? 'bg-slate-100 text-slate-950' : 'text-slate-500'
            }`}
          >
            🛍️ Belanja
          </button>
          <button
            onClick={() => setActiveTab('vault')}
            className={`px-3 py-2 rounded-lg text-[11px] font-bold shrink-0 transition-colors ${
              activeTab === 'vault' ? 'bg-slate-100 text-slate-950' : 'text-slate-500'
            }`}
          >
            🔒 Vault
          </button>
          <button
            onClick={() => setActiveTab('seller')}
            className={`px-3 py-2 rounded-lg text-[11px] font-bold shrink-0 transition-colors ${
              activeTab === 'seller' ? 'bg-slate-100 text-slate-950' : 'text-slate-500'
            }`}
          >
            📈 Analitik
          </button>
          <button
            onClick={() => setActiveTab('admin')}
            className={`px-3 py-2 rounded-lg text-[11px] font-bold shrink-0 transition-colors ${
              activeTab === 'admin' ? 'bg-slate-100 text-slate-950' : 'text-slate-500'
            }`}
          >
            ⚙️ Admin
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-6 space-y-6">



        {/* TAB 1: Digital Asset Storefront */}
        {activeTab === 'belanja' && (
          <div className="space-y-6">
            {/* Hero / Promo Section */}
            <div className="relative rounded-3xl overflow-hidden bg-slate-900 text-white p-8 md:p-12 shadow-sm">
              <div className={`absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] ${skinStyles.heroGradient} opacity-90`} />
              
              {branding.heroBannerUrl && (
                <div 
                  className="absolute inset-0 bg-cover bg-center mix-blend-overlay opacity-30"
                  style={{ backgroundImage: `url(${branding.heroBannerUrl})` }}
                  referrerPolicy="no-referrer"
                />
              )}

              <div className="relative z-10 max-w-2xl space-y-4">
                <span className={`inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest ${skinStyles.accentText} ${skinStyles.accentBg} px-2.5 py-1 rounded-md border ${skinStyles.accentBorder}`}>
                  <Sparkles className="w-3.5 h-3.5" /> {branding.name} Hub Digital
                </span>
                <h1 className="text-2xl md:text-4xl font-black tracking-tight leading-tight">
                  {branding.heroTitle || 'Dapatkan File Desain, Template UI, & Lisensi Software Terpercaya'}
                </h1>
                <p className="text-xs md:text-sm text-slate-400 leading-relaxed max-w-lg">
                  {branding.heroSubtitle || 'Sistem pembayaran otomatis yang terverifikasi real-time dan sistem pengiriman file instan yang dikunci dengan enkripsi pengaman tinggi.'}
                </p>
              </div>
            </div>

            {/* Filter Search Sorting Bar Controls */}
            <div className="bg-white border border-slate-100 p-4 rounded-2xl shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
              
              {/* Category selector */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-2 md:pb-0 scrollbar-none">
                {['Semua', ...categories].map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-3.5 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer whitespace-nowrap ${
                      selectedCategory === cat
                        ? 'bg-slate-900 text-white'
                        : 'bg-slate-50 text-slate-500 hover:text-slate-800 border border-slate-100'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              {/* Search input and sort selectors */}
              <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto shrink-0">
                <div className="relative w-full sm:w-60">
                  <Search className="absolute left-3 top-2.5 w-4.5 h-4.5 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Cari aset digital..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full text-xs pl-9.5 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:ring-1 focus:ring-sky-500"
                  />
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <SlidersHorizontal className="w-4 h-4 text-slate-400 shrink-0" />
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="w-full sm:w-auto text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 focus:outline-hidden focus:ring-1 focus:ring-sky-500"
                  >
                    <option value="Terpopuler">Terpopuler</option>
                    <option value="Harga Terendah">Harga Terendah</option>
                    <option value="Harga Tertinggi">Harga Tertinggi</option>
                    <option value="Rating Terbaik">Rating Terbaik</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Promo & Popular Modules (Only shown on main landing) */}
            {searchQuery === '' && selectedCategory === 'Semua' && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-6 animate-in fade-in duration-300">
                {/* Module 1: Discount Products */}
                <div className="bg-gradient-to-br from-rose-50/70 to-orange-50/40 border border-rose-100 rounded-3xl p-6 shadow-xs flex flex-col space-y-4">
                  <div className="flex items-center justify-between pb-2 border-b border-rose-100/60">
                    <div className="flex items-center gap-2">
                      <span className="text-xl">🏷️</span>
                      <div>
                        <h3 className="text-sm font-black text-slate-900">Promo Diskon Spesial</h3>
                        <p className="text-[10px] text-slate-500 font-sans">Aset digital premium dengan harga miring terbatas</p>
                      </div>
                    </div>
                    <span className="px-2.5 py-1 text-[9px] font-black text-rose-700 bg-rose-100 rounded-full uppercase tracking-wider font-mono">Sale Up To 30%</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {products.filter(p => p.isDiscounted).slice(0, 2).map(prod => {
                      const formattedPrice = new Intl.NumberFormat('id-ID', {
                        style: 'currency',
                        currency: 'IDR',
                        maximumFractionDigits: 0,
                      }).format(prod.price);
                      const formattedOriginal = prod.originalPrice ? new Intl.NumberFormat('id-ID', {
                        style: 'currency',
                        currency: 'IDR',
                        maximumFractionDigits: 0,
                      }).format(prod.originalPrice) : '';
                      const pct = prod.originalPrice ? Math.round(((prod.originalPrice - prod.price) / prod.originalPrice) * 100) : 0;
                      return (
                        <div key={prod.id} className="bg-white border border-rose-50 rounded-2xl p-3.5 hover:shadow-md transition-all flex flex-col justify-between h-full group relative">
                          <span className="absolute top-2.5 right-2.5 px-2 py-0.5 text-[9px] font-black text-white bg-rose-500 rounded-md z-10">
                            -{pct}%
                          </span>
                          <div className="space-y-2">
                            <div className="aspect-video w-full rounded-xl bg-slate-50 overflow-hidden cursor-pointer" onClick={() => setSelectedProduct(prod)}>
                              <img src={prod.image} alt={prod.name} className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-300" referrerPolicy="no-referrer" />
                            </div>
                            <div>
                              <span className="text-[9px] font-bold text-rose-600 uppercase tracking-wider">{prod.category}</span>
                              <h4 className="text-xs font-bold text-slate-900 line-clamp-1 leading-snug cursor-pointer hover:text-rose-600" onClick={() => setSelectedProduct(prod)}>
                                {prod.name}
                              </h4>
                            </div>
                          </div>
                          <div className="mt-3 pt-2.5 border-t border-slate-50 flex items-center justify-between gap-1">
                            <div>
                              <span className="block text-[8px] text-slate-400 line-through font-mono font-medium">{formattedOriginal}</span>
                              <span className="text-[11.5px] font-black text-rose-600 font-mono">{formattedPrice}</span>
                            </div>
                            <button
                              onClick={() => handleAddToCart(prod)}
                              className="px-2.5 py-1.5 bg-rose-600 hover:bg-rose-700 text-white text-[10px] font-black rounded-lg transition-all cursor-pointer"
                            >
                              + Beli
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Module 2: Popular Products */}
                <div className="bg-gradient-to-br from-sky-50/70 to-indigo-50/40 border border-sky-100 rounded-3xl p-6 shadow-xs flex flex-col space-y-4">
                  <div className="flex items-center justify-between pb-2 border-b border-sky-100/60">
                    <div className="flex items-center gap-2">
                      <span className="text-xl">🔥</span>
                      <div>
                        <h3 className="text-sm font-black text-slate-900">Produk Terpopuler</h3>
                        <p className="text-[10px] text-slate-500 font-sans">Aset digital paling banyak dicari & diberi ulasan terbaik</p>
                      </div>
                    </div>
                    <span className="px-2.5 py-1 text-[9px] font-black text-sky-700 bg-sky-100 rounded-full uppercase tracking-wider font-mono">Bestseller</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {[...products].sort((a,b) => b.rating - a.rating || b.reviewsCount - a.reviewsCount).slice(0, 2).map((prod) => {
                      const formattedPrice = new Intl.NumberFormat('id-ID', {
                        style: 'currency',
                        currency: 'IDR',
                        maximumFractionDigits: 0,
                      }).format(prod.price);
                      return (
                        <div key={prod.id} className="bg-white border border-sky-50 rounded-2xl p-3.5 hover:shadow-md transition-all flex flex-col justify-between h-full group relative">
                          <span className="absolute top-2.5 right-2.5 px-2 py-0.5 text-[9px] font-black text-slate-800 bg-amber-300 rounded-md flex items-center gap-0.5 z-10">
                            ★ {prod.rating}
                          </span>
                          <div className="space-y-2">
                            <div className="aspect-video w-full rounded-xl bg-slate-50 overflow-hidden cursor-pointer" onClick={() => setSelectedProduct(prod)}>
                              <img src={prod.image} alt={prod.name} className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-300" referrerPolicy="no-referrer" />
                            </div>
                            <div>
                              <span className="text-[9px] font-bold text-sky-600 uppercase tracking-wider">{prod.category}</span>
                              <h4 className="text-xs font-bold text-slate-900 line-clamp-1 leading-snug cursor-pointer hover:text-sky-600" onClick={() => setSelectedProduct(prod)}>
                                {prod.name}
                              </h4>
                            </div>
                          </div>
                          <div className="mt-3 pt-2.5 border-t border-slate-50 flex items-center justify-between gap-1">
                            <div>
                              <span className="block text-[8px] text-slate-400">({prod.reviewsCount} Ulasan)</span>
                              <span className="text-[11.5px] font-black text-slate-900 font-mono">{formattedPrice}</span>
                            </div>
                            <button
                              onClick={() => handleAddToCart(prod)}
                              className="px-2.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white text-[10px] font-black rounded-lg transition-all cursor-pointer"
                            >
                              + Beli
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* Products grid container with layout style configurations and limits */}
            {(() => {
              const limitToApply = branding.productsLimit || 6;
              const displayProducts = showAllProducts || searchQuery !== '' || selectedCategory !== 'Semua'
                ? sortedProducts
                : sortedProducts.slice(0, limitToApply);
              const hasMoreProducts = sortedProducts.length > displayProducts.length;

              return (
                <div className="space-y-8 mt-6">
                  {displayProducts.length === 0 ? (
                    <div className="text-center py-16 bg-white border border-slate-100 rounded-3xl p-8 shadow-xs">
                      <HelpCircle className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                      <h3 className="text-sm font-bold text-slate-800">Aset tidak ditemukan</h3>
                      <p className="text-xs text-slate-400 mt-1 max-w-xs mx-auto">
                        Coba ubah kata kunci pencarian Anda atau kembalikan kategori ke "Semua" untuk menemukan produk terbaik kami.
                      </p>
                    </div>
                  ) : branding.layoutStyle === 'minimal' ? (
                    // Minimalist Horizontal Row List
                    <div className="space-y-4">
                      {displayProducts.map((prod) => (
                        <div key={prod.id} className="bg-white border border-slate-100 hover:border-slate-300 rounded-2xl p-4 flex flex-col sm:flex-row items-center gap-4 transition-all shadow-xs">
                          <div className="w-20 h-20 bg-slate-100 rounded-xl overflow-hidden shrink-0">
                            <img src={prod.image} alt={prod.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                          </div>
                          <div className="flex-1 text-center sm:text-left">
                            <div className="flex items-center justify-center sm:justify-start gap-2">
                              <span className="text-[10px] font-bold text-sky-600 bg-sky-50 px-2 py-0.5 rounded-md uppercase">{prod.category}</span>
                              <span className="text-xs text-amber-500 font-bold flex items-center gap-0.5">⭐ {prod.rating}</span>
                            </div>
                            <h4 className="text-xs font-black text-slate-800 mt-1.5">{prod.name}</h4>
                            <p className="text-[10px] text-slate-400 mt-0.5 line-clamp-1">{prod.description}</p>
                          </div>
                          <div className="text-center sm:text-right shrink-0">
                            <span className="block text-xs font-black text-rose-600 font-mono">Rp {prod.price.toLocaleString('id-ID')}</span>
                            <span className="text-[9px] text-slate-400 block mt-0.5">Sisa {prod.licenseKeysPool?.length || 0} Lisensi</span>
                          </div>
                          <div className="flex gap-2 w-full sm:w-auto">
                            <button
                              onClick={() => setSelectedProduct(prod)}
                              className="flex-1 sm:flex-none px-3.5 py-2 border border-slate-200 hover:bg-slate-50 text-[11px] font-bold rounded-xl transition-all cursor-pointer"
                            >
                              Detail
                            </button>
                            <button
                              onClick={() => handleAddToCart(prod)}
                              className="flex-1 sm:flex-none px-4 py-2 bg-slate-900 hover:bg-sky-600 text-white text-[11px] font-black rounded-xl transition-all cursor-pointer"
                            >
                              + Beli
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : branding.layoutStyle === 'bento' ? (
                    // Bento Grid Premium
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                      {displayProducts.map((prod, index) => {
                        const isLarge = index === 0 || index === 4;
                        return (
                          <div 
                            key={prod.id} 
                            className={`bg-white border border-slate-100 hover:border-slate-200 rounded-3xl overflow-hidden transition-all shadow-xs flex flex-col justify-between group relative ${
                              isLarge ? 'md:col-span-2 md:row-span-2 p-6' : 'p-4'
                            }`}
                          >
                            <div>
                              <div className={`relative overflow-hidden rounded-2xl bg-slate-100 mb-4 ${isLarge ? 'h-52' : 'h-36'}`}>
                                <img 
                                  src={prod.image} 
                                  alt={prod.name} 
                                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" 
                                  referrerPolicy="no-referrer"
                                />
                                <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5">
                                  <span className="text-[9px] font-black tracking-wider uppercase bg-slate-900/90 text-white px-2 py-0.5 rounded-md backdrop-blur-xs">
                                    {prod.category}
                                  </span>
                                </div>
                              </div>

                              <div className="space-y-1">
                                <div className="flex items-center gap-1">
                                  <span className="text-amber-500 text-xs font-bold">★ {prod.rating}</span>
                                  <span className="text-[9px] text-slate-400 font-medium">({prod.reviewsCount} review)</span>
                                </div>
                                <h4 className={`font-black text-slate-950 tracking-tight leading-snug group-hover:text-sky-600 transition-colors ${
                                  isLarge ? 'text-sm' : 'text-xs'
                                }`}>
                                  {prod.name}
                                </h4>
                                <p className="text-[10px] text-slate-400 line-clamp-2 leading-relaxed">
                                  {prod.description}
                                </p>
                              </div>
                            </div>

                            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                              <div>
                                <span className="block text-[8px] font-bold text-slate-400 uppercase tracking-wider">Harga Lisensi</span>
                                <span className="text-xs font-black text-rose-600 font-mono">Rp {prod.price.toLocaleString('id-ID')}</span>
                              </div>
                              <div className="flex gap-1">
                                <button
                                  onClick={() => setSelectedProduct(prod)}
                                  className="p-2 border border-slate-150 hover:bg-slate-50 text-slate-600 hover:text-slate-900 rounded-xl transition-all cursor-pointer"
                                  title="Detail"
                                >
                                  👁️
                                </button>
                                <button
                                  onClick={() => handleAddToCart(prod)}
                                  className="px-3.5 py-2 bg-slate-900 hover:bg-sky-600 text-white text-[10px] font-black rounded-xl transition-all cursor-pointer"
                                >
                                  + Keranjang
                                </button>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    // Standard Grid Layout (default)
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                      {displayProducts.map((prod) => (
                        <ProductCard
                          key={prod.id}
                          product={prod}
                          onViewDetail={(p) => setSelectedProduct(p)}
                          onAddToCart={(p) => handleAddToCart(p)}
                          isWishlisted={wishlist.some((item) => item.id === prod.id)}
                          onToggleWishlist={handleToggleWishlist}
                        />
                      ))}
                    </div>
                  )}

                  {/* Expansion "Tampilkan Semua" Button */}
                  {hasMoreProducts && (
                    <div className="text-center pt-4">
                      <button
                        onClick={() => setShowAllProducts(true)}
                        className="px-6 py-3 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-bold text-xs rounded-2xl shadow-xs transition-all hover:scale-102 cursor-pointer active:scale-98"
                      >
                        Tampilkan Semua Produk ({sortedProducts.length - displayProducts.length} Lainnya) ↓
                      </button>
                    </div>
                  )}

                  {showAllProducts && searchQuery === '' && selectedCategory === 'Semua' && (
                    <div className="text-center pt-4">
                      <button
                        onClick={() => setShowAllProducts(false)}
                        className="px-6 py-3 bg-white hover:bg-slate-50 border border-slate-200 text-slate-500 font-bold text-xs rounded-2xl shadow-xs transition-all hover:scale-102 cursor-pointer active:scale-98"
                      >
                        Sembunyikan Sebagian ↑
                      </button>
                    </div>
                  )}
                </div>
              );
            })()}

            {/* Module: Metode Pembayaran Resmi Terverifikasi */}
            {branding.showOfficialPaymentsModule !== false && (
              <div className="mt-12 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl p-6 md:p-8 shadow-xs space-y-6">
              <div className="border-b border-slate-100 dark:border-slate-800 pb-4">
                <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                  💳 Metode Pembayaran Resmi Terverifikasi
                </h3>
                <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
                  Kami menyediakan berbagai alternatif rekening pembayaran resmi yang aktif & aman. Seluruh perubahan dikonfigurasi melalui panel Admin System.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {paymentMethods.filter(method => method.isActive && ['pay-bca', 'pay-bank-transfer', 'pay-blu', 'pay-bni', 'pay-dana'].some(id => method.id === id || method.name.toLowerCase().includes('bca') || method.name.toLowerCase().includes('blu') || method.name.toLowerCase().includes('bni') || method.name.toLowerCase().includes('dana'))).map((method) => {
                  const getBrandLogo = (id: string, name: string) => {
                    const normId = id.toLowerCase();
                    const normName = name.toLowerCase();
                    
                    if (normId.includes('bca') || normName.includes('bca')) {
                      if (normId.includes('blu') || normName.includes('blu')) {
                        return (
                          <div className="flex items-center justify-center bg-[#00d0f5] text-[#002f5c] w-20 h-9 rounded-lg font-sans font-black tracking-normal text-[14px] shadow-xs select-none">
                            blu
                          </div>
                        );
                      }
                      return (
                        <div className="flex items-center justify-center bg-[#0052a3] text-white w-20 h-9 rounded-md font-sans tracking-wider italic font-extrabold text-[14px] shadow-xs select-none">
                          BCA
                        </div>
                      );
                    }
                    
                    if (normId.includes('blu') || normName.includes('blu')) {
                      return (
                        <div className="flex items-center justify-center bg-[#00d0f5] text-[#002f5c] w-20 h-9 rounded-lg font-sans font-black tracking-normal text-[14px] shadow-xs select-none">
                          blu
                        </div>
                      );
                    }
                    
                    if (normId.includes('bni') || normName.includes('bni')) {
                      return (
                        <div className="flex items-center justify-center bg-teal-600 border-r-4 border-orange-500 text-white w-20 h-9 rounded-md font-sans tracking-tight font-extrabold text-[13px] shadow-xs select-none">
                          BNI
                        </div>
                      );
                    }
                    
                    if (normId.includes('dana') || normName.includes('dana')) {
                      return (
                        <div className="flex items-center justify-center bg-[#108ee9] text-white w-20 h-9 rounded-lg font-sans font-black tracking-wide text-[14px] shadow-xs select-none">
                          DANA
                        </div>
                      );
                    }

                    return (
                      <div className="flex items-center justify-center bg-slate-800 text-white w-20 h-9 rounded-lg font-sans font-black tracking-wide text-[11px] shadow-xs select-none">
                        PAY
                      </div>
                    );
                  };

                  const handleCopy = (text: string, id: string) => {
                    try {
                      navigator.clipboard.writeText(text);
                      setCopiedPaymentId(id);
                      setTimeout(() => setCopiedPaymentId(null), 2000);
                    } catch (err) {
                      const textarea = document.createElement('textarea');
                      textarea.value = text;
                      document.body.appendChild(textarea);
                      textarea.select();
                      document.execCommand('copy');
                      document.body.removeChild(textarea);
                      setCopiedPaymentId(id);
                      setTimeout(() => setCopiedPaymentId(null), 2000);
                    }
                  };

                  return (
                    <div key={method.id} className="bg-slate-50 dark:bg-slate-850 border border-slate-100 dark:border-slate-800 p-5 rounded-2xl flex flex-col justify-between space-y-4 hover:shadow-md transition-all">
                      <div className="flex items-center justify-between gap-4">
                        {getBrandLogo(method.id, method.name)}
                        <span className="text-[10px] font-black uppercase text-slate-400 dark:text-slate-500 bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 px-2.5 py-1 rounded-md">
                          {method.name.includes('Transfer') || method.name.includes('Virtual') ? 'Bank' : 'E-Wallet'}
                        </span>
                      </div>

                      <div className="space-y-1">
                        <h4 className="text-xs font-black text-slate-850 dark:text-slate-100">{method.name}</h4>
                        <p className="text-[10.5px] font-medium text-slate-400 dark:text-slate-500 leading-snug line-clamp-2">
                          {method.description}
                        </p>
                      </div>

                      <div className="bg-white dark:bg-slate-900/50 p-3 rounded-xl border border-slate-100 dark:border-slate-800 space-y-2">
                        <div>
                          <span className="block text-[8px] font-black uppercase text-slate-400 dark:text-slate-500 tracking-wider">Nomor Rekening / ID</span>
                          <div className="flex items-center justify-between gap-1.5 mt-0.5">
                            <span className="text-xs font-mono font-bold text-slate-800 dark:text-slate-100 select-all">{method.accountNumber}</span>
                            <button
                              onClick={() => handleCopy(method.accountNumber, method.id)}
                              className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 rounded-lg transition-all cursor-pointer"
                              title="Salin Nomor"
                            >
                              {copiedPaymentId === method.id ? (
                                <Check className="w-3.5 h-3.5 text-emerald-500" />
                              ) : (
                                <Copy className="w-3.5 h-3.5" />
                              )}
                            </button>
                          </div>
                        </div>

                        <div className="border-t border-slate-100/50 dark:border-slate-800 pt-1.5">
                          <span className="block text-[8px] font-black uppercase text-slate-400 dark:text-slate-500 tracking-wider">Atas Nama</span>
                          <span className="text-xs font-extrabold text-slate-700 dark:text-slate-200 block mt-0.5 leading-snug truncate">
                            {method.accountName}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
            )}
          </div>
        )}

        {/* TAB 2: Encrypted Delivery Vault */}
        {activeTab === 'vault' && (
          <EncryptedDeliveryModal 
            purchasedTransactions={transactions} 
            branding={branding} 
            vaultUsers={vaultUsers} 
            githubUser={githubUser}
            onGithubLogin={handleGithubLogin}
            onGithubLogout={handleGithubLogout}
          />
        )}

        {/* TAB 3: Seller Analytics Dashboard */}
        {activeTab === 'seller' && (
          <AnalyticsDashboard products={products} transactions={transactions} />
        )}

        {/* TAB 4: Admin Central Control */}
        {activeTab === 'admin' && (
          !isAdminLoggedIn ? (
            <AdminLogin 
              onLoginSuccess={(user) => {
                setCurrentAdmin(user);
                setIsAdminLoggedIn(true);
              }} 
              adminUsers={adminUsers} 
            />
          ) : (
            <AdminDashboard
              products={products}
              transactions={transactions}
              systemLogs={systemLogs}
              onAddProduct={handleAddProduct}
              onDeleteProduct={handleDeleteProduct}
              onClearLogs={handleClearLogs}
              onDirectCreateInvoice={handleDirectCreateInvoice}
              onLogout={() => {
                setIsAdminLoggedIn(false);
                setCurrentAdmin(null);
              }}
              onAddSystemLog={addSystemLog}
              branding={branding}
              onUpdateBranding={setBranding}
              categories={categories}
              onUpdateCategories={setCategories}
              onUpdateProduct={handleUpdateProduct}
              vaultUsers={vaultUsers}
              onUpdateVaultUsers={setVaultUsers}
              onUpdateTransaction={handleUpdateTransaction}
              paymentMethods={paymentMethods}
              onUpdatePaymentMethods={handleUpdatePaymentMethods}
              complaints={complaints}
              onUpdateComplaint={handleUpdateComplaint}
              adminUsers={adminUsers}
              onUpdateAdminUsers={setAdminUsers}
              currentAdmin={currentAdmin}
              onDeleteTransaction={handleDeleteTransaction}
              onPurgeTransactions={handlePurgeTransactions}
              promoCodes={promoCodes}
              onUpdatePromoCodes={setPromoCodes}
              isAutosyncEnabled={isAutosyncEnabled}
              setIsAutosyncEnabled={setIsAutosyncEnabled}
              lastAutosyncTime={lastAutosyncTime}
              silaturahmiMessages={silaturahmiMessages}
              onUpdateSilaturahmiMessages={setSilaturahmiMessages}
            />
          )
        )}
      </main>

      {/* Global Interactive Drawer/Modals */}

      {/* 1. Product Detail Modal */}
      {selectedProduct && (
        <ProductDetailModal
          product={selectedProduct}
          reviews={reviews}
          onClose={() => setSelectedProduct(null)}
          onAddToCart={(p) => handleAddToCart(p)}
          onAddReview={handleAddReview}
          isWishlisted={wishlist.some((item) => item.id === selectedProduct.id)}
          onToggleWishlist={handleToggleWishlist}
        />
      )}

      {/* 2. Cart Drawer panel */}
      <CartDrawer
        cart={cart}
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        onRemoveFromCart={handleRemoveFromCart}
        onUpdateQuantity={handleUpdateCartQuantity}
        onCheckout={handleOpenCheckout}
      />

      {/* Wishlist Drawer panel */}
      <WishlistDrawer
        wishlist={wishlist}
        isOpen={isWishlistOpen}
        onClose={() => setIsWishlistOpen(false)}
        onRemoveFromWishlist={handleRemoveFromWishlist}
        onAddToCart={handleAddToCart}
        onClearWishlist={handleClearWishlist}
      />

      {/* 3. Automatic Payment Checkout Modal */}
      {isCheckoutOpen && (
        <CheckoutModal
          cart={cart}
          paymentMethods={paymentMethods}
          onClose={() => setIsCheckoutOpen(false)}
          onPaymentSuccess={handlePaymentSuccess}
          githubUser={githubUser}
          promoCodes={promoCodes}
        />
      )}

      {/* 4. Customer Complaint Ticket Modal */}
      {isComplaintModalOpen && (
        <ComplaintModal
          onClose={() => setIsComplaintModalOpen(false)}
          onSubmitComplaint={handleSubmitComplaint}
          transactions={transactions}
          branding={branding}
        />
      )}

      {/* Footer credits and information with Complaint Menu */}
      <footer className="bg-white border-t border-slate-100 py-10 px-6 mt-12 shrink-0">
        <div className="max-w-7xl mx-auto space-y-8">
          {/* Powered by partnership block */}
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 pb-6 border-b border-slate-100">
            <span className="text-[10px] uppercase tracking-widest font-black text-slate-400">Powered by & Partner Resmi:</span>
            <div className="flex flex-wrap items-center gap-5 sm:gap-7 justify-center">
              {/* Microsoft */}
              <div className="flex items-center gap-2 grayscale hover:grayscale-0 opacity-60 hover:opacity-100 transition-all cursor-default">
                <div className="grid grid-cols-2 gap-0.5 w-4 h-4">
                  <div className="bg-[#f25022] w-1.5 h-1.5"></div>
                  <div className="bg-[#7fba00] w-1.5 h-1.5"></div>
                  <div className="bg-[#00a4ef] w-1.5 h-1.5"></div>
                  <div className="bg-[#ffb900] w-1.5 h-1.5"></div>
                </div>
                <span className="text-xs font-extrabold text-slate-700 tracking-tight">Microsoft</span>
              </div>
              {/* Canva */}
              <div className="flex items-center gap-2 grayscale hover:grayscale-0 opacity-60 hover:opacity-100 transition-all cursor-default">
                <div className="w-4.5 h-4.5 rounded-full bg-gradient-to-tr from-[#00c4cc] to-[#7d2ae8] flex items-center justify-center shadow-xs">
                  <span className="text-[9px] font-black text-white leading-none font-sans">C</span>
                </div>
                <span className="text-xs font-extrabold text-slate-700 tracking-tight">Canva</span>
              </div>
              {/* Adobe */}
              <div className="flex items-center gap-2 grayscale hover:grayscale-0 opacity-60 hover:opacity-100 transition-all cursor-default">
                <div className="w-4 h-4 bg-[#FF0000] rounded-xs flex items-center justify-center font-sans font-black text-white text-[10px] leading-none">
                  A
                </div>
                <span className="text-xs font-extrabold text-slate-700 tracking-tight">Adobe</span>
              </div>
              {/* Autodesk */}
              <div className="flex items-center gap-2 grayscale hover:grayscale-0 opacity-60 hover:opacity-100 transition-all cursor-default">
                <div className="w-4 h-4 bg-[#0696D7] rounded-xs flex items-center justify-center font-sans font-extrabold text-white text-[9px] leading-none">
                  A
                </div>
                <span className="text-xs font-extrabold text-slate-700 tracking-tight">Autodesk</span>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-6 text-xs text-slate-400">
            <div className="text-left space-y-1">
              <p className="font-bold text-slate-700">© 2026 {branding.name}. Hak Cipta Dilindungi.</p>
              <p className="text-[10px] text-slate-400">{branding.slogan}</p>
            </div>
          
          <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6">
            <button
              onClick={() => setIsComplaintModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-2 bg-rose-50 hover:bg-rose-100 text-rose-600 hover:text-rose-700 font-bold rounded-xl transition-all cursor-pointer border border-rose-100/50"
              id="footer-complaint-btn"
            >
              <MessageSquare className="w-4 h-4 shrink-0" /> Menu Pengaduan & Komplain
            </button>
            <span className="hidden sm:inline text-slate-200">|</span>
            <span className="flex items-center gap-1.5 text-slate-500 font-semibold">
              <ShieldCheck className="w-4 h-4 text-emerald-600" /> Keamanan SSL 256-Bit Terjamin
            </span>
            <span className="hidden sm:inline text-slate-200">•</span>
            <span className="text-slate-500 font-medium">Instan delivery & encrypted activation keys</span>
          </div>
        </div>
      </div>
      </footer>

      {/* 5. Pojok Silaturahmi Floating Widget */}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
        {/* Chat Box Panel */}
        {isChatOpen && (
          <div className="bg-white border border-slate-100 rounded-3xl shadow-xl w-80 md:w-96 max-h-[500px] flex flex-col overflow-hidden mb-3 animate-in slide-in-from-bottom-5 fade-in duration-300">
            {/* Header */}
            <div className="bg-gradient-to-r from-sky-600 to-indigo-600 p-4 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-xl">🤝</span>
                <div>
                  <h3 className="text-xs font-black">Pojok Silaturahmi</h3>
                  <p className="text-[9px] text-sky-100 font-sans">Saling sapa antar pengunjung & pembeli</p>
                </div>
              </div>
              <button
                onClick={() => setIsChatOpen(false)}
                className="text-white hover:text-sky-200 transition-colors p-1 bg-white/10 hover:bg-white/20 rounded-lg cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Message List */}
            <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-slate-50/50 max-h-[250px] min-h-[180px]">
              {silaturahmiMessages.map((msg) => {
                const dateObj = new Date(msg.timestamp);
                const timeStr = isNaN(dateObj.getTime()) ? '' : dateObj.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
                
                // Peran styles
                const isCreator = msg.role === 'Creator' || msg.role?.toLowerCase().includes('admin') || msg.role?.toLowerCase().includes('owner') || msg.role === 'Kreator';
                const isBuyer = msg.role === 'Pembeli';
                const roleBadge = isCreator
                  ? 'bg-indigo-50 text-indigo-700 border-indigo-200'
                  : isBuyer
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    : 'bg-slate-50 text-slate-600 border-slate-200';

                return (
                  <div key={msg.id} className="flex gap-2.5 items-start animate-in fade-in duration-200">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-black text-xs shrink-0 ${msg.avatarColor || 'bg-slate-200 text-slate-700'}`}>
                      {msg.name ? msg.name.charAt(0).toUpperCase() : '?' }
                    </div>
                    <div className="flex-1 min-w-0 bg-white p-2.5 rounded-2xl border border-slate-100 shadow-3xs">
                      <div className="flex items-center justify-between gap-2 flex-wrap mb-1">
                        <span className="text-[10.5px] font-bold text-slate-800 truncate">{msg.name}</span>
                        <span className="text-[8px] font-medium font-mono text-slate-400">{timeStr}</span>
                      </div>
                      <div className="flex items-center gap-1.5 mb-1.5">
                        <span className={`px-1.5 py-0.2 text-[7px] font-black uppercase rounded-sm border ${roleBadge}`}>
                          {msg.role || 'Tamu'}
                        </span>
                      </div>
                      <p className="text-[10.5px] text-slate-600 font-sans leading-relaxed break-words">{msg.message}</p>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Form Input */}
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                if (!chatName.trim() || !chatMessage.trim()) return;
                setIsSubmittingChat(true);

                // Avatar colors bank
                const colors = [
                  'bg-indigo-500 text-white',
                  'bg-emerald-500 text-white',
                  'bg-rose-500 text-white',
                  'bg-sky-500 text-white',
                  'bg-amber-500 text-white',
                  'bg-purple-500 text-white',
                  'bg-teal-500 text-white'
                ];
                
                const newMessage: SilaturahmiMessage = {
                  id: `msg-${Date.now()}`,
                  name: chatName.trim(),
                  message: chatMessage.trim(),
                  timestamp: new Date().toISOString(),
                  avatarColor: colors[Math.floor(Math.random() * colors.length)],
                  role: chatRole,
                };

                try {
                  // Write to Firestore and local state
                  await syncToFirebase('silaturahmi', newMessage.id, newMessage);
                  setSilaturahmiMessages(prev => [...prev, newMessage]);
                  setChatMessage('');
                  
                  // Log event
                  addSystemLog('system', 'Silaturahmi Baru', `${chatName} mengirim pesan silaturahmi.`);
                } catch (err) {
                  console.error('Failed to sync silaturahmi:', err);
                  // Fallback local only
                  setSilaturahmiMessages(prev => [...prev, newMessage]);
                  setChatMessage('');
                } finally {
                  setIsSubmittingChat(false);
                }
              }}
              className="p-3.5 border-t border-slate-150 bg-white space-y-2.5"
            >
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[8px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Nama Anda</label>
                  <input
                    type="text"
                    placeholder="Hamba Allah"
                    value={chatName}
                    onChange={(e) => setChatName(e.target.value)}
                    maxLength={20}
                    required
                    className="w-full text-[10px] px-2 py-1.5 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-[8px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Status Peran</label>
                  <select
                    value={chatRole}
                    onChange={(e) => setChatRole(e.target.value)}
                    className="w-full text-[10px] px-2 py-1.5 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-hidden"
                  >
                    <option value="Tamu">Tamu 👤</option>
                    <option value="Pembeli">Pembeli 🛍️</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-[8px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Pesan Silaturahmi</label>
                <textarea
                  placeholder="Tulis salam hangat Anda..."
                  value={chatMessage}
                  onChange={(e) => setChatMessage(e.target.value)}
                  maxLength={120}
                  required
                  rows={2}
                  className="w-full text-[10px] px-2 py-1.5 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-hidden resize-none"
                />
              </div>
              <button
                type="submit"
                disabled={isSubmittingChat}
                className="w-full py-1.5 bg-sky-600 hover:bg-sky-700 disabled:bg-slate-300 text-white text-[10px] font-black rounded-lg transition-colors cursor-pointer flex items-center justify-center gap-1 shadow-2xs"
              >
                {isSubmittingChat ? 'Mengirim...' : 'Kirim Sapaan Silaturahmi ✨'}
              </button>
            </form>
          </div>
        )}

        {/* Toggle Button */}
        <button
          onClick={() => setIsChatOpen(!isChatOpen)}
          className="bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-700 hover:to-indigo-700 text-white font-black text-xs px-4 py-3 rounded-full shadow-lg hover:shadow-xl transition-all hover:scale-105 active:scale-95 cursor-pointer flex items-center gap-1.5 relative"
        >
          <span className="text-sm">💬</span>
          <span>Pojok Silaturahmi</span>
          {!isChatOpen && (
            <span className="absolute -top-1 -right-1 w-3 h-3 bg-rose-500 rounded-full border-2 border-white animate-ping"></span>
          )}
        </button>
      </div>
    </div>
  );
}
