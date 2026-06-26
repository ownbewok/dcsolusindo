/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Product } from '../types';
import { X, Trash2, Heart, ShoppingCart, ArrowRight } from 'lucide-react';

interface WishlistDrawerProps {
  wishlist: Product[];
  isOpen: boolean;
  onClose: () => void;
  onRemoveFromWishlist: (productId: string) => void;
  onAddToCart: (product: Product) => void;
  onClearWishlist: () => void;
}

export const WishlistDrawer: React.FC<WishlistDrawerProps> = ({
  wishlist,
  isOpen,
  onClose,
  onRemoveFromWishlist,
  onAddToCart,
  onClearWishlist,
}) => {
  if (!isOpen) return null;

  const formattedPrice = (price: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0,
    }).format(price);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden" id="wishlist-drawer">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity" onClick={onClose}></div>

      <div className="absolute inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-white shadow-2xl flex flex-col h-full transform transition-all border-l border-slate-100">
          {/* Header */}
          <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Heart className="w-5 h-5 text-rose-500 fill-rose-500" /> Wishlist Saya ({wishlist.length})
            </h2>
            <div className="flex items-center gap-2">
              {wishlist.length > 0 && (
                <button
                  onClick={onClearWishlist}
                  className="text-[11px] text-rose-500 hover:text-rose-700 font-bold transition-colors cursor-pointer"
                >
                  Bersihkan Semua
                </button>
              )}
              <button
                onClick={onClose}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-50 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Wishlist Content */}
          <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
            {wishlist.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center py-20">
                <Heart className="w-12 h-12 text-slate-200 mb-4" />
                <h3 className="text-sm font-bold text-slate-800">Wishlist Anda kosong</h3>
                <p className="text-xs text-slate-400 max-w-xs mt-1.5">
                  Simpan produk digital, lisensi software, template, atau aset desain yang menarik minat Anda ke wishlist ini untuk dibeli nanti.
                </p>
                <button
                  onClick={onClose}
                  className="mt-6 px-5 py-2.5 bg-slate-900 hover:bg-sky-600 text-white font-bold text-xs rounded-xl transition-colors cursor-pointer"
                >
                  Jelajahi Produk
                </button>
              </div>
            ) : (
              wishlist.map((product) => (
                <div
                  key={product.id}
                  className="flex items-start gap-4 p-3 bg-slate-50/50 hover:bg-slate-50 rounded-xl border border-slate-100 transition-colors"
                >
                  <img
                    src={product.image}
                    alt={product.name}
                    className="w-16 aspect-video object-cover rounded-lg border border-slate-200 shrink-0"
                    referrerPolicy="no-referrer"
                  />
                  <div className="flex-1 min-w-0">
                    <span className="text-[9px] font-bold text-sky-600 uppercase tracking-wider">
                      {product.category}
                    </span>
                    <h4 className="text-xs font-bold text-slate-800 line-clamp-1 mt-0.5">
                      {product.name}
                    </h4>
                    <div className="text-[10px] text-slate-400 mt-0.5">
                      Tipe: {product.licenseType}
                    </div>
                    <div className="flex items-center justify-between mt-3">
                      <div className="text-xs font-bold text-slate-900">
                        {formattedPrice(product.price)}
                      </div>
                      
                      <div className="flex items-center gap-1.5">
                        {/* Add to Cart button */}
                        <button
                          onClick={() => onAddToCart(product)}
                          className="p-1.5 bg-sky-50 hover:bg-sky-100 text-sky-600 rounded-lg transition-colors cursor-pointer"
                          title="Tambah ke Keranjang"
                        >
                          <ShoppingCart className="w-3.5 h-3.5" />
                        </button>
                        {/* Remove from Wishlist */}
                        <button
                          onClick={() => onRemoveFromWishlist(product.id)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors cursor-pointer"
                          title="Hapus dari Wishlist"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer (Back to shop link) */}
          <div className="border-t border-slate-100 p-6 bg-slate-50/70">
            <button
              onClick={onClose}
              className="w-full py-3 bg-slate-900 hover:bg-sky-600 text-white font-bold text-xs rounded-xl transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
            >
              Kembali Belanja <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
