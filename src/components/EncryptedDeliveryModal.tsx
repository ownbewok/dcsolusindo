/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Transaction, ShopBranding, VaultUser, GithubUser } from '../types';
import { ShieldCheck, Download, Key, Sparkles, Copy, RefreshCw, Lock, Unlock, Eye, HelpCircle, Search, FileText, Printer, AlertCircle, Check, Github } from 'lucide-react';
import { InvoiceModal } from './InvoiceModal';

interface EncryptedDeliveryModalProps {
  purchasedTransactions: Transaction[];
  branding?: ShopBranding;
  vaultUsers?: VaultUser[];
  githubUser?: GithubUser | null;
  onGithubLogin?: () => void;
  onGithubLogout?: () => void;
}

export const EncryptedDeliveryModal: React.FC<EncryptedDeliveryModalProps> = ({
  purchasedTransactions,
  branding,
  vaultUsers = [],
  githubUser = null,
  onGithubLogin,
  onGithubLogout,
}) => {
  const [decryptingItemId, setDecryptingItemId] = useState<string | null>(null);
  const [decryptedKeys, setDecryptedKeys] = useState<Record<string, boolean>>({});
  const [matrixScramble, setMatrixScramble] = useState('********-****-****-****');
  const [copiedKeyId, setCopiedKeyId] = useState<string | null>(null);

  const [filterMyTx, setFilterMyTx] = useState(true);

  const displayedTransactions = githubUser && filterMyTx
    ? purchasedTransactions.filter(trx => trx.buyerEmail.toLowerCase() === githubUser.email.toLowerCase())
    : purchasedTransactions;

  // Per-item Decryption Password Prompt States
  const [activeDecryptInputId, setActiveDecryptInputId] = useState<string | null>(null);
  const [decryptPasswordInput, setDecryptPasswordInput] = useState('');
  const [decryptErrorId, setDecryptErrorId] = useState<string | null>(null);

  // States for invoice lookup without user login
  const [searchInvoiceId, setSearchInvoiceId] = useState('');
  const [foundTransaction, setFoundTransaction] = useState<Transaction | null>(null);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [selectedInvoice, setSelectedInvoice] = useState<Transaction | null>(null);

  const handleSearchInvoice = (e: React.FormEvent) => {
    e.preventDefault();
    setSearchError(null);
    setFoundTransaction(null);

    if (!searchInvoiceId.trim()) {
      setSearchError('Silakan masukkan ID Invoice atau ID Transaksi.');
      return;
    }

    const matched = purchasedTransactions.find(
      (trx) => trx.id.toLowerCase() === searchInvoiceId.trim().toLowerCase()
    );

    if (matched) {
      setFoundTransaction(matched);
    } else {
      setSearchError(`Transaksi dengan ID "${searchInvoiceId}" tidak ditemukan.`);
    }
  };

  // Simulated Matrix decrypting scrambling text effect
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (decryptingItemId) {
      interval = setInterval(() => {
        const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789-';
        let randomStr = '';
        for (let i = 0; i < 24; i++) {
          if (i === 5 || i === 10 || i === 15 || i === 20) {
            randomStr += '-';
          } else {
            randomStr += characters.charAt(Math.floor(Math.random() * characters.length));
          }
        }
        setMatrixScramble(randomStr);
      }, 70);
    }
    return () => clearInterval(interval);
  }, [decryptingItemId]);

  const handleDecrypt = (itemId: string) => {
    setDecryptingItemId(itemId);
    // Simulate decryption math processing time
    setTimeout(() => {
      setDecryptedKeys((prev) => ({ ...prev, [itemId]: true }));
      setDecryptingItemId(null);
    }, 1600);
  };

  const handleCopyKey = (key: string, itemId: string) => {
    navigator.clipboard.writeText(key);
    setCopiedKeyId(itemId);
    setTimeout(() => setCopiedKeyId(null), 2000);
  };

  const handleDownloadFile = (productName: string, url: string) => {
    // Generate a secure instant dummy blob download representing the purchased digital product
    const dummyContent = `DIGITAL PRODUCT - THANK YOU FOR YOUR PURCHASE\n\nProduct: ${productName}\nVerification: SUCCESSFUL\nSecure Vault Signature: MD5-SECURE-VAULT-${Math.floor(1000000 + Math.random() * 9000000)}\n\nEnjoy your premium asset update!`;
    const blob = new Blob([dummyContent], { type: 'text/plain' });
    const blobUrl = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = blobUrl;
    a.download = `${productName.toLowerCase().replace(/[^a-z0-9]/g, '-')}-download-package.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(blobUrl);

    alert(`✓ File download paket "${productName}" berhasil diunduh secara instan!`);
  };

  return (
    <div className="space-y-6">
      {/* Title Header Banner */}
      <div className="bg-sky-50 border border-sky-100 rounded-2xl p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
            <ShieldCheck className="w-5.5 h-5.5 text-sky-600" /> Brankas Enkripsi & Pengiriman Instan
          </h2>
          <p className="text-xs text-slate-500 leading-normal max-w-xl">
            Semua lisensi dikunci menggunakan enkripsi aman satu arah. Anda dapat mengunduh berkas digital, lalu memasukkan kata sandi dekripsi dari admin untuk membuka lisensi aktivasi Anda di bawah.
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <div className="text-xs bg-white px-3 py-1.5 rounded-lg border border-slate-100 font-bold text-slate-700 w-fit shrink-0 flex items-center gap-1.5">
            <Lock className="w-3.5 h-3.5 text-sky-600 animate-pulse" /> Enkripsi AES-256 Aktif
          </div>
        </div>
      </div>



      {/* SECTION: Lacak & Lihat Detail Invoice Tanpa Login */}
      <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-xs space-y-4">
        <div>
          <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
            <Search className="w-4 h-4 text-sky-600" /> Lihat Invoice Anda Tanpa Login
          </h3>
          <p className="text-[11px] text-slate-400 mt-0.5">
            Punya ID Transaksi / Invoice? Masukkan kode di bawah untuk melihat rincian pembayaran resmi, mengunduh file, atau mencetak kwitansi PDF secara instan tanpa perlu mendaftar akun.
          </p>
        </div>

        <form onSubmit={handleSearchInvoice} className="flex flex-col sm:flex-row gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Masukkan ID Transaksi (Contoh: TRX-DIR-123456 atau TRX-983120)"
              value={searchInvoiceId}
              onChange={(e) => setSearchInvoiceId(e.target.value)}
              className="w-full text-xs pl-9.5 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:ring-1 focus:ring-sky-500 font-mono"
            />
          </div>
          <button
            type="submit"
            className="px-5 py-2.5 bg-slate-900 hover:bg-sky-600 text-white text-xs font-bold rounded-xl transition-colors cursor-pointer flex items-center justify-center gap-1.5"
          >
            Lacak Invoice
          </button>
        </form>

        {searchError && (
          <div className="p-3 bg-rose-50 text-rose-700 text-xs rounded-xl flex items-center gap-2 border border-rose-100">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{searchError}</span>
          </div>
        )}

        {foundTransaction && (
          <div className="p-4 bg-emerald-50/40 rounded-xl border border-emerald-100/50 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 animate-fadeIn">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono font-bold text-sky-700 bg-sky-50 px-2 py-0.5 rounded-md border border-sky-100">
                  {foundTransaction.id}
                </span>
                <span className={`text-[9px] font-black px-1.5 py-0.5 rounded-md ${
                  foundTransaction.paymentStatus === 'SUCCESS' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'
                }`}>
                  {foundTransaction.paymentStatus === 'SUCCESS' ? 'LUNAS' : 'PENDING'}
                </span>
              </div>
              <p className="text-xs text-slate-700 font-semibold">
                Pembeli: {foundTransaction.buyerName} <span className="text-slate-400 font-normal">({foundTransaction.buyerEmail})</span>
              </p>
              <p className="text-[10px] text-slate-500 font-medium">
                Total Belanja: <strong className="text-slate-800">Rp {foundTransaction.totalPrice.toLocaleString('id-ID')}</strong> ({foundTransaction.items.length} item)
              </p>
            </div>
            <div className="flex items-center gap-2 w-full sm:w-auto shrink-0">
              <button
                onClick={() => setSelectedInvoice(foundTransaction)}
                className="w-full sm:w-auto px-4 py-2 bg-slate-900 hover:bg-sky-600 text-white text-xs font-bold rounded-lg transition-colors cursor-pointer flex items-center justify-center gap-1.5 shadow-xs"
              >
                <FileText className="w-3.5 h-3.5" /> Lihat & Cetak Invoice Resmi
              </button>
            </div>
          </div>
        )}

        {/* Quick select demo helper if transactions exist */}
        {purchasedTransactions.length > 0 && !foundTransaction && (
          <div className="flex flex-wrap items-center gap-1.5 text-[10px] text-slate-400">
            <span>Transaksi Demo Tersedia (Klik untuk Lacak):</span>
            {purchasedTransactions.slice(0, 3).map((trx) => (
              <button
                key={trx.id}
                type="button"
                onClick={() => {
                  setSearchInvoiceId(trx.id);
                  setFoundTransaction(trx);
                  setSearchError(null);
                }}
                className="px-2 py-0.5 bg-slate-100 hover:bg-sky-50 hover:text-sky-700 font-mono font-bold rounded-md transition-colors cursor-pointer"
              >
                {trx.id}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Purchased Assets Vault Grid */}
      {displayedTransactions.length === 0 ? (
        <div className="bg-white border border-slate-100 rounded-2xl p-12 text-center text-slate-400">
          <Lock className="w-12 h-12 text-slate-300 mx-auto mb-4" />
          <h3 className="text-sm font-bold text-slate-800">Brankas Lisensi Masih Kosong</h3>
          <p className="text-xs text-slate-400 mt-1 max-w-xs mx-auto">
            {githubUser && filterMyTx
              ? `Tidak ada transaksi yang terkait dengan email GitHub Anda (${githubUser.email}) dalam sistem kami.`
              : "Anda belum melakukan transaksi lunas. Silakan lakukan checkout produk di Tab Belanja untuk mencobanya secara otomatis."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {displayedTransactions.flatMap((trx) =>
            trx.items.map((item, i) => {
              const uniqueItemId = `${trx.id}-${item.productId}-${i}`;
              const isDecrypted = decryptedKeys[uniqueItemId];
              const isDecryptingNow = decryptingItemId === uniqueItemId;

              return (
                <div
                  key={uniqueItemId}
                  className="bg-white border border-slate-100 rounded-2xl p-5 shadow-xs hover:shadow-xs transition-shadow flex flex-col md:flex-row md:items-center justify-between gap-6"
                >
                  {/* Left Side: Product Info */}
                  <div className="space-y-2 min-w-0 flex-1">
                    <div className="flex items-center gap-2.5">
                      {trx.paymentStatus === 'SUCCESS' ? (
                        <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-100 uppercase tracking-wider">
                          Terverifikasi Lunas
                        </span>
                      ) : (
                        <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-100 uppercase tracking-wider animate-pulse">
                          Menunggu Pembayaran (Pending)
                        </span>
                      )}
                      <span className="text-[10px] font-mono text-slate-400 font-semibold">Invoice: {trx.id}</span>
                    </div>
                    <h3 className="text-sm font-bold text-slate-900 truncate leading-snug">{item.productName}</h3>
                    
                    <div className="flex items-center gap-4 text-xs text-slate-500">
                      <span>Metode: <strong className="text-slate-700 font-semibold">{trx.paymentMethod}</strong></span>
                      <span>•</span>
                      <span>Ukuran File: <strong className="text-slate-700 font-semibold">{item.fileSize}</strong></span>
                    </div>
                  </div>

                  {/* Middle Side: Encrypted Key Terminal Visual */}
                  <div className="bg-slate-950 text-emerald-400 font-mono text-xs rounded-xl p-3.5 border border-slate-800 min-w-[280px] relative overflow-hidden flex flex-col justify-center">
                    <span className="block text-[8px] text-slate-500 uppercase font-bold tracking-widest mb-1">
                      Enkripsi Lisensi Aktivasi
                    </span>

                    {trx.paymentStatus !== 'SUCCESS' ? (
                      <div className="flex flex-col items-center justify-center text-center py-2 text-rose-400 space-y-1">
                        <Lock className="w-4 h-4 text-rose-400 animate-pulse" />
                        <span className="font-extrabold text-[9px] uppercase tracking-widest text-rose-400">Lisensi Terkunci (****)</span>
                        <span className="text-[8px] text-slate-500 font-sans leading-normal">
                          Menunggu pembayaran diverifikasi oleh Admin.
                        </span>
                      </div>
                    ) : isDecryptingNow ? (
                      <div className="flex items-center justify-between gap-2 text-sky-400">
                        <span className="font-bold tracking-wider">{matrixScramble}</span>
                        <RefreshCw className="w-4 h-4 animate-spin shrink-0" />
                      </div>
                    ) : isDecrypted ? (
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-bold text-emerald-400 tracking-wider font-mono">
                          {item.licenseKey || 'KEY-SECRET-DECRYPTED'}
                        </span>
                        <button
                          onClick={() => handleCopyKey(item.licenseKey || '', uniqueItemId)}
                          className="text-[10px] text-emerald-400 hover:text-white bg-slate-900 border border-slate-800 px-2 py-0.5 rounded-md transition-colors cursor-pointer flex items-center gap-1"
                        >
                          <Copy className="w-3 h-3" /> {copiedKeyId === uniqueItemId ? 'Salin!' : 'Copy'}
                        </button>
                      </div>
                    ) : activeDecryptInputId === uniqueItemId ? (
                      <form onSubmit={(e) => {
                        e.preventDefault();
                        const expected = item.decryptPassword || 'DEC-DEMO';
                        if (decryptPasswordInput.trim().toUpperCase() === expected.toUpperCase()) {
                          setDecryptPasswordInput('');
                          setActiveDecryptInputId(null);
                          setDecryptErrorId(null);
                          handleDecrypt(uniqueItemId);
                        } else {
                          setDecryptErrorId(uniqueItemId);
                        }
                      }} className="space-y-1.5 animate-fadeIn">
                        <span className="block text-[8px] text-rose-400 font-bold uppercase tracking-wider">Masukkan Sandi Dekripsi:</span>
                        <div className="flex gap-1.5">
                          <input
                            type="text"
                            placeholder="Sandi..."
                            value={decryptPasswordInput}
                            onChange={(e) => {
                              setDecryptPasswordInput(e.target.value);
                              setDecryptErrorId(null);
                            }}
                            className="flex-1 text-[10px] bg-slate-900 border border-slate-800 rounded-md px-2 py-1.5 focus:outline-hidden focus:ring-1 focus:ring-sky-500 font-mono text-white placeholder-slate-700 uppercase tracking-wider"
                            autoFocus
                          />
                          <button
                            type="submit"
                            className="px-2 py-1.5 bg-sky-600 hover:bg-sky-500 text-white text-[9px] font-bold rounded-md transition-colors cursor-pointer"
                          >
                            OK
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setActiveDecryptInputId(null);
                              setDecryptPasswordInput('');
                              setDecryptErrorId(null);
                            }}
                            className="px-2 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-400 text-[9px] font-bold rounded-md transition-colors cursor-pointer"
                          >
                            Batal
                          </button>
                        </div>
                        {decryptErrorId === uniqueItemId && (
                          <span className="block text-[8px] text-rose-500 font-semibold animate-pulse">Sandi salah! Silakan periksa di Tab Admin</span>
                        )}
                      </form>
                    ) : (
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center justify-between gap-2 text-slate-500">
                          <span>●●●●●●●●-●●●●-●●●-SECURE</span>
                          <button
                            onClick={() => {
                              setActiveDecryptInputId(uniqueItemId);
                              setDecryptPasswordInput('');
                              setDecryptErrorId(null);
                            }}
                            className="text-[9px] text-sky-400 hover:text-white bg-slate-900 hover:bg-sky-600 border border-slate-800 hover:border-sky-500 px-2.5 py-1 rounded-md transition-colors cursor-pointer flex items-center gap-1 shrink-0"
                          >
                            <Unlock className="w-3.5 h-3.5" /> Dekripsi
                          </button>
                        </div>
                        <div className="text-[8px] text-slate-500 text-right mt-1 font-sans">
                          Sandi: <strong className="text-slate-400 font-mono select-all bg-slate-900/60 px-1 py-0.5 rounded">{item.decryptPassword || 'DEC-DEMO'}</strong>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Right Side: Instant Downloader Button */}
                  <div className="shrink-0 flex items-center">
                    {trx.paymentStatus === 'SUCCESS' ? (
                      <button
                        onClick={() => handleDownloadFile(item.productName, item.fileUrl)}
                        className="w-full md:w-auto px-4 py-3 bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-xs"
                      >
                        <Download className="w-4 h-4" /> Unduh File Instan
                      </button>
                    ) : (
                      <button
                        disabled
                        className="w-full md:w-auto px-4 py-3 bg-slate-100 text-slate-400 font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 cursor-not-allowed border border-slate-200"
                        title="Hubungi admin atau lunasi transaksi untuk mengunduh"
                      >
                        <Lock className="w-3.5 h-3.5" /> File Terkunci
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* View Selected Invoice Modal */}
      {selectedInvoice && (
        <InvoiceModal
          transaction={selectedInvoice}
          onClose={() => setSelectedInvoice(null)}
          branding={branding}
        />
      )}
    </div>
  );
};
