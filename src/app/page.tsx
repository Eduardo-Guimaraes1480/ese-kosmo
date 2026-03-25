"use client";
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/src/lib/supabase';
import {
  Home, Flame, Store, Users, MessageSquare, Settings, Globe,
  Menu, X, ChevronLeft, ChevronRight, CheckCircle2, Circle, Plus, User,
  Shield, Zap, Target, Award, Skull, AlertTriangle, LogOut, Trash2, RotateCcw, MoreVertical, Bell
} from 'lucide-react';
import {
  Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer
} from 'recharts';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

// Utility for merging tailwind classes safely
function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function calculateLevelInfo(totalXp: number) {
  if (totalXp < 100) return { level: 1, xpInCurrentLevel: totalXp, xpNext: 100 };
  let currentLevel = 1;
  let xpAccumulated = 0;
  let xpForNext = 100;

  for (let i = 1; i < 11; i++) {
    if (totalXp >= xpAccumulated + xpForNext) {
      xpAccumulated += xpForNext;
      currentLevel++;
      xpForNext *= 2;
    } else {
      break;
    }
  }

  if (totalXp >= 204700) { // 204700 é o acumulado total no Nível 11
    let excessXp = totalXp - 204700;
    let extraLevels = Math.floor(excessXp / 100000);
    currentLevel = 12 + extraLevels;
    return { 
      level: currentLevel, 
      xpInCurrentLevel: excessXp % 100000, 
      xpNext: 100000 
    };
  }

  return {
    level: currentLevel,
    xpInCurrentLevel: totalXp - xpAccumulated,
    xpNext: xpForNext
  };
}

// --- MOCK DATA ---
const USER_DATA = {
  name: "DUDUGUI",
  vocation: "EXPLORADOR",
  level: 12,
  xp: 8450,
  xpNext: 10000,
  hp: 100,
  maxHp: 100,
  ese: 1250,
};

const PILLARS = [
  { name: "Physical", level: 1, progress: 85, color: "bg-purple-500" },
  { name: "Mental", level: 1, progress: 70, color: "bg-blue-400" },
  { name: "Work", level: 1, progress: 40, color: "bg-green-400" },
  { name: "Spirit", level: 1, progress: 70, color: "bg-yellow-400" },
  { name: "Social", level: 1, progress: 50, color: "bg-pink-400" },
  { name: "Etc..", level: 1, progress: 45, color: "bg-gray-400" },
];

const RADAR_DATA = [
  { subject: 'SAÚDE', A: 120, fullMark: 150 },
  { subject: 'SOCIAL', A: 98, fullMark: 150 },
  { subject: 'ESTUDOS', A: 86, fullMark: 150 },
  { subject: 'TRABALHO', A: 99, fullMark: 150 },
  { subject: 'FAMÍLIA', A: 85, fullMark: 150 },
];

const ACTIONS = [
  { id: 1, title: "Treino de Força (45min)", xp: 10, ese: 5, pillar: "Physical", completed: true },
  { id: 2, title: "Ler 20 páginas", xp: 5, ese: 0, pillar: "Mental", completed: false },
  { id: 3, title: "Reunião de Alinhamento", xp: 15, ese: 10, pillar: "Work", completed: true },
  { id: 4, title: "Meditação (10min)", xp: 5, ese: 2, pillar: "Spirit", completed: false },
  { id: 5, title: "Ligar para os pais", xp: 5, ese: 1, pillar: "Social", completed: false },
];

const ACTION_CATEGORIES = [
  { name: "DIÁRIAS", subtitle: "MAX 20 | Plano FREE", icon: <CheckCircle2 className="w-6 h-6" />, color: "text-gray-300" },
  { name: "FAZER", subtitle: "MAX 10/dia | Plano FREE", icon: <Menu className="w-6 h-6" />, color: "text-blue-400" },
  { name: "MISSÕES", subtitle: "MAX 5/mês | Plano FREE", icon: <Target className="w-6 h-6" />, color: "text-purple-400" },
  { name: "CONQUISTAS", subtitle: "MAX 3/mês | Plano FREE", icon: <Award className="w-6 h-6" />, color: "text-yellow-400" },
  { name: "BOSS", subtitle: "MAX 1/mês | Plano FREE", icon: <Skull className="w-6 h-6" />, color: "text-red-500" },
  { name: "PROBLEMAS", subtitle: "Inimigos", icon: <AlertTriangle className="w-6 h-6" />, color: "text-orange-500" },
];

// --- COMPONENTS ---

const Card = ({ children, className, onClick }: { children: React.ReactNode; className?: string; onClick?: () => void }) => (
  <div className={cn("bg-ese-gray/40 backdrop-blur-md border border-white/10 rounded-2xl p-4", className)} onClick={onClick}>
    {children}
  </div>
);

const ProgressBar = ({ progress, colorClass, heightClass = "h-2" }: { progress: number, colorClass: string, heightClass?: string }) => (
  <div className={cn("w-full bg-black/50 rounded-full overflow-hidden", heightClass)}>
    <div
      className={cn("h-full rounded-full transition-all duration-500", colorClass)}
      style={{ width: `${progress}%` }}
    />
  </div>
);

const VerticalProgressBar = ({ progress, colorClass, label, sublabel }: { progress: number, colorClass: string, label: string, sublabel: string }) => (
  <div className="flex flex-col items-center justify-end gap-2 h-full">
    <div className="text-lg font-black text-white drop-shadow-md shrink-0">
      {Math.round(progress)}%
    </div>
    <div className="h-32 w-16 bg-black/50 rounded-2xl overflow-hidden relative flex flex-col justify-end shadow-inner border border-white/5">
      <div
        className={cn("w-full transition-all duration-500 rounded-b-2xl", colorClass)}
        style={{ height: `${Math.min(100, Math.max(0, progress))}%` }}
      />
    </div>
    <div className="text-center w-20 overflow-hidden flex flex-col items-center gap-1 mt-1">
      <div className="text-[10px] font-bold text-white uppercase tracking-wider truncate w-full" title={label}>{label}</div>
      <div className={cn("text-[10px] font-black tracking-widest px-2 py-0.5 rounded-md bg-white/5 border border-white/10", colorClass.replace('bg-', 'text-'))}>{sublabel}</div>
    </div>
  </div>
);

