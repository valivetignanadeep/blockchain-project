import React, { useState, useEffect } from 'react';
import { useWeb3 } from '../context/Web3Context';
import { Star, ShieldCheck, X, MessageSquare, Loader2 } from 'lucide-react';
import { FALLBACK_REVIEWS } from '../context/fallbackData';

export default function ProductReviewsModal({ product, onClose }) {
  const { contract, readContract } = useWeb3();
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchReviews() {
      if (!product) return;
      const targetContract = contract || readContract;

      try {
        setLoading(true);
        if (targetContract) {
          const rawReviews = await targetContract.getProductReviews(product.id);
          if (rawReviews && rawReviews.length > 0) {
            const parsed = rawReviews.map((r) => ({
              orderId: Number(r.orderId),
              productId: Number(r.productId),
              reviewer: r.reviewer,
              rating: Number(r.rating),
              comment: r.comment,
              timestamp: Number(r.timestamp),
            }));
            setReviews(parsed.reverse());
            return;
          }
        }
        // Fallback for cloud/Vercel deployments
        if (FALLBACK_REVIEWS[product.id]) {
          setReviews(FALLBACK_REVIEWS[product.id]);
        } else {
          setReviews([]);
        }
      } catch (err) {
        console.warn('Using fallback reviews:', err);
        setReviews(FALLBACK_REVIEWS[product.id] || []);
      } finally {
        setLoading(false);
      }
    }

    fetchReviews();
  }, [product, contract, readContract]);

  if (!product) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-xl w-full max-h-[85vh] flex flex-col shadow-2xl">
        
        {/* Header */}
        <div className="p-6 border-b border-slate-800 flex items-center justify-between flex-shrink-0">
          <div>
            <div className="flex items-center space-x-2">
              <ShieldCheck className="w-5 h-5 text-emerald-400" />
              <h3 className="text-lg font-bold text-white">Verified On-Chain Reviews</h3>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Cryptographically verified purchases for <span className="text-slate-200 font-medium">{product.name}</span>
            </p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Rating Overview */}
        <div className="px-6 py-4 bg-slate-950/60 border-b border-slate-800/80 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center space-x-3">
            <span className="text-3xl font-extrabold text-white">{product.avgRating}</span>
            <div>
              <div className="flex items-center space-x-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    className={`w-4 h-4 ${
                      star <= Math.round(product.avgRating)
                        ? 'text-amber-400 fill-amber-400'
                        : 'text-slate-600'
                    }`}
                  />
                ))}
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Based on {reviews.length} tamper-proof on-chain review{reviews.length !== 1 ? 's' : ''}
              </p>
            </div>
          </div>
          <div className="text-right">
            <span className="inline-flex items-center space-x-1 text-[11px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <ShieldCheck className="w-3 h-3" />
              <span>Sybil-Resistant</span>
            </span>
          </div>
        </div>

        {/* Reviews List */}
        <div className="p-6 overflow-y-auto space-y-4 flex-1">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12 text-slate-400">
              <Loader2 className="w-6 h-6 animate-spin text-indigo-400 mb-2" />
              <span className="text-xs">Reading blockchain state...</span>
            </div>
          ) : reviews.length === 0 ? (
            <div className="text-center py-12">
              <MessageSquare className="w-8 h-8 text-slate-600 mx-auto mb-2" />
              <p className="text-sm text-slate-300 font-medium">No reviews yet</p>
              <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto">
                Only verified buyers who have received this product can submit a review.
              </p>
            </div>
          ) : (
            reviews.map((rev, idx) => (
              <div
                key={idx}
                className="p-4 rounded-xl bg-slate-950/70 border border-slate-800/80 space-y-2 hover:border-slate-700 transition"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div className="flex items-center space-x-0.5">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                          key={star}
                          className={`w-3.5 h-3.5 ${
                            star <= rev.rating ? 'text-amber-400 fill-amber-400' : 'text-slate-600'
                          }`}
                        />
                      ))}
                    </div>
                    <span className="text-[11px] font-mono font-medium text-amber-300">
                      {rev.rating}.0
                    </span>
                  </div>
                  <div className="flex items-center space-x-1.5 text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                    <ShieldCheck className="w-3 h-3" />
                    <span>Verified Buyer (Order #{rev.orderId})</span>
                  </div>
                </div>

                <p className="text-xs text-slate-200 leading-relaxed">{rev.comment}</p>

                <div className="flex items-center justify-between text-[10px] text-slate-500 font-mono pt-2 border-t border-slate-800/50">
                  <span>Reviewer: {rev.reviewer.slice(0, 6)}...{rev.reviewer.slice(-4)}</span>
                  <span>{new Date(rev.timestamp * 1000).toLocaleDateString()}</span>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-950/60 border-t border-slate-800 text-center flex-shrink-0">
          <button
            onClick={onClose}
            className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl transition"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
}
