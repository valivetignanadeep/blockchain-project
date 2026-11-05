import React, { useState } from 'react';
import { useWeb3 } from '../context/Web3Context';
import { ethers } from 'ethers';
import { 
  ShieldCheck, 
  Lock, 
  Truck, 
  CheckCircle2, 
  AlertTriangle, 
  X, 
  Coins, 
  ArrowRight,
  Loader2 
} from 'lucide-react';

export default function BuyModal({ product, onClose, onPurchaseSuccess }) {
  const { contract, account, refreshData, showNotification } = useWeb3();
  const [quantity, setQuantity] = useState(1);
  const [submitting, setSubmitting] = useState(false);

  if (!product) return null;

  const unitPriceWei = BigInt(product.price);
  const totalCostWei = unitPriceWei * BigInt(quantity);
  const totalCostEth = ethers.formatEther(totalCostWei);

  const handlePurchase = async () => {
    if (!contract) {
      showNotification('error', 'Wallet Not Connected', 'Please connect MetaMask or choose a Demo Persona in Navbar.');
      return;
    }

    try {
      setSubmitting(true);
      showNotification('info', 'Submitting Escrow Transaction', 'Please confirm the purchase in your wallet...');

      const tx = await contract.purchaseProduct(product.id, quantity, {
        value: totalCostWei,
      });

      showNotification('info', 'Transaction Pending', `Mining on-chain: ${tx.hash.slice(0, 10)}...`, tx.hash);
      const receipt = await tx.wait();

      showNotification(
        'success',
        'Funds Locked in Escrow!',
        `Successfully purchased ${quantity}x ${product.name}. Funds are safely held until you confirm delivery.`,
        receipt.hash
      );

      await refreshData();
      onPurchaseSuccess();
      onClose();
    } catch (err) {
      console.error(err);
      const msg = err.reason || err.shortMessage || err.message || 'Transaction reverted';
      showNotification('error', 'Purchase Failed', msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-xl w-full overflow-hidden shadow-2xl">
        
        {/* Header */}
        <div className="p-6 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-indigo-500/10 rounded-xl text-indigo-400 border border-indigo-500/20">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">Smart Contract Escrow Checkout</h3>
              <p className="text-xs text-slate-400">Zero-Trust Purchase Protection</p>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="text-slate-400 hover:text-white transition"
            disabled={submitting}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-6">
          
          {/* Selected Product summary */}
          <div className="flex items-center space-x-4 bg-slate-950/60 p-4 rounded-xl border border-slate-800/80">
            <img 
              src={product.imageUrl} 
              alt={product.name} 
              className="w-16 h-16 rounded-lg object-cover border border-slate-800 flex-shrink-0" 
            />
            <div className="flex-1 min-w-0">
              <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-400">
                {product.category}
              </span>
              <h4 className="text-sm font-semibold text-white truncate mt-1">{product.name}</h4>
              <div className="text-xs font-mono text-indigo-300 mt-1">
                {product.priceEth} ETH <span className="text-slate-500 font-sans">per unit</span>
              </div>
            </div>
          </div>

          {/* Educational Escrow Flow Diagram */}
          <div className="bg-gradient-to-br from-indigo-950/30 to-slate-950 p-4 rounded-xl border border-indigo-500/20">
            <div className="text-xs font-semibold text-indigo-300 uppercase tracking-wider mb-3 flex items-center space-x-1.5">
              <Lock className="w-3.5 h-3.5" />
              <span>How Blockchain Escrow Protects You:</span>
            </div>
            <div className="grid grid-cols-3 gap-2 text-center text-[11px]">
              <div className="bg-slate-900/80 p-2.5 rounded-lg border border-slate-800">
                <Coins className="w-4 h-4 mx-auto text-amber-400 mb-1" />
                <span className="font-semibold text-slate-200 block">1. Escrow Lock</span>
                <span className="text-slate-400 text-[10px]">Your ETH is locked in contract, not sent to seller.</span>
              </div>
              <div className="bg-slate-900/80 p-2.5 rounded-lg border border-slate-800">
                <Truck className="w-4 h-4 mx-auto text-indigo-400 mb-1" />
                <span className="font-semibold text-slate-200 block">2. Seller Ships</span>
                <span className="text-slate-400 text-[10px]">Seller dispatches item with tracking proof.</span>
              </div>
              <div className="bg-slate-900/80 p-2.5 rounded-lg border border-slate-800">
                <CheckCircle2 className="w-4 h-4 mx-auto text-emerald-400 mb-1" />
                <span className="font-semibold text-slate-200 block">3. Confirmation</span>
                <span className="text-slate-400 text-[10px]">You inspect & approve to release ETH to seller.</span>
              </div>
            </div>
          </div>

          {/* Quantity Selector */}
          <div className="flex items-center justify-between">
            <span className="text-sm text-slate-300 font-medium">Quantity (Stock: {product.stock})</span>
            <div className="flex items-center space-x-2 bg-slate-950 border border-slate-800 rounded-lg p-1">
              <button
                type="button"
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                className="w-8 h-8 rounded bg-slate-900 hover:bg-slate-800 text-slate-200 flex items-center justify-center font-bold"
                disabled={submitting || quantity <= 1}
              >
                -
              </button>
              <span className="w-10 text-center font-mono text-sm text-white font-semibold">
                {quantity}
              </span>
              <button
                type="button"
                onClick={() => setQuantity(Math.min(product.stock, quantity + 1))}
                className="w-8 h-8 rounded bg-slate-900 hover:bg-slate-800 text-slate-200 flex items-center justify-center font-bold"
                disabled={submitting || quantity >= product.stock}
              >
                +
              </button>
            </div>
          </div>

          {/* Pricing Calculation */}
          <div className="border-t border-slate-800/80 pt-4 space-y-2">
            <div className="flex justify-between text-xs text-slate-400">
              <span>Unit Price</span>
              <span className="font-mono">{product.priceEth} ETH</span>
            </div>
            <div className="flex justify-between text-xs text-slate-400">
              <span>Smart Contract Escrow Fee</span>
              <span className="text-emerald-400 font-mono">0.000 ETH (Free)</span>
            </div>
            <div className="flex justify-between text-sm font-semibold text-white pt-2 border-t border-slate-800">
              <span>Total Payable to Escrow</span>
              <span className="font-mono text-indigo-300 text-base">{totalCostEth} ETH</span>
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="p-6 bg-slate-950/60 border-t border-slate-800 flex items-center justify-end space-x-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl text-sm font-medium text-slate-400 hover:text-white transition"
            disabled={submitting}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handlePurchase}
            disabled={submitting || product.stock === 0}
            className="flex items-center space-x-2 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white text-sm font-semibold px-6 py-2.5 rounded-xl shadow-lg shadow-indigo-600/30 transition disabled:opacity-50"
          >
            {submitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Confirming on Chain...</span>
              </>
            ) : (
              <>
                <Lock className="w-4 h-4" />
                <span>Lock {totalCostEth} ETH in Escrow</span>
              </>
            )}
          </button>
        </div>

      </div>
    </div>
  );
}
