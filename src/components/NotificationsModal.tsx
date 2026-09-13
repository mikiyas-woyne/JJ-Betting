import React from 'react';
import { X, Bell, CheckCircle2, ShieldCheck, Ticket } from 'lucide-react';
import { Notification } from '../types';

interface NotificationsModalProps {
  notifications: Notification[];
  onClose: () => void;
  onMarkRead: (id: string) => void;
}

export const NotificationsModal: React.FC<NotificationsModalProps> = ({
  notifications,
  onClose,
  onMarkRead
}) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-xs animate-in fade-in duration-150">
      <div
        id="notifications-modal"
        className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-md overflow-hidden shadow-2xl flex flex-col max-h-[85vh]"
      >
        <div className="bg-slate-950 p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Bell className="w-5 h-5 text-emerald-400" />
            <h3 className="font-black text-white text-base">Account Notifications</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 overflow-y-auto space-y-2.5 flex-1 text-xs">
          {notifications.length === 0 ? (
            <div className="text-center py-10 text-slate-500">
              No notifications at this time.
            </div>
          ) : (
            notifications.map(notif => (
              <div
                key={notif.id}
                onClick={() => onMarkRead(notif.id)}
                className={`p-3 rounded-2xl border transition-all cursor-pointer ${
                  notif.read
                    ? 'bg-slate-950/40 border-slate-850 text-slate-400'
                    : 'bg-slate-950 border-emerald-500/40 text-slate-200 shadow-xs'
                }`}
              >
                <div className="flex items-center justify-between font-bold mb-1">
                  <div className="flex items-center gap-1.5 text-white">
                    {notif.type === 'bet_outcome' ? (
                      <Ticket className="w-3.5 h-3.5 text-emerald-400" />
                    ) : (
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                    )}
                    <span>{notif.title}</span>
                  </div>
                  {!notif.read && (
                    <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                  )}
                </div>
                <p className="text-[11px] leading-relaxed text-slate-400">{notif.message}</p>
                <div className="text-[10px] text-slate-600 font-mono mt-1.5">
                  {new Date(notif.createdAt).toLocaleTimeString()}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
