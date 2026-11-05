import React, { useState } from 'react';
import { useWeb3 } from '../context/Web3Context';
import { 
  Package, 
  Truck, 
  CheckCircle2, 
  AlertTriangle, 
  Clock, 
  RotateCcw, 
  Star, 
  ExternalLink,
  ShieldCheck,
  Send,
  Loader2,
  X
} from 'lucide-react';

export default function BuyerOrders() {
  const { orders, products, contract, account, refreshData, showNotification } = useWeb3();
  const [submittingId, setSubmittingId] = useState(null);

  // Review Modal state
  const [reviewOrder, setReviewOrder] = useState(null);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');

  // Dispute Modal state
  const [disputeOrder, setDisputeOrder] = useState(null);
  const [disputeReason, setDisputeReason] = useState('');

  // Filter orders for current account (or show all if demo mode)
  const myOrders = orders.filter((o) => {
    if (!account) return true;
    return o.buyer.toLowerCase() === account.toLowerCase();
  });

  const getProduct = (productId) => products.find((p) => p.id === productId);

  // Status mapping
  const statusMeta = [
    { label: 'Escrow Locked', color: 'text-amber-400 bg-amber-500/10 border-amber-500/20', icon: Clock },
    { label: 'Shipped', color: 'text-indigo-400 bg-indigo-500/10 border-indigo-500/20', icon: Truck },
    { label: 'Delivered (Completed)', color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20', icon: CheckCircle2 },
    { label: 'Under Dispute', color: 'text-rose-400 bg-rose-500/10 border-rose-500/20', icon: AlertTriangle },
    { label: 'Refunded', color: 'text-slate-400 bg-slate-500/10 border-slate-500/20', icon: RotateCcw },
  ];

  // 1. Confirm Delivery & Release Escrow
  const handleConfirmDelivery = async (orderId) => {
    if (!contract) return;
    try {
      setSubmittingId(orderId);
      showNotification('info', 'Releasing Escrow Funds', 'Please confirm transaction in your wallet...');
      const tx = await contract.confirmDelivery(orderId);
      showNotification('info', 'Mining Transaction', tx.hash.slice(0, 10), tx.hash);
      await tx.wait();
      showNotification('success', 'Order Completed!', `Escrow funds successfully released to seller for Order #${orderId}`);
      await refreshData();
    } catch (err) {
      console.error(err);
      showNotification('error', 'Action Failed', err.reason || err.message);
    } finally {
      setSubmittingId(null);
    }
  };

  // 2. Auto-Refund / Cancel Order
  const handleCancelOrder = async (orderId) => {
    if (!contract) return;
    try {
      setSubmittingId(orderId);
      showNotification('info', 'Claiming Refund', 'Contacting smart contract escrow...');
      const tx = await contract.cancelOrder(orderId);
      await tx.wait();
      showNotification('success', 'Refund Processed', `Escrow payment refunded back to your wallet for Order #${orderId}`);
      await refreshData();
    } catch (err) {
      console.error(err);
      showNotification('error', 'Refund Failed', err.reason || 'Auto-refund conditions not yet met');
    } finally {
      setSubmittingId(null);
    }
  };

  // 3. Open Dispute
  const handleSubmitDispute = async (e) => {
    e.preventDefault();
    if (!contract || !disputeOrder || !disputeReason) return;
    try {
      setSubmittingId(disputeOrder.id);
      showNotification('info', 'Opening Dispute', 'Submitting claim to smart contract arbitrator...');
      const tx = await contract.openDispute(disputeOrder.id, disputeReason);
      await tx.wait();
      showNotification('success', 'Dispute Opened', `Arbitrator will review evidence for Order #${disputeOrder.id}`);
      setDisputeOrder(null);
      setDisputeReason('');
      await refreshData();
    } catch (err) {
      console.error(err);
      showNotification('error', 'Dispute Failed', err.reason || err.message);
    } finally {
      setSubmittingId(null);
    }
  };

  // 4. Submit Verified Review
  const handleSubmitReview = async (e) => {
    e.preventDefault();
    if (!contract || !reviewOrder || !comment) return;
    try {
      setSubmittingId(reviewOrder.id);
      showNotification('info', 'Submitting On-Chain Review', 'Verifying purchase credentials on blockchain...');
      const tx = await contract.submitReview(reviewOrder.id, rating, comment);
      await tx.wait();
      showNotification('success', 'Verified Review Posted!', `Your rating has been permanently recorded on-chain.`);
      setReviewOrder(null);
      setComment('');
      setRating(5);
      await refreshData();
    } catch (err) {
      console.error(err);
      showNotification('error', 'Review Failed', err.reason || err.message);
    } finally {
      setSubmittingId(null);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <h2 className="text-2xl font-bold text-white">My Escrow Orders</h2>
          <p className="text-xs text-slate-400 mt-1">
            Track shipments, release payments, and submit verified reviews.
          </p>
        </div>
        <div className="text-xs font-mono text-slate-400 bg-slate-900 px-3 py-1.5 rounded-xl border border-slate-800">
          Showing {myOrders.length} order{myOrders.length !== 1 ? 's' : ''}
        </div>
      </div>

      {/* Orders List */}
      {myOrders.length === 0 ? (
        <div className="text-center py-20 bg-slate-900/40 rounded-3xl border border-slate-800">
          <Package className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <h3 className="text-base font-semibold text-white">No active orders</h3>
          <p className="text-xs text-slate-400 mt-1">Browse the marketplace and buy items with smart contract escrow.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {myOrders.map((ord) => {
            const product = getProduct(ord.productId) || {
              name: `Product #${ord.productId}`,
              imageUrl: 'https://images.unsplash.com/photo-1621416894569-0f39ed31d247?auto=format&fit=crop&w=600&q=80',
              category: 'General',
            };
            const meta = statusMeta[ord.status] || statusMeta[0];
            const StatusIcon = meta.icon;
            const isProcessing = submittingId === ord.id;

            return (
              <div
                key={ord.id}
                className="bg-slate-900/70 border border-slate-800 rounded-2xl p-6 space-y-6 hover:border-slate-700 transition"
              >
                {/* Order Top Bar */}
                <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-800/80">
                  <div className="flex items-center space-x-3">
                    <span className="font-mono font-bold text-sm text-white">Order #{ord.id}</span>
                    <span className="text-xs text-slate-500 font-mono">
                      {new Date(ord.createdAt * 1000).toLocaleString()}
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className={`inline-flex items-center space-x-1.5 text-xs font-mono px-3 py-1 rounded-full border ${meta.color}`}>
                      <StatusIcon className="w-3.5 h-3.5" />
                      <span>{meta.label}</span>
                    </span>
                  </div>
                </div>

                {/* Product Summary & Escrow Amount */}
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                  <div className="flex items-center space-x-4">
                    <img
                      src={product.imageUrl}
                      alt={product.name}
                      className="w-16 h-16 rounded-xl object-cover border border-slate-800 flex-shrink-0"
                    />
                    <div>
                      <h4 className="font-bold text-white text-base">{product.name}</h4>
                      <p className="text-xs text-slate-400 mt-0.5">
                        Quantity: <span className="text-white font-mono">{ord.quantity}</span> | Seller:{' '}
                        <span className="font-mono text-slate-300">
                          {ord.seller.slice(0, 6)}...{ord.seller.slice(-4)}
                        </span>
                      </p>
                    </div>
                  </div>

                  <div className="bg-slate-950/80 px-4 py-3 rounded-xl border border-slate-800 text-right w-full md:w-auto">
                    <div className="text-[10px] uppercase font-mono text-slate-400">Locked in Escrow</div>
                    <div className="text-lg font-bold font-mono text-indigo-300">
                      {ord.totalAmountEth} ETH
                    </div>
                  </div>
                </div>

                {/* Tracking Info if Shipped */}
                {ord.trackingInfo && (
                  <div className="bg-indigo-950/20 border border-indigo-500/20 rounded-xl p-3 flex items-center space-x-3 text-xs">
                    <Truck className="w-4 h-4 text-indigo-400 flex-shrink-0" />
                    <div>
                      <span className="text-slate-400">Carrier / Tracking Proof: </span>
                      <span className="font-mono font-semibold text-indigo-200">{ord.trackingInfo}</span>
                    </div>
                  </div>
                )}

                {/* Dispute Reason if Disputed */}
                {ord.dispute && (
                  <div className="bg-rose-950/20 border border-rose-500/20 rounded-xl p-3 flex items-start space-x-3 text-xs">
                    <AlertTriangle className="w-4 h-4 text-rose-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <div className="font-semibold text-rose-300">Dispute Claim:</div>
                      <p className="text-slate-300 mt-0.5 italic">"{ord.dispute.reason}"</p>
                      <div className="text-[10px] text-slate-400 font-mono mt-1">
                        Arbitrator reviewing on-chain escrow release.
                      </div>
                    </div>
                  </div>
                )}

                {/* Progress Stepper */}
                <div className="grid grid-cols-3 gap-2 pt-2">
                  <div className={`p-2.5 rounded-xl border text-center text-xs ${
                    ord.status >= 0 ? 'bg-indigo-950/40 border-indigo-500/40 text-indigo-200' : 'bg-slate-950 border-slate-800 text-slate-600'
                  }`}>
                    <div className="font-bold text-[11px]">1. Escrow Locked</div>
                    <div className="text-[10px] text-slate-400 mt-0.5">Funds Secured</div>
                  </div>
                  <div className={`p-2.5 rounded-xl border text-center text-xs ${
                    ord.status >= 1 && ord.status !== 4 ? 'bg-indigo-950/40 border-indigo-500/40 text-indigo-200' : 'bg-slate-950 border-slate-800 text-slate-600'
                  }`}>
                    <div className="font-bold text-[11px]">2. Shipped</div>
                    <div className="text-[10px] text-slate-400 mt-0.5">{ord.shippedAt ? 'In Transit' : 'Pending'}</div>
                  </div>
                  <div className={`p-2.5 rounded-xl border text-center text-xs ${
                    ord.status === 2 ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-200' : 'bg-slate-950 border-slate-800 text-slate-600'
                  }`}>
                    <div className="font-bold text-[11px]">3. Completed</div>
                    <div className="text-[10px] text-slate-400 mt-0.5">Funds Released</div>
                  </div>
                </div>

                {/* Actions Bar */}
                <div className="pt-4 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-3">
                  <div className="text-xs text-slate-400">
                    {ord.status === 0 && 'Awaiting seller to dispatch and input shipping tracking hash.'}
                    {ord.status === 1 && 'Item has been shipped! Inspect upon delivery and click confirm below.'}
                    {ord.status === 2 && 'Delivery confirmed. Smart contract transferred funds to seller.'}
                    {ord.status === 3 && 'Order is under dispute resolution by the platform arbitrator.'}
                    {ord.status === 4 && 'Payment was refunded to buyer wallet.'}
                  </div>

                  <div className="flex items-center space-x-2">
                    {/* Status 0 (Created): Allow cancel if timeout */}
                    {ord.status === 0 && (
                      <button
                        onClick={() => handleCancelOrder(ord.id)}
                        disabled={isProcessing}
                        className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
                      >
                        {isProcessing ? 'Processing...' : 'Request Auto-Refund'}
                      </button>
                    )}

                    {/* Status 1 (Shipped): Confirm Delivery & Release Escrow */}
                    {ord.status === 1 && (
                      <>
                        <button
                          onClick={() => setDisputeOrder(ord)}
                          disabled={isProcessing}
                          className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 transition"
                        >
                          Open Dispute
                        </button>
                        <button
                          onClick={() => handleConfirmDelivery(ord.id)}
                          disabled={isProcessing}
                          className="flex items-center space-x-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white shadow-md shadow-emerald-600/20 transition"
                        >
                          {isProcessing ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <CheckCircle2 className="w-3.5 h-3.5" />
                          )}
                          <span>Confirm Delivery & Release ETH</span>
                        </button>
                      </>
                    )}

                    {/* Status 2 (Delivered): Verified Review */}
                    {ord.status === 2 && !ord.reviewSubmitted && (
                      <button
                        onClick={() => setReviewOrder(ord)}
                        className="flex items-center space-x-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-600/20 transition"
                      >
                        <Star className="w-3.5 h-3.5 fill-current" />
                        <span>Leave Verified Review</span>
                      </button>
                    )}

                    {ord.status === 2 && ord.reviewSubmitted && (
                      <span className="inline-flex items-center space-x-1 text-xs font-mono text-emerald-400 bg-emerald-500/10 px-3 py-1.5 rounded-xl border border-emerald-500/20">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Review Submitted On-Chain</span>
                      </span>
                    )}
                  </div>
                </div>

              </div>
            );
          })}
        </div>
      )}

      {/* Review Submission Modal */}
      {reviewOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center space-x-2">
                <ShieldCheck className="w-5 h-5 text-indigo-400" />
                <h3 className="text-base font-bold text-white">Submit Verified On-Chain Review</h3>
              </div>
              <button onClick={() => setReviewOrder(null)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-400">
              Only buyers who have successfully completed Order #{reviewOrder.id} can submit this review.
            </p>

            <form onSubmit={handleSubmitReview} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">Rating</label>
                <div className="flex items-center space-x-2">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <button
                      type="button"
                      key={s}
                      onClick={() => setRating(s)}
                      className="p-1 focus:outline-none"
                    >
                      <Star
                        className={`w-6 h-6 ${
                          s <= rating ? 'text-amber-400 fill-amber-400' : 'text-slate-600'
                        }`}
                      />
                    </button>
                  ))}
                  <span className="text-xs font-mono text-amber-300 ml-2">{rating} of 5 Stars</span>
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">Review Comment</label>
                <textarea
                  rows={3}
                  required
                  placeholder="Share your experience regarding item authenticity, shipping speed, packaging..."
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="flex justify-end space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => setReviewOrder(null)}
                  className="px-4 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingId === reviewOrder.id}
                  className="flex items-center space-x-1.5 px-5 py-2 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white shadow-md"
                >
                  {submittingId === reviewOrder.id ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Send className="w-3.5 h-3.5" />
                  )}
                  <span>Publish to Blockchain</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Dispute Opening Modal */}
      {disputeOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center space-x-2">
                <AlertTriangle className="w-5 h-5 text-rose-400" />
                <h3 className="text-base font-bold text-white">Raise Dispute for Order #{disputeOrder.id}</h3>
              </div>
              <button onClick={() => setDisputeOrder(null)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-400">
              Opening a dispute locks the {disputeOrder.totalAmountEth} ETH in escrow. The platform arbitrator will inspect claims and evidence.
            </p>

            <form onSubmit={handleSubmitDispute} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">Reason for Dispute</label>
                <textarea
                  rows={3}
                  required
                  placeholder="Describe the issue (e.g., package not received, counterfeit item, damaged packaging)..."
                  value={disputeReason}
                  onChange={(e) => setDisputeReason(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-rose-500"
                />
              </div>

              <div className="flex justify-end space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => setDisputeOrder(null)}
                  className="px-4 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingId === disputeOrder.id}
                  className="flex items-center space-x-1.5 px-5 py-2 rounded-xl text-xs font-semibold bg-rose-600 hover:bg-rose-500 text-white shadow-md"
                >
                  {submittingId === disputeOrder.id ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <AlertTriangle className="w-3.5 h-3.5" />
                  )}
                  <span>Submit Dispute</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
