import React from 'react';
import { useWeb3 } from '../context/Web3Context';
import contractInfo from '../contracts/EcommerceStore.json';
import { 
  Activity, 
  Layers, 
  Cpu, 
  Coins, 
  ExternalLink, 
  FileCode, 
  ShieldCheck, 
  RefreshCw 
} from 'lucide-react';

export default function BlockchainExplorer() {
  const { eventLogs, stats, contractOwner, chainId, refreshData } = useWeb3();

  const eventColorMap = {
    ProductListed: 'text-indigo-400 bg-indigo-500/10 border-indigo-500/20',
    OrderCreated: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
    OrderShipped: 'text-sky-400 bg-sky-500/10 border-sky-500/20',
    OrderDelivered: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
    OrderRefunded: 'text-slate-400 bg-slate-500/10 border-slate-500/20',
    DisputeOpened: 'text-rose-400 bg-rose-500/10 border-rose-500/20',
    DisputeResolved: 'text-purple-400 bg-purple-500/10 border-purple-500/20',
    ReviewSubmitted: 'text-amber-300 bg-amber-500/10 border-amber-500/20',
  };

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center space-x-2">
            <Activity className="w-6 h-6 text-indigo-400" />
            <span>On-Chain Ledger & Activity Explorer</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Real-time verification of smart contract events, state changes, and transaction hashes.
          </p>
        </div>
        <button
          onClick={refreshData}
          className="flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 text-xs font-medium transition self-start md:self-auto"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Sync State</span>
        </button>
      </div>

      {/* Contract Architecture Metadata Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-slate-900/60 p-4 rounded-2xl border border-slate-800">
          <div className="flex items-center space-x-2 text-slate-400 text-xs mb-1">
            <FileCode className="w-4 h-4 text-indigo-400" />
            <span>Smart Contract Address</span>
          </div>
          <div className="font-mono text-xs font-bold text-white truncate">
            {contractInfo.address}
          </div>
          <div className="text-[10px] text-slate-500 font-mono mt-1">
            Solidity v0.8.24 (OpenZeppelin ReentrancyGuard)
          </div>
        </div>

        <div className="bg-slate-900/60 p-4 rounded-2xl border border-slate-800">
          <div className="flex items-center space-x-2 text-slate-400 text-xs mb-1">
            <Cpu className="w-4 h-4 text-emerald-400" />
            <span>Active Network / Consensus</span>
          </div>
          <div className="font-mono text-xs font-bold text-emerald-400">
            Chain ID: {chainId || 31337} (Localhost / Hardhat EVM)
          </div>
          <div className="text-[10px] text-slate-500 font-mono mt-1">
            RPC Target: http://127.0.0.1:8545
          </div>
        </div>

        <div className="bg-slate-900/60 p-4 rounded-2xl border border-slate-800">
          <div className="flex items-center space-x-2 text-slate-400 text-xs mb-1">
            <ShieldCheck className="w-4 h-4 text-purple-400" />
            <span>Chief Arbitrator (Contract Owner)</span>
          </div>
          <div className="font-mono text-xs font-bold text-purple-300 truncate">
            {contractOwner || '0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266'}
          </div>
          <div className="text-[10px] text-slate-500 font-mono mt-1">
            Authorized to arbitrate disputed escrows
          </div>
        </div>
      </div>

      {/* Live Event Stream Table */}
      <div className="space-y-4">
        <h3 className="text-lg font-bold text-white flex items-center space-x-2">
          <Layers className="w-5 h-5 text-indigo-400" />
          <span>Real-Time Smart Contract Event Feed</span>
        </h3>

        {eventLogs.length === 0 ? (
          <div className="p-8 rounded-2xl bg-slate-900/40 border border-slate-800 text-center space-y-2">
            <Activity className="w-8 h-8 text-slate-600 mx-auto" />
            <div className="text-sm font-semibold text-slate-300">Listening for On-Chain Events...</div>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              Any action taken in the marketplace (purchases, shipping, delivery confirmation, reviews) automatically broadcasts an EVM event log here.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-900/50">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950 text-slate-400 uppercase font-mono text-[10px] border-b border-slate-800">
                <tr>
                  <th className="p-4">Event Signature</th>
                  <th className="p-4">Block #</th>
                  <th className="p-4">Transaction Hash</th>
                  <th className="p-4">Time</th>
                  <th className="p-4">Decoded Log Parameters</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono">
                {eventLogs.map((log, idx) => {
                  const badgeClass = eventColorMap[log.name] || 'text-slate-300 bg-slate-800';
                  return (
                    <tr key={idx} className="hover:bg-slate-800/30 transition">
                      <td className="p-4">
                        <span className={`inline-flex px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${badgeClass}`}>
                          {log.name}
                        </span>
                      </td>
                      <td className="p-4 text-slate-400">#{log.blockNumber}</td>
                      <td className="p-4 text-indigo-300">
                        {log.txHash.length > 18 ? `${log.txHash.slice(0, 10)}...${log.txHash.slice(-8)}` : log.txHash}
                      </td>
                      <td className="p-4 text-slate-400">{log.timestamp}</td>
                      <td className="p-4 text-slate-300 text-[11px] max-w-xs truncate">
                        {JSON.stringify(log.params)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
}