const Sidebar = ({ isOpen, onClose, onLogout }: { isOpen: boolean; onClose: () => void; onLogout: () => void }) => {
  const navItems = [
    { icon: <Home className="w-5 h-5" />, label: "Home", active: true },
    { icon: <Flame className="w-5 h-5" />, label: "Ações" },
    { icon: <Store className="w-5 h-5" />, label: "Loja de Recompensas" },
    { icon: <Users className="w-5 h-5" />, label: "Minha Equipe" },
    { icon: <MessageSquare className="w-5 h-5" />, label: "Comunidade" },
    { icon: <Settings className="w-5 h-5" />, label: "Configurações" },
    { icon: <Globe className="w-5 h-5" />, label: "Ir para Rede Social" },
  ];

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar Content */}
      <aside className={cn(
        "fixed top-0 left-0 h-full w-72 bg-ese-black border-r border-white/5 z-50 transform transition-transform duration-300 ease-in-out flex flex-col",
        isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0",
        "lg:static lg:block"
      )}>
        <div className="p-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-ese-blue flex items-center justify-center">
              <User className="w-6 h-6 text-white" />
            </div>
            <span className="font-heading font-bold text-xl tracking-wider">SIDEBAR</span>
          </div>
          <button onClick={onClose} className="lg:hidden text-gray-400 hover:text-white">
            <X className="w-6 h-6" />
          </button>
        </div>

        <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
          {navItems.map((item, idx) => (
            <button
              key={idx}
              className={cn(
                "w-full flex items-center gap-4 px-4 py-3 rounded-xl transition-all duration-200",
                item.active
                  ? "bg-white/10 text-white font-semibold"
                  : "text-gray-400 hover:bg-white/5 hover:text-gray-200"
              )}
            >
              {item.icon}
              <span className="text-sm tracking-wide">{item.label}</span>
            </button>
          ))}
          <button
            onClick={onLogout}
            className="w-full flex items-center gap-4 px-4 py-3 rounded-xl transition-all duration-200 text-red-500 hover:bg-red-500/10 hover:text-red-400 mt-4"
          >
            <LogOut className="w-5 h-5" />
            <span className="text-sm tracking-wide">Sair</span>
          </button>
        </nav>

        <div className="p-6 border-t border-white/5 text-xs text-gray-500 space-y-2">
          <a href="#" className="block hover:text-gray-300">Termos de Uso</a>
          <a href="#" className="block hover:text-gray-300">Privacidade</a>
          <div className="pt-4">ESE Productions 2026</div>
        </div>
      </aside>
    </>
  );
};

const BottomNav = () => (
  <div className="fixed bottom-0 left-0 right-0 bg-ese-black/90 backdrop-blur-lg border-t border-white/10 p-2 z-30 lg:hidden">
    <div className="flex justify-around items-center">
      <button className="p-3 text-ese-blue-light"><Home className="w-6 h-6" /></button>
      <button className="p-3 text-gray-500 hover:text-gray-300"><Flame className="w-6 h-6" /></button>
      <button className="p-3 text-gray-500 hover:text-gray-300"><Store className="w-6 h-6" /></button>
      <button className="p-3 text-gray-500 hover:text-gray-300"><Users className="w-6 h-6" /></button>
    </div>
  </div>
);

