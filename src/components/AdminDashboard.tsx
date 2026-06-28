/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { Product, Transaction, SystemLog, PaymentStatus, ShopBranding, VaultUser, PaymentMethodConfig, Complaint, AdminUser, PromoCode, SilaturahmiMessage } from '../types';
import { 
  Activity, 
  ShieldCheck, 
  Mail, 
  Database, 
  Plus, 
  Trash2, 
  Key, 
  Download, 
  CheckCircle, 
  HelpCircle, 
  Package, 
  RefreshCw,
  LogOut,
  FileText,
  CheckCircle2,
  User,
  Settings,
  Store,
  Gem,
  Gift,
  Globe,
  Cpu,
  Lock,
  ShoppingBag,
  Sparkles,
  Pencil,
  Users,
  UserPlus,
  MessageSquare,
  QrCode,
  Smartphone,
  CreditCard,
  Landmark as Bank,
  Check,
  AlertCircle,
  Paperclip,
  Percent,
  Tag,
  Phone,
  Search,
  Calendar,
  DollarSign,
  ExternalLink,
  RotateCcw,
  Save,
  Type
} from 'lucide-react';
import { InvoiceModal } from './InvoiceModal';
import { bulkPushToFirebase, syncToFirebase, testFirebaseConnection, ConnectionTestResult, getActiveFirebaseConfig, FirebaseConfigType } from '../lib/firebaseSync';

