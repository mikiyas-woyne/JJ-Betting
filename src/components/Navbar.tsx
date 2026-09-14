import React from 'react';
import {
  ShieldCheck,
  Wallet as WalletIcon,
  ReceiptText,
  ShieldAlert,
  Bell,
  SlidersHorizontal,
  LayoutDashboard,
  LogOut,
  User as UserIcon
} from 'lucide-react';
import { User, Wallet, Notification } from '../types';

interface NavbarProps {
  user: User | null;
  wallet: Wallet | null;
  notifications: Notification[];
  activeView: 'sportsbook' | 'admin';
  onViewChange: (view: 'sportsbook' | 'admin') => void;
  onOpenWallet: () => void;
  onOpenBets: () => void;
  onOpenLimits: () => void;
  onOpenNotifications: () => void;
  onOpenAuth: () => void;
  onLogout: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  user,
  wallet,
  notifications,
  activeView,
  onViewChange,
  onOpenWallet,
  onOpenBets,
  onOpenLimits,
  onOpenNotifications,
  onOpenAuth,
  onLogout
}) => {
  const unreadCount = notifications.filter(n => !n.read).length;
  const isAdmin = user && (user.role === 'admin' || user.email.toLowerCase() === 'mikiyaswoyne@gmail.com');

  return (
    <header className="sticky top-0 z-40 bg-slate-900 border-b border-slate-800 text-white shadow-md">
      {/* Top Regulatory Assurance Bar */}
      <div className="bg-slate-950 px-4 py-1 flex items-center justify-between text-[11px] text-slate-400 border-b border-slate-850">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
          <span className="font-semibold text-slate-300">National Lottery Administration Licensed</span>
          <span className="hidden sm:inline text-slate-500">• License No. NLA/SP/2024/09</span>
        </div>
        <div className="flex items-center gap-4">
          <button
            onClick={onOpenLimits}
            className="flex items-center gap-1 hover:text-emerald-400 transition-colors cursor-pointer text-slate-400"
          >
            <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />
            <span>Responsible Gambling Limits</span>
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-3 sm:px-6 h-16 flex items-center justify-between gap-2">
        {/* Left Branding & App Logo */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => onViewChange('sportsbook')}
            className="flex items-center gap-2.5 text-left group cursor-pointer"
          >
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center text-slate-950 font-black text-lg shadow-lg shadow-emerald-500/20 group-hover:scale-105 transition-transform">
              JJ
            </div>
            <div>
              <div className="font-black text-lg sm:text-xl tracking-wide leading-none text-white">
                JJ-<span className="text-emerald-400">BETTING</span>
              </div>
              <div className="text-[10px] tracking-widest text-slate-400 uppercase font-semibold">
                Licensed Sportsbook
              </div>
            </div>
          </button>

          {/* Desktop View Switcher (Gated for Admins only) */}
          {isAdmin && (
            <div className="hidden md:flex items-center bg-slate-800/90 rounded-lg p-1 border border-slate-700/60 ml-4">
              <button
                onClick={() => onViewChange('sportsbook')}
                className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all cursor-pointer ${
                  activeView === 'sportsbook'
                    ? 'bg-emerald-500 text-slate-950 shadow-sm'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                Sportsbook
              </button>
              <button
                onClick={() => onViewChange('admin')}
                className={`px-3 py-1.5 rounded-md text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                  activeView === 'admin'
                    ? 'bg-amber-500 text-slate-950 shadow-sm'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                <LayoutDashboard className="w-3.5 h-3.5" />
                Admin Desk
              </button>
            </div>
          )}
        </div>

        {/* Right Actions: Balance, Deposit, My Bets, Account */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Wallet Balance Chip */}
          <button
            onClick={onOpenWallet}
            className="flex items-center gap-2 bg-slate-800 hover:bg-slate-750 px-3 py-1.5 rounded-lg border border-slate-700/80 transition-all text-left group cursor-pointer"
          >
            <div className="w-7 h-7 rounded-md bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <WalletIcon className="w-3.5 h-3.5" />
            </div>
            <div className="leading-tight">
              <div className="text-[10px] text-slate-400 font-medium">Balance</div>
              <div className="text-xs sm:text-sm font-bold text-white font-mono">
                {wallet ? `${wallet.availableBalance.toLocaleString(undefined, { minimumFractionDigits: 2 })} ETB` : '...'}
              </div>
            </div>
            <span className="ml-1 px-1.5 py-0.5 rounded bg-emerald-500 text-slate-950 text-[10px] font-extrabold group-hover:bg-emerald-400 transition-colors">
              +
            </span>
          </button>

          {/* My Bets Button */}
          <button
            onClick={onOpenBets}
            className="flex items-center gap-1.5 bg-slate-800/80 hover:bg-slate-700 px-3 py-2 rounded-lg text-xs font-semibold text-slate-200 border border-slate-700/70 transition-colors cursor-pointer"
            title="My Bet History"
          >
            <ReceiptText className="w-4 h-4 text-emerald-400" />
            <span className="hidden sm:inline">My Bets</span>
          </button>

          {/* Notifications */}
          <button
            onClick={onOpenNotifications}
            className="relative p-2 rounded-lg bg-slate-800/80 hover:bg-slate-750 text-slate-300 border border-slate-700/70 transition-colors cursor-pointer"
            title="Notifications"
          >
            <Bell className="w-4 h-4" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-emerald-500 text-slate-950 text-[10px] font-bold flex items-center justify-center">
                {unreadCount}
              </span>
            )}
          </button>

          {/* Mobile Admin Switcher */}
          {isAdmin && (
            <button
              onClick={() => onViewChange(activeView === 'sportsbook' ? 'admin' : 'sportsbook')}
              className="md:hidden p-2 rounded-lg bg-slate-800 text-slate-300 border border-slate-700 cursor-pointer"
              title="Toggle Admin View"
            >
              <SlidersHorizontal className="w-4 h-4 text-amber-400" />
            </button>
          )}

          {/* User Account / Auth Actions */}
          {user ? (
            <div className="flex items-center gap-2 pl-2 border-l border-slate-800 text-xs">
              <div className="hidden lg:flex items-center gap-2">
                <div className={`w-8 h-8 rounded-full border flex items-center justify-center font-bold text-slate-300 ${
                  isAdmin ? 'bg-amber-500/20 border-amber-500/40 text-amber-300' : 'bg-slate-800 border-slate-700'
                }`}>
                  {user.displayName.slice(0, 2).toUpperCase()}
                </div>
                <div className="leading-tight">
                  <div className="font-semibold text-slate-200 flex items-center gap-1">
                    {user.displayName}
                    {isAdmin && <span className="bg-amber-500 text-slate-950 text-[9px] px-1 font-bold rounded">ADMIN</span>}
                  </div>
                  <div className="flex items-center gap-1 text-[10px] text-emerald-400">
                    <ShieldCheck className="w-3 h-3" /> {user.kycStatus === 'fully_verified' ? 'Verified Admin' : 'Tier 1 KYC'}
                  </div>
                </div>
              </div>
              <button
                onClick={onLogout}
                className="p-2 rounded-lg bg-slate-800 hover:bg-slate-750 text-slate-400 hover:text-rose-400 border border-slate-700/80 transition-colors cursor-pointer"
                title="Log Out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button
              onClick={onOpenAuth}
              className="flex items-center gap-1.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 px-3.5 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer shadow-md shadow-emerald-500/20"
            >
              <UserIcon className="w-3.5 h-3.5" />
              <span>Log In</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
