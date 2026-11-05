import React, { useState } from 'react';
import { useWeb3, HARDHAT_ACCOUNTS } from '../context/Web3Context';
import { 
  Scale, 
  AlertTriangle, 
  RotateCcw, 
  CheckCircle2, 
  ShieldAlert, 
  Coins, 
  ExternalLink,
  Loader2,
  UserCheck
} from 'lucide-react';

export default function DisputeCenter() {
  const { 
    orders, 
    products, 
    contract, 
    account, 
    contractOwner, 
    refreshData, 
    showNotification,
    switchDemoAccount 
  } = useWeb3();

  const [resolvingId, setResolvingId] = useState(null);

  // Filter disputed orders
  const disputedOrders = orders.filter((o) => o.status === 3);

  const getProduct = (productId) => products.find((p) => p.id === productId);

  // Check if current account is arbitrator / owner
  const isArbitrator = account && contractOwner && account.toLowerCase() === contractOwner.toLowerCase();

  const handleResolveDispute = async (orderId, refundBuyer) => {
    if (!contract) return;

    try {
      setResolvingId(orderId);
      const actionName = refundBuyer ? 'Refunding Buyer' : 'Releasing to Seller';
      showNotification('info', `Arbitration Decision: ${actionName}`, 'Executing smart contract dispute verdict...');

      const tx = await contract.resolveDispute(orderId, refundBuyer);
      await tx.wait();

      showNotification(
        'success',
        'Dispute Resolved on Blockchain',
        refundBuyer
          ? `Order #${orderId} was refunded to the buyer and product stock restored.`
          : `Escrow funds for Order #${orderId} were released to the seller.`
      );

      await refreshData();
    } catch (err) {
      console.error(err);
      showNotification('error', 'Resolution Failed', err.reason || err.message);
    } finally {
      setResolvingId(null);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center space-x-2">
            <Scale className="w-6 h-6 text-indigo-400" />
            <span>Multi-Party Dispute Resolution Center</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Impartial smart contract arbitration protecting against counterfeit goods, non-delivery, and payment fraud.
          </p>
        </div>

        {/* Arbitrator Status Badge */}
        <div className="flex items-center space-x-2">
          {isArbitrator ? (
            <div className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 text-xs font-mono">
              <ShieldAlert className="w-3.5 h-3.5" />
              <span>Connected as Chief Arbitrator</span>
            </div>
          ) : (
            <button
              onClick={() => switchDemoAccount(HARDHAT_ACCOUNTS[0])}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700 text-xs font-medium transition"
            >
              <UserCheck className="w-3.5 h-3.5 text-indigo-400" />
              <span>Switch to Arbitrator Account (Demo)</span>
            </button>
          )}
        </div>
      </div>

      {/* Disputed Orders List */}
      {disputedOrders.length === 0 ? (
        <div className="text-center py-20 bg-slate-900/40 rounded-3xl border border-slate-800">
          <CheckCircle2 className="w-12 h-12 text-emerald-500/60 mx-auto mb-3" />
          <h3 className="text-base font-semibold text-white">No active disputes</h3>
          <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
            All marketplace transactions are running smoothly. If a buyer or seller disputes an order, it will appear here for arbitration.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {disputedOrders.map((ord) => {
            const product = getProduct(ord.productId) || {
              name: `Product #${ord.productId}`,
              imageUrl: 'https://images.unsplash.com/photo-1621416894569-0f39ed31d247?auto=format&fit=crop&w=600&q=80',
            };
            const isProcessing = resolvingId === ord.id;

            return (
              <div
                key={ord.id}
                className="bg-slate-900/80 border border-rose-500/20 rounded-2xl p-6 space-y-6 shadow-xl relative overflow-hidden"
              >
                <div className="absolute top-0 right-0 w-32 h-32 bg-rose-500/5 rounded-full blur-2xl pointer-events-none"></div>

                {/* Top Bar */}
                <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-800">
                  <div className="flex items-center space-x-3">
                    <span className="font-mono font-bold text-sm text-white">
                      Disputed Case #DISP-{ord.id}
                    </span>
                    <span className="text-xs font-mono text-slate-400">
                      Target Order #{ord.id}
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="inline-flex items-center space-x-1.5 text-xs font-mono px-3 py-1 rounded-full bg-rose-500/10 text-rose-300 border border-rose-500/30">
                      <AlertTriangle className="w-3.5 h-3.5" />
                      <span>Action Required</span>
                    </span>
                  </div>
                </div>

                {/* Dispute Details */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  
                  {/* Left: Product & Escrow info */}
                  <div className="flex items-center space-x-4 bg-slate-950/70 p-4 rounded-xl border border-slate-800">
                    <img
                      src={product.imageUrl}
                      alt={product.name}
                      className="w-14 h-14 rounded-lg object-cover border border-slate-800 flex-shrink-0"
                    />
                    <div>
                      <h4 className="font-bold text-white text-sm">{product.name}</h4>
                      <div className="text-xs font-mono text-indigo-300 mt-1">
                        Locked Amount: <span className="font-bold">{ord.totalAmountEth} ETH</span>
                      </div>
                      <div className="text-[10px] text-slate-500 font-mono mt-0.5">
                        Buyer: {ord.buyer.slice(0, 6)}...{ord.buyer.slice(-4)} | Seller: {ord.seller.slice(0, 6)}...{ord.seller.slice(-4)}
                      </div>
                    </div>
                  </div>

                  {/* Right: Initiator & Statement */}
                  <div className="bg-rose-950/20 border border-rose-500/20 p-4 rounded-xl space-y-1">
                    <div className="text-[10px] uppercase font-mono text-rose-400 font-bold">
                      Claim Reason Filed
                    </div>
                    <p className="text-xs text-slate-200 italic leading-relaxed">
                      "{ord.dispute?.reason || 'Product not as described or undelivered'}"
                    </p>
                    {ord.trackingInfo && (
                      <div className="text-[11px] text-slate-400 font-mono pt-1">
                        Seller Tracking Provided: <span className="text-indigo-300">{ord.trackingInfo}</span>
                      </div>
                    )}
                  </div>

                </div>

                {/* Arbitrator Actions */}
                <div className="pt-4 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3">
                  <div className="text-xs text-slate-400">
                    {isArbitrator ? (
                      <span>Select a binding verdict. Smart contract will execute transfers atomically.</span>
                    ) : (
                      <span className="text-amber-300/80">
                        Read-only: Connect as Platform Arbitrator to render an on-chain verdict.
                      </span>
                    )}
                  </div>

                  <div className="flex items-center space-x-3">
                    <button
                      onClick={() => handleResolveDispute(ord.id, true)}
                      disabled={isProcessing || !isArbitrator}
                      className="flex items-center space-x-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-rose-600 hover:bg-rose-500 text-white shadow-md disabled:opacity-40 transition"
                    >
                      {isProcessing ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <RotateCcw className="w-3.5 h-3.5" />
                      )}
                      <span>Refund Buyer ({ord.totalAmountEth} ETH)</span>
                    </button>

                    <button
                      onClick={() => handleResolveDispute(ord.id, false)}
                      disabled={isProcessing || !isArbitrator}
                      className="flex items-center space-x-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white shadow-md disabled:opacity-40 transition"
                    >
                      {isProcessing ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <CheckCircle2 className="w-3.5 h-3.5" />
                      )}
                      <span>Release to Seller ({ord.totalAmountEth} ETH)</span>
                    </button>
                  </div>
                </div>

              </div>
            );
          })}
        </div>
      )}

    </div>
  );
}
