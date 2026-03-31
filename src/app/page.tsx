"use client";
import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/src/lib/supabase';
import { cn } from '@/src/lib/utils';
import { calculateLevelInfo } from '@/src/lib/calculateLevelInfo';
import {
  Flame, ChevronLeft, ChevronRight, Plus, User,
  Settings, Target, Skull, AlertTriangle, Bell, RotateCcw, CheckCircle2, ListTodo,
} from 'lucide-react';

import {
  Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer
} from 'recharts';
import { Card } from '@/src/components/ui/Card';
import { ProgressBar, VerticalProgressBar } from '@/src/components/ui/ProgressBar';
import { Sidebar } from '@/src/components/ui/Sidebar';
import { Header } from '@/src/components/ui/Header';
import { BottomNav } from '@/src/components/ui/BottomNav';
import { CreateActionModal } from '@/src/components/ferramenta/CreateActionModal';
import { ActionDetailsModal } from '@/src/components/ferramenta/ActionDetailsModal';
import { EditProfileModal } from '@/src/components/ferramenta/EditProfileModal';
import { EditPillarsModal } from '@/src/components/ferramenta/EditPillarsModal';
import { AcaoCard } from '@/src/components/ferramenta/AcaoCard';
import { completeAction as engineComplete, undoAction as engineUndo } from '@/src/lib/gamification/actionEngine';



