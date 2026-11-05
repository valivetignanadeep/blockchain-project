import React from 'react';
import { useWeb3 } from '../context/Web3Context';
import { CheckCircle2, AlertCircle, Info, ExternalLink, X } from 'lucide-react';

export default function NotificationToast() {
  const { notification, showNotification } = useWeb3();

  if (!notification) return null;

  const icons = {
    success: <CheckCircle2 className="w-5 h-5 text-emerald-400" />,
    error: <AlertCircle className="w-5 h-5 text-rose-400" />,
    info: <Info className="w-5 h-5 text-indigo-400" />,
  };

  const borders = {
    success: 'border-emerald-500/30 bg-emerald-950/40',
    error: 'border-rose-500/30 bg-rose-950/40',
    info: 'border-indigo-500/30 bg-indigo-950/40',
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 max-w-md w-full animate-in slide-in-from-bottom-5 duration-300">
      <div className={`p-4 rounded-xl border backdrop-blur-xl shadow-2xl flex items-start space-x-3 ${borders[notification.type] || borders.info}`}>
        <div className="flex-shrink-0 mt-0.5">
          {icons[notification.type] || icons.info}
        </div>
        <div className="flex-1">
          <h4 className="text-sm font-semibold text-white">{notification.title}</h4>
          <p className="text-xs text-slate-300 mt-0.5 leading-relaxed">{notification.message}</p>
          {notification.txHash && (
            <div className="mt-2 flex items-center space-x-1 text-[11px] font-mono text-indigo-300 hover:text-indigo-200">
              <span className="truncate">TX: {notification.txHash}</span>
              <ExternalLink className="w-3 h-3 flex-shrink-0" />
            </div>
          )}
        </div>
        <button
          onClick={() => showNotification(null)}
          className="text-slate-400 hover:text-slate-200"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
