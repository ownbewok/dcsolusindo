/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { CartItem, PaymentStatus, Transaction, PaymentMethodConfig, GithubUser, PromoCode } from '../types';
import { X, CreditCard, QrCode, Smartphone, Landmark as Bank, ArrowRight, ShieldCheck, CheckCircle2, Loader2, Sparkles, Copy, Calendar, ShieldAlert, Check, Upload, Paperclip, Image as ImageIcon, Percent, Tag } from 'lucide-react';

interface CheckoutModalProps {
  cart: CartItem[];
  paymentMethods: PaymentMethodConfig[];
  onClose: () => void;
  onPaymentSuccess: (transaction: Transaction) => void;
  githubUser?: GithubUser | null;
  promoCodes: PromoCode[];
}

export const CheckoutModal: React.FC<CheckoutModalProps> = ({
  cart,
  paymentMethods,
  onClose,
  onPaymentSuccess,
  githubUser,
  promoCodes,
}) => {
  const [buyerName, setBuyerName] = useState('');
  const [buyerEmail, setBuyerEmail] = useState('');
  const [buyerPhone, setBuyerPhone] = useState('');

  // Autofill name and email if logged in with GitHub
  useEffect(() => {
    if (githubUser) {
      if (!buyerName) {
        setBuyerName(githubUser.name || githubUser.login);
      }
      if (!buyerEmail) {
        setBuyerEmail(githubUser.email);
      }
    }
  }, [githubUser]);
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethodConfig | null>(null);
  
  // Checkout flow: 'info' (personal data & pick payment), 'payment' (show bill / transfer directions), 'confirm_form' (user enters sender bank & name), 'processing' (verifying load screen), 'success' (finished pending creation)
  const [checkoutStep, setCheckoutStep] = useState<'info' | 'payment' | 'confirm_form' | 'processing' | 'success'>('info');
  
  const [simulatedVA, setSimulatedVA] = useState('');
  const [copiedText, setCopiedText] = useState(false);
  const [countdown, setCountdown] = useState(300); // 5 minutes countdown
  const [isVerifying, setIsVerifying] = useState(false);

  // Payment Confirmation Form State
  const [senderBank, setSenderBank] = useState('');
  const [senderName, setSenderName] = useState('');
  const [senderNotes, setSenderNotes] = useState('');
  const [paymentProof, setPaymentProof] = useState('');
  const [paymentProofName, setPaymentProofName] = useState('');
  const [lastCreatedTrxId, setLastCreatedTrxId] = useState('');

  // Promo Code States
  const [promoCodeInput, setPromoCodeInput] = useState('');
  const [appliedPromo, setAppliedPromo] = useState<PromoCode | null>(null);
  const [promoError, setPromoError] = useState<string | null>(null);
  const [promoSuccessMsg, setPromoSuccessMsg] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      alert('Ukuran file terlalu besar. Maksimal 5MB.');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setPaymentProof(reader.result as string);
      setPaymentProofName(file.name);
    };
    reader.onerror = () => {
      alert('Gagal membaca file.');
    };
    reader.readAsDataURL(file);
  };

  const originalPrice = cart.reduce((sum, item) => sum + item.product.price * item.quantity, 0);

  const formattedPrice = (price: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0,
    }).format(price);
  };

  // Calculate discount
  let discountAmount = 0;
  if (appliedPromo) {
    if (appliedPromo.type === 'percentage') {
      discountAmount = Math.round((originalPrice * appliedPromo.value) / 100);
      if (appliedPromo.maxDiscount && discountAmount > appliedPromo.maxDiscount) {
        discountAmount = appliedPromo.maxDiscount;
      }
    } else if (appliedPromo.type === 'flat') {
      discountAmount = appliedPromo.value;
    }
    // Discount cannot exceed original price
    if (discountAmount > originalPrice) {
      discountAmount = originalPrice;
    }
  }
  const totalPrice = originalPrice - discountAmount;

  const handleApplyPromo = () => {
    setPromoError(null);
    setPromoSuccessMsg(null);
    const codeToTest = promoCodeInput.trim().toUpperCase();
    if (!codeToTest) {
      setPromoError('Masukkan kode promo terlebih dahulu.');
      return;
    }

    if (!promoCodes || promoCodes.length === 0) {
      setPromoError('Kode promo tidak valid atau tidak ditemukan.');
      return;
    }

    const promo = promoCodes.find(p => p.code.toUpperCase() === codeToTest);
    if (!promo) {
      setPromoError('Kode promo tidak valid atau tidak ditemukan.');
      return;
    }

    if (!promo.isActive) {
      setPromoError('Kode promo sudah tidak aktif.');
      return;
    }

    // Check expiry
    if (promo.expiryDate) {
      const expiry = new Date(promo.expiryDate);
      const today = new Date();
      expiry.setHours(23, 59, 59, 999);
      if (today > expiry) {
        setPromoError('Kode promo telah kedaluwarsa.');
        return;
      }
    }

    // Check usage limit
    if (promo.usageLimit !== undefined && promo.usageCount >= promo.usageLimit) {
      setPromoError('Kode promo telah mencapai batas penggunaan.');
      return;
    }

    // Check min purchase
    if (promo.minPurchase && originalPrice < promo.minPurchase) {
      setPromoError(`Minimal pembelian untuk menggunakan kode ini adalah ${formattedPrice(promo.minPurchase)}.`);
      return;
    }

    setAppliedPromo(promo);
    let calculatedDiscount = 0;
    if (promo.type === 'percentage') {
      calculatedDiscount = Math.round((originalPrice * promo.value) / 100);
      if (promo.maxDiscount && calculatedDiscount > promo.maxDiscount) {
        calculatedDiscount = promo.maxDiscount;
      }
    } else {
      calculatedDiscount = promo.value;
    }
    if (calculatedDiscount > originalPrice) {
      calculatedDiscount = originalPrice;
    }

    setPromoSuccessMsg(`✓ Kode "${promo.code}" berhasil diterapkan! Potongan ${formattedPrice(calculatedDiscount)}`);
  };

  const handleRemovePromo = () => {
    setAppliedPromo(null);
    setPromoCodeInput('');
    setPromoSuccessMsg(null);
    setPromoError(null);
  };

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (checkoutStep === 'payment' && countdown > 0) {
      timer = setInterval(() => {
        setCountdown((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [checkoutStep, countdown]);

  const handleSelectMethod = (method: PaymentMethodConfig) => {
    setSelectedMethod(method);
    if (method.icon === 'CreditCard' || method.id.includes('bca') || method.name.toLowerCase().includes('bca')) {
      const code = Math.floor(8000000000000000 + Math.random() * 1000000000000000).toString();
      setSimulatedVA(code);
    } else {
      setSimulatedVA(method.accountNumber || '80008973834369');
    }
    setCheckoutStep('payment');
  };

  const startCheckout = (e: React.FormEvent) => {
    e.preventDefault();
    if (!buyerName.trim() || !buyerEmail.trim() || !buyerPhone.trim()) return;
    
    // Auto populate sender name for convenience
    setSenderName(buyerName);
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(true);
    setTimeout(() => setCopiedText(false), 2000);
  };

  // Step 3: Trigger submission of transaction with status PENDING, and record details
  const submitPaymentConfirmation = (e: React.FormEvent) => {
    e.preventDefault();
    if (!senderBank.trim() || !senderName.trim()) {
      alert('Mohon isi nama bank pengirim dan nama pemilik rekening.');
      return;
    }

    setIsVerifying(true);
    setCheckoutStep('processing');

    setTimeout(() => {
      // Create transaction object in PENDING status
      const transactionItems = cart.flatMap((item) => {
        const pool = [...item.product.licenseKeysPool];
        const itemsList = [];
        
        for (let i = 0; i < item.quantity; i++) {
          let key = '';
          if (pool.length > 0) {
            const randIdx = Math.floor(Math.random() * pool.length);
            key = pool.splice(randIdx, 1)[0];
          } else {
            key = `LIC-${item.product.id.toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}-${i + 1}`;
          }

          const pass = 'DEC-' + Math.random().toString(36).substring(2, 6).toUpperCase();

          itemsList.push({
            productId: item.product.id,
            productName: item.product.name,
            price: item.product.price,
            licenseKey: key, // Delivered but locked!
            fileUrl: item.product.fileUrl,
            fileSize: item.product.fileSize,
            decryptPassword: pass,
          });
        }
        
        return itemsList;
      });

      const trxId = 'TRX-' + Math.floor(100000 + Math.random() * 900000);
      setLastCreatedTrxId(trxId);

      const transaction: Transaction = {
        id: trxId,
        buyerName,
        buyerEmail,
        buyerPhone,
        items: transactionItems,
        totalPrice,
        originalPrice,
        promoCodeUsed: appliedPromo ? appliedPromo.code : undefined,
        discountAmount: discountAmount > 0 ? discountAmount : undefined,
        paymentMethod: selectedMethod?.name || 'Transfer Manual',
        paymentStatus: PaymentStatus.VERIFYING, // "Sedang Diverifikasi"
        createdAt: new Date().toISOString(),
        fileDownloaded: false,
        emailSent: false, // Will be sent only when admin approves (LUNAS)
        senderBank,
        senderName,
        senderNotes,
        paymentProof: paymentProof || undefined,
      };

      onPaymentSuccess(transaction);
      setIsVerifying(false);
      setCheckoutStep('success');
    }, 2000);
  };

  const formatCountdown = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  // Helper to get corresponding icon
  const getMethodIcon = (iconName: string) => {
    switch (iconName) {
      case 'CreditCard':
        return <CreditCard className="w-4 h-4" />;
      case 'QrCode':
        return <QrCode className="w-4 h-4" />;
      case 'Smartphone':
        return <Smartphone className="w-4 h-4" />;
      default:
        return <Bank className="w-4 h-4" />;
    }
  };

  const activeMethods = paymentMethods.filter(m => m.isActive);

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4" id="checkout-modal">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-slate-900/65 backdrop-blur-xs transition-opacity" onClick={onClose}></div>

      <div className="relative transform overflow-hidden rounded-3xl bg-white text-left shadow-2xl transition-all w-full max-w-lg max-h-[92vh] flex flex-col z-10 border border-slate-100">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4 shrink-0 bg-slate-50/50">
          <h3 className="text-xs font-black uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-rose-500 animate-pulse" /> Checkout & Konfirmasi Pembayaran
          </h3>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-150 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Stepper progress indicator */}
        <div className="bg-slate-50 border-b border-slate-100 px-6 py-3 flex items-center justify-between text-[10px] font-black uppercase tracking-wider text-slate-400">
          <span className={`${checkoutStep === 'info' ? 'text-sky-600 font-bold' : 'text-slate-500'}`}>1. Data Diri</span>
          <span className="text-slate-300">/</span>
          <span className={`${checkoutStep === 'payment' ? 'text-sky-600 font-bold' : 'text-slate-500'}`}>2. Bayar</span>
          <span className="text-slate-300">/</span>
          <span className={`${checkoutStep === 'confirm_form' ? 'text-sky-600 font-bold' : 'text-slate-500'}`}>3. Konfirmasi</span>
          <span className="text-slate-300">/</span>
          <span className={`${checkoutStep === 'success' ? 'text-rose-600 font-bold' : 'text-slate-500'}`}>4. Selesai</span>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto flex-1">
          
          {/* STEP 1: Buyer Information Form & Payment Method Select */}
          {checkoutStep === 'info' && (
            <form onSubmit={startCheckout} className="space-y-4">
              <div className="bg-sky-50 rounded-xl p-4 border border-sky-100/50">
                <div className="text-[10px] font-black uppercase tracking-wider text-sky-800 mb-1">Informasi Pengiriman</div>
                <p className="text-[10px] text-sky-700 leading-normal">
                  Semua transaksi berstatus <strong className="font-bold">PENDING</strong> secara default. Anda wajib melakukan konfirmasi setelah transfer agar admin dapat merilis kunci lisensi di brankas digital Anda.
                </p>
              </div>

              <div className="space-y-3.5">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Nama Lengkap</label>
                  <input
                    type="text"
                    placeholder="Contoh: Budi Santoso"
                    value={buyerName}
                    onChange={(e) => setBuyerName(e.target.value)}
                    className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 focus:bg-white focus:outline-hidden focus:ring-1 focus:ring-sky-500 font-semibold text-slate-800"
                    required
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Alamat Email Aktif</label>
                    <input
                      type="email"
                      placeholder="Contoh: budi@gmail.com"
                      value={buyerEmail}
                      onChange={(e) => setBuyerEmail(e.target.value)}
                      className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 focus:bg-white focus:outline-hidden focus:ring-1 focus:ring-sky-500 font-semibold text-slate-800"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">No. Handphone / WhatsApp</label>
                    <input
                      type="tel"
                      placeholder="Contoh: 081234567890"
                      value={buyerPhone}
                      onChange={(e) => setBuyerPhone(e.target.value)}
                      className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 focus:bg-white focus:outline-hidden focus:ring-1 focus:ring-sky-500 font-semibold text-slate-800"
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Promo Code Input section */}
              <div className="border-t border-slate-100 pt-4 mt-4">
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Punya Kode Promo / Voucher?</label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <input
                      type="text"
                      disabled={!!appliedPromo}
                      placeholder="Masukkan kode promo (e.g. PROMO10)"
                      value={promoCodeInput}
                      onChange={(e) => setPromoCodeInput(e.target.value.toUpperCase().replace(/\s+/g, ''))}
                      className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 focus:bg-white focus:outline-hidden focus:ring-1 focus:ring-sky-500 font-extrabold uppercase tracking-wider text-slate-800 disabled:opacity-60"
                    />
                    {appliedPromo && (
                      <span className="absolute right-3 top-2.5 text-emerald-600">
                        <Check className="w-5 h-5 stroke-[3]" />
                      </span>
                    )}
                  </div>
                  {appliedPromo ? (
                    <button
                      type="button"
                      onClick={handleRemovePromo}
                      className="px-4 py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-700 hover:text-rose-800 text-xs font-bold rounded-xl transition-colors cursor-pointer border border-rose-100"
                    >
                      Hapus
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={handleApplyPromo}
                      className="px-4 py-2.5 bg-slate-900 hover:bg-sky-600 text-white text-xs font-bold rounded-xl transition-all cursor-pointer"
                    >
                      Terapkan
                    </button>
                  )}
                </div>

                {promoError && (
                  <p className="text-[10px] text-rose-600 font-bold mt-1.5">
                    ⚠️ {promoError}
                  </p>
                )}

                {promoSuccessMsg && (
                  <p className="text-[10px] text-emerald-600 font-bold mt-1.5">
                    {promoSuccessMsg}
                  </p>
                )}
              </div>

              <div className="border-t border-slate-100 pt-4 mt-4 space-y-2">
                <div className="flex justify-between items-center text-xs font-semibold text-slate-500">
                  <span>Subtotal</span>
                  <span>{formattedPrice(originalPrice)}</span>
                </div>

                {discountAmount > 0 && (
                  <div className="flex justify-between items-center text-xs font-semibold text-emerald-600">
                    <span className="flex items-center gap-1">
                      <Tag className="w-3.5 h-3.5" /> Diskon ({appliedPromo?.code})
                    </span>
                    <span>-{formattedPrice(discountAmount)}</span>
                  </div>
                )}

                <div className="flex justify-between items-center border-t border-slate-50 pt-2 text-xs font-semibold">
                  <span className="text-slate-700">Total Pembelian</span>
                  <span className="text-slate-900 font-extrabold text-sm">{formattedPrice(totalPrice)}</span>
                </div>
              </div>

              <div className="border-t border-slate-100 pt-4 mt-4">

                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-2.5">Pilih Rekening Menu Pembayaran</h4>
                <div className="grid grid-cols-1 gap-2 max-h-[220px] overflow-y-auto pr-1">
                  {activeMethods.length > 0 ? (
                    activeMethods.map((method) => (
                      <button
                        key={method.id}
                        type="button"
                        disabled={!buyerName.trim() || !buyerEmail.trim() || !buyerPhone.trim()}
                        onClick={() => handleSelectMethod(method)}
                        className="flex items-center justify-between p-3.5 bg-white border border-slate-100 hover:border-sky-500 rounded-xl hover:bg-sky-50/10 text-left transition-all cursor-pointer group disabled:opacity-50"
                      >
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-slate-100 text-slate-600 rounded-lg group-hover:bg-sky-50 group-hover:text-sky-600 transition-colors">
                            {getMethodIcon(method.icon)}
                          </div>
                          <div>
                            <div className="text-xs font-bold text-slate-800">{method.name}</div>
                            <div className="text-[10px] text-slate-400">{method.description}</div>
                          </div>
                        </div>
                        <ArrowRight className="w-4 h-4 text-slate-300 group-hover:translate-x-1 transition-transform" />
                      </button>
                    ))
                  ) : (
                    <div className="text-center py-4 text-xs text-slate-400">
                      Tidak ada metode pembayaran aktif. Silakan hubungi admin.
                    </div>
                  )}
                </div>
              </div>
            </form>
          )}

          {/* STEP 2: Bill Display / Payment details */}
          {checkoutStep === 'payment' && selectedMethod && (
            <div className="space-y-4 text-center">
              <div className="bg-slate-50 border border-slate-100 p-4 rounded-xl flex items-center justify-between text-left">
                <div>
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Total Tagihan</span>
                  <h4 className="text-base font-black text-slate-900 mt-0.5">{formattedPrice(totalPrice)}</h4>
                </div>
                <div className="bg-slate-200/50 px-2.5 py-1 rounded-lg text-slate-700 text-[9px] font-bold uppercase tracking-wider">
                  {selectedMethod.name}
                </div>
              </div>

              {selectedMethod.icon === 'QrCode' ? (
                <div className="mx-auto w-40 p-4 bg-white border border-slate-100 rounded-2xl shadow-xs space-y-2 relative">
                  <div className="w-full aspect-square bg-slate-950 flex flex-col items-center justify-center rounded-xl p-1.5 text-white">
                    <svg className="w-full h-full text-white" viewBox="0 0 100 100" fill="currentColor">
                      <path d="M5 5h30v30H5V5zm4 4v22h22V9H9zM5 65h30v30H5V65zm4 4v22h22V69H9zM65 5h30v30H65V5zm4 4v22h22V9H69zM50 20h5v10h-5zm0 25h10v5H50zm15 15h5v5h-5zm10-5h10v10H75zm-10 15h15v5H65zm-15 5h5v5h-5zm0-20h5v10h-5zm10 5h5v5h-5zm10 10h10v5H75zM50 50v5h5v-5zm20 5v5h5v-5zm-5 10v5h5v-5zm-15 15v5h5v-5z" />
                    </svg>
                  </div>
                  <div className="text-[8px] font-bold text-slate-400 uppercase tracking-widest text-center mt-1">
                    {selectedMethod.accountNumber}
                  </div>
                </div>
              ) : (
                <div className="bg-white border border-slate-100 rounded-xl p-4 text-left space-y-3">
                  <div>
                    <span className="text-[9px] text-slate-400 uppercase font-bold tracking-wider">No. Rekening / VA Tujuan</span>
                    <div className="flex items-center justify-between gap-2 mt-1">
                      <span className="font-mono text-sm font-bold text-slate-800 tracking-wider">
                        {simulatedVA}
                      </span>
                      <button
                        onClick={() => handleCopy(simulatedVA)}
                        className="p-1.5 hover:bg-slate-100 rounded-md text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
                      >
                        <Copy className="w-4 h-4" />
                      </button>
                    </div>
                    {copiedText && <span className="text-[8px] text-emerald-600 font-bold">Berhasil disalin!</span>}
                  </div>

                  <div className="grid grid-cols-2 gap-2 border-t border-slate-100 pt-2.5">
                    <div>
                      <span className="text-[8px] text-slate-400 font-bold uppercase tracking-wider block">Atas Nama Rekening</span>
                      <span className="text-xs font-bold text-slate-700">{selectedMethod.accountName}</span>
                    </div>
                    <div>
                      <span className="text-[8px] text-slate-400 font-bold uppercase tracking-wider block">Batas Waktu Bayar</span>
                      <span className="text-xs font-bold text-rose-600">{formatCountdown(countdown)}</span>
                    </div>
                  </div>

                  <div className="border-t border-slate-100 pt-3">
                    <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Langkah-langkah Pembayaran</span>
                    <p className="text-[10px] text-slate-500 leading-relaxed mt-1">
                      {selectedMethod.instructions}
                    </p>
                  </div>
                </div>
              )}

              <div className="bg-amber-50 rounded-xl p-3.5 border border-amber-100 text-left">
                <p className="text-[10px] text-amber-800 font-black flex items-center gap-1.5 uppercase tracking-wide">
                  <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0" />
                  Konfirmasi Pembayaran Wajib
                </p>
                <p className="text-[9px] text-amber-700 leading-normal mt-1">
                  Pesanan Anda akan tetap berstatus <strong className="font-bold">PENDING</strong> sampai Anda mengirim bukti transfer menggunakan tombol di bawah ini, lalu Admin menyetujuinya.
                </p>
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setCheckoutStep('info')}
                  className="px-4 py-3 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold text-xs rounded-xl transition-colors cursor-pointer"
                >
                  Kembali
                </button>
                <button
                  onClick={() => setCheckoutStep('confirm_form')}
                  className="flex-1 py-3 bg-slate-900 hover:bg-sky-600 text-white font-extrabold text-xs rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-sm shadow-slate-900/10"
                >
                  Saya Sudah Bayar, Lanjut Konfirmasi <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: Form Inputs for payment sender details */}
          {checkoutStep === 'confirm_form' && (
            <form onSubmit={submitPaymentConfirmation} className="space-y-4">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-[10px] text-slate-600 leading-normal">
                ✍️ <span className="font-bold">Formulir Konfirmasi:</span> Masukkan detail rekening pengirim Anda untuk mempermudah admin mencocokkan mutasi bank secara manual.
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Bank Pengirim Anda <span className="text-rose-500">*</span></label>
                  <input
                    type="text"
                    placeholder="Contoh: Bank BCA, Mandiri, OVO"
                    value={senderBank}
                    onChange={(e) => setSenderBank(e.target.value)}
                    className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 focus:bg-white focus:outline-hidden focus:ring-1 focus:ring-sky-500 font-medium text-slate-800"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Nama Pemilik Rekening <span className="text-rose-500">*</span></label>
                  <input
                    type="text"
                    placeholder="Nama di buku tabungan"
                    value={senderName}
                    onChange={(e) => setSenderName(e.target.value)}
                    className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 focus:bg-white focus:outline-hidden focus:ring-1 focus:ring-sky-500 font-medium text-slate-800"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Rincian / Catatan Transfer (Opsional)</label>
                <textarea
                  placeholder="Misal: Nomor HP pengirim, nominal transfer unik, atau jam transfer..."
                  value={senderNotes}
                  onChange={(e) => setSenderNotes(e.target.value)}
                  rows={2}
                  className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl p-3.5 focus:bg-white focus:outline-hidden focus:ring-1 focus:ring-sky-500 font-medium"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5 flex items-center justify-between">
                  <span>Lampirkan Bukti Pembayaran (Opsional)</span>
                  <span className="text-slate-400 font-normal normal-case">Maks 5MB</span>
                </label>
                
                {paymentProof ? (
                  <div className="flex items-center justify-between bg-emerald-50 border border-emerald-100 rounded-xl p-3">
                    <div className="flex items-center gap-2.5 min-w-0">
                      {paymentProof.startsWith('data:image/') ? (
                        <img
                          src={paymentProof}
                          alt="Preview bukti"
                          className="w-10 h-10 object-cover rounded-lg border border-emerald-200/50 shrink-0"
                        />
                      ) : (
                        <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center shrink-0">
                          <Paperclip className="w-4 h-4 text-emerald-600" />
                        </div>
                      )}
                      <div className="text-left min-w-0">
                        <div className="text-xs font-bold text-emerald-800 truncate" title={paymentProofName}>
                          {paymentProofName}
                        </div>
                        <div className="text-[9px] text-emerald-600 font-semibold uppercase tracking-wide">
                          Siap dikirim
                        </div>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setPaymentProof('');
                        setPaymentProofName('');
                      }}
                      className="px-2.5 py-1 text-[10px] font-bold text-rose-600 hover:text-white hover:bg-rose-600 rounded-lg transition-all cursor-pointer border border-rose-200 hover:border-transparent"
                    >
                      Hapus
                    </button>
                  </div>
                ) : (
                  <label className="flex flex-col items-center justify-center border border-dashed border-slate-200 rounded-xl p-4 bg-slate-50/50 hover:bg-slate-50 hover:border-slate-300 transition-colors cursor-pointer group">
                    <input
                      type="file"
                      accept="image/*,application/pdf"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                    <Upload className="w-5 h-5 text-slate-400 group-hover:text-sky-500 transition-colors mb-1.5" />
                    <span className="text-xs font-bold text-slate-700 group-hover:text-sky-600 transition-colors">
                      Pilih Foto / File Bukti
                    </span>
                    <span className="text-[9px] text-slate-400 mt-0.5">
                      Klik untuk telusuri media (JPG, PNG, PDF)
                    </span>
                  </label>
                )}
              </div>

              <div className="bg-rose-50 border border-rose-100 rounded-xl p-3">
                <p className="text-[10px] text-rose-700 leading-normal flex items-start gap-1.5">
                  ⚠️ <span className="font-bold">Perhatian:</span> Transaksi akan diproses Admin dalam waktu maksimal 5-10 menit setelah konfirmasi dikirim. Tautan download brankas akan aktif setelah lunas.
                </p>
              </div>

              <div className="flex gap-2.5 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setCheckoutStep('payment')}
                  className="px-4 py-3 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold text-xs rounded-xl transition-colors cursor-pointer"
                >
                  Kembali
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-xs rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-sm shadow-rose-600/10"
                >
                  <Check className="w-4 h-4" /> Kirim Bukti Konfirmasi Sekarang
                </button>
              </div>
            </form>
          )}

          {/* STEP 4: Loader Screen */}
          {checkoutStep === 'processing' && (
            <div className="text-center py-10 space-y-4 animate-fadeIn">
              <Loader2 className="w-10 h-10 text-rose-500 animate-spin mx-auto" />
              <div>
                <h4 className="text-xs font-black uppercase tracking-wider text-slate-800">Mengirim Data Konfirmasi...</h4>
                <p className="text-[10px] text-slate-400 mt-1 max-w-xs mx-auto">
                  Menyimpan log transaksi, mengunci token lisensi Anda, serta mendaftarkan pesanan ke sistem antrean verifikasi manual admin...
                </p>
              </div>
            </div>
          )}

          {/* STEP 5: Success Result Screen */}
          {checkoutStep === 'success' && (
            <div className="text-center py-6 space-y-5 animate-fadeIn">
              <div className="w-14 h-14 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto border border-emerald-100">
                <CheckCircle2 className="w-7 h-7" />
              </div>

              <div>
                <h4 className="text-sm font-black uppercase tracking-wide text-slate-900">Konfirmasi Pembayaran Dikirim!</h4>
                <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto leading-relaxed">
                  Terima kasih, <strong>{buyerName}</strong>! Tagihan pesanan Anda sebesar <strong>{formattedPrice(totalPrice)}</strong> telah terdaftar dengan ID: <strong className="font-mono text-slate-800">{lastCreatedTrxId}</strong>.
                </p>
              </div>

              <div className="bg-amber-50/75 rounded-xl p-4 border border-amber-200/50 text-left space-y-3">
                <div className="text-[10px] font-black uppercase tracking-wider text-amber-800 flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-amber-500 shrink-0" />
                  Status: Menunggu Verifikasi Admin
                </div>
                <ul className="text-[10px] text-slate-600 space-y-1.5 list-disc list-inside leading-normal">
                  <li>Laporan transfer dari <strong>{senderBank} ({senderName})</strong> sudah masuk antrean admin.</li>
                  <li>Lisensi digital <strong className="font-semibold text-rose-600">telah terbit dalam keadaan terkunci</strong> di brankas digital Anda.</li>
                  <li>Admin akan memverifikasi mutasi. Begitu disetujui, lisensi akan dapat didekripsi seketika.</li>
                </ul>
              </div>

              <div className="pt-2">
                <button
                  onClick={onClose}
                  className="w-full py-3 bg-slate-950 hover:bg-sky-600 text-white font-extrabold text-xs rounded-xl transition-all cursor-pointer shadow-sm"
                >
                  Buka Brankas & Periksa Status Lisensi
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