export default function App() {
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('HOME');
  const [isLoading, setIsLoading] = useState(true);
  const [userData, setUserData] = useState<any>(null);
  const [pillars, setPillars] = useState<any[]>([]);
  const [radarData, setRadarData] = useState<any[]>([]);
  const [isEditPillarsModalOpen, setIsEditPillarsModalOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditProfileModalOpen, setIsEditProfileModalOpen] = useState(false);
  const [selectedAction, setSelectedAction] = useState<any>(null);
  const [actions, setActions] = useState<any[]>([]);
  const [statusIndex, setStatusIndex] = useState(0);
  const [activeFilter, setActiveFilter] = useState('todas');
  const [notifications, setNotifications] = useState<any[]>([]);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const router = useRouter();

  const unreadCount = notifications.filter(n => !n.read).length;

  // --- Toast / Pop-up System ---
  const [popups, setPopups] = useState<any[]>([]);

  const showPopup = (title: string, message: string, type: string) => {
    const id = Date.now() + Math.random();
    setPopups(prev => [...prev, { id, title, message, type }]);
    setTimeout(() => {
      setPopups(prev => prev.filter(p => p.id !== id));
    }, 5000);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  const fetchNotifications = async (userId: string) => {
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    if (!error) {
      setNotifications(data || []);
    }
  };

  const markAsRead = async (notifId: string) => {
    const { error } = await supabase
      .from('notifications')
      .update({ read: true })
      .eq('id', notifId);
    if (!error) {
      setNotifications(prev =>
        prev.map(n => n.id === notifId ? { ...n, read: true } : n)
      );
    }
  };

  const markAllAsRead = async () => {
    if (!userData?.id) return;
    const unreadIds = notifications.filter(n => !n.read).map(n => n.id);
    if (unreadIds.length === 0) return;
    const { error } = await supabase
      .from('notifications')
      .update({ read: true })
      .in('id', unreadIds);
    if (!error) {
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    }
  };

  const fetchActions = async (userId: string) => {
    const { data: fetchedActions, error } = await supabase
      .from('actions')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (!error) {
      setActions(fetchedActions || []);
    }
  };

  const fetchPillars = async (userId: string) => {
    const { data: fetchedPillars, error } = await supabase
      .from('pillars')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: true });

    if (!error) {
      setPillars(fetchedPillars || []);
    }
  };

  const fetchRadarData = async (userId: string) => {
    const { data: fetchedRadarData, error } = await supabase
      .from('grafico_sacrificios')
      .select('*')
      .eq('user_id', userId);

    if (!error) {
      setRadarData(fetchedRadarData || []);
    }
    return fetchedRadarData || [];
  };

  const checkRadarDecay = async (rows: any[], userId: string) => {
    if (!rows.length) return;
    const SEVEN_DAYS = 7 * 24 * 60 * 60 * 1000;
    const now = Date.now();
    const oldest = rows.reduce((min, r) => {
      const t = r.atualizado ? new Date(r.atualizado.replace(' ', 'T')).getTime() : 0;
      return t < min ? t : min;
    }, Infinity);
    if (now - oldest < SEVEN_DAYS) return;
    // Apply -5 decay to all 5 priorities (minimum 0)
    await Promise.all(
      rows.map(r =>
        supabase
          .from('grafico_sacrificios')
          .update({ valor: Math.max(0, Number(r.valor || 0) - 5), atualizado: new Date().toISOString() })
          .eq('id', r.id)
      )
    );
    await fetchRadarData(userId);
    showPopup(
      '⚠️ TEMPO PASSANDO',
      'Suas prioridades reduziram 5%. O sacrifício exige manutenção constante.',
      'radar_drop'
    );
  };

  const deleteAction = async (actionId: string) => {
    const { error } = await supabase.from('actions').delete().eq('id', actionId);
    if (!error) {
      setActions(prev => prev.filter(a => a.id !== actionId));
    } else {
      alert("Falha ao deletar ação.");
    }
  };

  // ── Optimistic status handler (delegates to RPG engine) ─────────────────
  const handleStatusChange = useCallback(async (actionId: string, newStatus: 'concluido' | 'pendente') => {
    if (!userData?.id) return;

    // 1 — Immediately update local state (no flicker)
    setActions(prev => prev.map(a => a.id === actionId ? { ...a, status: newStatus } : a));

    const action = actions.find(a => a.id === actionId);
    if (!action) return;

    if (newStatus === 'concluido') {
      const result = await engineComplete(action, userData.id, showPopup);
      if (!result.ok) {
        // Revert on server failure
        setActions(prev => prev.map(a => a.id === actionId ? { ...a, status: action.status } : a));
        return;
      }
      // Sync local userData XP/ESE so stats card updates without a full refetch
      if (result.xpGained || result.eseGained) {
        const newXp = (userData.xp || 0) + (result.xpGained || 0);
        const newEse = (userData.ese || 0) + (result.eseGained || 0);
        setUserData((prev: any) => ({
          ...prev,
          xp: newXp,
          ese: newEse,
          level: calculateLevelInfo(newXp).level,
        }));
      }
      if (result.leveledUp) await fetchNotifications(userData.id);
    } else {
      const result = await engineUndo(action, userData.id);
      if (!result.ok) {
        setActions(prev => prev.map(a => a.id === actionId ? { ...a, status: action.status } : a));
        return;
      }
      // Refetch profile to sync XP after undo
      await fetchActions(userData.id);
      const { data: prof } = await supabase.from('profiles').select('xp, ese_balance, level').eq('id', userData.id).single();
      if (prof) setUserData((prev: any) => ({ ...prev, xp: prof.xp, ese: prof.ese_balance, level: prof.level }));
    }
  }, [userData, actions, showPopup]); // eslint-disable-line

  // ── Legacy stubs kept for ActionDetailsModal compatibility ────────────────
  const completeAction = async (action: any) => {
    if (action.status === 'concluido') return;

    const nowIso = new Date().toISOString();

    // A. Update status no Supabase
    const { error } = await supabase.from('actions').update({ status: 'concluido', completed_at: nowIso }).eq('id', action.id);
    if (error) {
      alert("Falha ao atualizar ação.");
      return;
    }

    // A2. Atualiza estado local otimistamente
    setActions(prev => prev.map(a => a.id === action.id ? { ...a, status: 'concluido', completed_at: nowIso } : a));

    // B. Gamificação refletindo instantaneamente
    if (!userData?.id) return;

    let notificationsTriggered = false;

    const xpReward = Number(action.xp_reward || 0);
    const eseReward = Number(action.ese_reward || 0);

    // Captura o nível ANTES de adicionar o XP
    const oldLevel = calculateLevelInfo(userData.xp || 0).level;

    const newXp = (userData.xp || 0) + xpReward;
    const newEse = (userData.ese || 0) + eseReward;
    const levelInfo = calculateLevelInfo(newXp);

    const { error: profileError } = await supabase
      .from('profiles')
      .update({ xp: newXp, ese_balance: newEse, level: levelInfo.level })
      .eq('id', userData.id);

    if (!profileError) {
      setUserData((prev: any) => ({
        ...prev,
        xp: newXp,
        ese: newEse,
        level: levelInfo.level
      }));
    }

    // 🎉 Gatilho: Level Up da Persona
    if (levelInfo.level > oldLevel) {
      const lvlTitle = '🎉 LEVEL UP!';
      const lvlMsg = `Sua Persona atingiu o Nível ${levelInfo.level}! Continue evoluindo.`;
      await supabase.from('notifications').insert({
        user_id: userData.id,
        title: lvlTitle,
        message: lvlMsg,
        type: 'level_up',
        read: false,
      });
      showPopup(lvlTitle, lvlMsg, 'level_up');
      notificationsTriggered = true;
    }

    // C. Gamificação do Pilar
    const pilarImpact = Number(action.pilar_impact || 0);
    const pilarName = action.pillar || action.pilar;
    if (pilarName && pilarImpact > 0) {
      const { data: pillarData } = await supabase
        .from('pillars')
        .select('*')
        .eq('user_id', userData.id)
        .ilike('name', pilarName)
        .single();

      if (pillarData) {
        const currentProgress = Number(pillarData.progress || 0);
        const currentLevel = Number(pillarData.level || 1);

        let finalProgress = currentProgress + pilarImpact;
        let finalLevel = currentLevel;

        if (finalProgress >= 100) {
          finalLevel += Math.floor(finalProgress / 100);
          finalProgress = finalProgress % 100;
        }

        await supabase
          .from('pillars')
          .update({ progress: finalProgress, level: finalLevel })
          .eq('id', pillarData.id);

        await fetchPillars(userData.id);

        // 📈 Gatilho: Level Up do Pilar
        if (finalLevel > currentLevel) {
          const plTitle = '📈 PILAR EVOLUIU!';
          const plMsg = `O pilar "${pilarName}" atingiu o Nível ${finalLevel}! Incrível progresso.`;
          await supabase.from('notifications').insert({
            user_id: userData.id,
            title: plTitle,
            message: plMsg,
            type: 'pilar_up',
            read: false,
          });
          showPopup(plTitle, plMsg, 'pilar_up');
          notificationsTriggered = true;
        }
      }
    }

    // D. Gamificação do Eixo de Sacrifícios (Radar Fixo)
    const radarImpact = Number(action.radar_impact || 0);
    if (action.sacrifice_priority && radarImpact > 0) {
      const { data: radarPilar } = await supabase
        .from('grafico_sacrificios')
        .select('*')
        .eq('user_id', userData.id)
        .eq('prioridade', action.sacrifice_priority)
        .single();

      if (radarPilar) {
        const currentValor = Number(radarPilar.valor || 0);
        const newValor = Math.min(100, currentValor + radarImpact);

        await supabase
          .from('grafico_sacrificios')
          .update({ valor: newValor })
          .eq('id', radarPilar.id);
      } else {
        await supabase
          .from('grafico_sacrificios')
          .insert({
            user_id: userData.id,
            prioridade: action.sacrifice_priority,
            valor: Math.min(100, 50 + radarImpact)
          });
      }
      await fetchRadarData(userData.id);
    }

    // F. Motor de Ofensiva (apenas para Diárias)
    if (action.type === 'diaria') {
      const todayStr = new Date().toLocaleDateString('en-CA'); // YYYY-MM-DD local
      if (userData.last_active_date !== todayStr) {
        const newOfensiva = (userData.offensive_days || 0) + 1;
        await supabase
          .from('profiles')
          .update({ offensive_days: newOfensiva, last_active_date: todayStr })
          .eq('id', userData.id);
        setUserData((prev: any) => ({
          ...prev,
          offensive_days: newOfensiva,
          last_active_date: todayStr,
        }));
        // Notificar em dias especiais: 1, 2, 3 ou múltiplos de 7
        if ([1, 2, 3].includes(newOfensiva) || newOfensiva % 7 === 0) {
          const offTitle = '🔥 MINHA OFENSIVA!';
          const offMsg = `Você atingiu ${newOfensiva} dia${newOfensiva > 1 ? 's' : ''} seguido${newOfensiva > 1 ? 's' : ''}!`;
          await supabase.from('notifications').insert({
            user_id: userData.id,
            title: offTitle,
            message: offMsg,
            type: 'ofensiva',
            read: false,
          });
          showPopup(offTitle, offMsg, 'ofensiva');
          notificationsTriggered = true;
        }
      }
    }

    // G. Atualizar notificações se algum gatilho foi disparado
    if (notificationsTriggered) {
      await fetchNotifications(userData.id);
    }
  };

  const undoAction = async (action: any) => {
    try {
      if (action.status !== 'concluido') return;

      const { error } = await supabase.from('actions').update({ status: 'pendente', completed_at: null }).eq('id', action.id);
      if (error) {
        console.error('Erro ao atualizar status:', error);
        alert("Falha ao reverter ação no banco.");
        return;
      }

      // Antes de subtrair, faça um SELECT do perfil do usuário para pegar o xp e ese_balance atuais
      const { data: profile, error: profileFetchError } = await supabase
        .from('profiles')
        .select('xp, ese_balance')
        .eq('id', action.user_id || userData?.id)
        .single();

      if (profileFetchError) throw profileFetchError;

      const xpReward = Number(action.xp_reward || 0);
      const eseReward = Number(action.ese_reward || 0);
      const pilarImpact = Number(action.pilar_impact || 0);
      const radarImpact = Number(action.radar_impact || 0);

      const newXp = Math.max(0, (profile?.xp || 0) - xpReward);
      const newEse = Math.max(0, (profile?.ese_balance || 0) - eseReward);
      const levelInfo = calculateLevelInfo(newXp);

      const { error: profileError } = await supabase
        .from('profiles')
        .update({ xp: newXp, ese_balance: newEse, level: levelInfo.level })
        .eq('id', action.user_id || userData?.id);

      if (profileError) throw profileError;

      // Reverter Pilar
      const pilarName = action.pillar || action.pilar;
      if (pilarName && pilarImpact > 0) {
        const { data: pillarData } = await supabase
          .from('pillars')
          .select('*')
          .eq('user_id', action.user_id || userData?.id)
          .ilike('name', pilarName)
          .single();

        if (pillarData) {
          const currentProgress = Number(pillarData.progress || 0);
          const currentLevel = Number(pillarData.level || 1);

          let finalProgress = currentProgress - pilarImpact;
          let finalLevel = currentLevel;

          if (finalProgress < 0) {
            if (finalLevel > 1) {
              const levelsLost = Math.ceil(Math.abs(finalProgress) / 100);
              finalLevel = Math.max(1, finalLevel - levelsLost);
              finalProgress = 100 - (Math.abs(finalProgress) % 100);
              if (finalProgress === 100) finalProgress = 0;
            } else {
              finalProgress = 0;
            }
          }

          await supabase
            .from('pillars')
            .update({ progress: finalProgress, level: finalLevel })
            .eq('id', pillarData.id);

          await fetchPillars(action.user_id || userData?.id);
        }
      }

      // Reverter Gráfico de Sacrifícios
      if (action.sacrifice_priority && radarImpact > 0) {
        const { data: radarPilar } = await supabase
          .from('grafico_sacrificios')
          .select('*')
          .eq('user_id', action.user_id || userData?.id)
          .eq('prioridade', action.sacrifice_priority)
          .single();

        if (radarPilar) {
          const currentValor = Number(radarPilar.valor || 0);
          const newValor = Math.max(0, currentValor - radarImpact);

          await supabase
            .from('grafico_sacrificios')
            .update({ valor: newValor })
            .eq('id', radarPilar.id);

          await fetchRadarData(action.user_id || userData?.id);
        }
      }

      // C. Atualizar Interface puxando novos dados via fetchActions
      await fetchActions(action.user_id || userData?.id);

      setUserData((prev: any) => ({
        ...prev,
        xp: newXp,
        ese: newEse
      }));

    } catch (error) {
      console.error('Erro ao desfazer ação:', error);
      alert('Houve um erro ao tentar reverter a ação e descontar a recompensa.');
    }
  };

  // --- Filtros de Tempo (24h) ---
  const now = new Date();
  const ONE_DAY = 24 * 60 * 60 * 1000;

  const pendentes = actions.filter(a => a.status === 'pendente' || !a.status);
  const filteredPendingActions = pendentes.filter(a => activeFilter === 'todas' || a.type === activeFilter);

  const countDiarias = pendentes.filter(a => a.type === 'diaria').length;
  const countFazer = pendentes.filter(a => a.type === 'fazer').length;
  const countMissoes = pendentes.filter(a => a.type === 'meta' || a.type === 'missao').length;
  const countBoss = pendentes.filter(a => a.type === 'boss').length;
  const countProblemas = pendentes.filter(a => a.type === 'problema' || a.type === 'inimigo').length;

  const statusSlides = [
    { label: 'OFENSIVA', value: userData?.offensive_days || 0, icon: Flame, suffix: 'dias', color: 'text-orange-500', glow: 'rgba(249,115,22,0.5)' },
    { label: 'DIÁRIAS', value: countDiarias, icon: CheckCircle2, suffix: 'pendentes', color: 'text-blue-500', glow: 'rgba(59,130,246,0.3)' },
    { label: 'FAZER', value: countFazer, icon: ListTodo, suffix: 'pendentes', color: 'text-green-500', glow: 'rgba(34,197,94,0.3)' },
    { label: 'MISSÕES', value: countMissoes, icon: Target, suffix: 'pendentes', color: 'text-purple-500', glow: 'rgba(168,85,247,0.3)' },
    { label: 'BOSS', value: countBoss, icon: Skull, suffix: 'pendentes', color: 'text-red-500', glow: 'rgba(239,68,68,0.3)' },
    { label: 'INIMIGOS', value: countProblemas, icon: AlertTriangle, suffix: 'pendentes', color: 'text-yellow-500', glow: 'rgba(234,179,8,0.3)' }
  ];

  const concluidasRecentes = actions.filter(a => {
    if (a.status !== 'concluido') return false;
    if (!a.completed_at) return true; // Se concluída sem timer marcado, fica na recente
    const diff = now.getTime() - new Date(a.completed_at.replace(' ', 'T')).getTime();
    return diff < ONE_DAY;
  });

  const historico = actions.filter(a => {
    if (a.status !== 'concluido' || !a.completed_at) return false;
    const diff = now.getTime() - new Date(a.completed_at.replace(' ', 'T')).getTime();
    return diff >= ONE_DAY;
  });

  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push('/login');
      } else {
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single();

        setUserData({
          id: session.user.id,
          name: profile?.nickname || session.user.email,
          vocation: profile?.vocation || 'Sem Vocação',
          level: profile?.level || 1,
          xp: profile?.xp || 0,
          xpNext: 1000,
          hp: profile?.hp || 100,
          maxHp: 100,
          ese: profile?.ese_balance || 0,
          offensive_days: profile?.offensive_days || 0,
          last_active_date: profile?.last_active_date || null,
        });

        await fetchActions(session.user.id);
        await fetchPillars(session.user.id);
        const radarRows = await fetchRadarData(session.user.id);
        await fetchNotifications(session.user.id);
        // Check radar 7-day decay
        await checkRadarDecay(radarRows || [], session.user.id);
        setIsLoading(false);
      }
    };
    checkSession();
  }, [router]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[var(--color-ese-black)] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[var(--color-ese-blue)]"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-ese-dark to-ese-black text-ese-white flex font-sans selection:bg-ese-blue/30">

      <Sidebar isOpen={isSidebarOpen} onClose={() => setSidebarOpen(false)} onLogout={handleLogout} />

      <main className="flex-1 flex flex-col h-screen overflow-hidden relative">

        <Header
          title={activeTab}
          userData={userData}
          unreadCount={unreadCount}
          onMenuClick={() => setSidebarOpen(true)}
          onBellClick={() => setIsNotifOpen(prev => !prev)}
          onProfileClick={() => setIsEditProfileModalOpen(true)}
        />

        {/* === NOTIFICATION PANEL === */}
        {isNotifOpen && (
          <>
            {/* Backdrop (click fora fecha) */}
            <div
              className="fixed inset-0 z-40"
              onClick={() => setIsNotifOpen(false)}
            />
            {/* Panel */}
            <div className="absolute top-[72px] right-4 lg:top-[88px] lg:right-8 z-50 w-[340px] max-w-[calc(100vw-2rem)] bg-[#0B0F10] border border-white/10 rounded-2xl shadow-2xl overflow-hidden flex flex-col">
              {/* Panel Header */}
              <div className="flex items-center justify-between px-5 py-4 border-b border-white/5">
                <div className="flex items-center gap-2">
                  <Bell className="w-4 h-4 text-[#98A9FF]" />
                  <span className="text-sm font-bold tracking-widest text-white uppercase">Notificações</span>
                  {unreadCount > 0 && (
                    <span className="px-2 py-0.5 bg-[#15203C] rounded-full text-[10px] font-black text-[#98A9FF]">
                      {unreadCount} novas
                    </span>
                  )}
                </div>
                {unreadCount > 0 && (
                  <button
                    onClick={markAllAsRead}
                    className="text-[10px] font-bold text-[#98A9FF] hover:text-white transition-colors uppercase tracking-wider"
                  >
                    Marcar todas
                  </button>
                )}
              </div>

              {/* Notification List */}
              <div className="overflow-y-auto max-h-[420px]" style={{ scrollbarWidth: 'none' }}>
                {notifications.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 px-6 text-center gap-3">
                    <Bell className="w-10 h-10 text-gray-700" />
                    <p className="text-sm text-gray-500 font-semibold">Nenhuma notificação no momento</p>
                    <p className="text-xs text-gray-600">As notificações aparecerão aqui quando houver atividade.</p>
                  </div>
                ) : (
                  notifications.map(n => (
                    <button
                      key={n.id}
                      onClick={() => markAsRead(n.id)}
                      className={cn(
                        "w-full text-left flex items-start gap-3 px-5 py-4 border-b border-white/5 transition-all hover:bg-white/5",
                        !n.read ? "bg-[#15203C]/60" : "bg-transparent"
                      )}
                    >
                      {/* Unread indicator */}
                      <div className="flex-shrink-0 mt-1.5">
                        {!n.read ? (
                          <div className="w-2 h-2 rounded-full bg-[#98A9FF]" />
                        ) : (
                          <div className="w-2 h-2 rounded-full bg-transparent" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={cn(
                          "text-sm leading-snug truncate",
                          !n.read ? "font-bold text-white" : "font-medium text-gray-300"
                        )}>
                          {n.title || n.tipo || 'Notificação'}
                        </p>
                        {n.message && (
                          <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{n.message}</p>
                        )}
                        <p className="text-[10px] text-gray-600 mt-1 font-semibold">
                          {n.created_at
                            ? new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }).format(new Date(n.created_at.replace(' ', 'T')))
                            : ''}
                        </p>
                      </div>
                    </button>
                  ))
                )}
              </div>
            </div>
          </>
        )}

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-4 lg:p-8 pb-24 lg:pb-8 space-y-6">

          {/* PERSONA SECTION */}
          <section>
            <div className="flex items-center justify-between mb-3 px-1">
              <h2 className="font-heading font-bold text-lg tracking-widest">PERSONA</h2>
              <span className="text-xs text-gray-400 font-semibold tracking-wider">ESTATÍSTICAS</span>
            </div>
            <Card
              className="flex flex-col sm:flex-row gap-6 items-center sm:items-stretch cursor-pointer hover:bg-white/5 transition-all group"
              onClick={() => setIsEditProfileModalOpen(true)}
            >
              {/* Avatar Placeholder */}
              <div className="w-32 h-40 bg-black/40 rounded-xl border border-white/5 flex items-center justify-center flex-shrink-0">
                <User className="w-16 h-16 text-gray-600" />
              </div>

              {/* Stats */}
              <div className="flex-1 w-full space-y-3 flex flex-col justify-center">
                <div className="flex justify-between items-end border-b border-white/10 pb-2">
                  <span className="text-xs text-gray-400 font-semibold tracking-wider">NAME</span>
                  <span className="font-heading font-bold text-lg">{userData?.name || '—'}</span>
                </div>
                <div className="flex justify-between items-end border-b border-white/10 pb-2">
                  <span className="text-xs text-gray-400 font-semibold tracking-wider">VOCAÇÃO</span>
                  <span className="font-heading font-bold text-ese-blue-light">{userData?.vocation || '—'}</span>
                </div>
                <div className="flex justify-between items-center border-b border-white/10 pb-2">
                  <span className="text-xs text-gray-400 font-semibold tracking-wider">XP</span>
                  <div className="flex-1 mx-4">
                    {(() => {
                      const info = calculateLevelInfo(userData?.xp || 0);
                      const progressPercent = Math.min(100, (info.xpInCurrentLevel / info.xpNext) * 100);
                      return <ProgressBar progress={progressPercent} colorClass="bg-ese-blue-light" />;
                    })()}
                  </div>
                  <span className="font-mono text-sm">
                    {(() => {
                      const info = calculateLevelInfo(userData?.xp || 0);
                      return `${info.xpInCurrentLevel}/${info.xpNext} XP`;
                    })()}
                  </span>
                </div>
                <div className="flex justify-between items-center border-b border-white/10 pb-2">
                  <span className="text-xs text-gray-400 font-semibold tracking-wider">PONTOS DE VIDA</span>
                  <div className="flex-1 mx-4">
                    <ProgressBar progress={((userData?.hp ?? 100) / (userData?.maxHp ?? 100)) * 100} colorClass="bg-red-500" />
                  </div>
                  <span className="font-mono text-sm">{userData?.hp ?? 100}</span>
                </div>
                <div className="flex justify-between items-end pt-1">
                  <span className="text-xs text-gray-400 font-semibold tracking-wider">E$E</span>
                  <span className="font-heading font-bold text-yellow-400 text-lg">{userData?.ese ?? 0}</span>
                </div>
              </div>
            </Card>
          </section>

          {/* SEUS PILARES */}
          <section>
            <h2 className="font-heading font-bold text-lg tracking-widest mb-3 px-1 uppercase">Seus Pilares</h2>
            {pillars.length === 0 ? (
              <Card className="flex flex-col items-center justify-center p-8 border border-dashed border-white/20 bg-white/5 group transition-colors">
                <span className="text-gray-500 text-sm font-semibold mb-4 text-center max-w-xs">Você ainda não definiu os Pilares que sustentam a sua vida.</span>
                <button
                  onClick={() => setIsEditPillarsModalOpen(true)}
                  className="px-6 py-3 bg-ese-blue hover:bg-blue-600 text-white rounded-xl font-bold tracking-widest transition-colors shadow-[0_0_15px_rgba(37,99,235,0.3)]"
                >
                  CONFIGURAR MEUS PILARES
                </button>
              </Card>
            ) : (
              <Card className="relative">
                <button
                  onClick={() => setIsEditPillarsModalOpen(true)}
                  className="absolute top-4 right-4 p-2 text-gray-400 hover:text-white bg-white/5 hover:bg-white/10 rounded-full transition-colors cursor-pointer"
                  title="Configurar Pilares"
                >
                  <Settings className="w-5 h-5" />
                </button>
                <div className="text-xs text-gray-400 font-semibold tracking-wider mb-6">MY LIFE</div>
                <div className="grid grid-cols-3 md:grid-cols-6 gap-y-6 gap-x-2 mt-2 justify-items-center">
                  {pillars.map((pillar, idx) => (
                    <VerticalProgressBar
                      key={pillar.id || idx}
                      progress={pillar.progress || 0}
                      colorClass={pillar.color || "bg-ese-blue-light"}
                      label={pillar.name}
                      sublabel={`NVL${pillar.level || 1}`}
                    />
                  ))}
                </div>
              </Card>
            )}
          </section>

          {/* STATUS & GRAFICO */}
          <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="flex flex-col gap-4">
              <h2 className="font-heading font-bold text-lg tracking-widest px-1 uppercase">Status</h2>
              <div className="flex flex-col gap-4 h-full">
                <Card className="flex-1 flex flex-col items-center justify-center relative overflow-hidden group min-h-[256px]">
                  <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-50" />

                  {/* Navegação Carousel */}
                  <button
                    onClick={() => setStatusIndex(prev => (prev === 0 ? statusSlides.length - 1 : prev - 1))}
                    className="absolute left-4 top-1/2 -translate-y-1/2 p-2 rounded-full hover:bg-white/10 text-gray-500 hover:text-white transition-colors z-10"
                  >
                    <ChevronLeft className="w-8 h-8" />
                  </button>
                  <button
                    onClick={() => setStatusIndex(prev => (prev === statusSlides.length - 1 ? 0 : prev + 1))}
                    className="absolute right-4 top-1/2 -translate-y-1/2 p-2 rounded-full hover:bg-white/10 text-gray-500 hover:text-white transition-colors z-10"
                  >
                    <ChevronRight className="w-8 h-8" />
                  </button>

                  <div className="flex flex-col items-center justify-center transition-all duration-300 transform scale-100">
                    {(() => {
                      const SlideIcon = statusSlides[statusIndex].icon;
                      return (
                        <>
                          <SlideIcon
                            className={cn("w-14 h-14 mb-4", statusSlides[statusIndex].color)}
                            style={{ filter: `drop-shadow(0 0 15px ${statusSlides[statusIndex].glow})` }}
                          />
                          <div className="font-heading font-black text-sm tracking-widest uppercase text-gray-400 mb-1">
                            {statusSlides[statusIndex].label}
                          </div>
                          <div className={cn("font-heading font-black text-7xl", statusSlides[statusIndex].color)} style={{ filter: 'drop-shadow(0 2px 10px rgba(0,0,0,0.8))' }}>
                            {statusSlides[statusIndex].value}
                          </div>
                          <div className="text-sm text-gray-500 font-bold uppercase tracking-widest mt-2">
                            {statusSlides[statusIndex].suffix}
                          </div>
                        </>
                      );
                    })()}
                  </div>

                  {/* Indicadores */}
                  <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-2">
                    {statusSlides.map((_, idx) => (
                      <div
                        key={idx}
                        onClick={() => setStatusIndex(idx)}
                        className={cn("h-1.5 rounded-full transition-all duration-300 cursor-pointer", idx === statusIndex ? "w-6 bg-white" : "w-1.5 bg-white/20 hover:bg-white/40")}
                      />
                    ))}
                  </div>
                </Card>
              </div>
            </div>

            <div className="flex flex-col gap-4">
              <h2 className="font-heading font-bold text-lg tracking-widest px-1 uppercase">Gráfico de Sacrifícios</h2>
              <Card className="h-[256px] flex items-center justify-center p-0 overflow-hidden relative border-white/10 bg-[#0B0F10]">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart cx="50%" cy="50%" outerRadius="65%" data={[
                    { subject: 'Saúde', A: Number(radarData.find(d => d.prioridade === 'Saúde')?.valor ?? 50), fullMark: 100 },
                    { subject: 'Família', A: Number(radarData.find(d => d.prioridade === 'Família')?.valor ?? 50), fullMark: 100 },
                    { subject: 'Social', A: Number(radarData.find(d => d.prioridade === 'Social')?.valor ?? 50), fullMark: 100 },
                    { subject: 'Trabalho', A: Number(radarData.find(d => d.prioridade === 'Trabalho')?.valor ?? 50), fullMark: 100 },
                    { subject: 'Estudos', A: Number(radarData.find(d => d.prioridade === 'Estudos')?.valor ?? 50), fullMark: 100 },
                  ]}>
                    <PolarGrid stroke="rgba(255,255,255,0.1)" />
                    <PolarAngleAxis dataKey="subject" tick={{ fill: '#9ca3af', fontSize: 10, fontWeight: 700 }} />
                    <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                    <Radar name="Sacrifícios" dataKey="A" stroke="#4850FF" strokeWidth={2} fill="#4850FF" fillOpacity={0.4} />
                  </RadarChart>
                </ResponsiveContainer>
              </Card>
            </div>
          </section>

          {/* PRÓXIMAS AÇÕES */}
          <section>
            <div className="flex items-center justify-between mb-3 px-1">
              <h2 className="font-heading font-bold text-lg tracking-widest uppercase">Próximas Ações</h2>
              <button className="text-xs text-ese-blue-light font-semibold hover:text-white flex items-center">
                VER TODAS <ChevronRight className="w-4 h-4 ml-1" />
              </button>
            </div>

            {/* Action Categories Filter */}
            <div className="flex gap-2 overflow-x-auto pb-4 scrollbar-hide">
              {[
                { label: 'TODAS', value: 'todas' },
                { label: 'DIÁRIAS', value: 'diaria' },
                { label: 'FAZER', value: 'fazer' },
                { label: 'MISSÕES', value: 'meta' },
                { label: 'BOSS', value: 'boss' },
                { label: 'PROBLEMAS', value: 'problema' }
              ].map((tab, i) => (
                <button
                  key={i}
                  onClick={() => setActiveFilter(tab.value)}
                  className={cn(
                    "px-4 py-1.5 rounded-full text-xs font-bold tracking-wider whitespace-nowrap transition-colors border",
                    activeFilter === tab.value
                      ? "bg-blue-600 text-white border-blue-500 shadow-[0_0_10px_rgba(37,99,235,0.4)]"
                      : "bg-white/5 text-gray-400 border-transparent hover:bg-white/10 hover:text-white"
                  )}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <button
              onClick={() => setIsModalOpen(true)}
              className="w-full py-3 mb-4 rounded-xl border border-dashed border-white/20 text-ese-blue-light font-bold tracking-wider hover:bg-white/5 transition-colors flex items-center justify-center gap-2"
            >
              <Plus className="w-5 h-5" /> CRIE UMA NOVA AÇÃO
            </button>

            <div className="space-y-8">

              {/* AREA 1: PENDENTES */}
              <div className="space-y-3">
                <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest px-1 mb-2">Pendentes</h3>

                {filteredPendingActions.length === 0 && (
                  <div className="text-center py-4 bg-white/5 rounded-xl border border-white/5 text-gray-500 text-sm italic">
                    Nenhuma ação nesta categoria. Que calmaria!
                  </div>
                )}

                {filteredPendingActions.map((action) => {
                  const pillarColor = pillars.find((p: any) => p.name?.toLowerCase() === action.pillar?.toLowerCase())?.color;
                  return (
                    <AcaoCard
                      key={action.id}
                      action={action}
                      pillarColor={pillarColor}
                      draggable={false}
                      onStatusChange={handleStatusChange}
                      onDetailsClick={setSelectedAction}
                    />
                  );
                })}
              </div>

              {/* AREA 2: RECENTES (< 24h) */}
              {concluidasRecentes.length > 0 && (
                <div className="space-y-3">
                  <h3 className="text-xs font-bold text-green-500 uppercase tracking-widest px-1 mb-2 drop-shadow-[0_0_8px_rgba(34,197,94,0.4)]">Feitas Hoje</h3>
                  {concluidasRecentes.map((action) => (
                    <Card key={action.id} className="p-3 flex items-center gap-4 transition-all group bg-green-500/5 border-green-500/10 hover:bg-green-500/10">
                      <div className="flex-shrink-0 text-green-500">
                        <CheckCircle2 className="w-6 h-6" />
                      </div>

                      <div className="flex-1 min-w-0 opacity-80">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-bold truncate text-sm text-green-100 line-through">
                            {action.title}
                          </h3>
                        </div>
                        <div className="flex flex-wrap items-center gap-2 text-[10px] font-semibold tracking-wider mt-1">
                          <span className="text-blue-400 flex items-center gap-0.5 opacity-70">⚡ {action.xp_reward || 0}</span>
                          <span className="text-yellow-400 flex items-center gap-0.5 opacity-70">🪙 {action.ese_reward || 0}</span>
                          <span className="text-gray-500 uppercase px-1.5 py-0.5 border border-transparent truncate max-w-[80px]" title={action.pillar || 'Geral'}>{action.pillar || 'Geral'}</span>
                          {action.sacrifice_priority && (
                            <span className="text-purple-400 uppercase font-bold px-1.5 py-0.5 truncate max-w-[80px]" title={action.sacrifice_priority}>
                              📊 {action.sacrifice_priority}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 flex-shrink-0">
                        <button
                          onClick={() => undoAction(action)}
                          className="p-2 bg-green-500/10 rounded-full text-green-400 hover:text-white hover:bg-green-500 transition-colors shadow-sm border border-transparent hover:border-green-500"
                          title="Desfazer (Reverter)"
                        >
                          <RotateCcw className="w-5 h-5" />
                        </button>
                      </div>
                    </Card>
                  ))}
                </div>
              )}

              {/* AREA 3: HISTÓRICO (> 24h) — acesse via /acoes no Sidebar */}
            </div>
          </section>

          {/* UPGRADE BANNER */}
          <section className="pt-4">
            <div className="bg-gradient-to-r from-ese-blue to-purple-600 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4 border border-white/20 shadow-[0_0_30px_rgba(72,80,255,0.3)]">
              <div>
                <h3 className="font-heading font-black text-lg italic tracking-wider">[UPGRADE TO PRO R$ 19,99/month]</h3>
                <ul className="text-xs text-white/80 mt-1 list-disc list-inside">
                  <li>Unlimited actions in all categories</li>
                  <li>Complete Database without limit</li>
                  <li>Complete Experience without restriction</li>
                </ul>
              </div>
              <button className="w-full sm:w-auto px-6 py-2 bg-white text-ese-dark font-black tracking-widest rounded-xl hover:bg-gray-200 transition-colors">
                UPGRADE
              </button>
            </div>
          </section>

        </div>
      </main>

      {isModalOpen && (
        <CreateActionModal
          pillars={pillars}
          onClose={() => setIsModalOpen(false)}
          onSuccess={() => {
            setIsModalOpen(false);
            if (userData?.id) {
              fetchActions(userData.id);
            }
          }}
        />
      )}

      {selectedAction && (
        <ActionDetailsModal
          action={selectedAction}
          pillars={pillars}
          onClose={() => setSelectedAction(null)}
          onSuccess={() => {
            setSelectedAction(null);
            if (userData?.id) fetchActions(userData.id);
          }}
        />
      )}

      {isEditProfileModalOpen && (
        <EditProfileModal
          userData={userData}
          onClose={() => setIsEditProfileModalOpen(false)}
          onSuccess={(newPayload) => {
            setIsEditProfileModalOpen(false);
            setUserData((prev: any) => ({
              ...prev,
              name: newPayload.nickname,
              vocation: newPayload.vocation
            }));
          }}
        />
      )}

      {isEditPillarsModalOpen && (
        <EditPillarsModal
          userData={userData}
          currentPillars={pillars}
          onClose={() => setIsEditPillarsModalOpen(false)}
          onSuccess={() => {
            setIsEditPillarsModalOpen(false);
            if (userData?.id) fetchPillars(userData.id);
          }}
        />
      )}

      <BottomNav active="/" />

      {/* === TOAST POP-UP OVERLAY === */}
      <div className="fixed top-20 right-4 z-[200] flex flex-col gap-2 pointer-events-none">
        {popups.map(p => {
          const iconMap: Record<string, string> = {
            level_up: '🎉',
            pilar_up: '📈',
            ofensiva: '🔥',
            radar_drop: '⚠️',
          };
          const icon = iconMap[p.type] || '🔔';
          return (
            <div
              key={p.id}
              style={{
                animation: 'toastSlideIn 0.35s cubic-bezier(0.34,1.56,0.64,1) both',
              }}
              className="pointer-events-auto w-72 bg-[#0B0F10]/95 backdrop-blur-xl border border-white/10 rounded-2xl p-4 flex items-start gap-3 shadow-2xl"
            >
              <span className="text-2xl leading-none mt-0.5 flex-shrink-0">{icon}</span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-black text-white tracking-wide leading-tight">{p.title}</p>
                <p className="text-xs text-gray-400 mt-1 leading-snug">{p.message}</p>
              </div>
            </div>
          );
        })}
      </div>

      <style>{`
        @keyframes toastSlideIn {
          from { opacity: 0; transform: translateX(110%) scale(0.9); }
          to   { opacity: 1; transform: translateX(0)   scale(1);   }
        }
      `}</style>
    </div>
  );
}
