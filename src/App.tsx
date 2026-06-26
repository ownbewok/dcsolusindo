/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Product, Review, CartItem, Transaction, SystemLog, PaymentStatus, ShopBranding, VaultUser, PaymentMethodConfig, Complaint, AdminUser, GithubUser, PromoCode } from './types';
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
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const savedTheme = localStorage.getItem('digimarket_theme');
      if (savedTheme) {
        return savedTheme === 'dark';
      }
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
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
  const [activeTab, setActiveTab] = useState<'belanja' | 'vault' | 'seller' | 'admin'>('belanja');
  
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
          whatsappNumber: parsed.whatsappNumber || '6282288882512',
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
      whatsappNumber: '6282288882512',
    };
  });

  useEffect(() => {
    localStorage.setItem('digimarket_shop_branding', JSON.stringify(branding));
    autoSyncEntity('config', 'shop_branding', branding);
  }, [branding]);

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
    autoSyncEntity('config', 'payment_methods', { list: paymentMethods });
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
    autoSyncEntity('config', 'categories', { list: categories });
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
    autoSyncEntity('config', 'vault_users', { list: vaultUsers });
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
    autoSyncEntity('config', 'admin_users', { list: adminUsers });
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
    autoSyncEntity('config', 'promo_codes', { list: promoCodes });
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
      const data = await res.json();
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

  // Firebase Firestore Database Integration States
  const [isDbLoading, setIsDbLoading] = useState<boolean>(true);
  const [isFirebaseConnected, setIsFirebaseConnected] = useState<boolean>(false);
  const [firebaseError, setFirebaseError] = useState<string | null>(null);

  useEffect(() => {
    const initializeDatabaseFromFirestore = async () => {
      try {
        setIsDbLoading(true);
        console.log('Mengoneksikan dan menyelaraskan dengan Firebase Firestore...');

        // 1. Fetch Products
        let cloudProducts = await fetchCollectionFromFirebase('products');
        if (cloudProducts.length === 0) {
          console.log('Firestore products collection is empty. Seeding initial products...');
          await bulkPushToFirebase('products', initialProducts, 'id');
          cloudProducts = initialProducts;
        }
        setProducts(cloudProducts);

        // 2. Fetch Reviews
        let cloudReviews = await fetchCollectionFromFirebase('reviews');
        if (cloudReviews.length === 0) {
          console.log('Firestore reviews collection is empty. Seeding initial reviews...');
          await bulkPushToFirebase('reviews', initialReviews, 'id');
          cloudReviews = initialReviews;
        }
        setReviews(cloudReviews);

        // 3. Fetch Transactions
        const cloudTransactions = await fetchCollectionFromFirebase('transactions');
        if (cloudTransactions.length > 0) {
          setTransactions(cloudTransactions.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
        }

        // 4. Fetch Complaints
        const cloudComplaints = await fetchCollectionFromFirebase('complaints');
        if (cloudComplaints.length > 0) {
          setComplaints(cloudComplaints.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
        }

        // 5. Fetch Configurations from Firebase config collection
        const brandingDoc = await fetchDocFromFirebase('config', 'shop_branding');
        if (brandingDoc) {
          const { id, syncSource, lastSyncedAt, ...cleanBranding } = brandingDoc;
          setBranding(prev => ({
            ...prev,
            ...cleanBranding
          }));
        } else {
          await syncToFirebase('config', 'shop_branding', branding);
        }

        const categoriesDoc = await fetchDocFromFirebase('config', 'categories');
        if (categoriesDoc && Array.isArray(categoriesDoc.list)) {
          setCategories(categoriesDoc.list);
        } else {
          await syncToFirebase('config', 'categories', { list: categories });
        }

        const paymentMethodsDoc = await fetchDocFromFirebase('config', 'payment_methods');
        if (paymentMethodsDoc && Array.isArray(paymentMethodsDoc.list)) {
          setPaymentMethods(paymentMethodsDoc.list);
        } else {
          await syncToFirebase('config', 'payment_methods', { list: paymentMethods });
        }

        const vaultUsersDoc = await fetchDocFromFirebase('config', 'vault_users');
        if (vaultUsersDoc && Array.isArray(vaultUsersDoc.list)) {
          setVaultUsers(vaultUsersDoc.list);
        } else {
          await syncToFirebase('config', 'vault_users', { list: vaultUsers });
        }

        const adminUsersDoc = await fetchDocFromFirebase('config', 'admin_users');
        if (adminUsersDoc && Array.isArray(adminUsersDoc.list)) {
          setAdminUsers(adminUsersDoc.list);
        } else {
          await syncToFirebase('config', 'admin_users', { list: adminUsers });
        }

        const promoCodesDoc = await fetchDocFromFirebase('config', 'promo_codes');
        if (promoCodesDoc && Array.isArray(promoCodesDoc.list)) {
          setPromoCodes(promoCodesDoc.list);
        } else {
          await syncToFirebase('config', 'promo_codes', { list: promoCodes });
        }

        // 6. Fetch System Logs
        let cloudLogs = await fetchCollectionFromFirebase('system_logs');
        if (cloudLogs.length > 0) {
          setSystemLogs(cloudLogs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()));
        } else {
          const defaultLog = {
            id: 'log-init-firebase',
            type: 'system',
            title: 'Koneksi Cloud Firestore Aktif',
            message: 'Database berhasil dialihkan ke Firebase Firestore secara real-time.',
            timestamp: new Date().toISOString(),
          };
          await syncToFirebase('system_logs', defaultLog.id, defaultLog);
          setSystemLogs([defaultLog]);
        }

        setIsFirebaseConnected(true);
      } catch (err: any) {
        console.error('Firestore init failed. Operating in local-fallback mode:', err);
        setFirebaseError(err.message || String(err));
      } finally {
        setIsDbLoading(false);
      }
    };

    initializeDatabaseFromFirestore();
  }, []);

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
          }
        }),
      });
      let data;
      try {
        data = await response.json();
      } catch (jsonErr) {
        throw new Error('Server sedang melakukan pembaruan otomatis/restart. Silakan tunggu beberapa detik.');
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
          }),
        });
        let data;
        try {
          data = await response.json();
        } catch (jsonErr) {
          throw new Error('Server sedang melakukan pembaruan otomatis/restart.');
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
      const { collection, addDoc } = await import('firebase/firestore');
      const { db } = await import('./firebase');
      
      const docRef = await addDoc(collection(db, 'uploads'), {
        transactionId: trx.id,
        buyerName: trx.buyerName,
        buyerEmail: trx.buyerEmail,
        buyerPhone: trx.buyerPhone || '',
        totalPrice: trx.totalPrice,
        paymentMethod: trx.paymentMethod,
        paymentStatus: trx.paymentStatus,
        senderBank: trx.senderBank || '',
        senderName: trx.senderName || '',
        senderNotes: trx.senderNotes || '',
        paymentProof: trx.paymentProof || '',
        createdAt: trx.createdAt,
        pushedAt: new Date().toISOString(),
        pushType: 'automatic'
      });
      
      addSystemLog(
        'system',
        'Auto Push Firebase Sukses',
        `Data transaksi ${trx.id} otomatis didorong ke Firebase Firestore ('uploads') dengan ID Dokumen: ${docRef.id}`,
        trx.buyerEmail
      );
      console.log(`Auto Push Firebase Sukses: ${docRef.id}`);
    } catch (err: any) {
      console.error('Gagal melakukan auto push ke Firebase:', err);
      addSystemLog(
        'system',
        'Auto Push Firebase Gagal',
        `Gagal mendorong transaksi ${trx.id} ke Firebase: ${err.message || err}`,
        trx.buyerEmail
      );
    }
  };

  // Real-time auto-sync helper for any database entity
  const autoSyncEntity = async (collectionName: string, docId: string, data: any, silent = true) => {
    try {
      const res = await syncToFirebase(collectionName, docId, data);
      if (res.success && !silent) {
        addSystemLog(
          'system',
          'Sync Cloud Otomatis Sukses',
          `Data ${collectionName} dengan ID ${docId} sukses disinkronkan ke Firebase Cloud Firestore.`
        );
      }
    } catch (err: any) {
      console.error(`Gagal melakukan sinkronisasi otomatis ${collectionName} ke Firebase:`, err);
    }
  };

  const autoDeleteEntity = async (collectionName: string, docId: string) => {
    try {
      await deleteFromFirebase(collectionName, docId);
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

  return (
    <div className="min-h-screen bg-slate-50/40 text-slate-800 font-sans flex flex-col antialiased">
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

            {/* Products grid container with layout style configurations */}
            {sortedProducts.length === 0 ? (
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
                {sortedProducts.map((prod) => (
                  <div key={prod.id} className="bg-white border border-slate-100 hover:border-slate-300 rounded-2xl p-4 flex flex-col sm:flex-row items-center gap-4 transition-all shadow-xs">
                    <div className="w-20 h-20 bg-slate-100 rounded-xl overflow-hidden shrink-0">
                      <img src={prod.thumbnailUrl} alt={prod.name} className="w-full h-full object-cover" />
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
                      <span className="text-[9px] text-slate-400 block mt-0.5">Sisa {prod.licenseKeysPool.length} Lisensi</span>
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
                {sortedProducts.map((prod, index) => {
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
                            src={prod.thumbnailUrl} 
                            alt={prod.name} 
                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" 
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
                {sortedProducts.map((prod) => (
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
      <footer className="bg-white border-t border-slate-100 py-10 px-6 text-center mt-12 shrink-0">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-6 text-xs text-slate-400">
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
      </footer>
    </div>
  );
}
