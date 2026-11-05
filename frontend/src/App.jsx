import React, { useState } from 'react';
import { Web3Provider, useWeb3 } from './context/Web3Context';
import Navbar from './components/Navbar';
import ProductCatalog from './components/ProductCatalog';
import BuyerOrders from './components/BuyerOrders';
import SellerDashboard from './components/SellerDashboard';
import DisputeCenter from './components/DisputeCenter';
import BlockchainExplorer from './components/BlockchainExplorer';
import NotificationToast from './components/NotificationToast';
import { ShieldCheck, Lock, Cpu, Github, ExternalLink } from 'lucide-react';

function MainContent() {
  const [activeTab, setActiveTab] = useState('catalog');

  return (
    <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100">
      
      {/* Navigation */}
      <Navbar activeTab={activeTab} setActiveTab={setActiveTab} />

      {/* Main View Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'catalog' && (
          <ProductCatalog onSelectOrderTab={() => setActiveTab('buyer-orders')} />
        )}
        {activeTab === 'buyer-orders' && <BuyerOrders />}
        {activeTab === 'seller-portal' && <SellerDashboard />}
        {activeTab === 'disputes' && <DisputeCenter />}
        {activeTab === 'explorer' && <BlockchainExplorer />}
      </main>

      {/* Global Notifications */}
      <NotificationToast />

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950 py-8 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <div className="flex items-center space-x-2">
            <ShieldCheck className="w-4 h-4 text-indigo-400" />
            <span className="font-semibold text-slate-400">
              Blockchain-Based Secure E-Commerce Transaction System
            </span>
            <span>•</span>
            <span>Cryptocurrency & Blockchain Course Capstone</span>
          </div>

          <div className="flex items-center space-x-6 font-mono text-[11px]">
            <span className="flex items-center space-x-1 text-slate-400">
              <Lock className="w-3 h-3 text-emerald-400" />
              <span>Escrow Protected</span>
            </span>
            <span className="flex items-center space-x-1 text-slate-400">
              <Cpu className="w-3 h-3 text-indigo-400" />
              <span>Solidity 0.8.24</span>
            </span>
          </div>
        </div>
      </footer>

    </div>
  );
}

export default function App() {
  return (
    <Web3Provider>
      <MainContent />
    </Web3Provider>
  );
}