const CreateActionModal = ({ onClose, onSuccess, pillars }: { onClose: () => void, onSuccess: () => void, pillars: any[] }) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState('diaria');
  const [pilar, setPilar] = useState(pillars[0]?.name || 'Geral');
  const [sacrificePriority, setSacrificePriority] = useState('Saúde');
  const [xpReward, setXpReward] = useState(10);
  const [eseReward, setEseReward] = useState(5);
  const [pilarImpact, setPilarImpact] = useState<number | string>(0.5);
  const [radarImpact, setRadarImpact] = useState<number | string>(0.5);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const actionTypes = [
    { id: 'diaria', label: 'DIÁRIA' },
    { id: 'fazer', label: 'FAZER' },
    { id: 'meta', label: 'MISSÕES' },
    { id: 'boss', label: 'BOSS' },
    { id: 'problema', label: 'INIMIGO' },
  ];

  const priorities = ['Saúde', 'Família', 'Social', 'Trabalho', 'Estudos'];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title) return;
    setLoading(true);
    setError(null);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Usuário não autenticado.");

      const payload: any = {
        user_id: session.user.id,
        title,
        type,
        pillar: pilar,
        sacrifice_priority: sacrificePriority,
        xp_reward: parseInt(xpReward.toString(), 10) || 0,
        ese_reward: parseInt(eseReward.toString(), 10) || 0,
        pilar_impact: parseFloat(pilarImpact.toString()) || 0,
        radar_impact: parseFloat(radarImpact.toString()) || 0,
      };

      if (description) {
        payload.description = description;
      }

      const { error: insertError } = await supabase.from('actions').insert([payload]);

      if (insertError) throw insertError;

      onSuccess();
    } catch (err: any) {
      console.error(err);
      setError("Falha ao criar ação. Verifique os dados.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-50 flex items-center justify-center p-4">
      <div className="bg-[#0B0F10] border border-gray-800 rounded-2xl w-full max-w-lg p-6 relative overflow-hidden flex flex-col max-h-[90vh]">
        {/* Glow effect */}
        <div className="absolute -top-32 -right-32 w-64 h-64 bg-blue-600 rounded-full mix-blend-screen filter blur-[100px] opacity-10 pointer-events-none" />

        {/* Header Premium */}
        <div className="flex justify-between items-center mb-6 shrink-0 relative z-10 border-b border-gray-800/50 pb-4">
          <div className="w-8" />
          <h2 className="font-sans font-bold text-lg tracking-widest text-white text-center">CRIAR AÇÕES</h2>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full text-gray-500 hover:text-white hover:bg-white/10 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="mb-4 bg-red-500/10 border border-red-500/50 text-red-400 text-sm p-3 rounded-lg text-center shrink-0">
            {error}
          </div>
        )}

        {/* Scrollable Formulário */}
        <div className="flex-1 overflow-y-auto pr-2 relative z-10 flex flex-col gap-6" style={{ scrollbarWidth: 'none' }}>

          {/* Visual Tabs (Pills de Tipo) */}
          <div>
            <label className="text-[10px] text-gray-500 font-bold tracking-widest uppercase mb-2 block">Tipo de Ação</label>
            <div className="flex flex-wrap gap-2">
              {actionTypes.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setType(t.id)}
                  className={cn(
                    "px-4 py-2 rounded-full text-xs font-bold tracking-wider transition-colors border",
                    type === t.id
                      ? "bg-blue-600 text-white border-blue-600 shadow-[0_0_10px_rgba(37,99,235,0.3)]"
                      : "bg-gray-800 text-gray-400 border-transparent hover:bg-gray-700 hover:text-white"
                  )}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {/* Inputs */}
          <div className="space-y-4">
            <div>
              <label className="text-[10px] text-gray-500 font-bold tracking-widest uppercase mb-2 block">Título da Ação</label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full bg-[#111618] border-none rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:ring-1 focus:ring-blue-500 outline-none transition-all"
                placeholder="Ex: Correr 5km pela manhã"
              />
            </div>

            <div>
              <label className="text-[10px] text-gray-500 font-bold tracking-widest uppercase mb-2 block">Descrição (Opcional)</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                className="w-full bg-[#111618] border-none rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:ring-1 focus:ring-blue-500 outline-none transition-all resize-none"
                placeholder="Detalhes ou passos necessários..."
              />
            </div>
          </div>

          {/* Recompensas de XP e E$E */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-[10px] text-gray-500 font-bold tracking-widest uppercase mb-2 block flex items-center gap-1">XP (Máx 2500)</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-blue-400 font-bold">
                  ⚡
                </div>
                <input
                  type="number"
                  min="0"
                  max="2500"
                  value={xpReward}
                  onChange={(e) => setXpReward(Math.min(2500, Math.max(0, Number(e.target.value))))}
                  className="w-full bg-[#111618] border-none rounded-xl pl-9 pr-4 py-3 text-white focus:ring-1 focus:ring-blue-500 outline-none font-bold transition-all"
                />
              </div>
            </div>
            <div>
              <label className="text-[10px] text-gray-500 font-bold tracking-widest uppercase mb-2 block flex items-center gap-1">E$E (Máx 1000)</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-yellow-400 font-bold">
                  🪙
                </div>
                <input
                  type="number"
                  min="0"
                  max="1000"
                  value={eseReward}
                  onChange={(e) => setEseReward(Math.min(1000, Math.max(0, Number(e.target.value))))}
                  className="w-full bg-[#111618] border-none rounded-xl pl-9 pr-4 py-3 text-yellow-500 focus:ring-1 focus:ring-blue-500 outline-none font-bold transition-all"
                />
              </div>
            </div>
          </div>

          {/* Recompensas de Escala (Pilares e Radar) */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-[10px] text-gray-500 font-bold tracking-widest uppercase mb-2 block flex items-center gap-1">Impacto Pilar (%)</label>
              <div className="relative">
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  max="100"
                  value={pilarImpact}
                  onChange={(e) => setPilarImpact(e.target.value)}
                  className="w-full bg-[#111618] border-none rounded-xl px-4 py-3 text-white focus:ring-1 focus:ring-blue-500 outline-none font-bold transition-all"
                />
              </div>
            </div>
            <div>
              <label className="text-[10px] text-gray-500 font-bold tracking-widest uppercase mb-2 block flex items-center gap-1">Avanço Radar (%)</label>
              <div className="relative">
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  max="100"
                  value={radarImpact}
                  onChange={(e) => setRadarImpact(e.target.value)}
                  className="w-full bg-[#111618] border-none rounded-xl px-4 py-3 text-purple-400 focus:ring-1 focus:ring-purple-500 outline-none font-bold transition-all"
                />
              </div>
            </div>
          </div>

          {/* Seletor Pilares e Prioridade Gráfico */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-[10px] text-gray-500 font-bold tracking-widest uppercase mb-2 block">Pilar Kosmo</label>
              <div className="flex flex-wrap gap-2">
                {pillars.length === 0 ? (
                  <span className="text-xs text-red-500 font-semibold italic">Pilares não configurados.</span>
                ) : (
                  pillars.map((p) => (
                    <button
                      key={p.name}
                      type="button"
                      onClick={() => setPilar(p.name)}
                      className={cn(
                        "px-3 py-1.5 rounded-full text-[10px] font-bold tracking-wider transition-colors border",
                        pilar === p.name
                          ? "bg-blue-600 text-white border-blue-600 shadow-[0_0_10px_rgba(37,99,235,0.3)]"
                          : "bg-gray-800 text-gray-400 border-transparent hover:bg-gray-700 hover:text-white"
                      )}
                    >
                      {p.name}
                    </button>
                  ))
                )}
              </div>
            </div>

            <div>
              <label className="text-[10px] text-gray-500 font-bold tracking-widest uppercase mb-2 block">Prioridade Gráfico</label>
              <div className="flex flex-wrap gap-2">
                {priorities.map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setSacrificePriority(p)}
                    className={cn(
                      "px-3 py-1.5 rounded-full text-[10px] font-bold tracking-wider transition-colors border",
                      sacrificePriority === p
                        ? "bg-purple-600 text-white border-purple-600 shadow-[0_0_10px_rgba(147,51,234,0.3)]"
                        : "bg-gray-800 text-gray-400 border-transparent hover:bg-gray-700 hover:text-white"
                    )}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>
          </div>

        </div>

        {/* Botão de Save Premium */}
        <div className="pt-6 shrink-0 relative z-10 border-t border-gray-800/50 mt-4">
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="w-full py-4 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold tracking-widest transition-colors flex justify-center items-center shadow-[0_0_15px_rgba(37,99,235,0.4)] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <svg className="animate-spin h-5 w-5 text-white" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            ) : (
              "SALVAR AÇÃO"
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

// --- ACTION DETAILS MODAL ---
const ActionDetailsModal = ({ onClose, onSuccess, action, pillars }: { onClose: () => void; onSuccess: () => void; action: any; pillars: any[] }) => {
  const [title, setTitle] = useState(action.title || '');
  const [description, setDescription] = useState(action.description || '');
  const [type, setType] = useState(action.type || 'diaria');
  const [pilar, setPilar] = useState(action.pillar || action.pilar_id || pillars[0]?.name || 'Geral');
  const [sacrificePriority, setSacrificePriority] = useState(action.sacrifice_priority || 'Saúde');
  const [xpReward, setXpReward] = useState<number | string>(action.xp_reward || 0);
  const [eseReward, setEseReward] = useState<number | string>(action.ese_reward || 0);
  const [pilarImpact, setPilarImpact] = useState<number | string>(action.pilar_impact || 0.5);
  const [radarImpact, setRadarImpact] = useState<number | string>(action.radar_impact || 0.5);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const priorities = ['Saúde', 'Família', 'Social', 'Trabalho', 'Estudos'];

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title) return;
    setLoading(true);
    setError(null);

    try {
      const payload: any = {
        title,
        type,
        pillar: pilar,
        sacrifice_priority: sacrificePriority,
        xp_reward: parseInt(xpReward.toString(), 10) || 0,
        ese_reward: parseInt(eseReward.toString(), 10) || 0,
        pilar_impact: parseFloat(pilarImpact.toString()) || 0,
        radar_impact: parseFloat(radarImpact.toString()) || 0,
        description,
      };

      const { error: updateError } = await supabase.from('actions').update(payload).eq('id', action.id);
      if (updateError) throw updateError;
      onSuccess();
    } catch (err: any) {
      console.error(err);
      setError("Falha ao atualizar ação.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-[100] flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-[#0B0F10] border border-gray-800 rounded-2xl w-full max-w-lg p-6 relative overflow-hidden flex flex-col my-auto max-h-[90vh]">
        {/* Glow effect */}
        <div className="absolute -top-32 -right-32 w-64 h-64 bg-blue-600 rounded-full mix-blend-screen filter blur-[100px] opacity-10 pointer-events-none" />

        {/* Header Premium */}
        <div className="flex justify-between items-start mb-6 shrink-0 relative z-10 border-b border-gray-800/50 pb-4 mt-2">
          <div className="flex-1 mr-4">
            <span className="text-xs text-blue-400 font-bold tracking-widest uppercase mb-1 block">Detalhes da Missão</span>
             <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-transparent border-none text-2xl font-black text-white focus:outline-none focus:ring-0 p-0 m-0 placeholder-gray-600"
              placeholder="Título da Ação"
            />
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors cursor-pointer">
            <X className="w-5 h-5 text-gray-500 hover:text-white" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar space-y-5 relative z-10">
          {error && <div className="p-3 bg-red-900/30 border border-red-500/50 rounded-xl text-red-200 text-sm font-semibold">{error}</div>}

          {/* Description */}
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest pl-1">Descrição Detalhada</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Adicione detalhes, notas ou checklists..."
              className="w-full bg-[#0d1315] border border-white/5 rounded-xl p-3 text-sm text-gray-300 focus:outline-none focus:border-ese-blue-light transition-colors resize-none h-24"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Pilar */}
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest pl-1">Pilar KOSMO</label>
                <select
                  value={pilar}
                  onChange={(e) => setPilar(e.target.value)}
                  className="w-full bg-[#0d1315] border border-white/5 rounded-xl p-3 text-sm font-bold text-white focus:outline-none focus:border-ese-blue-light appearance-none truncate"
                >
                  {pillars.length === 0 ? (
                    <option value="">Sem Pilares</option>
                  ) : (
                    pillars.map(p => <option key={p.name} value={p.name}>{p.name}</option>)
                  )}
                </select>
              </div>

              {/* Prioridade do Gráfico */}
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest pl-1">Grau Impacto / Radar</label>
                <select
                  value={sacrificePriority}
                  onChange={(e) => setSacrificePriority(e.target.value)}
                  className="w-full bg-[#0d1315] border border-purple-500/20 rounded-xl p-3 text-sm font-bold text-purple-200 focus:outline-none focus:border-purple-500 appearance-none drop-shadow-[0_0_8px_rgba(147,51,234,0.1)]"
                >
                  {priorities.map(p => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>
            </div>
            
            {/* Tipo */}
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest pl-1">Tipo</label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value)}
                className="w-full bg-[#0d1315] border border-white/5 rounded-xl p-3 text-sm font-bold text-white focus:outline-none focus:border-ese-blue-light appearance-none"
              >
                <option value="diaria">DIÁRIA</option>
                <option value="fazer">FAZER</option>
                <option value="meta">META</option>
                <option value="boss">BOSS</option>
                <option value="problema">INIMIGO</option>
              </select>
            </div>
          </div>

          {/* Recompensas e Impactos */}
          <div className="p-4 bg-white/5 border border-white/10 rounded-xl space-y-4">
             <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest block border-b border-white/5 pb-2">Recompensas e Impacto</label>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-[10px] font-black tracking-widest text-blue-400 flex items-center gap-1">⚡ POTENCIAL XP</label>
                <input
                  type="number"
                  value={xpReward}
                  onChange={(e) => setXpReward(e.target.value)}
                  className="w-full bg-black/50 border border-white/10 rounded-lg p-2 text-center font-black text-white focus:outline-none focus:border-blue-500"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black tracking-widest text-yellow-500 flex items-center gap-1">🪙 CRÉDITOS E$E</label>
                <input
                  type="number"
                  value={eseReward}
                  onChange={(e) => setEseReward(e.target.value)}
                  className="w-full bg-black/50 border border-white/10 rounded-lg p-2 text-center font-black text-white focus:outline-none focus:border-yellow-500"
                />
              </div>
              <div className="space-y-2 pt-2">
                <label className="text-[10px] font-black tracking-widest text-green-400 flex items-center gap-1">📈 IMPACTO PILAR %</label>
                <input
                  type="number"
                  step="0.1"
                  value={pilarImpact}
                  onChange={(e) => setPilarImpact(e.target.value)}
                  className="w-full bg-black/50 border border-white/10 rounded-lg p-2 text-center font-black text-white focus:outline-none focus:border-green-500"
                />
              </div>
              <div className="space-y-2 pt-2">
                <label className="text-[10px] font-black tracking-widest text-purple-400 flex items-center gap-1">📊 AVANÇO RADAR %</label>
                <input
                  type="number"
                  step="0.1"
                  value={radarImpact}
                  onChange={(e) => setRadarImpact(e.target.value)}
                  className="w-full bg-black/50 border border-white/10 rounded-lg p-2 text-center font-black text-white focus:outline-none focus:border-purple-500"
                />
              </div>
            </div>
          </div>

          {/* Módulos de Potência (Placeholders VISUAIS v2) */}
          <div className="space-y-2 pt-2">
            <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest pl-1">Ferramentas de Missão (Em Breve)</label>
            <div className="grid grid-cols-4 gap-2">
              <button disabled className="p-2 bg-white/5 border border-dashed border-white/10 rounded-xl text-center flex flex-col items-center justify-center gap-1 opacity-40 cursor-not-allowed">
                <span className="text-lg">⏱️</span><span className="text-[8px] font-black text-gray-400 uppercase tracking-widest leading-tight">Pomodoro</span>
              </button>
              <button disabled className="p-2 bg-white/5 border border-dashed border-white/10 rounded-xl text-center flex flex-col items-center justify-center gap-1 opacity-40 cursor-not-allowed">
                <span className="text-lg">🎭</span><span className="text-[8px] font-black text-gray-400 uppercase tracking-widest leading-tight">Humor</span>
              </button>
              <button disabled className="p-2 bg-white/5 border border-dashed border-white/10 rounded-xl text-center flex flex-col items-center justify-center gap-1 opacity-40 cursor-not-allowed">
                <span className="text-lg">🚀</span><span className="text-[8px] font-black text-gray-400 uppercase tracking-widest leading-tight">Boost x1.5</span>
              </button>
              <button disabled className="p-2 bg-white/5 border border-dashed border-white/10 rounded-xl text-center flex flex-col items-center justify-center gap-1 opacity-40 cursor-not-allowed">
                <span className="text-lg">📊</span><span className="text-[8px] font-black text-gray-400 uppercase tracking-widest leading-tight">Impacto</span>
              </button>
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="mt-6 pt-4 border-t border-gray-800/50 flex flex-col gap-3 shrink-0 relative z-10">
          <button
            onClick={handleUpdate}
            disabled={loading}
            className="w-full py-4 bg-ese-blue hover:bg-blue-600 text-white rounded-xl font-bold tracking-widest transition-colors flex justify-center items-center shadow-[0_0_15px_rgba(0,8,174,0.4)] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "SALVANDO..." : "SALVAR ALTERAÇÕES"}
          </button>
          <button
             onClick={() => console.log('Compartilhar na rede social')}
             className="w-full py-3 bg-transparent border border-dashed border-white/20 hover:bg-white/5 text-gray-400 hover:text-white rounded-xl font-bold tracking-widest transition-all text-sm flex items-center justify-center gap-2"
          >
             <Globe className="w-4 h-4" /> COMPARTILHAR NA REDE SOCIAL
          </button>
        </div>
      </div>
    </div>
  );
};

// --- EDIT PROFILE MODAL ---
const EditProfileModal = ({ onClose, onSuccess, userData }: { onClose: () => void; onSuccess: (payload: any) => void; userData: any }) => {
  const [nickname, setNickname] = useState(userData?.name || userData?.nickname || '');
  const [vocation, setVocation] = useState(userData?.vocation || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nickname) {
      setError("Nickname é obrigatório");
      return;
    }
    setLoading(true);
    setError(null);

    try {
      const payload = { nickname, vocation };
      const { error: updateError } = await supabase.from('profiles').update(payload).eq('id', userData.id);
      if (updateError) throw updateError;
      onSuccess(payload);
    } catch (err: any) {
      console.error(err);
      setError("Falha ao atualizar perfil.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-[100] flex items-center justify-center p-4">
      <div className="bg-[#0B0F10] border border-gray-800 rounded-2xl w-full max-w-sm p-6 relative overflow-hidden flex flex-col">

        <div className="flex justify-between items-start mb-6 shrink-0 relative z-10 border-b border-gray-800/50 pb-4 mt-2">
          <div className="flex-1 mr-4">
            <h2 className="text-sm text-ese-blue-light font-bold tracking-widest uppercase mb-1 block">EDITAR PERSONA</h2>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors cursor-pointer">
            <X className="w-5 h-5 text-gray-500 hover:text-white" />
          </button>
        </div>

        <div className="flex-1 space-y-4 relative z-10">
          {error && <div className="p-3 bg-red-900/30 border border-red-500/50 rounded-xl text-red-200 text-sm font-semibold">{error}</div>}

          <div className="space-y-2">
            <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest pl-1">Nickname</label>
            <input
              type="text"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              className="w-full bg-[#0d1315] border border-white/5 rounded-xl p-3 text-sm font-bold text-white focus:outline-none focus:border-ese-blue-light transition-colors"
              placeholder="Ex: Zero, Kakaroto..."
            />
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest pl-1">Vocação</label>
            <input
              type="text"
              value={vocation}
              onChange={(e) => setVocation(e.target.value)}
              className="w-full bg-[#0d1315] border border-white/5 rounded-xl p-3 text-sm font-bold text-white focus:outline-none focus:border-ese-blue-light transition-colors"
              placeholder="Ex: Desenvolvedor, Atleta..."
            />
          </div>
        </div>

        <div className="mt-6 pt-4 border-t border-gray-800/50 flex flex-col gap-3 shrink-0 relative z-10">
          <button
            onClick={handleUpdate}
            disabled={loading}
            className="w-full py-4 bg-ese-blue hover:bg-blue-600 text-white rounded-xl font-bold tracking-widest transition-colors flex justify-center items-center shadow-[0_0_15px_rgba(37,99,235,0.4)] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "SALVANDO..." : "SALVAR PERSONA"}
          </button>
        </div>
      </div>
    </div>
  );
};

// --- EDIT PILLARS MODAL ---
const EditPillarsModal = ({ onClose, onSuccess, userData, currentPillars }: { onClose: () => void; onSuccess: () => void; userData: any; currentPillars: any[] }) => {
  const [pillars, setPillars] = useState<any[]>(currentPillars || []);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const colors = [
    { label: "Azul Kosmo", value: "bg-ese-blue-light" },
    { label: "Roxo", value: "bg-purple-500" },
    { label: "Azul", value: "bg-blue-500" },
    { label: "Verde", value: "bg-green-500" },
    { label: "Amarelo", value: "bg-yellow-500" },
    { label: "Laranja", value: "bg-orange-500" },
    { label: "Vermelho", value: "bg-red-500" },
    { label: "Rosa", value: "bg-pink-500" },
    { label: "Ciano", value: "bg-cyan-500" },
  ];

  const handleAddPillar = () => {
    if (pillars.length >= 6) {
      setError("Você atingiu o limite de 6 pilares.");
      return;
    }
    setError(null);
    setPillars([...pillars, { name: '', color: 'bg-ese-blue-light', progress: 0, level: 1 }]);
  };

  const handleRemovePillar = (index: number) => {
    const newPillars = [...pillars];
    newPillars.splice(index, 1);
    setPillars(newPillars);
  };

  const handleChange = (index: number, field: string, value: string) => {
    const newPillars = [...pillars];
    newPillars[index] = { ...newPillars[index], [field]: value };
    setPillars(newPillars);
  };

  const handleSave = async () => {
    setLoading(true);
    setError(null);
    try {
      await supabase.from('pillars').delete().eq('user_id', userData.id);
      
      const toInsert = pillars.map(p => ({
        user_id: userData.id,
        name: p.name || 'Pilar Sem Nome',
        color: p.color,
        progress: p.progress || 0,
        level: p.level || 1,
      }));

      if (toInsert.length > 0) {
        const { error: insertError } = await supabase.from('pillars').insert(toInsert);
        if (insertError) throw insertError;
      }

      onSuccess();
    } catch (err) {
      console.error(err);
      setError("Falha ao salvar pilares. Verifique se a tabela 'pillars' existe.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-[100] flex items-center justify-center p-4">
      <div className="bg-[#0B0F10] border border-gray-800 rounded-2xl w-full max-w-lg p-6 relative flex flex-col max-h-[90vh]">
        <div className="flex justify-between items-start mb-4 shrink-0 border-b border-gray-800/50 pb-4 mt-2">
          <div className="flex-1 mr-4">
            <h2 className="text-sm text-ese-blue-light font-bold tracking-widest uppercase mb-1 block">CONFIGURAR PILARES</h2>
            <p className="text-xs text-gray-500">Defina até 6 pilares que representam os setores vitais da sua vida.</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors cursor-pointer">
            <X className="w-5 h-5 text-gray-500 hover:text-white" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar space-y-4">
          {error && <div className="p-3 bg-red-900/30 border border-red-500/50 rounded-xl text-red-200 text-sm font-semibold">{error}</div>}

          {pillars.map((p, idx) => (
            <div key={idx} className="flex flex-col sm:flex-row gap-3 p-4 bg-white/5 border border-white/10 rounded-xl items-end relative">
              <div className="flex-1 space-y-2 w-full">
                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest pl-1">Nome do Pilar</label>
                <input
                  type="text"
                  value={p.name}
                  onChange={(e) => handleChange(idx, 'name', e.target.value)}
                  className="w-full bg-[#0d1315] border border-white/5 rounded-xl p-3 text-sm font-bold text-white focus:outline-none focus:border-ese-blue-light"
                  placeholder="Ex: Saúde, Trabalho..."
                  maxLength={15}
                />
              </div>
              <div className="w-full sm:w-32 space-y-2">
                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest pl-1">Cor</label>
                <select
                  value={p.color}
                  onChange={(e) => handleChange(idx, 'color', e.target.value)}
                  className="w-full bg-[#0d1315] border border-white/5 rounded-xl p-3 text-sm font-bold text-white focus:outline-none focus:border-ese-blue-light appearance-none"
                >
                  {colors.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                </select>
              </div>
              <button
                onClick={() => handleRemovePillar(idx)}
                className="h-11 w-12 flex flex-shrink-0 items-center justify-center bg-red-500/10 hover:bg-red-500/20 text-red-500 rounded-xl transition-colors border border-red-500/20"
                title="Excluir Pilar"
              >
                <Trash2 className="w-5 h-5" />
              </button>
            </div>
          ))}

          {pillars.length < 6 && (
            <button
              onClick={handleAddPillar}
              className="w-full py-4 bg-transparent border border-dashed border-white/20 hover:bg-white/5 text-gray-400 hover:text-white rounded-xl font-bold tracking-widest transition-all text-sm flex items-center justify-center gap-2 mt-2"
            >
              <Plus className="w-4 h-4" /> ADICIONAR PILAR ({pillars.length}/6)
            </button>
          )}
        </div>

        <div className="mt-6 pt-4 border-t border-gray-800/50 flex flex-col shrink-0">
          <button
            onClick={handleSave}
            disabled={loading}
            className="w-full py-4 bg-ese-blue hover:bg-blue-600 text-white rounded-xl font-bold tracking-widest transition-colors flex justify-center items-center shadow-[0_0_15px_rgba(37,99,235,0.4)] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "SALVANDO..." : "SALVAR PILARES"}
          </button>
        </div>
      </div>
    </div>
  );
};

// --- MAIN APP COMPONENT ---

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
  const router = useRouter();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
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
  };

  const deleteAction = async (actionId: string) => {
    const { error } = await supabase.from('actions').delete().eq('id', actionId);
    if (!error) {
      setActions(prev => prev.filter(a => a.id !== actionId));
    } else {
      alert("Falha ao deletar ação.");
    }
  };

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
    
    const xpReward = Number(action.xp_reward || 0);
    const eseReward = Number(action.ese_reward || 0);
    
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
    { label: 'FAZER', value: countFazer, icon: Menu, suffix: 'pendentes', color: 'text-green-500', glow: 'rgba(34,197,94,0.3)' },
    { label: 'MISSÕES', value: countMissoes, icon: Target, suffix: 'pendentes', color: 'text-purple-500', glow: 'rgba(168,85,247,0.3)' },
    { label: 'BOSS', value: countBoss, icon: Skull, suffix: 'pendentes', color: 'text-red-500', glow: 'rgba(239,68,68,0.3)' },
    { label: 'INIMIGOS', value: countProblemas, icon: AlertTriangle, suffix: 'pendentes', color: 'text-yellow-500', glow: 'rgba(234,179,8,0.3)' }
  ];

  const concluidasRecentes = actions.filter(a => {
    if (a.status !== 'concluido') return false;
    if (!a.completed_at) return true; // Se concluída sem timer marcado, fica na recente
    const diff = now.getTime() - new Date(a.completed_at).getTime();
    return diff < ONE_DAY;
  });

  const historico = actions.filter(a => {
    if (a.status !== 'concluido' || !a.completed_at) return false;
    const diff = now.getTime() - new Date(a.completed_at).getTime();
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
        });

        await fetchActions(session.user.id);
        await fetchPillars(session.user.id);
        await fetchRadarData(session.user.id);
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

        {/* Mobile Header */}
        <header className="lg:hidden flex items-center justify-between p-4 border-b border-white/5 bg-ese-black/50 backdrop-blur-md z-20">
          <div 
            className="w-10 h-10 rounded-full bg-ese-gray/50 flex items-center justify-center border border-white/10 cursor-pointer hover:bg-white/10 transition-colors"
            onClick={() => setIsEditProfileModalOpen(true)}
            title="Editar Persona"
          >
            <User className="w-5 h-5 text-gray-300" />
          </div>
          <h1 className="font-heading font-bold text-lg tracking-widest">{activeTab}</h1>
          <button onClick={() => setSidebarOpen(true)} className="p-2 text-gray-300">
            <Menu className="w-6 h-6" />
          </button>
        </header>

        {/* Desktop Header */}
        <header className="hidden lg:flex items-center justify-between p-8 pb-4">
          <h1 className="font-heading font-bold text-3xl tracking-widest">{activeTab}</h1>
          <div 
            className="flex items-center gap-4 cursor-pointer hover:bg-white/5 transition-colors p-2 rounded-xl"
            onClick={() => setIsEditProfileModalOpen(true)}
            title="Editar Persona"
          >
            <div className="text-right">
              <div className="text-sm font-bold text-ese-blue-light">{userData?.name || USER_DATA.name}</div>
              <div className="text-xs text-gray-400">Nível {userData ? calculateLevelInfo(userData.xp).level : USER_DATA.level}</div>
            </div>
            <div className="w-12 h-12 rounded-full bg-ese-gray/80 flex items-center justify-center border border-white/20">
              <User className="w-6 h-6 text-gray-300" />
            </div>
          </div>
        </header>

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
                  <span className="font-heading font-bold text-lg">{userData?.name || USER_DATA.name}</span>
                </div>
                <div className="flex justify-between items-end border-b border-white/10 pb-2">
                  <span className="text-xs text-gray-400 font-semibold tracking-wider">VOCAÇÃO</span>
                  <span className="font-heading font-bold text-ese-blue-light">{userData?.vocation || USER_DATA.vocation}</span>
                </div>
                <div className="flex justify-between items-center border-b border-white/10 pb-2">
                  <span className="text-xs text-gray-400 font-semibold tracking-wider">XP</span>
                  <div className="flex-1 mx-4">
                    {(() => {
                        const info = calculateLevelInfo(userData?.xp || USER_DATA.xp);
                        const progressPercent = Math.min(100, (info.xpInCurrentLevel / info.xpNext) * 100);
                        return <ProgressBar progress={progressPercent} colorClass="bg-ese-blue-light" />;
                    })()}
                  </div>
                  <span className="font-mono text-sm">
                    {(() => {
                        const info = calculateLevelInfo(userData?.xp || USER_DATA.xp);
                        return `${info.xpInCurrentLevel}/${info.xpNext} XP`;
                    })()}
                  </span>
                </div>
                <div className="flex justify-between items-center border-b border-white/10 pb-2">
                  <span className="text-xs text-gray-400 font-semibold tracking-wider">PONTOS DE VIDA</span>
                  <div className="flex-1 mx-4">
                    <ProgressBar progress={((userData?.hp || USER_DATA.hp) / (userData?.maxHp || USER_DATA.maxHp)) * 100} colorClass="bg-red-500" />
                  </div>
                  <span className="font-mono text-sm">{userData?.hp || USER_DATA.hp}</span>
                </div>
                <div className="flex justify-between items-end pt-1">
                  <span className="text-xs text-gray-400 font-semibold tracking-wider">E$E</span>
                  <span className="font-heading font-bold text-yellow-400 text-lg">{userData?.ese || USER_DATA.ese}</span>
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
                <div className="flex justify-between items-end px-2 sm:px-6">
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

                {filteredPendingActions.map((action) => (
                  <Card key={action.id} className="p-3 flex items-center gap-4 hover:bg-white/5 transition-all group">
                    <div className="flex-shrink-0 text-gray-500">
                      <Circle className="w-6 h-6" />
                    </div>

                    <div
                      className="flex-1 min-w-0 cursor-pointer"
                      onClick={() => setSelectedAction(action)}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <span className={cn(
                          "text-[9px] px-2 py-0.5 rounded shadow-sm uppercase font-black tracking-wider",
                          action.type === 'diaria' ? "bg-gray-600/80 text-white border border-gray-500/30" :
                            action.type === 'boss' ? "bg-orange-600/80 text-white border border-orange-500/30 shadow-[0_0_8px_rgba(234,88,12,0.3)]" :
                              action.type === 'meta' ? "bg-purple-600/80 text-white border border-purple-500/30 shadow-[0_0_8px_rgba(147,51,234,0.3)]" :
                                action.type === 'problema' ? "bg-red-600/80 text-white border border-red-500/30" :
                                  "bg-blue-600/80 text-white border border-blue-500/30"
                        )}>
                          {action.type || 'Padrão'}
                        </span>
                        <h3 className="font-bold truncate text-sm transition-all text-white group-hover:text-ese-blue-light">
                          {action.title}
                        </h3>
                      </div>
                      <div className="flex flex-wrap items-center gap-2 text-[10px] font-semibold tracking-wider mt-1">
                        <span className="text-blue-400 flex items-center gap-0.5">⚡ {action.xp_reward || 0}</span>
                        <span className="text-yellow-400 flex items-center gap-0.5">🪙 {action.ese_reward || 0}</span>
                        <span className="text-gray-500 uppercase px-1.5 py-0.5 bg-white/5 rounded border border-white/5 truncate max-w-[80px]" title={action.pillar || 'Geral'}>{action.pillar || 'Geral'}</span>
                        {action.sacrifice_priority && (
                          <span className="text-purple-400 uppercase font-bold px-1.5 py-0.5 bg-purple-500/10 rounded border border-purple-500/20 truncate max-w-[80px]" title={action.sacrifice_priority}>
                            📊 {action.sacrifice_priority}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 flex-shrink-0">
                      <button
                        onClick={() => completeAction(action)}
                        className="p-2 bg-white/5 rounded-full text-gray-400 hover:text-green-400 hover:bg-green-500/10 transition-colors shadow-sm border border-transparent hover:border-green-500/20"
                        title="Concluir Ação"
                      >
                        <CheckCircle2 className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => deleteAction(action.id)}
                        className="p-2 bg-white/5 rounded-full text-gray-400 hover:text-red-400 hover:bg-red-500/10 transition-colors shadow-sm border border-transparent hover:border-red-500/20"
                        title="Deletar Ação"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </Card>
                ))}
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

              {/* AREA 3: HISTÓRICO (> 24h) */}
              {historico.length > 0 && (
                <div className="space-y-3">
                  <h3 className="text-xs font-bold text-gray-600 uppercase tracking-widest px-1 mb-2">Histórico (Trancado)</h3>
                  {historico.map((action) => (
                    <Card key={action.id} className="p-3 flex items-center gap-4 bg-black/40 border-white/5 opacity-50 grayscale transition-all">
                      <div className="flex-shrink-0 text-gray-600">
                        <CheckCircle2 className="w-6 h-6" />
                      </div>

                      <div
                        className="flex-1 min-w-0 cursor-pointer"
                        onClick={() => setSelectedAction(action)}
                      >
                        <h3 className="font-bold truncate text-sm text-gray-500 line-through">
                          {action.title}
                        </h3>
                      </div>

                      <div className="flex items-center gap-2 flex-shrink-0">
                        <div className="p-2 text-gray-600 cursor-not-allowed" title="Armazenado no Banco">
                          <MoreVertical className="w-5 h-5" />
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
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

      <BottomNav />
    </div>
  );
}
