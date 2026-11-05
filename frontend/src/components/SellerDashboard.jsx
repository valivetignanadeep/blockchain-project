import React, { useState } from 'react';
import { useWeb3 } from '../context/Web3Context';
import { ethers } from 'ethers';
import { 
  PlusCircle, 
  Package, 
  Truck, 
  CheckCircle2, 
  Clock, 
  Edit3, 
  ToggleLeft, 
  ToggleRight, 
  Coins, 
  ExternalLink,
  X,
  Loader2,
  Sparkles
} from 'lucide-react';

export default function SellerDashboard() {
  const { products, orders, contract, account, refreshData, showNotification } = useWeb3();
  const [showAddModal, setShowAddModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Ship Order Modal state
  const [shippingOrder, setShippingOrder] = useState(null);
  const [trackingNumber, setTrackingNumber] = useState('');

  // Stock update state
  const [editingStockId, setEditingStockId] = useState(null);
  const [newStockVal, setNewStockVal] = useState('');

  // New Product Form state
  const [form, setForm] = useState({
    name: '',
    category: 'Hardware',
    description: '',
    imageUrl: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=600&q=80',
    priceEth: '0.05',
    stock: '10',
  });

  // Filter products for this seller (or all if not connected / demo)
  const myProducts = products.filter((p) => {
    if (!account) return true;
    return p.seller.toLowerCase() === account.toLowerCase();
  });

  // Filter incoming orders for this seller
  const incomingOrders = orders.filter((o) => {
    if (!account) return true;
    return o.seller.toLowerCase() === account.toLowerCase();
  });

  // Calculate earnings
  const completedOrders = incomingOrders.filter((o) => o.status === 2);
  const totalEarnedEth = completedOrders.reduce(
    (sum, o) => sum + parseFloat(o.totalAmountEth),
    0
  );

  // 1. List Product
  const handleListProduct = async (e) => {
    e.preventDefault();
    if (!contract) {
      showNotification('error', 'Wallet Not Connected', 'Please connect MetaMask or choose a seller account.');
      return;
    }

    try {
      setSubmitting(true);
      const priceWei = ethers.parseEther(form.priceEth);
      const stockNum = parseInt(form.stock, 10);

      showNotification('info', 'Publishing Product', 'Submitting transaction to blockchain...');
      const tx = await contract.listProduct(
        form.name,
        form.category,
        form.description,
        form.imageUrl,
        priceWei,
        stockNum
      );
      await tx.wait();

      showNotification('success', 'Product Listed!', `${form.name} is now available on the decentralized store.`);
      setShowAddModal(false);
      setForm({
        name: '',
        category: 'Hardware',
        description: '',
        imageUrl: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=600&q=80',
        priceEth: '0.05',
        stock: '10',
      });
      await refreshData();
    } catch (err) {
      console.error(err);
      showNotification('error', 'Listing Failed', err.reason || err.message);
    } finally {
      setSubmitting(false);
    }
  };

  // 2. Ship Order
  const handleShipOrder = async (e) => {
    e.preventDefault();
    if (!contract || !shippingOrder || !trackingNumber) return;

    try {
      setSubmitting(true);
      showNotification('info', 'Dispatching Order', 'Recording shipping tracking info on-chain...');
      const tx = await contract.shipOrder(shippingOrder.id, trackingNumber);
      await tx.wait();

      showNotification('success', 'Order Marked Shipped!', `Tracking #${trackingNumber} recorded.`);
      setShippingOrder(null);
      setTrackingNumber('');
      await refreshData();
    } catch (err) {
      console.error(err);
      showNotification('error', 'Shipping Failed', err.reason || err.message);
    } finally {
      setSubmitting(false);
    }
  };

  // 3. Update Stock
  const handleUpdateStock = async (productId) => {
    if (!contract || !newStockVal) return;
    try {
      const stockNum = parseInt(newStockVal, 10);
      showNotification('info', 'Updating Stock', 'Modifying on-chain inventory...');
      const tx = await contract.updateProductStock(productId, stockNum);
      await tx.wait();
      showNotification('success', 'Stock Updated', `Product #${productId} stock updated to ${stockNum}`);
      setEditingStockId(null);
      setNewStockVal('');
      await refreshData();
    } catch (err) {
      console.error(err);
      showNotification('error', 'Stock Update Failed', err.reason || err.message);
    }
  };

  // 4. Toggle Product Status
  const handleToggleStatus = async (productId) => {
    if (!contract) return;
    try {
      showNotification('info', 'Updating Listing Status', 'Sending transaction...');
      const tx = await contract.toggleProductStatus(productId);
      await tx.wait();
      showNotification('success', 'Status Changed', 'Product visibility toggled successfully.');
      await refreshData();
    } catch (err) {
      console.error(err);
      showNotification('error', 'Status Toggle Failed', err.reason || err.message);
    }
  };

  return (
    <div className="space-y-8">
      
      {/* Top Banner & Stats */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-800">
        <div>
          <h2 className="text-2xl font-bold text-white">Merchant & Seller Portal</h2>
          <p className="text-xs text-slate-400 mt-1">
            Manage your decentralized inventory, fulfill incoming orders, and track settled escrow revenue.
          </p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center space-x-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold px-4 py-2.5 rounded-xl shadow-lg shadow-indigo-600/20 transition self-start md:self-auto"
        >
          <PlusCircle className="w-4 h-4" />
          <span>List New Product</span>
        </button>
      </div>

      {/* Seller Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-slate-900/60 p-5 rounded-2xl border border-slate-800">
          <div className="flex items-center space-x-2 text-slate-400 text-xs mb-1">
            <Package className="w-4 h-4 text-indigo-400" />
            <span>My Listed Products</span>
          </div>
          <div className="text-2xl font-bold font-mono text-white">{myProducts.length}</div>
        </div>

        <div className="bg-slate-900/60 p-5 rounded-2xl border border-slate-800">
          <div className="flex items-center space-x-2 text-slate-400 text-xs mb-1">
            <Truck className="w-4 h-4 text-amber-400" />
            <span>Orders to Fulfill</span>
          </div>
          <div className="text-2xl font-bold font-mono text-amber-300">
            {incomingOrders.filter((o) => o.status === 0).length}
          </div>
        </div>

        <div className="bg-slate-900/60 p-5 rounded-2xl border border-slate-800">
          <div className="flex items-center space-x-2 text-slate-400 text-xs mb-1">
            <Coins className="w-4 h-4 text-emerald-400" />
            <span>Escrow Revenue Settled</span>
          </div>
          <div className="text-2xl font-bold font-mono text-emerald-400">
            {totalEarnedEth.toFixed(3)} <span className="text-xs font-sans text-slate-400">ETH</span>
          </div>
        </div>
      </div>

      {/* Incoming Orders Table */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold text-white flex items-center space-x-2">
            <Truck className="w-5 h-5 text-indigo-400" />
            <span>Incoming Store Orders ({incomingOrders.length})</span>
          </h3>
        </div>

        {incomingOrders.length === 0 ? (
          <div className="text-center py-12 bg-slate-900/40 rounded-2xl border border-slate-800">
            <p className="text-xs text-slate-400">No incoming orders for your products yet.</p>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-900/50">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950 text-slate-400 uppercase font-mono text-[10px] border-b border-slate-800">
                <tr>
                  <th className="p-4">Order ID</th>
                  <th className="p-4">Product ID</th>
                  <th className="p-4">Buyer Address</th>
                  <th className="p-4">Qty</th>
                  <th className="p-4">Escrow Value</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {incomingOrders.map((ord) => (
                  <tr key={ord.id} className="hover:bg-slate-800/30 transition">
                    <td className="p-4 font-mono font-bold text-white">#{ord.id}</td>
                    <td className="p-4 font-mono text-slate-400">Product #{ord.productId}</td>
                    <td className="p-4 font-mono text-indigo-300">
                      {ord.buyer.slice(0, 6)}...{ord.buyer.slice(-4)}
                    </td>
                    <td className="p-4 font-mono">{ord.quantity}</td>
                    <td className="p-4 font-mono font-bold text-white">{ord.totalAmountEth} ETH</td>
                    <td className="p-4">
                      {ord.status === 0 && (
                        <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20">
                          Awaiting Dispatch
                        </span>
                      )}
                      {ord.status === 1 && (
                        <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                          Shipped: {ord.trackingInfo}
                        </span>
                      )}
                      {ord.status === 2 && (
                        <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                          Completed (Paid)
                        </span>
                      )}
                      {ord.status === 3 && (
                        <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/20">
                          Disputed
                        </span>
                      )}
                      {ord.status === 4 && (
                        <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-slate-500/10 text-slate-400 border border-slate-500/20">
                          Refunded
                        </span>
                      )}
                    </td>
                    <td className="p-4 text-right">
                      {ord.status === 0 && (
                        <button
                          onClick={() => setShippingOrder(ord)}
                          className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white transition shadow-sm"
                        >
                          Ship Order
                        </button>
                      )}
                      {ord.status === 1 && (
                        <span className="text-[11px] text-slate-500">Waiting Delivery</span>
                      )}
                      {ord.status === 2 && (
                        <span className="text-[11px] text-emerald-400 font-semibold">Funds Released</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* My Products Table */}
      <div className="space-y-4">
        <h3 className="text-lg font-bold text-white flex items-center space-x-2">
          <Package className="w-5 h-5 text-indigo-400" />
          <span>My Store Inventory</span>
        </h3>

        <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-900/50">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950 text-slate-400 uppercase font-mono text-[10px] border-b border-slate-800">
              <tr>
                <th className="p-4">Item</th>
                <th className="p-4">Category</th>
                <th className="p-4">Price (ETH)</th>
                <th className="p-4">Stock</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {myProducts.map((p) => (
                <tr key={p.id} className="hover:bg-slate-800/30 transition">
                  <td className="p-4 flex items-center space-x-3">
                    <img
                      src={p.imageUrl}
                      alt={p.name}
                      className="w-10 h-10 rounded-lg object-cover border border-slate-800"
                    />
                    <div>
                      <div className="font-semibold text-white">{p.name}</div>
                      <div className="text-[10px] text-slate-500">ID #{p.id}</div>
                    </div>
                  </td>
                  <td className="p-4 font-mono">{p.category}</td>
                  <td className="p-4 font-mono font-bold text-white">{p.priceEth} ETH</td>
                  <td className="p-4 font-mono">
                    {editingStockId === p.id ? (
                      <div className="flex items-center space-x-1">
                        <input
                          type="number"
                          className="w-16 bg-slate-950 border border-slate-700 rounded px-2 py-1 text-white text-xs"
                          placeholder={p.stock.toString()}
                          value={newStockVal}
                          onChange={(e) => setNewStockVal(e.target.value)}
                        />
                        <button
                          onClick={() => handleUpdateStock(p.id)}
                          className="text-xs text-indigo-400 hover:text-indigo-300 font-bold"
                        >
                          Save
                        </button>
                      </div>
                    ) : (
                      <span className="flex items-center space-x-2">
                        <span>{p.stock}</span>
                        <button
                          onClick={() => {
                            setEditingStockId(p.id);
                            setNewStockVal(p.stock.toString());
                          }}
                          className="text-slate-500 hover:text-slate-300"
                        >
                          <Edit3 className="w-3 h-3" />
                        </button>
                      </span>
                    )}
                  </td>
                  <td className="p-4">
                    <button
                      onClick={() => handleToggleStatus(p.id)}
                      className="flex items-center space-x-1 text-xs"
                    >
                      {p.isActive ? (
                        <span className="text-emerald-400 font-medium">Active</span>
                      ) : (
                        <span className="text-slate-500 font-medium">Inactive</span>
                      )}
                    </button>
                  </td>
                  <td className="p-4 text-right">
                    <button
                      onClick={() => handleToggleStatus(p.id)}
                      className="text-xs text-slate-400 hover:text-white"
                    >
                      {p.isActive ? 'Deactivate' : 'Activate'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* List Product Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white flex items-center space-x-2">
                <PlusCircle className="w-5 h-5 text-indigo-400" />
                <span>List New Product on Blockchain</span>
              </h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleListProduct} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">Product Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. YubiKey 5C NFC Security Key"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">Category</label>
                  <select
                    value={form.category}
                    onChange={(e) => setForm({ ...form, category: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-indigo-500"
                  >
                    <option value="Security">Security</option>
                    <option value="Electronics">Electronics</option>
                    <option value="Hardware">Hardware</option>
                    <option value="Apparel">Apparel</option>
                    <option value="Services">Services</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">Initial Stock</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={form.stock}
                    onChange={(e) => setForm({ ...form, stock: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">Price (ETH)</label>
                <input
                  type="text"
                  required
                  placeholder="0.05"
                  value={form.priceEth}
                  onChange={(e) => setForm({ ...form, priceEth: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white font-mono focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">Image URL / IPFS Hash</label>
                <input
                  type="text"
                  required
                  value={form.imageUrl}
                  onChange={(e) => setForm({ ...form, imageUrl: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white font-mono focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">Description</label>
                <textarea
                  rows={3}
                  required
                  placeholder="Technical specs, warranty details, cryptographic features..."
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="flex justify-end space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex items-center space-x-1.5 px-5 py-2 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white shadow-md"
                >
                  {submitting ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Sparkles className="w-3.5 h-3.5" />
                  )}
                  <span>Publish Listing</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Ship Order Modal */}
      {shippingOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white flex items-center space-x-2">
                <Truck className="w-5 h-5 text-indigo-400" />
                <span>Dispatch Order #{shippingOrder.id}</span>
              </h3>
              <button onClick={() => setShippingOrder(null)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-400">
              Provide courier tracking number or IPFS shipping proof for the buyer.
            </p>

            <form onSubmit={handleShipOrder} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  Courier Tracking # / Hash
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. DHL-EXPRESS-771928"
                  value={trackingNumber}
                  onChange={(e) => setTrackingNumber(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white font-mono focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="flex justify-end space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShippingOrder(null)}
                  className="px-4 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex items-center space-x-1.5 px-5 py-2 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white shadow-md"
                >
                  {submitting ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Truck className="w-3.5 h-3.5" />
                  )}
                  <span>Confirm Shipment</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
