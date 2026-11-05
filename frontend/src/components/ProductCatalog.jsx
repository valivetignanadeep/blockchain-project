import React, { useState } from 'react';
import { useWeb3 } from '../context/Web3Context';
import { 
  Search, 
  Filter, 
  Star, 
  Lock, 
  ShieldCheck, 
  MessageSquare, 
  Package, 
  Coins, 
  CheckCircle,
  ExternalLink,
  Layers
} from 'lucide-react';
import BuyModal from './BuyModal';
import ProductReviewsModal from './ProductReviewsModal';

export default function ProductCatalog({ onSelectOrderTab }) {
  const { products, stats, account } = useWeb3();
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [buyingProduct, setBuyingProduct] = useState(null);
  const [viewingReviewProduct, setViewingReviewProduct] = useState(null);

  const categories = ['All', 'Security', 'Electronics', 'Hardware', 'Apparel', 'Services'];

  const filteredProducts = products.filter((p) => {
    const matchesCategory = selectedCategory === 'All' || p.category.toLowerCase() === selectedCategory.toLowerCase();
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          p.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="space-y-8">
      
      {/* Platform Stats & Escrow Guarantee Hero */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-950/60 via-slate-900 to-slate-950 border border-slate-800 p-8 shadow-2xl">
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-80 h-80 rounded-full bg-indigo-500/10 blur-3xl pointer-events-none"></div>

        <div className="relative z-10 max-w-3xl">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-mono uppercase tracking-wider mb-4">
            <Lock className="w-3.5 h-3.5" />
            <span>Decentralized Escrow Protocol</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight leading-tight">
            Trustless E-Commerce with <span className="bg-gradient-to-r from-indigo-400 to-violet-400 bg-clip-text text-transparent">Smart Contract Escrow</span>
          </h1>
          <p className="mt-3 text-sm sm:text-base text-slate-300 leading-relaxed">
            Eliminate fraud and fake reviews. Payments are safely held in an immutable Ethereum smart contract until you inspect and verify delivery.
          </p>
        </div>

        {/* Real-time On-Chain Metrics */}
        <div className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-4 pt-6 border-t border-slate-800/80">
          <div className="bg-slate-900/50 p-4 rounded-2xl border border-slate-800">
            <div className="flex items-center space-x-2 text-slate-400 text-xs mb-1">
              <Coins className="w-4 h-4 text-amber-400" />
              <span>Volume Transacted</span>
            </div>
            <div className="text-xl font-bold font-mono text-white">
              {(Number(stats.lifetimeVolumeWei) / 1e18).toFixed(2)} <span className="text-sm font-sans font-normal text-slate-400">ETH</span>
            </div>
          </div>

          <div className="bg-slate-900/50 p-4 rounded-2xl border border-slate-800">
            <div className="flex items-center space-x-2 text-slate-400 text-xs mb-1">
              <Lock className="w-4 h-4 text-indigo-400" />
              <span>Active in Escrow</span>
            </div>
            <div className="text-xl font-bold font-mono text-indigo-300">
              {(Number(stats.lockedEscrowWei) / 1e18).toFixed(2)} <span className="text-sm font-sans font-normal text-slate-400">ETH</span>
            </div>
          </div>

          <div className="bg-slate-900/50 p-4 rounded-2xl border border-slate-800">
            <div className="flex items-center space-x-2 text-slate-400 text-xs mb-1">
              <Package className="w-4 h-4 text-emerald-400" />
              <span>Products Listed</span>
            </div>
            <div className="text-xl font-bold font-mono text-white">{stats.totalProducts}</div>
          </div>

          <div className="bg-slate-900/50 p-4 rounded-2xl border border-slate-800">
            <div className="flex items-center space-x-2 text-slate-400 text-xs mb-1">
              <CheckCircle className="w-4 h-4 text-violet-400" />
              <span>Orders Placed</span>
            </div>
            <div className="text-xl font-bold font-mono text-white">{stats.totalOrders}</div>
          </div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        {/* Search Input */}
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder="Search crypto hardware, nodes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition"
          />
        </div>

        {/* Categories */}
        <div className="flex items-center space-x-2 overflow-x-auto w-full sm:w-auto pb-2 sm:pb-0">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition ${
                selectedCategory === cat
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                  : 'bg-slate-900 text-slate-400 hover:text-white hover:bg-slate-800 border border-slate-800'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Product Grid */}
      {filteredProducts.length === 0 ? (
        <div className="text-center py-20 bg-slate-900/40 rounded-3xl border border-slate-800">
          <Package className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <h3 className="text-base font-semibold text-white">No products found</h3>
          <p className="text-xs text-slate-400 mt-1">Try adjusting your search or category filter.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProducts.map((p) => {
            const isSeller = account && p.seller.toLowerCase() === account.toLowerCase();
            return (
              <div
                key={p.id}
                className="group bg-slate-900/70 border border-slate-800 rounded-2xl overflow-hidden hover:border-slate-700 hover:shadow-2xl hover:shadow-indigo-500/5 transition-all flex flex-col"
              >
                {/* Image Container */}
                <div className="relative aspect-video overflow-hidden bg-slate-950">
                  <img
                    src={p.imageUrl}
                    alt={p.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    onError={(e) => {
                      e.target.src = 'https://images.unsplash.com/photo-1621416894569-0f39ed31d247?auto=format&fit=crop&w=600&q=80';
                    }}
                  />
                  <div className="absolute top-3 left-3 flex items-center space-x-1.5">
                    <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded-md bg-black/60 backdrop-blur-md text-indigo-300 border border-white/10">
                      {p.category}
                    </span>
                  </div>
                  <div className="absolute top-3 right-3">
                    <span
                      className={`text-[10px] font-mono px-2 py-0.5 rounded-md backdrop-blur-md border ${
                        p.stock > 0
                          ? 'bg-emerald-950/70 text-emerald-400 border-emerald-500/30'
                          : 'bg-rose-950/70 text-rose-400 border-rose-500/30'
                      }`}
                    >
                      {p.stock > 0 ? `${p.stock} in stock` : 'Out of Stock'}
                    </span>
                  </div>
                </div>

                {/* Content */}
                <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                  <div>
                    {/* Rating row */}
                    <div className="flex items-center justify-between text-xs mb-2">
                      <button
                        onClick={() => setViewingReviewProduct(p)}
                        className="flex items-center space-x-1.5 text-slate-400 hover:text-amber-300 transition"
                      >
                        <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                        <span className="font-semibold text-slate-200">{p.avgRating > 0 ? p.avgRating : 'New'}</span>
                        <span className="text-[11px] text-slate-500">({p.reviewCount} reviews)</span>
                      </button>
                      <span className="text-[10px] font-mono text-slate-500">
                        Seller: {p.seller.slice(0, 5)}...{p.seller.slice(-3)}
                      </span>
                    </div>

                    <h3 className="font-bold text-white text-base group-hover:text-indigo-300 transition line-clamp-1">
                      {p.name}
                    </h3>
                    <p className="text-xs text-slate-400 mt-1.5 line-clamp-2 leading-relaxed">
                      {p.description}
                    </p>
                  </div>

                  {/* Price & Action */}
                  <div className="pt-4 border-t border-slate-800/80 flex items-center justify-between">
                    <div>
                      <div className="text-[10px] uppercase font-mono text-slate-500">Price</div>
                      <div className="text-lg font-bold font-mono text-white flex items-baseline space-x-1">
                        <span>{p.priceEth}</span>
                        <span className="text-xs font-sans text-indigo-400">ETH</span>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => setViewingReviewProduct(p)}
                        title="View Verified Reviews"
                        className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
                      >
                        <MessageSquare className="w-4 h-4" />
                      </button>

                      <button
                        onClick={() => setBuyingProduct(p)}
                        disabled={p.stock === 0 || isSeller}
                        className={`flex items-center space-x-1.5 px-4 py-2.5 rounded-xl text-xs font-semibold shadow-md transition ${
                          isSeller
                            ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                            : p.stock === 0
                            ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                            : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-600/20'
                        }`}
                      >
                        <Lock className="w-3.5 h-3.5" />
                        <span>{isSeller ? 'Your Item' : 'Buy with Escrow'}</span>
                      </button>
                    </div>
                  </div>

                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Checkout Modal */}
      {buyingProduct && (
        <BuyModal
          product={buyingProduct}
          onClose={() => setBuyingProduct(null)}
          onPurchaseSuccess={() => onSelectOrderTab()}
        />
      )}

      {/* Verified Reviews Modal */}
      {viewingReviewProduct && (
        <ProductReviewsModal
          product={viewingReviewProduct}
          onClose={() => setViewingReviewProduct(null)}
        />
      )}

    </div>
  );
}
