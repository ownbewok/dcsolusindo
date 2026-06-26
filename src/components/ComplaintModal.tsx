/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Complaint, ShopBranding } from '../types';
import { 
  MessageSquare, 
  Send, 
  X, 
  CheckCircle2, 
  AlertCircle, 
  Mail, 
  User, 
  FileText, 
  Download, 
  Key, 
  CreditCard, 
  Lock, 
  HelpCircle, 
  Sparkles, 
  History,
  Copy,
  Check,
  ShieldCheck,
  Clock,
  Phone,
  MessageCircle
} from 'lucide-react';

interface ComplaintModalProps {
  isOpen?: boolean;
  onClose: () => void;
  onSubmitComplaint: (complaint: Omit<Complaint, 'id' | 'status' | 'createdAt'>) => void;
  transactions?: any[];
  branding?: ShopBranding;
}

export const ComplaintModal: React.FC<ComplaintModalProps> = ({
  isOpen = true,
  onClose,
  onSubmitComplaint,
  transactions = [],
  branding,
}) => {
  // Form states
  const rawWaNum = branding?.whatsappNumber || '6282288882512';
  const waLinkNum = rawWaNum.replace(/[^0-9]/g, '');
  const displayWaNum = rawWaNum.startsWith('62') 
    ? `+${rawWaNum.slice(0, 2)} ${rawWaNum.slice(2, 5)}-${rawWaNum.slice(5, 9)}-${rawWaNum.slice(9)}`
    : rawWaNum.startsWith('08')
    ? `+62 ${rawWaNum.slice(1, 4)}-${rawWaNum.slice(4, 8)}-${rawWaNum.slice(8)}`
    : rawWaNum;

  const [buyerName, setBuyerName] = useState('');
  const [buyerEmail, setBuyerEmail] = useState('');
  const [transactionId, setTransactionId] = useState('');
  const [category, setCategory] = useState<Complaint['category']>('Lisensi Tidak Valid');
  const [message, setMessage] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);
  const [copied, setCopied] = useState(false);
  const [generatedTicketId, setGeneratedTicketId] = useState('');

  // Suggested transactions matching email
  const [matchedTransactions, setMatchedTransactions] = useState<any[]>([]);
  const [showTransactionSuggestions, setShowTransactionSuggestions] = useState(false);

  // Auto look-up matching transactions when email changes
  useEffect(() => {
    if (buyerEmail.trim() && transactions.length > 0) {
      const emailLower = buyerEmail.toLowerCase().trim();
      const matched = transactions.filter(t => 
        t.buyerEmail?.toLowerCase() === emailLower || 
        t.email?.toLowerCase() === emailLower
      ).slice(0, 3); // show top 3 recent
      setMatchedTransactions(matched);
    } else {
      setMatchedTransactions([]);
    }
  }, [buyerEmail, transactions]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!buyerName.trim() || !buyerEmail.trim() || !message.trim()) {
      alert('Mohon lengkapi semua field yang wajib diisi.');
      return;
    }

    const randomTicketSuffix = Math.floor(1000 + Math.random() * 9000);
    const ticketId = `TCKT-${Date.now().toString().slice(-6)}-${randomTicketSuffix}`;
    setGeneratedTicketId(ticketId);

    onSubmitComplaint({
      buyerName,
      buyerEmail,
      transactionId: transactionId.trim() || undefined,
      category,
      message,
    });

    setIsSuccess(true);
  };

  const handleCopyTicket = () => {
    navigator.clipboard.writeText(generatedTicketId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleResetForm = () => {
    setBuyerName('');
    setBuyerEmail('');
    setTransactionId('');
    setCategory('Lisensi Tidak Valid');
    setMessage('');
    setIsSuccess(false);
    onClose();
  };

  // Category definitions for manual form cards
  const categoriesList: {
    id: Complaint['category'];
    title: string;
    description: string;
    icon: React.ReactNode;
    color: string;
    bgColor: string;
    borderColor: string;
  }[] = [
    {
      id: 'Gagal Download',
      title: 'Gagal Download',
      description: 'Link download rusak, macet, atau kadaluarsa.',
      icon: <Download className="w-4 h-4" />,
      color: 'text-indigo-600',
      bgColor: 'bg-indigo-50/50',
      borderColor: 'border-indigo-100'
    },
    {
      id: 'Lisensi Tidak Valid',
      title: 'Lisensi Tidak Valid',
      description: 'Serial key tidak dapat digunakan/diaktivasi.',
      icon: <Key className="w-4 h-4" />,
      color: 'text-rose-600',
      bgColor: 'bg-rose-50/50',
      borderColor: 'border-rose-100'
    },
    {
      id: 'Masalah Pembayaran',
      title: 'Masalah Pembayaran',
      description: 'Status billing belum verifikasi setelah transfer.',
      icon: <CreditCard className="w-4 h-4" />,
      color: 'text-amber-600',
      bgColor: 'bg-amber-50/50',
      borderColor: 'border-amber-100'
    },
    {
      id: 'Sandi Dekripsi Salah',
      title: 'Sandi Enkripsi Salah',
      description: 'Password zip/rar vault tidak cocok atau error.',
      icon: <Lock className="w-4 h-4" />,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50/50',
      borderColor: 'border-purple-100'
    },
    {
      id: 'Lainnya',
      title: 'Lainnya',
      description: 'Pertanyaan teknis umum atau kendala kustom.',
      icon: <HelpCircle className="w-4 h-4" />,
      color: 'text-slate-600',
      bgColor: 'bg-slate-50',
      borderColor: 'border-slate-200/80'
    }
  ];

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-md animate-fadeIn" id="complaint-modal-overlay">
      <div className="relative bg-white w-full max-w-2xl rounded-3xl overflow-hidden shadow-2xl border border-slate-100 flex flex-col max-h-[92vh]">
        
        {/* Modern Header Banner */}
        <div className="bg-gradient-to-r from-slate-900 via-slate-850 to-slate-900 text-white px-5 py-4 flex items-center justify-between border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-rose-500/15 text-rose-400 rounded-xl border border-rose-500/20">
              <MessageSquare className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-xs font-black uppercase tracking-wider">Layanan Tiket Pengaduan</h3>
                <span className="flex items-center gap-1 px-1.5 py-0.5 bg-emerald-500/20 text-[9px] text-emerald-400 rounded-md font-bold uppercase tracking-wider">
                  <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-ping"></span>
                  Layanan Aktif
                </span>
              </div>
              <p className="text-[10px] text-slate-400 font-medium">Bantuan cepat untuk menangani kendala lisensi & transaksi digital Anda</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 bg-slate-800/80 hover:bg-slate-700 rounded-xl text-slate-400 hover:text-white transition-all cursor-pointer"
            id="close-complaint-btn"
          >
            <X className="w-4.5 h-4.5" />
          </button>
        </div>

        {/* Form Body Scrollable Area */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-4 bg-slate-50/50">
          {isSuccess ? (
            /* Success Tracking Dashboard with Process Timeline */
            <div className="text-center py-6 space-y-6 animate-fadeIn">
              <div className="w-20 h-20 bg-emerald-50/70 text-emerald-500 rounded-3xl flex items-center justify-center mx-auto border border-emerald-100 shadow-md">
                <CheckCircle2 className="w-10 h-10" />
              </div>
              
              <div className="space-y-2">
                <h4 className="text-lg font-extrabold text-slate-900 tracking-tight">Tiket Pengaduan Berhasil Terkirim</h4>
                <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
                  Tim bantuan teknis kami telah menerima tiket Anda dan akan memverifikasi rincian kendala Anda secepat mungkin.
                </p>
              </div>

              {/* Unique Ticket visual card with Copy option */}
              <div className="max-w-md mx-auto bg-white border border-slate-200 rounded-2xl p-4 flex items-center justify-between gap-4 shadow-3xs">
                <div className="text-left space-y-0.5">
                  <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">ID Pelacakan Tiket</span>
                  <div className="text-xs font-mono font-black text-slate-700 tracking-wide flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                    {generatedTicketId || 'TCKT-WAITING-99'}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleCopyTicket}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-[11px] font-extrabold transition-all cursor-pointer ${
                    copied 
                      ? 'bg-emerald-50 text-emerald-600 border-emerald-200' 
                      : 'bg-white text-slate-600 hover:text-slate-850 hover:bg-slate-50 border-slate-200 shadow-3xs'
                  }`}
                >
                  {copied ? (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      Tersalin!
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      Salin Kode
                    </>
                  )}
                </button>
              </div>

              {/* 3-Step Interactive Complaint Timeline */}
              <div className="max-w-md mx-auto pt-2">
                <div className="text-left mb-3">
                  <h5 className="text-[10px] font-black uppercase text-slate-500 tracking-wider">Alur Kerja Penyelesaian</h5>
                </div>
                <div className="grid grid-cols-3 gap-2 text-left relative">
                  <div className="bg-white border border-slate-200 rounded-xl p-3 space-y-1 shadow-3xs">
                    <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                    <p className="text-[10px] font-black text-slate-800">1. Terkirim</p>
                    <p className="text-[9px] text-slate-400 leading-tight">Laporan terdaftar di sistem admin</p>
                  </div>
                  <div className="bg-amber-50/40 border border-amber-150 rounded-xl p-3 space-y-1 relative shadow-3xs">
                    <div className="w-2 h-2 bg-amber-500 rounded-full animate-bounce"></div>
                    <p className="text-[10px] font-black text-amber-850">2. Proses</p>
                    <p className="text-[9px] text-amber-600 leading-tight">Verifikasi bukti & kunci lisensi</p>
                  </div>
                  <div className="bg-white border border-slate-150 rounded-xl p-3 space-y-1 shadow-3xs">
                    <div className="w-2 h-2 bg-slate-300 rounded-full"></div>
                    <p className="text-[10px] font-black text-slate-500">3. Solusi</p>
                    <p className="text-[9px] text-slate-400 leading-tight">Pengiriman key baru atau solusi via email</p>
                  </div>
                </div>
              </div>

              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 text-left text-[11px] text-slate-600 leading-relaxed max-w-md mx-auto space-y-2.5">
                <div>
                  💡 <span className="font-bold">Saran:</span> Harap simpan atau salin ID Pelacakan Tiket Anda di atas. Anda dapat memeriksa status balasan kapan saja atau menghubungi admin langsung melalui Telegram / Email resmi platform.
                </div>
                <div className="pt-2 border-t border-slate-200 flex items-center justify-between gap-2 text-[10px]">
                  <span className="font-bold text-slate-500 flex items-center gap-1">
                    <MessageCircle className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                    Butuh respon instan?
                  </span>
                  <a
                    href={`https://wa.me/${waLinkNum}?text=Halo%20Admin%20${encodeURIComponent(branding?.name || 'DigiMarket')},%20saya%20ingin%20follow%20up%20tiket%20saya%20dengan%20ID%20transaksi%20tertentu.`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-emerald-600 hover:text-emerald-700 font-extrabold cursor-pointer"
                  >
                    Hubungi WhatsApp Admin →
                  </a>
                </div>
              </div>
              
              <div className="pt-2">
                <button
                  onClick={handleResetForm}
                  className="px-8 py-3 bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-xs rounded-xl transition-all shadow-md cursor-pointer"
                >
                  Kembali ke Beranda
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4 animate-fadeIn">
              
              {/* Alert Guidelines with elegant warning color */}
              <div className="p-4 bg-rose-50/50 border border-rose-100 rounded-2xl flex items-start gap-3 shadow-3xs">
                <AlertCircle className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
                <div className="space-y-0.5">
                  <h4 className="text-[11px] font-black text-rose-900 uppercase tracking-wider">Garansi Solusi 100%</h4>
                  <p className="text-[10px] text-rose-750 leading-relaxed">
                    Kami berkomitmen penuh membantu setiap kendala transaksi Anda. Segala pengaduan mengenai kegagalan aktivasi lisensi digital, pembayaran pending, atau link download rusak akan ditangani secepatnya.
                  </p>
                </div>
              </div>

              {/* WhatsApp Live Support Contact Card */}
              <div className="p-4 bg-emerald-50/50 border border-emerald-100 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-3xs">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-emerald-500/10 text-emerald-600 rounded-xl border border-emerald-500/20">
                    <Phone className="w-4.5 h-4.5" />
                  </div>
                  <div className="space-y-0.5">
                    <h4 className="text-[11px] font-black text-emerald-900 uppercase tracking-wider flex items-center gap-1.5">
                      Hubungi CS via WhatsApp
                      <span className="px-1.5 py-0.5 bg-emerald-500 text-white text-[8px] font-extrabold uppercase rounded-full animate-pulse">Fast Respon</span>
                    </h4>
                    <p className="text-[10px] text-emerald-700 font-medium">
                      Bicara langsung dengan Customer Service di nomor <span className="font-extrabold font-mono text-[11px] text-emerald-900">{displayWaNum}</span>
                    </p>
                  </div>
                </div>
                <a
                  href={`https://wa.me/${waLinkNum}?text=Halo%20Admin%20${encodeURIComponent(branding?.name || 'DigiMarket')},%20saya%20butuh%20bantuan%20terkait%20transaksi%20produk%20digital.`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full sm:w-auto text-center flex items-center justify-center gap-1 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs rounded-xl transition-all shadow-sm cursor-pointer whitespace-nowrap"
                >
                  Chat WhatsApp →
                </a>
              </div>

              {/* Row 1: Buyer Info */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-extrabold text-slate-500 uppercase tracking-wider mb-1.5">Nama Pelapor <span className="text-rose-500">*</span></label>
                  <div className="relative">
                    <User className="absolute left-3 top-3.5 w-4 h-4 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Masukkan nama lengkap Anda"
                      value={buyerName}
                      onChange={(e) => setBuyerName(e.target.value)}
                      className="w-full text-xs bg-white border border-slate-200 rounded-xl pl-10 pr-4 py-3 focus:outline-hidden focus:ring-1 focus:ring-rose-500 font-medium transition-all shadow-3xs"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-extrabold text-slate-500 uppercase tracking-wider mb-1.5">Alamat Email Pembelian <span className="text-rose-500">*</span></label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3.5 w-4 h-4 text-slate-400" />
                    <input
                      type="email"
                      placeholder="Email saat checkout produk"
                      value={buyerEmail}
                      onChange={(e) => setBuyerEmail(e.target.value)}
                      className="w-full text-xs bg-white border border-slate-200 rounded-xl pl-10 pr-4 py-3 focus:outline-hidden focus:ring-1 focus:ring-rose-500 font-medium transition-all shadow-3xs"
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Row 2: Transaction ID lookup & selector */}
              <div>
                <label className="block text-[10px] font-extrabold text-slate-500 uppercase tracking-wider mb-1.5 flex items-center justify-between">
                  <span>ID Transaksi / Nomor Invoice</span>
                  <span className="text-[9px] text-slate-400 lowercase italic font-normal">Opsional, mempercepat bantuan</span>
                </label>
                
                <div className="relative">
                  <FileText className="absolute left-3 top-3.5 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Contoh: TRX-20260625-XXXX"
                    value={transactionId}
                    onChange={(e) => setTransactionId(e.target.value.toUpperCase())}
                    onFocus={() => setShowTransactionSuggestions(true)}
                    className="w-full text-xs bg-white border border-slate-200 rounded-xl pl-10 pr-4 py-3 focus:outline-hidden focus:ring-1 focus:ring-rose-500 font-mono font-bold uppercase transition-all shadow-3xs placeholder:font-sans placeholder:font-normal placeholder:normal-case"
                  />
                </div>

                {/* Intelligent matched transactions suggestion card */}
                {buyerEmail && matchedTransactions.length > 0 && showTransactionSuggestions && (
                  <div className="mt-2 bg-white border border-slate-200 rounded-2xl p-3 space-y-2 animate-fadeIn relative shadow-3xs">
                    <div className="flex items-center justify-between">
                      <p className="text-[9px] font-black text-slate-500 uppercase tracking-wider flex items-center gap-1">
                        <History className="w-3 h-3 text-rose-500" />
                        Transaksi Terkait Email Ini ({matchedTransactions.length})
                      </p>
                      <button 
                        type="button" 
                        onClick={() => setShowTransactionSuggestions(false)}
                        className="text-[9px] font-extrabold text-slate-400 hover:text-slate-600 uppercase"
                      >
                        Tutup
                      </button>
                    </div>
                    
                    <div className="grid grid-cols-1 gap-1.5">
                      {matchedTransactions.map((tx) => (
                        <button
                          key={tx.id}
                          type="button"
                          onClick={() => {
                            setTransactionId(tx.id);
                            setShowTransactionSuggestions(false);
                            // Auto fill name if missing
                            if (!buyerName && tx.buyerName) {
                              setBuyerName(tx.buyerName);
                            }
                          }}
                          className="flex items-center justify-between p-2 bg-slate-50 hover:bg-rose-50/40 border border-slate-150 hover:border-rose-150 rounded-xl text-left transition-all cursor-pointer group"
                        >
                          <div className="space-y-0.5">
                            <p className="text-[10px] font-mono font-black text-slate-700 group-hover:text-rose-700 flex items-center gap-1">
                              {tx.id}
                              <span className={`px-1 py-0.5 rounded-sm text-[8px] font-bold ${
                                tx.status === 'PAID' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'
                              }`}>
                                {tx.status}
                              </span>
                            </p>
                            <p className="text-[9px] text-slate-400 font-semibold truncate max-w-[280px]">
                              {tx.items?.map((it: any) => it.name).join(', ') || 'Pembelian Produk'}
                            </p>
                          </div>
                          <span className="text-[9px] font-bold text-slate-400 group-hover:text-rose-650 shrink-0">Gunakan ID Ini →</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Interactive Problem Category Grid (Stunning Cards instead of Select) */}
              <div>
                <label className="block text-[10px] font-extrabold text-slate-500 uppercase tracking-wider mb-2">Kategori Masalah Utama <span className="text-rose-500">*</span></label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {categoriesList.map((item) => {
                    const isSelected = category === item.id;
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => setCategory(item.id)}
                        className={`text-left p-3 rounded-2xl border transition-all cursor-pointer flex gap-3 relative overflow-hidden group shadow-3xs ${
                          isSelected 
                            ? `${item.bgColor} ${item.borderColor} border-2 ring-1 ring-offset-1 ring-slate-100` 
                            : 'bg-white hover:bg-slate-50 border-slate-200'
                        }`}
                      >
                        <div className={`p-2 rounded-xl shrink-0 transition-colors ${
                          isSelected ? 'bg-white shadow-3xs' : 'bg-slate-100 group-hover:bg-slate-200'
                        } ${item.color}`}>
                          {item.icon}
                        </div>
                        <div className="space-y-0.5">
                          <p className={`text-xs font-bold leading-tight ${isSelected ? 'text-slate-900 font-extrabold' : 'text-slate-700'}`}>
                            {item.title}
                          </p>
                          <p className="text-[10px] text-slate-400 leading-snug font-medium">
                            {item.description}
                          </p>
                        </div>
                        
                        {isSelected && (
                          <div className="absolute right-2.5 top-2.5">
                            <span className="flex h-1.5 w-1.5 relative">
                              <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${item.color.replace('text-', 'bg-')}`}></span>
                              <span className={`relative inline-flex rounded-full h-1.5 w-1.5 ${item.color.replace('text-', 'bg-')}`}></span>
                            </span>
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Detailed Message Textarea */}
              <div>
                <label className="block text-[10px] font-extrabold text-slate-500 uppercase tracking-wider mb-1.5">Rincian Kendala Secara Detail <span className="text-rose-500">*</span></label>
                <div className="relative">
                  <textarea
                    placeholder="Contoh: Saya sudah mentransfer dana sebesar Rp50.000, namun kunci lisensi digital Microsoft Office belum terkirim ke email saya. Mohon dibantu ya min."
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    rows={4}
                    className="w-full text-xs bg-white border border-slate-200 rounded-2xl p-4 focus:outline-hidden focus:ring-1 focus:ring-rose-500 font-medium leading-relaxed transition-all resize-none shadow-3xs"
                    required
                  />
                  <div className="absolute right-3.5 bottom-3 text-[9px] text-slate-400 font-semibold uppercase tracking-wider flex items-center gap-1 pointer-events-none">
                    <Clock className="w-3 h-3 text-rose-500" /> Respon admin &lt; 15 menit
                  </div>
                </div>
              </div>

              {/* Safe & secure badges + action buttons */}
              <div className="flex flex-col sm:flex-row items-center gap-4 pt-4 border-t border-slate-200 shrink-0">
                <div className="flex items-center gap-1.5 text-slate-400 mr-auto">
                  <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Laporan terenkripsi & aman</span>
                </div>
                
                <div className="flex gap-2.5 w-full sm:w-auto">
                  <button
                    type="button"
                    onClick={onClose}
                    className="flex-1 sm:flex-none px-5 py-2.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 font-bold text-xs rounded-xl transition-all cursor-pointer shadow-3xs"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="flex-1 sm:flex-none px-6 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-xs rounded-xl transition-all hover:scale-[1.01] cursor-pointer flex items-center justify-center gap-1.5 shadow-md shadow-rose-600/20"
                  >
                    <Send className="w-4 h-4" /> Kirim Pengaduan
                  </button>
                </div>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
