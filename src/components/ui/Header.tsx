'use client';
import React, { useState, useEffect, useCallback } from 'react';
import { Bell, Menu, User, X } from 'lucide-react';
import { calculateLevelInfo } from '@/src/lib/calculateLevelInfo';
import { supabase } from '@/src/lib/supabase';
import { cn } from '@/src/lib/utils';
import { EditProfileModal } from '@/src/components/ferramenta/EditProfileModal';

// ─── Types ────────────────────────────────────────────────────────────────────

interface HeaderProps {
  title: string;
  badge?: string;        // optional subtitle pill (used by categoria pages)
  onMenuClick: () => void;
  // Legacy / override props — when the parent already has the user data it can
  // pass them in to skip the extra fetch (Dashboard uses this).
  userData?: any;
  unreadCount?: number;
  onBellClick?: () => void;
  onProfileClick?: () => void;
}

// ─── Component ────────────────────────────────────────────────────────────────

export const Header = ({
  title,
  badge,
  onMenuClick,
  // legacy overrides
  userData: userDataProp,
  unreadCount: unreadCountProp,
  onBellClick: onBellClickProp,
  onProfileClick: onProfileClickProp,
}: HeaderProps) => {
  // Self-fetched state — only used when parent does NOT pass userData down
  const [selfUser, setSelfUser]           = useState<any>(null);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [isNotifOpen, setIsNotifOpen]     = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  const isSelfManaged = !userDataProp;

  const fetchSelf = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data: profile } = await supabase
      .from('profiles')
      .select('nickname, vocation, level, xp, ese_balance, hp')
      .eq('id', user.id)
      .single();
    if (profile) {
      setSelfUser({
        id: user.id,
        name: profile.nickname || user.email,
        vocation: profile.vocation,
        level: profile.level ?? 1,
        xp: profile.xp ?? 0,
        hp: profile.hp ?? 100,
        ese: profile.ese_balance ?? 0,
      });
    }
    // Fetch unread notifications
    const { data: notifs } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });
    setNotifications(notifs ?? []);
  }, []);

  useEffect(() => {
    if (isSelfManaged) {
      fetchSelf();
    }
  }, [isSelfManaged, fetchSelf]);

  // Resolved values — prefer parent-provided, fall back to self-fetched
  const resolvedUser       = userDataProp ?? selfUser;
  const displayName        = resolvedUser?.name || resolvedUser?.nickname || '—';
  const displayXp          = resolvedUser?.xp ?? resolvedUser?.xp_total ?? 0;
  const displayLevel       = calculateLevelInfo(displayXp).level;
  const selfUnread         = notifications.filter(n => !n.read).length;
  const resolvedUnread     = unreadCountProp ?? selfUnread;

  const handleBellClick = onBellClickProp ?? (() => setIsNotifOpen(prev => !prev));
  const handleProfileClick = onProfileClickProp ?? (() => setIsProfileOpen(true));

  const markAllAsRead = async () => {
    const unreadIds = notifications.filter(n => !n.read).map(n => n.id);
    if (!unreadIds.length) return;
    await supabase.from('notifications').update({ read: true }).in('id', unreadIds);
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  // ─── Render ──────────────────────────────────────────────────────────────

  return (
    <div className="flex-shrink-0 relative">
      {/* ── Mobile Header (< lg) ────────────────────────────────────────── */}
      <header className="lg:hidden flex items-center justify-between p-4 border-b border-white/5 bg-ese-black/50 backdrop-blur-md z-20">
        <div
          className="w-10 h-10 rounded-full bg-ese-gray/50 flex items-center justify-center border border-white/10 cursor-pointer hover:bg-white/10 transition-colors"
          onClick={handleProfileClick}
          title="Perfil"
        >
          <User className="w-5 h-5 text-gray-300" />
        </div>

        <div className="text-center">
          <h1 className="font-heading font-bold text-lg tracking-widest uppercase">{title}</h1>
          {badge && (
            <span className="text-[9px] font-bold text-gray-500 tracking-widest uppercase">{badge}</span>
          )}
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleBellClick}
            className="relative p-2 text-gray-300 hover:text-white transition-colors"
            aria-label="Notificações"
          >
            <Bell className="w-5 h-5" />
            {resolvedUnread > 0 && (
              <span className="absolute top-0 right-0 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-[#0B0F10]" />
            )}
          </button>
          <button onClick={onMenuClick} className="p-2 text-gray-300">
            <Menu className="w-6 h-6" />
          </button>
        </div>
      </header>

      {/* ── Desktop Header (≥ lg) ────────────────────────────────────────── */}
      <header className="hidden lg:flex items-center justify-between px-8 pt-6 pb-4 border-b border-white/5">
        <div>
          <h1 className="font-heading font-bold text-3xl tracking-widest uppercase">{title}</h1>
          {badge && (
            <span className="text-xs font-bold text-gray-500 tracking-widest uppercase">{badge}</span>
          )}
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleBellClick}
            className="relative p-2.5 rounded-xl bg-ese-gray/40 border border-white/10 text-gray-300 hover:text-white hover:bg-white/10 transition-all"
            aria-label="Notificações"
          >
            <Bell className="w-5 h-5" />
            {resolvedUnread > 0 && (
              <span className="absolute top-0 right-0 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-[#0B0F10]" />
            )}
          </button>

          <div
            className="flex items-center gap-4 cursor-pointer hover:bg-white/5 transition-colors p-2 rounded-xl"
            onClick={handleProfileClick}
            title="Editar Persona"
          >
            <div className="text-right">
              <div className="text-sm font-bold text-ese-blue-light">{displayName}</div>
              <div className="text-xs text-gray-400">Nível {displayLevel}</div>
            </div>
            <div className="w-12 h-12 rounded-full bg-ese-gray/80 flex items-center justify-center border border-white/20">
              <User className="w-6 h-6 text-gray-300" />
            </div>
          </div>
        </div>
      </header>

      {/* ── Notification Panel (self-managed only) ───────────────────────── */}
      {isSelfManaged && isNotifOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsNotifOpen(false)} />
          <div className="absolute top-[72px] right-4 lg:top-[88px] lg:right-8 z-50 w-[340px] max-w-[calc(100vw-2rem)] bg-[#0B0F10] border border-white/10 rounded-2xl shadow-2xl overflow-hidden flex flex-col">
            <div className="flex items-center justify-between px-5 py-4 border-b border-white/5">
              <div className="flex items-center gap-2">
                <Bell className="w-4 h-4 text-[#98A9FF]" />
                <span className="text-sm font-bold tracking-widest text-white uppercase">Notificações</span>
                {selfUnread > 0 && (
                  <span className="px-2 py-0.5 bg-[#15203C] rounded-full text-[10px] font-black text-[#98A9FF]">
                    {selfUnread} novas
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                {selfUnread > 0 && (
                  <button
                    onClick={markAllAsRead}
                    className="text-[10px] font-bold text-[#98A9FF] hover:text-white transition-colors uppercase tracking-wider"
                  >
                    Marcar todas
                  </button>
                )}
                <button onClick={() => setIsNotifOpen(false)} className="text-gray-500 hover:text-white transition-colors">
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="overflow-y-auto max-h-[420px]" style={{ scrollbarWidth: 'none' }}>
              {notifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 px-6 text-center gap-3">
                  <Bell className="w-10 h-10 text-gray-700" />
                  <p className="text-sm text-gray-500 font-semibold">Nenhuma notificação</p>
                </div>
              ) : (
                notifications.map(n => (
                  <button
                    key={n.id}
                    onClick={async () => {
                      await supabase.from('notifications').update({ read: true }).eq('id', n.id);
                      setNotifications(prev => prev.map(x => x.id === n.id ? { ...x, read: true } : x));
                    }}
                    className={cn(
                      'w-full text-left flex items-start gap-3 px-5 py-4 border-b border-white/5 transition-all hover:bg-white/5',
                      !n.read ? 'bg-[#15203C]/60' : 'bg-transparent'
                    )}
                  >
                    <div className="flex-shrink-0 mt-1.5">
                      <div className={cn('w-2 h-2 rounded-full', !n.read ? 'bg-[#98A9FF]' : 'bg-transparent')} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={cn('text-sm leading-snug truncate', !n.read ? 'font-bold text-white' : 'font-medium text-gray-300')}>
                        {n.title || n.tipo || 'Notificação'}
                      </p>
                      {n.message && <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{n.message}</p>}
                      <p className="text-[10px] text-gray-600 mt-1 font-semibold">
                        {n.created_at ? new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }).format(new Date(n.created_at)) : ''}
                      </p>
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>
        </>
      )}

      {/* ── Edit Profile Modal (self-managed only) ───────────────────────── */}
      {isSelfManaged && isProfileOpen && selfUser && (
        <EditProfileModal
          userData={selfUser}
          onClose={() => setIsProfileOpen(false)}
          onSuccess={(payload: any) => {
            setIsProfileOpen(false);
            setSelfUser((prev: any) => ({ ...prev, name: payload.nickname, vocation: payload.vocation }));
          }}
        />
      )}
    </div>
  );
};
