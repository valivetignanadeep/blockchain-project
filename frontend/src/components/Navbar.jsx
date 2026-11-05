import React from 'react';
import { useWeb3, HARDHAT_ACCOUNTS } from '../context/Web3Context';
import { 
  ShieldCheck, 
  Wallet, 
  Store, 
  ShoppingBag, 
  Scale, 
  Activity, 
  UserCheck, 
  ChevronDown, 
  ExternalLink,
  Coins
} from 'lucide-react';

export default function Navbar({ activeTab, setActiveTab }) {
  const { 
    account, 
    balance, 
    chainId, 
    isDemoMode, 
    selectedDemoAccount, 
    activeRole, 
    connectMetaMask, 
    switchDemoAccount, 
    stats 
  } = useWeb3();

  const navItems = [
    { id: 'catalog', label: 'Marketplace', icon: Store },
    { id: 'buyer-orders', label: 'My Orders', icon: ShoppingBag },
    { id: 'seller-portal', label: 'Seller Portal', icon: Store },
    { id: 'disputes', label: 'Dispute Center', icon: Scale },
    { id: 'explorer', label: 'Blockchain Explorer', icon: Activity },
  ];

  return (
    <header className="sticky top-0 z-40 border-b border-slate-800 bg-slate-950/80 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Logo & Brand */}
          <div className="flex items-center space-x-3 cursor-pointer" onClick={() => setActiveTab('catalog')}>
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <ShieldCheck className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-extrabold text-xl tracking-tight bg-gradient-to-r from-white via-slate-100 to-indigo-300 bg-clip-text text-transparent">
                  ChainStore
                </span>
                <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                  Escrow v2
                </span>
              </div>
              <p className="text-[11px] text-slate-400 hidden sm:block">Zero-Trust E-Commerce Protocol</p>
            </div>
          </div>

          {/* Navigation Tabs */}
          <nav className="hidden md:flex items-center space-x-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`flex items-center space-x-2 px-3.5 py-2 rounded-lg text-sm font-medium transition-all ${
                    isActive
                      ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                      : 'text-slate-400 hover:text-white hover:bg-slate-900'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>

          {/* Wallet & Quick Role Switcher */}
          <div className="flex items-center space-x-3">
            
            {/* Hardhat Demo Persona Switcher (For easy course evaluation) */}
            <div className="relative group">
              <div className="flex items-center space-x-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-700 text-xs px-2.5 py-1.5 rounded-lg cursor-pointer transition">
                <UserCheck className="w-3.5 h-3.5 text-indigo-400" />
                <span className="text-slate-300 font-medium hidden lg:inline">
                  {isDemoMode ? selectedDemoAccount.label.split(' ')[0] : 'Simulate Role'}
                </span>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              </div>

              {/* Dropdown Menu */}
              <div className="absolute right-0 mt-2 w-64 bg-slate-900 border border-slate-800 rounded-xl shadow-2xl p-2 hidden group-hover:block z-50">
                <div className="text-[10px] font-semibold uppercase text-slate-500 px-2 py-1">
                  Switch Demo Persona (Localhost)
                </div>
                {HARDHAT_ACCOUNTS.map((acc) => (
                  <button
                    key={acc.address}
                    onClick={() => {
                      switchDemoAccount(acc);
                      if (acc.role === 'buyer') setActiveTab('buyer-orders');
                      if (acc.role === 'seller') setActiveTab('seller-portal');
                      if (acc.role === 'arbitrator') setActiveTab('disputes');
                    }}
                    className={`w-full text-left p-2 rounded-lg text-xs flex items-center justify-between transition ${
                      account.toLowerCase() === acc.address.toLowerCase()
                        ? 'bg-indigo-600/20 text-indigo-300 border border-indigo-500/30'
                        : 'text-slate-300 hover:bg-slate-800'
                    }`}
                  >
                    <div>
                      <div className="font-medium">{acc.label}</div>
                      <div className="text-[10px] text-slate-500 font-mono">
                        {acc.address.slice(0, 6)}...{acc.address.slice(-4)}
                      </div>
                    </div>
                    {account.toLowerCase() === acc.address.toLowerCase() && (
                      <span className="w-2 h-2 rounded-full bg-indigo-400"></span>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Wallet Connect or Account Badge */}
            {account ? (
              <div className="flex items-center space-x-2 bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5">
                <div className="hidden sm:flex items-center space-x-1.5 text-xs text-slate-300 font-mono pr-2 border-r border-slate-800">
                  <Coins className="w-3.5 h-3.5 text-amber-400" />
                  <span>{parseFloat(balance).toFixed(3)} ETH</span>
                </div>
                <div className="flex items-center space-x-1.5 text-xs">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                  <span className="font-mono text-slate-300">
                    {account.slice(0, 6)}...{account.slice(-4)}
                  </span>
                </div>
              </div>
            ) : (
              <button
                onClick={connectMetaMask}
                className="flex items-center space-x-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold px-3.5 py-2 rounded-xl shadow-md shadow-indigo-600/20 transition"
              >
                <Wallet className="w-3.5 h-3.5" />
                <span>Connect MetaMask</span>
              </button>
            )}

          </div>
        </div>

        {/* Mobile Tab Bar */}
        <div className="md:hidden flex items-center justify-around py-2 border-t border-slate-800/80 overflow-x-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`flex flex-col items-center py-1 px-2 text-[11px] font-medium ${
                  isActive ? 'text-indigo-400' : 'text-slate-400'
                }`}
              >
                <Icon className="w-4 h-4 mb-0.5" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </header>
  );
}
