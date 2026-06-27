/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Product } from '../types';
import { Star, ShieldCheck, Download, ShoppingCart, Heart } from 'lucide-react';

interface ProductCardProps {
  product: Product;
  onViewDetail: (product: Product) => void;
  onAddToCart: (product: Product) => void;
  isWishlisted?: boolean;
  onToggleWishlist?: (product: Product) => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({
  product,
  onViewDetail,
  onAddToCart,
  isWishlisted = false,
  onToggleWishlist,
}) => {
  const formattedPrice = new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(product.price);

  const formattedOriginalPrice = product.originalPrice ? new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(product.originalPrice) : null;

  // Calculate discount percentage if original price exists
  const discountPct = product.originalPrice && product.originalPrice > product.price
    ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
    : null;

  return (
    <div className="group bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-xs hover:shadow-md transition-all duration-300 flex flex-col h-full hover:-translate-y-1">
      {/* Product Image & Badges */}
      <div className="relative aspect-video w-full bg-slate-50 overflow-hidden cursor-pointer" onClick={() => onViewDetail(product)}>
        <img
          src={product.image}
          alt={product.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          referrerPolicy="no-referrer"
        />
        <div className="absolute top-3 left-3 flex flex-col gap-1.5 items-start">
          {product.isFeatured && (
            <span className="px-2.5 py-1 text-[10px] font-black text-emerald-700 bg-emerald-50 rounded-full border border-emerald-200 uppercase tracking-wider shadow-xs">
              Terpopuler
            </span>
          )}
          {product.isDiscounted && (
            <span className="px-2.5 py-1 text-[10px] font-black text-rose-700 bg-rose-50 rounded-full border border-rose-200 uppercase tracking-wider shadow-xs">
              Diskon {discountPct || 'Promo'}%
            </span>
          )}
        </div>
        <span className="absolute top-3 right-3 px-2 py-0.5 text-[10px] font-medium text-slate-600 bg-white/95 backdrop-blur-xs rounded-md shadow-xs">
          {product.licenseType}
        </span>
      </div>

      {/* Product Info */}
      <div className="p-5 flex-1 flex flex-col">
        {/* Category & Rating */}
        <div className="flex items-center justify-between gap-2 mb-2">
          <span className="text-xs font-semibold text-sky-600 uppercase tracking-wider">
            {product.category}
          </span>
          <div className="flex items-center gap-1">
            <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
            <span className="text-xs font-bold text-slate-700">{product.rating}</span>
            <span className="text-xs text-slate-400">({product.reviewsCount})</span>
          </div>
        </div>

        {/* Title */}
        <h3
          className="text-base font-bold text-slate-900 leading-snug mb-2 hover:text-sky-600 cursor-pointer line-clamp-2"
          onClick={() => onViewDetail(product)}
        >
          {product.name}
        </h3>

        {/* Description Snippet */}
        <p className="text-xs text-slate-500 line-clamp-2 mb-4 flex-1">
          {product.description}
        </p>

        {/* Seller & File info */}
        <div className="flex items-center gap-4 py-2 border-t border-slate-50 text-[11px] text-slate-500 mb-4">
          <span className="truncate">Penjual: <span className="font-medium text-slate-700">{product.sellerName}</span></span>
          <span className="flex items-center gap-1 shrink-0 ml-auto">
            <Download className="w-3 h-3" /> {product.fileSize}
          </span>
        </div>

        {/* Price & Action */}
        <div className="flex items-center justify-between gap-2 mt-auto">
          <div className="flex flex-col">
            <span className="text-[10px] text-slate-400">Harga Aset</span>
            <div className="flex items-baseline gap-1.5 flex-wrap">
              <span className="text-lg font-black text-slate-900">{formattedPrice}</span>
              {formattedOriginalPrice && (
                <span className="text-xs text-slate-400 line-through font-medium">{formattedOriginalPrice}</span>
              )}
            </div>
          </div>
          
          <div className="flex gap-1.5">
            {onToggleWishlist && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleWishlist(product);
                }}
                className={`p-2.5 rounded-xl border transition-all cursor-pointer hover:scale-105 active:scale-95 ${
                  isWishlisted
                    ? 'border-rose-200 bg-rose-50/50 text-rose-600'
                    : 'border-slate-200 text-slate-500 hover:text-slate-800'
                }`}
                title={isWishlisted ? "Hapus dari Wishlist" : "Simpan ke Wishlist"}
              >
                <Heart className={`w-4 h-4 ${isWishlisted ? 'fill-rose-600' : ''}`} />
              </button>
            )}
            <button
              onClick={() => onAddToCart(product)}
              className="p-2.5 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
              title="Tambah ke Keranjang"
            >
              <ShoppingCart className="w-4 h-4" />
            </button>
            <button
              onClick={() => onViewDetail(product)}
              className="px-4 py-2.5 bg-slate-900 hover:bg-sky-700 text-white font-semibold text-xs rounded-xl transition-all cursor-pointer shadow-xs"
            >
              Beli Instan
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