interface AdminDashboardProps {
  products: Product[];
  transactions: Transaction[];
  systemLogs: SystemLog[];
  onAddProduct: (product: Product) => void;
  onDeleteProduct: (id: string) => void;
  onClearLogs: () => void;
  onDirectCreateInvoice: (transaction: Transaction) => void;
  onLogout: () => void;
  onAddSystemLog?: (type: 'payment_pending' | 'payment_confirmed' | 'license_sent' | 'email_sent' | 'system', title: string, message: string, recipient?: string) => void;
  branding: ShopBranding;
  onUpdateBranding: (branding: ShopBranding) => void;
  categories: string[];
  onUpdateCategories: (categories: string[]) => void;
  onUpdateProduct: (product: Product) => void;
  vaultUsers: VaultUser[];
  onUpdateVaultUsers: (users: VaultUser[]) => void;
  onUpdateTransaction?: (transaction: Transaction) => void;
  paymentMethods: PaymentMethodConfig[];
  onUpdatePaymentMethods: (methods: PaymentMethodConfig[]) => void;
  complaints: Complaint[];
  onUpdateComplaint: (complaint: Complaint) => void;
  adminUsers: AdminUser[];
  onUpdateAdminUsers: (users: AdminUser[]) => void;
  currentAdmin?: AdminUser | null;
  onDeleteTransaction?: (id: string) => void;
  onPurgeTransactions?: () => void;
  promoCodes: PromoCode[];
  onUpdatePromoCodes: (promoCodes: PromoCode[]) => void;
  isAutosyncEnabled?: boolean;
  setIsAutosyncEnabled?: (val: boolean) => void;
  lastAutosyncTime?: string | null;
  silaturahmiMessages?: SilaturahmiMessage[];
  onUpdateSilaturahmiMessages?: (messages: SilaturahmiMessage[]) => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  products,
  transactions,
  systemLogs,
  onAddProduct,
  onDeleteProduct,
  onClearLogs,
  onDirectCreateInvoice,
  onLogout,
  onAddSystemLog,
  branding,
  onUpdateBranding,
  categories,
  onUpdateCategories,
  onUpdateProduct,
  vaultUsers,
  onUpdateVaultUsers,
  onUpdateTransaction,
  paymentMethods,
  onUpdatePaymentMethods,
  complaints,
  onUpdateComplaint,
  adminUsers,
  onUpdateAdminUsers,
  currentAdmin = null,
  onDeleteTransaction,
  onPurgeTransactions,
  promoCodes,
  onUpdatePromoCodes,
  isAutosyncEnabled,
  setIsAutosyncEnabled,
  lastAutosyncTime,
  silaturahmiMessages = [],
  onUpdateSilaturahmiMessages,
}) => {
  const [activeTab, setActiveTab] = useState<'transactions' | 'products' | 'users' | 'logs' | 'settings' | 'complaints_payments' | 'promos' | 'silaturahmi'>('transactions');

  // Local draft state for shop settings to avoid editing props and database syncing directly on keystroke
  const [draftBranding, setDraftBranding] = useState<ShopBranding>(() => ({ ...branding }));
  const [saveStatus, setSaveStatus] = useState<{ [key: string]: 'idle' | 'saving' | 'success' }>({
    identity: 'idle',
    skin: 'idle',
    notes: 'idle',
    smtp: 'idle',
  });

  // Keep draft in sync with outer changes if there are any
  React.useEffect(() => {
    setDraftBranding({ ...branding });
  }, [branding]);

  const handleSaveSettings = async (section: 'identity' | 'skin' | 'notes' | 'smtp') => {
    setSaveStatus(prev => ({ ...prev, [section]: 'saving' }));
    try {
      // Apply update up to App.tsx which automatically persists and syncs
      onUpdateBranding(draftBranding);
      
      if (onAddSystemLog) {
        let sectionName = '';
        if (section === 'identity') sectionName = 'Identitas & Branding';
        if (section === 'skin') sectionName = 'Skin & Tema Visual';
        if (section === 'notes') sectionName = 'Default Catatan Transaksi';
        if (section === 'smtp') sectionName = 'SMTP Server Email';
        
        onAddSystemLog(
          'system',
          `Pembaruan Pengaturan: ${sectionName}`,
          `Pengaturan toko bagian "${sectionName}" telah berhasil disimpan dan disinkronkan ke cloud.`
        );
      }
      
      setSaveStatus(prev => ({ ...prev, [section]: 'success' }));
      setTimeout(() => {
        setSaveStatus(prev => ({ ...prev, [section]: 'idle' }));
      }, 3000);
    } catch (err: any) {
      console.error(err);
      setSaveStatus(prev => ({ ...prev, [section]: 'idle' }));
      alert(`Gagal menyimpan pengaturan: ${err.message || String(err)}`);
    }
  };

  // Derived customer database from transactions
  const clients = useMemo(() => {
    const map: { [email: string]: {
      name: string;
      email: string;
      phone: string;
      transactions: Transaction[];
      successTransactions: Transaction[];
      totalSpent: number;
      purchasedProducts: string[];
      lastActive: string;
      joinedDate: string;
    }} = {};

    (transactions || []).forEach(trx => {
      const email = (trx.buyerEmail || '').trim().toLowerCase();
      if (!email) return;

      if (!map[email]) {
        map[email] = {
          name: trx.buyerName || 'Tanpa Nama',
          email: trx.buyerEmail,
          phone: trx.buyerPhone || '',
          transactions: [],
          successTransactions: [],
          totalSpent: 0,
          purchasedProducts: [],
          lastActive: trx.createdAt,
          joinedDate: trx.createdAt,
        };
      }

      const client = map[email];
      
      if (trx.buyerName && trx.buyerName !== 'Tanpa Nama' && (!client.name || client.name === 'Tanpa Nama')) {
        client.name = trx.buyerName;
      }
      if (trx.buyerPhone && !client.phone) {
        client.phone = trx.buyerPhone;
      }

      client.transactions.push(trx);

      if (trx.paymentStatus === 'SUCCESS') {
        client.successTransactions.push(trx);
        client.totalSpent += trx.totalPrice;
        
        // Add unique purchased products
        (trx.items || []).forEach(item => {
          if (item.productName && !client.purchasedProducts.includes(item.productName)) {
            client.purchasedProducts.push(item.productName);
          }
        });
      }

      // Track last active and joined date
      if (new Date(trx.createdAt) > new Date(client.lastActive)) {
        client.lastActive = trx.createdAt;
      }
      if (new Date(trx.createdAt) < new Date(client.joinedDate)) {
        client.joinedDate = trx.createdAt;
      }
    });

    return Object.values(map).sort((a, b) => b.totalSpent - a.totalSpent);
  }, [transactions]);

  // Purge Transactions Confirmation States
  const [purgeConfirmStep, setPurgeConfirmStep] = useState<number>(0); // 0: idle, 1: confirming, 2: purging

  // Push to Firebase Manual Upload States
  const [pushStatus, setPushStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [pushMessage, setPushMessage] = useState('');

  const handlePushToFirebase = async (trx: Transaction) => {
    setPushStatus('loading');
    setPushMessage('Menghubungkan & mendorong data ke Firestore...');
    try {
      const { collection, addDoc } = await import('firebase/firestore');
      const { db } = await import('../firebase');
      
      const docRef = await addDoc(collection(db, 'uploads'), {
        transactionId: trx.id,
        buyerName: trx.buyerName,
        buyerEmail: trx.buyerEmail,
        buyerPhone: trx.buyerPhone,
        totalPrice: trx.totalPrice,
        paymentMethod: trx.paymentMethod,
        paymentStatus: trx.paymentStatus,
        senderBank: trx.senderBank || '',
        senderName: trx.senderName || '',
        senderNotes: trx.senderNotes || '',
        paymentProof: trx.paymentProof || '',
        createdAt: trx.createdAt,
        pushedAt: new Date().toISOString()
      });
      
      setPushStatus('success');
      setPushMessage(`Sukses didorong! ID Dokumen: ${docRef.id}`);
      
      if (onAddSystemLog) {
        onAddSystemLog(
          'system',
          'Push Manual Firebase Sukses',
          `Data transaksi & bukti upload untuk ${trx.id} sukses didorong manual ke Firebase Firestore ('uploads') dengan ID: ${docRef.id}`,
          trx.buyerEmail
        );
      }
    } catch (err: any) {
      console.error(err);
      setPushStatus('error');
      setPushMessage(`Gagal dorong: ${err.message || err}`);
    }
  };

  // Firebase Configuration & Diagnostics State
  const [firebaseConfigState, setFirebaseConfigState] = useState<FirebaseConfigType>(() => getActiveFirebaseConfig());
  const [showFullDbConfig, setShowFullDbConfig] = useState<boolean>(false);
  const [dbSaveSuccess, setDbSaveSuccess] = useState<boolean>(false);

  // Bulk sync to Firebase states
  const [bulkSyncStatus, setBulkSyncStatus] = useState<'idle' | 'syncing' | 'success' | 'error'>('idle');
  const [bulkSyncLogs, setBulkSyncLogs] = useState<string[]>([]);

  // Firebase Live Connection Test states
  const [testConnStatus, setTestConnStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle');
  const [testConnResult, setTestConnResult] = useState<ConnectionTestResult | null>(null);

  const handleTestFirebaseConnection = async (configOverride?: FirebaseConfigType) => {
    setTestConnStatus('testing');
    setTestConnResult(null);
    try {
      const activeConfig = (configOverride && typeof configOverride === 'object' && 'projectId' in configOverride)
        ? configOverride
        : firebaseConfigState;

      const res = await testFirebaseConnection(activeConfig);
      setTestConnResult(res);
      if (res.success) {
        setTestConnStatus('success');
        if (onAddSystemLog) {
          onAddSystemLog(
            'system',
            'Test Koneksi Firebase Sukses',
            `Pemeriksaan koneksi Firebase Firestore sukses. Berhasil terhubung ke Project ID: ${res.details?.projectId || 'N/A'}.`,
            'admin@system'
          );
        }
      } else {
        setTestConnStatus('error');
        if (onAddSystemLog) {
          onAddSystemLog(
            'system',
            'Test Koneksi Firebase Gagal',
            `Gagal terhubung ke Firebase Firestore. Error: ${res.details?.errorMessage || res.message}`,
            'admin@system'
          );
        }
      }
    } catch (err: any) {
      setTestConnStatus('error');
      setTestConnResult({
        success: false,
        message: `Terjadi kesalahan internal saat mencoba melakukan tes koneksi: ${err.message || err}`,
        details: {
          projectId: 'N/A',
          databaseId: 'N/A',
          errorMessage: err.message || String(err),
          step: 'catch_block'
        }
      });
    }
  };

  const handleBulkSyncAll = async () => {
    setBulkSyncStatus('syncing');
    setBulkSyncLogs(['Memulai sinkronisasi seluruh database lokal ke Cloud...']);
    
    const addLog = (msg: string) => {
      setBulkSyncLogs(prev => [...prev, `[${new Date().toLocaleTimeString('id-ID')}] ${msg}`]);
    };

    try {
      addLog('Menghubungkan ke Firebase Firestore database...');
      
      // 1. Sync branding
      addLog('Mendorong Pengaturan & Branding Toko...');
      const brandRes = await syncToFirebase('config', 'shop_branding', branding);
      if (brandRes.success) {
        addLog('✅ Branding & Identitas Toko sukses didorong.');
      } else {
        addLog(`❌ Gagal mendorong branding: ${brandRes.error}`);
      }

      // 2. Sync categories
      addLog('Mendorong Kategori Produk...');
      const catRes = await syncToFirebase('config', 'categories', { list: categories });
      if (catRes.success) {
        addLog(`✅ Kategori produk (${categories.length} item) sukses didorong.`);
      } else {
        addLog(`❌ Gagal mendorong kategori: ${catRes.error}`);
      }

      // 3. Sync payment methods
      addLog('Mendorong Konfigurasi Metode Pembayaran...');
      const payRes = await syncToFirebase('config', 'payment_methods', { list: paymentMethods });
      if (payRes.success) {
        addLog(`✅ Metode pembayaran (${paymentMethods.length} item) sukses didorong.`);
      } else {
        addLog(`❌ Gagal mendorong metode pembayaran: ${payRes.error}`);
      }

      // 4. Bulk push products
      addLog(`Mendorong ${products.length} item Produk...`);
      const prodRes = await bulkPushToFirebase('products', products, 'id');
      if (prodRes.success) {
        addLog(`✅ Katalog produk (${prodRes.syncedCount} item) sukses disinkronkan.`);
      } else {
        addLog(`⚠️ Produk tersinkronisasi sebagian: ${prodRes.syncedCount} sukses, ${prodRes.failedCount} gagal.`);
        if (prodRes.errors.length > 0) addLog(`Detail error: ${prodRes.errors[0]}`);
      }

      // 5. Bulk push transactions
      addLog(`Mendorong ${transactions.length} item Transaksi...`);
      const trxRes = await bulkPushToFirebase('transactions', transactions, 'id');
      if (trxRes.success) {
        addLog(`✅ Transaksi (${trxRes.syncedCount} item) sukses disinkronkan.`);
      } else {
        addLog(`⚠️ Transaksi tersinkronisasi sebagian: ${trxRes.syncedCount} sukses, ${trxRes.failedCount} gagal.`);
      }

      // 6. Bulk push complaints
      addLog(`Mendorong ${complaints.length} item Tiket Komplain...`);
      const compRes = await bulkPushToFirebase('complaints', complaints, 'id');
      if (compRes.success) {
        addLog(`✅ Tiket komplain (${compRes.syncedCount} item) sukses disinkronkan.`);
      } else {
        addLog(`⚠️ Komplain tersinkronisasi sebagian: ${compRes.syncedCount} sukses, ${compRes.failedCount} gagal.`);
      }

      // 7. Bulk push vault users
      addLog(`Mendorong ${vaultUsers.length} pelanggan Vault...`);
      const vusrRes = await bulkPushToFirebase('vault_users', vaultUsers, 'id');
      if (vusrRes.success) {
        addLog(`✅ Akses Vault Pelanggan (${vusrRes.syncedCount} item) sukses disinkronkan.`);
      } else {
        addLog(`⚠️ Pelanggan Vault tersinkronisasi sebagian: ${vusrRes.syncedCount} sukses, ${vusrRes.failedCount} gagal.`);
      }

      // 8. Bulk push admin users
      addLog(`Mendorong ${adminUsers.length} pengguna Admin...`);
      const adminRes = await bulkPushToFirebase('admin_users', adminUsers, 'id');
      if (adminRes.success) {
        addLog(`✅ Admin users (${adminRes.syncedCount} item) sukses disinkronkan.`);
      } else {
        addLog(`⚠️ Admin users tersinkronisasi sebagian.`);
      }

      // 9. Bulk push system logs
      addLog(`Mendorong ${systemLogs.length} entri System Log...`);
      const logRes = await bulkPushToFirebase('system_logs', systemLogs, 'id');
      if (logRes.success) {
        addLog(`✅ System logs (${logRes.syncedCount} item) sukses disinkronkan.`);
      } else {
        addLog(`⚠️ System logs tersinkronisasi sebagian.`);
      }

      setBulkSyncStatus('success');
      addLog('🎉 SINKRONISASI SELURUH DATABASE SELESAI DENGAN SUKSES!');
      
      if (onAddSystemLog) {
        onAddSystemLog(
          'system',
          'Sinkronisasi Cloud Database Sukses',
          `Admin Utama melakukan sinkronisasi massal seluruh database lokal (Produk, Transaksi, Pengaturan, Komplain, Vault, Log) ke Firebase Cloud.`
        );
      }
    } catch (err: any) {
      console.error(err);
      setBulkSyncStatus('error');
      addLog(`❌ KESALAHAN VITAL SINKRONISASI: ${err.message || String(err)}`);
    }
  };

  // Get currently logged-in admin details for role checks
  const loggedInAdmin = currentAdmin || adminUsers.find(u => u.role === 'Super Admin') || adminUsers[0];
  const isSuperAdmin = loggedInAdmin?.role === 'Super Admin';

  // Add Product Form State
  const [prodName, setProdName] = useState('');
  const [prodDesc, setProdDesc] = useState('');
  const [prodCategory, setProdCategory] = useState<string>(categories && categories.length > 0 ? categories[0] : 'Software & License');
  const [prodPrice, setProdPrice] = useState<number>(50000);
  const [prodImage, setProdImage] = useState('https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=800&q=80');
  const [prodFileUrl, setProdFileUrl] = useState('https://storage.googleapis.com/digimarket-demo/downloads/custom-asset.zip');
  const [prodFileSize, setProdFileSize] = useState('5.0 MB');
  const [prodLicense, setProdLicense] = useState<'Single Use' | 'Commercial' | 'GPL' | 'SaaS License'>('Single Use');
  const [prodKeys, setProdKeys] = useState('KEY-CUSTOM-1122\nKEY-CUSTOM-3344\nKEY-CUSTOM-5566');

  // Editing state
  const [editingProductId, setEditingProductId] = useState<string | null>(null);

  // New Category input state
  const [newCategoryInput, setNewCategoryInput] = useState('');
  const [newSettingCategory, setNewSettingCategory] = useState('');

  // Selected Invoice for Modal View
  const [selectedInvoice, setSelectedInvoice] = useState<Transaction | null>(null);

  // Silaturahmi Reply Form States
  const [adminReplyName, setAdminReplyName] = useState(loggedInAdmin?.fullName || 'Admin System');
  const [adminReplyRole, setAdminReplyRole] = useState<'Owner' | 'Creator' | 'Developer'>('Owner');
  const [adminReplyMessage, setAdminReplyMessage] = useState('');
  const [isSubmittingReply, setIsSubmittingReply] = useState(false);

  // State for Direct Invoice Creator
  const [isInvoiceFormOpen, setIsInvoiceFormOpen] = useState(false);
  const [invBuyerName, setInvBuyerName] = useState('');
  const [invBuyerEmail, setInvBuyerEmail] = useState('');
  const [invBuyerPhone, setInvBuyerPhone] = useState('');
  const [invProductId, setInvProductId] = useState('');
  const [invoiceItems, setInvoiceItems] = useState<{ productId: string; quantity: number }[]>([]);
  const [invPaymentMethod, setInvPaymentMethod] = useState('Virtual Account BCA');
  const [invPaymentStatus, setInvPaymentStatus] = useState<PaymentStatus>(PaymentStatus.SUCCESS);
  const [invoiceSuccess, setInvoiceSuccess] = useState<string | null>(null);

  // States for Editing Transaction
  const [editingTransactionId, setEditingTransactionId] = useState<string | null>(null);
  const [editTrxPaymentStatus, setEditTrxPaymentStatus] = useState<PaymentStatus>(PaymentStatus.SUCCESS);
  const [editTrxPaymentMethod, setEditTrxPaymentMethod] = useState('');
  const [editTrxItems, setEditTrxItems] = useState<{
    productId: string;
    productName: string;
    price: number;
    licenseKey?: string;
    decryptPassword?: string;
    fileUrl: string;
    fileSize: string;
  }[]>([]);

  // States for sub-tab and admin management
  const [userSubTab, setUserSubTab] = useState<'vault' | 'admin' | 'clients'>('vault');
  const [clientSearchTerm, setClientSearchTerm] = useState('');
  const [selectedClientEmail, setSelectedClientEmail] = useState<string | null>(null);
  const [adminUsername, setAdminUsername] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [adminFullName, setAdminFullName] = useState('');
  const [adminEmail, setAdminEmail] = useState('');
  const [adminRole, setAdminRole] = useState<'Super Admin' | 'Finance Admin' | 'Support Admin'>('Super Admin');
  const [editingAdminId, setEditingAdminId] = useState<string | null>(null);

  // States for Promo Code Management
  const [promoCodeState, setPromoCodeState] = useState<{
    id: string | null;
    code: string;
    type: 'percentage' | 'flat';
    value: number;
    minPurchase: number;
    maxDiscount: number;
    isActive: boolean;
    expiryDate: string;
    usageLimit: number;
  }>({
    id: null,
    code: '',
    type: 'percentage',
    value: 10,
    minPurchase: 0,
    maxDiscount: 50000,
    isActive: true,
    expiryDate: new Date(Date.now() + 3600000 * 24 * 30).toISOString().split('T')[0],
    usageLimit: 100,
  });
  const [promoFormError, setPromoFormError] = useState<string | null>(null);
  const [promoFormSuccess, setPromoFormSuccess] = useState<string | null>(null);

  const handleAddOrUpdatePromo = (e: React.FormEvent) => {
    e.preventDefault();
    setPromoFormError(null);
    setPromoFormSuccess(null);

    const cleanCode = promoCodeState.code.trim().toUpperCase();
    if (!cleanCode) {
      setPromoFormError('Kode promo tidak boleh kosong.');
      return;
    }

    if (promoCodeState.value <= 0) {
      setPromoFormError('Nilai potongan harus lebih besar dari 0.');
      return;
    }

    if (promoCodeState.type === 'percentage' && promoCodeState.value > 100) {
      setPromoFormError('Persentase potongan tidak boleh melebihi 100%.');
      return;
    }

    // Check duplicate code
    const isDuplicate = promoCodes?.some(
      p => p.id !== promoCodeState.id && p.code.toUpperCase() === cleanCode
    );
    if (isDuplicate) {
      setPromoFormError(`Kode promo "${cleanCode}" sudah ada.`);
      return;
    }

    let updatedPromoCodes: PromoCode[];

    if (promoCodeState.id) {
      // Editing existing promo code
      updatedPromoCodes = promoCodes.map(p =>
        p.id === promoCodeState.id
          ? {
              ...p,
              code: cleanCode,
              type: promoCodeState.type,
              value: Number(promoCodeState.value),
              minPurchase: Number(promoCodeState.minPurchase) > 0 ? Number(promoCodeState.minPurchase) : undefined,
              maxDiscount: Number(promoCodeState.maxDiscount) > 0 ? Number(promoCodeState.maxDiscount) : undefined,
              isActive: promoCodeState.isActive,
              expiryDate: promoCodeState.expiryDate || undefined,
              usageLimit: Number(promoCodeState.usageLimit) > 0 ? Number(promoCodeState.usageLimit) : undefined,
            }
          : p
      );
      setPromoFormSuccess(`Berhasil memperbarui kode promo "${cleanCode}".`);
    } else {
      // Creating new promo code
      const newPromo: PromoCode = {
        id: 'promo-' + Math.floor(100000 + Math.random() * 900000),
        code: cleanCode,
        type: promoCodeState.type,
        value: Number(promoCodeState.value),
        minPurchase: Number(promoCodeState.minPurchase) > 0 ? Number(promoCodeState.minPurchase) : undefined,
        maxDiscount: Number(promoCodeState.maxDiscount) > 0 ? Number(promoCodeState.maxDiscount) : undefined,
        isActive: promoCodeState.isActive,
        expiryDate: promoCodeState.expiryDate || undefined,
        usageLimit: Number(promoCodeState.usageLimit) > 0 ? Number(promoCodeState.usageLimit) : undefined,
        usageCount: 0,
      };
      updatedPromoCodes = [newPromo, ...(promoCodes || [])];
      setPromoFormSuccess(`Berhasil membuat kode promo "${cleanCode}".`);
    }

    onUpdatePromoCodes(updatedPromoCodes);

    // Reset form
    setPromoCodeState({
      id: null,
      code: '',
      type: 'percentage',
      value: 10,
      minPurchase: 0,
      maxDiscount: 50000,
      isActive: true,
      expiryDate: new Date(Date.now() + 3600000 * 24 * 30).toISOString().split('T')[0],
      usageLimit: 100,
    });
  };

  const handleEditPromoClick = (promo: PromoCode) => {
    setPromoCodeState({
      id: promo.id,
      code: promo.code,
      type: promo.type,
      value: promo.value,
      minPurchase: promo.minPurchase || 0,
      maxDiscount: promo.maxDiscount || 0,
      isActive: promo.isActive,
      expiryDate: promo.expiryDate || '',
      usageLimit: promo.usageLimit || 0,
    });
    setPromoFormError(null);
    setPromoFormSuccess(null);
  };

  const handleDeletePromo = (id: string, code: string) => {
    if (confirm(`Apakah Anda yakin ingin menghapus kode promo "${code}"?`)) {
      const updated = promoCodes.filter(p => p.id !== id);
      onUpdatePromoCodes(updated);
      if (onAddSystemLog) {
        onAddSystemLog(
          'system',
          'Kode Promo Dihapus',
          `Kode promo "${code}" telah dihapus secara permanen dari sistem oleh Admin.`
        );
      }
    }
  };

  const handleTogglePromoActive = (promo: PromoCode) => {
    const updated = promoCodes.map(p =>
      p.id === promo.id ? { ...p, isActive: !p.isActive } : p
    );
    onUpdatePromoCodes(updated);
    if (onAddSystemLog) {
      onAddSystemLog(
        'system',
        'Status Promo Diubah',
        `Status kode promo "${promo.code}" diubah menjadi ${!promo.isActive ? 'AKTIF' : 'NONAKTIF'}.`
      );
    }
  };

  const handleAddOrUpdateAdmin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminUsername.trim() || !adminPassword.trim() || !adminFullName.trim() || !adminEmail.trim()) {
      alert('Mohon lengkapi data admin.');
      return;
    }

    if (editingAdminId) {
      const usernameExists = adminUsers.some(
        u => u.id !== editingAdminId && u.username.toLowerCase() === adminUsername.trim().toLowerCase()
      );
      if (usernameExists) {
        alert('Username sudah digunakan oleh admin lain.');
        return;
      }

      const updated = adminUsers.map(u => 
        u.id === editingAdminId 
          ? {
              ...u,
              username: adminUsername.trim(),
              password: adminPassword,
              fullName: adminFullName.trim(),
              email: adminEmail.trim(),
              role: adminRole,
            }
          : u
      );
      onUpdateAdminUsers(updated);
      setEditingAdminId(null);
      
      if (onAddSystemLog) {
        onAddSystemLog('system', 'Admin Diperbarui', `Admin ${adminUsername} (${adminEmail.trim()}) telah diperbarui dengan peran ${adminRole}.`);
      }
    } else {
      const usernameExists = adminUsers.some(
        u => u.username.toLowerCase() === adminUsername.trim().toLowerCase()
      );
      if (usernameExists) {
        alert('Username sudah terdaftar.');
        return;
      }

      const newAdmin: AdminUser = {
        id: 'admin-' + Date.now(),
        username: adminUsername.trim(),
        password: adminPassword,
        fullName: adminFullName.trim(),
        email: adminEmail.trim(),
        role: adminRole,
        createdAt: new Date().toISOString()
      };

      onUpdateAdminUsers([...adminUsers, newAdmin]);
      
      if (onAddSystemLog) {
        onAddSystemLog('system', 'Admin Baru Ditambahkan', `Admin baru ${adminUsername} (${adminEmail.trim()}) telah terdaftar dengan peran ${adminRole}.`);
      }
    }

    setAdminUsername('');
    setAdminPassword('');
    setAdminFullName('');
    setAdminEmail('');
    setAdminRole('Super Admin');
  };

  const handleEditAdmin = (admin: AdminUser) => {
    setEditingAdminId(admin.id);
    setAdminUsername(admin.username);
    setAdminPassword(admin.password || '');
    setAdminFullName(admin.fullName);
    setAdminEmail(admin.email || '');
    setAdminRole(admin.role);
  };

  const handleDeleteAdmin = (id: string) => {
    if (adminUsers.length <= 1) {
      alert('Tidak dapat menghapus admin terakhir. Sistem membutuhkan minimal 1 administrator.');
      return;
    }

    const adminToDelete = adminUsers.find(u => u.id === id);
    if (confirm(`Apakah Anda yakin ingin menghapus admin "${adminToDelete?.fullName || id}"?`)) {
      const updated = adminUsers.filter(u => u.id !== id);
      onUpdateAdminUsers(updated);
      
      if (onAddSystemLog) {
        onAddSystemLog('system', 'Admin Dihapus', `Admin ${adminToDelete?.username || id} telah dihapus.`);
      }
    }
  };

  const handleCancelEditAdmin = () => {
    setEditingAdminId(null);
    setAdminUsername('');
    setAdminPassword('');
    setAdminFullName('');
    setAdminEmail('');
    setAdminRole('Super Admin');
  };

  // States for adding user
  const [vUserName, setVUserName] = useState('');
  const [vUserEmail, setVUserEmail] = useState('');
  const [vUserAccessCode, setVUserAccessCode] = useState('');

  const handleGenerateAccessCode = () => {
    const code = 'VLT-' + Math.random().toString(36).substring(2, 8).toUpperCase();
    setVUserAccessCode(code);
  };

  const handleAddVaultUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!vUserName.trim() || !vUserEmail.trim() || !vUserAccessCode.trim()) {
      alert('Mohon lengkapi seluruh data pengguna brankas.');
      return;
    }

    const emailExists = vaultUsers.some(u => u.email.toLowerCase() === vUserEmail.trim().toLowerCase());
    const codeExists = vaultUsers.some(u => u.accessCode.toUpperCase() === vUserAccessCode.trim().toUpperCase());

    if (emailExists) {
      alert('Email sudah terdaftar untuk pengguna brankas.');
      return;
    }
    if (codeExists) {
      alert('Kode akses sudah digunakan oleh pengguna lain. Silakan ganti kode.');
      return;
    }

    const newUser: VaultUser = {
      id: 'vuser-' + Date.now(),
      name: vUserName.trim(),
      email: vUserEmail.trim(),
      accessCode: vUserAccessCode.trim().toUpperCase(),
      createdAt: new Date().toISOString()
    };

    onUpdateVaultUsers([...vaultUsers, newUser]);
    
    if (onAddSystemLog) {
      onAddSystemLog(
        'system',
        'Pengguna Brankas Baru Ditambahkan',
        `Pengguna "${newUser.name}" (${newUser.email}) telah ditambahkan dengan kode akses "${newUser.accessCode}"`
      );
    }

    setVUserName('');
    setVUserEmail('');
    setVUserAccessCode('');
    alert(`✓ Pengguna "${newUser.name}" berhasil ditambahkan dengan kode akses: ${newUser.accessCode}`);
  };

  const handleDeleteVaultUser = (id: string) => {
    const userToDelete = vaultUsers.find(u => u.id === id);
    if (!userToDelete) return;

    if (!confirm(`Apakah Anda yakin ingin menghapus akses brankas untuk "${userToDelete.name}"?`)) {
      return;
    }

    onUpdateVaultUsers(vaultUsers.filter(u => u.id !== id));

    if (onAddSystemLog) {
      onAddSystemLog(
        'system',
        'Akses Pengguna Brankas Dihapus',
        `Akses untuk "${userToDelete.name}" (${userToDelete.email}) dengan kode akses "${userToDelete.accessCode}" telah dihapus.`
      );
    }
  };

  const openInvoiceForm = () => {
    if (products.length === 0) {
      alert('Silakan buat atau miliki minimal satu produk digital terlebih dahulu di Tab "Kelola Produk"!');
      return;
    }
    setInvProductId(products[0].id);
    setInvoiceItems([{ productId: products[0].id, quantity: 1 }]);
    setIsInvoiceFormOpen(!isInvoiceFormOpen);
    setInvoiceSuccess(null);
  };

  const handleAddInvoiceItem = () => {
    if (!invProductId) return;
    const selectedProd = products.find(p => p.id === invProductId);
    if (!selectedProd) return;

    // Check if product is already in the draft list
    const existingIndex = invoiceItems.findIndex(item => item.productId === invProductId);
    if (existingIndex !== -1) {
      const updated = [...invoiceItems];
      updated[existingIndex].quantity += 1;
      setInvoiceItems(updated);
    } else {
      setInvoiceItems([...invoiceItems, { productId: invProductId, quantity: 1 }]);
    }
  };

  const handleRemoveInvoiceItem = (index: number) => {
    const updated = invoiceItems.filter((_, i) => i !== index);
    setInvoiceItems(updated);
  };

  const handleUpdateInvoiceItemQty = (index: number, qty: number) => {
    if (qty < 1) return;
    const updated = [...invoiceItems];
    updated[index].quantity = qty;
    setInvoiceItems(updated);
  };

  const handleCreateDirectInvoice = (e: React.FormEvent) => {
    e.preventDefault();
    if (!invBuyerName.trim() || !invBuyerEmail.trim()) {
      alert('Mohon isi nama dan email pembeli.');
      return;
    }

    if (invoiceItems.length === 0) {
      alert('Mohon tambahkan minimal satu produk ke dalam daftar item invoice.');
      return;
    }

    const finalItems: any[] = [];
    let calculatedTotalPrice = 0;

    for (const item of invoiceItems) {
      const selectedProd = products.find(p => p.id === item.productId);
      if (!selectedProd) continue;

      for (let q = 0; q < item.quantity; q++) {
        const pool = selectedProd.licenseKeysPool;
        const alreadyPulledKeys = finalItems
          .filter(fi => fi.productId === selectedProd.id)
          .map(fi => fi.licenseKey);
        
        const remainingKeys = pool.filter(k => !alreadyPulledKeys.includes(k));

        const key = remainingKeys.length > 0 
          ? remainingKeys[0] 
          : `LIC-DIR-${selectedProd.id.toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`;

        const pass = 'DEC-' + Math.random().toString(36).substring(2, 6).toUpperCase();

        finalItems.push({
          productId: selectedProd.id,
          productName: selectedProd.name,
          price: selectedProd.price,
          licenseKey: key,
          fileUrl: selectedProd.fileUrl,
          fileSize: selectedProd.fileSize,
          decryptPassword: pass,
        });

        calculatedTotalPrice += selectedProd.price;
      }
    }

    const newTransaction: Transaction = {
      id: 'TRX-DIR-' + Math.floor(100000 + Math.random() * 900000),
      buyerName: invBuyerName.trim(),
      buyerEmail: invBuyerEmail.trim(),
      buyerPhone: invBuyerPhone.trim(),
      items: finalItems,
      totalPrice: calculatedTotalPrice,
      paymentMethod: invPaymentMethod,
      paymentStatus: invPaymentStatus,
      createdAt: new Date().toISOString(),
      paymentConfirmedAt: invPaymentStatus === PaymentStatus.SUCCESS ? new Date().toISOString() : undefined,
      fileDownloaded: false,
      emailSent: invPaymentStatus === PaymentStatus.SUCCESS,
    };

    onDirectCreateInvoice(newTransaction);

    setInvoiceSuccess(`Invoice ${newTransaction.id} sukses diterbitkan langsung untuk ${invBuyerName}!`);
    
    // Reset Form
    setInvBuyerName('');
    setInvBuyerEmail('');
    setInvBuyerPhone('');
    setInvoiceItems([]);
    if (products.length > 0) {
      setInvProductId(products[0].id);
    }
    setInvPaymentMethod('Virtual Account BCA');
    setInvPaymentStatus(PaymentStatus.SUCCESS);

    setTimeout(() => {
      setInvoiceSuccess(null);
      setIsInvoiceFormOpen(false);
    }, 3500);
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0,
    }).format(price);
  };

  const handleStartEdit = (p: Product) => {
    setEditingProductId(p.id);
    setProdName(p.name);
    setProdDesc(p.description);
    setProdCategory(p.category);
    setProdPrice(p.price);
    setProdImage(p.image);
    setProdFileUrl(p.fileUrl);
    setProdFileSize(p.fileSize);
    setProdLicense(p.licenseType);
    setProdKeys(p.licenseKeysPool.join('\n'));
  };

  const handleCancelEdit = () => {
    setEditingProductId(null);
    setProdName('');
    setProdDesc('');
    setProdKeys('');
    setProdCategory(categories && categories.length > 0 ? categories[0] : 'Software & License');
    setProdPrice(50000);
    setProdImage('https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=800&q=80');
    setProdFileUrl('https://storage.googleapis.com/digimarket-demo/downloads/custom-asset.zip');
    setProdFileSize('5.0 MB');
    setProdLicense('Single Use');
  };

  const handleCreateProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!prodName || !prodDesc) return;

    const keysArray = prodKeys
      .split('\n')
      .map((k) => k.trim())
      .filter((k) => k.length > 0);

    if (editingProductId) {
      const existingProduct = products.find((p) => p.id === editingProductId);
      if (!existingProduct) return;

      const updatedProduct: Product = {
        ...existingProduct,
        name: prodName,
        description: prodDesc,
        category: prodCategory,
        price: Number(prodPrice),
        image: prodImage,
        fileUrl: prodFileUrl,
        fileSize: prodFileSize,
        licenseType: prodLicense,
        licenseKeysPool: keysArray,
      };

      onUpdateProduct(updatedProduct);
      setEditingProductId(null);
      alert('Produk digital berhasil diperbarui!');
    } else {
      const newProduct: Product = {
        id: 'prod-' + Date.now(),
        name: prodName,
        description: prodDesc,
        category: prodCategory,
        price: Number(prodPrice),
        image: prodImage,
        fileUrl: prodFileUrl,
        fileSize: prodFileSize,
        rating: 5.0,
        reviewsCount: 0,
        sellerName: 'Admin Utama',
        licenseType: prodLicense,
        isFeatured: false,
        licenseKeysPool: keysArray,
      };

      onAddProduct(newProduct);
      alert('Produk digital berhasil dipublikasikan ke Toko!');
    }

    // Reset Form
    setProdName('');
    setProdDesc('');
    setProdKeys('');
    setProdPrice(50000);
    setProdImage('https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=800&q=80');
    setProdFileUrl('https://storage.googleapis.com/digimarket-demo/downloads/custom-asset.zip');
    setProdFileSize('5.0 MB');
    setProdLicense('Single Use');
    setEditingProductId(null);
  };

  const matchedEditingTrx = editingTransactionId ? transactions.find(t => t.id === editingTransactionId) : null;

  return (
    <div className="space-y-6">
      {/* Title & Stats */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-100 pb-5">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
              <Database className="w-5.5 h-5.5 text-sky-600" /> Pusat Kontrol & Admin System
            </h2>
            {loggedInAdmin && (
              <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full border ${
                isSuperAdmin 
                  ? 'bg-purple-50 text-purple-700 border-purple-100'
                  : 'bg-slate-50 text-slate-700 border-slate-200'
              }`}>
                👤 {loggedInAdmin.fullName} ({loggedInAdmin.role})
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500">Kelola katalog digital, pantau webhook pembayaran, dan audit otomatisasi lisensi.</p>
        </div>

        {/* Navigation & Logout Controls */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Admin Navigation */}
          <div className="flex bg-slate-100 p-1 rounded-xl w-fit shrink-0">
            <button
              onClick={() => setActiveTab('transactions')}
              className={`px-4 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                activeTab === 'transactions' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Transaksi ({transactions.length})
            </button>
            <button
              onClick={() => setActiveTab('products')}
              className={`px-4 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                activeTab === 'products' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Kelola Produk ({products.length})
            </button>
            <button
              onClick={() => setActiveTab('users')}
              className={`px-4 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                activeTab === 'users' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Kelola Pengguna ({vaultUsers.length})
            </button>
            <button
              onClick={() => setActiveTab('logs')}
              className={`px-4 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                activeTab === 'logs' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Log Otomatisasi ({systemLogs.length})
            </button>
            <button
              onClick={() => setActiveTab('complaints_payments')}
              className={`px-4 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer flex items-center gap-1 ${
                activeTab === 'complaints_payments' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <MessageSquare className="w-3.5 h-3.5" /> Komplain & Pembayaran ({complaints.length})
            </button>
            <button
              onClick={() => setActiveTab('settings')}
              className={`px-4 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer flex items-center gap-1 ${
                activeTab === 'settings' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <Settings className="w-3.5 h-3.5" /> Seting Toko
            </button>
            <button
              onClick={() => setActiveTab('promos')}
              className={`px-4 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer flex items-center gap-1 ${
                activeTab === 'promos' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <Tag className="w-3.5 h-3.5 text-rose-500" /> Voucher & Promo ({promoCodes?.length || 0})
            </button>
            <button
              onClick={() => setActiveTab('silaturahmi')}
              className={`px-4 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer flex items-center gap-1 ${
                activeTab === 'silaturahmi' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              🤝 Pojok Silaturahmi ({silaturahmiMessages?.length || 0})
            </button>
          </div>

          {/* Logout Button */}
          <button
            onClick={onLogout}
            className="px-3.5 py-2.5 bg-rose-50 hover:bg-rose-150 border border-rose-100 text-rose-700 hover:text-rose-800 text-xs font-black rounded-xl transition-colors cursor-pointer flex items-center gap-1.5 shadow-xs"
            title="Logout dari Panel Admin"
          >
            <LogOut className="w-4 h-4" /> Keluar
          </button>
        </div>
      </div>

      {/* TAB 1: Transactions Monitoring */}
      {activeTab === 'transactions' && (
        <div className="space-y-4">
          
          {/* Direct Invoice Creator Form */}
          {isInvoiceFormOpen && (
            <div className="bg-white border border-sky-100 rounded-2xl p-6 shadow-xs ring-1 ring-sky-500/5 transition-all space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-sky-50 text-sky-600 rounded-lg">
                    <FileText className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-black text-slate-900 uppercase tracking-wide">Pusat Pembuatan Invoice Langsung</h4>
                    <p className="text-[10px] text-slate-400">Terbitkan invoice digital, alokasikan kode lisensi, dan kirim email simulasi secara instan.</p>
                  </div>
                </div>
                <button
                  onClick={() => setIsInvoiceFormOpen(false)}
                  className="text-slate-400 hover:text-slate-600 text-xs font-bold cursor-pointer"
                >
                  Batal
                </button>
              </div>

              {invoiceSuccess ? (
                <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-4 rounded-xl flex items-center gap-3 text-xs font-bold">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                  <span>{invoiceSuccess}</span>
                </div>
              ) : (
                <form onSubmit={handleCreateDirectInvoice} className="space-y-6">
                  {/* Bagian 1: Identitas Pembeli */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-slate-50/50 p-4 rounded-xl border border-slate-100">
                    <div className="md:col-span-3">
                      <h5 className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">1. Identitas Pembeli</h5>
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Nama Pembeli</label>
                      <input
                        type="text"
                        placeholder="Masukkan nama pembeli"
                        value={invBuyerName}
                        onChange={(e) => setInvBuyerName(e.target.value)}
                        className="w-full text-xs bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 focus:outline-hidden focus:ring-1 focus:ring-sky-500 font-medium"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Email Pembeli</label>
                      <input
                        type="email"
                        placeholder="pembeli@domain.com"
                        value={invBuyerEmail}
                        onChange={(e) => setInvBuyerEmail(e.target.value)}
                        className="w-full text-xs bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 focus:outline-hidden focus:ring-1 focus:ring-sky-500 font-medium"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">No. WhatsApp Pembeli</label>
                      <input
                        type="tel"
                        placeholder="Contoh: 08123456789"
                        value={invBuyerPhone}
                        onChange={(e) => setInvBuyerPhone(e.target.value)}
                        className="w-full text-xs bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 focus:outline-hidden focus:ring-1 focus:ring-sky-500 font-medium"
                      />
                    </div>
                  </div>

                  {/* Bagian 2: Daftar Barang Belanja */}
                  <div className="bg-slate-50/50 p-4 rounded-xl border border-slate-100 space-y-4">
                    <div className="flex items-center justify-between">
                      <h5 className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">2. Daftar Barang Belanja</h5>
                      <span className="text-[10px] bg-sky-50 text-sky-700 font-bold px-2 py-0.5 rounded-md">
                        {invoiceItems.length} Item Ditambahkan
                      </span>
                    </div>

                    {/* Form Tambah Item Baru */}
                    <div className="flex flex-col sm:flex-row gap-3 bg-white p-3 rounded-lg border border-slate-100">
                      <div className="flex-1">
                        <label className="block text-[9px] font-extrabold text-slate-400 uppercase mb-1">Pilih Produk Digital</label>
                        <select
                          value={invProductId}
                          onChange={(e) => setInvProductId(e.target.value)}
                          className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-2 focus:outline-hidden focus:ring-1 focus:ring-sky-500 font-medium text-slate-800"
                        >
                          {products.map(p => (
                            <option key={p.id} value={p.id}>
                              {p.name} ({formatPrice(p.price)})
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="sm:self-end">
                        <button
                          type="button"
                          onClick={handleAddInvoiceItem}
                          className="w-full sm:w-auto px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs rounded-lg transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                        >
                          <Plus className="w-3.5 h-3.5" /> Tambahkan Barang
                        </button>
                      </div>
                    </div>

                    {/* Tabel Daftar Item Draft */}
                    <div className="border border-slate-100 rounded-xl bg-white overflow-hidden">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="bg-slate-50 border-b border-slate-150">
                            <th className="p-2.5 text-[9px] font-extrabold text-slate-400 uppercase tracking-wider">Produk</th>
                            <th className="p-2.5 text-[9px] font-extrabold text-slate-400 uppercase tracking-wider text-right">Harga Satuan</th>
                            <th className="p-2.5 text-[9px] font-extrabold text-slate-400 uppercase tracking-wider text-center w-24">Jumlah</th>
                            <th className="p-2.5 text-[9px] font-extrabold text-slate-400 uppercase tracking-wider text-right">Subtotal</th>
                            <th className="p-2.5 text-[9px] font-extrabold text-slate-400 uppercase tracking-wider text-center w-12">Hapus</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 text-xs">
                          {invoiceItems.length === 0 ? (
                            <tr>
                              <td colSpan={5} className="p-6 text-center text-slate-400">
                                Belum ada barang ditambahkan. Silakan pilih produk di atas dan klik "Tambahkan Barang".
                              </td>
                            </tr>
                          ) : (
                            invoiceItems.map((item, index) => {
                              const prod = products.find(p => p.id === item.productId);
                              if (!prod) return null;
                              const subtotal = prod.price * item.quantity;
                              return (
                                <tr key={`${item.productId}-${index}`} className="hover:bg-slate-50/50">
                                  <td className="p-2.5 font-bold text-slate-800">{prod.name}</td>
                                  <td className="p-2.5 text-right font-medium text-slate-600">{formatPrice(prod.price)}</td>
                                  <td className="p-2.5">
                                    <div className="flex items-center justify-center gap-1.5">
                                      <button
                                        type="button"
                                        onClick={() => handleUpdateInvoiceItemQty(index, item.quantity - 1)}
                                        className="w-5 h-5 flex items-center justify-center bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-md font-bold text-xs cursor-pointer animate-scale"
                                      >
                                        -
                                      </button>
                                      <span className="font-bold text-slate-800 w-6 text-center">{item.quantity}</span>
                                      <button
                                        type="button"
                                        onClick={() => handleUpdateInvoiceItemQty(index, item.quantity + 1)}
                                        className="w-5 h-5 flex items-center justify-center bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-md font-bold text-xs cursor-pointer animate-scale"
                                      >
                                        +
                                      </button>
                                    </div>
                                  </td>
                                  <td className="p-2.5 text-right font-bold text-slate-900">{formatPrice(subtotal)}</td>
                                  <td className="p-2.5 text-center">
                                    <button
                                      type="button"
                                      onClick={() => handleRemoveInvoiceItem(index)}
                                      className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors cursor-pointer"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  </td>
                                </tr>
                              );
                            })
                          )}
                        </tbody>
                      </table>
                    </div>

                    {/* Total Tagihan */}
                    <div className="flex justify-end pr-2.5 pt-1">
                      <div className="text-right">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Total Tagihan</span>
                        <span className="text-base font-black text-slate-900">
                          {formatPrice(
                            invoiceItems.reduce((acc, item) => {
                              const prod = products.find(p => p.id === item.productId);
                              return acc + (prod ? prod.price * item.quantity : 0);
                            }, 0)
                          )}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Bagian 3: Konfigurasi Pembayaran */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-50/50 p-4 rounded-xl border border-slate-100">
                    <div className="md:col-span-2">
                      <h5 className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">3. Konfigurasi Pembayaran</h5>
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Metode Pembayaran</label>
                      <select
                        value={invPaymentMethod}
                        onChange={(e) => setInvPaymentMethod(e.target.value)}
                        className="w-full text-xs bg-white border border-slate-200 rounded-xl px-3 py-2.5 focus:outline-hidden focus:ring-1 focus:ring-sky-500 font-medium text-slate-800"
                      >
                        {paymentMethods.map(m => (
                          <option key={m.id} value={m.name}>{m.name}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Status Pembayaran</label>
                      <select
                        value={invPaymentStatus}
                        onChange={(e) => setInvPaymentStatus(e.target.value as PaymentStatus)}
                        className="w-full text-xs bg-white border border-slate-200 rounded-xl px-3 py-2.5 focus:outline-hidden focus:ring-1 focus:ring-sky-500 font-medium text-slate-800"
                      >
                        <option value={PaymentStatus.SUCCESS}>LUNAS (Otomatis Kirim Kode)</option>
                        <option value={PaymentStatus.PENDING}>PENDING (Menunggu Dana)</option>
                      </select>
                    </div>
                  </div>

                  <div className="pt-2">
                    <button
                      type="submit"
                      className="w-full py-3 bg-slate-900 hover:bg-sky-600 text-white font-extrabold text-xs rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-sm uppercase tracking-wider"
                    >
                      <Plus className="w-4 h-4" /> Terbitkan & Kirim Invoice Multi-Barang
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}

          {/* Edit Transaction Form */}
          {editingTransactionId && (
            <div className="bg-white border border-sky-100 rounded-2xl p-6 shadow-xs ring-1 ring-sky-500/5 transition-all space-y-4 animate-fadeIn">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-sky-50 text-sky-600 rounded-lg">
                    <Pencil className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-black text-slate-900 uppercase tracking-wide">Modifikasi & Verifikasi Transaksi Manual</h4>
                    <p className="text-[10px] text-slate-400">Sesuaikan status pembayaran, metode bayar, alokasi lisensi, dan password dekripsi brankas untuk ID: {editingTransactionId}</p>
                  </div>
                </div>
                <button
                  onClick={() => setEditingTransactionId(null)}
                  className="text-slate-400 hover:text-slate-600 text-xs font-bold cursor-pointer"
                >
                  Batal
                </button>
              </div>

              <form onSubmit={(e) => {
                e.preventDefault();
                const matchedTrx = transactions.find(t => t.id === editingTransactionId);
                if (!matchedTrx) return;

                const updatedTrx: Transaction = {
                  ...matchedTrx,
                  paymentStatus: editTrxPaymentStatus,
                  paymentMethod: editTrxPaymentMethod,
                  paymentConfirmedAt: editTrxPaymentStatus === PaymentStatus.SUCCESS && !matchedTrx.paymentConfirmedAt ? new Date().toISOString() : matchedTrx.paymentConfirmedAt,
                  items: editTrxItems,
                };

                if (onUpdateTransaction) {
                  onUpdateTransaction(updatedTrx);
                }
                setEditingTransactionId(null);
                alert('✓ Detail transaksi berhasil diperbarui secara manual!');
              }} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Status Pembayaran</label>
                    <select
                      value={editTrxPaymentStatus}
                      onChange={(e) => setEditTrxPaymentStatus(e.target.value as PaymentStatus)}
                      className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 focus:bg-white focus:outline-hidden focus:ring-1 focus:ring-sky-500 font-medium"
                    >
                      <option value={PaymentStatus.SUCCESS}>LUNAS (Sukses)</option>
                      <option value={PaymentStatus.VERIFYING}>VERIFYING (Sedang Diverifikasi)</option>
                      <option value={PaymentStatus.PENDING}>PENDING (Menunggu Pembayaran)</option>
                      <option value={PaymentStatus.FAILED}>FAILED (Gagal / Batal)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Metode Pembayaran</label>
                    <input
                      type="text"
                      placeholder="Contoh: Virtual Account BCA, Transfer Manual"
                      value={editTrxPaymentMethod}
                      onChange={(e) => setEditTrxPaymentMethod(e.target.value)}
                      className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 focus:bg-white focus:outline-hidden focus:ring-1 focus:ring-sky-500 font-medium"
                      required
                    />
                  </div>
                </div>

                {/* Detail Bukti Pembayaran */}
                {matchedEditingTrx && (matchedEditingTrx.senderBank || matchedEditingTrx.senderName || matchedEditingTrx.senderNotes || matchedEditingTrx.paymentProof) && (
                  <div className="bg-slate-50 border border-slate-100 rounded-xl p-4 space-y-3">
                    <h5 className="text-[10px] font-black text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                      <FileText className="w-3.5 h-3.5 text-sky-600" /> Informasi Konfirmasi Pengirim & Bukti Transfer
                    </h5>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                      {matchedEditingTrx.senderBank && (
                        <div>
                          <span className="font-semibold text-slate-400 block text-[9px] uppercase tracking-wider">Bank Pengirim</span>
                          <span className="font-bold text-slate-800">{matchedEditingTrx.senderBank}</span>
                        </div>
                      )}
                      {matchedEditingTrx.senderName && (
                        <div>
                          <span className="font-semibold text-slate-400 block text-[9px] uppercase tracking-wider">Pemilik Rekening</span>
                          <span className="font-bold text-slate-800">{matchedEditingTrx.senderName}</span>
                        </div>
                      )}
                      {matchedEditingTrx.senderNotes && (
                        <div className="md:col-span-2">
                          <span className="font-semibold text-slate-400 block text-[9px] uppercase tracking-wider">Catatan Pengirim</span>
                          <p className="text-slate-700 bg-white border border-slate-100 rounded-lg p-2.5 mt-1 text-[11px] leading-relaxed">
                            {matchedEditingTrx.senderNotes}
                          </p>
                        </div>
                      )}
                      {matchedEditingTrx.paymentProof && (
                        <div className="md:col-span-2">
                          <span className="font-semibold text-slate-400 block text-[9px] uppercase tracking-wider mb-1.5">Lampiran Bukti Transfer</span>
                          {matchedEditingTrx.paymentProof.startsWith('data:image/') ? (
                            <div className="relative group w-fit">
                              <img
                                src={matchedEditingTrx.paymentProof}
                                alt="Bukti Transfer"
                                className="max-h-48 rounded-lg border border-slate-200 object-contain shadow-xs bg-white"
                              />
                              <div className="mt-1.5">
                                <a
                                  href={matchedEditingTrx.paymentProof}
                                  download={`Bukti_Transfer_${matchedEditingTrx.id}.png`}
                                  className="text-[10px] font-bold text-sky-600 hover:text-sky-800 flex items-center gap-1 hover:underline cursor-pointer"
                                >
                                  <Download className="w-3 h-3" /> Unduh Gambar Bukti
                                </a>
                              </div>
                            </div>
                          ) : (
                            <div className="bg-white border border-slate-200 rounded-lg p-3 flex items-center justify-between w-fit gap-6">
                              <div className="flex items-center gap-2">
                                <Paperclip className="w-4 h-4 text-slate-400" />
                                <span className="text-[11px] font-bold text-slate-700">File Bukti Transfer</span>
                              </div>
                              <a
                                href={matchedEditingTrx.paymentProof}
                                download={`Bukti_Transfer_${matchedEditingTrx.id}`}
                                className="px-3 py-1 bg-sky-50 text-sky-600 hover:bg-sky-100 hover:text-sky-700 text-[10px] font-bold rounded-lg transition-colors border border-sky-100 cursor-pointer"
                              >
                                Unduh File
                              </a>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Push manual to Firebase button */}
                      <div className="md:col-span-2 pt-3 border-t border-slate-150/45 mt-2">
                        <div className="flex items-center justify-between gap-4">
                          <div>
                            <span className="font-bold text-[10px] text-slate-800 uppercase tracking-wider block">Firebase Database Cloud Sync</span>
                            <span className="text-[10px] text-slate-400">Pindahkan lampiran bukti & log transaksi ke Firestore collection ("uploads").</span>
                          </div>
                          <button
                            type="button"
                            onClick={() => handlePushToFirebase(matchedEditingTrx)}
                            disabled={pushStatus === 'loading'}
                            className={`px-3 py-2 text-xs font-black rounded-lg transition-all cursor-pointer flex items-center gap-1.5 border hover:scale-105 active:scale-95 ${
                              pushStatus === 'success'
                                ? 'bg-emerald-50 text-emerald-600 border-emerald-200'
                                : pushStatus === 'error'
                                ? 'bg-rose-50 text-rose-600 border-rose-200'
                                : 'bg-sky-50 text-sky-600 hover:bg-sky-100 border-sky-100'
                            }`}
                          >
                            <Database className="w-3.5 h-3.5" />
                            {pushStatus === 'loading'
                              ? 'Mendorong...'
                              : pushStatus === 'success'
                              ? 'Sukses Terkirim!'
                              : pushStatus === 'error'
                              ? 'Gagal, Coba Lagi'
                              : 'Push ke Firebase'}
                          </button>
                        </div>
                        {pushMessage && (
                          <p className={`mt-2 text-[10px] font-mono leading-normal p-2 rounded-lg border ${
                            pushStatus === 'success'
                              ? 'bg-emerald-50/50 text-emerald-700 border-emerald-100/50'
                              : pushStatus === 'error'
                              ? 'bg-rose-50/50 text-rose-700 border-rose-100/50'
                              : 'bg-sky-50/30 text-sky-700 border-sky-100/30'
                          }`}>
                            {pushMessage}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Edit Items (License Key & Password Dekripsi) */}
                <div className="space-y-3">
                  <h5 className="text-[10px] font-bold text-slate-700 uppercase tracking-wider">Modifikasi Aset Item Digital & Kode Akses Dekripsi</h5>
                  <div className="space-y-3 bg-slate-50 border border-slate-100 rounded-xl p-4">
                    {editTrxItems.map((item, index) => (
                      <div key={index} className="grid grid-cols-1 md:grid-cols-2 gap-3 pb-3 border-b border-slate-200/60 last:border-0 last:pb-0">
                        <div className="md:col-span-2">
                          <span className="text-xs font-bold text-slate-800">{item.productName}</span>
                        </div>
                        <div>
                          <label className="block text-[9px] font-bold text-slate-400 uppercase mb-1">Kode Lisensi Aktivasi</label>
                          <input
                            type="text"
                            value={item.licenseKey || ''}
                            onChange={(e) => {
                              const newItems = [...editTrxItems];
                              newItems[index] = { ...newItems[index], licenseKey: e.target.value };
                              setEditTrxItems(newItems);
                            }}
                            className="w-full text-xs bg-white border border-slate-200 rounded-lg px-2.5 py-2 focus:outline-hidden focus:ring-1 focus:ring-sky-500 font-mono font-medium text-slate-700"
                          />
                        </div>
                        <div>
                          <label className="block text-[9px] font-bold text-slate-400 uppercase mb-1">Sandi Dekripsi Brankas (Khusus Item Ini)</label>
                          <input
                            type="text"
                            value={item.decryptPassword || ''}
                            onChange={(e) => {
                              const newItems = [...editTrxItems];
                              newItems[index] = { ...newItems[index], decryptPassword: e.target.value.toUpperCase() };
                              setEditTrxItems(newItems);
                            }}
                            placeholder="Contoh: DEC-XXXX"
                            className="w-full text-xs bg-white border border-slate-200 rounded-lg px-2.5 py-2 focus:outline-hidden focus:ring-1 focus:ring-sky-500 font-mono font-bold text-slate-800 uppercase"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex justify-end gap-2.5 pt-2">
                  <button
                    type="button"
                    onClick={() => setEditingTransactionId(null)}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-colors cursor-pointer"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-slate-900 hover:bg-sky-600 text-white font-extrabold text-xs rounded-xl transition-colors cursor-pointer flex items-center gap-1.5 shadow-sm"
                  >
                    <CheckCircle2 className="w-4 h-4" /> Simpan Perubahan Transaksi
                  </button>
                </div>
              </form>
            </div>
          )}

          <div className="bg-white border border-slate-100 rounded-2xl overflow-hidden shadow-xs">
            <div className="px-6 py-4 bg-slate-50/50 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                <Activity className="w-4 h-4 text-sky-600" /> Monitoring Transaksi Real-time
              </h3>
              
              <div className="flex items-center gap-2.5">
                <button
                  onClick={openInvoiceForm}
                  className="px-3.5 py-2 bg-slate-900 hover:bg-sky-600 text-white text-[10.5px] font-black rounded-xl transition-colors cursor-pointer flex items-center gap-1.5 shadow-xs"
                >
                  <FileText className="w-3.5 h-3.5" /> Buat Invoice Langsung
                </button>
                <span className="text-[10px] text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full font-semibold border border-emerald-100">
                  Webhook Callback Ready
                </span>
              </div>
            </div>

            {transactions.length === 0 ? (
              <div className="p-12 text-center text-slate-400">
                <HelpCircle className="w-10 h-10 mx-auto mb-3 text-slate-300" />
                <p className="text-xs font-medium">Belum ada transaksi di sandbox.</p>
                <p className="text-[10px] mt-1 text-slate-400">Lakukan pembelian produk digital dari Tab Belanja untuk memulai simulasi transaksi.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50/50 text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100">
                      <th className="px-6 py-3">ID Transaksi</th>
                      <th className="px-6 py-3">Pembeli</th>
                      <th className="px-6 py-3">Produk & Aset</th>
                      <th className="px-6 py-3">Metode & Nilai</th>
                      <th className="px-6 py-3">Pengiriman & Log</th>
                      <th className="px-6 py-3 text-right">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs text-slate-600">
                    {transactions.map((trx) => (
                      <tr key={trx.id} className="hover:bg-slate-50/40 transition-colors">
                        <td className="px-6 py-4 font-mono font-bold text-slate-800">{trx.id}</td>
                        <td className="px-6 py-4">
                          <div className="font-bold text-slate-900">{trx.buyerName}</div>
                          <div className="text-[10px] text-slate-400 font-mono">{trx.buyerEmail}</div>
                          {trx.buyerPhone && (
                            <div className="text-[10px] text-emerald-600 font-semibold mt-0.5 flex items-center gap-1">
                              <span>💬</span> <span className="font-mono">{trx.buyerPhone}</span>
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4 max-w-[220px]">
                          {trx.items.map((item, i) => (
                            <div key={i} className="mb-1 last:mb-0">
                              <div className="font-bold text-slate-800 truncate" title={item.productName}>
                                {item.productName}
                              </div>
                              <div className="text-[9px] font-semibold text-sky-600 font-mono mt-0.5 flex items-center gap-1">
                                <Key className="w-2.5 h-2.5" /> Lisensi: {item.licenseKey || 'Tersimpan Terenkripsi'}
                              </div>
                            </div>
                          ))}
                        </td>
                        <td className="px-6 py-4">
                          <div className="font-bold text-slate-900">{formatPrice(trx.totalPrice)}</div>
                          <div className="text-[9px] text-slate-400">{trx.paymentMethod}</div>
                          {trx.paymentStatus === PaymentStatus.SUCCESS ? (
                            <span className="inline-block mt-1 px-2 py-0.5 text-[9px] font-black text-emerald-700 bg-emerald-50 rounded-md border border-emerald-100">
                              LUNAS (OTOMATIS)
                            </span>
                          ) : (
                            <span className="inline-block mt-1 px-2 py-0.5 text-[9px] font-black text-amber-700 bg-amber-50 rounded-md border border-amber-100 animate-pulse">
                              PENDING (MENUNGGU)
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 space-y-1">
                          <div className="flex items-center gap-1.5 text-[10px]">
                            <Mail className="w-3.5 h-3.5 text-sky-500" />
                            <span className="font-semibold text-slate-700">Email Receipt: </span>
                            {trx.paymentStatus === PaymentStatus.SUCCESS ? (
                              <span className="text-emerald-600 font-bold">Terkirim</span>
                            ) : (
                              <span className="text-slate-400 font-bold">Menunggu Lunas</span>
                            )}
                          </div>
                          <div className="flex items-center gap-1.5 text-[10px]">
                            <Download className="w-3.5 h-3.5 text-indigo-500" />
                            <span className="font-semibold text-slate-700">Aset Download: </span>
                            <span className="text-slate-500 font-mono">{trx.items[0].fileSize}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center gap-1.5 justify-end">
                            <button
                              onClick={() => setSelectedInvoice(trx)}
                              className="px-2 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-bold rounded-lg transition-colors cursor-pointer inline-flex items-center gap-1 shadow-xs"
                              title="Tampilkan, Cetak, atau Kirim Invoice"
                            >
                              <FileText className="w-3.5 h-3.5 text-slate-500" /> Invoice
                            </button>
                            <button
                              onClick={() => {
                                setEditingTransactionId(trx.id);
                                setEditTrxPaymentStatus(trx.paymentStatus);
                                setEditTrxPaymentMethod(trx.paymentMethod);
                                setEditTrxItems([...trx.items]);
                                window.scrollTo({ top: 0, behavior: 'smooth' });
                              }}
                              className="px-2 py-1.5 bg-slate-900 hover:bg-sky-600 text-white text-[11px] font-bold rounded-lg transition-colors cursor-pointer inline-flex items-center gap-1 shadow-xs"
                              title="Edit Detail Transaksi, Status, Metode, & Sandi Dekripsi"
                            >
                              <Pencil className="w-3.5 h-3.5" /> Edit
                            </button>
                            {isSuperAdmin && onDeleteTransaction && (
                              <button
                                onClick={() => {
                                  if (window.confirm(`Apakah Anda yakin ingin menghapus transaksi ${trx.id} untuk ${trx.buyerName}? Tindakan ini tidak dapat dibatalkan.`)) {
                                    onDeleteTransaction(trx.id);
                                  }
                                }}
                                className="px-2 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 text-[11px] font-bold rounded-lg transition-colors cursor-pointer inline-flex items-center gap-1 shadow-xs"
                                title="Hapus Transaksi Permanen (Hanya Super Admin)"
                              >
                                <Trash2 className="w-3.5 h-3.5" /> Hapus
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: Manage Products and Inventory */}
      {activeTab === 'products' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Add Product Form */}
          <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-xs h-fit">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-4 flex items-center gap-1.5">
              {editingProductId ? (
                <>
                  <Pencil className="w-4 h-4 text-sky-600" /> Edit Detail Produk Digital
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4 text-sky-600" /> Publikasikan Aset Digital Baru
                </>
              )}
            </h3>

            <form onSubmit={handleCreateProduct} className="space-y-4">
              <div>
                <label className="block text-[10px] font-semibold text-slate-500 uppercase mb-1">Nama Produk</label>
                <input
                  type="text"
                  placeholder="Contoh: Admin Dashboard Core UI Template"
                  value={prodName}
                  onChange={(e) => setProdName(e.target.value)}
                  className="w-full text-xs bg-white border border-slate-200 rounded-lg px-3 py-2.5 focus:ring-1 focus:ring-sky-500 focus:outline-hidden"
                  required
                />
              </div>

              <div>
                <label className="block text-[10px] font-semibold text-slate-500 uppercase mb-1">Kategori</label>
                <select
                  value={prodCategory}
                  onChange={(e) => setProdCategory(e.target.value)}
                  className="w-full text-xs bg-white border border-slate-200 rounded-lg px-3 py-2.5 focus:ring-1 focus:ring-sky-500 focus:outline-hidden"
                >
                  {categories.map((cat) => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>

                {/* Inline category adder */}
                <div className="bg-slate-50 border border-slate-100 rounded-xl p-3 space-y-2 mt-2">
                  <span className="block text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                    + Tambah Kategori Baru
                  </span>
                  <div className="flex gap-1.5">
                    <input
                      type="text"
                      placeholder="Nama Kategori..."
                      value={newCategoryInput}
                      onChange={(e) => setNewCategoryInput(e.target.value)}
                      className="flex-1 text-[11px] bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-hidden focus:ring-1 focus:ring-sky-500 font-medium text-slate-700"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        const trimmed = newCategoryInput.trim();
                        if (!trimmed) return;
                        if (categories.includes(trimmed)) {
                          alert('Kategori tersebut sudah ada!');
                          return;
                        }
                        onUpdateCategories([...categories, trimmed]);
                        setProdCategory(trimmed);
                        setNewCategoryInput('');
                        alert(`✓ Kategori "${trimmed}" berhasil ditambahkan!`);
                      }}
                      className="px-3 py-1.5 bg-slate-900 hover:bg-sky-600 text-white font-bold text-[10px] rounded-lg transition-colors cursor-pointer shrink-0"
                    >
                      Tambah
                    </button>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-semibold text-slate-500 uppercase mb-1">Harga (Rupiah)</label>
                  <input
                    type="number"
                    value={prodPrice}
                    onChange={(e) => setProdPrice(Number(e.target.value))}
                    className="w-full text-xs bg-white border border-slate-200 rounded-lg px-3 py-2.5 focus:ring-1 focus:ring-sky-500 focus:outline-hidden font-mono"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-semibold text-slate-500 uppercase mb-1">Tipe Lisensi</label>
                  <select
                    value={prodLicense}
                    onChange={(e) => setProdLicense(e.target.value as any)}
                    className="w-full text-xs bg-white border border-slate-200 rounded-lg px-3 py-2.5 focus:ring-1 focus:ring-sky-500 focus:outline-hidden"
                  >
                    <option value="Single Use">Single Use</option>
                    <option value="Commercial">Commercial</option>
                    <option value="GPL">GPL</option>
                    <option value="SaaS License">SaaS License</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-semibold text-slate-500 uppercase mb-1">Deskripsi Aset</label>
                <textarea
                  rows={3}
                  placeholder="Terangkan fitur-fitur utama dan kegunaan aset kreatif ini..."
                  value={prodDesc}
                  onChange={(e) => setProdDesc(e.target.value)}
                  className="w-full text-xs bg-white border border-slate-200 rounded-lg p-3 focus:ring-1 focus:ring-sky-500 focus:outline-hidden resize-none"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-semibold text-slate-500 uppercase mb-1">Ukuran File</label>
                  <input
                    type="text"
                    value={prodFileSize}
                    onChange={(e) => setProdFileSize(e.target.value)}
                    className="w-full text-xs bg-white border border-slate-200 rounded-lg px-3 py-2 focus:ring-1 focus:ring-sky-500 focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-semibold text-slate-500 uppercase mb-1">Gambar URL (Unsplash)</label>
                  <input
                    type="text"
                    value={prodImage}
                    onChange={(e) => setProdImage(e.target.value)}
                    className="w-full text-xs bg-white border border-slate-200 rounded-lg px-3 py-2 focus:ring-1 focus:ring-sky-500 focus:outline-hidden text-slate-400"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-semibold text-slate-500 uppercase mb-1">Link File Unduhan (URL)</label>
                <input
                  type="text"
                  placeholder="Contoh: https://storage.googleapis.com/.../file.zip"
                  value={prodFileUrl}
                  onChange={(e) => setProdFileUrl(e.target.value)}
                  className="w-full text-xs bg-white border border-slate-200 rounded-lg px-3 py-2.5 focus:ring-1 focus:ring-sky-500 focus:outline-hidden font-mono text-slate-600"
                  required
                />
              </div>

              <div>
                <label className="block text-[10px] font-semibold text-slate-500 uppercase mb-1">
                  Kumpulan Kode Lisensi (Satu Kode Per Baris)
                </label>
                <textarea
                  rows={3}
                  value={prodKeys}
                  onChange={(e) => setProdKeys(e.target.value)}
                  placeholder="DF-KEY-1122&#10;DF-KEY-3344"
                  className="w-full text-xs bg-slate-50 font-mono border border-slate-200 rounded-lg p-3 focus:ring-1 focus:ring-sky-500 focus:outline-hidden resize-none"
                />
              </div>

              <div className="flex gap-2">
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-slate-900 hover:bg-sky-600 text-white font-bold text-xs rounded-xl transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                >
                  {editingProductId ? (
                    <>
                      <CheckCircle2 className="w-4 h-4" /> Simpan Perubahan
                    </>
                  ) : (
                    <>
                      <Plus className="w-4 h-4" /> Publikasikan Produk Digital
                    </>
                  )}
                </button>
                {editingProductId && (
                  <button
                    type="button"
                    onClick={handleCancelEdit}
                    className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-colors cursor-pointer"
                  >
                    Batal
                  </button>
                )}
              </div>
            </form>
          </div>

          {/* Active Inventory List */}
          <div className="lg:col-span-2 bg-white border border-slate-100 rounded-2xl p-5 shadow-xs">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-4">
              Katalog & Stok Kode Lisensi Otomatis
            </h3>

            <div className="space-y-3 max-h-[580px] overflow-y-auto pr-2">
              {products.map((p) => (
                <div
                  key={p.id}
                  className="p-4 bg-slate-50/50 hover:bg-slate-50 rounded-xl border border-slate-100 transition-colors flex items-center justify-between gap-4"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <img
                      src={p.image}
                      alt={p.name}
                      className="w-10 aspect-square object-cover rounded-lg border border-slate-200 shrink-0"
                      referrerPolicy="no-referrer"
                    />
                    <div className="min-w-0">
                      <h4 className="text-xs font-bold text-slate-900 truncate" title={p.name}>{p.name}</h4>
                      <div className="flex flex-wrap items-center gap-2 mt-1 text-[10px] font-semibold">
                        <span className="text-slate-400">{p.category}</span>
                        <span className="text-slate-300">•</span>
                        <span className="text-slate-600">{formatPrice(p.price)}</span>
                        {p.fileUrl && (
                          <>
                            <span className="text-slate-300">•</span>
                            <a
                              href={p.fileUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 text-sky-600 hover:text-sky-800 transition-colors font-bold hover:underline"
                              title={`Unduh File: ${p.fileUrl}`}
                            >
                              <Download className="w-3.5 h-3.5" />
                              <span>Unduh ({p.fileSize || 'File'})</span>
                            </a>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Stock count of keys */}
                  <div className="flex items-center gap-4 shrink-0">
                    <div className="text-right">
                      <span className="block text-[9px] text-slate-400 font-bold uppercase tracking-wider">Stok Lisensi</span>
                      <span className={`inline-block text-xs font-extrabold px-2 py-0.5 rounded-md mt-0.5 ${
                        p.licenseKeysPool.length > 0 ? 'bg-sky-50 text-sky-700' : 'bg-rose-50 text-rose-700'
                      }`}>
                        {p.licenseKeysPool.length} Kode Tersedia
                      </span>
                    </div>

                    <button
                      onClick={() => handleStartEdit(p)}
                      className="p-2 text-slate-400 hover:text-sky-600 hover:bg-sky-50 rounded-lg transition-all cursor-pointer"
                      title="Edit Detail Produk"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>

                    <button
                      onClick={() => onDeleteProduct(p.id)}
                      className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all cursor-pointer"
                      title="Hapus Produk"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: Automation Webhook Logs & Email simulation log */}
      {activeTab === 'logs' && (
        <div className="space-y-4">
          <div className="bg-slate-900 rounded-2xl p-5 text-slate-200 font-mono shadow-md border border-slate-800">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-4">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-rose-500 animate-pulse"></span>
                <span className="text-xs font-extrabold text-slate-300">Live Console: Sistem Pengiriman Lisensi Terenkripsi</span>
              </div>
              <button
                onClick={onClearLogs}
                className="px-2.5 py-1 text-[9px] font-bold bg-slate-800 text-slate-400 rounded-md hover:text-white hover:bg-slate-700 transition-colors cursor-pointer"
              >
                Clear Logs
              </button>
            </div>

            <div className="space-y-2 max-h-[400px] overflow-y-auto text-[10.5px] leading-relaxed pr-2">
              {systemLogs.length === 0 ? (
                <div className="text-center py-12 text-slate-500">
                  <span>&gt; Waiting for system actions... Log empty.</span>
                </div>
              ) : (
                systemLogs.map((log) => {
                  let colorClass = 'text-slate-400';
                  if (log.type === 'payment_confirmed') colorClass = 'text-emerald-400 font-semibold';
                  if (log.type === 'license_sent') colorClass = 'text-sky-400';
                  if (log.type === 'email_sent') colorClass = 'text-amber-400';

                  return (
                    <div key={log.id} className="p-2 bg-slate-950/40 rounded-lg border border-slate-900/60 hover:bg-slate-950/90 transition-all">
                      <div className="flex items-center justify-between text-[9px] text-slate-500 mb-1">
                        <span>[{new Date(log.timestamp).toLocaleTimeString('id-ID')}]</span>
                        <span className="uppercase font-bold tracking-wider">{log.type}</span>
                      </div>
                      <div className={colorClass}>&gt; {log.title}</div>
                      <div className="text-slate-300 mt-0.5">{log.message}</div>
                      {log.recipientEmail && (
                        <div className="text-[9px] text-slate-400 mt-1 italic">
                          Target Recipient: {log.recipientEmail}
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 3.5: Vault User Management */}
      {activeTab === 'users' && (
        <div className="space-y-4 animate-in fade-in duration-200">
          {/* Sub Navigation */}
          <div className="flex border-b border-slate-100 pb-2 gap-4">
            <button
              type="button"
              onClick={() => setUserSubTab('vault')}
              className={`pb-2 text-xs font-bold transition-all border-b-2 cursor-pointer ${
                userSubTab === 'vault'
                  ? 'border-sky-600 text-sky-600 font-extrabold'
                  : 'border-transparent text-slate-400 hover:text-slate-600'
              }`}
            >
              🔑 Hak Akses Brankas ({vaultUsers.length})
            </button>
            <button
              type="button"
              onClick={() => setUserSubTab('admin')}
              className={`pb-2 text-xs font-bold transition-all border-b-2 cursor-pointer ${
                userSubTab === 'admin'
                  ? 'border-sky-600 text-sky-600 font-extrabold'
                  : 'border-transparent text-slate-400 hover:text-slate-600'
              }`}
            >
              🛡️ Staff Administrator ({adminUsers.length})
            </button>
            <button
              type="button"
              onClick={() => setUserSubTab('clients')}
              className={`pb-2 text-xs font-bold transition-all border-b-2 cursor-pointer ${
                userSubTab === 'clients'
                  ? 'border-sky-600 text-sky-600 font-extrabold'
                  : 'border-transparent text-slate-400 hover:text-slate-600'
              }`}
            >
              👥 Database Client ({clients.length})
            </button>
          </div>

          {userSubTab === 'vault' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left Column: Add Vault User Form */}
              <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-xs h-fit">
                <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-4 flex items-center gap-1.5">
                  <UserPlus className="w-4 h-4 text-sky-600" /> Tambah Akses Pengguna Brankas
                </h3>

                <form onSubmit={handleAddVaultUser} className="space-y-4">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Nama Lengkap</label>
                    <input
                      type="text"
                      placeholder="Masukkan nama pengguna"
                      value={vUserName}
                      onChange={(e) => setVUserName(e.target.value)}
                      className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 focus:bg-white focus:outline-hidden focus:ring-1 focus:ring-sky-500 font-medium text-slate-800"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Email Pengguna</label>
                    <input
                      type="email"
                      placeholder="Masukkan alamat email"
                      value={vUserEmail}
                      onChange={(e) => setVUserEmail(e.target.value)}
                      className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 focus:bg-white focus:outline-hidden focus:ring-1 focus:ring-sky-500 font-medium text-slate-800"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5 flex items-center justify-between">
                      <span>Kode Akses Brankas</span>
                      <button
                        type="button"
                        onClick={handleGenerateAccessCode}
                        className="text-[9px] text-sky-600 hover:text-sky-700 font-bold uppercase cursor-pointer text-right"
                      >
                        Auto-Generate
                      </button>
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="Contoh: KODE-AKSES-123"
                        value={vUserAccessCode}
                        onChange={(e) => setVUserAccessCode(e.target.value)}
                        className="flex-1 text-xs bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 focus:bg-white focus:outline-hidden focus:ring-1 focus:ring-sky-500 font-mono font-bold text-slate-800 uppercase"
                        required
                      />
                    </div>
                    <p className="text-[9px] text-slate-400 mt-1">
                      Kode ini wajib dimasukkan oleh pengguna untuk dapat membuka dan melihat isi Brankas Lisensi mereka.
                    </p>
                  </div>

                  <button
                    type="submit"
                    className="w-full py-2.5 bg-slate-900 hover:bg-sky-600 text-white font-bold text-xs rounded-xl transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <UserPlus className="w-4 h-4" /> Tambah Pengguna
                  </button>
                </form>
              </div>

              {/* Right Column: List of Registered Vault Users */}
              <div className="lg:col-span-2 bg-white border border-slate-100 rounded-2xl p-6 shadow-xs space-y-4">
                <div>
                  <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                    <Users className="w-4 h-4 text-sky-600" /> Daftar Pengguna Terdaftar & Kode Akses Brankas
                  </h3>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Berikut adalah daftar pengguna yang memiliki hak akses untuk membuka Brankas Enkripsi & Pengiriman Instan. Berikan kode akses kepada masing-masing pengguna.
                  </p>
                </div>

                <div className="overflow-x-auto border border-slate-100 rounded-xl">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-150">
                        <th className="p-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Nama Pengguna</th>
                        <th className="p-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Email</th>
                        <th className="p-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Kode Akses Vault</th>
                        <th className="p-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider text-right">Aksi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {vaultUsers.length === 0 ? (
                        <tr>
                          <td colSpan={4} className="p-8 text-center text-slate-400 text-xs">
                            Belum ada pengguna brankas terdaftar. Silakan tambah pengguna baru di form sebelah kiri.
                          </td>
                        </tr>
                      ) : (
                        vaultUsers.map((user) => (
                          <tr key={user.id} className="hover:bg-slate-50/50 transition-colors">
                            <td className="p-3">
                              <span className="text-xs font-bold text-slate-800 block">{user.name}</span>
                              <span className="text-[9px] text-slate-400 block font-mono">Dibuat: {new Date(user.createdAt).toLocaleDateString('id-ID')}</span>
                            </td>
                            <td className="p-3 text-xs text-slate-600 font-medium">
                              {user.email}
                            </td>
                            <td className="p-3">
                              <span className="inline-block px-2.5 py-1 bg-slate-900 text-emerald-400 font-mono text-[10px] font-bold rounded-lg border border-slate-800 tracking-wider">
                                {user.accessCode}
                              </span>
                            </td>
                            <td className="p-3 text-right">
                              <button
                                onClick={() => handleDeleteVaultUser(user.id)}
                                className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all cursor-pointer"
                                title="Hapus Akses"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>

                <div className="p-3.5 bg-amber-50 border border-amber-100 rounded-xl text-[10px] text-amber-800 leading-relaxed">
                  💡 <span className="font-bold">Informasi:</span> Kode akses yang Anda berikan kepada pengguna bersifat rahasia dan unik. Ketika pengguna mengakses tab <strong>"Brankas Lisensi"</strong> di menu utama, mereka akan diminta untuk memasukkan kode akses tersebut sebelum dapat melihat lisensi dan mengunduh produk digital mereka.
                </div>
              </div>
            </div>
          )}

          {userSubTab === 'admin' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-in fade-in duration-150">
              {/* Left Column: Form Tambah/Edit Admin */}
              <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-xs h-fit">
                <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-4 flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-sky-600" /> 
                  {editingAdminId ? 'Edit Akun Administrator' : 'Tambah Akun Administrator'}
                </h3>

                <form onSubmit={handleAddOrUpdateAdmin} className="space-y-4">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Nama Lengkap</label>
                    <input
                      type="text"
                      placeholder="Contoh: Muhammad Rafli"
                      value={adminFullName}
                      onChange={(e) => setAdminFullName(e.target.value)}
                      className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 focus:bg-white focus:outline-hidden focus:ring-1 focus:ring-sky-500 font-medium text-slate-800"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Username Admin</label>
                    <input
                      type="text"
                      placeholder="Contoh: rafliapp"
                      value={adminUsername}
                      onChange={(e) => setAdminUsername(e.target.value)}
                      className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 focus:bg-white focus:outline-hidden focus:ring-1 focus:ring-sky-500 font-semibold text-slate-800"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Email Admin (Untuk Notifikasi Orderan)</label>
                    <input
                      type="email"
                      placeholder="Contoh: admin@perusahaan.com"
                      value={adminEmail}
                      onChange={(e) => setAdminEmail(e.target.value)}
                      className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 focus:bg-white focus:outline-hidden focus:ring-1 focus:ring-sky-500 font-medium text-slate-800"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Password</label>
                    <input
                      type="text"
                      placeholder="Masukkan password admin"
                      value={adminPassword}
                      onChange={(e) => setAdminPassword(e.target.value)}
                      className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 focus:bg-white focus:outline-hidden focus:ring-1 focus:ring-sky-500 font-mono text-slate-800"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Peran / Hak Akses</label>
                    <select
                      value={adminRole}
                      onChange={(e) => setAdminRole(e.target.value as any)}
                      className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 focus:bg-white focus:outline-hidden focus:ring-1 focus:ring-sky-500 font-medium text-slate-800"
                    >
                      <option value="Super Admin">Super Admin (Akses Penuh)</option>
                      <option value="Finance Admin">Finance Admin (Keuangan & Invoice)</option>
                      <option value="Support Admin">Support Admin (Keluhan & Komplain)</option>
                    </select>
                  </div>

                  <div className="flex gap-2">
                    {editingAdminId && (
                      <button
                        type="button"
                        onClick={handleCancelEditAdmin}
                        className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-colors cursor-pointer"
                      >
                        Batal
                      </button>
                    )}
                    <button
                      type="submit"
                      className="flex-1 py-2.5 bg-slate-900 hover:bg-sky-600 text-white font-bold text-xs rounded-xl transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                    >
                      <ShieldCheck className="w-4 h-4" /> {editingAdminId ? 'Simpan' : 'Tambah Admin'}
                    </button>
                  </div>
                </form>
              </div>

              {/* Right Column: Daftar Administrator */}
              <div className="lg:col-span-2 bg-white border border-slate-100 rounded-2xl p-6 shadow-xs space-y-4">
                <div>
                  <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                    <Users className="w-4 h-4 text-sky-600" /> Daftar Akun Administrator Terdaftar
                  </h3>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Kredensial di bawah ini dapat digunakan untuk masuk ke panel admin marketplace. Jagalah kerahasiaan kata sandi administrator.
                  </p>
                </div>

                <div className="overflow-x-auto border border-slate-100 rounded-xl">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-150">
                        <th className="p-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Nama & Peran</th>
                        <th className="p-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Username</th>
                        <th className="p-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Password</th>
                        <th className="p-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider text-right">Aksi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {adminUsers.map((admin) => (
                        <tr key={admin.id} className="hover:bg-slate-50/50 transition-colors">
                          <td className="p-3">
                            <span className="text-xs font-bold text-slate-800 block">{admin.fullName}</span>
                            {admin.email && (
                              <span className="text-[10px] text-slate-500 block font-medium mt-0.5">{admin.email}</span>
                            )}
                            <span className={`inline-block mt-1.5 text-[9px] font-bold px-1.5 py-0.5 rounded-sm ${
                              admin.role === 'Super Admin' 
                                ? 'bg-purple-50 text-purple-700 border border-purple-100'
                                : admin.role === 'Finance Admin'
                                ? 'bg-amber-50 text-amber-700 border border-amber-100'
                                : 'bg-sky-50 text-sky-700 border border-sky-100'
                            }`}>
                              {admin.role}
                            </span>
                          </td>
                          <td className="p-3 text-xs text-slate-600 font-semibold font-mono">
                            {admin.username}
                          </td>
                          <td className="p-3 text-xs text-slate-400 font-mono tracking-wider">
                            •••••••• <span className="text-[10px] text-slate-500 font-mono ml-1">({admin.password})</span>
                          </td>
                          <td className="p-3 text-right">
                            <div className="flex items-center justify-end gap-1">
                              <button
                                onClick={() => handleEditAdmin(admin)}
                                className="p-1.5 text-slate-400 hover:text-sky-600 hover:bg-sky-50 rounded-lg transition-all cursor-pointer"
                                title="Edit Admin"
                              >
                                <Pencil className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleDeleteAdmin(admin.id)}
                                className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all cursor-pointer"
                                title="Hapus Admin"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="p-3.5 bg-sky-50 border border-sky-100 rounded-xl text-[10px] text-sky-800 leading-relaxed">
                  💡 <span className="font-bold">Info Keamanan:</span> Pastikan setiap staff memiliki akun yang terpisah. Anda dapat menghapus atau memperbarui akun staff kapan saja untuk mencabut hak akses mereka.
                </div>
              </div>
            </div>
          )}

          {userSubTab === 'clients' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-in fade-in duration-150">
              {/* Left column: Clients List */}
              <div className="lg:col-span-2 bg-white border border-slate-100 rounded-2xl p-6 shadow-xs space-y-4 font-sans">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-50 pb-3">
                  <div>
                    <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                      <Users className="w-4 h-4 text-sky-600" /> Database Client & Riwayat Belanja
                    </h3>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Daftar pembeli unik yang teridentifikasi otomatis dari transaksi invoice marketplace Anda.
                    </p>
                  </div>
                  
                  {/* Search Bar */}
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="Cari nama, email, wa..."
                      value={clientSearchTerm}
                      onChange={(e) => setClientSearchTerm(e.target.value)}
                      className="text-[11px] font-medium bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3.5 py-1.5 w-full sm:w-[220px] focus:bg-white focus:outline-hidden focus:ring-1 focus:ring-sky-500"
                    />
                  </div>
                </div>

                {/* Clients Table */}
                <div className="overflow-x-auto border border-slate-100 rounded-xl">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-150">
                        <th className="p-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Client / Pembeli</th>
                        <th className="p-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Kontak</th>
                        <th className="p-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider text-right">Pembelian</th>
                        <th className="p-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider text-right">Total Belanja</th>
                        <th className="p-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider text-right">Aksi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {(() => {
                        const q = clientSearchTerm.trim().toLowerCase();
                        const filtered = q 
                          ? clients.filter(c => 
                              (c.name || '').toLowerCase().includes(q) || 
                              (c.email || '').toLowerCase().includes(q) || 
                              (c.phone || '').toLowerCase().includes(q)
                            )
                          : clients;

                        if (filtered.length === 0) {
                          return (
                            <tr>
                              <td colSpan={5} className="p-8 text-center text-slate-400 text-xs">
                                {clients.length === 0 
                                  ? 'Belum ada data transaksi pembeli yang tercatat di database.' 
                                  : 'Tidak ditemukan client yang cocok dengan pencarian Anda.'}
                              </td>
                            </tr>
                          );
                        }

                        return filtered.map((client) => {
                          const isSelected = selectedClientEmail === client.email;
                          return (
                            <tr 
                              key={client.email} 
                              className={`hover:bg-slate-50/50 transition-colors ${isSelected ? 'bg-sky-50/40' : ''}`}
                            >
                              <td className="p-3">
                                <span className="text-xs font-bold text-slate-800 block">{client.name}</span>
                                <span className="text-[9px] text-slate-400 block">Gabung: {new Date(client.joinedDate).toLocaleDateString('id-ID')}</span>
                              </td>
                              <td className="p-3">
                                <span className="text-xs text-slate-600 block font-medium">{client.email}</span>
                                {client.phone && <span className="text-[9px] text-slate-400 block font-mono">{client.phone}</span>}
                              </td>
                              <td className="p-3 text-right text-xs text-slate-700 font-bold">
                                {client.successTransactions.length}x <span className="text-[9px] text-slate-400 font-normal">sukses</span>
                              </td>
                              <td className="p-3 text-right">
                                <span className="text-xs font-black text-emerald-600 font-mono">
                                  Rp {client.totalSpent.toLocaleString('id-ID')}
                                </span>
                              </td>
                              <td className="p-3 text-right">
                                <button
                                  type="button"
                                  onClick={() => setSelectedClientEmail(client.email)}
                                  className={`px-2.5 py-1.5 rounded-lg text-[10px] font-extrabold transition-all cursor-pointer inline-flex items-center gap-1 ${
                                    isSelected 
                                      ? 'bg-sky-600 text-white shadow-xs' 
                                      : 'bg-slate-50 border border-slate-200 text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                                  }`}
                                >
                                  <Search className="w-3 h-3" /> Detail
                                </button>
                              </td>
                            </tr>
                          );
                        });
                      })()}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Right column: Client Details Profile */}
              <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-xs space-y-5 h-fit font-sans">
                {(() => {
                  const client = clients.find(c => c.email === selectedClientEmail);
                  if (!client) {
                    return (
                      <div className="text-center py-16 text-slate-400 space-y-3">
                        <Users className="w-10 h-10 text-slate-200 mx-auto" />
                        <div>
                          <p className="text-xs font-bold text-slate-700">Pilih Client</p>
                          <p className="text-[10px] text-slate-400 max-w-[180px] mx-auto mt-1">Silakan klik tombol <strong>Detail</strong> pada salah satu baris client untuk melihat rangkuman transaksi mereka.</p>
                        </div>
                      </div>
                    );
                  }

                  return (
                    <div className="space-y-5 animate-in fade-in duration-200">
                      {/* Header Profile */}
                      <div className="border-b border-slate-100 pb-4">
                        <div className="flex items-center gap-2.5 mb-2">
                          <div className="w-9 h-9 rounded-full bg-slate-900 text-white flex items-center justify-center text-xs font-black">
                            {client.name.substring(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <span className="text-xs font-black text-slate-900 block">{client.name}</span>
                            <span className="text-[10px] text-slate-400 block font-mono">{client.email}</span>
                          </div>
                        </div>
                        {client.phone && (
                          <span className="text-[10px] text-slate-500 flex items-center gap-1 font-mono">
                            <Phone className="w-3 h-3 text-emerald-500" /> {client.phone}
                          </span>
                        )}
                      </div>

                      {/* Stat Metrics Box */}
                      <div className="grid grid-cols-2 gap-3">
                        <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                          <span className="block text-[9px] text-slate-400 font-bold uppercase tracking-wider">Total Belanja</span>
                          <span className="block text-xs font-black text-emerald-600 font-mono mt-0.5">Rp {client.totalSpent.toLocaleString('id-ID')}</span>
                        </div>
                        <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                          <span className="block text-[9px] text-slate-400 font-bold uppercase tracking-wider">Jumlah Sukses</span>
                          <span className="block text-xs font-black text-slate-800 font-mono mt-0.5">{client.successTransactions.length} Transaksi</span>
                        </div>
                      </div>

                      {/* Products Purchased list */}
                      <div className="space-y-2">
                        <span className="block text-[9px] font-black text-slate-400 uppercase tracking-wider">Aset Yang Dimiliki ({client.purchasedProducts.length})</span>
                        {client.purchasedProducts.length === 0 ? (
                          <p className="text-[10px] text-slate-400 italic">Belum ada produk digital yang sukses terkirim.</p>
                        ) : (
                          <div className="flex flex-wrap gap-1.5">
                            {client.purchasedProducts.map((p, idx) => (
                              <span key={idx} className="inline-block px-2.5 py-1 bg-sky-50 text-sky-700 text-[10px] font-bold rounded-lg border border-sky-100">
                                {p}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Transaction list */}
                      <div className="space-y-2.5">
                        <span className="block text-[9px] font-black text-slate-400 uppercase tracking-wider">Semua Riwayat Invoice ({client.transactions.length})</span>
                        <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
                          {client.transactions.map((t) => {
                            const isSuccess = t.paymentStatus === 'SUCCESS';
                            const isPending = t.paymentStatus === 'PENDING';
                            
                            return (
                              <div key={t.id} className="p-2.5 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between text-[10px]">
                                <div className="space-y-0.5">
                                  <div className="font-bold text-slate-800 flex items-center gap-1 font-mono text-[9px]">
                                    #{t.id.substring(0, 8).toUpperCase()}
                                  </div>
                                  <div className="text-slate-400 font-medium">
                                    {new Date(t.createdAt).toLocaleDateString('id-ID')}
                                  </div>
                                </div>
                                <div className="text-right space-y-1">
                                  <div className="font-bold text-slate-700 font-mono">
                                    Rp {t.totalPrice.toLocaleString('id-ID')}
                                  </div>
                                  <span className={`inline-block px-1.5 py-0.5 text-[8.5px] font-extrabold rounded-md uppercase tracking-wider ${
                                    isSuccess ? 'bg-emerald-50 text-emerald-700' :
                                    isPending ? 'bg-amber-50 text-amber-700' :
                                    'bg-rose-50 text-rose-700'
                                  }`}>
                                    {t.paymentStatus}
                                  </span>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  );
                })()}
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 4: Shop Customization Settings */}
      {activeTab === 'settings' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-in fade-in duration-200">
          {/* Left Columns: Inputs and Selections */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-xs space-y-5">
              <div className="border-b border-slate-100 pb-3">
                <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                  <Settings className="w-4 h-4 text-sky-600" /> Pengaturan Identitas & Branding Toko
                </h3>
                <p className="text-[10.5px] text-slate-400 mt-1">Ubah nama, slogan, dan visual logo Anda. Perubahan akan diaplikasikan ke seluruh halaman aplikasi setelah Anda mengklik simpan.</p>
              </div>

              {/* Shop Name & Slogan */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Nama Toko Digital</label>
                  <input
                    type="text"
                    value={draftBranding.name || ''}
                    onChange={(e) => setDraftBranding({ ...draftBranding, name: e.target.value })}
                    className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 focus:bg-white focus:outline-hidden focus:ring-1 focus:ring-sky-500 font-bold text-slate-900"
                    placeholder="Contoh: DigiMarket"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Slogan / Deskripsi Singkat</label>
                  <input
                    type="text"
                    value={draftBranding.slogan || ''}
                    onChange={(e) => setDraftBranding({ ...draftBranding, slogan: e.target.value })}
                    className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 focus:bg-white focus:outline-hidden focus:ring-1 focus:ring-sky-500 font-medium text-slate-700"
                    placeholder="Contoh: Premium Creative Hub"
                  />
                </div>
              </div>

              {/* Shop Address */}
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Alamat Toko / Lokasi Kantor</label>
                <textarea
                  value={draftBranding.address || ''}
                  onChange={(e) => setDraftBranding({ ...draftBranding, address: e.target.value })}
                  rows={2}
                  className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl p-3.5 focus:bg-white focus:outline-hidden focus:ring-1 focus:ring-sky-500 font-medium text-slate-700 leading-relaxed"
                  placeholder="Contoh: Jl. Sudirman No. 123, Lantai 5, Jakarta Selatan, DKI Jakarta 12190"
                />
                <p className="text-[10px] text-slate-400 mt-1">Alamat fisik toko Anda yang akan dicetak di rincian invoice pembeli dan footer toko.</p>
              </div>

              {/* WhatsApp Live Support Number */}
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                  <Phone className="w-3.5 h-3.5 text-emerald-500" /> Nomor WhatsApp Live Support CS
                </label>
                <input
                  type="text"
                  value={draftBranding.whatsappNumber || ''}
                  onChange={(e) => setDraftBranding({ ...draftBranding, whatsappNumber: e.target.value })}
                  className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 focus:bg-white focus:outline-hidden focus:ring-1 focus:ring-sky-500 font-mono text-slate-800"
                  placeholder="Contoh: 6282288882512"
                />
                <p className="text-[10px] text-slate-400 mt-1">Nomor WhatsApp aktif menggunakan format kode negara (misal 6282288882512) tanpa karakter '+' atau spasi. Nomor ini akan otomatis diarahkan pada tombol bantuan WhatsApp di menu pengaduan pembeli.</p>
              </div>

              {/* Color Preset Selector */}
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">Pilih Tema Warna Logo & Brand</label>
                <div className="flex flex-wrap gap-3">
                  {[
                    { id: 'slate', name: 'Dark Slate', bg: 'bg-slate-900', border: 'border-slate-900' },
                    { id: 'sky', name: 'Sky Blue', bg: 'bg-sky-500', border: 'border-sky-500' },
                    { id: 'emerald', name: 'Emerald', bg: 'bg-emerald-500', border: 'border-emerald-500' },
                    { id: 'indigo', name: 'Royal Blue', bg: 'bg-indigo-500', border: 'border-indigo-500' },
                    { id: 'rose', name: 'Rose Red', bg: 'bg-rose-500', border: 'border-rose-500' },
                    { id: 'amber', name: 'Amber Gold', bg: 'bg-amber-500', border: 'border-amber-500' },
                    { id: 'violet', name: 'Amethyst', bg: 'bg-violet-500', border: 'border-violet-500' },
                  ].map((col) => (
                    <button
                      key={col.id}
                      type="button"
                      onClick={() => setDraftBranding({ ...draftBranding, logoColor: col.id })}
                      className={`flex items-center gap-2 px-3 py-1.5 border rounded-xl text-xs font-bold transition-all cursor-pointer ${
                        draftBranding.logoColor === col.id
                          ? 'border-slate-900 bg-slate-50 ring-2 ring-slate-900/10'
                          : 'border-slate-150 hover:bg-slate-50'
                      }`}
                    >
                      <span className={`w-3.5 h-3.5 rounded-full ${col.bg} border ${col.border}`} />
                      <span>{col.name}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Vector Icon Grid */}
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">Pilih Icon Logo (Vector)</label>
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
                  {[
                    { id: 'Lock', icon: Lock, name: 'Gembok' },
                    { id: 'ShoppingBag', icon: ShoppingBag, name: 'Belanja' },
                    { id: 'Database', icon: Database, name: 'Database' },
                    { id: 'Sparkles', icon: Sparkles, name: 'Kilau' },
                    { id: 'ShieldCheck', icon: ShieldCheck, name: 'Shield' },
                    { id: 'CheckCircle', icon: CheckCircle, name: 'Sukses' },
                    { id: 'HelpCircle', icon: HelpCircle, name: 'Tanya' },
                    { id: 'Store', icon: Store, name: 'Toko' },
                    { id: 'Gem', icon: Gem, name: 'Permata' },
                    { id: 'Gift', icon: Gift, name: 'Kado' },
                    { id: 'Globe', icon: Globe, name: 'Global' },
                    { id: 'Cpu', icon: Cpu, name: 'Mikro' },
                  ].map((ico) => {
                    const IconComp = ico.icon;
                    const isSelected = draftBranding.logoIcon === ico.id && !draftBranding.logoUrl;
                    return (
                      <button
                        key={ico.id}
                        type="button"
                        onClick={() => setDraftBranding({ ...draftBranding, logoIcon: ico.id, logoUrl: '' })}
                        className={`p-3 border rounded-xl flex flex-col items-center justify-center gap-1.5 transition-all cursor-pointer ${
                          isSelected
                            ? 'border-slate-900 bg-slate-900 text-white shadow-md'
                            : 'border-slate-150 text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                        }`}
                      >
                        <IconComp className="w-5 h-5" />
                        <span className="text-[9px] font-bold">{ico.name}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Custom Image URL Upload */}
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Atau Gunakan Logo Image Sendiri (URL)</label>
                <div className="flex gap-2">
                  <input
                    type="url"
                    value={draftBranding.logoUrl || ''}
                    onChange={(e) => setDraftBranding({ ...draftBranding, logoUrl: e.target.value })}
                    className="flex-1 text-xs bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 focus:bg-white focus:outline-hidden focus:ring-1 focus:ring-sky-500 font-mono"
                    placeholder="https://domain.com/path-ke-gambar-logo.png"
                  />
                  {draftBranding.logoUrl && (
                    <button
                      type="button"
                      onClick={() => setDraftBranding({ ...draftBranding, logoUrl: '' })}
                      className="px-3 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold rounded-xl border border-rose-200 cursor-pointer transition-colors"
                    >
                      Reset
                    </button>
                  )}
                </div>
                <p className="text-[10px] text-slate-400 mt-1">Masukkan URL link foto langsung (png, jpeg, webp) jika ingin menggantikan icon bawaan dengan logo instansi Anda.</p>
              </div>

              {/* Save Button for Identity & Branding */}
              <div className="flex items-center justify-between border-t border-slate-100 pt-4 mt-2">
                <span className="text-[10px] text-slate-400 font-medium italic">
                  *Perubahan identitas toko perlu disimpan agar aktif
                </span>
                <button
                  type="button"
                  onClick={() => handleSaveSettings('identity')}
                  disabled={saveStatus.identity === 'saving'}
                  className={`px-4.5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shadow-sm ${
                    saveStatus.identity === 'success'
                      ? 'bg-emerald-600 text-white hover:bg-emerald-700 font-extrabold'
                      : saveStatus.identity === 'saving'
                      ? 'bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200'
                      : 'bg-slate-900 hover:bg-sky-600 text-white hover:scale-[1.02] active:scale-[0.98]'
                  }`}
                >
                  {saveStatus.identity === 'success' ? (
                    <>
                      <Check className="w-4 h-4" /> Berhasil Disimpan
                    </>
                  ) : saveStatus.identity === 'saving' ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Menyimpan...
                    </>
                  ) : (
                    <>
                      <Save className="w-3.5 h-3.5" /> Simpan Identitas Toko
                    </>
                  )}
                </button>
              </div>

            </div>

            {/* Custom Theme Skin & Front Page Hero Settings */}
            <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-xs space-y-5">
              <div className="border-b border-slate-100 pb-3">
                <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-rose-500 animate-pulse" /> Kustomisasi Skin & Front Page Toko
                </h3>
                <p className="text-[10.5px] text-slate-400 mt-1">Ubah tema visual (skin) aplikasi, sesuaikan tulisan banner selamat datang, layout katalog produk di halaman depan.</p>
              </div>

              {/* Skin Theme Preset Selector */}
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2.5">Pilih Preset Skin Tampilan</label>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
                  {[
                    { id: 'default', name: 'Sky Blue', color: 'bg-sky-500' },
                    { id: 'emerald', name: 'Emerald', color: 'bg-emerald-500' },
                    { id: 'sunset', name: 'Sunset', color: 'bg-rose-500' },
                    { id: 'midnight', name: 'Midnight', color: 'bg-indigo-600' },
                    { id: 'cyberpunk', name: 'Cyberpunk', color: 'bg-amber-400' },
                  ].map((skin) => (
                    <button
                      key={skin.id}
                      type="button"
                      onClick={() => setDraftBranding({ ...draftBranding, themeSkin: skin.id as any })}
                      className={`p-3 border rounded-xl flex flex-col items-center gap-1.5 transition-all cursor-pointer ${
                        (draftBranding.themeSkin || 'default') === skin.id
                          ? 'border-slate-900 bg-slate-50 ring-2 ring-slate-900/10 font-bold'
                          : 'border-slate-150 hover:bg-slate-50'
                      }`}
                    >
                      <span className={`w-4 h-4 rounded-full ${skin.color} border border-white shadow-xs`} />
                      <span className="text-[9px] font-bold text-slate-800">{skin.name}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Default Light/Dark Theme Selector */}
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  🌓 Default Mode Tampilan Aplikasi
                </label>
                <div className="flex gap-3">
                  {[
                    { id: 'light', name: 'Mode Terang (Light Mode)', icon: '☀️' },
                    { id: 'dark', name: 'Mode Gelap (Dark Mode)', icon: '🌙' },
                  ].map((themeOpt) => (
                    <button
                      key={themeOpt.id}
                      type="button"
                      onClick={() => setDraftBranding({ ...draftBranding, defaultTheme: themeOpt.id as 'light' | 'dark' })}
                      className={`flex-1 py-3 px-4 border rounded-xl text-xs font-black transition-all cursor-pointer flex items-center justify-center gap-2 ${
                        (draftBranding.defaultTheme || 'light') === themeOpt.id
                          ? 'border-slate-900 bg-slate-950 text-white font-extrabold shadow-sm'
                          : 'border-slate-200 text-slate-600 bg-slate-50/50 hover:bg-slate-100'
                      }`}
                    >
                      <span>{themeOpt.icon}</span>
                      <span>{themeOpt.name}</span>
                    </button>
                  ))}
                </div>
                <p className="text-[9.5px] text-slate-400 mt-1.5 font-medium leading-relaxed">
                  Pengaturan ini akan menetapkan tema default untuk seluruh pengunjung pertama kali. Pengunjung tetap dapat mengubah mode tampilan sementara menggunakan tombol toggle di sudut kanan atas.
                </p>
              </div>

              {/* Show/Hide Official Payment Methods Module Toggle */}
              <div className="bg-slate-50 border border-slate-200 p-4 rounded-2xl flex items-center justify-between gap-4">
                <div className="space-y-0.5">
                  <label className="block text-xs font-black text-slate-800">
                    💳 Modul Metode Pembayaran Resmi
                  </label>
                  <p className="text-[10px] text-slate-400 font-medium leading-relaxed">
                    Tampilkan modul "Metode Pembayaran Resmi Terverifikasi" di halaman depan toko untuk memudahkan pembeli menyalin rekening.
                  </p>
                </div>
                <div className="flex items-center shrink-0">
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={draftBranding.showOfficialPaymentsModule !== false}
                      onChange={(e) => setDraftBranding({ ...draftBranding, showOfficialPaymentsModule: e.target.checked })}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
                  </label>
                </div>
              </div>

              {/* Hero Banner Text Fields */}
              <div className="space-y-4 pt-2">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Judul Utama Hero (Front Page)</label>
                    <input
                      type="text"
                      value={draftBranding.heroTitle || ''}
                      onChange={(e) => setDraftBranding({ ...draftBranding, heroTitle: e.target.value })}
                      className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 focus:bg-white focus:outline-hidden focus:ring-1 focus:ring-sky-500 font-bold text-slate-800"
                      placeholder="Pusat Lisensi & Aset Digital Resmi"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Sub-judul / Penjelasan Hero</label>
                    <input
                      type="text"
                      value={draftBranding.heroSubtitle || ''}
                      onChange={(e) => setDraftBranding({ ...draftBranding, heroSubtitle: e.target.value })}
                      className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 focus:bg-white focus:outline-hidden focus:ring-1 focus:ring-sky-500 font-medium text-slate-700"
                      placeholder="Katalog Software premium, template desain, & lisensi developer."
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Layout Katalog Produk</label>
                    <select
                      value={draftBranding.layoutStyle || 'grid'}
                      onChange={(e) => setDraftBranding({ ...draftBranding, layoutStyle: e.target.value as any })}
                      className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 focus:bg-white focus:outline-hidden focus:ring-1 focus:ring-sky-500 font-bold text-slate-900"
                    >
                      <option value="grid">Grid Standar (3 Kolom)</option>
                      <option value="bento">Bento Grid Eksklusif</option>
                      <option value="minimal">Minimalist Row List</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Jumlah Produk Halaman Utama</label>
                    <select
                      value={draftBranding.productsLimit || 6}
                      onChange={(e) => setDraftBranding({ ...draftBranding, productsLimit: parseInt(e.target.value, 10) })}
                      className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 focus:bg-white focus:outline-hidden focus:ring-1 focus:ring-sky-500 font-bold text-slate-900"
                    >
                      <option value="3">3 Produk</option>
                      <option value="6">6 Produk</option>
                      <option value="9">9 Produk</option>
                      <option value="12">12 Produk</option>
                      <option value="18">18 Produk</option>
                      <option value="30">30 Produk</option>
                      <option value="100">100 Produk</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">URL Gambar Background Hero (Opsional)</label>
                    <input
                      type="url"
                      value={draftBranding.heroBannerUrl || ''}
                      onChange={(e) => setDraftBranding({ ...draftBranding, heroBannerUrl: e.target.value })}
                      className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 focus:bg-white focus:outline-hidden focus:ring-1 focus:ring-sky-500 font-mono text-slate-800"
                      placeholder="https://images.unsplash.com/..."
                    />
                  </div>
                </div>

                {/* Font Style Selection */}
                <div className="pt-4 border-t border-slate-100">
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2.5 flex items-center gap-1.5 font-sans">
                    <Type className="w-3.5 h-3.5 text-sky-500 animate-bounce" /> Pilih Gaya Font Toko (Typography)
                  </label>
                  <div className="grid grid-cols-3 gap-2.5 font-sans">
                    {[
                      { id: 'inter', name: 'Inter (Sans)', desc: 'Profesional & Bersih', cls: 'font-sans text-xs' },
                      { id: 'ubuntu', name: 'Ubuntu', desc: 'Modern & Ergonomis', cls: 'font-ubuntu text-sm font-bold' },
                      { id: 'noteworthy', name: 'Noteworthy', desc: 'Kreatif & Kasual', cls: 'font-noteworthy text-xs font-bold' },
                    ].map((f) => {
                      const isSelected = (draftBranding.fontFamily || 'inter') === f.id;
                      return (
                        <button
                          key={f.id}
                          type="button"
                          onClick={() => setDraftBranding({ ...draftBranding, fontFamily: f.id as any })}
                          className={`p-3.5 border rounded-xl flex flex-col items-start gap-1 transition-all cursor-pointer text-left ${
                            isSelected
                              ? 'border-slate-900 bg-slate-50 ring-2 ring-slate-900/10'
                              : 'border-slate-150 hover:bg-slate-50'
                          }`}
                        >
                          <span className={`block font-black text-slate-900 ${f.cls}`}>{f.name}</span>
                          <span className="text-[9px] text-slate-400 leading-tight font-medium font-sans">{f.desc}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Save Button for Theme & Hero Banner */}
              <div className="flex items-center justify-between border-t border-slate-100 pt-4 mt-2">
                <span className="text-[10px] text-slate-400 font-medium italic">
                  *Pilih skin visual lalu simpan pengaturan halaman depan
                </span>
                <button
                  type="button"
                  onClick={() => handleSaveSettings('skin')}
                  disabled={saveStatus.skin === 'saving'}
                  className={`px-4.5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shadow-sm ${
                    saveStatus.skin === 'success'
                      ? 'bg-emerald-600 text-white hover:bg-emerald-700 font-extrabold'
                      : saveStatus.skin === 'saving'
                      ? 'bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200'
                      : 'bg-slate-900 hover:bg-sky-600 text-white hover:scale-[1.02] active:scale-[0.98]'
                  }`}
                >
                  {saveStatus.skin === 'success' ? (
                    <>
                      <Check className="w-4 h-4" /> Berhasil Disimpan
                    </>
                  ) : saveStatus.skin === 'saving' ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Menyimpan...
                    </>
                  ) : (
                    <>
                      <Save className="w-3.5 h-3.5" /> Simpan Tema & Banner
                    </>
                  )}
                </button>
              </div>

            </div>

            {/* Card: Default Catatan Belanja & Transaksi */}
            <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-xs space-y-5">
              <div className="border-b border-slate-100 pb-3">
                <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                  <FileText className="w-4 h-4 text-emerald-600 animate-pulse" /> Default Catatan Pembayaran / Transaksi
                </h3>
                <p className="text-[10.5px] text-slate-400 mt-1">
                  Atur catatan default atau instruksi tambahan yang akan otomatis dilampirkan pada bagian bawah rincian pembayaran atau invoice pelanggan.
                </p>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Edit Default Catatan Toko</label>
                <textarea
                  value={draftBranding.defaultNotes || ''}
                  onChange={(e) => setDraftBranding({ ...draftBranding, defaultNotes: e.target.value })}
                  rows={4}
                  className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl p-3.5 focus:bg-white focus:outline-hidden focus:ring-1 focus:ring-sky-500 font-medium text-slate-700 leading-relaxed"
                  placeholder="Terima kasih telah berbelanja di toko kami! Silakan lakukan pembayaran sesuai instruksi di atas dan kirimkan bukti transfer Anda agar dapat kami proses secepatnya."
                />
              </div>

              {/* Save Button for Default Notes */}
              <div className="flex items-center justify-between border-t border-slate-100 pt-4 mt-2">
                <span className="text-[10px] text-slate-400 font-medium italic">
                  *Catatan default akan terlampir otomatis di struk invoice
                </span>
                <button
                  type="button"
                  onClick={() => handleSaveSettings('notes')}
                  disabled={saveStatus.notes === 'saving'}
                  className={`px-4.5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shadow-sm ${
                    saveStatus.notes === 'success'
                      ? 'bg-emerald-600 text-white hover:bg-emerald-700 font-extrabold'
                      : saveStatus.notes === 'saving'
                      ? 'bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200'
                      : 'bg-slate-900 hover:bg-sky-600 text-white hover:scale-[1.02] active:scale-[0.98]'
                  }`}
                >
                  {saveStatus.notes === 'success' ? (
                    <>
                      <Check className="w-4 h-4" /> Berhasil Disimpan
                    </>
                  ) : saveStatus.notes === 'saving' ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Menyimpan...
                    </>
                  ) : (
                    <>
                      <Save className="w-3.5 h-3.5" /> Simpan Catatan Toko
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Card: Setingan SMTP Server */}
            <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-xs space-y-5">
              <div className="border-b border-slate-100 pb-3">
                <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                  <Mail className="w-4 h-4 text-sky-600" /> Pengaturan Layanan Email (SMTP / Brevo REST API)
                </h3>
                <p className="text-[10.5px] text-slate-400 mt-1">
                  Pilih layanan email yang ingin Anda gunakan untuk mengirimkan lisensi digital, file download, dan invoice secara instan ke email pembeli setelah pembayaran divalidasi.
                </p>
              </div>

              {/* Service Selection */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Metode Pengiriman Email</label>
                  <select
                    value={draftBranding.emailService || 'smtp'}
                    onChange={(e) => setDraftBranding({ ...draftBranding, emailService: e.target.value as 'smtp' | 'brevo' })}
                    className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 focus:bg-white focus:outline-hidden focus:ring-1 focus:ring-sky-500 font-medium text-slate-800"
                  >
                    <option value="smtp">Standard SMTP Server (Gmail / Host Send)</option>
                    <option value="brevo">Brevo REST API (Lebih Stabil & Cepat)</option>
                  </select>
                </div>
              </div>

              {draftBranding.emailService === 'brevo' ? (
                /* Brevo API Settings */
                <div className="space-y-4 pt-1 animate-in fade-in duration-200">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Nama Pengirim (Sender Name)</label>
                      <input
                        type="text"
                        value={draftBranding.brevoSenderName || ''}
                        onChange={(e) => setDraftBranding({ ...draftBranding, brevoSenderName: e.target.value })}
                        className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 focus:bg-white focus:outline-hidden focus:ring-1 focus:ring-sky-500 text-slate-800 font-medium"
                        placeholder="Contoh: DigiMarket Official"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Email Pengirim Terdaftar (Sender Email)</label>
                      <input
                        type="email"
                        value={draftBranding.brevoSenderEmail || ''}
                        onChange={(e) => setDraftBranding({ ...draftBranding, brevoSenderEmail: e.target.value })}
                        className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 focus:bg-white focus:outline-hidden focus:ring-1 focus:ring-sky-500 text-slate-800 font-mono"
                        placeholder="Contoh: tokoanda@domain.com"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Brevo API Key (V3)</label>
                    <input
                      type="password"
                      value={draftBranding.brevoApiKey || ''}
                      onChange={(e) => setDraftBranding({ ...draftBranding, brevoApiKey: e.target.value })}
                      className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 focus:bg-white focus:outline-hidden focus:ring-1 focus:ring-sky-500 text-slate-800 font-mono"
                      placeholder="xkeysib-..."
                    />
                    <p className="text-[9.5px] text-slate-400 mt-1">
                      {"Dapatkan API Key versi 3 Anda di dashboard Brevo (Smtp & API -> API Keys)."}
                    </p>
                  </div>
                </div>
              ) : (
                /* SMTP Server Settings */
                <div className="space-y-4 pt-1 animate-in fade-in duration-200">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="md:col-span-2">
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">SMTP Host / Server</label>
                      <input
                        type="text"
                        value={draftBranding.smtpHost || ''}
                        onChange={(e) => setDraftBranding({ ...draftBranding, smtpHost: e.target.value })}
                        className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 focus:bg-white focus:outline-hidden focus:ring-1 focus:ring-sky-500 font-mono text-slate-800"
                        placeholder="Contoh: smtp.gmail.com atau mail.domain.com"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">SMTP Port</label>
                      <input
                        type="text"
                        value={draftBranding.smtpPort || ''}
                        onChange={(e) => setDraftBranding({ ...draftBranding, smtpPort: e.target.value })}
                        className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 focus:bg-white focus:outline-hidden focus:ring-1 focus:ring-sky-500 font-mono text-slate-800"
                        placeholder="Contoh: 465, 587, 25"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Username SMTP (Email Pengirim)</label>
                      <input
                        type="text"
                        value={draftBranding.smtpUser || ''}
                        onChange={(e) => setDraftBranding({ ...draftBranding, smtpUser: e.target.value })}
                        className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 focus:bg-white focus:outline-hidden focus:ring-1 focus:ring-sky-500 font-mono text-slate-800"
                        placeholder="Contoh: tokoanda@gmail.com"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Password SMTP / App Password</label>
                      <input
                        type="password"
                        value={draftBranding.smtpPassword || ''}
                        onChange={(e) => setDraftBranding({ ...draftBranding, smtpPassword: e.target.value })}
                        className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 focus:bg-white focus:outline-hidden focus:ring-1 focus:ring-sky-500 font-mono text-slate-800"
                        placeholder="Sandi Aplikasi 16-digit atau sandi host"
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-3.5 bg-slate-50 rounded-xl border border-slate-100">
                    <div className="space-y-0.5">
                      <span className="block text-xs font-bold text-slate-700">Gunakan Koneksi Aman (Secure SSL/TLS)</span>
                      <span className="block text-[10px] text-slate-400">Direkomendasikan aktif jika Anda menggunakan port 465.</span>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={draftBranding.smtpSecure !== false}
                        onChange={(e) => setDraftBranding({ ...draftBranding, smtpSecure: e.target.checked })}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-slate-200 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-sky-500"></div>
                    </label>
                  </div>
                </div>
              )}

              {/* SMTP / Brevo Connection Testing Button & Save settings */}
              <div className="flex items-center justify-between border-t border-slate-100 pt-4 mt-2">
                <button
                  type="button"
                  onClick={async () => {
                    const isBrevo = draftBranding.emailService === 'brevo';
                    if (isBrevo) {
                      if (!draftBranding.brevoApiKey || !draftBranding.brevoSenderEmail) {
                        alert('Harap isi API Key dan Email Pengirim Brevo sebelum melakukan uji coba!');
                        return;
                      }
                    } else {
                      if (!draftBranding.smtpHost || !draftBranding.smtpUser || !draftBranding.smtpPassword) {
                        alert('Harap isi Host, Username, dan Password SMTP sebelum melakukan uji coba!');
                        return;
                      }
                    }

                    const defaultPrompt = isBrevo ? draftBranding.brevoSenderEmail : draftBranding.smtpUser;
                    const testEmail = prompt(`Masukkan alamat email untuk mengirim pesan uji coba ${isBrevo ? 'Brevo REST API' : 'SMTP'}:`, defaultPrompt);
                    if (!testEmail) return;

                    try {
                      const response = await fetch('/api/send-email', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                          to: testEmail.trim(),
                          buyerName: 'Uji Coba Layanan Email',
                          transactionId: 'TEST-EMAIL-' + Date.now().toString().substring(8),
                          paymentMethod: 'Sistem Test',
                          totalPrice: 15000,
                          items: [{
                            productId: 'test-id',
                            productName: `Produk Uji Coba ${isBrevo ? 'Brevo API' : 'SMTP'}`,
                            price: 15000,
                            licenseKey: 'PROSES-SUKSES-KONEKSI-OK',
                            fileUrl: '#',
                            fileSize: '1 KB'
                          }],
                          paymentStatus: 'SUCCESS',
                          emailService: draftBranding.emailService || 'smtp',
                          brevoApiKey: draftBranding.brevoApiKey,
                          brevoSenderName: draftBranding.brevoSenderName,
                          brevoSenderEmail: draftBranding.brevoSenderEmail,
                          smtpConfig: {
                            host: draftBranding.smtpHost,
                            port: draftBranding.smtpPort,
                            user: draftBranding.smtpUser,
                            password: draftBranding.smtpPassword,
                            secure: draftBranding.smtpSecure !== false
                          }
                        })
                      });
                      const resText = await response.text();
                      let resData;
                      try {
                        resData = JSON.parse(resText);
                      } catch (parseErr) {
                        throw new Error(`Server mengembalikan respon non-JSON (HTML/Error Server). Status: ${response.status} ${response.statusText}. Respon: ${resText.substring(0, 200)}...`);
                      }
                      if (response.ok && resData.success) {
                        alert(`🎉 Sukses! Layanan ${isBrevo ? 'Brevo API' : 'SMTP'} berhasil tersambung & Email test terkirim ke ${testEmail}.`);
                      } else {
                        alert(`❌ Gagal tersambung ke Layanan:\n${resData.error || 'Terjadi kesalahan sistem.'}`);
                      }
                    } catch (testErr: any) {
                      alert(`❌ Gagal menghubungi server SMTP atau Backend:\n${testErr.message || testErr}`);
                    }
                  }}
                  className="px-4 py-2 border border-sky-200 bg-sky-50 hover:bg-sky-100 text-sky-700 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center gap-1.5 shadow-xs"
                >
                  <RefreshCw className="w-3.5 h-3.5" /> Tes Koneksi Email
                </button>

                <button
                  type="button"
                  onClick={() => handleSaveSettings('smtp')}
                  disabled={saveStatus.smtp === 'saving'}
                  className={`px-4.5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shadow-sm ${
                    saveStatus.smtp === 'success'
                      ? 'bg-emerald-600 text-white hover:bg-emerald-700 font-extrabold'
                      : saveStatus.smtp === 'saving'
                      ? 'bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200'
                      : 'bg-slate-900 hover:bg-sky-600 text-white hover:scale-[1.02] active:scale-[0.98]'
                  }`}
                >
                  {saveStatus.smtp === 'success' ? (
                    <>
                      <Check className="w-4 h-4" /> Berhasil Disimpan
                    </>
                  ) : saveStatus.smtp === 'saving' ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Menyimpan...
                    </>
                  ) : (
                    <>
                      <Save className="w-3.5 h-3.5" /> Simpan Konfigurasi SMTP
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Card: Manajemen Kategori Produk */}
            <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-xs space-y-5">
              <div className="border-b border-slate-100 pb-3">
                <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                  <Settings className="w-4 h-4 text-emerald-600 animate-pulse" /> Manajemen Kategori Produk (Menu Kategori)
                </h3>
                <p className="text-[10.5px] text-slate-400 mt-1">
                  Kelola menu kategori produk yang tampil di halaman depan toko digital Anda. Anda dapat menambahkan kategori baru atau menghapus kategori yang tidak digunakan.
                </p>
              </div>

              {/* Form Tambah Kategori */}
              <div className="space-y-3">
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">Tambah Kategori Baru</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newSettingCategory}
                    onChange={(e) => setNewSettingCategory(e.target.value)}
                    placeholder="Contoh: Plugin Premium, Source Code"
                    className="flex-1 text-xs bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 focus:bg-white focus:outline-hidden focus:ring-1 focus:ring-sky-500 font-medium text-slate-700 font-sans"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      const trimmed = newSettingCategory.trim();
                      if (!trimmed) {
                        alert('Nama kategori tidak boleh kosong!');
                        return;
                      }
                      if (categories.some(c => c.toLowerCase() === trimmed.toLowerCase())) {
                        alert('Kategori tersebut sudah ada (tidak boleh duplikat)!');
                        return;
                      }
                      onUpdateCategories([...categories, trimmed]);
                      setNewSettingCategory('');
                      alert(`✓ Kategori "${trimmed}" berhasil ditambahkan ke menu!`);
                    }}
                    className="px-5 py-2.5 bg-slate-900 hover:bg-sky-600 text-white font-bold text-xs rounded-xl transition-colors cursor-pointer shrink-0 shadow-xs flex items-center gap-1.5"
                  >
                    <Plus className="w-4 h-4" /> Tambah
                  </button>
                </div>
              </div>

              {/* Daftar Kategori Aktif */}
              <div className="space-y-3">
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">Daftar Menu Kategori Aktif ({categories.length})</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {categories.map((cat) => {
                    const productCount = products.filter(p => p.category === cat).length;
                    return (
                      <div
                        key={cat}
                        className="flex items-center justify-between p-3 bg-slate-50 border border-slate-100 rounded-xl hover:bg-slate-100/50 transition-colors"
                      >
                        <div className="space-y-0.5">
                          <span className="block text-xs font-semibold text-slate-800">{cat}</span>
                          <span className="block text-[10px] text-slate-400 font-medium">
                            {productCount} Produk terasosiasi
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            if (categories.length <= 1) {
                              alert('Anda harus menyisakan minimal 1 kategori produk!');
                              return;
                            }
                            const confirmDelete = window.confirm(
                              `Apakah Anda yakin ingin menghapus kategori "${cat}"?\n\n` +
                              `Terdapat ${productCount} produk dalam kategori ini. Menghapus kategori tidak akan menghapus produk, namun kategori produk tersebut di database mungkin perlu disesuaikan kembali.`
                            );
                            if (confirmDelete) {
                              const updated = categories.filter(c => c !== cat);
                              onUpdateCategories(updated);
                              alert(`✓ Kategori "${cat}" berhasil dihapus dari menu.`);
                            }
                          }}
                          className="p-1.5 hover:bg-rose-50 hover:text-rose-600 text-slate-400 rounded-lg transition-colors cursor-pointer"
                          title="Hapus Kategori"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Card: Sinkronisasi Otomatis (Autosync Engine) */}
            <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-xs space-y-5 animate-in fade-in duration-200">
              <div className="border-b border-slate-100 pb-3">
                <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                  <RefreshCw className={`w-4 h-4 text-emerald-500 ${isAutosyncEnabled ? 'animate-spin' : ''}`} /> Konfigurasi Auto-Sync Real-Time
                </h3>
                <p className="text-[10.5px] text-slate-400 mt-1 font-sans">
                  Sistem mendeteksi perubahan data dari database Firebase Cloud secara real-time menggunakan listener aktif (<code className="bg-slate-100 px-1 py-0.5 rounded text-[9.5px]">onSnapshot</code>) tanpa membebani browser atau memerlukan refresh halaman.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 bg-slate-50 rounded-xl border border-slate-100 font-sans">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-900">Status Auto-Sync Real-Time</span>
                    <span className="inline-flex items-center gap-1 text-[9px] font-black uppercase px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 animate-pulse">
                      ● Aktif (Penuh)
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-500 font-medium">
                    Always Online Mode: Terakhir diperbarui dari Cloud: {lastAutosyncTime || 'Sedang sinkronisasi...'}
                  </p>
                </div>

                <div className="px-3.5 py-2 text-[10px] font-bold text-emerald-700 bg-emerald-50 rounded-xl border border-emerald-100 select-none shrink-0 flex items-center gap-1.5 shadow-xs">
                  🔒 Online Permanen
                </div>
              </div>
            </div>

            {/* Card: Manajemen Pembersihan Data (Database Purge) */}
            <div className="bg-white border border-rose-150 rounded-2xl p-6 shadow-xs space-y-5 animate-in fade-in duration-200">
              <div className="border-b border-rose-100 pb-3">
                <h3 className="text-xs font-bold text-rose-700 uppercase tracking-wider flex items-center gap-2">
                  <Trash2 className="w-4 h-4 text-rose-600 animate-bounce" /> Area Bahaya: Reset & Pembersihan Data
                </h3>
                <p className="text-[10.5px] text-slate-400 mt-1 font-sans">
                  Bersihkan data transaksi sandbox secara permanen untuk mengosongkan riwayat transaksi dan melatih simulasi pembelian baru dari awal.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 bg-rose-50/50 rounded-xl border border-rose-100/60 font-sans">
                <div className="space-y-0.5">
                  <span className="block text-xs font-bold text-rose-950">Purge Semua Riwayat Transaksi</span>
                  <p className="text-[10px] text-rose-600 font-medium">
                    Tindakan ini menghapus seluruh {transactions.length} transaksi di LocalStorage dan database Firebase Cloud secara permanen.
                  </p>
                </div>

                {onPurgeTransactions && (
                  <button
                    type="button"
                    onClick={async () => {
                      if (purgeConfirmStep === 0) {
                        setPurgeConfirmStep(1);
                        setTimeout(() => setPurgeConfirmStep(0), 4000);
                      } else if (purgeConfirmStep === 1) {
                        setPurgeConfirmStep(2);
                        try {
                          await onPurgeTransactions();
                          alert('✓ Seluruh data transaksi sandbox berhasil dibersihkan dari database Cloud & lokal.');
                        } catch (err) {
                          console.error(err);
                        } finally {
                          setPurgeConfirmStep(0);
                        }
                      }
                    }}
                    disabled={purgeConfirmStep === 2}
                    className={`px-4.5 py-2.5 text-xs font-black rounded-xl transition-all cursor-pointer flex items-center gap-1.5 shadow-sm select-none shrink-0 ${
                      purgeConfirmStep === 0
                        ? 'bg-rose-600 hover:bg-rose-700 text-white hover:scale-[1.02] active:scale-[0.98]'
                        : purgeConfirmStep === 1
                        ? 'bg-amber-500 hover:bg-amber-600 text-white animate-pulse'
                        : 'bg-rose-200 text-rose-800 cursor-not-allowed'
                    }`}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    {purgeConfirmStep === 0 && 'Purge Transaksi'}
                    {purgeConfirmStep === 1 && 'Klik Lagi untuk Konfirmasi Purge!'}
                    {purgeConfirmStep === 2 && 'Membersihkan...'}
                  </button>
                )}
              </div>
            </div>

          </div>

          {/* Right Column: Beautiful Dynamic Brand Live Preview Card */}
          <div className="space-y-6">
            <div className="bg-slate-900 text-white rounded-3xl p-6 shadow-xl space-y-5 border border-slate-800 animate-in fade-in duration-200">
              <h4 className="text-[11px] font-black text-sky-400 uppercase tracking-wider">Live Preview Tampilan Toko</h4>
              
              {/* Header Preview Box */}
              <div className="bg-slate-950/80 rounded-2xl p-4 border border-slate-800/80 space-y-4">
                <span className="text-[8.5px] font-bold text-slate-500 block uppercase tracking-widest">Tampilan Header Marketplace:</span>
                <div className="flex items-center gap-2.5 bg-slate-900 p-3 rounded-xl border border-slate-800/60 shadow-inner">
                  {/* Logo Rendering */}
                  {draftBranding.logoUrl ? (
                    <div className="w-8 h-8 rounded-lg overflow-hidden flex items-center justify-center bg-white">
                      <img src={draftBranding.logoUrl} alt="Preview" className="w-full h-full object-cover animate-fade-in" />
                    </div>
                  ) : (
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-white shadow-sm ${
                      draftBranding.logoColor === 'slate' ? 'bg-slate-800' :
                      draftBranding.logoColor === 'sky' ? 'bg-sky-500' :
                      draftBranding.logoColor === 'emerald' ? 'bg-emerald-500' :
                      draftBranding.logoColor === 'indigo' ? 'bg-indigo-500' :
                      draftBranding.logoColor === 'rose' ? 'bg-rose-500' :
                      draftBranding.logoColor === 'amber' ? 'bg-amber-500' :
                      'bg-violet-500'
                    }`}>
                      {/* Logo Icon rendering based on string */}
                      {(() => {
                        const iconId = draftBranding.logoIcon;
                        if (iconId === 'ShoppingBag') return <ShoppingBag className="w-4.5 h-4.5" />;
                        if (iconId === 'Database') return <Database className="w-4.5 h-4.5" />;
                        if (iconId === 'Sparkles') return <Sparkles className="w-4.5 h-4.5" />;
                        if (iconId === 'ShieldCheck') return <ShieldCheck className="w-4.5 h-4.5" />;
                        if (iconId === 'CheckCircle') return <CheckCircle className="w-4.5 h-4.5" />;
                        if (iconId === 'HelpCircle') return <HelpCircle className="w-4.5 h-4.5" />;
                        if (iconId === 'Store') return <Store className="w-4.5 h-4.5" />;
                        if (iconId === 'Gem') return <Gem className="w-4.5 h-4.5" />;
                        if (iconId === 'Gift') return <Gift className="w-4.5 h-4.5" />;
                        if (iconId === 'Globe') return <Globe className="w-4.5 h-4.5" />;
                        if (iconId === 'Cpu') return <Cpu className="w-4.5 h-4.5" />;
                        return <Lock className="w-4.5 h-4.5" />;
                      })()}
                    </div>
                  )}

                  <div>
                    <span className="block text-xs font-black text-white uppercase tracking-wider leading-none">
                      {draftBranding.name || 'Nama Toko'}
                    </span>
                    <span className="text-[9px] text-sky-400 font-bold uppercase tracking-wider mt-1 block">
                      {draftBranding.slogan || 'Slogan Anda'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Invoice Brand preview */}
              <div className="bg-slate-950/80 rounded-2xl p-4 border border-slate-800/80 space-y-3">
                <span className="text-[8.5px] font-bold text-slate-500 block uppercase tracking-widest">Kop Invoice Digital:</span>
                <div className="bg-white p-4 rounded-xl text-slate-800 space-y-1 shadow-xs border border-slate-200">
                  <div className="flex items-center gap-1.5 border-b border-slate-100 pb-2">
                    {draftBranding.logoUrl ? (
                      <div className="w-6 h-6 rounded overflow-hidden flex items-center justify-center bg-white border">
                        <img src={draftBranding.logoUrl} alt="Preview" className="w-full h-full object-cover" />
                      </div>
                    ) : (
                      <div className="w-6 h-6 bg-slate-900 text-white rounded flex items-center justify-center text-[10px] font-bold">
                        {draftBranding.name ? draftBranding.name.substring(0, 2).toUpperCase() : 'DM'}
                      </div>
                    )}
                    <span className="font-extrabold text-xs uppercase tracking-tight text-slate-900">{draftBranding.name || 'DigiMarket'}</span>
                  </div>
                  <p className="text-[8px] text-slate-400 leading-tight">{draftBranding.slogan || 'Pusat Distribusi Aset Digital & Lisensi Resmi'}</p>
                  <p className="text-[8px] text-slate-400 leading-tight font-medium">{draftBranding.address || 'Gedung Cyber, Jakarta, Indonesia'}</p>
                </div>
              </div>

              {/* Status Note indicator */}
              <div className="bg-sky-500/10 border border-sky-500/20 rounded-2xl p-4 text-[10px] text-sky-200 leading-relaxed">
                💡 <span className="font-bold">Tips Penjualan:</span> Logo dan Slogan yang dirancang dengan apik meningkatkan tingkat kepercayaan pembeli (conversion rate) hingga 45%! Pastikan warna senada dengan jenis aset digital yang dipasarkan.
              </div>

            </div>

            {/* Firebase Database Configuration Card */}
            <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-xs space-y-4 animate-in fade-in duration-200">
              <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
                <div>
                  <h4 className="text-[11px] font-black text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                    <Database className="w-4 h-4 text-sky-600" /> Pengaturan Database Firebase
                  </h4>
                  <p className="text-[9.5px] text-slate-400 mt-0.5">Ubah dan konfigurasikan target database Firebase Firestore Anda.</p>
                </div>
              </div>

              <div className="space-y-3.5">
                {/* Project ID */}
                <div>
                  <label className="block text-[9px] font-black text-slate-500 uppercase tracking-wider mb-1">
                    Project ID <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={firebaseConfigState.projectId || ''}
                    onChange={(e) => setFirebaseConfigState({ ...firebaseConfigState, projectId: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl font-mono focus:outline-none focus:ring-1 focus:ring-sky-500 bg-slate-50/50"
                    placeholder="Contoh: horizontal-quarter-n79b0"
                  />
                </div>

                {/* Firestore Database ID */}
                <div>
                  <label className="block text-[9px] font-black text-slate-500 uppercase tracking-wider mb-1">
                    Firestore Database ID (Opsional)
                  </label>
                  <input
                    type="text"
                    value={firebaseConfigState.firestoreDatabaseId || ''}
                    onChange={(e) => setFirebaseConfigState({ ...firebaseConfigState, firestoreDatabaseId: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl font-mono focus:outline-none focus:ring-1 focus:ring-sky-500 bg-slate-50/50"
                    placeholder="default atau ID kustom"
                  />
                </div>

                {/* Show more / full config toggle */}
                <button
                  type="button"
                  onClick={() => setShowFullDbConfig(!showFullDbConfig)}
                  className="text-[10px] font-bold text-sky-600 hover:text-sky-700 transition-colors flex items-center gap-1"
                >
                  {showFullDbConfig ? 'Sembunyikan Kredensial Detail ▲' : 'Tampilkan Kredensial Detail (API Key, App ID, dll) ▼'}
                </button>

                {showFullDbConfig && (
                  <div className="space-y-3 pt-2 border-t border-slate-100 animate-in slide-in-from-top-2 duration-200">
                    {/* API Key */}
                    <div>
                      <label className="block text-[9px] font-black text-slate-500 uppercase tracking-wider mb-1">
                        API Key
                      </label>
                      <input
                        type="password"
                        value={firebaseConfigState.apiKey || ''}
                        onChange={(e) => setFirebaseConfigState({ ...firebaseConfigState, apiKey: e.target.value })}
                        className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl font-mono focus:outline-none focus:ring-1 focus:ring-sky-500 bg-slate-50/50"
                        placeholder="AIzaSy..."
                      />
                    </div>

                    {/* Auth Domain */}
                    <div>
                      <label className="block text-[9px] font-black text-slate-500 uppercase tracking-wider mb-1">
                        Auth Domain
                      </label>
                      <input
                        type="text"
                        value={firebaseConfigState.authDomain || ''}
                        onChange={(e) => setFirebaseConfigState({ ...firebaseConfigState, authDomain: e.target.value })}
                        className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl font-mono focus:outline-none focus:ring-1 focus:ring-sky-500 bg-slate-50/50"
                        placeholder="project.firebaseapp.com"
                      />
                    </div>

                    {/* Storage Bucket */}
                    <div>
                      <label className="block text-[9px] font-black text-slate-500 uppercase tracking-wider mb-1">
                        Storage Bucket
                      </label>
                      <input
                        type="text"
                        value={firebaseConfigState.storageBucket || ''}
                        onChange={(e) => setFirebaseConfigState({ ...firebaseConfigState, storageBucket: e.target.value })}
                        className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl font-mono focus:outline-none focus:ring-1 focus:ring-sky-500 bg-slate-50/50"
                        placeholder="project.appspot.com"
                      />
                    </div>

                    {/* Messaging Sender ID */}
                    <div>
                      <label className="block text-[9px] font-black text-slate-500 uppercase tracking-wider mb-1">
                        Messaging Sender ID
                      </label>
                      <input
                        type="text"
                        value={firebaseConfigState.messagingSenderId || ''}
                        onChange={(e) => setFirebaseConfigState({ ...firebaseConfigState, messagingSenderId: e.target.value })}
                        className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl font-mono focus:outline-none focus:ring-1 focus:ring-sky-500 bg-slate-50/50"
                        placeholder="Angka Sender ID"
                      />
                    </div>

                    {/* App ID */}
                    <div>
                      <label className="block text-[9px] font-black text-slate-500 uppercase tracking-wider mb-1">
                        App ID
                      </label>
                      <input
                        type="text"
                        value={firebaseConfigState.appId || ''}
                        onChange={(e) => setFirebaseConfigState({ ...firebaseConfigState, appId: e.target.value })}
                        className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl font-mono focus:outline-none focus:ring-1 focus:ring-sky-500 bg-slate-50/50"
                        placeholder="1:123456789:web:abcdef..."
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => {
                    localStorage.setItem('digimarket_custom_firebase', JSON.stringify(firebaseConfigState));
                    setDbSaveSuccess(true);
                    setTimeout(() => setDbSaveSuccess(false), 3000);
                    if (onAddSystemLog) {
                      onAddSystemLog(
                        'system',
                        'Konfigurasi Firebase Diperbarui',
                        `Pengaturan kredensial Firebase diperbarui ke Project ID: ${firebaseConfigState.projectId}`,
                        'admin@system'
                      );
                    }
                  }}
                  className="flex-1 py-2 px-3 bg-indigo-600 hover:bg-indigo-700 text-white text-[10px] font-bold rounded-xl shadow-xs transition-all flex items-center justify-center gap-1 cursor-pointer"
                >
                  {dbSaveSuccess ? (
                    <>
                      <Check className="w-3.5 h-3.5 animate-bounce" /> Tersimpan!
                    </>
                  ) : (
                    <>
                      <Save className="w-3.5 h-3.5" /> Simpan Config
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    localStorage.removeItem('digimarket_custom_firebase');
                    const defaultConfig = getActiveFirebaseConfig();
                    setFirebaseConfigState(defaultConfig);
                    if (onAddSystemLog) {
                      onAddSystemLog(
                        'system',
                        'Reset Konfigurasi Firebase',
                        `Konfigurasi Firebase berhasil di-reset kembali ke bawaan sistem.`,
                        'admin@system'
                      );
                    }
                  }}
                  className="py-2 px-3 bg-slate-100 hover:bg-slate-200 text-slate-600 text-[10px] font-bold rounded-xl transition-all flex items-center justify-center gap-1 cursor-pointer border border-slate-200"
                  title="Reset ke Bawaan Sistem"
                >
                  <RotateCcw className="w-3.5 h-3.5" /> Reset Default
                </button>
              </div>
            </div>

            {/* Firebase Live Connection Diagnostic Card */}
            <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-xs space-y-4 animate-in fade-in duration-200">
              <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
                <div>
                  <h4 className="text-[11px] font-black text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                    <Activity className={`w-4 h-4 text-sky-600 ${testConnStatus === 'testing' ? 'animate-pulse' : ''}`} /> Diagnostic Koneksi Firebase
                  </h4>
                  <p className="text-[9.5px] text-slate-400 mt-0.5">Uji coba koneksi langsung dari browser Anda ke Firestore Cloud.</p>
                </div>
                {testConnStatus === 'testing' ? (
                  <span className="flex items-center gap-1 px-2 py-0.5 bg-amber-50 text-amber-700 text-[9px] font-bold rounded-full animate-pulse">
                    Menguji...
                  </span>
                ) : testConnStatus === 'success' ? (
                  <span className="flex items-center gap-1 px-2 py-0.5 bg-emerald-50 text-emerald-700 text-[9px] font-bold rounded-full">
                    Sukses
                  </span>
                ) : testConnStatus === 'error' ? (
                  <span className="flex items-center gap-1 px-2 py-0.5 bg-rose-50 text-rose-700 text-[9px] font-bold rounded-full">
                    Gagal
                  </span>
                ) : (
                  <span className="flex items-center gap-1 px-2 py-0.5 bg-slate-100 text-slate-500 text-[9px] font-bold rounded-full">
                    Belum Diuji
                  </span>
                )}
              </div>

              {/* Connection Specs */}
              <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100 text-[10px] space-y-1.5">
                <div className="flex justify-between items-center">
                  <span className="text-slate-400 uppercase font-bold text-[8.5px]">Project ID:</span>
                  <span className="font-mono font-bold text-slate-700">{firebaseConfigState.projectId || '(Belum Diisi)'}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400 uppercase font-bold text-[8.5px]">Database ID:</span>
                  <span className="font-mono font-bold text-slate-700">{firebaseConfigState.firestoreDatabaseId || '(default)'}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400 uppercase font-bold text-[8.5px]">Auth Domain:</span>
                  <span className="font-mono text-slate-500 text-[9px]">{firebaseConfigState.authDomain || '(Belum Diisi)'}</span>
                </div>
              </div>

              {/* Diagnostic result panel */}
              {testConnResult && (
                <div className={`p-4 rounded-2xl border text-xs leading-relaxed space-y-2 animate-in fade-in duration-200 ${
                  testConnResult.success 
                    ? 'bg-emerald-50/50 border-emerald-100 text-slate-700' 
                    : 'bg-rose-50/50 border-rose-100 text-slate-700'
                }`}>
                  <div className="flex items-start gap-2">
                    {testConnResult.success ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    ) : (
                      <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                    )}
                    <div>
                      <h5 className={`font-bold text-[11px] uppercase tracking-wide ${
                        testConnResult.success ? 'text-emerald-800' : 'text-rose-800'
                      }`}>
                        {testConnResult.success ? 'Koneksi Berhasil!' : 'Koneksi Gagal / Bermasalah!'}
                      </h5>
                      <p className="text-[10px] mt-0.5 text-slate-600 leading-relaxed">
                        {testConnResult.message}
                      </p>
                    </div>
                  </div>

                  {/* Diagnostic details */}
                  <div className="bg-white/80 border border-slate-100 rounded-xl p-3 text-[9px] font-mono space-y-1 text-slate-500">
                    <div className="font-bold text-slate-700 border-b border-slate-100 pb-1 mb-1 flex justify-between items-center">
                      <span>Detail Log Diagnostik</span>
                      {testConnResult.details?.latencyMs !== undefined && (
                        <span className="text-[8px] bg-slate-100 px-1.5 py-0.5 rounded-md text-slate-500 font-bold">
                          Latency: {testConnResult.details.latencyMs} ms
                        </span>
                      )}
                    </div>
                    <div>Status: <span className={testConnResult.success ? 'text-emerald-600 font-bold' : 'text-rose-600 font-bold'}>{testConnResult.success ? 'SUCCESS' : 'FAILED'}</span></div>
                    {testConnResult.details?.errorType && (
                      <div>Kategori Error: <span className="text-amber-600 font-bold">{testConnResult.details.errorType}</span></div>
                    )}
                    {testConnResult.details?.errorMessage && (
                      <div className="max-h-[80px] overflow-y-auto whitespace-pre-wrap break-all mt-1 bg-slate-50 p-1.5 rounded-lg border border-slate-100 text-[8.5px]">
                        {testConnResult.details.errorMessage}
                      </div>
                    )}
                    {testConnResult.details?.errorType === 'PERMISSION_DENIED' && (
                      <div className="mt-2 text-amber-700 bg-amber-50/80 p-2 rounded-lg border border-amber-100 font-sans leading-relaxed text-[8.5px]">
                        <strong>💡 Solusi Security Rules:</strong> Koneksi server terhubung sepenuhnya! Anda hanya perlu menyesuaikan <code>firestore.rules</code> di console Firebase Anda agar mengizinkan akses baca/tulis, atau jalankan perintah sinkronisasi massal di bawah.
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Start Test Button */}
              <button
                type="button"
                onClick={() => handleTestFirebaseConnection()}
                disabled={testConnStatus === 'testing'}
                className={`w-full py-2.5 px-4 rounded-xl text-xs font-black tracking-wide flex items-center justify-center gap-2 transition-all cursor-pointer ${
                  testConnStatus === 'testing'
                    ? 'bg-slate-100 text-slate-400 border border-slate-200'
                    : 'bg-sky-50 hover:bg-sky-100 text-sky-700 border border-sky-100 hover:scale-[1.01] active:scale-[0.99]'
                }`}
              >
                {testConnStatus === 'testing' ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin text-slate-400" />
                    Melakukan Diagnostik Ping...
                  </>
                ) : (
                  <>
                    <Activity className="w-4 h-4" />
                    Mulai Tes Koneksi Firebase
                  </>
                )}
              </button>
            </div>

            {/* Cloud Sync Manager Card */}
            <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-xs space-y-4">
              <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
                <div>
                  <h4 className="text-[11px] font-black text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                    <Database className="w-4 h-4 text-emerald-600 animate-pulse" /> Firebase Cloud Database Sync
                  </h4>
                  <p className="text-[9.5px] text-slate-400 mt-0.5">Sinkronisasi & cadangkan semua database lokal Anda ke Cloud.</p>
                </div>
                <span className="flex items-center gap-1 px-2 py-0.5 bg-emerald-50 text-emerald-700 text-[9px] font-bold rounded-full">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                  Aktif
                </span>
              </div>

              {/* Database Metrics Grid */}
              <div className="grid grid-cols-2 gap-2 text-[10px]">
                <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100 flex justify-between items-center">
                  <span className="text-slate-500">Katalog Produk</span>
                  <span className="font-bold text-slate-800">{products.length}</span>
                </div>
                <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100 flex justify-between items-center">
                  <span className="text-slate-500">Transaksi</span>
                  <span className="font-bold text-slate-800">{transactions.length}</span>
                </div>
                <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100 flex justify-between items-center">
                  <span className="text-slate-500">Tiket Komplain</span>
                  <span className="font-bold text-slate-800">{complaints.length}</span>
                </div>
                <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100 flex justify-between items-center">
                  <span className="text-slate-500">Customer Vault</span>
                  <span className="font-bold text-slate-800">{vaultUsers.length}</span>
                </div>
                <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100 flex justify-between items-center col-span-2">
                  <span className="text-slate-500">System Logs</span>
                  <span className="font-bold text-slate-800">{systemLogs.length} entri</span>
                </div>
              </div>

              {/* Information Callout */}
              <div className="text-[9.5px] bg-slate-50 rounded-xl p-3 border border-slate-100 text-slate-500 space-y-1">
                <div className="font-bold text-slate-700 flex items-center gap-1">⚡ Sinkronisasi Otomatis Real-time</div>
                <p className="leading-relaxed">Sistem marketplace mendeteksi setiap penambahan produk baru, ulasan pembeli, komplain pelanggan, dan pembaruan invoice, lalu langsung menyinkronkannya ke Firestore secara langsung.</p>
              </div>

              {/* Bulk Sync Button */}
              <button
                type="button"
                onClick={handleBulkSyncAll}
                disabled={bulkSyncStatus === 'syncing'}
                className={`w-full py-2.5 px-4 rounded-xl text-xs font-black tracking-wide flex items-center justify-center gap-2 transition-all cursor-pointer ${
                  bulkSyncStatus === 'syncing'
                    ? 'bg-slate-100 text-slate-400 border border-slate-200'
                    : bulkSyncStatus === 'success'
                    ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-md'
                    : 'bg-slate-900 hover:bg-emerald-600 hover:scale-[1.02] active:scale-[0.98] text-white shadow-md'
                }`}
              >
                {bulkSyncStatus === 'syncing' ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin text-slate-400" />
                    Mensinkronisasikan Database...
                  </>
                ) : bulkSyncStatus === 'success' ? (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    Ulangi Sinkronisasi Massal
                  </>
                ) : (
                  <>
                    <RefreshCw className="w-4 h-4" />
                    Migrasikan & Dorong Semua Data ke Cloud
                  </>
                )}
              </button>

              {/* Interactive Log Output Console */}
              {bulkSyncLogs.length > 0 && (
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider">Console Log Sinkronisasi:</span>
                    <button 
                      type="button" 
                      onClick={() => setBulkSyncLogs([])}
                      className="text-[9px] text-slate-400 hover:text-rose-500 font-bold"
                    >
                      Bersihkan
                    </button>
                  </div>
                  <div className="bg-slate-900 text-slate-200 rounded-xl p-3 font-mono text-[8.5px] max-h-[140px] overflow-y-auto space-y-1 shadow-inner border border-slate-800">
                    {bulkSyncLogs.map((log, index) => (
                      <div key={index} className={`leading-relaxed ${
                        log.includes('❌') ? 'text-rose-400' : 
                        log.includes('✅') || log.includes('🎉') ? 'text-emerald-400' : 
                        log.includes('⚠️') ? 'text-amber-400' : 'text-slate-300'
                      }`}>
                        {log}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

          </div>
        </div>
      )}

      {/* TAB 4.5: Promo Code Management */}
      {activeTab === 'promos' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-in fade-in duration-200">
          {/* LEFT COLUMN: Create / Edit Promo Code Form (5 cols) */}
          <div className="lg:col-span-5 space-y-4">
            <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-xs">
              <div className="border-b border-slate-100 pb-3 mb-4">
                <h4 className="text-xs font-black text-slate-900 uppercase tracking-wide flex items-center gap-1.5">
                  <Percent className="w-4 h-4 text-rose-500" />
                  {promoCodeState.id ? 'Edit Kode Promo' : 'Buat Kode Promo Baru'}
                </h4>
                <p className="text-[10px] text-slate-400 mt-0.5">
                  {promoCodeState.id 
                    ? 'Perbarui parameter untuk kupon diskon aktif Anda.' 
                    : 'Terbitkan voucher belanja potongan persentase atau flat nominal.'}
                </p>
              </div>

              {promoFormError && (
                <div className="p-3 bg-rose-50 border border-rose-100 rounded-xl text-[10px] font-bold text-rose-700 mb-4">
                  ⚠️ {promoFormError}
                </div>
              )}

              {promoFormSuccess && (
                <div className="p-3 bg-emerald-50 border border-emerald-100 rounded-xl text-[10px] font-bold text-emerald-700 mb-4">
                  ✓ {promoFormSuccess}
                </div>
              )}

              <form onSubmit={handleAddOrUpdatePromo} className="space-y-4">
                <div>
                  <label className="block text-[9px] font-black uppercase text-slate-400 tracking-wider mb-1.5">Kode Voucher (Kapital, tanpa spasi) <span className="text-rose-500">*</span></label>
                  <input
                    type="text"
                    placeholder="Contoh: HEMAT10K, PROMO25"
                    value={promoCodeState.code}
                    onChange={(e) => setPromoCodeState(prev => ({ ...prev, code: e.target.value.toUpperCase().replace(/\s+/g, '') }))}
                    className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 focus:bg-white focus:outline-hidden focus:ring-1 focus:ring-sky-500 font-extrabold tracking-wider text-slate-800"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[9px] font-black uppercase text-slate-400 tracking-wider mb-1.5">Tipe Potongan <span className="text-rose-500">*</span></label>
                    <select
                      value={promoCodeState.type}
                      onChange={(e) => setPromoCodeState(prev => ({ ...prev, type: e.target.value as 'percentage' | 'flat' }))}
                      className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 focus:bg-white focus:outline-hidden font-bold text-slate-700"
                    >
                      <option value="percentage">Persentase (%)</option>
                      <option value="flat">Nominal Tetap (Rp)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[9px] font-black uppercase text-slate-400 tracking-wider mb-1.5">
                      {promoCodeState.type === 'percentage' ? 'Persentase (%)' : 'Jumlah (Rp)'} <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="number"
                      min={1}
                      placeholder={promoCodeState.type === 'percentage' ? '10' : '15000'}
                      value={promoCodeState.value || ''}
                      onChange={(e) => setPromoCodeState(prev => ({ ...prev, value: Math.max(0, parseInt(e.target.value) || 0) }))}
                      className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 focus:bg-white focus:outline-hidden font-bold text-slate-850"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[9px] font-black uppercase text-slate-400 tracking-wider mb-1.5">Min. Pembelian (Rp)</label>
                    <input
                      type="number"
                      placeholder="0 (Tanpa minimal)"
                      value={promoCodeState.minPurchase || ''}
                      onChange={(e) => setPromoCodeState(prev => ({ ...prev, minPurchase: Math.max(0, parseInt(e.target.value) || 0) }))}
                      className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 focus:bg-white focus:outline-hidden font-bold text-slate-850"
                    />
                  </div>
                  <div>
                    <label className="block text-[9px] font-black uppercase text-slate-400 tracking-wider mb-1.5">Maks. Potongan (Rp)</label>
                    <input
                      type="number"
                      placeholder="0 (Tanpa maksimal)"
                      disabled={promoCodeState.type === 'flat'}
                      value={promoCodeState.maxDiscount || ''}
                      onChange={(e) => setPromoCodeState(prev => ({ ...prev, maxDiscount: Math.max(0, parseInt(e.target.value) || 0) }))}
                      className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 focus:bg-white focus:outline-hidden font-bold text-slate-850 disabled:opacity-50"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[9px] font-black uppercase text-slate-400 tracking-wider mb-1.5">Batas Penggunaan (Kali)</label>
                    <input
                      type="number"
                      placeholder="0 (Tak terbatas)"
                      value={promoCodeState.usageLimit || ''}
                      onChange={(e) => setPromoCodeState(prev => ({ ...prev, usageLimit: Math.max(0, parseInt(e.target.value) || 0) }))}
                      className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 focus:bg-white focus:outline-hidden font-bold text-slate-850"
                    />
                  </div>
                  <div>
                    <label className="block text-[9px] font-black uppercase text-slate-400 tracking-wider mb-1.5">Tanggal Kedaluwarsa</label>
                    <input
                      type="date"
                      value={promoCodeState.expiryDate}
                      onChange={(e) => setPromoCodeState(prev => ({ ...prev, expiryDate: e.target.value }))}
                      className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 focus:bg-white focus:outline-hidden font-medium text-slate-850"
                    />
                  </div>
                </div>

                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 flex items-center justify-between">
                  <div>
                    <span className="block text-[10px] font-black uppercase text-slate-700">Status Aktif Kunci</span>
                    <span className="text-[9px] text-slate-400">Jika mati, kode promo ini tidak bisa digunakan pembeli.</span>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={promoCodeState.isActive}
                      onChange={(e) => setPromoCodeState(prev => ({ ...prev, isActive: e.target.checked }))}
                      className="sr-only peer"
                    />
                    <div className="w-8 h-4.5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-3.5 after:w-3.5 after:transition-all peer-checked:bg-sky-600"></div>
                  </label>
                </div>

                <div className="flex gap-2 pt-2">
                  {promoCodeState.id && (
                    <button
                      type="button"
                      onClick={() => setPromoCodeState({
                        id: null,
                        code: '',
                        type: 'percentage',
                        value: 10,
                        minPurchase: 0,
                        maxDiscount: 50000,
                        isActive: true,
                        expiryDate: new Date(Date.now() + 3600000 * 24 * 30).toISOString().split('T')[0],
                        usageLimit: 100,
                      })}
                      className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold text-xs rounded-xl transition-all cursor-pointer"
                    >
                      Batal
                    </button>
                  )}
                  <button
                    type="submit"
                    className="flex-1 py-2.5 bg-slate-900 hover:bg-sky-600 text-white font-extrabold text-xs rounded-xl transition-all cursor-pointer shadow-xs shadow-slate-900/10 flex items-center justify-center gap-1.5"
                  >
                    {promoCodeState.id ? 'Perbarui Voucher' : 'Simpan Voucher Baru'}
                  </button>
                </div>
              </form>
            </div>
          </div>

          {/* RIGHT COLUMN: Active Promo Codes List (7 cols) */}
          <div className="lg:col-span-7 space-y-4">
            <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-xs">
              <div className="border-b border-slate-100 pb-3 mb-4">
                <h4 className="text-xs font-black text-slate-900 uppercase tracking-wide">
                  Daftar Voucher & Kode Promo Aktif ({promoCodes?.length || 0})
                </h4>
                <p className="text-[10px] text-slate-400 mt-0.5">Daftar semua kupon promo yang dapat diaplikasikan pembeli saat checkout.</p>
              </div>

              <div className="space-y-3 max-h-[600px] overflow-y-auto pr-1">
                {promoCodes?.length > 0 ? (
                  promoCodes.map((promo) => {
                    const isExpired = promo.expiryDate && new Date(promo.expiryDate + 'T23:59:59') < new Date();
                    return (
                      <div 
                        key={promo.id} 
                        className={`border rounded-2xl p-4 bg-white transition-all hover:shadow-xs flex flex-col md:flex-row justify-between gap-4 ${
                          promo.isActive && !isExpired ? 'border-slate-150' : 'border-slate-100 bg-slate-50/50 opacity-75'
                        }`}
                      >
                        <div className="space-y-1.5 flex-1">
                          <div className="flex items-center flex-wrap gap-2">
                            <span className="px-2.5 py-1 bg-rose-50 text-rose-700 rounded-lg text-xs font-black tracking-wider border border-rose-100/50 uppercase select-all">
                              {promo.code}
                            </span>
                            <span className={`text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full ${
                              !promo.isActive 
                                ? 'bg-slate-100 text-slate-500' 
                                : isExpired 
                                  ? 'bg-amber-50 text-amber-600' 
                                  : 'bg-emerald-50 text-emerald-600'
                            }`}>
                              {!promo.isActive ? 'Nonaktif' : isExpired ? 'Kedaluwarsa' : 'Aktif'}
                            </span>
                          </div>

                          <div className="text-[11px] text-slate-500 leading-normal font-semibold">
                            Diskon <strong className="font-extrabold text-slate-800">
                              {promo.type === 'percentage' ? `${promo.value}%` : `Rp ${promo.value.toLocaleString('id-ID')}`}
                            </strong>
                            {promo.minPurchase ? ` dengan minimal belanja Rp ${promo.minPurchase.toLocaleString('id-ID')}` : ''}
                            {promo.maxDiscount && promo.type === 'percentage' ? ` (Maks. potongan Rp ${promo.maxDiscount.toLocaleString('id-ID')})` : ''}
                          </div>

                          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 text-[9px] text-slate-400 border-t border-slate-50 pt-2.5 mt-2.5">
                            <div>
                              <span className="block font-bold uppercase text-slate-400">Penggunaan</span>
                              <strong className="font-extrabold text-slate-700">
                                {promo.usageCount} {promo.usageLimit ? `/ ${promo.usageLimit}` : 'kali'}
                              </strong>
                            </div>
                            <div>
                              <span className="block font-bold uppercase text-slate-400">Berakhir Pada</span>
                              <strong className="font-extrabold text-slate-700">
                                {promo.expiryDate ? new Date(promo.expiryDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Selamanya'}
                              </strong>
                            </div>
                          </div>
                        </div>

                        {/* Action buttons */}
                        <div className="flex items-center gap-2 self-end md:self-center">
                          <button
                            onClick={() => handleTogglePromoActive(promo)}
                            className={`p-2 rounded-xl border transition-all cursor-pointer ${
                              promo.isActive 
                                ? 'bg-emerald-50 border-emerald-100 text-emerald-600 hover:bg-emerald-100' 
                                : 'bg-slate-50 border-slate-200 text-slate-400 hover:bg-slate-100'
                            }`}
                            title={promo.isActive ? 'Nonaktifkan Kupon' : 'Aktifkan Kupon'}
                          >
                            <CheckCircle2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleEditPromoClick(promo)}
                            className="p-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-600 rounded-xl transition-all cursor-pointer"
                            title="Edit Parameter"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeletePromo(promo.id, promo.code)}
                            className="p-2 bg-rose-50 hover:bg-rose-100 border border-rose-100 text-rose-600 rounded-xl transition-all cursor-pointer"
                            title="Hapus Permanen"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="text-center py-12 text-slate-400 text-xs">
                    🏷️ Belum ada voucher atau kode promo dibuat. Silakan gunakan formulir di samping untuk membuatnya!
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: Complaints and Payment Methods Management */}
      {activeTab === 'complaints_payments' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-in fade-in duration-200">
          
          {/* LEFT: Customer Complaints List (7 cols) */}
          <div className="lg:col-span-7 space-y-4">
            <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-xs">
              <div className="border-b border-slate-100 pb-3 mb-4 flex items-center justify-between">
                <div>
                  <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-2">
                    <MessageSquare className="w-4 h-4 text-rose-500" /> Tiket Komplain & Kendala Pelanggan
                  </h3>
                  <p className="text-[10px] text-slate-400 mt-1">Daftar laporan kendala, salah transfer, atau permintaan bantuan lisensi dari pembeli.</p>
                </div>
                <span className="px-2.5 py-1 bg-rose-50 text-rose-600 rounded-lg text-[10px] font-bold">
                  {complaints.filter(c => c.status === 'PENDING').length} Baru
                </span>
              </div>

              <div className="space-y-4 max-h-[550px] overflow-y-auto pr-1">
                {complaints.length === 0 ? (
                  <div className="text-center py-12 bg-slate-50 rounded-xl border border-dashed border-slate-100">
                    <MessageSquare className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                    <h5 className="text-xs font-bold text-slate-700">Tidak Ada Komplain Masuk</h5>
                    <p className="text-[10px] text-slate-400 mt-0.5">Semua pelayanan pelanggan berjalan dengan sangat lancar!</p>
                  </div>
                ) : (
                  complaints.map((comp) => (
                    <div 
                      key={comp.id} 
                      className={`border rounded-xl p-4 space-y-3 transition-colors ${
                        comp.status === 'PENDING' 
                          ? 'border-amber-200 bg-amber-50/15' 
                          : comp.status === 'RESOLVED'
                          ? 'border-emerald-100 bg-emerald-50/10'
                          : 'border-slate-150 bg-slate-50/30'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2 border-b border-slate-100 pb-2.5">
                        <div>
                          <span className="text-[9px] font-mono text-slate-400">ID Komplain: {comp.id}</span>
                          <h4 className="text-xs font-bold text-slate-800 mt-0.5">{comp.name}</h4>
                          <span className="text-[9.5px] text-slate-500 font-medium">{comp.email}</span>
                        </div>
                        <span className={`px-2 py-0.5 rounded text-[8.5px] font-black uppercase tracking-wider leading-none ${
                          comp.status === 'PENDING' 
                            ? 'bg-amber-100 text-amber-800' 
                            : comp.status === 'RESOLVED'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-rose-100 text-rose-800'
                        }`}>
                          {comp.status === 'PENDING' ? 'Perlu Diproses' : comp.status === 'RESOLVED' ? 'Selesai' : 'Ditolak'}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-[10px] bg-slate-50/80 p-2.5 rounded-lg border border-slate-100/70">
                        <div>
                          <span className="text-slate-400 block uppercase font-bold text-[8px] tracking-wide">Kategori</span>
                          <span className="font-semibold text-slate-700">{comp.category}</span>
                        </div>
                        <div>
                          <span className="text-slate-400 block uppercase font-bold text-[8px] tracking-wide">ID Transaksi</span>
                          <span className="font-mono font-bold text-rose-600">{comp.transactionId}</span>
                        </div>
                      </div>

                      <div className="text-[11px] text-slate-600 bg-white p-3 rounded-lg border border-slate-100 leading-relaxed font-medium">
                        <strong className="text-slate-400 block uppercase font-bold text-[8px] mb-1">Isi Laporan / Pesan:</strong>
                        "{comp.message}"
                      </div>

                      {comp.adminNotes && (
                        <div className="text-[10px] text-sky-700 bg-sky-50 border border-sky-100 p-2.5 rounded-lg">
                          <strong className="block font-bold">Catatan Penyelesaian Admin:</strong>
                          {comp.adminNotes}
                        </div>
                      )}

                      {comp.status === 'PENDING' && (
                        <div className="flex flex-col gap-2 pt-1">
                          <div className="flex gap-2">
                            <input
                              type="text"
                              placeholder="Ketik catatan penyelesaian atau balasan ke pelanggan..."
                              id={`admin-reply-${comp.id}`}
                              className="flex-1 text-[11px] bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-hidden focus:ring-1 focus:ring-sky-500 text-slate-800 font-medium"
                            />
                            <button
                              type="button"
                              onClick={() => {
                                const el = document.getElementById(`admin-reply-${comp.id}`) as HTMLInputElement;
                                const reply = el?.value || 'Diselesaikan via Admin Control';
                                onUpdateComplaint({
                                  ...comp,
                                  status: 'RESOLVED',
                                  adminNotes: reply,
                                  resolvedAt: new Date().toISOString()
                                });
                                alert('✓ Komplain berhasil diselesaikan!');
                              }}
                              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-black rounded-lg transition-colors cursor-pointer"
                            >
                              Selesaikan
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                const el = document.getElementById(`admin-reply-${comp.id}`) as HTMLInputElement;
                                const reply = el?.value || 'Komplain ditolak';
                                onUpdateComplaint({
                                  ...comp,
                                  status: 'REJECTED',
                                  adminNotes: reply,
                                  resolvedAt: new Date().toISOString()
                                });
                                alert('✗ Komplain ditolak.');
                              }}
                              className="px-2.5 py-1.5 bg-slate-200 hover:bg-rose-50 text-slate-700 hover:text-rose-700 text-[10px] font-bold rounded-lg transition-colors cursor-pointer"
                            >
                              Tolak
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* RIGHT: Manage Payment Methods (5 cols) */}
          <div className="lg:col-span-5 space-y-4">
            <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-xs">
              <div className="border-b border-slate-100 pb-3 mb-4">
                <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-2">
                  <Bank className="w-4 h-4 text-sky-600" /> Pengaturan Menu Rekening Pembayaran
                </h3>
                <p className="text-[10px] text-slate-400 mt-1">Ubah nomor rekening, batas instruksi transfer, dan aktifkan/nonaktifkan metode pembayaran utama.</p>
              </div>

              <div className="space-y-4 max-h-[550px] overflow-y-auto pr-1">
                {paymentMethods.map((method) => (
                  <div key={method.id} className="border border-slate-150 rounded-xl p-4 bg-slate-50/40 space-y-3">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                      <div className="flex items-center gap-2">
                        {method.icon === 'CreditCard' && <CreditCard className="w-4 h-4 text-blue-600" />}
                        {method.icon === 'QrCode' && <QrCode className="w-4 h-4 text-emerald-600" />}
                        {method.icon === 'Smartphone' && <Smartphone className="w-4 h-4 text-sky-600" />}
                        {method.icon === 'Bank' && <Bank className="w-4 h-4 text-rose-500" />}
                        <span className="text-xs font-black text-slate-800">{method.name}</span>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={method.isActive}
                          onChange={(e) => {
                            const updated = paymentMethods.map(m => m.id === method.id ? { ...m, isActive: e.target.checked } : m);
                            onUpdatePaymentMethods(updated);
                          }}
                          className="sr-only peer"
                        />
                        <div className="w-8 h-4.5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-3.5 after:w-3.5 after:transition-all peer-checked:bg-sky-600"></div>
                        <span className="ml-1.5 text-[10px] font-bold text-slate-500 uppercase">{method.isActive ? 'Aktif' : 'Nonaktif'}</span>
                      </label>
                    </div>

                    <div className="space-y-2.5">
                      <div>
                        <label className="block text-[8px] font-black uppercase text-slate-400 tracking-wider">Nama Rekening / Akun</label>
                        <input
                          type="text"
                          value={method.accountName}
                          onChange={(e) => {
                            const updated = paymentMethods.map(m => m.id === method.id ? { ...m, accountName: e.target.value } : m);
                            onUpdatePaymentMethods(updated);
                          }}
                          className="w-full text-xs bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-hidden font-bold text-slate-800"
                        />
                      </div>
                      <div>
                        <label className="block text-[8px] font-black uppercase text-slate-400 tracking-wider">Nomor Rekening / QR Code Data</label>
                        <input
                          type="text"
                          value={method.accountNumber}
                          onChange={(e) => {
                            const updated = paymentMethods.map(m => m.id === method.id ? { ...m, accountNumber: e.target.value } : m);
                            onUpdatePaymentMethods(updated);
                          }}
                          className="w-full text-xs bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-hidden font-mono text-slate-800"
                        />
                      </div>
                      <div>
                        <label className="block text-[8px] font-black uppercase text-slate-400 tracking-wider">Slogan Deskripsi Ringkas</label>
                        <input
                          type="text"
                          value={method.description}
                          onChange={(e) => {
                            const updated = paymentMethods.map(m => m.id === method.id ? { ...m, description: e.target.value } : m);
                            onUpdatePaymentMethods(updated);
                          }}
                          className="w-full text-xs bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-hidden font-medium text-slate-600"
                        />
                      </div>
                      <div>
                        <label className="block text-[8px] font-black uppercase text-slate-400 tracking-wider">Instruksi Pembayaran</label>
                        <textarea
                          value={method.instructions}
                          onChange={(e) => {
                            const updated = paymentMethods.map(m => m.id === method.id ? { ...m, instructions: e.target.value } : m);
                            onUpdatePaymentMethods(updated);
                          }}
                          rows={2}
                          className="w-full text-xs bg-white border border-slate-200 rounded-lg p-2.5 focus:outline-hidden font-medium text-slate-600"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

        </div>
      )}

      {/* TAB: Pojok Silaturahmi Moderation & Admin Replies */}
      {activeTab === 'silaturahmi' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-in fade-in duration-200">
          {/* LEFT: Reply Form & Guidelines (4 cols) */}
          <div className="lg:col-span-4 space-y-4">
            <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-xs">
              <div className="border-b border-slate-100 pb-3 mb-4">
                <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 text-sky-600 animate-pulse" /> Balas Silaturahmi (Admin)
                </h3>
                <p className="text-[10px] text-slate-400 mt-1">
                  Kirim balasan resmi dengan salah satu identitas/peran Admin.
                </p>
              </div>

              <form
                onSubmit={async (e) => {
                  e.preventDefault();
                  if (!adminReplyName.trim() || !adminReplyMessage.trim()) return;
                  setIsSubmittingReply(true);

                  // Colors bank
                  const colors = [
                    'bg-indigo-600 text-white font-black',
                    'bg-emerald-600 text-white font-black',
                    'bg-rose-600 text-white font-black',
                    'bg-sky-600 text-white font-black',
                    'bg-amber-600 text-white font-black',
                    'bg-purple-600 text-white font-black',
                    'bg-violet-600 text-white font-black'
                  ];

                  const newMessage: SilaturahmiMessage = {
                    id: `msg-${Date.now()}`,
                    name: adminReplyName.trim(),
                    message: adminReplyMessage.trim(),
                    timestamp: new Date().toISOString(),
                    avatarColor: colors[Math.floor(Math.random() * colors.length)],
                    role: adminReplyRole,
                  };

                  try {
                    // Sync to Firebase and update local state
                    await syncToFirebase('silaturahmi', newMessage.id, newMessage);
                    if (onUpdateSilaturahmiMessages) {
                      onUpdateSilaturahmiMessages([...silaturahmiMessages, newMessage]);
                    }
                    setAdminReplyMessage('');
                    alert(`🎉 Berhasil mengirim balasan sebagai ${adminReplyRole}!`);
                  } catch (err: any) {
                    console.error('Failed to sync reply:', err);
                    alert('Gagal mengirim ke cloud, mencoba menyalin secara lokal.');
                    if (onUpdateSilaturahmiMessages) {
                      onUpdateSilaturahmiMessages([...silaturahmiMessages, newMessage]);
                    }
                  } finally {
                    setIsSubmittingReply(false);
                  }
                }}
                className="space-y-4"
              >
                <div>
                  <label className="block text-[8px] font-black uppercase text-slate-400 tracking-wider mb-1.5">Nama Panggilan</label>
                  <input
                    type="text"
                    required
                    placeholder="Nama Admin"
                    value={adminReplyName}
                    onChange={(e) => setAdminReplyName(e.target.value)}
                    className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 focus:bg-white focus:outline-hidden font-medium text-slate-800"
                  />
                </div>

                <div>
                  <label className="block text-[8px] font-black uppercase text-slate-400 tracking-wider mb-1.5">Pilih Peran Balasan</label>
                  <div className="grid grid-cols-3 gap-2">
                    {(['Owner', 'Creator', 'Developer'] as const).map((role) => (
                      <button
                        key={role}
                        type="button"
                        onClick={() => setAdminReplyRole(role)}
                        className={`py-1.5 px-2 text-[10px] font-bold rounded-xl border transition-all cursor-pointer text-center ${
                          adminReplyRole === role
                            ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                            : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        {role}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-[8px] font-black uppercase text-slate-400 tracking-wider mb-1.5">Isi Pesan Balasan</label>
                  <textarea
                    required
                    maxLength={120}
                    placeholder="Tulis balasan hangat atau panduan teknis..."
                    value={adminReplyMessage}
                    onChange={(e) => setAdminReplyMessage(e.target.value)}
                    rows={3}
                    className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl p-3 focus:bg-white focus:outline-hidden font-medium text-slate-700 resize-none"
                  />
                  <span className="text-[9px] text-slate-400 font-medium block text-right mt-1">
                    {adminReplyMessage.length}/120 karakter
                  </span>
                </div>

                <button
                  type="submit"
                  disabled={isSubmittingReply}
                  className="w-full py-2.5 bg-sky-600 hover:bg-sky-700 disabled:bg-slate-300 text-white text-xs font-black rounded-xl transition-all hover:scale-[1.01] active:scale-[0.99] cursor-pointer flex items-center justify-center gap-2 shadow-xs"
                >
                  {isSubmittingReply ? 'Mengirim...' : 'Kirim Balasan Resmi ✨'}
                </button>
              </form>
            </div>

            <div className="bg-amber-50/50 border border-amber-100 rounded-2xl p-4 text-[10px] text-amber-800 leading-relaxed space-y-2">
              <span className="font-bold block text-[11px]">📝 Aturan Pojok Silaturahmi:</span>
              <p>1. Menu depan hanya memperbolehkan pengunjung memilih peran <strong>Tamu 👤</strong> atau <strong>Pembeli 🛍️</strong>.</p>
              <p>2. Peran administratif tingkat tinggi seperti <strong>Owner</strong>, <strong>Creator</strong>, atau <strong>Developer</strong> hanya boleh diposting melalui panel Admin System rahasia ini.</p>
            </div>
          </div>

          {/* RIGHT: Silaturahmi Feed & Moderation (8 cols) */}
          <div className="lg:col-span-8">
            <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-xs min-h-[450px] flex flex-col">
              <div className="border-b border-slate-100 pb-3 mb-4 flex items-center justify-between">
                <div>
                  <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-2">
                    🤝 Log & Moderasi Pojok Silaturahmi
                  </h3>
                  <p className="text-[10px] text-slate-400 mt-1">Daftar sapaan dari pengunjung secara real-time. Anda dapat memantau dan menghapus pesan yang tidak pantas.</p>
                </div>
                <span className="text-[9.5px] font-extrabold px-2 py-1 rounded bg-slate-100 text-slate-700">
                  Total: {silaturahmiMessages?.length || 0} Pesan
                </span>
              </div>

              <div className="flex-1 space-y-3.5 max-h-[500px] overflow-y-auto pr-2">
                {(!silaturahmiMessages || silaturahmiMessages.length === 0) ? (
                  <div className="h-full flex flex-col items-center justify-center text-slate-400 py-12">
                    <span className="text-2xl">🤝</span>
                    <span className="text-[10.5px] font-bold mt-2">Belum ada sapaan silaturahmi</span>
                  </div>
                ) : (
                  [...silaturahmiMessages].reverse().map((msg) => {
                    const dateObj = new Date(msg.timestamp);
                    const dateStr = isNaN(dateObj.getTime()) 
                      ? 'Baru saja' 
                      : dateObj.toLocaleString('id-ID', { dateStyle: 'short', timeStyle: 'short' });

                    // Roles badges
                    const isPremiumRole = ['Owner', 'Creator', 'Developer', 'Kreator'].includes(msg.role || '');
                    const isBuyer = msg.role === 'Pembeli';

                    const roleBadgeColor = isPremiumRole
                      ? 'bg-indigo-100 text-indigo-800 border-indigo-200'
                      : isBuyer
                        ? 'bg-emerald-100 text-emerald-800 border-emerald-200'
                        : 'bg-slate-100 text-slate-700 border-slate-200';

                    return (
                      <div key={msg.id} className="flex gap-3 items-start border border-slate-50 hover:border-slate-100 bg-slate-50/20 hover:bg-slate-50/50 p-3.5 rounded-2xl transition-all">
                        <div className={`w-9 h-9 rounded-full flex items-center justify-center font-black text-xs shrink-0 ${msg.avatarColor || 'bg-slate-200 text-slate-700'}`}>
                          {msg.name ? msg.name.charAt(0).toUpperCase() : '?' }
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2 flex-wrap mb-1">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-black text-slate-800">{msg.name}</span>
                              <span className={`px-1.5 py-0.2 text-[8px] font-black uppercase rounded-sm border ${roleBadgeColor}`}>
                                {msg.role || 'Tamu'}
                              </span>
                            </div>
                            <span className="text-[9px] font-medium font-mono text-slate-400">{dateStr}</span>
                          </div>
                          <p className="text-[11px] text-slate-600 font-medium leading-relaxed break-words">{msg.message}</p>
                        </div>

                        {/* Moderation Actions (Delete option for Admin) */}
                        <button
                          onClick={async () => {
                            if (!confirm(`Hapus pesan silaturahmi dari ${msg.name}?`)) return;
                            try {
                              const { deleteDoc, doc } = await import('firebase/firestore');
                              const { db } = await import('../firebase');
                              await deleteDoc(doc(db, 'silaturahmi', msg.id));
                              
                              if (onUpdateSilaturahmiMessages) {
                                onUpdateSilaturahmiMessages(silaturahmiMessages.filter(m => m.id !== msg.id));
                              }
                              alert('Pesan berhasil dihapus dari cloud Firestore.');
                            } catch (error: any) {
                              console.error('Failed to delete silaturahmi message:', error);
                              // Local fallback
                              if (onUpdateSilaturahmiMessages) {
                                onUpdateSilaturahmiMessages(silaturahmiMessages.filter(m => m.id !== msg.id));
                              }
                            }
                          }}
                          className="p-1.5 bg-rose-50 hover:bg-rose-150 text-rose-600 rounded-lg transition-all cursor-pointer"
                          title="Hapus Pesan Silaturahmi"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {selectedInvoice && (
        <InvoiceModal
          transaction={selectedInvoice}
          onClose={() => setSelectedInvoice(null)}
          onAddSystemLog={onAddSystemLog}
          branding={branding}
        />
      )}
    </div>
  );
};
