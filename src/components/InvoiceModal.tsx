/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Transaction, PaymentStatus, ShopBranding } from '../types';
import { X, Printer, Mail, Check, AlertCircle, FileText, Info, Send, Loader2 } from 'lucide-react';

interface InvoiceModalProps {
  transaction: Transaction;
  onClose: () => void;
  onAddSystemLog?: (type: 'payment_pending' | 'payment_confirmed' | 'license_sent' | 'email_sent' | 'system', title: string, message: string, recipient?: string) => void;
  branding?: ShopBranding;
}

export const InvoiceModal: React.FC<InvoiceModalProps> = ({
  transaction,
  onClose,
  onAddSystemLog,
  branding,
}) => {
  const [remark, setRemark] = useState<string>(
    branding?.defaultNotes || `Terima kasih atas pembelian Anda! Harap simpan invoice ini sebagai bukti kepemilikan lisensi digital yang sah. Jika Anda mengalami kendala aktivasi lisensi, silakan hubungi pusat bantuan di support@${(branding?.name || 'digimarket').toLowerCase().replace(/\s+/g, '')}.com.`
  );
  
  const [emailInput, setEmailInput] = useState(transaction.buyerEmail);
  const [emailStatus, setEmailStatus] = useState<'idle' | 'sending' | 'success' | 'error'>('idle');
  const [emailMessage, setEmailMessage] = useState('');
  
  // Custom print handler that opens a new window/tab for the printable page
  const handlePrint = () => {
    const shopName = branding?.name || 'DigiMarket';
    const shopSlogan = branding?.slogan || 'Pusat Distribusi Aset Digital & Lisensi Resmi';
    const hasCustomLogo = !!branding?.logoUrl;
    const logoUrl = branding?.logoUrl || '';
    const logoInitials = shopName.substring(0, 2).toUpperCase();

    const itemsHtml = transaction.items.map(item => `
      <tr class="border-b border-slate-100 text-xs">
        <td class="py-4">
          <div class="font-bold text-slate-900">${item.productName}</div>
          <div class="text-[10px] text-slate-400 mt-0.5">Link Unduh Direct & Instan</div>
        </td>
        <td class="py-4 text-center font-mono text-slate-600">1</td>
        <td class="py-4 text-right font-mono text-slate-600">Rp ${item.price.toLocaleString('id-ID')}</td>
        <td class="py-4 text-right font-mono font-bold text-slate-900">Rp ${item.price.toLocaleString('id-ID')}</td>
      </tr>
    `).join('');

    const statusStamp = transaction.paymentStatus === PaymentStatus.SUCCESS 
      ? `<div class="border-4 border-emerald-500 text-emerald-500 uppercase font-black tracking-widest text-sm px-4 py-2 rounded-xl opacity-80 inline-block transform rotate-12">LUNAS</div>`
      : `<div class="border-4 border-amber-500 text-amber-500 uppercase font-black tracking-widest text-sm px-4 py-2 rounded-xl opacity-80 inline-block transform rotate-12">PENDING</div>`;

    const printWindow = window.open('', '_blank', 'width=850,height=950,resizable=yes,scrollbars=yes');
    if (printWindow) {
      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>Invoice - ${transaction.id} - ${shopName}</title>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1">
            <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap" rel="stylesheet">
            <script src="https://cdn.tailwindcss.com"></script>
            <style>
              body {
                font-family: 'Inter', sans-serif;
                background-color: #f8fafc;
                margin: 0;
                padding: 0;
              }
              
              /* Regular display (on screen) styles for the print preview window */
              .invoice-container {
                padding: 2rem 1rem;
              }
              .invoice-card {
                background: white;
                border-radius: 1.5rem;
                border: 1px solid #e2e8f0;
                padding: 2.5rem;
                box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
                max-width: 800px;
                margin: 0 auto;
                position: relative;
              }

              /* Print-specific media query override for exact A4 Fixed Size */
              @media print {
                html, body {
                  width: 210mm !important;
                  height: 297mm !important;
                  background-color: #ffffff !important;
                  margin: 0 !important;
                  padding: 0 !important;
                  -webkit-print-color-adjust: exact !important;
                  print-color-adjust: exact !important;
                }
                .no-print {
                  display: none !important;
                }
                .invoice-container {
                  padding: 0 !important;
                  margin: 0 !important;
                  width: 210mm !important;
                  height: 297mm !important;
                  max-width: 210mm !important;
                  max-height: 297mm !important;
                }
                .invoice-card {
                  width: 210mm !important;
                  height: 297mm !important;
                  max-width: 210mm !important;
                  max-height: 297mm !important;
                  padding: 15mm 15mm !important; /* Perfect standard A4 margins */
                  margin: 0 !important;
                  border: none !important;
                  border-radius: 0 !important;
                  box-shadow: none !important;
                  background-color: #ffffff !important;
                  
                  /* Flex layout to fit exactly one A4 page without spilling */
                  display: flex !important;
                  flex-direction: column !important;
                  justify-content: space-between !important;
                  box-sizing: border-box !important;
                  overflow: hidden !important;
                  page-break-inside: avoid !important;
                  page-break-after: avoid !important;
                  page-break-before: avoid !important;
                }

                /* Typography scaling to adapt to the fixed page size and avoid second-page spill */
                .invoice-card {
                  font-size: 9.5pt !important;
                  line-height: 1.4 !important;
                }
                .invoice-card h1 {
                  font-size: 20pt !important;
                  margin-bottom: 2px !important;
                }
                .invoice-card h4 {
                  font-size: 8.5pt !important;
                  margin-bottom: 4px !important;
                }
                .invoice-card p, .invoice-card span, .invoice-card td, .invoice-card th {
                  font-size: 9pt !important;
                }
                .invoice-card .text-xs {
                  font-size: 8.5pt !important;
                }
                .invoice-card .text-[10px] {
                  font-size: 7.5pt !important;
                }
                .invoice-card .text-[11px] {
                  font-size: 8.5pt !important;
                }
                .invoice-card .text-sky-600 {
                  font-size: 10px !important;
                }
                .invoice-card .text-emerald-600 {
                  font-size: 10px !important;
                }
                
                /* Compact tables and spacings to ensure fit */
                .invoice-card .py-8 {
                  padding-top: 12pt !important;
                  padding-bottom: 12pt !important;
                }
                .invoice-card .pb-8 {
                  padding-bottom: 12pt !important;
                }
                .invoice-card .py-6 {
                  padding-top: 10pt !important;
                  padding-bottom: 10pt !important;
                }
                .invoice-card .py-4 {
                  padding-top: 6pt !important;
                  padding-bottom: 6pt !important;
                }
                .invoice-card .pt-10 {
                  padding-top: 10pt !important;
                  margin-top: 10pt !important;
                }
                .invoice-card .mt-10 {
                  margin-top: 10pt !important;
                }
                .invoice-card .space-y-6 > * + * {
                  margin-top: 10pt !important;
                }
                .invoice-card .space-y-2 > * + * {
                  margin-top: 4pt !important;
                }
                
                /* Adjust stamp position */
                .invoice-card .absolute {
                  top: 15mm !important;
                  right: 15mm !important;
                }
              }
              @page {
                size: A4 portrait;
                margin: 0;
              }
            </style>
          </head>
          <body class="bg-slate-50 text-slate-800">
            <!-- Top Control Bar (no-print) -->
            <div class="no-print bg-slate-900 text-white px-6 py-4 flex items-center justify-between shadow-md">
              <div class="flex items-center gap-2">
                <span class="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                <span class="text-xs font-bold text-slate-300">Pratinjau PDF Invoice - ${shopName}</span>
              </div>
              <div class="flex items-center gap-3">
                <button 
                  onclick="window.print()" 
                  class="px-4 py-2 bg-sky-500 hover:bg-sky-600 text-white font-bold text-xs rounded-xl shadow-xs transition-colors cursor-pointer flex items-center gap-1.5"
                >
                  🖨️ Cetak / Simpan PDF
                </button>
                <button 
                  onclick="window.close()" 
                  class="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs rounded-xl shadow-xs transition-colors cursor-pointer"
                >
                  Tutup Jendela
                </button>
              </div>
            </div>

            <!-- Invoice Canvas Container -->
            <div class="invoice-container">
              <div class="invoice-card relative">
                
                <!-- Absolute Stamp status -->
                <div class="absolute top-12 right-12">
                  ${statusStamp}
                </div>

                <!-- Invoice Header -->
                <div class="flex flex-col sm:flex-row justify-between items-start gap-4 border-b border-slate-100 pb-8">
                  <div class="space-y-2">
                    <div class="flex items-center gap-2 text-slate-900">
                      ${hasCustomLogo 
                        ? `<div class="w-10 h-10 rounded-xl overflow-hidden flex items-center justify-center bg-white border border-slate-100 shadow-xs">
                             <img src="${logoUrl}" class="w-full h-full object-cover" />
                           </div>`
                        : `<div class="w-10 h-10 bg-slate-900 text-white rounded-xl flex items-center justify-center font-black text-sm">
                             ${logoInitials}
                           </div>`
                      }
                      <span class="font-black text-base uppercase tracking-wider">${shopName}</span>
                    </div>
                    <div class="space-y-0.5">
                      <p class="text-xs text-slate-500 font-medium">${shopSlogan}</p>
                      <p class="text-[10px] text-slate-400">${branding?.address || 'Gedung Cyber, Lt 4. Jakarta, Indonesia'}</p>
                      <p class="text-[10px] text-slate-400">Hubungi: support@${shopName.toLowerCase().replace(/\s+/g, '')}.com</p>
                    </div>
                  </div>

                  <div class="text-left sm:text-right space-y-1">
                    <h1 class="text-2xl font-black text-slate-900 tracking-tight uppercase">INVOICE</h1>
                    <p class="text-sm font-mono font-bold text-sky-600">${transaction.id}</p>
                    <p class="text-[11px] text-slate-400">Tanggal Terbit: ${formatDate(transaction.createdAt)}</p>
                    ${transaction.paymentConfirmedAt ? `
                      <p class="text-[11px] text-emerald-600 font-semibold">
                        Tanggal Lunas: ${formatDate(transaction.paymentConfirmedAt)}
                      </p>
                    ` : ''}
                  </div>
                </div>

                <!-- Buyer & Payment Details -->
                <div class="grid grid-cols-1 sm:grid-cols-2 gap-8 py-8 border-b border-slate-100 text-xs">
                  <div class="space-y-2">
                    <h4 class="text-[10px] font-bold text-slate-400 uppercase tracking-widest">DITERBITKAN KEPADA</h4>
                    <div>
                      <p class="font-bold text-slate-900 text-sm">${transaction.buyerName}</p>
                      <p class="text-slate-500 font-mono mt-0.5">${transaction.buyerEmail}</p>
                      ${transaction.buyerPhone ? `<p class="text-slate-500 font-mono mt-0.5">WhatsApp: ${transaction.buyerPhone}</p>` : ''}
                    </div>
                    <div class="pt-1">
                      <span class="text-[9px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">Tujuan Pengiriman</span>
                      <span class="text-[10px] font-semibold text-slate-700 bg-slate-50 border border-slate-150 px-2 py-0.5 rounded-md font-mono">
                        Secure Delivery Vault (Sistem Penjualan)
                      </span>
                    </div>
                  </div>

                  <div class="space-y-2 sm:text-right">
                    <h4 class="text-[10px] font-bold text-slate-400 uppercase tracking-widest sm:text-right">INFORMASI PEMBAYARAN</h4>
                    <div class="space-y-0.5">
                      <p class="text-slate-500">Metode Transaksi: <span class="font-bold text-slate-800">${transaction.paymentMethod}</span></p>
                      <p class="text-slate-500">Gateway Mitra: <span class="font-bold text-slate-800">Midtrans IPG</span></p>
                      <p class="text-slate-500">Status Pembayaran: 
                        <span class="font-extrabold ${transaction.paymentStatus === PaymentStatus.SUCCESS ? 'text-emerald-600' : 'text-amber-500'}">
                          ${transaction.paymentStatus}
                        </span>
                      </p>
                    </div>
                  </div>
                </div>

                <!-- Product items Table -->
                <div class="py-6">
                  <table class="w-full text-left border-collapse">
                    <thead>
                      <tr class="border-b border-slate-200 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                        <th class="pb-3">Deskripsi Item Aset</th>
                        <th class="pb-3 text-center w-16">Kuantitas</th>
                        <th class="pb-3 text-right w-28">Harga Satuan</th>
                        <th class="pb-3 text-right w-28">Total Harga</th>
                      </tr>
                    </thead>
                    <tbody class="divide-y divide-slate-100">
                      ${itemsHtml}
                    </tbody>
                  </table>
                </div>

                <!-- Totals section -->
                <div class="bg-slate-50/50 rounded-2xl p-6 border border-slate-100/50 flex justify-end">
                  <div class="w-64 space-y-2 text-xs">
                    <div class="flex justify-between text-slate-500">
                      <span>Subtotal Belanja:</span>
                      <span class="font-mono font-medium">Rp ${(transaction.originalPrice || transaction.totalPrice).toLocaleString('id-ID')}</span>
                    </div>
                    ${transaction.discountAmount ? `
                    <div class="flex justify-between text-emerald-600 font-semibold">
                      <span>Potongan Diskon (${transaction.promoCodeUsed || 'PROMO'}):</span>
                      <span class="font-mono">-Rp ${transaction.discountAmount.toLocaleString('id-ID')}</span>
                    </div>
                    ` : ''}
                    <div class="flex justify-between text-slate-500">
                      <span>Pajak PPN (0%):</span>
                      <span class="font-mono">Rp 0</span>
                    </div>
                    <div class="flex justify-between text-slate-500 border-b border-slate-100 pb-2">
                      <span>Biaya Administrasi:</span>
                      <span class="font-mono">Rp 0</span>
                    </div>
                    <div class="flex justify-between text-sm font-black text-slate-900 pt-1">
                      <span>Total Pembayaran:</span>
                      <span class="font-mono text-base text-slate-950">Rp ${transaction.totalPrice.toLocaleString('id-ID')}</span>
                    </div>
                  </div>
                </div>

                <!-- Catatan / Remarks -->
                <div class="pt-8 border-t border-slate-100 space-y-2">
                  <h4 class="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Catatan Penting Dokumen</h4>
                  <p class="text-[11px] text-slate-500 leading-relaxed font-medium">
                    ${remark}
                  </p>
                </div>

                <!-- Footer Copyright -->
                <div class="pt-10 text-center border-t border-slate-100 mt-10">
                  <p class="text-[9px] text-slate-400 uppercase tracking-widest font-bold">Dibuat & Diterbitkan Secara Elektronik oleh ${shopName}</p>
                  <p class="text-[8px] text-slate-400 font-mono mt-1">Dokumen ini sah dan tidak memerlukan tanda tangan basah.</p>
                </div>

              </div>
            </div>

            <!-- Auto-print on load -->
            <script>
              window.addEventListener('load', () => {
                setTimeout(() => {
                  window.print();
                }, 500);
              });
            </script>
          </body>
        </html>
      `);
      printWindow.document.close();
    } else {
      // Fallback if popup blocker is active
      alert("Popup blocker terdeteksi! Silakan izinkan popup untuk situs ini agar Invoice dapat terbuka di jendela baru untuk disimpan ke PDF.");
      window.print();
    }

    if (onAddSystemLog) {
      onAddSystemLog(
        'system',
        'Cetak/Simpan PDF Invoice',
        `Admin mengunduh atau mencetak dokumen PDF Invoice di jendela baru untuk transaksi ${transaction.id}.`,
        transaction.buyerEmail
      );
    }
  };

  // Real email delivery using SMTP Gmail API proxy
  const handleSendEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailInput.trim()) {
      setEmailStatus('error');
      setEmailMessage('Alamat email penerima tidak boleh kosong!');
      return;
    }

    setEmailStatus('sending');
    setEmailMessage('Menghubungkan ke SMTP server & mengirim...');

    try {
      const response = await fetch('/api/send-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          to: emailInput.trim(),
          buyerName: transaction.buyerName,
          transactionId: transaction.id,
          paymentMethod: transaction.paymentMethod,
          totalPrice: transaction.totalPrice,
          items: transaction.items,
          paymentStatus: transaction.paymentStatus,
          smtpConfig: branding ? {
            host: branding.smtpHost || '',
            port: branding.smtpPort || '',
            user: branding.smtpUser || '',
            password: branding.smtpPassword || '',
            secure: branding.smtpSecure !== undefined ? branding.smtpSecure : true,
          } : undefined
        }),
      });

      const resText = await response.text();
      let data;
      try {
        data = JSON.parse(resText);
      } catch (jsonErr) {
        throw new Error(`Server mengembalikan respon tidak valid (non-JSON). Status: ${response.status} ${response.statusText}. Silakan coba beberapa detik lagi.`);
      }

      if (response.ok && data.success) {
        setEmailStatus('success');
        setEmailMessage(`Invoice sukses dikirimkan ke email: ${emailInput}!`);
        
        if (onAddSystemLog) {
          onAddSystemLog(
            'email_sent',
            'Invoice Dikirim Manual via Admin',
            `Invoice ${transaction.id} berhasil dikirim secara real ke alamat ${emailInput} menggunakan SMTP Gmail.`,
            emailInput
          );
        }
      } else {
        setEmailStatus('error');
        setEmailMessage(data.error || 'Terjadi kesalahan saat mengirim email.');
      }
    } catch (err: any) {
      setEmailStatus('error');
      setEmailMessage(`Tidak dapat menghubungi server: ${err.message || err}`);
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0,
    }).format(price);
  };

  const formatDate = (isoString: string) => {
    try {
      const d = new Date(isoString);
      return d.toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return isoString;
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      {/* Dynamic Print Stylesheet */}
      <style dangerouslySetInnerHTML={{ __html: `
        @media print {
          body > * {
            display: none !important;
          }
          #printable-invoice-content {
            display: flex !important;
            flex-direction: column !important;
            justify-content: space-between !important;
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 210mm !important;
            height: 297mm !important;
            max-width: 210mm !important;
            max-height: 297mm !important;
            background: white !important;
            color: black !important;
            padding: 15mm 15mm !important;
            margin: 0 !important;
            box-shadow: none !important;
            border: none !important;
            border-radius: 0 !important;
            box-sizing: border-box !important;
            overflow: hidden !important;
            page-break-inside: avoid !important;
            page-break-after: avoid !important;
            page-break-before: avoid !important;
          }
          #printable-invoice-content * {
            color-scheme: light !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
            font-size: 9.5pt !important;
            line-height: 1.4 !important;
          }
          #printable-invoice-content h1 {
            font-size: 20pt !important;
          }
          #printable-invoice-content h4 {
            font-size: 8.5pt !important;
          }
          #printable-invoice-content p, #printable-invoice-content span, #printable-invoice-content td, #printable-invoice-content th {
            font-size: 9pt !important;
          }
          #printable-invoice-content .text-xs {
            font-size: 8.5pt !important;
          }
          #printable-invoice-content .text-[10px] {
            font-size: 7.5pt !important;
          }
          #printable-invoice-content .text-[11px] {
            font-size: 8.5pt !important;
          }
          #printable-invoice-content .text-sky-600 {
            font-size: 10px !important;
          }
          #printable-invoice-content .text-emerald-600 {
            font-size: 10px !important;
          }
          
          /* Space reduction to fit 1 page */
          #printable-invoice-content .py-8 {
            padding-top: 12pt !important;
            padding-bottom: 12pt !important;
          }
          #printable-invoice-content .pb-6 {
            padding-bottom: 10pt !important;
          }
          #printable-invoice-content .pb-8 {
            padding-bottom: 12pt !important;
          }
          #printable-invoice-content .py-6 {
            padding-top: 10pt !important;
            padding-bottom: 10pt !important;
          }
          #printable-invoice-content .py-3 {
            padding-top: 5pt !important;
            padding-bottom: 5pt !important;
          }
          #printable-invoice-content .pt-5 {
            padding-top: 8pt !important;
          }
          #printable-invoice-content .pt-4 {
            padding-top: 6pt !important;
          }
          #printable-invoice-content .pt-10 {
            padding-top: 10pt !important;
          }
          #printable-invoice-content .mt-4 {
            margin-top: 8pt !important;
          }
          #printable-invoice-content .mt-10 {
            margin-top: 10pt !important;
          }
          #printable-invoice-content .space-y-6 > * + * {
            margin-top: 10pt !important;
          }
          #printable-invoice-content .space-y-2 > * + * {
            margin-top: 4pt !important;
          }
          
          @page {
            size: A4 portrait;
            margin: 0;
          }
          .no-print {
            display: none !important;
          }
        }
      `}} />

      <div className="bg-slate-50 rounded-3xl w-full max-w-4xl shadow-2xl overflow-hidden flex flex-col md:flex-row h-[90vh] md:h-auto max-h-[90vh] border border-slate-200 animate-in fade-in zoom-in-95 duration-200 no-print">
        
        {/* Left Side: Control & Actions Panel (no-print) */}
        <div className="w-full md:w-80 bg-slate-900 text-white p-6 flex flex-col justify-between border-b md:border-b-0 md:border-r border-slate-800 shrink-0">
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-sky-500/10 border border-sky-400/20 rounded-xl flex items-center justify-center">
                  <FileText className="w-4 h-4 text-sky-400" />
                </div>
                <div>
                  <h3 className="text-xs font-black uppercase tracking-wider text-slate-200">Aksi Invoice</h3>
                  <p className="text-[9px] text-slate-400 font-mono">ID: {transaction.id}</p>
                </div>
              </div>
              <button 
                onClick={onClose}
                className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Quick Summary Info Card */}
            <div className="bg-slate-950/50 rounded-2xl p-4 border border-slate-800/60 space-y-3 text-xs">
              <div className="flex justify-between items-center pb-2 border-b border-slate-800/40">
                <span className="text-slate-400">Total Tagihan:</span>
                <span className="font-bold text-sky-400 font-mono text-sm">{formatPrice(transaction.totalPrice)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Status:</span>
                {transaction.paymentStatus === PaymentStatus.SUCCESS ? (
                  <span className="px-2 py-0.5 text-[9px] font-black text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 rounded">
                    LUNAS
                  </span>
                ) : (
                  <span className="px-2 py-0.5 text-[9px] font-black text-amber-400 bg-amber-500/10 border border-amber-500/20 rounded animate-pulse">
                    PENDING
                  </span>
                )}
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Buyer:</span>
                <span className="font-semibold text-slate-200 truncate max-w-[120px]">{transaction.buyerName}</span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-3">
              <button
                onClick={handlePrint}
                className="w-full py-2.5 bg-sky-500 hover:bg-sky-600 text-white text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md active:scale-98"
              >
                <Printer className="w-4 h-4" /> Cetak / Save to PDF
              </button>

              <div className="text-[10px] text-slate-400 flex items-center gap-1 bg-slate-950/30 p-2.5 rounded-lg border border-slate-850">
                <Info className="w-3.5 h-3.5 text-sky-400 shrink-0" />
                <span>Tips: Gunakan opsi "Save as PDF" di dialog cetak browser Anda untuk menyimpan berkas.</span>
              </div>
            </div>

            {/* Email Dispatch Form */}
            <form onSubmit={handleSendEmail} className="border-t border-slate-800 pt-5 space-y-3">
              <h4 className="text-[11px] font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-slate-400" /> Kirim Invoice Ke Email
              </h4>

              <div>
                <input
                  type="email"
                  value={emailInput}
                  onChange={(e) => setEmailInput(e.target.value)}
                  placeholder="Email pembeli"
                  className="w-full text-xs bg-slate-950/60 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-hidden focus:ring-1 focus:ring-sky-500 font-medium"
                  required
                />
              </div>

              {emailStatus === 'sending' && (
                <div className="bg-slate-950/80 p-3 rounded-xl border border-sky-950 text-[10px] text-sky-300 flex items-center gap-2">
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-sky-400 shrink-0" />
                  <span className="font-medium">{emailMessage}</span>
                </div>
              )}

              {emailStatus === 'success' && (
                <div className="bg-emerald-950/40 p-3 rounded-xl border border-emerald-900 text-[10px] text-emerald-300 flex items-start gap-2">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span>{emailMessage}</span>
                </div>
              )}

              {emailStatus === 'error' && (
                <div className="bg-rose-950/40 p-3 rounded-xl border border-rose-900 text-[10px] text-rose-300 flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                  <span className="whitespace-pre-line leading-relaxed">{emailMessage}</span>
                </div>
              )}

              {emailStatus !== 'sending' && (
                <button
                  type="submit"
                  className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white text-xs font-semibold rounded-xl transition-colors cursor-pointer flex items-center justify-center gap-1.5 border border-slate-700/50"
                >
                  <Send className="w-3.5 h-3.5" /> {emailStatus === 'success' ? 'Kirim Ulang' : 'Kirim via Email'}
                </button>
              )}
            </form>
          </div>

          {/* Editable Notes/Remarks form */}
          <div className="border-t border-slate-800 pt-4 mt-4">
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
              Edit Catatan / Remark Invoice:
            </label>
            <textarea
              rows={3}
              value={remark}
              onChange={(e) => setRemark(e.target.value)}
              className="w-full text-[10.5px] bg-slate-950/60 border border-slate-800 rounded-xl p-2.5 text-slate-300 focus:outline-hidden focus:ring-1 focus:ring-sky-500 font-medium leading-relaxed resize-none"
              placeholder="Tambahkan catatan khusus di bagian bawah invoice..."
            />
          </div>
        </div>

        {/* Right Side: Invoice Template Preview & Scrollable Container */}
        <div className="flex-1 bg-slate-100 p-4 sm:p-8 overflow-y-auto">
          
          {/* Printable Invoice Wrapper */}
          <div 
            id="printable-invoice-content"
            className="bg-white rounded-2xl border border-slate-200 p-8 sm:p-10 shadow-sm max-w-2xl mx-auto space-y-6 text-slate-800 relative"
          >
            {/* Stamp status (Lunas / Pending) */}
            <div className="absolute top-8 right-8 z-10">
              {transaction.paymentStatus === PaymentStatus.SUCCESS ? (
                <div className="border-4 border-emerald-500 text-emerald-500 uppercase font-black tracking-widest text-sm px-3 py-1.5 rounded-xl opacity-80 transform rotate-12 select-none">
                  LUNAS
                </div>
              ) : (
                <div className="border-4 border-amber-500 text-amber-500 uppercase font-black tracking-widest text-sm px-3 py-1.5 rounded-xl opacity-80 transform rotate-12 select-none animate-pulse">
                  PENDING
                </div>
              )}
            </div>

            {/* Invoice Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start gap-4 border-b border-slate-100 pb-6">
              <div className="space-y-1">
                <div className="flex items-center gap-1.5 text-slate-900">
                  {branding?.logoUrl ? (
                    <div className="w-7 h-7 rounded overflow-hidden flex items-center justify-center bg-white border border-slate-100">
                      <img src={branding.logoUrl} alt={branding.name} className="w-full h-full object-cover" />
                    </div>
                  ) : (
                    <div className="w-6 h-6 bg-slate-900 text-white rounded-md flex items-center justify-center font-black text-[10px]">
                      {branding?.name ? branding.name.substring(0, 2).toUpperCase() : 'DM'}
                    </div>
                  )}
                  <span className="font-black text-sm uppercase tracking-wider">{branding?.name || 'DigiMarket'}</span>
                </div>
                <p className="text-[10px] text-slate-400">{branding?.slogan || 'Pusat Distribusi Aset Digital & Lisensi Resmi'}</p>
                <p className="text-[10px] text-slate-400">{branding?.address || 'Gedung Cyber, Lt 4. Jakarta, Indonesia'}</p>
              </div>

              <div className="text-left sm:text-right space-y-0.5">
                <h1 className="text-lg font-black text-slate-900 tracking-tight uppercase">INVOICE</h1>
                <p className="text-xs font-mono font-bold text-slate-600">{transaction.id}</p>
                <p className="text-[10px] text-slate-400">Tanggal Terbit: {formatDate(transaction.createdAt)}</p>
                {transaction.paymentConfirmedAt && (
                  <p className="text-[10px] text-emerald-600 font-semibold">
                    Tanggal Lunas: {formatDate(transaction.paymentConfirmedAt)}
                  </p>
                )}
              </div>
            </div>

            {/* Buyer & Payment Info */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-xs border-b border-slate-100 pb-6">
              <div className="space-y-1.5">
                <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">DITERBITKAN KEPADA</h4>
                <div>
                  <p className="font-bold text-slate-900">{transaction.buyerName}</p>
                  <p className="text-slate-500 font-mono">{transaction.buyerEmail}</p>
                  {transaction.buyerPhone && (
                    <p className="text-slate-500 font-mono mt-0.5">WhatsApp: {transaction.buyerPhone}</p>
                  )}
                </div>
                <div className="pt-1.5">
                  <span className="text-[9px] font-semibold text-slate-400 uppercase">Tujuan Pengiriman: </span>
                  <span className="text-[10.5px] font-semibold text-slate-700 bg-slate-50 border border-slate-150 px-2 py-0.5 rounded-md font-mono">
                    Secure Delivery Vault (Client App)
                  </span>
                </div>
              </div>

              <div className="space-y-1.5 sm:text-right">
                <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider sm:text-right">INFORMASI PEMBAYARAN</h4>
                <div>
                  <p className="font-semibold text-slate-800">{transaction.paymentMethod}</p>
                  <p className="text-slate-500">Mata Uang: IDR (Rupiah)</p>
                </div>
                <p className="text-[10.5px] font-bold text-slate-700">
                  Status Pembayaran: <span className={transaction.paymentStatus === PaymentStatus.SUCCESS ? 'text-emerald-600' : 'text-amber-600'}>
                    {transaction.paymentStatus === PaymentStatus.SUCCESS ? 'LUNAS (CONFIRMED)' : 'MENUNGGU TRANSFER'}
                  </span>
                </p>
              </div>
            </div>

            {/* Line Items Table */}
            <div className="space-y-2">
              <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">RINCIAN ASET DIGITAL</h4>
              
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-200 text-[10px] font-bold text-slate-400 uppercase tracking-wider bg-slate-50">
                      <th className="py-2 px-3">Nama Item Produk</th>
                      <th className="py-2 px-3 text-center">Ukuran</th>
                      <th className="py-2 px-3 text-right">Harga Satuan</th>
                      <th className="py-2 px-3 text-right">Subtotal</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {transaction.items.map((item, index) => (
                      <tr key={index} className="hover:bg-slate-50/50">
                        <td className="py-3 px-3">
                          <div className="font-bold text-slate-900">{item.productName}</div>
                          <div className="text-[9.5px] text-sky-600 font-mono mt-0.5 flex flex-wrap items-center gap-1">
                            <span>Kunci Lisensi:</span>
                            <span className={`px-1.5 py-0.5 rounded border font-bold ${
                              transaction.paymentStatus === PaymentStatus.SUCCESS
                                ? 'bg-sky-50 border-sky-100 text-sky-600'
                                : 'bg-rose-50 border-rose-100 text-rose-500 font-mono font-bold'
                            }`}>
                              {transaction.paymentStatus === PaymentStatus.SUCCESS
                                ? (item.licenseKey || 'Disimpan Terenkripsi')
                                : '****'}
                            </span>
                          </div>
                        </td>
                        <td className="py-3 px-3 text-center text-[10px] font-mono text-slate-500">
                          {item.fileSize}
                        </td>
                        <td className="py-3 px-3 text-right font-semibold font-mono text-slate-700">
                          {formatPrice(item.price)}
                        </td>
                        <td className="py-3 px-3 text-right font-bold font-mono text-slate-900">
                          {formatPrice(item.price)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Summary calculations */}
            <div className="border-t border-slate-200 pt-4 flex justify-end">
              <div className="w-64 space-y-2 text-xs">
                <div className="flex justify-between text-slate-500">
                  <span>Subtotal Aset:</span>
                  <span className="font-mono font-medium">{formatPrice(transaction.originalPrice || transaction.totalPrice)}</span>
                </div>
                {transaction.discountAmount && (
                  <div className="flex justify-between text-emerald-600 font-bold">
                    <span>Diskon ({transaction.promoCodeUsed}):</span>
                    <span className="font-mono">-{formatPrice(transaction.discountAmount)}</span>
                  </div>
                )}
                <div className="flex justify-between text-slate-500">
                  <span>PPN / Pajak (0%):</span>
                  <span className="font-mono font-medium">{formatPrice(0)}</span>
                </div>
                <div className="flex justify-between text-slate-500 pb-2 border-b border-slate-100">
                  <span>Biaya Layanan VA:</span>
                  <span className="font-mono font-medium text-emerald-600">Gratis / Rp 0</span>
                </div>
                <div className="flex justify-between text-slate-900 font-extrabold text-sm pt-1">
                  <span>Total Tagihan:</span>
                  <span className="font-mono text-sky-600">{formatPrice(transaction.totalPrice)}</span>
                </div>
              </div>
            </div>

            {/* Custom Notes / Remarks (The footer note requested) */}
            {remark.trim() && (
              <div className="border-t border-slate-100 pt-5 mt-4 space-y-1">
                <h5 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">CATATAN / REMARKS</h5>
                <p className="text-[10px] text-slate-500 leading-relaxed bg-slate-50 rounded-xl p-3 border border-slate-150 whitespace-pre-wrap">
                  {remark}
                </p>
              </div>
            )}

            {/* Invoice Footer Stamp */}
            <div className="border-t border-slate-100 pt-4 text-center">
              <p className="text-[9px] text-slate-400">
                Invoice ini dibuat secara elektronik dari sistem otomatis {branding?.name || 'DigiMarket'} Sandbox dan sah tanpa tanda tangan basah.
              </p>
              <p className="text-[8px] text-slate-300 font-mono mt-0.5">
                {branding?.name || 'DigiMarket'} Secure Engine v2.0 • SHA-256 Verified Receipt • UTC-07:00
              </p>
            </div>

          </div>

        </div>

      </div>

    </div>
  );
};
