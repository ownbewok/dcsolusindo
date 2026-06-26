/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Product, Review } from '../types';
import { X, Star, FileText, Shield, User, MessageSquare, Calendar, Send, Sparkles, Heart } from 'lucide-react';

interface ProductDetailModalProps {
  product: Product;
  reviews: Review[];
  onClose: () => void;
  onAddToCart: (product: Product) => void;
  onAddReview: (review: Omit<Review, 'id' | 'createdAt'>) => void;
  isWishlisted?: boolean;
  onToggleWishlist?: (product: Product) => void;
}

export const ProductDetailModal: React.FC<ProductDetailModalProps> = ({
  product,
  reviews,
  onClose,
  onAddToCart,
  onAddReview,
  isWishlisted = false,
  onToggleWishlist,
}) => {
  const [newRating, setNewRating] = useState<number>(5);
  const [newComment, setNewComment] = useState<string>('');
  const [newBuyerName, setNewBuyerName] = useState<string>('');
  const [isSubmittingReview, setIsSubmittingReview] = useState<boolean>(false);
  const [reviewMessage, setReviewMessage] = useState<string>('');

  const formattedPrice = new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(product.price);

  const productReviews = reviews.filter((r) => r.productId === product.id);

  const handleReviewSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBuyerName.trim() || !newComment.trim()) return;

    setIsSubmittingReview(true);
    setTimeout(() => {
      onAddReview({
        productId: product.id,
        buyerName: newBuyerName,
        rating: newRating,
        comment: newComment,
      });
      setNewComment('');
      setNewBuyerName('');
      setNewRating(5);
      setIsSubmittingReview(false);
      setReviewMessage('Terima kasih! Ulasan Anda berhasil ditambahkan secara real-time.');
      setTimeout(() => setReviewMessage(''), 3000);
    }, 600);
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('id-ID', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto" id="product-detail-modal">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity" onClick={onClose}></div>

      <div className="flex min-h-full items-center justify-center p-4 text-center sm:p-0">
        <div className="relative transform overflow-hidden rounded-2xl bg-white text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-4xl max-h-[90vh] flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4 shrink-0">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold px-2 py-0.5 bg-sky-50 text-sky-600 rounded-md border border-sky-100">
                Detail Aset
              </span>
              <span className="text-xs text-slate-400">ID: {product.id}</span>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Body (Scrollable) */}
          <div className="overflow-y-auto p-6 space-y-8 flex-1">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Left Column: Image & Delivery Note */}
              <div className="space-y-4">
                <div className="relative aspect-video rounded-xl overflow-hidden bg-slate-100 border border-slate-200 shadow-sm">
                  <img
                    src={product.image}
                    alt={product.name}
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                </div>

                {/* Secure Delivery Spec Info */}
                <div className="bg-slate-50 rounded-xl p-4 border border-slate-100 space-y-3">
                  <h4 className="text-xs font-bold text-slate-800 flex items-center gap-2 uppercase tracking-wider">
                    <Shield className="w-4 h-4 text-sky-600" /> Jaminan Pengiriman Instan
                  </h4>
                  <ul className="text-xs text-slate-600 space-y-2">
                    <li className="flex items-start gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
                      <span><strong>Link Download Instan:</strong> File otomatis dapat diunduh seketika setelah pembayaran Anda berhasil dikonfirmasi.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
                      <span><strong>Lisensi Terenkripsi:</strong> Kode lisensi dikirim secara otomatis melalui enkripsi brankas web aman untuk mencegah intersepsi.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
                      <span><strong>Bantuan 24/7:</strong> Hubungi admin sistem langsung melalui panel dashboard jika menemui kendala lisensi.</span>
                    </li>
                  </ul>
                </div>
              </div>

              {/* Right Column: Spec Details */}
              <div className="flex flex-col justify-between">
                <div>
                  <span className="text-xs font-bold text-sky-600 uppercase tracking-widest">{product.category}</span>
                  <h2 className="text-xl font-bold text-slate-900 mt-1 mb-3">{product.name}</h2>

                  {/* Rating summary */}
                  <div className="flex items-center gap-4 mb-4">
                    <div className="flex items-center gap-1 bg-amber-50 border border-amber-100 px-2.5 py-0.5 rounded-lg text-amber-700">
                      <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                      <span className="text-sm font-bold">{product.rating}</span>
                    </div>
                    <span className="text-xs text-slate-500">{productReviews.length} Ulasan Terverifikasi</span>
                    <span className="text-xs text-slate-300">|</span>
                    <span className="text-xs text-slate-500">Tipe Lisensi: <strong className="text-slate-700">{product.licenseType}</strong></span>
                  </div>

                  {/* Pricing Frame */}
                  <div className="bg-slate-50/70 border border-slate-100 rounded-xl p-4 mb-6">
                    <div className="text-xs text-slate-400">Harga Sekali Bayar</div>
                    <div className="text-2xl font-black text-slate-900 mt-1">{formattedPrice}</div>
                    <div className="text-[10px] text-emerald-600 font-medium mt-1">✓ Berhak mendapatkan update versi terbaru selamanya</div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Deskripsi Produk</h4>
                      <p className="text-xs text-slate-600 leading-relaxed">{product.description}</p>
                    </div>

                    <div className="grid grid-cols-2 gap-4 pt-2">
                      <div className="bg-slate-50/50 p-3 rounded-lg border border-slate-100/50">
                        <div className="text-[10px] text-slate-400 uppercase font-medium">Ukuran File</div>
                        <div className="text-xs font-bold text-slate-700 mt-0.5">{product.fileSize}</div>
                      </div>
                      <div className="bg-slate-50/50 p-3 rounded-lg border border-slate-100/50">
                        <div className="text-[10px] text-slate-400 uppercase font-medium">Kreator / Vendor</div>
                        <div className="text-xs font-bold text-slate-700 mt-0.5">{product.sellerName}</div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Purchase Button */}
                <div className="pt-6 border-t border-slate-100 mt-6 flex gap-3">
                  {onToggleWishlist && (
                    <button
                      onClick={() => onToggleWishlist(product)}
                      className={`p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-center hover:scale-105 active:scale-95 ${
                        isWishlisted
                          ? 'border-rose-200 bg-rose-50/50 text-rose-600'
                          : 'border-slate-200 text-slate-500 hover:text-slate-800'
                      }`}
                      title={isWishlisted ? "Hapus dari Wishlist" : "Simpan ke Wishlist"}
                    >
                      <Heart className={`w-5 h-5 ${isWishlisted ? 'fill-rose-600' : ''}`} />
                    </button>
                  )}
                  <button
                    onClick={() => {
                      onAddToCart(product);
                      onClose();
                    }}
                    className="flex-1 py-3 px-4 bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs rounded-xl transition-all shadow-sm cursor-pointer text-center"
                  >
                    Beli Sekarang & Unduh Instan
                  </button>
                </div>
              </div>
            </div>

            {/* Reviews Section */}
            <div className="border-t border-slate-100 pt-8">
              <h3 className="text-base font-bold text-slate-900 mb-6 flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-sky-600" /> Ulasan Pembeli ({productReviews.length})
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {/* Left Side: Review List */}
                <div className="md:col-span-2 space-y-4 max-h-[350px] overflow-y-auto pr-2">
                  {productReviews.length === 0 ? (
                    <div className="text-center py-8 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                      <MessageSquare className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                      <p className="text-xs text-slate-500">Belum ada ulasan untuk produk ini.</p>
                      <p className="text-[10px] text-slate-400 mt-1">Jadilah yang pertama menulis ulasan setelah membeli!</p>
                    </div>
                  ) : (
                    productReviews.map((rev) => (
                      <div key={rev.id} className="bg-slate-50/50 rounded-xl p-4 border border-slate-100">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-full bg-sky-100 flex items-center justify-center text-sky-600 text-[10px] font-bold">
                              {rev.buyerName[0].toUpperCase()}
                            </div>
                            <span className="text-xs font-bold text-slate-700">{rev.buyerName}</span>
                          </div>
                          <span className="text-[10px] text-slate-400 flex items-center gap-1">
                            <Calendar className="w-3 h-3" /> {formatDate(rev.createdAt)}
                          </span>
                        </div>
                        <div className="flex items-center gap-1 mb-2">
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              className={`w-3 h-3 ${
                                i < rev.rating ? 'fill-amber-400 text-amber-400' : 'text-slate-200'
                              }`}
                            />
                          ))}
                        </div>
                        <p className="text-xs text-slate-600">{rev.comment}</p>
                      </div>
                    ))
                  )}
                </div>

                {/* Right Side: Add Review Form */}
                <div className="bg-slate-50 rounded-xl p-5 border border-slate-100 h-fit">
                  <h4 className="text-xs font-bold text-slate-800 mb-4 flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-sky-600" /> Tulis Ulasan Pembeli
                  </h4>

                  {reviewMessage && (
                    <div className="mb-4 p-3 bg-emerald-50 text-emerald-700 text-[11px] font-medium rounded-lg border border-emerald-100">
                      {reviewMessage}
                    </div>
                  )}

                  <form onSubmit={handleReviewSubmit} className="space-y-3">
                    <div>
                      <label className="block text-[10px] font-semibold text-slate-500 uppercase mb-1">Nama Pembeli</label>
                      <input
                        type="text"
                        placeholder="Masukkan nama Anda..."
                        value={newBuyerName}
                        onChange={(e) => setNewBuyerName(e.target.value)}
                        className="w-full text-xs bg-white border border-slate-200 rounded-lg px-3 py-2 focus:ring-1 focus:ring-sky-500 focus:outline-hidden"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-semibold text-slate-500 uppercase mb-1">Rating</label>
                      <div className="flex items-center gap-1">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <button
                            type="button"
                            key={star}
                            onClick={() => setNewRating(star)}
                            className="p-1 cursor-pointer transition-transform hover:scale-110"
                          >
                            <Star
                              className={`w-5 h-5 ${
                                star <= newRating ? 'fill-amber-400 text-amber-400' : 'text-slate-300'
                              }`}
                            />
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="block text-[10px] font-semibold text-slate-500 uppercase mb-1">Ulasan Anda</label>
                      <textarea
                        rows={3}
                        placeholder="Berikan masukan atau ulasan tentang aset digital ini..."
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        className="w-full text-xs bg-white border border-slate-200 rounded-lg p-3 focus:ring-1 focus:ring-sky-500 focus:outline-hidden resize-none"
                        required
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={isSubmittingReview}
                      className="w-full py-2 bg-slate-900 hover:bg-sky-600 text-white font-bold text-xs rounded-lg transition-colors cursor-pointer flex items-center justify-center gap-1.5 disabled:opacity-55"
                    >
                      <Send className="w-3.5 h-3.5" />
                      {isSubmittingReview ? 'Mengirim...' : 'Kirim Ulasan'}
                    </button>
                  </form>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
